/* Copyright 2019 Schibsted */

var request = require('request');

module.exports = {
  get: function() {
    return {
      s3: {
        bucket: 'innsyn',
        folder: 'Oslo Universitetssykehus HF',
      },
      sourceId: 143,
      url: 'https://oslo-universitetssykehus.no/om-oss/offentlig-postjournal',
      anchorTagSelector: '.m_document-list a',
      request: request,
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'OUHF-$1',
          },
        ],
      },
    };
  },
};
