/* Copyright 2019 Schibsted */

var request = require('request');

module.exports = {
  get: function() {
    return {
      s3: {
        bucket: 'innsyn',
        folder: 'USN',
      },
      sourceId: 172,
      type: 'json',
      urlPath: 'href',
      titlePath: 'name',
      // JSON content
      url:
        'https://www.usn.no/xmlhttprequest.php?service=foldersandfiles.filelist&tileInstanceId=6944&cId=6765&folderId=1174&_=1537365847136',
      request: request,
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'USN-$1',
          },
        ],
      },
    };
  },
};
