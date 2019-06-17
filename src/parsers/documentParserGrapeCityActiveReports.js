/* Copyright 2019 Schibsted */

/***
 *
 * Can parse:
 * Journals made by GrapeCity ActiveReports
 * E.g: NTNU, UiB, UiO and UiT. Also older editions of UiN and UiA
 *
 * Identifiable by the blue background in the header.
 *
 */
module.exports = {
  /***
   * The parse method for "GrapeCity ActiveReports" will extract data from the raw text.
   * To determine if the parser was able to parse the file, check the returnValue.parsed field
   * (true|false).
   */
  parse: function(raw) {
    var helper = require('./../helpers/documentParserHelper');

    var rawA = raw.split('Innhold:');
    // console.log("antall: " + (rawA.length-1));

    var items = [];
    var globalParsed = false;

    // loop all parts like sagene - skip first element preamble text, use ParserHelper directly
    for (var cases = 1; cases < rawA.length; cases++) {
      try {
        var result = parseSingle(rawA[cases], this.options);
        if (result) {
          var item = result;
          //adjust date format to date format
          item.documentDate = getRestrictedDateFromString(item.documentDate);
          item.recordedDate = getRestrictedDateFromString(item.recordedDate);

          var senderAndReceiver = getsenderAndReceiver(
            item.senderOrReceiver,
            item.documentType,
          );
          item.sender = senderAndReceiver.sender;
          item.receiver = senderAndReceiver.receiver;

          // (UiA) faulty old journals missing "Klassering:
          if (item.classification == 'Hjemmel') {
            item.classification = '';
          }

          // added for old UiA documents
          if (item.caseResponsible.match(/\d{2}\.\d{2}\.\d{4}/))
            item.caseResponsible = '';

          items.push(item);
          globalParsed = true;
        } else {
          console.log(cases);
          // if(cases == 3 ) console.log(rawA[cases]);
        }
      } catch (e) {
        console.log(e);
      }
    }

    if (globalParsed) {
      return {
        parsed: true,
        items: items,
      };
    }

    return {
      parsed: false,
      items: items,
      error: { message: 'No items found in source' },
    };

    // map from topDown to use helper
    function parseSingle(raw, options) {
      var result = {};
      options.fields.forEach(function(field) {
        var rawResult = helper.getValueFromString(raw, field.regexList);
        result[field.name] = field.allowNewLines
          ? rawResult
          : helper.removeNewLines(rawResult);
      });

      return result;
    }

    /*
     * sample senderOrReceiver: '\n\nHF-IHS/EBW\n\nMats Rune Lilleås Larsen\nNorges teknisk-naturvitenskapelige\nuniversitet\n\n'
     */
    function getsenderAndReceiver(senderOrReceiver, documentType) {
      var retVal = {
        sender: '',
        receiver: '',
      };

      // remove case officers (inside the string)
      senderOrReceiver = senderOrReceiver.replace(/[ÆØÅ A-Z\-/]{2,}\n/g, '');

      // remove page number
      senderOrReceiver = senderOrReceiver.replace(/Side.*/g, '');

      // remove dates
      senderOrReceiver = senderOrReceiver.replace(/\d{2}\.\d{2}\.\d{4}/g, '');

      // one entry contained the value "1201" (I know...)
      senderOrReceiver = senderOrReceiver.replace(/\d{4}/g, '');

      // Old UiA files have the header "Avsender\mottaker:" -- remove mottaker
      senderOrReceiver = senderOrReceiver.replace(/\\mottaker:/g, '');

      // remove single digits floating around
      senderOrReceiver = senderOrReceiver.replace(/\b\d\b/g, '');

      // count senders and receivers
      var recipientMatch = senderOrReceiver.match(/Mottaker/g);
      var senderMatch = senderOrReceiver.match(/Avsender/g);

      senderOrReceiver = senderOrReceiver.replace(/Mottaker/g, '');
      senderOrReceiver = senderOrReceiver.replace(/Avsender/g, '');

      var removeEmpty = function(lines) {
        if (!Array.isArray(lines)) {
          console.log('Not an array', lines);
          return [];
        }
        return lines.filter(function(element) {
          if (typeof element === 'string' && element.trim().length > 0)
            return element.trim();
        });
      };

      var lines = removeEmpty(senderOrReceiver.split('\n'));

      var recipientCount = recipientMatch ? recipientMatch.length : 0;
      var senderCount = senderMatch ? senderMatch.length : 0;

      var matchCounts = recipientCount + senderCount;
      if (lines.length > matchCounts) {
        for (var i = 0; i < lines.length; i++) {
          // probably to short to have any valid data
          /* if (lines[i].length <= 3) {
            lines[i] = "";
          }
          // if a line starts with lowercase, move it to the end of the previous item
          else */ if (
            i > 0 &&
            lines[i].length > 0 &&
            lines[i][0] == lines[i][0].toLowerCase()
          ) {
            lines[i - 1] = lines[i - 1] + ' ' + lines[i];
            lines[i] = '';
          }
        }
        lines = removeEmpty(lines);
      }

      // if only one line left, decide if it is sender or receiver
      if (lines.length === 1) {
        switch (documentType) {
          case 'I':
          case 'X':
          case 'N':
            retVal.sender = lines[0];
            break;
          case 'U':
          default:
            retVal.receiver = lines[0];
        }
      } else {
        // receivers and senders should be listed in that order

        // receivers are listed first
        retVal.receiver = lines
          .slice(0, recipientCount)
          .join(', ')
          .trim();
        lines.splice(0, recipientCount);

        // senders are listed last
        retVal.sender = lines.join(', ').trim();
      }

      return retVal;
    }

    function getDatePartsFromString(dateString) {
      let dateParts = { year: 1900, month: 1, day: 1 };

      if (dateString.length === 10) {
        let parts = dateString.split('.');
        dateParts.year = parseInt(parts[2]);
        dateParts.month = parseInt(parts[1]);
        dateParts.day = parseInt(parts[0]);
      } else if (dateString.length === 4) {
        //edge case old UiA journals - dates jumping away
        dateParts.year = parseInt(dateString);
      }
      return dateParts;
    }

    function getDifferenceWithOcrFix(dateParts) {
      let currentYear = new Date().getFullYear();
      let yearFixed = dateParts.year;
      let difference = yearFixed - currentYear;

      // something is off with the source date (probably bad OCR reading)
      if (currentYear + difference < 2000) {
        let lastDigits =
          dateParts.year.toString().length === 2
            ? dateParts.year.toString()
            : dateParts.year.toString().substring(2);

        dateParts.yearFixed = parseInt('20' + lastDigits);

        // recalculate
        difference = dateParts.yearFixed - currentYear;
      } else {
        dateParts.yearFixed = dateParts.year;
      }
      return difference;
    }

    function getFixedDateOrDefault(year, month, day) {
      let fixedDateOrDefault = {
        year: year,
        month: month,
        day: day,
        yearFixed: 1900,
        monthFixed: 1,
        dayFixed: 1,
      };

      let difference = getDifferenceWithOcrFix(fixedDateOrDefault);

      let currentYear = new Date().getFullYear();

      // Check difference after possible fix above
      if (difference > 0) {
        // future date
        fixedDateOrDefault.yearFixed = 1900;
      } else if (currentYear + difference < 2000) {
        // no year from before 2000 accepted
        fixedDateOrDefault.yearFixed = 1900;
      } else {
        // year within accepted range
        fixedDateOrDefault.monthFixed = fixedDateOrDefault.month;
        fixedDateOrDefault.dayFixed = fixedDateOrDefault.day;
      }

      return fixedDateOrDefault;
    }

    /***
     * Converts a string with the format "dd.mm.yyyy" to a date object.
     *
     * IMPORTANT: Accepted dates ranges from 2000-01-01 to CURRENT_YEAR-12-31. After trying to fix the
     * year and the date is still not within the accepted range, 1900-01-01 is returned.
     */
    function getRestrictedDateFromString(dateString) {
      try {
        let { year, month, day } = getDatePartsFromString(dateString);
        let { yearFixed, monthFixed, dayFixed } = getFixedDateOrDefault(
          year,
          month,
          day,
        );
        return new Date(
          '"' + yearFixed + '/' + monthFixed + '/' + dayFixed + '"',
        );
      } catch (e) {
        return '';
      }
    }
  },

  options: {
    fields: [
      {
        name: 'caseNumber',
        regexList: [
          /\n\D(20\d{2}\/\d{1,6}-\d{1,6})/,
          /\n[U|N|I|X|S][\s\S]*?\D(20\d{2}\/\d{1,6}-\d{1,6})/,
          /\n[U|N|I|X|S][\s\S]*?\D(20\d{2}\/\d{2,10})/,
        ],
      },
      {
        name: 'documentTitle',
        regexList: [/([\s\S]*?)Sakstittel:/],
      },
      {
        name: 'caseTitle',
        regexList: [/Sakstittel:([\s\S]*?)DokType/],
      },
      //TBD: keep multi Mottaker prior, or grab as label?
      {
        name: 'senderOrReceiver',
        regexList: [
          /(Mottaker[\s\S]*)/,
          /(Avsender[\s\S]*)/,
          /(Avsender[\s\S]*Avsender)/,
        ],
        allowNewLines: true,
      },
      // {
      //   name: "senderOrReceiverLabel",
      //   regexList: [
      //     /(Mottaker:|Avsender:)/
      //   ]
      // },
      {
        name: 'documentDate',
        regexList: [
          /Saksansvarlig:\n\n\d{2}\.\d{2}\.\d{4}[\s\S]*?(\d{2}\.\d{2}\.\d{4})[\s\S]*?Klassering/,
          /Saksansvarlig:[^]+?\d{2}\.\d{2}\.\d{4}[\s\S]*?(\d{2}\.\d{2}\.\d{4})[\s\S]*?Tilg\.kode/,
          /\d{2}\.\d{2}\.\d{4}[\s\S]*?(\d{2}\.\d{2}\.\d{4})[\s\S]*?Tilg.kode/,
          /\d{2}\.\d{2}\.\d{4}[\s\S]*?(\d{2}\.\d{2}\.\d{4})[\s\S]*?Avskr. dato/,
          /(20\d{2})\/\d{1,6}/,
        ],
      },
      {
        name: 'recordedDate',
        regexList: [
          /Saksansvarlig:\n\n(\d{2}\.\d{2}\.\d{4})[\s\S]*?\d{2}\.\d{2}\.\d{4}[\s\S]*?Klassering/,
          /Saksansvarlig:[^]+?(\d{2}\.\d{2}\.\d{4})[\s\S]*?\d{2}\.\d{2}\.\d{4}[\s\S]*?Tilg\.kode/,
          /(\d{2}\.\d{2}\.\d{4})[\s\S]*?\d{2}\.\d{2}\.\d{4}[\s\S]*?Tilg.kode/,
          /(\d{2}\.\d{2}\.\d{4})[\s\S]*?\d{2}\.\d{2}\.\d{4}[\s\S]*?Avskr. dato/,
          /(20\d{2})\/\d{1,6}/,
        ],
      },
      {
        name: 'caseResponsible',
        regexList: [
          /\d{2}\.\d{2}\.\d{4}\n\n(.*)\n\nTilg\.kode Hjemmel:/,
          /\d{2}\.\d{2}\.\d{4}\n\n\d{2}\.\d{2}\.\d{4}\n\n(.*)\(enhet\/initialer\)/,
          /\d{2}\.\d{2}\.\d{4}\n\n\d{2}\.\d{2}\.\d{4}\n\n(.*)\n\n\(enhet\/initialer\)/,
          // /\d{2}\.\d{2}\.\d{4}[\s\S]*?\d{2}\.\d{2}\.\d{4}([\s\S]*?)  \(enhet\/initialer\):  Klassering:/,
          /Saksansvarlig:\n\n\d{2}\.\d{2}\.\d{4}[\s\S]*?\d{2}\.\d{2}\.\d{4}([\s\S]*?)Klassering/,
          /\d{2}\.\d{2}\.\d{4}[\s\S]*?\d{2}\.\d{2}\.\d{4}([\s\S]*?)Tilg.kode/,
          /\d{2}\.\d{2}\.\d{4}[\s\S]*?\d{2}\.\d{2}\.\d{4}([\s\S]*?)Klassering/,
          /\d{2}\.\d{2}\.\d{4}[\s\S]*?\d{2}\.\d{2}\.\d{4}([\s\S]*?)Avskr. dato/,
          /(\S*)Tilg.kode/,
        ],
      },
      {
        name: 'caseOfficer',
        regexList: [/Avsender\n\n([^]+?)\n/],
      },
      {
        name: 'classification',
        regexList: [
          /Journaldato:\n\n(\d{2,})\n/,
          /Tilg\.kode Hjemmel:\n\nKlassering:\n\n(.*)\nAvs\.\/mottaker/,
          /Klassering:[\s]*?FS[\s]*?([\s\S]*?)offl./,
          /Klassering:[\s]*?S[\s]*?([\s\S]*?)offl./,
          /Klassering:[\s]*?FS[\s]*?([\s\S]*?)enhet/,
          /Klassering:[\s]*?S[\s]*?([\s\S]*?)enhet/,
          /Klassering:([\s\S]*?)offl/,
          /\(enhet\/initialer\):\n\nKlassering:\n\nTilg\.kode Hjemmel:([\s\S]*?)Avs\./,
          /\(enhet\/initialer\):\n\nKlassering:([\s\S]*?)Avs\./,
          /Journaldato:\n[^]+?\n\Klassering:\n\n(.*)\n\nAvs\..*\n\nSaksbeh/,
          /Journaldato:\n[^]+?\n\Klassering:[^]+?\n(.*)\nAvs\..*\n\nSaksbeh/,
          /Tilg\.kode Hjemmel:([\s\S]*?)Avs\./,
          /Klassering:([\s\S]*?)Avs./,
          /Klassering:([\s\S]*?)Avs./,
          /(Hjemmel)/,
        ],
      },
      {
        name: 'legalParagraph',
        regexList: [/\n(.*§.*)/],
      },
      {
        name: 'documentType',
        regexList: [/dok nr:[\s\S]*?(U|N|I|X|S)/],
      },
    ],

    noise: [],
  },
};
