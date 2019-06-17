/* Copyright 2019 Schibsted */

/***
 *
 * Can parse:
 * Renovasjonsetaten (Oslo)
 * Kommunerevisjonen (Oslo)
 */
module.exports = {
  /***
   * The parse method works on the raw text of a journal file. If the document can be parsed by
   * this parser, the method will return a data object. To determine if the parser was able to
   * parse the file, check the returnValue.parsed field (true|false).
   */
  parse: function(raw) {
    var helper = require('./../helpers/documentParserHelper');

    const CASENUMBER_REGEX = 'Dok.:.*\\n\\n.*(\\d{2}\\/\\d{5}-\\d{1,3})';
    var currentIndex = 0;
    var previousIndex = 0;

    try {
      var rawItems = [];

      while (currentIndex < raw.length) {
        rawItems.push(nextRawEntry());
      }

      var items = [];
      rawItems.forEach(function(item) {
        items.push(createObject(item));
      });

      // try to evaluate if the parsing was successful
      if (
        items.length > 0 &&
        items[0].caseNumber.length > 0 &&
        items[0].caseTitle.length > 0 &&
        items[0].documentTitle.length > 0
      ) {
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
      return '';
    }

    function getLegalParagraph(rawItem) {
      var paragraph = rawItem.match('Tilg. kode:.*\n\n(.*)');
      var maybe = paragraph ? paragraph[1].trim() : '';
      if (maybe.indexOf('§') !== -1) {
        return maybe;
      }
      return '';
    }

    function getDocumentType(rawItem) {
      var type = rawItem.match('Tilg. kode:.*\n\n(.*)');
      var maybe = type ? type[1].trim() : '';
      if (maybe.indexOf('§') === -1) {
        return maybe;
      }
      return '';
    }

    function getCaseOfficer(rawItem) {
      var officer = rawItem.match('Saksbehandler:.*\\n\\n(.*)');
      return officer ? officer[1] : '';
    }

    function getCaseResponsible(rawItem) {
      // empty string when no sender
      if (rawItem.indexOf('Saksansvarlig:') === -1) return '';

      var responsible = rawItem.match('Saksansvarlig:.*\\n\\n(.*)');
      return responsible ? responsible[1] : '';
    }

    function getCaseNumber(rawItem) {
      var caseNumber = rawItem.match(CASENUMBER_REGEX);
      return caseNumber ? caseNumber[1] : ';';
    }

    function getCaseTitle(rawItem) {
      var regexList = ['Sak:.*\n\n(.*)'];

      return helper.getValueFromString(rawItem, regexList);
    }

    function getSender(rawItem) {
      // empty string when no sender
      if (rawItem.indexOf('Avsender:') === -1) return '';

      var regexList = ['Avsender:.*\n\n(.*)'];

      return helper.getValueFromString(rawItem, regexList);
    }

    function getReceiver(rawItem) {
      // empty string when no receiver
      if (rawItem.indexOf('Mottaker:') === -1) return '';

      var regexList = ['Mottaker:.*\n\n(.*)'];

      return helper.getValueFromString(rawItem, regexList);
    }

    function getDocumentTitle(rawItem) {
      var regexList = ['Dok.:.*\\n\\n(.*)'];

      var title = helper.getValueFromString(rawItem, regexList);

      if (title.length > 0) {
        // check if the next line is part of the title and append
        var startIndex = rawItem.indexOf(title) + title.length;
        var endIndex =
          startIndex + rawItem.substring(startIndex + 1).indexOf('\n') + 1;
        var nextLine = rawItem.substring(startIndex, endIndex);
        title = title.trim();
        if (!containsKeyword(nextLine)) {
          title = title + ' ' + nextLine.trim();
        }
      }
      return title.trim();
    }

    function containsKeyword(input) {
      var keywords = [
        'Fra',
        'Til',
        'Sak',
        'Dok.dato',
        'Grad',
        'Jour.dato',
        'Dok',
        'Par.',
        'Arkivdel',
        'Saksbeh',
        'Saksansv',
        'Sek.kode',
        'Arkivkode',
      ];

      for (keyword of keywords) {
        if (input.indexOf(keyword + ':') !== -1) {
          return true;
        }
      }
      return false;
    }

    function getDocumentdate(rawItem) {
      var dateString = rawItem.match('Dok. dato:.*\\n\\n(.*)')[1];
      var dateParts = dateString.split('.');
      var year = dateParts[2];
      var month = dateParts[1];
      var day = dateParts[0];
      return new Date(year, month - 1, day);
    }

    function getRecordedDate(rawItem) {
      var dateString = rawItem.match('Journaldato:.*\\n\\n(.*)')[1];
      var dateParts = dateString.split('.');
      var year = dateParts[2];
      var month = dateParts[1];
      var day = dateParts[0];
      return new Date(year, month - 1, day);
    }

    function nextRawEntry() {
      var entry = raw.substring(currentIndex);
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
      return raw.substring(previousIndex, currentIndex);
    }
  },
};
