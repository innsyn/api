/* Copyright 2019 Schibsted */

var request = require('request');

module.exports = {
  get: function() {
    return {
      s3: {
        bucket: 'innsyn',
        folder: 'Sykehuspartner HF',
      },
      sourceId: 130,
      url: 'https://sykehuspartner.no/om-oss/offentlig-postjournal',
      filenameRegex: /(https.*?\.pdf)/g,
      request: request,
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'SPHF-$1',
          },
        ],
      },
    };
  },
};
