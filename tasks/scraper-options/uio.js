/* Copyright 2019 Schibsted */

var request = require('request');

module.exports = {
  get: function() {
    return {
      s3: {
        bucket: 'innsyn',
        folder: 'UiO',
      },
      sourceId: 8,
      url: 'https://www.uio.no/om/journal/',
      anchorTagSelector: 'td a[href]',
      filenamePattern: /\d{4}\/.*\.pdf/,
      basePath: 'https://www.uio.no',
      request: request,
      toFilenameSettings: {
        renamePatterns: [
          {
            from: '/',
            to: '-',
            continueToNext: true,
          },
          {
            from: /(.*)/,
            to: 'UIO-$1',
          },
        ],
      },
    };
  },
};
