/* Copyright 2019 Schibsted */

let cheerio = require('cheerio');

/***
 *
 * Can parse: -
 *
 */
module.exports = {
  /***
   * The parse method for Mattilsynet will extract data from a HTML page served in the raw parameter.
   * To determine if the parser was able to parse the file, check the returnValue.parsed field
   * (true|false).
   */
  parse: function(raw) {
    try {
      let $ = cheerio.load(raw);
      let entryTexts = $('#articleContent p')
        .html()
        .replace(/<hr>/g, '\n\n\n')
        .replace(/<br>\n/g, '')
        .replace(/<br>/g, ' ')
        .split('\n\n');

      // picking end date for the period as recorded date for all entries
      let common = $('div .twelve h1').text();
      let recordedDate = getDateFromString(getValue(common, /- ([^]+?)\s/));
      let unit = getValue(common, /(\D*)$/);

      // first element is a heading
      entryTexts.shift();

      let items = [];
      for (let i = 0; i < entryTexts.length; i++) {
        let entry = {};

        // setting common values
        entry.unit = unit;
        entry.recordedDate = recordedDate;

        // decode html text, e.g.  L&#xD8;LAND to LØLAND
        entryTexts[i] = $('<div/>')
          .html(entryTexts[i])
          .text();

        entry.caseNumber = getValue(entryTexts[i], /([\S]+?)\s/);
        entry.documentTitle = getValue(entryTexts[i], /Dok: ([^]+?) Lnr:/);
        entry.caseTitle = getValue(entryTexts[i], /Sak: ([^]+?) Dok:/);
        entry.documentType = getValue(entryTexts[i], /\s([U|I|X])\s/);
        entry.documentDate = getDateFromString(
          getValue(entryTexts[i], /Datert: ([\S]+?)\s/),
        );
        entry.caseResponsible = getValue(entryTexts[i], /Saksans: ([\S]+?)\s/);
        entry.legalParagraph = getValue(entryTexts[i], /U\.off: ([^]+?) Grad:/);

        if (
          entryTexts[i].includes('Til:  U.off:') ||
          entryTexts[i].includes('Fra:  U.off:')
        ) {
          // empty sender/receiver
          entry.receiver = entry.sender = '';
        } else {
          entry.receiver = getValue(entryTexts[i], /Til: ([^]+?) Sak:/);
          entry.sender = getValue(entryTexts[i], /Fra: ([^]+?) Sak:/);

          // cLeanup
          entry.receiver = entry.receiver.split('U.off:')[0].trim();
          entry.sender = entry.sender.split('U.off:')[0].trim();
        }

        entry.classification = '';
        entry.caseOfficer = '';

        items.push(entry);
      }

      return { parsed: true, items: items };
    } catch (e) {
      return { parsed: false, error: e };
    }
  },
};

/***
 * Converts a string with the format like "24.10.2012"  to a date object.
 */
function getDateFromString(dateString) {
  try {
    let dateParts = dateString.split('.');
    let day = dateParts[0];
    let month = dateParts[1];
    let year = dateParts[2];
    let result = new Date('"' + year + '/' + month + '/' + day + '"');
    if (result == 'Invalid Date') {
      return '';
    }
    return result;
  } catch (e) {
    return '';
  }
}

function getValue(text, regex) {
  let result = text.match(regex);
  if (result && result.length > 0) {
    return result[1].trim();
  }
  return '';
}
