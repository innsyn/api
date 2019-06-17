/* Copyright 2019 Schibsted */

var request = require('request');

module.exports = {
  get: function() {
    return {
      s3: {
        bucket: 'innsyn',
        folder: 'Helse Nord-Trøndelag HF',
      },
      sourceId: 135,
      url: 'https://hnt.no/om-oss/media/postjournal',
      filenameRegex: /(https.*?\.pdf)/g,
      request: request,
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'HNT-$1',
          },
        ],
      },
    };
  },
};
