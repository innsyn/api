/* Copyright 2019 Schibsted */

var request = require('request');

module.exports = {
  get: function() {
    return {
      s3: {
        bucket: 'innsyn',
        folder: 'Helse Midt-Norge RHF',
      },
      sourceId: 146,
      url: 'https://helse-midt.no/om-oss/offentlig-postjournal',
      filenameRegex: /(https.*?\.pdf)/g,
      request: request,
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'HMN-$1',
          },
        ],
      },
    };
  },
};
