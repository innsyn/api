/* Copyright 2019 Schibsted */

let cheerio = require('cheerio');
let crypto = require('crypto');

module.exports = {
  parse: function(raw) {
    try {
      let getDocumentType = function(typeString) {
        if (typeString === 'Ind') {
          return 'I';
        }
        if (typeString === 'Ud') {
          return 'U';
        }
        return 'X';
      };

      let getDateFromString = function(dateString) {
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
      };

      let getSenderOrReceiver = function(item, senderOrReceiver) {
        if (senderOrReceiver === 'sender')
          return item.documentType === 'I' ? item.senderOrReceiver : '';
        if (senderOrReceiver === 'receiver')
          return item.documentType === 'U' ? item.senderOrReceiver : '';
        return '';
      };

      let getValue = function(text, regex) {
        let result = text.match(regex);
        if (result && result.length > 0) {
          return result[1].trim();
        }
        return '';
      };

      let createUniqueAndRepeatableCaseNumber = function(entry) {
        let data =
          entry.documentTitle +
          entry.documentType +
          entry.recordedDate.toString() +
          entry.documentDate.toString() +
          entry.sender +
          entry.receiver;

        let hash = crypto
          .createHash('md5')
          .update(data)
          .digest('hex');

        //  only document number for a case -- 6 hex characters should be safe
        return entry.caseNumber + ' (' + hash.substring(0, 6) + ')';
      };

      let $ = cheerio.load(raw);

      let entriesHtml = $('.esdh-results-list-item');
      let entriesText = entriesHtml.map(function() {
        return $(this)
          .text()
          .trim();
      });

      let items = entriesText
        .map(function() {
          return {
            caseNumber: getValue(this, /Journalnummer:(.*)/),
            caseTitle: getValue(this, /Sagstitel:(.*)/),
            documentTitle: getValue(this, /Angående:(.*)/),
            documentType: getDocumentType(getValue(this, /(.*)\n/)),
            documentDate: getDateFromString(getValue(this, /Afsendt d.:(.*)/)),
            recordedDate: getDateFromString(
              getValue(this, /Registreret d.:(.*)/),
            ),
            unit: getValue(this, /Område:(.*)/),
            senderOrReceiver: getValue(this, /Fra\/til:(.*)/),
            caseOfficer: '', // not available
            classification: '', // not available
            legalParagraph: '', // not available
          };
        })
        .toArray();

      items = items.map(function(item) {
        item.caseNumber = createUniqueAndRepeatableCaseNumber(item);
        item.sender = getSenderOrReceiver(item, 'sender');
        item.receiver = getSenderOrReceiver(item, 'receiver');
        return item;
      });

      return { parsed: true, items: items };
    } catch (e) {
      return { parsed: false, error: e };
    }
  },
};
