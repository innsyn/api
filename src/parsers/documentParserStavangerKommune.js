/* Copyright 2019 Schibsted */

let cheerio = require('cheerio');

/***
 *
 * Can parse: HTML pages with search results from http://byr-journal.cloudapp.net/
 *
 */
module.exports = {
  /***
   * The parse method for "Byradet" (Oslo) will extract data from a HTML page served in the raw parameter.
   * To determine if the parser was able to parse the file, check the returnValue.parsed field
   * (true|false).
   */
  parse: function(raw) {
    try {
      let $ = cheerio.load(raw);

      let caseNumbers = $('.document-rows .data-column div h3 a').map(
        function() {
          return $(this)
            .text()
            .trim();
        },
      );

      let documentTitles = $('.document-rows .data-column div h3')
        .clone()
        .children()
        .remove()
        .end()
        .map(function() {
          return $(this)
            .text()
            .trim();
        });

      if (caseNumbers.length === 0) {
        caseNumbers = []; // creating ordinary array
        // some pages does not have a clickable case number, extracting first part of the document title instead
        // (should be the case number)
        for (let dx = 0; dx < documentTitles.length; dx++) {
          caseNumbers.push(
            documentTitles[dx].substring(0, documentTitles[dx].indexOf(' ')),
          );
          documentTitles[dx] = documentTitles[dx]
            .substring(documentTitles[dx].indexOf(' '))
            .trim();
        }
      }

      let documentDates = $(
        '.document-rows .journal-details dl:first-child dd',
      ).map(function() {
        return $(this).text();
      });
      let recordedDates = $(
        '.document-rows .data-column div dl:nth-child(1) dd',
      ).map(function() {
        return $(this).text();
      });
      let caseTitles = $(
        '.document-rows .data-column div dl:nth-child(2) dd',
      ).map(function() {
        return $(this).text();
      });
      let senderOrReceivers = $(
        '.document-rows .data-column div dl:nth-child(3) dd',
      ).map(function() {
        return $(this).text();
      });
      let senderOrReceiverLabels = $(
        '.document-rows .data-column div dl:nth-child(3) dt',
      ).map(function() {
        return $(this).text();
      });
      let documentListsContainers = $(
        '.document-rows .data-permitted .journal-details ul',
      ).map(function() {
        return $(this)[0];
      });
      let caseOfficers = $(
        '.document-rows .journal-details dl:nth-child(5) dd',
      ).map(function() {
        return $(this).text();
      });
      let caseResponsibles = $(
        '.document-rows .journal-details dl:nth-child(6) dd',
      ).map(function() {
        return $(this).text();
      });
      let legalParagraphs = $(
        '.document-rows .journal-details dl:nth-child(4) dd',
      ).map(function() {
        return $(this).text();
      });
      let documentTypes = $(
        '.document-rows .journal-details dl:nth-child(3) dd',
      ).map(function() {
        return $(this).text();
      });

      let documentUrlLists = getLists(documentListsContainers);

      let items = [];

      for (let i = 0; i < caseNumbers.length; i++) {
        let item = {
          caseNumber: caseNumbers[i],
          documentTitle: documentTitles[i],
          documentDate: getDateFromString(documentDates[i]),
          caseTitle: caseTitles[i],
          recordedDate: getDateFromString(recordedDates[i]),
          caseOfficer: caseOfficers[i].trim(),
          caseResponsible: caseResponsibles[i].trim(),
          legalParagraph: legalParagraphs[i],
          documentType: documentTypes[i],
          senderOrReceiver: senderOrReceivers[i].trim(),
          senderOrReceiverLabel: senderOrReceiverLabels[i],
          sender: documentTypes[i] === 'I' ? senderOrReceivers[i] : '',
          receiver: documentTypes[i] === 'U' ? senderOrReceivers[i] : '',
          // Fields below are not available
          classification: '',
        };

        item.documentUrls = documentUrlLists[i];

        items.push(item);
      }

      return { parsed: items.length > 0, items: items };
    } catch (e) {
      return { parsed: false, error: e };
    }

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

    function getLists(documentListsContainers) {
      let result = [];
      //console.log(documentListsContainers.length);
      //let counter = 1;
      for (let el in documentListsContainers) {
        if (
          documentListsContainers.hasOwnProperty(el) &
          Number.isInteger(parseInt(el))
        ) {
          let current = [];
          result.push(current);
          //console.log("element #" + counter++);
          for (let c in documentListsContainers[el].children) {
            if ((documentListsContainers[el].children[c].name = 'li')) {
              for (let x in documentListsContainers[el].children[c]) {
                if (
                  documentListsContainers[el].children[c][x] &&
                  documentListsContainers[el].children[c][x].attribs &&
                  documentListsContainers[el].children[c][x].attribs.onclick
                ) {
                  let url = extractUrlPart(
                    documentListsContainers[el].children[c][x].attribs.onclick,
                  );

                  // don't add if it already exist in the array
                  let value = current.find(function(val) {
                    return url === val;
                  });
                  if (value === undefined) {
                    current.push(url);
                    //console.log(url);
                  }
                }
              }
            }
          }
          //console.log("found " + current.length + " files");
        }
      }
      return result;
    }

    function extractUrlPart(value) {
      //return value;
      return value.match(/\('(.*?)'/)[1];
    }
  },
};
