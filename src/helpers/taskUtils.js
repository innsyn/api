/* Copyright 2019 Schibsted */

/**
 * Utility functions for tasks.
 * */

module.exports = {
  replacePlaceholders: function(text, options) {
    let result = text || '';

    if (!options) {
      result = result.replace(
        /\{FULL_YEAR\}/g,
        new Date().getFullYear().toString(),
      );
    }

    if (options && options.date) {
      result = result.replace(
        /\{FULL_YEAR\}/g,
        options.date.getFullYear().toString(),
      );
      result = result.replace(
        /\{MONTH_NAME_DK\}/g,
        this.getMonthName(options.date.getMonth(), { lang: 'dk' }),
      );
      result = result.replace(/\{DAY\}/g, options.date.getDate().toString());
      result = result.replace(
        /{FULL_DATE}/g,
        this.getDateAsString(options.date, options.dateFormat),
      );
    }

    return result;
  },
  extractCustomFilenameVariableValue: function(options, html) {
    if (
      options.toFilenameSettings &&
      options.toFilenameSettings.customFilenameRegex
    ) {
      let result = html.match(options.toFilenameSettings.customFilenameRegex);
      if (result !== null && result.length > 0) {
        // Expecting one capture group
        return result[1];
      }
    }
    return '';
  },
  getMonthName: function(monthNumber, options) {
    if (options && options.lang) {
      if (options.lang === 'dk') {
        let monthNames = [
          'januar',
          'februar',
          'marts',
          'april',
          'maj',
          'juni',
          'juli',
          'august',
          'september',
          'oktober',
          'november',
          'december',
        ];

        return monthNames[monthNumber - 1];
      }
      return '';
    }
    return '';
  },
  getDateAsString: function(date, format) {
    const year = date.getFullYear().toString();
    const month = ('00' + (date.getMonth() + 1)).slice(-2);
    const day = ('00' + date.getDate()).slice(-2);

    let dateFormatted;

    switch (format) {
      case 'yyyy-mm-dd':
        dateFormatted = `${year}-${month}-${day}`;
        break;
      case 'dd.mm.yyyy':
        dateFormatted = `${day}.${month}.${year}`;
        break;
      case 'yyyymmdd':
        dateFormatted = `${year}${month}${day}`;
        break;
      default:
        dateFormatted = `${day}.${month}.${year}`;
    }

    return dateFormatted;
  },
  flattenJson: flatten,
  getDateFromNumberFormat: function(number, format) {
    let date = new Date(1900, 0, 1);
    switch (format) {
      case 'yyyymmdd':
        let d = number.toString();
        const year = parseInt(d[0] + d[1] + d[2] + d[3]);
        const month = parseInt(d[4] + d[5]) - 1;
        const day = parseInt(d[6] + d[7]);
        date = new Date(year, month, day);
        break;
      default:
        console.log(`Format '${format} not supported`);
    }
    return date;
  },
};

function flatten(obj, path = '') {
  if (!(obj instanceof Object)) return { [path.replace(/\.$/g, '')]: obj };

  return Object.keys(obj).reduce((output, key) => {
    return obj instanceof Array
      ? { ...output, ...flatten(obj[key], path + '[' + key + '].') }
      : { ...output, ...flatten(obj[key], path + key + '.') };
  }, {});
}
