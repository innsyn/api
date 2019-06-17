/* Copyright 2019 Schibsted */

const request = require('request');

module.exports = {
  get: function() {
    return {
      s3: {
        bucket: 'innsyn',
        folder: 'NRK',
      },
      sourceId: 171,
      url: 'https://www.nrk.no/innsyn/offentlig-journal-1.8140670',
      filenameRegex: /(https.*?\.pdf)/g,
      request: request,
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'NRK-$1',
          },
        ],
      },
    };
  },
};
