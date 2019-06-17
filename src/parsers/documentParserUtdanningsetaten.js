/* Copyright 2019 Schibsted */

/***
 *
 * Can parse: Utdanningsetaten (Oslo)
 *
 */
module.exports = { parse };

const COULDNT_GET_TEXT_AUTOMATICALLY = '';

/***
 * The parse method works on the raw text of a journal file. If the document can be parsed by
 * this parser, the method will return a data object. To determine if the parser was able to
 * parse the file, check the returnValue.parsed field (true|false).
 */
function parse(raw) {
  try {
    var items = [];

    var pages = getPages(raw);
    for (var pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      var page = pages[pageIndex];

      // grab each property in sequence
      // -- first case number owns the first document date
      // second case number owns the second document date and so on

      var fields = getFieldsForPage(page);
      var blocks = getBlocksForPage(page);
      var fieldsFromBlock = getFieldsFromBlock(blocks, fields);
      fields.caseTitles = fieldsFromBlock.caseTitles;
      fields.documentTitles = fieldsFromBlock.documentTitles;
      fields.sendersAndReceivers = fieldsFromBlock.sendersAndReceivers;

      createItems(fields).forEach(function(item) {
        items.push(item);
      });
    }

    var parsed = false;
    if (items.length > 0) parsed = true;
    return {
      parsed: parsed,
      items: items,
    };
  } catch (e) {
    return { parsed: false, error: e };
  }
}

function getFieldsFromBlock(blocks) {
  var fields = {};
  var entries = [];

  for (var block of blocks) {
    entries.push(block.split(/\n/g));
  }

  fields.sendersAndReceivers = [];
  fields.caseTitles = [];
  fields.documentTitles = [];

  // trying to handle special case for pages with 4 blocks
  if (blocks.length === 4) {
    // 2.1. 2 lines, 3 lines, 1 line, 3 lines (
    if (
      entries[0].length === 2 &&
      entries[1].length === 3 &&
      entries[2].length === 1 &&
      entries[3].length === 3
    ) {
      // special case: first entry
      fields.sendersAndReceivers.push(entries[2][0]);
      fields.caseTitles.push(entries[0][0]);
      fields.documentTitles.push(entries[0][1]);

      for (var i = 1; i < 3; i++) {
        if (entries[i].length !== 3) continue;

        fields.sendersAndReceivers.push(entries[i][0]);
        fields.caseTitles.push(entries[i][1]);
        fields.documentTitles.push(entries[i][2]);
      }
    }
  } else {
    for (var i = 0; i < blocks.length; i++) {
      var entriesInBlock = tryHandleBlockWith3Lines(blocks[i]);
      if (entriesInBlock === null) {
        entriesInBlock = tryHandleBlockWith4Lines(blocks[i]);
      }
      if (entriesInBlock === null) {
        entriesInBlock = tryHandleBlockWith5OrMoreLines(blocks[i]);
      }
      if (entriesInBlock !== null) {
        fields.sendersAndReceivers.push(entriesInBlock.senderOrReceiver);
        fields.caseTitles.push(entriesInBlock.caseTitle);
        fields.documentTitles.push(entriesInBlock.documentTitle);
      }
    }
  }
  return fields;
}

function createItems(fields) {
  var items = [];
  for (var i = 0; i < fields.caseNumbers.length; i++) {
    items.push({
      caseNumber: fields.caseNumbers[i],
      caseTitle: fields.caseTitles[i] || COULDNT_GET_TEXT_AUTOMATICALLY,
      documentTitle: fields.documentTitles[i] || COULDNT_GET_TEXT_AUTOMATICALLY,
      documentDate: getDate(fields.documentDates[i]),
      recordedDate: getDate(fields.recordedDates[i]),
      sender:
        fields.senderOrReceiver[i] == 'Avsender'
          ? fields.sendersAndReceivers[i] || COULDNT_GET_TEXT_AUTOMATICALLY
          : '',
      receiver:
        fields.senderOrReceiver[i] == 'Mottaker'
          ? fields.sendersAndReceivers[i] || COULDNT_GET_TEXT_AUTOMATICALLY
          : '',
      caseOfficer: fields.caseOfficers[i],
      caseResponsible: fields.caseResponsibles[i],
      documentType: fields.documentTypes[i],
      legalParagraph: fields.paragraphs[i],
      classification: fields.accessCodes[i],
      archivePart: fields.archiveParts[i],
      complete: fields.caseTitles[i] == undefined ? false : true,
    });
  }
  return items;
}

/***
 * Fields that are "easy" to find -- label followed by value on the same line.
 * @returns {{caseNumbers, documentDates, recordedDates, paragraphs, caseOfficers, caseResponsibles, accessCodes, documentTypes, archiveParts, senderOrReceiver}}
 */
function getFieldsForPage(page) {
  return {
    caseNumbers: getArrayOfMatches(page, /\n(\d{2}\/\d{5}-\d{1,4})\n/g),
    documentDates: getArrayOfMatches(page, /\nDok.dato: (.*)/g),
    recordedDates: getArrayOfMatches(page, /\nJour.dato: (.*)/g),
    paragraphs: getArrayOfMatches(page, /\nPar\.:(.*)/g),
    caseOfficers: getArrayOfMatches(page, /\nSaksbeh:(.*)/g),
    caseResponsibles: getArrayOfMatches(page, /\nSaksansv:(.*)/g),
    accessCodes: getArrayOfMatches(page, /\nTilg. kode: (.*)/g),
    documentTypes: getArrayOfMatches(page, /(\nI\n|\nU\n)/g),
    archiveParts: getArrayOfMatches(page, /\nArkivdel:(.*)/g),
    senderOrReceiver: getArrayOfMatches(page, /\n(Avsender|Mottaker):/g),
  };
}

function getPages(raw) {
  var rawDocument = removeFluff(raw);
  return splitOnPage(rawDocument);
}

function getBlocksForPage(page) {
  // remove all lines with keyword and : keyword:
  var theRest = '';
  var lines = page.split('\n');
  for (var i = 0; i < lines.length; i++) {
    if (
      containsKeyword(lines[i]) ||
      lines[i].match(/\d{2}\/\d{5}-\d{1,4}/) ||
      lines[i].match(/I$|U$/)
    )
      continue;
    theRest += lines[i] + '\n';
  }

  while (theRest.match(/\n\n\n/) !== null) {
    theRest = theRest.replace(/\n\n\n/g, '\n\n');
  }

  theRest = theRest.trim();

  var blocks = theRest.split(/\n\n/g);
  return blocks;
}

function removeFluff(raw) {
  // first the front page then other repeating stuff not needed
  var ret = raw.replace(
    /Oslo kommune - Utdanningsetaten[^]+?Utdanningsetaten\nOffentlig journal/,
    '',
  );
  ret = ret.replace(/.*Oslo kommune - Utdanningsetaten/g, '');
  ret = ret.replace(/\n.*Offentlig journal/g, '');
  ret = ret.replace(/\n.*Periode:.*\n/g, '');
  ret = ret.replace(/\n\d{8}\n/g, '');
  return ret;
}

function containsKeyword(input) {
  var keywords = [
    'Dok.dato',
    'Jour.dato',
    'Arkivdel',
    'Tilg. kode',
    'Par.',
    'Mottaker',
    'Avsender',
    'Sak',
    'Dok',
    'Saksbeh',
    'Saksansv',
  ];

  for (keyword of keywords) {
    if (input.indexOf(keyword + ':') !== -1) {
      return true;
    }
  }
  return false;
}

function splitOnPage(rawDocument) {
  return rawDocument.split(/\nSide.*\n/);
}

function getArrayOfMatches(text, regex) {
  var results = [];
  var result;

  while ((result = regex.exec(text)) !== null) {
    results.push(result[1].trim());
  }

  return results;
}

/***
 * A block with 3 lines is treated like Sender/Receiver, Case Title, Document Title.
 * @param block
 * @returns {*}
 */
function tryHandleBlockWith3Lines(block) {
  var entries = block.split(/\n/g);

  if (entries.length === 3) {
    return {
      senderOrReceiver: entries[0],
      caseTitle: entries[1],
      documentTitle: entries[2],
    };
  }
  return null;
}

/***
 * A block with 4 lines is either two lines of receivers or 2 lines with the document title.
 * @param block
 */
function tryHandleBlockWith4Lines(block) {
  var entries = block.split(/\n/g);

  if (entries.length === 4) {
    var retVal = {};
    // guess if the final line is part of the document title
    if (entries[3][0] === entries[3][0].toLowerCase()) {
      retVal.senderOrReceiver = entries[0];
      retVal.caseTitle = entries[1];
      retVal.documentTitle = entries[2] + ' ' + entries[3];
    } else {
      retVal.senderOrReceiver = entries[0] + ', ' + entries[1];
      retVal.caseTitle = entries[2];
      retVal.documentTitle = entries[3];
    }

    return retVal;
  }
  return null;
}

/***
 * A block with 5 or more lines will have several receivers. Might have 2 lines for the document title as well.
 * @param block
 */
function tryHandleBlockWith5OrMoreLines(block) {
  var entries = block.split(/\n/g);

  if (entries.length > 4) {
    var retVal = {};

    // guess if the final line is part of the document title
    var lastIndex = entries.length - 1;

    if (entries[lastIndex][0] === entries[lastIndex][0].toLowerCase()) {
      for (var i = 0; i < lastIndex - 3; i++) {
        retVal.senderOrReceiver = retVal.senderOrReceiver + entries[i];
      }
      retVal.caseTitle = entries[lastIndex - 2];
      retVal.documentTitle = entries[lastIndex - 1] + ' ' + entries[lastIndex];
    } else {
      for (var i = 0; i < lastIndex - 2; i++) {
        retVal.senderOrReceiver = retVal.senderOrReceiver + entries[i];
      }
      retVal.caseTitle = entries[lastIndex - 1];
      retVal.documentTitle = entries[lastIndex];
    }

    return retVal;
  }
  return null;
}

function getDate(dateString) {
  if (dateString !== null) {
    var year = dateString.substring(4);
    var month = dateString.substr(2, 2);
    var day = dateString.substring(0, 2);
    return new Date(year, parseInt(month - 1), day);
  }
  return null;
}
