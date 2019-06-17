/* Copyright 2019 Schibsted */

var request = require('request');

module.exports = {
  get: function() {
    return {
      s3: {
        bucket: 'innsyn',
        folder: 'Helse Møre og Romsdal HF',
      },
      sourceId: 132,
      url: 'https://helse-mr.no/om-oss/offentleg-postjournal',
      anchorTagSelector: '.m_subtle-expander a',
      basePath: 'https://helse-mr.no',
      request: request,
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'HMR-$1',
          },
        ],
      },
    };
  },
};
