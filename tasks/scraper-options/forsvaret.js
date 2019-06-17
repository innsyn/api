/* Copyright 2019 Schibsted */

var _ = require('lodash');
var baseConfig = require('./base-email-config');

module.exports = {
  get: function() {
    let config = {
      filter: {
        from: '@mil.no',
      },
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: '$1',
          },
        ],
      },
    };

    let final = _.merge({}, baseConfig.get(), config);
    return final;
  },
};
