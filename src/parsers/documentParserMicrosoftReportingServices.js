/* Copyright 2019 Schibsted */

/***
 *
 * Can parse:
 * Journals made by Microsoft Reporting Services.
 * E.g: Norges miljø- og biovitenskapelige universitet, Sykehuset Østfold HF, etc.
 *
 * Identifiable by the red background in the header.
 *
 * duplicate of HSO
 */
module.exports = {
  /***
   * The parse method for "Microsoft Reporting Services" will extract data from the raw text.
   * To determine if the parser was able to parse the file, check the returnValue.parsed field
   * (true|false).
   */
  parse: function(raw) {
    var helper = require('../helpers/documentParserHelper');

    var items = [];
    var globalParsed = false;

    var cases = raw.split('Dok.:');

    //loop for all
    for (var i = 1; i < cases.length; i++) {
      var result = parseSingle(cases[i], this.options);

      if (result) {
        //clean up data for DB, resolve ambiguity...
        globalParsed = true;

        var item = result;

        //split caseOfficer on / to give department and person as separate fields
        item.caseResponsible = '';

        if (item.caseOfficer.indexOf('/') > 0) {
          var caseParts = item.caseOfficer.split('/');
          item.caseResponsible = caseParts[0].trim();
          item.caseOfficer = caseParts[1].trim();
        }

        /*
         * add expected fields (sender, receiver) based on meta hits on labeling
         * senderOrReceiver: 'Ruseløkka/Skillebekk beboerforening',
         * senderOrReceiverLabel: 'Avsender:',
         */
        item.receiver = item.sender = '';

        if (item.senderOrReceiverLabel == 'Mottaker:') {
          item.receiver = item.senderOrReceiver;
          item.documentType = 'I';
        } else {
          item.sender = item.senderOrReceiver;
          item.documentType = 'U';
        }

        //adjust date format to date format
        item.documentDate = getDateFromString(item.documentDate);
        item.recordedDate = getDateFromString(item.recordedDate);

        items.push(item);
      } else {
        // console.log("failed" + i);
        // if(i == 87 ) console.log(cases[i+1]);
      }
    }

    // console.log("total:" + cases.length + " expected cases: " + (cases.length-1) );
    // console.log("parsed: " + items.length);

    //return the array of parsed items and status or default error message
    if (globalParsed) {
      return { parsed: true, items: items };
    }
    return {
      parsed: false,
      items: items,
      error: { message: 'No items found in source' },
    };

    /***
     * Uses the documentParserHelper method directly
     * todo: consider exposing this also as a helper function, since duplicated with UniBlue
     */
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

    /***
     * Converts a string with the format "dd.mm.yyyy" to a date object.
     */
    // from Kemner - move to helper used inside topDown?
    function getDateFromString(dateString) {
      try {
        if (dateString.length === 10) {
          var dateParts = dateString.split('.');
          var year = dateParts[2];
          var month = dateParts[1];
          var day = dateParts[0];
        } else {
          return '';
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

  options: {
    fields: [
      {
        name: 'caseNumber',
        regexList: [/(\d{2,4}\/\d{3,7}-\d{1,4})/],
      },
      {
        name: 'documentTitle',
        regexList: [/([\s\S]*?)Sak:/],
      },
      {
        name: 'caseTitle',
        regexList: [/Sak:([\s\S]*?)(Mottaker|Avsender):/],
      },
      {
        name: 'senderOrReceiver',
        regexList: [/(?:Mottaker:|Avsender:)([\s\S]*?)Journaldato:/],
      },
      {
        name: 'senderOrReceiverLabel',
        regexList: [/(Mottaker:|Avsender:)/],
      },
      {
        name: 'documentDate',
        regexList: [/Dok. dato:([\s\S]*?)Arkivdel:/],
      },
      {
        name: 'recordedDate',
        regexList: [
          /Journaldato:([\s\S]*?)Tilg. kode:/,
          /Journaldato:([\s\S]*?)Tilgangskode:/,
        ],
      },
      {
        name: 'caseOfficer',
        regexList: [/Saksbehandler:([\s\S]*?)Dok./],
      },

      // SSHF tweaks - consider option to extend config? or add as extra regexp
      {
        name: 'classification',
        regexList: [/Klasse:([\s\S]*?)Dok.:/, /Klasse:\n\n(.*)/],
      },
      {
        name: 'legalParagraph',
        regexList: [/Tilg. kode:([\s\S]*?)Saksbehandler:/],
      },
    ],

    noise: [],
  },
};
