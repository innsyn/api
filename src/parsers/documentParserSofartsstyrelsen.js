/* Copyright 2019 Schibsted */

let cheerio = require('cheerio');

module.exports = {
  parse: function(raw) {
    try {
      let $ = cheerio.load(raw);

      let caseNumbers = $('.document-rows .data-column div h3 a').map(
        function() {
          return $(this)
            .text()
            .trim();
        },
      );

      let documentTitles = $('.document-rows .data-column div h3')
        .clone()
        .children()
        .remove()
        .end()
        .map(function() {
          return $(this)
            .text()
            .trim();
        });

      let documentDates = $(
        '.document-rows .journal-details dl:first-child dd',
      ).map(function() {
        return $(this)
          .text()
          .trim();
      });
      let recordedDates = $(
        '.document-rows .data-column div dl:nth-child(1) dd',
      ).map(function() {
        return $(this)
          .text()
          .trim();
      });
      let caseTitles = $(
        '.document-rows .data-column div dl:nth-child(2) dd',
      ).map(function() {
        return $(this)
          .text()
          .trim();
      });
      let senderOrReceivers = $(
        '.document-rows .data-column div dl:nth-child(3) dd',
      ).map(function() {
        return $(this)
          .text()
          .trim();
      });
      let senderOrReceiverLabels = $(
        '.document-rows .data-column div dl:nth-child(3) dt',
      ).map(function() {
        return $(this)
          .text()
          .trim();
      });
      let caseOfficers = $(
        '.document-rows .journal-details dl:nth-child(5) dd',
      ).map(function() {
        return $(this)
          .text()
          .trim();
      });
      let caseResponsibles = $(
        '.document-rows .journal-details dl:nth-child(6) dd',
      ).map(function() {
        return $(this)
          .text()
          .trim();
      });
      let documentTypes = $(
        '.document-rows .journal-details dl:nth-child(3) dd',
      ).map(function() {
        return $(this)
          .text()
          .trim();
      });

      let items = [];

      for (let i = 0; i < caseNumbers.length; i++) {
        let item = {
          caseNumber: caseNumbers[i],
          documentTitle: documentTitles[i],
          documentDate: getDateFromString(documentDates[i]),
          caseTitle: caseTitles[i],
          recordedDate: getDateFromString(recordedDates[i]),
          caseOfficer: caseOfficers[i].trim(),
          caseResponsible: caseResponsibles[i].trim(),
          documentType:
            documentTypes[i] === 'Indgående'
              ? 'I'
              : documentTypes[i] === 'Udgående'
              ? 'U'
              : 'X',
          senderOrReceiver: senderOrReceivers[i].trim(),
          senderOrReceiverLabel: senderOrReceiverLabels[i],
          sender:
            senderOrReceiverLabels[i] === 'Fra' ? senderOrReceivers[i] : '',
          receiver:
            senderOrReceiverLabels[i] === 'Til' ? senderOrReceivers[i] : '',
          // Fields below are not available
          legalParagraph: '',
          classification: '',
        };

        items.push(item);
      }

      return { parsed: items.length > 0, items: items };
    } catch (e) {
      return { parsed: false, error: e };
    }

    /***
     * Converts a string with the format like "24.10.2012"  to a date object.
     */
    function getDateFromString(dateString) {
      try {
        let dateParts = dateString.split('-');
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
