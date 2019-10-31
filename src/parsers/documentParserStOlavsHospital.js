/* Copyright 2019 Schibsted */

/***
 *
 * Can parse: St Olavs Hospital HF
 *
 */

module.exports = {
  /***
   * The parse method works on the raw text of a journal file. If the document can be parsed by
   * this parser, the method will return a data object. To determine if the parser was able to
   * parse the file, check the returnValue.parsed field (true|false).
   */
  parse: function(raw) {
    // START: Helpers
    const helper = require('./../helpers/documentParserHelper');

    const sanitizeDocument = function(raw) {
      let doc = raw.replace(/.*(POSTLISTE[^]+?)(?=Saksnr:)/g, '');

      // remove empty lines
      doc = doc.replace(/^\s*[\r\n]/gm, '');

      return doc;
    };

    const getCaseNumber = function(entity) {
      const regexList = [/Saksnr:\s*(\d+\/\d+-\d+)/];
      return helper.getValueFromString(entity, regexList).trim();
    };

    const getCaseTitle = function(entity) {
      return ''; // no case title for St Olavs Hospital
    };

    const getDocumentTitle = function(entity) {
      let title = entity.match(/Dok\.beskr:([^]+?)$/);
      return title ? removeNewlines(title[1]) : '';
    };

    const getDocumentdate = function(entity) {
      return getDate(entity);
    };

    const getRecordedDate = function(entity) {
      return getDate(entity);
    };

    const getSender = function(entity) {
      // empty string when no sender
      if (getDocumentType(entity) === 'I') {
        return getSenderOrReceiver(entity);
      }
      return '';
    };

    const getReceiver = function(entity) {
      // empty string when no receiver
      if (getDocumentType(entity) === 'U') {
        return getSenderOrReceiver(entity);
      }
      return '';
    };

    const getCaseOfficer = function(entity) {
      const regexList = [/Saksb:([^]+?())/];
      return helper.getValueFromString(entity, regexList).trim();
    };

    const getCaseResponsible = function(entity) {
      return ''; // no case case responsible for St Olavs Hospital
    };

    const getUnit = function(entity) {
      const regexList = [/Journalenhet:[\s]?([^\s\\]+)/];
      return helper.getValueFromString(entity, regexList);
    };

    const getDocumentType = function(entity) {
      const regexList = [/Dok.type:[\s]?\/([^\s\\]+)/];
      return helper.getValueFromString(entity, regexList);
    };

    const getClassification = function(entity) {
      const regexList = [/Gradering:(.*?),/];
      return helper.getValueFromString(entity, regexList);
    };

    const getLegalParagraph = function(entity) {
      const regexList = [/Gradering:.*?,([^]+?)Saksb:/];
      const paragraph = helper.getValueFromString(entity, regexList);
      return removeNewlines(paragraph);
    };

    const getDate = function(entity) {
      try {
        const regexList = [
          /Regdato:(.*)Arkivkode/,
          /Regdato:(.*)\nArkivkode/,
          /Regdato:(.*)\b/,
        ];
        const date = helper.getValueFromString(entity, regexList);
        const dateParts = date.split('.');
        return new Date(dateParts[2] + '/' + dateParts[1] + '/' + dateParts[0]);
      } catch (e) {
        console.error('Date could not be parsed: ', entity);
        throw e;
      }
    };

    const getSenderOrReceiver = function(entity) {
      const regexList = [/Navn:([^]+?)Dok.beskr/];

      let data = helper.getValueFromString(entity, regexList);

      // replace multiple retracted values with one
      data = data.replace(/(\*.*)/g, '*****');

      return removeNewlines(data);
    };

    const removeNewlines = function(text) {
      text = text ? text.replace(/\n/g, ' ').trim() : '';

      // remove reduntant spaces
      const doubleSpace = /  /g;
      while (text.match(doubleSpace)) {
        text = text.replace(doubleSpace, ' ');
      }
      return text.trim();
    };
    // END: Helpers

    const cases = sanitizeDocument(raw).split('Lnr:');

    cases.shift(); // Removes first element from array as this contains everything before the matching seperator.

    return {
      parsed: true,
      items: cases.map(entity => ({
        caseNumber: getCaseNumber(entity),
        caseTitle: getCaseTitle(entity),
        documentTitle: getDocumentTitle(entity),
        documentDate: getDocumentdate(entity),
        recordedDate: getRecordedDate(entity),
        sender: getSender(entity),
        receiver: getReceiver(entity),
        caseOfficer: getCaseOfficer(entity),
        caseResponsible: getCaseResponsible(entity),
        documentType: getDocumentType(entity),
        classification: getClassification(entity),
        legalParagraph: getLegalParagraph(entity),
        unit: getUnit(entity),
      })),
    };
  },
};
