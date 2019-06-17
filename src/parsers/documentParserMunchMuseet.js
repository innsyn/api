/* Copyright 2019 Schibsted */

/***
 *
 * Can parse: Munch museet (Oslo)
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

    const CASENUMBER_REGEX = '[\\d]{4}\\/[\\d]{5}-[\\d]{1,3}[\\s]';
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
      var line = rawItem.match('Grad: (.*)');
      line = line ? line[1].trim() : '';
      // check for paragraph on same line
      var lineWithoutParagraph = line.match('(.*)Par');
      return lineWithoutParagraph == null
        ? line
        : lineWithoutParagraph[1].trim();
    }

    function getLegalParagraph(rawItem) {
      var paragraph = rawItem.match('Par.:(.*)');
      return paragraph ? paragraph[1].trim() : '';
    }

    function getDocumentType(rawItem) {
      var type = rawItem.match('[\\d]{2}/[\\d]{5}-[\\d]{1,3}\\n\\n(.*)');
      return type ? type[1] : '';
    }

    function getCaseOfficer(rawItem) {
      var officer = rawItem.match('Saksbeh: (.*)');
      return officer ? officer[1] : '';
    }

    function getCaseResponsible(rawItem) {
      var responsible = rawItem.match('Saksansv: (.*)');
      return responsible ? responsible[1] : '';
    }

    function getCaseNumber(rawItem) {
      var caseNumber = rawItem.match(CASENUMBER_REGEX);
      return caseNumber ? caseNumber[0].trim() : '';
    }

    function getCaseTitle(rawItem) {
      var regexList = ['Grad:.*\\n.*\\n(.*)'];

      return helper.getValueFromString(rawItem, regexList);
    }

    function getSender(rawItem) {
      // empty string when no sender
      if (rawItem.indexOf('Fra:') === -1) return '';

      var regexList = ['Grad:.*\\n(.*)'];

      return helper.getValueFromString(rawItem, regexList);
    }

    function getReceiver(rawItem) {
      // empty string when no receiver
      if (rawItem.indexOf('Til:') === -1) return '';

      var regexList = ['Grad:.*\\n(.*)'];

      return helper.getValueFromString(rawItem, regexList);
    }

    function getDocumentTitle(rawItem) {
      var regexList = ['Dok:.*\\n\\n(.*)'];

      return helper.getValueFromString(rawItem, regexList);
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
      var dateString = rawItem.match('Dok\\.dato: ([\\d]{8})')[1];
      var year = dateString.substring(4, 8);
      var month = dateString.substring(2, 4);
      var day = dateString.substring(0, 2);
      return new Date(year, month - 1, day);
    }

    function getRecordedDate(rawItem) {
      var dateString = rawItem.match('Jour.dato: ([\\d]{8})')[1];
      var year = dateString.substring(4, 8);
      var month = dateString.substring(2, 4);
      var day = dateString.substring(0, 2);
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
