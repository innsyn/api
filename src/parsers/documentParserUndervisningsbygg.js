/* Copyright 2019 Schibsted */

/***
 *
 * Can parse: Undervisningsbygg (Oslo)
 *
 */
module.exports = {
  /***
   * The parse method works on the raw text of a journal file. If the document can be parsed by
   * this parser, the method will return a data object. To determine if the parser was able to
   * parse the file, check the returnValue.parsed field (true|false).
   */
  parse: function(raw) {
    var helper = require('./../helpers/documentParserHelper');

    const CASENUMBER_REGEX = '[\\d]{2}\\/[\\d]{1,4}-[\\d]{1,4}[\\s]';
    var currentIndex = 0;
    var previousIndex = 0;

    function removeFluff(raw) {
      return raw.replace(
        /.*OFFENTLIG.POSTJOURNAL\nUNDERVISNINGSBYGG\nSide.*\nInn-.*\n/g,
        '',
      );
    }

    function getRecordedDateForFile(raw) {
      var recordedDateForFileMatch = raw.match(/- (\d{2})\.(\d{2})\.(\d{4})/);
      if (recordedDateForFileMatch === null) return null;

      var year = recordedDateForFileMatch[3];
      var month = recordedDateForFileMatch[2];
      var day = recordedDateForFileMatch[1];
      return new Date(year, month - 1, day);
    }

    try {
      var recordedDateForFile = getRecordedDateForFile(raw);

      var rawDocument = removeFluff(raw);

      var rawItems = [];

      while (currentIndex < rawDocument.length) {
        rawItems.push(nextRawEntry());
      }

      var items = [];
      rawItems.forEach(function(item) {
        items.push(createObject(item));
      });

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

    function createObject(rawItem) {
      return {
        caseNumber: getCaseNumber(rawItem),
        caseTitle: getCaseTitle(rawItem),
        documentTitle: getDocumentTitle(rawItem),
        documentDate: getDocumentdate(rawItem),
        recordedDate: recordedDateForFile,
        sender: getSender(rawItem),
        receiver: getReceiver(rawItem),
        caseOfficer: getCaseOfficer(rawItem),
        caseResponsible: null,
        documentType: getDocumentType(rawItem),
        legalParagraph: getLegalParagraph(rawItem),
      };
    }

    function getDocumentType(rawItem) {
      var type = rawItem.match('\\n([U|I])\\n');
      if (type !== null) return type[1];
      return '';
    }

    function getCaseOfficer(rawItem) {
      // most likely match. example: PRO-UTB1-TOBE
      var regexList = [
        /\n(.*-.*-.*)\n\nSaksbeh./, // above Saksbeh
        /\n(.*-.*-.*)\n\n/, // above some other text
        /\n(.*-.*-.*)\n/, // fallback for some cases
      ];
      return helper.getValueFromString(rawItem, regexList);
    }

    function getLegalParagraph(rawItem) {
      var paragraph = '';

      if (rawItem.indexOf('§') !== -1) {
        // first try
        var data = rawItem.match('.*-.*-.*([^]+)\\n[IU]\\n');
        if (data !== null) {
          paragraph = data[1];
        } else {
          // second try
          data = rawItem.match('..*-.*-.*([^]+)\\n\\d{2}\\.\\d{2}');
          if (data !== null) {
            paragraph = data[1];
          }
        }
      }

      paragraph = paragraph.replace(/\n/g, ' ').trim();
      return paragraph;
    }

    function getCaseNumber(rawItem) {
      var caseNumber = rawItem.match(CASENUMBER_REGEX);
      return caseNumber ? caseNumber[0].trim() : '';
    }

    function getCaseTitle(rawItem) {
      var regexList = [
        /Sakstittel\n([^]+)\nDokumenttittel/,
        /Saksbeh.\n\n([^]+)\nDokumenttittel/,
        /Sakstittel\n([^]+)\n\nArkivkode/,
        /Sakstittel\n([^]+?)\n\n/,
        /(.*)\n/, // first line, fallback extreme
      ];
      return helper
        .getValueFromString(rawItem, regexList)
        .replace(/\n/g, ' ')
        .trim();
    }

    function getSender(rawItem) {
      // empty string when no sender
      if (rawItem.indexOf('Avsender:') === -1) return '';

      return getReceiverOrSender(rawItem);
    }

    function getReceiver(rawItem) {
      // empty string when no receiver
      if (rawItem.indexOf('Mottaker') === -1) return '';

      return getReceiverOrSender(rawItem);
    }

    function getReceiverOrSender(rawItem) {
      var data = '';
      var receiverOrSender = rawItem.match(
        '\\d{2}\\.\\d{2}\\.\\d{4}\\n([^]+)\\d{2}\\/|\\d{2}\\.\\d{2}\\.\\d{4}\\n([^]+)Sakstittel',
      );

      if (receiverOrSender !== null) {
        data =
          receiverOrSender[1] !== undefined
            ? receiverOrSender[1]
            : receiverOrSender[2];
      }
      return data.trim();
    }

    function getDocumentTitle(rawItem) {
      var regexList = [/Dokumenttittel([^]+?)\n\n/, /Dokumenttittel([^]+?)\n/];

      return helper
        .getValueFromString(rawItem, regexList)
        .replace(/\n/g, ' ')
        .trim();
    }

    function getDocumentdate(rawItem) {
      var date = rawItem.match('(\\d{2})\\.(\\d{2})\\.(\\d{4})');

      if (date !== null) {
        var year = date[3];
        var month = date[2];
        var day = date[1];
        return new Date(year, month - 1, day);
      }
      return null;
    }

    function nextRawEntry() {
      var entry = rawDocument.substring(currentIndex);
      var startIndex = entry.search(CASENUMBER_REGEX);

      if (startIndex === -1) {
        // something's wrong -- probably not the correct document type
        throw new Error('Could not find case number.');
      }

      var entryLength =
        1 + entry.substring(startIndex + 1).search(CASENUMBER_REGEX);
      if (entryLength === 0) {
        entryLength = entry.length;
      }
      previousIndex = currentIndex + startIndex;
      currentIndex = currentIndex + startIndex + entryLength - 1;
      return rawDocument.substring(previousIndex, currentIndex);
    }
  },
};
