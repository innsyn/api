/* Copyright 2019 Schibsted */

var request = require('request');

module.exports = {
  get: function() {
    return {
      s3: {
        bucket: 'innsyn',
        folder: 'Akershus Universitetssykehus HF',
      },
      sourceId: 125,
      url: 'https://www.ahus.no/om-oss/offentlig-postjournal',
      filenameRegex: /(https.*?\.pdf)/g,
      request: request,
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'AHUS-$1',
          },
        ],
      },
    };
  },
};
