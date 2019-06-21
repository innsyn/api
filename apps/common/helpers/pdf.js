const fs = require('fs');
const util = require('util');
const uuid = require('uuid/v4');
const exec = util.promisify(require('child_process').exec);
const { EXTRACTION_ERROR_STATUS } = require('../constants');

const parseFile = async function(file) {
  try {
    const outputFilename = `./${uuid()}`;

    await exec(`pdftotext -layout -enc UTF-8 ${file} ${outputFilename}`);

    return fs.promises.readFile(outputFilename, { encoding: 'UTF-8' });
  } catch (error) {
    return EXTRACTION_ERROR_STATUS;
  }
};

module.exports = { parseFile };
