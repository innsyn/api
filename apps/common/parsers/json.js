/* Copyright 2019 Schibsted */

const { DateTime } = require('luxon');
const _ = require('lodash');

module.exports = {
  parse: function(page, config) {
    try {
      const rows = [];

      const { fields } = config;

      typeof config.before === 'function'
        ? rows.push(...config.before(page.content))
        : rows.push(...page.content);

      // TODO: Cleanup!
      const items = rows.map(row =>
        fields.reduce((data, { name, path, type, before, after }) => {
          let value;

          if (typeof before === 'function') {
            value = before(value);
          }

          if (typeof path === 'function') {
            value = path(row, data);
          } else {
            value = _.get(row, path, '');
          }

          if (Array.isArray(value)) {
            value = value.join(', ');
          }

          // TODO: Fix weird dates such as 1-01-01. Should have fall back to?
          if (type && type.name === 'date') {
            value =
              type.config && type.config.format
                ? DateTime.fromFormat(value.toString(), type.config.format, {
                    setZone: 'Europe/Oslo',
                  }).toSQLDate()
                : DateTime.fromISO(value, {
                    setZone: 'Europe/Oslo',
                  }).toSQLDate();
          }

          if (typeof after === 'function') {
            value = after(value, data);
          }

          return {
            ...data,
            [name]: value,
          };
        }, {}),
      );

      return { parsed: items.length > 0, items: items };
    } catch (e) {
      return { parsed: false, items: [], error: e };
    }
  },
};
