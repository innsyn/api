/* Copyright 2019 Schibsted */

let cheerio = require('cheerio');
let crypto = require('crypto');

/***
 *
 * Can parse: HTML pages with search results from http://byr-journal.cloudapp.net/
 *
 */
module.exports = {
  /***
   * The parse method for "Byradet" (Oslo) will extract data from a HTML page served in the raw parameter.
   * To determine if the parser was able to parse the file, check the returnValue.parsed field
   * (true|false).
   */
  parse: function(raw) {
    try {
      let $ = cheerio.load(raw);
      let text = $('.DetailView')
        .children()
        .map(function() {
          return $(this).text();
        })[0];
      let entry = {};

      entry.documentTitle = getValue(text, /([^]+?)Type/);
      entry.caseTitle = getValue(text, /Tilhører sak([^]+?)Avsender\/Mottaker/);
      entry.documentType = getDocumentType(
        getValue(text, /Type([^]+?)Journaldato/),
      );
      entry.recordedDate = getDateFromString(
        getValue(text, /Journaldato([^]+?)Dokumentdato/),
      );
      entry.documentDate = getDateFromString(
        getValue(text, /Dokumentdato([^]+?)Saksbehandlende enhet/),
      );
      entry.unit = getValue(text, /Saksbehandlende enhet([^]+?)Saksbehandler/);
      entry.caseOfficer = getValue(text, /Saksbehandler([^]+?)Tilgangskode/);
      entry.classification = getValue(text, /Tilgangskode([^]+?)Hjemmel/);
      entry.legalParagraph = getValue(text, /Hjemmel([^]+?)Tilhører sak/);

      // TODO: Skip address and postal code sometimes present
      entry.senderOrReceiver = getValue(
        text,
        /Avsender\/Mottaker([^]+?)Dokumenter/,
      );

      // cleanup
      entry.senderOrReceiver = entry.senderOrReceiver.replace('Navn', '');
      entry.senderOrReceiver = entry.senderOrReceiver.replace('Adresse', '');
      entry.senderOrReceiver = entry.senderOrReceiver.replace('Poststed', '');
      entry.senderOrReceiver = entry.senderOrReceiver.replace(/\s{2,}/g, ' ');
      entry.senderOrReceiver = entry.senderOrReceiver.trim();

      entry.sender = entry.receiver = '';
      entry.sender = entry.documentType === 'I' ? entry.senderOrReceiver : '';
      entry.receiver = entry.documentType === 'U' ? entry.senderOrReceiver : '';

      // source does not provide case numbers, create artificial
      let data =
        entry.documentTitle +
        entry.caseTitle +
        entry.documentType +
        entry.recordedDate.toString() +
        entry.documentDate.toString() +
        entry.unit +
        entry.caseOfficer +
        entry.classification +
        entry.legalParagraph;

      let hash = crypto
        .createHash('md5')
        .update(data)
        .digest('hex');
      entry.caseNumber = 'INNSYN-' + hash;

      entry.caseResponsible = '';

      function getValue(text, regex) {
        let result = text.match(regex);
        if (result && result.length > 0) {
          return result[1].trim();
        }
        return '';
      }

      function getDocumentType(typeString) {
        if (typeString === 'Inngående brev') {
          return 'I';
        }
        if (typeString === 'Utgående brev') {
          return 'U';
        }
        if (typeString.indexOf('Internt notat') !== -1) {
          return 'X';
        }
        return '';
      }

      let items = [entry];

      return { parsed: true, items: items };
    } catch (e) {
      return { parsed: false, error: e };
    }

    /***
     * Converts a string with the format like "24.10.2012"  to a date object.
     */
    function getDateFromString(dateString) {
      try {
        let dateParts = dateString.split('.');
        let day = dateParts[0];
        let month = dateParts[1];
        let year = dateParts[2];
        let result = new Date('"' + year + '/' + month + '/' + day + '"');
        if (result == 'Invalid Date') {
          return '';
        }
        return result;
      } catch (e) {
        return '';
      }
    }
  },
};
