/* Copyright 2019 Schibsted */

let utils = require('./taskUtils');

module.exports = { rename };

function rename(filename, html, options) {
  if (
    options.toFilenameSettings &&
    options.toFilenameSettings.renamePatterns &&
    options.toFilenameSettings.renamePatterns.length > 0
  ) {
    for (let renamePattern of options.toFilenameSettings.renamePatterns) {
      let tmp = filename.replace(renamePattern.from, renamePattern.to);
      tmp = utils.replacePlaceholders(tmp);
      let custom = utils.extractCustomFilenameVariableValue(options, html);
      if (custom) {
        tmp = tmp.replace('{CUSTOM}', custom);
      }
      tmp = tmp.replace('{RANDOM}', getRandomString());

      if (tmp !== filename) {
        filename = tmp;
        if (!renamePattern.continueToNext) break;
      }
    }
  }
  return filename;
}

let getRandomString = function() {
  return Math.random()
    .toString(36)
    .slice(2)
    .substring(0, 4);
};
