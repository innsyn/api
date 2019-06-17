/* Copyright 2019 Schibsted */

const _ = require('lodash');
const baseConfig = require('./base-email-config');

module.exports = {
  get: function() {
    let config = {
      sourceId: 18,
      filter: {
        from: 'tarjei.leer-salvesen@schibsted.com',
        subject: 'PDI01',
      },
      toFilenameSettings: {
        renamePatterns: [
          {
            from: /(.*)/,
            to: 'PDI01-$1',
          },
        ],
      },
    };

    let final = _.merge({}, baseConfig.get(), config);
    return final;
  },
};
