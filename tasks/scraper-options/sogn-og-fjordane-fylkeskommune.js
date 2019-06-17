/* Copyright 2019 Schibsted */

const dateFunctions = require('../../src/helpers/dateFunctions');
const getValueFromString = require('../../src/helpers/documentParserHelper')
  .getValueFromString;

module.exports = {
  get: function() {
    return {
      sourceId: 169,
      scraper: {
        pagination: {
          generate: {
            type: {
              name: 'date',
            },
            numberOfPages: 10,
            urlPattern:
              'https://www.sfj.no/?cat=343942&pjdate={FULL_DATE}&pjsokdato=1',
          },
        },
      },
      parser: {
        name: 'HTML',
        container: 'table.postjournal > tbody > tr',
        fields: [
          {
            name: 'caseNumber',
            path: 'div.postjournal.tittel > span',
            after: function(e) {
              return getValueFromString(e, [/. - ([0-9\-\/]*)/]);
            },
          },
          {
            name: 'documentTitle',
            path: 'div.postjournal.tittel > a',
          },
          {
            name: 'caseTitle',
            path:
              'table.postjournaldetaljer > tbody > tr:nth-of-type(1) > td:nth-of-type(2)',
          },
          {
            name: 'legalParagraph',
            path:
              'table.postjournaldetaljer > tbody > tr:nth-of-type(4) > td:nth-of-type(2)',
          },
          {
            name: 'recordedDate',
            path($, row) {
              return $(row)
                .find('div.postjournal.fratil')
                .first()
                .contents()
                .eq(2)
                .text()
                .trim();
            },
            after: function(value) {
              return dateFunctions.getDateFromString(
                getValueFromString(value, [/(\d\d\.\d\d\.\d\d\d\d)/]),
                'dmy',
              );
            },
          },
          {
            name: 'documentDate',
            path:
              'table.postjournaldetaljer > tbody > tr:nth-of-type(2) > td:nth-of-type(2)',
            type: {
              name: 'date',
            },
          },
          {
            name: 'documentType',
            path:
              'table.postjournaldetaljer > tbody > tr:nth-of-type(3) > td:nth-of-type(2)',
            after(value) {
              return value.startsWith('Inngå')
                ? 'I'
                : value.startsWith('Utgåa')
                ? 'U'
                : value.startsWith('Notat')
                ? 'X'
                : value;
            },
          },
          {
            name: 'sender',
            path($, row) {
              const label = $(row)
                .find('div.postjournal.fratil')
                .first()
                .contents()
                .eq(3)
                .text()
                .trim();

              const value = $(row)
                .find('div.postjournal.fratil')
                .first()
                .contents()
                .eq(4)
                .text()
                .trim();

              return label.startsWith('Avsendar') ? value : '';
            },
          },
          {
            name: 'receiver',
            path($, row) {
              const label = $(row)
                .find('div.postjournal.fratil')
                .first()
                .contents()
                .eq(3)
                .text()
                .trim();

              const value = $(row)
                .find('div.postjournal.fratil')
                .first()
                .contents()
                .eq(4)
                .text()
                .trim();

              return label.startsWith('Mottakar') ? value : '';
            },
          },
          {
            name: 'caseOfficer',
            path:
              'table.postjournaldetaljer > tbody > tr:nth-of-type(5) > td:nth-of-type(2)',
          },
          // {
          //   name: 'originalDocumentLink',
          //   path: 'table.postjournaldetaljer', //"table.postjournaldetaljer > tbody > tr:nth-child(6)",
          //   after: function(html) {
          //     const baseselector = 'http://www.sfj.no';
          //     let res = getValueFromString(html, [/href="(.*?)"/]);
          //     return res !== '' && res !== '#' ? baseselector + res : '';
          //   },
          // },
        ],
      },
    };
  },
};
