/* Copyright 2019 Schibsted */

var request = require('request');

module.exports = {
  get: function() {
    return {
      s3: {
        bucket: 'innsyn',
        folder: 'Universitetssykehuset Nord-Norge HF',
      },
      sourceId: 138,
      url: 'https://unn.no/om-oss/media/offentlig-journal-unn-hf',
      anchorTagSelector: '.m_document-list a',
      basePath: 'https://unn.no',
      request: request,
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'UNN-$1',
          },
        ],
      },
    };
  },
};
