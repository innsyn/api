/* Copyright 2019 Schibsted */

/***
 *
 * Can parse:
 * Bydel Bjerke (Oslo)
 * Bydel Nordre Aker
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

    const CASENUMBER_REGEX = /(\d{1,4}\/\d{1,10}\-\d{1,4})/gim;
    const SCREENED_NOTICE = '';

    var preCheck_pages = raw.split(/\nOffentlig\sjournal\n/gim);

    try {
      var items = [];

      var startIndex = raw.search(CASENUMBER_REGEX);
      if (startIndex === -1) {
        throw new Error('Could not find case number.');
      }

      for (var page of preCheck_pages) {
        var preCheck_journals = cleanArray(
            page.replace(CASENUMBER_REGEX, '{{}}$1').split('{{}}'),
            CASENUMBER_REGEX,
          ),
          journalsCount = preCheck_journals.length,
          alternativeSplitter = false;

        /***
         * First: Loop through current page before parsing it to determine if information is offset/ misplaced
         * Then: Reorganize the data for the parser to interpret
         * Logic: IF the number of caseNumbers on current page IS EQUAL to the number of data-patterns (initiated with "Dok.Dato")
         */

        for (var i in preCheck_journals) {
          var currentItem = preCheck_journals[i].replace(CASENUMBER_REGEX, ''),
            currentItemHasDocumentDate = currentItem.match(/Dok\.dato/gim);

          if (
            currentItemHasDocumentDate &&
            currentItemHasDocumentDate.length > 1
          ) {
            var caseNumbers = page.match(CASENUMBER_REGEX),
              documentTypes = page.match(/(?![a-z0-9!"#$%&/().,])\w{1}\n/gm),
              senderOrReceiver = page.match(/(fra:|til:)/gim),
              newSplit = cleanArray(
                page.replace(/(Dok.dato\:)/gim, '{{}}$1').split('{{}}'),
                /(Dok.dato\:)/gim,
              );
            alternativeSplitter = [];

            for (var v = 0; v < caseNumbers.length; v++) {
              alternativeSplitter.push(
                caseNumbers[v] +
                  '\n\n' +
                  documentTypes[v].trim() +
                  '\n\n' +
                  senderOrReceiver[v] +
                  '\nSak:\n\n' +
                  newSplit[v],
              );
            }
          }
        } //for preCheck_journals

        var bodySplitter = alternativeSplitter || preCheck_journals;

        for (var i in bodySplitter) {
          var rawItem = bodySplitter[i].trim(),
            o = createObject(rawItem);

          if (o.documentDate && o.documentDate.length === 0) {
            o.complete = false;
          }

          items.push(o);
        } //for bodySplitter
      } //for preCheck_pages

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
        caseTitle: getCaseTitle(rawItem) || SCREENED_NOTICE,
        documentTitle: getDocumentTitle(rawItem) || SCREENED_NOTICE,
        documentDate: getDocumentdate(rawItem),
        recordedDate: getRecordedDate(rawItem),
        sender: getSender(rawItem),
        receiver: getReceiver(rawItem),
        caseOfficer: getCaseOfficer(rawItem) || SCREENED_NOTICE,
        caseResponsible: getCaseResponsible(rawItem) || SCREENED_NOTICE,
        documentType: getDocumentType(rawItem),
        classification: getClassification(rawItem),
        legalParagraph: getLegalParagraph(rawItem),
      };
    }

    function getClassification(rawItem) {
      var regexList = ['Grad: (.*)'];
      var line = helper.getValueFromString(rawItem, regexList).trim();
      var lineWithoutParagraph = line.match('(.*)Par');
      return lineWithoutParagraph == null
        ? line
        : lineWithoutParagraph[1].trim();
    }

    function getLegalParagraph(rawItem) {
      var regexList = ['Par.:(.*)', 'Par.:\\n\\n(.*)'];
      var paragraph = helper.getValueFromString(rawItem, regexList).trim();
      if (paragraph.indexOf('§') !== -1) return paragraph;
      return '';
    }

    function getDocumentType(rawItem) {
      var regexList = ['[\\d]{2}/[\\d]{5}-[\\d]{1,3}\\n\\n(.*)'];
      return helper.getValueFromString(rawItem, regexList);
    }

    function getCaseOfficer(rawItem) {
      var test = rawItem.match(/Saksbeh:\s(.*)/gim);
      return test ? test[0].replace(/Saksbeh:\s/, '') : false;
    }

    function getCaseResponsible(rawItem) {
      var test = rawItem.match(/Saksansv:\s(.*)/gim);
      return test ? test[0].replace(/Saksansv:\s/, '') : false;
    }

    function getCaseNumber(rawItem) {
      var caseNumber = rawItem.match(CASENUMBER_REGEX);
      return caseNumber ? caseNumber[0].trim() : '';
    }

    function getCaseTitle(rawItem) {
      if (rawItem.indexOf('Andre opplysninger er avskjermet') !== -1)
        return 'Andre opplysninger er avskjermet';
      if (rawItem.indexOf('Sak:') === -1) return '';

      var regexList = [
        'Sak.*\\nDok.*\\n\\nDok.*\\nGrad.*\\nPar.*\\nJour.*\\nArkiv.*\\n.*\\n(.*)',
        'Sak.*\\nDok.*\\n\\nDok.*\\nGrad.*\\nJour.*\\nArkiv.*\\n.*\\n(.*)',
        'Til.*\\nSak.*\\nDok.*\\n\\nDok.*\\nGrad.*\\nJour.*\\nArkiv.*\\n.*\\n(.*)',
        'Sak.*\\n\\nDok.*\\nJour.*\\n.*\\n(.*)',
        'Til.*\\nSak.*\\n\\nDok.*\\nJour.*\\n.*\\n(.*)',
        'Sak.*\\n\\nDok.*\\nGrad.*\\nJour.*\\nArkiv.*\\n.*\\n(.*)',
        /Jour.*\n.*\n(.*)\n\nDok:/,
        'Grad:.*\\n.*\\n.*\\n(.*)',
        /Fra:.*\n\nDok\.dato:.*\nJour.dato:.*\nAvskjermet\n(.*)/,
      ];

      var title = helper.getValueFromString(rawItem, regexList);

      // if there are 4 lines of text before a line with a keyword,
      // expecting the first two lines to be case title (next two are
      // grabbed for the documentTitle)
      if (title.length > 0) {
        var nextThreeLines = rawItem.match(title + '.*\\n(.*)\\n(.*)\\n(.*)');
        if (nextThreeLines !== null) {
          var keywordDetected = false;
          for (var line of nextThreeLines) {
            if (containsKeyword(line)) {
              keywordDetected = true;
              break;
            }
          }
          if (!keywordDetected) {
            title = title + ' ' + nextThreeLines[1];
          }
        }
      }
      return title.trim();
    }

    function getSender(rawItem) {
      // empty string when no sender
      if (rawItem.indexOf('Fra:') === -1) return '';

      var regexList = [
        'Fra:.*\\nSak:.*\\nDok.*\\n\\nDok.*\\nGrad.*\\nPar.*\\nJour.*\\nArkivdel.*\\n(.*)',
        /Fra:.*\nSak:.*\n\nDok.dato.*\nGrad:.*\nPar.*\nJour.*\n(.*)/,
        'Jour.*Sek.*\\nArkiv.*\\n(.*)',
        'Jour.*\\nArkivdel.*\\n(.*)',
        'Jour.*Sek.*\\n(.*)',
        'Fra.*\\nSak.*\\n\\nDok.*\\nJour.*\\n(.*)',
        /Fra:.*\n\nDok\.dato:.*\nJour.dato:.*\n(.*)/,
      ];

      return helper.getValueFromString(rawItem, regexList);
    }

    function getReceiver(rawItem) {
      // empty string when no receiver
      if (rawItem.indexOf('Til:') === -1) return '';

      var regexList = [
        'Til:\\nSak:\\n\\nDok.dato:.*\\nJour.dato:.*\\n(.*)',
        'Til.*\\nSak.*\\nDok.*\\n\\nDok.*\\nGrad.*\\nJour.*\\nArkiv.*\\n(.*)',
        'Jour.*Sek.*\\nArkiv.*\\n(.*)',
        'Jour.*\\nArkivdel.*\\n(.*)',
        'Jour.*Sek.*\\n(.*)',
        'Til:.*\\nSak:.*\\nDok:.*\\n\\nDok.dato:.*\\nGrad:.*\\nJour.dato:.*\\n(.*)',
      ];

      return helper.getValueFromString(rawItem, regexList);
    }

    function getDocumentTitle(rawItem) {
      if (rawItem.indexOf('Dok:') === -1) return '';

      var regexList = [
        'Jour.dato:.*\\n.*\\n.*\\n.*\\n(.*)\\n.*\\nSaksansv:', // 2 lines case title, 2 lines doc title
        'Sak.*\\nDok.*\\n\\nDok.*\\nGrad.*\\nJour.*\\n.*\\n.*\\n.*\\nPar.*\\nArkiv.*\\n.*\\n(.*)',
        'Til.*\\nSak.*\\nDok.*\\n\\nDok.*\\nGrad.*\\nJour.*\\nArkiv.*\\n.*\\n.*\\n(.*)',
        'Sak.*\\nDok.*\\n\\nDok.*\\nGrad.*\\nPar.*\\nJour.*\\nArkiv.*\\n.*\\n.*\\n(.*)',
        'Jour.*\\nArkiv.*\\n.*\\n(.*)',
        'Sak.*\\nDok.*\\n\\nDok.*\\nGrad.*\\nJour.*\\n.*\\n(.*)',
        'Dok:.*\\n\\n(.*)',
        'Dok:\\s*(.*)',
      ];

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
      return title;
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
      var regexList = ['Dok\\.dato: ([\\d]{8})', 'Dok.dato: ([\\d]{6})'];
      var dateString = helper.getValueFromString(rawItem, regexList);
      return getDateFromString(dateString);
    }

    function getRecordedDate(rawItem) {
      var regexList = ['Jour.dato: ([\\d]{8})', 'Jour.dato: ([\\d]{6})'];
      var dateString = helper.getValueFromString(rawItem, regexList);
      return getDateFromString(dateString);
    }

    function cleanArray(arr, rgx) {
      for (var i = 0; i < arr.length; i++) {
        if (!arr[i].match(rgx) || arr[i].trim().length == 0) {
          arr.splice(i, 1);
          i--;
        }
      }
      return arr;
    }

    /***
     * Converts a string to date. Note that for 2-digit years, the function will
     * return a year as 20YY.
     * @param dateString Must be in one of the following formats: DDMMYY and DDMMYYYY
     * @returns {*}
     */
    function getDateFromString(dateString) {
      try {
        if (dateString.length === 8) {
          var year = dateString.substring(4, 8);
          var month = dateString.substring(2, 4);
          var day = dateString.substring(0, 2);
        } else if (dateString.length === 6) {
          var year = '20' + dateString.substring(4, 6);
          var month = dateString.substring(2, 4);
          var day = dateString.substring(0, 2);
        } else {
          return null;
        }
        /*
        Parse the date as a string to avoid one day offset
        http://stackoverflow.com/questions/7556591/javascript-date-object-always-one-day-off)
        */
        return new Date('"' + year + '/' + month + '/' + day + '"');
      } catch (e) {
        return '';
      }
    }
  },
};
