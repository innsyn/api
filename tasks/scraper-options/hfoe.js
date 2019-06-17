/* Copyright 2019 Schibsted */

var request = require('request');

module.exports = {
  get: function() {
    return {
      s3: {
        bucket: 'innsyn',
        folder: 'Helse Førde HF',
      },
      sourceId: 140,
      url:
        'https://helse-forde.no/om-oss/offentleg-postjournal-helse-forde#postjournalar-2017:',
      filenameRegex: /(https.*?\.pdf)/g,
      request: request,
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'HFOE-$1',
          },
        ],
      },
    };
  },
};
