/* Copyright 2019 Schibsted */

var request = require('request');

module.exports = {
  get: function() {
    return {
      s3: {
        bucket: 'innsyn',
        folder: 'Helse Stavanger HF',
      },
      sourceId: 139,
      url: 'https://helse-stavanger.no/om-oss/offentlig-journal',
      filenameRegex: /(https.*?\.pdf)/g,
      request: request,
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'SUS-$1',
          },
        ],
      },
    };
  },
};
