/* Copyright 2019 Schibsted */

var request = require('request');

module.exports = {
  get: function() {
    return {
      s3: {
        bucket: 'innsyn',
        folder: 'Helse Bergen HF',
      },
      sourceId: 141,
      url: 'https://helse-bergen.no/offentleg-postjournal',
      filenameRegex: /(https.*?\.pdf)/g,
      request: request,
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'HBHF-$1',
          },
        ],
      },
    };
  },
};
