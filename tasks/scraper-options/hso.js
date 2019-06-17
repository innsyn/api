/* Copyright 2019 Schibsted */

var request = require('request');

module.exports = {
  get: function() {
    return {
      s3: {
        bucket: 'innsyn',
        folder: 'Helse Sørøst RHF',
      },
      sourceId: 104,
      url: 'https://www.helse-sorost.no/om-oss/media/offentlig-journal',
      anchorTagSelector: '.m_document-list a',
      request: request,
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'HSO-$1',
          },
        ],
      },
    };
  },
};
