/* Copyright 2019 Schibsted */

/***
 *
 * baseParser is based on documentParserBydelSagene and improved to let outside code set regex for finding and
 * replacing values.
 *
 */

module.exports = {
  /***
   * The parse method works on the raw text of a journal file. If the document can be parsed by
   * this parser, the method will return a data object. To determine if the parser was able to
   * parse the file, check the returnValue.parsed field (true|false).
   */

  parse: function(raw, configuration) {
    var helper = require('./../helpers/documentParserHelper');
    const ENTRY_SPLITTER = configuration.entrySplitter;
    var currentIndex = 0;
    var previousIndex = 0;

    function removeBefore(raw) {
      let doc = raw;
      for (let i = 0; i < configuration.removeBefore.length; i++) {
        doc = doc.replace(configuration.removeBefore[i], '');
      }
      // remove empty lines
      doc = doc.replace(/\n\n/g, '\n');
      return doc;
    }

    function removeWhitespace(text) {
      text = text ? text.replace(/\n/g, ' ').trim() : '';

      // remove reduntant spaces
      var doubleSpace = /  /g;
      while (text.match(doubleSpace)) {
        text = text.replace(doubleSpace, ' ');
      }
      return text.trim();
    }

    /***
     * Removes keywords from text as specified in the keywords array.
     * Only supply text already grabbed for a field. If used earlier,
     * the parser will not work!
     * @param text
     */
    function removeAfter(text) {
      for (var reg of configuration.removeAfter) {
        if (typeof text !== 'object') {
          while (text.match(reg)) {
            text = text.replace(reg, '');
            text = removeWhitespace(text);
          }
        }
      }
      return text;
    }

    function cleanSenderAndReceiver(itemsToClean) {
      for (let item of itemsToClean) {
        for (let cleanup of configuration.fields.senderOrReceiverCleanup) {
          item.sender = removeWhitespace(item.sender.replace(cleanup, ''));
          item.receiver = removeWhitespace(item.receiver.replace(cleanup, ''));
        }
      }
      return itemsToClean;
    }

    function cleanItems(itemsToClean) {
      var items = [];
      for (let item of itemsToClean) {
        var newItem = {};
        for (let prop in item) {
          newItem[prop] = removeAfter(item[prop]);
        }

        // remove case officer from sender/receiver if present
        // TODO: Should be configurable?
        newItem.sender = removeWhitespace(
          newItem.sender.replace(newItem.caseOfficer, ''),
        );
        newItem.receiver = removeWhitespace(
          newItem.receiver.replace(newItem.caseOfficer, ''),
        );

        items.push(newItem);
      }
      return cleanSenderAndReceiver(items);
    }

    try {
      var rawDocument = removeBefore(raw);

      var rawItems = [];

      while (currentIndex < rawDocument.length) {
        rawItems.push(nextRawEntry());
      }

      var items = [];
      rawItems.forEach(function(item) {
        items.push(createObject(item));
      });

      var itemsCleaned = cleanItems(items);

      // try to evaluate if the parsing was successful
      if (itemsCleaned.length > 0) {
        return {
          parsed: true,
          items: itemsCleaned,
        };
      }

      return { parsed: false };
    } catch (e) {
      return { parsed: false, error: e };
    }

    function createObject(rawItem) {
      return {
        caseNumber: getCaseNumber(rawItem),
        caseTitle: getCaseTitle(rawItem),
        documentTitle: getDocumentTitle(rawItem),
        documentDate: getDocumentdate(rawItem),
        recordedDate: getRecordedDate(rawItem),
        sender: getSender(rawItem),
        receiver: getReceiver(rawItem),
        caseOfficer: getCaseOfficer(rawItem),
        caseResponsible: getCaseResponsible(rawItem),
        documentType: getDocumentType(rawItem),
        classification: getClassification(rawItem),
        legalParagraph: getLegalParagraph(rawItem),
      };
    }

    function getClassification(rawItem) {
      return removeWhitespace(
        helper.getValueFromString(rawItem, configuration.fields.classification),
      );
    }

    function getLegalParagraph(rawItem) {
      return removeWhitespace(
        helper.getValueFromString(rawItem, configuration.fields.legalParagraph),
      );
    }

    function getDocumentType(rawItem) {
      return removeWhitespace(
        helper.getValueFromString(rawItem, configuration.fields.documentType),
      );
    }

    function getCaseOfficer(rawItem) {
      return removeWhitespace(
        helper.getValueFromString(rawItem, configuration.fields.caseOfficer),
      );
    }

    function getCaseResponsible(rawItem) {
      return removeWhitespace(
        helper.getValueFromString(
          rawItem,
          configuration.fields.caseResponsible,
        ),
      );
    }

    function getCaseNumber(rawItem) {
      return removeWhitespace(
        helper.getValueFromString(rawItem, configuration.fields.caseNumber),
      );
    }

    function getCaseTitle(rawItem) {
      return removeWhitespace(
        helper.getValueFromString(rawItem, configuration.fields.caseTitle),
      );
    }

    function getSender(rawItem) {
      // empty string when no sender
      if (getDocumentType(rawItem) === 'I') {
        return getSenderOrReceiver(rawItem);
      }
      return '';
    }

    function getReceiver(rawItem) {
      // empty string when no receiver
      if (getDocumentType(rawItem) === 'U') {
        return getSenderOrReceiver(rawItem);
      }
      return '';
    }

    function getSenderOrReceiver(rawItem) {
      return removeWhitespace(
        helper.getValueFromString(
          rawItem,
          configuration.fields.senderOrReceiver,
        ),
      );
    }

    function getDocumentTitle(rawItem) {
      return removeWhitespace(
        helper.getValueFromString(rawItem, configuration.fields.documentTitle),
      );
    }

    function getDocumentdate(rawItem) {
      return getDate(rawItem);
    }

    function getRecordedDate(rawItem) {
      return getDate(rawItem, 'r');
    }

    function getDate(rawItem, type) {
      var dates = rawItem.match(configuration.fields.dateRegex);
      // should be two
      if (dates && dates.length > 1) {
        var dateParts = [dates[0].split('.'), dates[1].split('.')];

        var date1 = new Date(
          dateParts[0][2] + '/' + dateParts[0][1] + '/' + dateParts[0][0],
        );
        var date2 = new Date(
          dateParts[1][2] + '/' + dateParts[1][1] + '/' + dateParts[1][0],
        );

        if (type === 'r') {
          // latest date
          return date1 >= date2 ? date1 : date2;
        }
        // oldest date
        return date1 <= date2 ? date1 : date2;
      }
      return null;
    }

    function nextRawEntry() {
      var entry = rawDocument.substring(currentIndex);
      var startIndex = entry.search(ENTRY_SPLITTER);

      if (startIndex === -1) {
        // something's wrong -- probably not the correct document type
        throw new Error('Could not find case number.');
      }

      var entryLength =
        1 + entry.substring(startIndex + 1).search(ENTRY_SPLITTER);
      if (entryLength === 0) {
        entryLength = entry.length;
      }
      previousIndex = currentIndex + startIndex;
      currentIndex = currentIndex + startIndex + entryLength - 1;
      return rawDocument.substring(previousIndex, currentIndex);
    }
  },
};
