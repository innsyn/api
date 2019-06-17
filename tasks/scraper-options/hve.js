/* Copyright 2019 Schibsted */

var request = require('request');

module.exports = {
  get: function() {
    return {
      s3: {
        bucket: 'innsyn',
        folder: 'Helse Vest RHF',
      },
      sourceId: 145,
      url: 'https://helse-vest.no/om-oss/offentleg-postjournal',
      filenameRegex: /(https.*?\.pdf)/g,
      request: request,
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'HVE-$1',
          },
        ],
      },
    };
  },
};
