/* Copyright 2019 Schibsted */

module.exports = {
  get: function() {
    return {
      sourceId: 166,
      baseUrl: 'https://www.austagderfk.no',
      scraper: {
        mode: 'json',
        pagination: {
          generate: {
            type: {
              name: 'date',
              config: {
                format: 'yyyy-MM-dd',
              },
            },
            urlPattern:
              'https://postliste2.austagderfk.no/api/postliste/{FULL_DATE}/{FULL_DATE}',
            numberOfPages: 10, // default, 10 days
          },
        },
      },
      parser: {
        name: 'JSON',
        fields: [
          {
            name: 'caseNumber',
            path: 'DokumentNr',
          },
          {
            name: 'documentTitle',
            path: 'Tittel',
          },
          {
            name: 'caseTitle',
            path: 'SakTittel',
          },
          {
            name: 'legalParagraph',
            path: 'Hjemmel',
          },
          {
            name: 'unit',
            path: 'Avdeling',
          },
          {
            name: 'recordedDate',
            path: 'JournalDato',
            type: {
              name: 'date',
            },
          },
          {
            name: 'documentDate',
            path: 'DokumentDato',
            type: {
              name: 'date',
            },
          },
          {
            name: 'documentType',
            path: 'DokumentType',
          },
          {
            name: 'sender',
            path: 'Avsendere',
          },
          {
            name: 'receiver',
            path: 'Mottakere',
          },
        ],
        before: function(json) {
          let entries = [];
          for (let date in json.response) {
            for (let type in json.response[date]) {
              for (let entry in json.response[date][type]) {
                entries.push(json.response[date][type][entry]);
              }
            }
          }
          return entries;
        },
      },
    };
  },
};
