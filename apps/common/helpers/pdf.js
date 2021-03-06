const shellescape = require('shell-escape');
const fs = require('fs');
const util = require('util');
const uuid = require('uuid/v4');
const exec = util.promisify(require('child_process').exec);
const { EXTRACTION_ERROR_STATUS } = require('../constants');

const parseFile = async function(file) {
  try {
    const outputFilename = `./${uuid()}`;

    const args = [
      'pdftotext',
      '-simple',
      '-enc',
      'UTF-8',
      file,
      outputFilename,
    ];

    await exec(shellescape(args));

    const data = await fs.promises.readFile(outputFilename, {
      encoding: 'UTF-8',
    });

    await fs.promises.unlink(outputFilename);

    return data;
  } catch (error) {
    return EXTRACTION_ERROR_STATUS;
  }
};

module.exports = { parseFile };
