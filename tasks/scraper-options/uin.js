/* Copyright 2019 Schibsted */

var request = require('request');

module.exports = {
  get: function() {
    return {
      s3: {
        bucket: 'innsyn',
        folder: 'Nord Universitet',
      },
      sourceId: 13,
      url:
        'https://www.nord.no/no/om-oss/universitetet/offentligjournal/Sider/default.aspx',
      anchorTagSelector: 'a[href$=pdf]',
      basePath: 'https://www.nord.no',
      request: request,
      toFilenameSettings: {
        customFilenameRegex: /Offentlig journal (\d{4})/,
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'UIN-{CUSTOM}-$1',
          },
        ],
      },
    };
  },
};
