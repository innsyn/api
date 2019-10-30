/* Copyright 2019 Schibsted */

var _ = require('lodash');
var baseConfig = require('./base-email');

module.exports = {
  get: function() {
    let config = {
      sourceId: 24,
      filter: {
        from: 'tarjei.leer-salvesen@schibsted.com',
        subject: 'PDI07',
      },
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'PDI07-$1',
          },
        ],
      },
    };

    let final = _.merge({}, baseConfig.get(), config);
    return final;
  },
};
