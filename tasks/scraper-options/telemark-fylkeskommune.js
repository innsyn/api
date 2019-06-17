/* Copyright 2019 Schibsted */

/**
 * Check if we need to parse all documents (originalDocumentLink has multple links).
 */
module.exports = {
  get: function() {
    return {
      sourceId: 168,
      scraper: {
        mode: 'json',
        pagination: {
          generate: {
            type: {
              name: 'date',
              config: {
                format: 'yyyyMMdd',
              },
            },
            urlPattern: 'https://api.t-fk.no/journals/date/{FULL_DATE}',
            numberOfPages: 30,
          },
        },
      },
      parser: {
        name: 'JSON',
        fields: [
          {
            name: 'caseNumber',
            path: 'JOURNPOST_OJ.JP_DOKNR',
          },
          {
            name: 'documentTitle',
            path: 'JOURNPOST_OJ.JP_OFFINNHOLD',
          },
          {
            name: 'caseTitle',
            path: 'SA_OFFTITTEL',
          },
          {
            name: 'classification',
            path: 'KLASSERING_OJ.[1].KL_OPLTEKST',
          },
          {
            name: 'legalParagraph',
            path: 'JOURNPOST_OJ.JP_DOKUMENTER.[0].DOKBESKRIV_OJ.DB_TGKODE',
          },
          {
            name: 'recordedDate',
            path: 'JOURNPOST_OJ.JP_JDATO',
            type: {
              name: 'date',
              config: {
                format: 'yyyyMMdd',
              },
            },
          },
          {
            name: 'documentDate',
            path: 'JOURNPOST_OJ.JP_DOKDATO',
            type: {
              name: 'date',
              config: {
                format: 'yyyyMMdd',
              },
            },
          },
          {
            name: 'documentType',
            path: 'JOURNPOST_OJ.JP_NDOKTYPE',
          },
          {
            name: 'senderOrReceiver1',
            path: 'JOURNPOST_OJ.AVSMOT_OJ.AM_NAVN',
          },
          {
            name: 'senderOrReceiver2',
            path: 'JOURNPOST_OJ.AVSMOT_OJ.PNAVN',
          },
          {
            name: 'caseOfficer',
            path: 'SA_ADMKORT',
          },
          {
            name: 'caseResponsible',
            path: 'JOURNPOST_OJ.JP_ANSVAVD',
          },
          {
            name: 'originalDocumentLink',
            path:
              'JOURNPOST_OJ.JP_DOKUMENTER.[0].DOKBESKRIV_OJ.DOKVERSJON_OJ.VE_FILURL',
          },
          {
            name: 'sender',
            path(row, data) {
              return data.documentType === 'I'
                ? data.senderOrReceiver1 || data.senderOrReceiver2
                : '';
            },
          },
          {
            name: 'receiver',
            path(row, data) {
              return data.documentType === 'U'
                ? data.senderOrReceiver1 || data.senderOrReceiver2
                : '';
            },
          },
        ],
      },
    };
  },
};
