/* Copyright 2019 Schibsted */

var request = require('request');

module.exports = {
  get: function() {
    return {
      s3: {
        bucket: 'innsyn',
        folder: 'Sykehuset Innlandet HF',
      },
      sourceId: 128,
      url: 'https://sykehuset-innlandet.no/kontakt-oss/offentlig-journal',
      anchorTagSelector: '.m_document-list a',
      basePath: 'https://sykehuset-innlandet.no',
      request: request,
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'SIN-$1',
          },
        ],
      },
    };
  },
};
