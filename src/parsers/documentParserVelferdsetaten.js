/* Copyright 2019 Schibsted */

var helper = require('./../helpers/documentParserHelper');

/***
 *
 * Can parse:
 * Velferdsetaten (Oslo)
 * Helseetaten (Oslo)
 */
module.exports = {
  /***
   * The parse method works on the raw text of a journal file. If the document can be parsed by
   * this parser, the method will return a data object. To determine if the parser was able to
   * parse the file, check the returnValue.parsed field (true|false).
   */
  parse: function(raw) {
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
      var classification = rawItem.match('Grad:(.*)Par.:');
      return classification ? classification[1].trim() : '';
    }

    function getLegalParagraph(rawItem) {
      var paragraph = rawItem.match('Par.:(.*)');
      return paragraph ? paragraph[1].trim() : '';
    }

    function getDocumentType(rawItem) {
      var type = rawItem.match('[\\d]{4}/[\\d]{5}-[\\d]{1,3}\\n\\n(.*)');
      return type ? type[1] : ';';
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
      var title = handleSpecialCaseForTitles(rawItem, 'case');
      if (title.length > 0) {
        return title;
      } else {
        title = rawItem.match('Grad:.*\\n.*\\n(.*)');
        return title ? title[1] : '';
      }
    }

    function getSender(rawItem) {
      // empty string when no sender
      if (rawItem.indexOf('Fra:') === -1) return '';

      // Fra OR Til is always below the Grad: line
      var sender = rawItem.match('(Grad:).*\\n(.*)');
      return sender ? sender[2] : '';
    }

    function getReceiver(rawItem) {
      // empty string when no receiver
      if (rawItem.indexOf('Til:') === -1) return '';

      // Fra OR Til is always below the Grad: line
      var receiver = rawItem.match('(Grad:).*\\n(.*)');
      return receiver ? receiver[2] : '';
    }

    function getDocumentTitle(rawItem) {
      // case title and document title spans 2 lines each
      var title = handleSpecialCaseForTitles(rawItem, 'document');
      if (title.length > 0) {
        return title;
      } else {
        var regexList = [
          'Sak:.*\\nDok:.*\\n\\nDok.dato:.*\\nJour.dato:.*\\nGrad:.*\\n.*\\n.*\\n(.*)',
          'Dok:\\s*(.*)',
        ];

        title = helper.getValueFromString(rawItem, regexList);
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
    }

    /***
     * Gets the title when both the case title and the document title spans 2 lines each.
     * Returns an empty string when there is no match.
     *
     * @param rawItem The raw journal entry.
     * @param type case (extract the case title) or document (extract the document title).
     */
    function handleSpecialCaseForTitles(rawItem, type) {
      var specialCase = rawItem.match(
        'Sak:.*\\nDok:.*\\n\\nDok.dato:.*\\nJour.dato:.*\\nGrad:.*\\n.*\\n(.*)\\n(.*)\\n(.*)\\n(.*)',
      );

      if (
        specialCase !== null &&
        specialCase.length === 5 &&
        containsKeyword(specialCase[3]) === false &&
        containsKeyword(specialCase[4]) === false
      ) {
        if (type === 'case') return specialCase[1] + ' ' + specialCase[2];
        if (type === 'document') return specialCase[3] + ' ' + specialCase[4];
        return '';
      }
      return '';
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

    function getDocumentdate(rawItem) {
      var regexList = [/Dok\.dato: ([\d]{8})/, /Dok\.dato:[^]+?(\d{8})/];
      var dateString = helper.getValueFromString(rawItem, regexList);
      return getDateFromString(dateString);
    }

    function getRecordedDate(rawItem) {
      var regexList = [
        /Jour.dato: ([\d]{8})/,
        /Jour\.dato:[^]+?\d{8}[^]+?(\d{8})/,
      ];
      var dateString = helper.getValueFromString(rawItem, regexList);
      return getDateFromString(dateString);
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

    function getDateFromString(dateString) {
      if (dateString) {
        var year = dateString.substring(4, 8);
        var month = dateString.substring(2, 4);
        var day = dateString.substring(0, 2);
        return new Date(year, month - 1, day);
      }
      return null;
    }
  },
};
