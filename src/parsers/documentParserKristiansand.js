/* Copyright 2019 Schibsted */

/***
 *
 * Can parse: Kristiansand (Former "Sørlandsporten")
 *
 */
module.exports = {
  /***
   * The parse method works on the raw text of a journal file. If the document can be parsed by
   * this parser, the method will return a data object. To determine if the parser was able to
   * parse the file, check the returnValue.parsed field (true|false).
   */
  parse: function(raw) {
    const CASENUMBER_REGEX = /(\d{8,9}[-?]\d{1,3})/gim;
    var helper = require('./../helpers/documentParserHelper');

    var bodySplitter = raw
      .trim()
      .replace(CASENUMBER_REGEX, '{{}}$1')
      .split('{{}}');
    bodySplitter.shift();

    try {
      if (bodySplitter.length === 0) {
        throw new Error('Could not find case number.');
      }

      var rawItems = [];

      for (var i in bodySplitter) {
        rawItems.push(bodySplitter[i]);
      }

      var items = [];
      rawItems.forEach(function(item) {
        items.push(createObject(item));
      });

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
        caseResponsible: getCaseResponsible(rawItem),
        caseOfficer: getCaseOfficer(rawItem),
        documentType: getDocumentType(rawItem),
      };
    }

    function getCaseNumber(rawItem) {
      var caseNumber = rawItem.match(CASENUMBER_REGEX);
      return caseNumber ? caseNumber[0].trim() : false;
    }

    function getCaseTitle(rawItem) {
      var regexList = [
        /Tilg. k.de:.*\n\n.*\n\n([^]+?)\n.*\n{1,2}Saksansv:/,
        /Tilg.k.de:.*\n\n.*\n\n.*\n\n([^]+?)\n.*\nSaksansv:/,
        /Tilg. k.de: Par.:\n\n.*\n\n([^]+?)\n\n[^]+?Saksansv:/,
        /Sak:([^]+)\nDok:/,
      ];

      return helper
        .getValueFromString(rawItem, regexList)
        .replace(/\n/g, ' ')
        .trim();
    }

    function getDocumentTitle(rawItem) {
      var regexList = [
        /Tilg. k.de:.*\n\n.*\n\n[^]+?\n(.*)\nSaksansv:/,
        /Tilg.k.de:.*\n\n.*\n\n.*\n\n.*\n([^]+?)Saksansv:/,
        /Tilg. k.de: Par.:\n\n.*\n\n[^]+?\n\n([^]+?)Saksansv:/,
        /Dok:([^]+)\nSaksansv:/,
      ];

      return helper
        .getValueFromString(rawItem, regexList)
        .replace(/\n/g, ' ')
        .trim();
    }

    function getDocumentdate(rawItem) {
      var dateString = rawItem.match(
        /(D.k.dato:)\s{0,2}(\d{2}.{0,1}\d{2}.{0,1}\d{4})/,
      );
      if (!dateString) return false;

      dateString = dateString[2].replace(/\./g, '');
      var year = dateString.substring(4, 8);
      var month = dateString.substring(2, 4);
      var day = dateString.substring(0, 2);
      return new Date(year, month - 1, day);
    }

    function getRecordedDate(rawItem) {
      var dateString = rawItem.match(
        /(Jour.dato:)\s{0,2}(\d{2}.{0,1}\d{2}.{0,1}\d{3,4})/,
      );
      if (!dateString) return new Date('1900/1/1');

      var dateStringIndex = dateString.index;
      dateString = dateString[2].replace(/\./g, '');
      if (dateString.length === 7) {
        var start = rawItem.indexOf('\n', dateStringIndex);
        dateString += rawItem.substring(start, start + 3).match(/\d/)[0];
      }
      var year = dateString.substring(4, 8);
      var month = dateString.substring(2, 4);
      var day = dateString.substring(0, 2);
      return new Date(year, month - 1, day);
    }

    function getSender(rawItem) {
      var regexList = [
        /Tilg.k.de:.*\n\n.*\n\n(.*)\n\n[^]+?\n.*\nSaksansv:/,
        /Tilg. k.de: Par.:\n\n(.*)\n\n[^]+?\n\n/,
        /Avsender:\s(.*)/,
      ];

      return helper
        .getValueFromString(rawItem, regexList)
        .replace(/\n/g, ' ')
        .trim();
    }

    function getReceiver(rawItem) {
      if (rawItem.indexOf('Mottaker:') === -1) return '';
      var receiver = rawItem.match(/(Mottaker:)\s(.*)/);
      return receiver ? receiver[2] : '';
    }

    function getCaseResponsible(rawItem) {
      var responsible = rawItem.match(/Saksansv: (.*)/);
      return responsible ? responsible[1].trim() : '';
    }

    function getCaseOfficer(rawItem) {
      var officer = rawItem.match(/Saksbeh: (.*)/);
      return officer ? officer[1].trim() : '';
    }

    function getDocumentType(rawItem) {
      var type = rawItem.match(/\s([IU])\s/);
      return type ? type[1] : '';
    }
  },
};
