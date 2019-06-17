/* Copyright 2019 Schibsted */

var request = require('request');

module.exports = {
  get: function() {
    return {
      s3: {
        bucket: 'innsyn',
        folder: 'Nordlandssykenhuset HF',
      },
      sourceId: 137,
      url: 'https://nordlandssykehuset.no/om-oss/offentlig-postjournal',
      anchorTagSelector: '.m_document-list a',
      basePath: 'https://nordlandssykehuset.no',
      request: request,
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'NLSH-$1',
          },
        ],
      },
    };
  },
};
