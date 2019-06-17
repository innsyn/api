/* Copyright 2019 Schibsted */

var request = require('request');

module.exports = {
  get: function() {
    return {
      s3: {
        bucket: 'innsyn',
        folder: 'Sunnaas Sykehus HF',
      },
      sourceId: 126,
      url: 'https://www.sunnaas.no/om-oss/offentlig-postjournal',
      anchorTagSelector: '.m_document-list a',
      basePath: 'https://sunnaas.no',
      request: request,
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'SUN-$1',
          },
        ],
      },
    };
  },
};
