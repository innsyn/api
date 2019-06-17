/* Copyright 2019 Schibsted */

var request = require('request');

module.exports = {
  get: function() {
    return {
      s3: {
        bucket: 'innsyn',
        folder: 'NMBU',
      },
      sourceId: 14,
      url: 'https://www.nmbu.no/om/adm/poa/dokumentsentret/offentlig-journal',
      anchorTagSelector: '.download-file li a[href]',
      basePath: 'https://www.nmbu.no',
      useTitleAttributeAsFilename: true,
      request: request,
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'NMBU-$1',
          },
        ],
      },
    };
  },
};
