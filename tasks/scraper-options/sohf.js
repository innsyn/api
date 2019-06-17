/* Copyright 2019 Schibsted */

var request = require('request');

module.exports = {
  get: function() {
    return {
      s3: {
        bucket: 'innsyn',
        folder: 'Sykehuset Østfold HF',
      },
      sourceId: 124,
      url:
        'https://sykehuset-ostfold.no/seksjon/offentlig%20journal/Sider/Offentlig-journal-{FULL_YEAR}.aspx',
      anchorTagSelector: '.m_document-list a',
      request: request,
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'SOHF-$1',
          },
        ],
      },
    };
  },
};
