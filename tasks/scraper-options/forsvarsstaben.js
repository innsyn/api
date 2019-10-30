/* Copyright 2019 Schibsted */

var _ = require('lodash');
var baseConfig = require('./base-email');

module.exports = {
  get: function() {
    let config = {
      sourceId: 108,
      filter: {
        from: 'tarjei.leer-salvesen@schibsted.com',
        subject: 'FST',
      },
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'FST-$1',
          },
        ],
      },
    };

    let final = _.merge({}, baseConfig.get(), config);
    return final;
  },
};
