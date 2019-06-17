/* Copyright 2019 Schibsted */

module.exports = {
  /***
   * Gets a value from a string based on the regex patterns in regexListPrioritized. The list will be
   * used from top to bottom, and as soon as a match is found it is returned. A empty string will be
   * returned when there is no match.
   *
   * IMPORTANT: The regex is supposed to have a single match. The match with index 1 will be returned.
   *
   * @param extractFromString The string to search for a match in.
   * @param regexListPrioritized List of regular expressions.
   */
  getValueFromString: function(extractFromString, regexListPrioritized) {
    var result;

    for (regex of regexListPrioritized) {
      result = extractFromString.match(regex);
      if (
        result !== null &&
        result.length > 0 &&
        typeof result[1] !== 'undefined'
      ) {
        return result[1];
      }
    }
    return '';
  },

  /***
   * Gets a list of matching values for the supplied regular expressions. Works the same as
   * getValueFromString, except all matches in extractFromString are returned.
   *
   * Note that the regular expressions should be strict to avoid matching other
   * values as well.
   *
   * @param extractFromString
   * @param regexListPrioritized
   * @returns {Array}
   */
  getValuesFromString: function(
    extractFromString,
    regexListPrioritized,
    allowEmpty,
    allowNewLines,
  ) {
    if (!allowEmpty) allowEmpty = false;
    if (!allowNewLines) allowNewLines = false;

    var results = [];
    var currentPosition = 0;
    var searchIn = extractFromString;
    var doSearch = true;

    while (doSearch) {
      searchIn = searchIn.substring(currentPosition);
      var tempResults = [];
      for (regex of regexListPrioritized) {
        result = searchIn.match(regex);
        if (
          result !== null &&
          result.length > 0 &&
          (allowEmpty ? true : result[1] !== '')
        ) {
          tempResults.push(result);
        }
      }

      if (tempResults.length === 0) {
        doSearch = false;
      } else {
        var result,
          lowestPosition = searchIn.length;

        tempResults.forEach(function(match) {
          if (match.index < lowestPosition) {
            lowestPosition = match.index;
            result = match;
          }
        });

        if (!(Array.isArray(result) && result.length > 1)) {
          throw new Error('No match found. Did you add a capture group?');
        }
        // pick the first match that is not undefined
        var data = '';
        for (var index = 1; index < result.length; index++) {
          if (result[index] !== undefined) {
            data = result[index];
            break;
          }
        }

        // cleanup
        data = allowNewLines ? data : this.removeNewLines(data);
        results.push(data);

        // move to the next character
        currentPosition = lowestPosition + result[0].length;

        // move past the next line feed -- might help in some situations
        // for case numbers where other case numbers are referred to in
        // the document title. Obviously not perfect.
        var nextLineFeed = searchIn.substring(currentPosition).match(/.*\n/);
        if (nextLineFeed && nextLineFeed.length > 0) {
          currentPosition = currentPosition + nextLineFeed[0].length;
        }
      }
    } // repeat until all matches are found

    return results;
  },

  removeNewLines: function(data) {
    return data.replace(/\n/g, ' ').trim();
  },
};
