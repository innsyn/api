/* Copyright 2019 Schibsted */

var request = require('request');

module.exports = {
  get: function() {
    return {
      s3: {
        bucket: 'innsyn',
        folder: 'Helgelandssykehuset HF',
      },
      sourceId: 136,
      url: 'https://helgelandssykehuset.no/om-oss/offentlig-postjournal',
      filenameRegex: /(https.*?\.pdf)/g,
      request: request,
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'HSHF-$1',
          },
        ],
      },
    };
  },
};
