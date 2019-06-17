/* Copyright 2019 Schibsted */

const connection = require('./connection');
let saveUrlToS3AsPromise = require('./awsHelper').saveUrlToS3AsPromise;
const dateFormatYYYMMDDhhmm = require('./dateFunctions').dateFormatYYYMMDDhhmm;

module.exports = {
  getSourceById,
  getSourcesByProjectId,
  journalEntryExists,
  persistJournalItem,
  getIdsForDuplicateEntries,
  getProjects,
  getProjectById,
  getConfigurationProperty,
  setConfigurationProperty,
  getJournalsNotMappedToNamesAsText,
  getJournalCountNotMappedToNames,
  setJournalAsMappedToName,
  persistMappingBetweenJournalAndName,
  getNameIfExists,
  getNamesToAnonymizeFromList,
  countQuery,
  createOrUpdateAnonymizedJournal,
  search,
  getNames,
  getNamesInWordlist,
  getGlobalConfigurationProperty,
  setGlobalConfigurationProperty,
  addJournalComment,
  handleJournalComment,
  getTasksToRun,
  updateTask,
  saveFileToDB,
  getNewFilesForSourceFromDB,
  getNewFilesFromDB,
  updateFileStatus,
  setDateImportedForFile,
  getLargestJournalId,
};

function getSourceById(sourceId) {
  return new Promise(function(resolve, reject) {
    connection.getConnectionAsPromise().then(function(db) {
      db.source.find(sourceId, function(err, source) {
        if (err) reject(err);
        if (!source || source.parser_name === null) {
          let errorMessage = 'ERROR: Source #' + sourceId + ' not found';
          reject(errorMessage);
        } else {
          resolve(source);
        }
      });
    });
  });
}

// getSourcesByProjectId
function getSourcesByProjectId(projectId) {
  return new Promise(function(resolve, reject) {
    connection.getConnectionAsPromise().then(function(db) {
      db.source.find({ project_id: projectId }, function(err, sources) {
        if (err) reject(err);
        if (!sources) {
          let errorMessage =
            'Error getting sources for project id ' + projectId;
          reject(errorMessage);
        } else {
          resolve(sources);
        }
      });
    });
  });
}

function getProjects() {
  return new Promise(function(resolve, reject) {
    connection.getConnectionAsPromise().then(function(db) {
      db.project.find(function(err, projects) {
        if (err) {
          reject(err);
        } else {
          resolve(projects);
        }
      });
    });
  });
}

function getProjectById(projectId) {
  return new Promise(function(resolve, reject) {
    connection.getConnectionAsPromise().then(function(db) {
      db.project.findOne({ id: projectId }, function(err, project) {
        if (err) {
          reject(err);
        } else {
          resolve(project);
        }
      });
    });
  });
}

function journalEntryExists(caseNumber, sourceId) {
  return new Promise(function(resolve, reject) {
    const db = connection.getConnection();

    db.journalEntryExists(caseNumber, sourceId, function(err, count) {
      if (err) reject(err);
      else resolve(count[0].count > 0);
    });
  });
}

function getIdsForDuplicateEntries(entries) {
  let idsToDelete = [];

  // make sure that the list is sorted on case numbers
  sortById(entries);
  sortByCaseNumber(entries);
  sortBySourceId(entries);

  let currentCaseNumber;
  let currentSourceId;
  entries.forEach(function(entry) {
    if (
      currentCaseNumber === entry.case_number &&
      currentSourceId === entry.source_id
    ) {
      // IMPORTANT: don't touch empty case numbers - those should not be considered the same case
      if (!isCaseNumberEmpty(entry.case_number)) idsToDelete.push(entry.id);
    } else {
      currentCaseNumber = entry.case_number;
      currentSourceId = entry.source_id;
    }
  });

  return idsToDelete;
}

/* Helper functions below */

let sortByCaseNumber = function(entries) {
  entries.sort(function(entry1, entry2) {
    let caseNumber1 = isCaseNumberEmpty(entry1.case_number)
      ? ''
      : entry1.case_number.toUpperCase();
    let caseNumber2 = isCaseNumberEmpty(entry2.case_number)
      ? ''
      : entry2.case_number.toUpperCase();

    if (caseNumber1 < caseNumber2) {
      return -1;
    }
    if (caseNumber1 > caseNumber2) {
      return 1;
    }
    return 0;
  });
};

let sortById = function(entries) {
  entries.sort(function(entry1, entry2) {
    if (entry1.id < entry2.id) {
      return -1;
    }
    if (entry1.id > entry2.id) {
      return 1;
    }
    return 0;
  });
};

let sortBySourceId = function(entries) {
  entries.sort(function(entry1, entry2) {
    if (entry1.source_id < entry2.source_id) {
      return -1;
    }
    if (entry1.source_id > entry2.source_id) {
      return 1;
    }
    return 0;
  });
};

function isCaseNumberEmpty(caseNumber) {
  return caseNumber === null || caseNumber.trim().length === 0;
}

function persistJournalItem(mappedItem, options) {
  return new Promise(function(resolve, reject) {
    options = options || {};
    journalEntryExists(mappedItem.case_number, mappedItem.source_id)
      .then(function(exists) {
        if (exists) {
          console.log(
            "Case '" + mappedItem.case_number + "' exists. Skipping.",
          );
          resolve();
        } else {
          // try to save the main document
          let documentUrl = options.persistDocumentsToS3
            ? mappedItem.original_document_link
            : '';
          saveUrlToS3AsPromise(
            documentUrl,
            options.name +
              '/' +
              mappedItem.case_number.replace(/\//g, '-') +
              '-Main.pdf',
          )
            .then(function(s3Url) {
              mappedItem.document_link = s3Url;
            })
            .then(function() {
              connection
                .getConnection()
                .journal.save(mappedItem, function(err, result) {
                  if (err) {
                    console.log('ERROR: ', err);
                  } else {
                    console.log(
                      "Case '" + mappedItem.case_number + "' persisted.",
                    );
                  }
                  resolve(result);
                });
            });
        }
      })
      .catch(function(error) {
        if (error.indexOf('Could not upload document')) resolve('');
        else reject(error);
      });
  });
}

function getJournalsNotMappedToNamesAsText(
  sourceId,
  limit,
  skipJournalsWithNamesCollected,
) {
  return new Promise(function(resolve) {
    skipJournalsWithNamesCollected = skipJournalsWithNamesCollected || false;

    getJournalsNotMappedToNames(
      sourceId,
      limit,
      skipJournalsWithNamesCollected,
    ).then(function(journals) {
      let asText = journals.map(journal => {
        let res = {
          id: journal.id,
          text: `${journal.case_title} ${journal.document_title} ${
            journal.sender
          } ${journal.receiver} ${journal.case_officer} ${
            journal.case_responsible
          }`,
        };
        // Remove whitespace and punctuations
        res.text = res.text
          .replace(/^\s+|\s+$|\s+(?=\s)/g, '')
          .replace(/[.,;:\-]/g, '')
          .replace(/\s\s/g, ' ');
        return res;
      });
      resolve(asText);
    });
  });
}

function getJournalsNotMappedToNames(
  sourceId,
  limit,
  skipJournalsWithNamesCollected,
) {
  return new Promise(function(resolve, reject) {
    skipJournalsWithNamesCollected = skipJournalsWithNamesCollected || false;

    const db = connection.getConnection();

    // NOTE: The query below has for performance reasons been to get the first {limit} number of
    // rows retrieved, skipping both ordering and offsetting. The caller MUST make sure to
    // add retrieved journal entries to journal_name_check between calls to avoid retrieving
    // the same rows again.

    let q =
      `select
    id,
    case_title,
    document_title,
    sender,
    receiver,
    case_officer,
    case_responsible
    from journal j
    where source_id = ${sourceId}` +
      (skipJournalsWithNamesCollected
        ? ' and not exists (select 1 from journal_name_check where journal_id = j.id) '
        : ' ') +
      ` limit ${limit}`;

    db.run(q, function(err, result) {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

function getJournalCountNotMappedToNames(
  sourceId,
  skipJournalsWithNamesCollected,
) {
  return new Promise(function(resolve, reject) {
    const db = connection.getConnection();
    let q =
      'select count(*) from journal j ' +
      'where source_id = ' +
      sourceId +
      (skipJournalsWithNamesCollected
        ? ' and not exists (select 1 from journal_name_check where journal_id = j.id)'
        : '');

    db.run(q, function(err, result) {
      if (err) reject(err);
      else resolve(parseInt(result[0].count));
    });
  });
}

function setJournalAsMappedToName(journalId) {
  return new Promise(function(resolve) {
    const db = connection.getConnection();
    db.journal_name_check.insert({ journal_id: journalId }, function() {
      // will silently fail here with existing mapping for the journal entry
      resolve();
    });
  });
}

function persistMappingBetweenJournalAndName(journalId, nameId, position) {
  return new Promise(function(resolve) {
    const db = connection.getConnection();
    db.journal_name.insert(
      { journal_id: journalId, name_id: nameId, position: position },
      function() {
        // will silently fail here with existing mapping for the journal and name entry
        resolve();
      },
    );
  });
}

function createOrUpdateAnonymizedJournal(journalAnonymous, remarks) {
  return new Promise(function(resolve) {
    const db = connection.getConnection();
    // delete if present
    delete journalAnonymous.search_column;
    let journalJson = JSON.stringify(journalAnonymous);
    // escape single quotes
    journalJson = journalJson.replace(/'/g, "''");
    let sql = `insert into journal_anonymous (id, data, remarks, registered_date) 
    values(${
      journalAnonymous.id
    }, '${journalJson}', '${remarks}', '${dateFormatYYYMMDDhhmm(new Date())}')
    on conflict(id) do update
    set data = '${journalJson}', remarks = '${remarks}', registered_date = '${dateFormatYYYMMDDhhmm(
      new Date(),
    )}'`;
    db.run(sql, function() {
      resolve();
    });
  });
}

function getNameIfExists(name) {
  return new Promise(function(resolve) {
    const db = connection.getConnection();
    db.name.where('name=$1', [name], function(err, result) {
      if (err) console.log('ERROR: ', err.message);
      resolve(result);
    });
  });
}

/***
 * Retrieves ALL names from the table name.
 */
function getNames() {
  return new Promise(function(resolve, reject) {
    connection.getConnectionAsPromise().then(function(db) {
      db.name.find(function(err, res) {
        resolve(res);
      });
    });
  });
}

/***
 * Retrieve list of names based on a word list. The result does not include
 * names that are also marked as common words. The query is case insensitive.
 * @param words
 * @returns {Promise}
 */
function getNamesToAnonymizeFromList(words) {
  return new Promise(function(resolve, reject) {
    let q =
      "select id, name from name where is_common_word = 'f' and lower(name) in (";
    for (let i = 0; i < words.length; i++) {
      q += "lower('" + words[i] + "')";
      q += i < words.length - 1 ? ',' : '';
    }
    q += ')';

    const db = connection.getConnection();

    db.run(q, function(err, result) {
      if (err) reject(err);
      resolve(result);
    });
  });
}

function whereQuery(tableName, where, params) {
  return new Promise(function(resolve, reject) {
    const db = connection.getConnection();
    db[tableName].where(where, params, function(err, result) {
      if (err) console.log('ERROR: ', err.message);
      if (err) reject(err);
      resolve(result);
    });
  });
}

function search(where, params) {
  return new Promise(function(resolve, reject) {
    whereQuery('journal', where, params).then(function(result) {
      const db = connection.getConnection();
      const ids = result === null ? [] : result.map(j => j.id).join(',');
      if (ids.length > 0) {
        db.run(
          `select data from journal_anonymous where id in (${ids})`,
          function(err, result) {
            if (err) console.log('ERROR: ', err.message);
            if (err) reject(err);
            resolve(result === null ? [] : result.map(j => j.data));
          },
        );
      } else {
        resolve([]);
      }
    });
  });
}

function countQuery(tableName, where, params) {
  return new Promise(function(resolve, reject) {
    const db = connection.getConnection();
    db[tableName].count(where, params, function(err, result) {
      if (err) console.log('ERROR: ', err.message);
      if (err) reject(err);
      resolve(result);
    });
  });
}

function getNamesInWordlist(words) {
  return new Promise(function(resolve, reject) {
    words = words.map(n => n.replace(/'/g, "''"));
    let wordsAsString = "lower('" + words.join("'),lower('") + "')";

    connection
      .getConnection()
      .run(
        `select id, name, is_common_word from name where lower(name) in (${wordsAsString})`,
        function(err, names) {
          let res = [];
          for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
            for (let nameIndex = 0; nameIndex < names.length; nameIndex++) {
              if (
                names[nameIndex].name.toLowerCase() ===
                words[wordIndex].toLowerCase()
              ) {
                res.push({
                  id: names[nameIndex].id,
                  name: names[nameIndex].name,
                  is_common_word: names[nameIndex].is_common_word,
                  position: wordIndex + 1,
                });
              }
            }
          }
          resolve(res);
        },
      );
  });
}

function getConfigurationProperty(sourceId, propertyName) {
  return new Promise(function(resolve) {
    const db = connection.getConnection();
    db.configuration.findOne(
      { source_id: sourceId, property: propertyName },
      function(err, result) {
        resolve(result === undefined ? '' : result);
      },
    );
  });
}

function setConfigurationProperty(sourceId, propertyName, newValue) {
  return new Promise(function(resolve) {
    getConfigurationProperty(sourceId, propertyName).then(function(
      configuration,
    ) {
      const db = connection.getConnection();

      if (configuration) {
        // update existing
        configuration.value = newValue;
        configuration.last_updated = new Date();
        db.configuration.save(configuration, function(err, res) {
          resolve(res);
        });
      } else {
        // create new
        configuration = {
          source_id: sourceId,
          property: propertyName,
          value: newValue,
          last_updated: new Date(),
        };
        db.configuration.insert(configuration, function(err, res) {
          resolve(res);
        });
      }
    });
  });
}

function getGlobalConfigurationProperty(propertyName) {
  return new Promise(function(resolve) {
    connection.getConnectionAsPromise().then(function(db) {
      db.configuration.findOne({ property: propertyName }, function(
        err,
        result,
      ) {
        resolve(result === undefined ? '' : result);
      });
    });
  });
}

function setGlobalConfigurationProperty(propertyName, newValue) {
  return new Promise(function(resolve) {
    getGlobalConfigurationProperty(propertyName).then(function(configuration) {
      connection.getConnectionAsPromise().then(function(db) {
        if (configuration) {
          // update existing
          configuration.value = newValue;
          configuration.last_updated = new Date();
          db.configuration.save(configuration, function(err, res) {
            resolve(res);
          });
        } else {
          // create new
          configuration = {
            property: propertyName,
            value: newValue,
            last_updated: new Date(),
          };
          db.configuration.insert(configuration, function(err, res) {
            resolve(res);
          });
        }
      });
    });
  });
}

function addJournalComment(journalId, comment) {
  return new Promise(function(resolve) {
    const db = connection.getConnection();
    db.journal_comment.insert(
      { journal_id: journalId, comment: comment },
      function(err, result) {
        resolve();
      },
    );
  });
}

function handleJournalComment(commentId, handledComment) {
  return new Promise(function(resolve) {
    const db = connection.getConnection();
    db.journal_comment.insert(
      { id: commentId, handled_comment: handledComment },
      function() {
        resolve();
      },
    );
  });
}

// NOT IN USE (YET)
function getTasksToRun() {
  return new Promise(function(resolve) {
    const db = connection.getConnection();

    // get only tasks that has waited as long as specified
    const criteria = {
      is_active: true,
      status: 'Idle',
      'last_run >=': `current_timestamp - (interval||' minutes')::interval';`,
    };

    // Run no more than 3 tasks at the same time
    const options = {
      order: [
        {
          field: 'last_run',
          direction: 'ASC',
        },
      ],
      limit: 3,
    };

    db.task.find(criteria, options, function(err, res) {
      resolve(res);
    });
  });
}

// NOT IN USE (YET)
function updateTask(task) {
  return new Promise(function(resolve) {
    const db = connection.getConnection();
    db.task.save(task, function(err, res) {
      resolve(res);
    });
  });
}

function saveFileToDB(file) {
  return new Promise(function(resolve) {
    connection.getConnectionAsPromise().then(function(db) {
      db.file.insert(file, function(err, res) {
        resolve(res);
      });
    });
  });
}

function updateFileStatus(fileId, newStatus) {
  return new Promise(function(resolve) {
    connection.getConnectionAsPromise().then(function(db) {
      db.file.update({ id: fileId, status: newStatus }, function(err, res) {
        resolve(res);
      });
    });
  });
}

function setDateImportedForFile(fileId, date) {
  return new Promise(function(resolve) {
    connection.getConnectionAsPromise().then(function(db) {
      db.file.update({ id: fileId, date_imported: date }, function(err, res) {
        resolve(res);
      });
    });
  });
}

function getNewFilesForSourceFromDB(sourceId) {
  return new Promise(function(resolve) {
    const criteria = {
      status: 'New',
      source_id: sourceId,
    };

    // grab no more than 100 files at a time
    const options = {
      order: [
        {
          field: 'registered_date',
          direction: 'ASC',
        },
      ],
      limit: 100,
    };

    db.file.find(criteria, options, function(err, res) {
      resolve(res);
    });
  });
}

function getNewFilesFromDB() {
  return new Promise(function(resolve) {
    const criteria = {
      status: 'New',
    };

    // grab no more than 100 files at a time
    const options = {
      order: [
        {
          field: 'registered_date',
          direction: 'ASC',
        },
      ],
      limit: 10,
    };

    connection.getConnectionAsPromise().then(function(db) {
      db.file.find(criteria, options, function(err, res) {
        resolve(res);
      });
    });
  });
}

function getLargestJournalId() {
  return new Promise(function(resolve) {
    const options = {
      order: [
        {
          field: 'id',
          direction: 'DESC',
        },
      ],
      limit: 1,
    };

    connection.getConnectionAsPromise().then(function(db) {
      db.journal.find({}, options, function(err, res) {
        resolve(res[0].id);
      });
    });
  });
}
