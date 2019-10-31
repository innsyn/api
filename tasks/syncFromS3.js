/* Copyright 2019 Schibsted */

// Sync new PDF files from S3 as journal entries to database

const awsHelper = require('./../src/helpers/awsHelper');
const parserHelper = require('./../src/helpers/parserHelper');
const updateFileStatus = require('./../src/helpers/queries').updateFileStatus;
const getSourceById = require('./../src/helpers/queries').getSourceById;
const saveJournal = require('./../src/helpers/journalSaver').save;
const setDateImportedForFile = require('./../src/helpers/queries')
  .setDateImportedForFile;
const { EXTRACTION_ERROR_STATUS } = require('../apps/common/constants');

const {
  knex,
  objection: { transaction, raw },
} = require('../apps/common/database');

const File = require('../apps/common/models/file');

const fs = require('fs');

const logRed = require('./../src/helpers/logWithColor').logRed;
const logYellow = require('./../src/helpers/logWithColor').logYellow;

const { parseFile } = require('../apps/common/helpers/pdf');

sync()
  .then(function() {
    console.log('done');
    process.exit(0);
  })
  .catch(function(err) {
    console.error('Error', err);
    process.exit(1);
  });

async function sync() {
  logYellow('Get list of files not imported from DB');

  const files = await transaction(knex, async trx => {
    return File.query()
      .update({
        retries_remaining: raw('retries_remaining - 1'),
      })
      .where(
        'id',
        'in',
        File.query()
          .select('id')
          .where('status', '=', 'New')
          .where('retries_remaining', '>', 0)
          .orderByRaw('registered_date FOR UPDATE SKIP LOCKED')
          .limit(10),
      )
      .returning('*');
  });

  logYellow('Number of files: ' + files.length);

  for (let i = 0; i < files.length; i++) {
    let currentFile = files[i];
    const tempFilename = 'temp.pdf';
    let source = await getSource(currentFile);

    if (source === null) {
      await updateFileStatus(currentFile.id, 'NoParserAssigned');
      continue;
    }

    logYellow('Getting file ' + currentFile.s3_url);
    const pdfContent = await awsHelper.downloadFile(currentFile.s3_key);
    await saveFileToDisk(pdfContent, tempFilename);

    logYellow('Extracting text with pdftotext command');
    const textContent = await parseFile(tempFilename);

    if (textContent === EXTRACTION_ERROR_STATUS) {
      await updateFileStatus(currentFile.id, EXTRACTION_ERROR_STATUS);
      continue;
    }

    logYellow('Looking up parser to use');
    const parser = await getParserFromFileRow(currentFile);

    logYellow('Parsing content...');
    const parsedContent = parser.parse(textContent);

    if (parsedContent.parsed === true && parsedContent.items.length <= 10000) {
      logYellow('Number of entries in file: ' + parsedContent.items.length);

      let mappedItems = parserHelper.mapItems(parsedContent.items);

      for (let item of mappedItems) {
        item.source_id = source.id;
        item.project_id = source.project_id;
        item.file_id = currentFile.id;
      }

      await saveJournal(mappedItems);

      logYellow('Updating file status to Imported');
      await updateFileStatus(currentFile.id, 'Imported');
      await setDateImportedForFile(
        currentFile.id,
        parserHelper.ymd(new Date()),
      );
    } else {
      logRed('Could not parse document correctly: ' + currentFile.s3_url);
      await updateFileStatus(currentFile.id, 'CouldNotParse');
    }
  }

  logYellow('Done');
}

async function getSource(file) {
  try {
    return await getSourceById(file.source_id);
  } catch (e) {
    // Couldn't get source either because it doesn't exist or a parser name has not been assigned
    return null;
  }
}

function saveFileToDisk(data, filename) {
  return new Promise(function(resolve, reject) {
    fs.writeFile(filename, data, function(err, result) {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

async function getParserFromFileRow(fileRow) {
  let parserName;

  // get parser if assigned to file directly
  if (fileRow.parser_name) {
    parserName = fileRow.parser_name;
  } else {
    // get parser for source
    const source = await getSourceById(fileRow.source_id);
    parserName = source.parser_name;
  }

  return parserHelper.getParserByName(parserName);
}
