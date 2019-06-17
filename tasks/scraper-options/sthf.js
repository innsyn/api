/* Copyright 2019 Schibsted */

var request = require('request');

module.exports = {
  get: function() {
    return {
      s3: {
        bucket: 'innsyn',
        folder: 'Sykehuset Telemark HF',
      },
      sourceId: 133,
      url: 'https://www.sthf.no/om-oss/offentlig-postjournal',
      filenameRegex: /(https.*?\.pdf)/g,
      request: request,
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'STHF-$1',
          },
        ],
      },
    };
  },
};
