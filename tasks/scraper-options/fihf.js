/* Copyright 2019 Schibsted */

var request = require('request');

module.exports = {
  get: function() {
    return {
      s3: {
        bucket: 'innsyn',
        folder: 'Finmarkssykehuset HF',
      },
      sourceId: 131,
      url: 'https://finnmarkssykehuset.no/om-oss/media/postjournal',
      filenameRegex: /(https.*?\.pdf)/g,
      request: request,
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'FIHF-$1',
          },
        ],
      },
    };
  },
};
