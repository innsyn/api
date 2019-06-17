/* Copyright 2019 Schibsted */

var _ = require('lodash');
var baseConfig = require('./base-email-config');

module.exports = {
  get: function() {
    let config = {
      sourceId: 20,
      filter: {
        from: 'tarjei.leer-salvesen@schibsted.com',
        subject: 'PDI03',
      },
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'PDI03-$1',
          },
        ],
      },
    };

    let final = _.merge({}, baseConfig.get(), config);
    return final;
  },
};
