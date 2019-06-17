/* Copyright 2019 Schibsted */

var request = require('request');

module.exports = {
  get: function() {
    return {
      s3: {
        bucket: 'innsyn',
        folder: 'Helse Nord RHF',
      },
      sourceId: 144,
      url: 'https://helse-nord.no/om-oss/offentlig-postjournal',
      anchorTagSelector: '.m_document-list a',
      basePath: 'https://helse-nord.no',
      request: request,
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'HNO-$1',
          },
        ],
      },
    };
  },
};
