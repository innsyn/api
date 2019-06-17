/* Copyright 2019 Schibsted */

const cheerio = require('cheerio');
const { DateTime } = require('luxon');

const getValue = function($, row, path) {
  return $(row)
    .clone()
    .find(path)
    .children()
    .remove()
    .end()
    .text()
    .replace(/(\r\n|\n|\r)/gm, '')
    .replace(/ {2,}/g, ' ')
    .trim();
};

const isRelative = function(url) {
  return !/^https?:\/\//i.test(url);
};

const concatenate = function(parts) {
  return parts.map(part => part.replace(/^\/+|\/+$/, '')).join('/');
};

// Check if the documentLink is relative, if so concatenate it to the baseUrl.
const sanitizeDocumentLink = function(item, config) {
  if (
    item.hasOwnProperty('documentLink') &&
    item.documentLink &&
    isRelative(item.documentLink)
  ) {
    if (!config.baseUrl) {
      throw new Error(
        'Document link seems to be relative so a baseUrl needs to be set for generating the full URL.',
      );
    }

    const documentLink = concatenate([config.baseUrl, item.documentLink]);

    return {
      ...item,
      documentLink,
    };
  }

  return item;
};

const fallback = function(item, config, request) {
  return config.fields
    .filter(field => typeof field.fallback === 'function')
    .reduce((data, { name, fallback }) => {
      return {
        ...data,
        [name]: fallback(data, request),
      };
    }, item);
};

module.exports = {
  parse: function(page, config) {
    try {
      const $ = cheerio.load(page.content);

      const { container, fields } = config;

      const rows = $(container).get();

      // TODO: Cleanup!
      const items = rows
        .map(row => {
          return fields.reduce((data, { name, path, type, before, after }) => {
            let value;

            if (typeof before === 'function') {
              value = before(value);
            }

            if (typeof path === 'function') {
              value = path($, row, data);
            } else if (Array.isArray(path)) {
              value = path
                .map(item => getValue($, row, item))
                .find(value => value);
            } else {
              value = getValue($, row, path);
            }

            if (type && type.name === 'date') {
              value =
                type.config && type.config.format
                  ? DateTime.fromFormat(value.toString(), type.format, {
                      setZone: 'Europe/Oslo',
                    }).toSQLDate()
                  : DateTime.fromFormat(value, 'dd.MM.yyyy', {
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
          }, {});
        })
        .map(item => sanitizeDocumentLink(item, config))
        // .map(item => after(item, config))
        .map(item => fallback(item, config, page.request));

      return { parsed: items.length > 0, items: items };
    } catch (e) {
      return { parsed: false, items: [], error: e };
    }
  },
};
