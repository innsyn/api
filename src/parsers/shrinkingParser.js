/* Copyright 2019 Schibsted */

/***
 *
 * shrinkingParser accepts a configuration to parse a text file. The name suggests that the parser will
 * remove text extracted from the raw items currently being parsed. The rationale for this is to simplify
 * regex's. Use configuration.debug: "VERBOSE" during development to see how the text shrinks.
 *
 */

const helper = require('./../helpers/documentParserHelper');

module.exports = {
  /***
   * The parse method works on raw text. If the text can be parsed, the method will return a data object.
   * To determine if the parser was able to parse the file, check the returnValue.parsed field (true|false).
   *
   * Note that the configuration contains all instructions for the parser.
   */

  parse: function(raw, configuration) {
    let debug = function(message, rawDocument, rawItem) {
      console.log('MESSAGE: ' + message);
      if (configuration.debug === 'VERBOSE') {
        console.log('-------------------------');
        if (rawDocument) {
          console.log('{BEGIN DOCUMENT}');
          console.log(rawDocument);
          console.log('{END DOCUMENT}');
        }
        if (rawItem) {
          console.log('{BEGIN ITEM}');
          console.log(rawItem);
          console.log('{END ITEM}');
        }
        console.log('-------------------------');
      }
    };

    let rawDocument = '';

    try {
      debug('About to parse document', raw);

      rawDocument = removeBefore(raw, configuration);

      debug('Removed before', rawDocument);

      let rawItems = [];
      while (rawDocument.length > 0) {
        [rawDocument, rawItem] = nextRawEntry(
          rawDocument,
          configuration.entrySplitter,
        );
        rawItems.push(rawItem);
        debug('Raw element', rawDocument, rawItem);
      }

      rawItems[rawItems.length - 1] = removeAfter(
        rawItems[rawItems.length - 1],
        configuration.removeAfter,
      );

      debug('Removed after', rawDocument, rawItem);

      let items = [];
      rawItems.forEach(function(item) {
        items.push(createObject(item, configuration));
      });

      debug('Created object', items);

      // try to evaluate if the parsing was successful
      if (items.length > 0) {
        return {
          parsed: true,
          items: items,
        };
      }

      return { parsed: false };
    } catch (e) {
      return { parsed: false, error: e };
    }
  },
};

function nextRawEntry(rawDocument, entrySplitter) {
  if (entrySplitter === undefined || entrySplitter.length === 0) {
    throw new Error(
      'The entrySplitter configuration property must be specified',
    );
  }
  const startIndex = rawDocument.search(entrySplitter);

  if (startIndex === -1) {
    // something's wrong -- probably not the correct document type
    throw new Error('Could not find case number.');
  }

  let entryLength =
    1 + rawDocument.substring(startIndex + 1).search(entrySplitter);
  if (entryLength === 0) {
    entryLength = rawDocument.length;
  }

  let substringLength = startIndex + entryLength;

  return [
    rawDocument.substring(substringLength),
    rawDocument.substring(startIndex, entryLength),
  ];
}

function createObject(rawItem, configuration) {
  let object = {};

  let fields = Object.getOwnPropertyNames(configuration.fields);

  // sort
  fields.sort((item1, item2) => {
    let order1 = item1.order || 0;
    let order2 = item2.order || 0;
    return order1 > order2 ? -1 : 1;
  });

  fields.forEach(fieldName => {
    [rawItem, parsedItem] = handle(rawItem, configuration, fieldName);
    object[fieldName] = parsedItem;
  });

  return object;
}

function handle(rawItem, configuration, field) {
  let regexList = configuration.fields[field].regexList;
  let functionList = configuration.fields[field].functionList;

  if (regexList === undefined && functionList === undefined) {
    throw new Error(
      "'" +
        field +
        "' have no regexList or functionList defined, but one of them is needed",
    );
  }

  let parsedItem = rawItem.slice(0);

  if (regexList !== undefined) {
    parsedItem = helper.getValueFromString(rawItem, regexList);
  }

  if (functionList !== undefined) {
    parsedItem = runFunctionsOnItem(parsedItem, functionList);
  }

  // shrink rawItem
  rawItem = rawItem.replace(parsedItem, '');
  //rawItem =  removeWhitespace(rawItem);

  return [rawItem, parsedItem];
}

function runFunctionsOnItem(value, functionList) {
  functionList.forEach(func => {
    value = func(value);
  });

  return value;
}

function removeBefore(raw, configuration) {
  let doc = raw;

  if (configuration.removeBefore === undefined) {
    return doc;
  }

  for (let i = 0; i < configuration.removeBefore.length; i++) {
    doc = doc.replace(configuration.removeBefore[i], '');
  }
  // remove empty lines
  doc = doc.replace(/\n\n/g, '\n');
  return doc;
}

/***
 * Removes keywords from text as specified in the keywords array.
 * Only supply text already grabbed for a field. If used earlier,
 * the parser will not work!
 * @param text
 */
function removeAfter(text, removeList) {
  if (removeList === undefined) {
    return text;
  }

  for (let reg of removeList) {
    if (typeof text !== 'object') {
      while (text.match(reg)) {
        text = text.replace(reg, '');
      }
    }
  }
  return text;
}

function removeWhitespace(text) {
  text = text ? text.replace(/\n/g, ' ').trim() : '';

  // remove reduntant spaces
  let doubleSpace = /  /g;
  while (text.match(doubleSpace)) {
    text = text.replace(doubleSpace, ' ');
  }
  return text.trim();
}

function cleanItems(itemsToClean, configuration) {
  let items = [];
  for (let item of itemsToClean) {
    let newItem = {};
    for (let prop in item) {
      newItem[prop] = removeAfter(item[prop]);
    }

    items.push(newItem);
  }
  return items;
}
