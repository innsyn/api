/* Copyright 2019 Schibsted */

var request = require('request');

module.exports = {
  get: function() {
    return {
      s3: {
        bucket: 'innsyn',
        folder: 'St. Olavs Hospital HF',
      },
      sourceId: 142,
      url: 'https://stolav.no/om-oss/media/postjournal',
      filenameRegex: /(https.*?\.pdf)/g,
      request: request,
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'STO-$1',
          },
        ],
      },
      comment:
        "At the time of writing, paging won't work with this source. Even though paging is indicated " +
        'in the address line, a client script is handling the logic in the browser. To make this work, a headless ' +
        'browser is required.',
    };
  },
};
