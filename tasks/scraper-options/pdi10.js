/* Copyright 2019 Schibsted */

var _ = require('lodash');
var baseConfig = require('./base-email');

module.exports = {
  get: function() {
    let config = {
      sourceId: 27,
      filter: {
        from: 'tarjei.leer-salvesen@schibsted.com',
        subject: 'PDI10',
      },
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'PDI10-$1',
          },
        ],
      },
    };

    let final = _.merge({}, baseConfig.get(), config);
    return final;
  },
};
