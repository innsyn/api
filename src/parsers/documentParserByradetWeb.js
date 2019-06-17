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

      let documentDates = $(
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
      let documentUrlLists = getLists(documentListsContainers);

      let items = [];

      for (let i = 0; i < caseNumbers.length; i++) {
        let item = {
          documentType: '',
          caseNumber: caseNumbers[i],
          documentTitle: documentTitles[i],
          documentDate: getDateFromString(documentDates[i]),
          caseTitle: caseTitles[i],
          senderOrReceiver: senderOrReceivers[i],
          senderOrReceiverLabel: senderOrReceiverLabels[i],
          sender: '',
          receiver: '', // default value

          // Fields below are not available
          recordedDate: '',
          caseOfficer: '',
          caseResponsible: '',
          classification: '',
          legalParagraph: '',
        };

        if (item.senderOrReceiverLabel == 'Til') {
          item.receiver = item.senderOrReceiver;
          item.documentType = 'U';
        } else {
          item.sender = item.senderOrReceiver;
          item.documentType = 'I';
        }

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
