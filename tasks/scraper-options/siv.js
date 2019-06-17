/* Copyright 2019 Schibsted */

var request = require('request');

module.exports = {
  get: function() {
    return {
      s3: {
        bucket: 'innsyn',
        folder: 'Sykehuset i Vestfold HF',
      },
      sourceId: 127,
      url: 'https://www.siv.no/om-oss/postjournal',
      anchorTagSelector: '.m_document-list a',
      basePath: 'https://siv.no',
      request: request,
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'SIV-$1',
          },
        ],
      },
    };
  },
};
