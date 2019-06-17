/* Copyright 2019 Schibsted */

const _ = require('lodash');
const htmlParser = require('./html');

/***
 *
 * Can parse: HTML pages with search results from Elements eInnsyn
 * Configures / extends the HTML parser.
 *
 */
module.exports = {
  /**
   *
   */
  parse: function(page, { __name, ...baseConfig }) {
    const extraConfig = {
      container: '#main',
      fields: [
        {
          name: 'documentNumber',
          path:
            'div.detailsmetadatablock.leftside > div:nth-child(2) > div.display-field',
        },
        {
          name: 'caseNumber',
          path: 'td.tdRegistryCasenummer > a',
          after(value, data) {
            return `${value}-${data.documentNumber}`;
          },
        },
        {
          name: 'documentTitle',
          path: 'td.content-description > a',
        },
        {
          name: 'recordedDate',
          path: 'td.tdJournalDato',
          type: {
            name: 'date',
          },
        },
        {
          name: 'documentDate',
          path:
            'div.detailsmetadatablock.leftside > div:nth-child(3) > div.display-field',
          type: {
            name: 'date',
          },
        },
        {
          name: 'caseOfficer',
          path:
            'div.detailsmetadatablock.rightSide > div:nth-child(1) > div.display-field',
        },
        {
          name: 'legalParagraph',
          path:
            'div.detailsmetadatablock.rightSide > div:nth-child(3) > div.display-field',
        },
        {
          name: 'documentType',
          path:
            'fieldset:nth-child(2) > div > div > table > tbody > tr > td.td-documenttype',
          after(value) {
            return value.startsWith('Inngående')
              ? 'I'
              : value.startsWith('Utgående')
              ? 'U'
              : value.startsWith('Internt')
              ? 'X'
              : value;
          },
        },
        {
          name: 'unit',
          path:
            'div.detailsmetadatablock.leftside > div:nth-child(4) > div.display-field',
        },
        {
          name: 'sendersAndReceivers',
          path($, row) {
            let sendersAndReceivers = [];
            let current = {};

            const items = $(row)
              .find('fieldset:nth-child(5) > div > table > tbody tr td')
              .map(function() {
                return $(this)
                  .text()
                  .trim();
              })
              .get();

            for (let index = 0; index < items.length; index++) {
              if (index % 3 === 0) {
                current.name = items[index];
              }
              if (index % 3 === 2) {
                current.isSender = items[index].startsWith('Avsend');
                sendersAndReceivers.push(current);
                current = {};
              }
            }

            return sendersAndReceivers;
          },
        },
        {
          name: 'sender',
          path($, row, data) {
            return data.sendersAndReceivers
              .filter(function(item) {
                if (item.isSender) {
                  return item;
                }
              })
              .map(function(item) {
                return item.name;
              })
              .join(', ');
          },
        },
        {
          name: 'receiver',
          path($, row, data) {
            return data.sendersAndReceivers
              .filter(function(item) {
                if (item.isSender === false) {
                  return item;
                }
              })
              .map(function(item) {
                return item.name;
              })
              .join(', ');
          },
        },
      ],
    };

    // TODO: Correct merging so you can override!
    return htmlParser.parse(page, {
      ...extraConfig,
      ...baseConfig,
      fields: _.unionBy(baseConfig.fields, extraConfig.fields, 'name'),
    });
  },
};
