/* Copyright 2019 Schibsted */

let cheerio = require('cheerio');
let $ = null;
/***
 *
 * Can parse: HTML pages with search results from http://einnsyn.stortinget.no/
 *
 */
module.exports = {
  /***
   * The parse method will extract data from a HTML page served in the raw parameter.
   * To determine if the parser was able to parse the file, check the returnValue.parsed field
   * (true|false).
   */
  parse: function(raw, options) {
    options = options || {};

    try {
      $ = cheerio.load(raw);

      let parsed = {};

      let caseNumberOnly = $(
        options.caseNumberSelector || '.tdRegistryCasenummer > a',
      )
        .text()
        .trim();
      let documentNumber = $(
        options.documentNumberSelector ||
          'div.detailsmetadatablock.leftside > div:nth-child(2) > div.display-field',
      )
        .text()
        .trim();
      parsed.caseNumber = caseNumberOnly + '-' + documentNumber;
      parsed.documentTitle = $('td.content-description > a').text();
      parsed.recordedDate = getDateFromString(
        $('td.tdJournalDato')[0].children[2].data.trim(),
      );
      parsed.documentDate = getDateFromString(
        $(
          'div.detailsmetadatablock.leftside > div:nth-child(3) > div.display-field',
        )
          .text()
          .trim(),
      );
      parsed.documentType = $(
        '#main > fieldset:nth-child(2) > div > div > table > tbody > tr > td.td-documenttype',
      )
        .text()
        .trim();

      let sendersAndReceiversTable = $(
        'fieldset:nth-child(5) > div > table > tbody tr td',
      ).map(function() {
        return $(this)
          .text()
          .trim();
      });

      let sendersAndReceivers = [];
      let current = {};

      for (let index = 0; index < sendersAndReceiversTable.length; index++) {
        if (index % 3 === 0) {
          // name
          current.name = sendersAndReceiversTable[index];
        }
        if (index % 3 === 2) {
          current.isSender = sendersAndReceiversTable[index].startsWith(
            'Avsend',
          );
          sendersAndReceivers.push(current);
          current = {};
        }
      }

      parsed.sender = sendersAndReceivers
        .filter(function(item) {
          if (item.isSender) {
            return item;
          }
        })
        .map(function(item) {
          return item.name;
        })
        .join(', ');
      parsed.receiver = sendersAndReceivers
        .filter(function(item) {
          if (item.isSender === false) {
            return item;
          }
        })
        .map(function(item) {
          return item.name;
        })
        .join(', ');
      parsed.legalParagraph = $(
        'div.detailsmetadatablock.rightSide > div:nth-child(3) > div.display-field',
      )
        .text()
        .trim();
      parsed.unit = $(
        'div.detailsmetadatablock.leftside > div:nth-child(4) > div.display-field',
      )
        .text()
        .trim();
      parsed.caseOfficer = $(
        'div.detailsmetadatablock.rightSide > div:nth-child(1) > div.display-field',
      )
        .text()
        .trim();

      parsed.documentType = parsed.documentType.startsWith('Inngående')
        ? 'I'
        : parsed.documentType.startsWith('Utgående')
        ? 'U'
        : parsed.documentType.startsWith('Internt')
        ? 'X'
        : parsed.documentType;

      parsed.caseResponsible = '';
      parsed.classification = '';
      parsed.caseTitle = ''; // Not available on this page

      return { parsed: true, items: [parsed] };
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
