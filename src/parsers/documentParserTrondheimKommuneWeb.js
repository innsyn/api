/* Copyright 2019 Schibsted */

let cheerio = require('cheerio');

/***
 *
 * Can parse: HTML pages with search results from https://innsyn.trondheim.kommune.no
 *
 */
module.exports = {
  /***
   * The parse method will extract data from a HTML page served in the raw parameter.
   * To determine if the parser was able to parse the file, check the returnValue.parsed field
   * (true|false).
   */
  parse: function(raw) {
    const getLegalParagraph = function(item) {
      const image = $(item).find('td:nth-child(6) img');

      const getText = function(image) {
        const data = $(image).attr('title');

        return $(data)
          .find('div > span:nth-child(1)')
          .text();
      };

      return image.attr('src') ===
        '/assets/paragraph-3972e36976f72f9935b1e7f8a4d3918b.png'
        ? getText(image)
        : null;
    };

    const getRecordedDate = function(item) {
      return getDateFromString(
        $(item)
          .find('td:nth-child(2)')
          .text(),
      );
    };

    const getCaseOfficer = function(item) {
      return getFromPopupData(item, /Saksbehandler:(.*)/);
    };

    const getUnit = function(item) {
      return getFromPopupData(item, /Enhet:(.*)/);
    };

    const getDocumentDate = function(item) {
      return getFromPopupData(item, /Datert:(.*)/);
    };

    const getDocumentType = function(item) {
      return getFromPopupData(item, /Type:(.*)/);
    };

    const getOriginalDocumentLink = function(item) {
      const link = $(item).find('td:nth-child(7) a');

      return link.text() === 'Last ned' ? link.attr('href') : null;
    };

    const getDateFromString = function(dateString) {
      try {
        const dateParts = dateString.split('.');
        const day = dateParts[0];
        const month = dateParts[1];
        const year = dateParts[2];
        const result = new Date('"' + year + '/' + month + '/' + day + '"');
        if (result == 'Invalid Date') {
          return '';
        }
        return result;
      } catch (e) {
        return '';
      }
    };

    const getFromPopupData = function(item, regex) {
      const popupData = $(item)
        .find('td:nth-child(9) > a')
        .data('content');
      const popupDataParsed = $.parseHTML(popupData);
      const someDiv = $('<div></div>');
      someDiv.append(popupDataParsed);

      $(someDiv)
        .find('p')
        .append('\n');

      $(someDiv)
        .find('br')
        .append('\n');

      const popupDataStripped = $(someDiv).text();

      const parts = popupDataStripped.match(regex);

      return parts && parts.length === 2
        ? getDateFromString(parts[1].trim())
        : null;
    };

    try {
      $ = cheerio.load(raw);

      const items = $('#offjournal-form-postjournal > table > tbody > tr')
        .map((index, item) => ({
          caseNumber: $(item)
            .find('td:nth-child(1)')
            .text(),
          documentTitle: $(item)
            .find('td:nth-child(4)')
            .text(),
          recordedDate: getRecordedDate(item),
          senderOrReceiver: $(item)
            .find('td:nth-child(5)')
            .text(),
          legalParagraph: getLegalParagraph(item),
          caseOfficer: getCaseOfficer(item),
          documentDate: getDocumentDate(item) || getRecordedDate(item),
          documentType: getDocumentType(item),
          unit: getUnit(item),
          originalDocumentLink: getOriginalDocumentLink(item),
        }))
        .get();
      return { parsed: items.length > 0, items: items };
    } catch (e) {
      return { parsed: false, items: [], error: e };
    }
  },
};
