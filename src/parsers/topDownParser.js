/* Copyright 2019 Schibsted */

/***
 * Top down parser -- will try to find data based on lists of field names with a list of regular
 * expressions for each field. If all the data fields have the same number of values it is expected
 * that the data has been gathered successfully.
 * @type {{}}
 */
module.exports = {
  parse: function(raw, options) {
    var helper = require('./../helpers/documentParserHelper');

    var result = {};

    raw = this.removeNoise(raw, options);

    options.fields.forEach(function(field) {
      result[field.name] = helper.getValuesFromString(
        raw,
        field.regexList,
        true,
        field.allowNewLines,
      );
    });

    // make sure case numbers are unique
    /*for (var i = 0; i < result.caseNumber.length; i++) {
      if (i > 0) {
        for (var x = 0; x < i; x++) {
          if (result.caseNumber[i] == result.caseNumber[x]) {
            console.error(result.caseNumber[i]);
            return { parsed: false, error: { message: "Duplicate case numbers found: " + result.caseNumber[i] } };
          }
        }
      }
    }*/

    var parsed = true;
    var items = [];
    var errorMessage = '';

    var length = this.getLength(result);

    if (length === -1) {
      parsed = false;
      errorMessage = 'Uneven number of items';
    } else if (length === 0) {
      parsed = false;
      errorMessage = 'No items found in source';
    } else {
      // init items array
      for (var i = 0; i < length; i++) {
        items.push({});
      }

      // fill her up!
      for (var index = 0; index < length; index++) {
        for (var field in result) {
          items[index][field] = result[field][index];
        }
      }
    }

    return {
      parsed: parsed,
      items: items,
      error: { message: errorMessage },
    };
  },

  getLength: function(result) {
    var previousLength = -1;
    for (var field in result) {
      if (previousLength !== -1) {
        if (result[field].length !== previousLength) {
          return -1;
        }
      }
      previousLength = result[field].length;
    }
    return previousLength;
  },

  removeNoise: function(raw, options) {
    if (!options.noise) return raw;

    options.noise.forEach(function(item) {
      raw = raw.replace(item, '');
    });

    return raw;
  },
};
