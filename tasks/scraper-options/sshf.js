/* Copyright 2019 Schibsted */

var request = require('request');

module.exports = {
  get: function() {
    return {
      s3: {
        bucket: 'innsyn',
        folder: 'Sørlandet Sykehus HF',
      },
      sourceId: 103,
      url: 'https://sshf.no/om-oss/offentlig-postjournal',
      filenameRegex: /<td>(https.*?\.pdf)<\/td>/g,
      basePath: 'https://sshf.no',
      request: request,
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'SSHF-$1',
          },
        ],
      },
    };
  },
};
