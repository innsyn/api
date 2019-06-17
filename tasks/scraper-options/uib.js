/* Copyright 2019 Schibsted */

var request = require('request');

module.exports = {
  get: function() {
    return {
      s3: {
        bucket: 'innsyn',
        folder: 'UiB',
      },
      sourceId: 9,
      url: 'https://offjournal.app.uib.no/',
      anchorTagSelector: '#calList td a',
      basePath: 'https://offjournal.app.uib.no',
      useTitleAttributeAsFilename: true,
      request: request,
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'UIB-$1',
          },
        ],
      },
    };
  },
};
