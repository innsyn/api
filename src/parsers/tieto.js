/* Copyright 2019 Schibsted */

const htmlParser = require('./html');

/***
 *
 * Can parse: HTML pages with search results from Tieto's 360online.com.
 * Configures / extends the HTML parser.
 *
 */
module.exports = {
  /**
   *
   */
  parse: function(html, { __name, ...baseConfig }) {
    const extraConfig = {
      container: '.document-rows',
      fields: [
        {
          name: 'caseNumber',
          path: ['.data-column div h3 a', '.data-column div h3'],
          after(value) {
            const [caseNumber] = value.split(/(?<=^\S+)\s/);
            return caseNumber || value;
          },
        },
        {
          name: 'documentTitle',
          path: '.data-column div h3',
          after(value) {
            const [, documentTitle] = value.split(/(?<=^\S+)\s/);
            return documentTitle || value;
          },
        },
        {
          name: 'recordedDate',
          path: '.data-column div dl:nth-child(1) dd',
          type: 'date',
        },
        {
          name: 'documentDate',
          path: '.journal-details dl:first-child dd',
          type: 'date',
        },
        {
          name: 'caseTitle',
          path: '.data-column div dl:nth-child(2) dd',
        },
        {
          name: 'caseOfficer',
          path: '.journal-details dl:nth-child(5) dd',
        },
        {
          name: 'caseResponsible',
          path: '.journal-details dl:nth-child(6) dd',
        },
        {
          name: 'legalParagraph',
          path: '.journal-details dl:nth-child(4) dd',
        },
        {
          name: 'documentType',
          path: '.journal-details dl:nth-child(3) dd',
        },
        {
          name: 'documentLink',
          path($, row) {
            const item = $(row)
              .find('.data-permitted .journal-details > ul > li > a')
              .first();

            const onClick = $(item).attr('onclick');

            let url = null;

            if (onClick) {
              [, url] = onClick.match(/\('(.*?)'/);
            }

            return url;
          },
        },
        {
          name: 'senderOrReceiver',
          path: [
            '.data-column div dl:nth-child(3) dd pnavn',
            '.data-column div dl:nth-child(3) dd',
          ],
        },
        {
          name: 'sender',
          path($, row, data) {
            return data.documentType === 'I' ? data.senderOrReceiver : '';
          },
        },
        {
          name: 'receiver',
          path($, row, data) {
            return data.documentType === 'U' ? data.senderOrReceiver : '';
          },
        },
      ],
    };

    // TODO: Correct merging so you can override!
    return htmlParser.parse(html, {
      ...extraConfig,
      ...baseConfig,
    });
  },
};
