/* Copyright 2019 Schibsted */

var request = require('request');

module.exports = {
  get: function() {
    return {
      s3: {
        bucket: 'innsyn',
        folder: 'Vestre Viken HF',
      },
      sourceId: 129,
      url: 'https://vestreviken.no/om-oss/offentlig-postjournal',
      anchorTagSelector: '.m_document-list a',
      basePath: 'https://vestreviken.no',
      request: request,
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'VVHF-$1',
          },
        ],
      },
    };
  },
};
