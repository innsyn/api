/* Copyright 2019 Schibsted */

require('dotenv').config({ silent: true });
var request = require('request');

module.exports = {
  get: function() {
    return {
      s3: {
        bucket: 'innsyn',
        folder: 'Kirkerådet',
      },
      sourceId: 16,
      url:
        'https://kirken.no/nb-NO/om-kirken/kontakt-oss/pressekontakt/postjournal-for-kirkeradet/',
      anchorTagSelector: '.attachment ul li a[href$=pdf]',
      basePath: 'https://kirken.no',
      request: request,
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'KR-$1',
          },
        ],
      },
    };
  },
};
