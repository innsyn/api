/* Copyright 2019 Schibsted */

var request = require('request');

module.exports = {
  get: function() {
    return {
      s3: {
        bucket: 'innsyn',
        folder: 'Helse Fonna HF',
      },
      sourceId: 134,
      url: 'https://helse-fonna.no/om-oss/postjournal',
      filenameRegex: /(https.*?\.pdf)/g,
      request: request,
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'HFHF-$1',
          },
        ],
      },
    };
  },
};
