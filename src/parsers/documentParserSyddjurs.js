/* Copyright 2019 Schibsted */

let cheerio = require('cheerio');
let $ = null;
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
  parse: function(raw, options) {
    try {
      $ = cheerio.load(raw);

      let caseNumber = $('div.view-header > h2')[0].children[0].data.replace(
        'Sags Nr.: ',
        '',
      );
      let caseTitle =
        $('td.views-field.views-field-nothing-1')
          .text()
          .trim() +
        ': ' +
        $(
          '.view-id-os2web_cp_service_cp_case_view.view-display-id-os2web_cp_service_cp_case_view_description_attachment td',
        )
          .text()
          .trim();

      let documentTitlesAndLinks = $(
        'td.views-field.views-field-field-os2web-cp-service-file-id > a',
      );
      let documentNumbers = $(
        'td.views-field.views-field-field-os2web-cp-service-doc-id-1',
      ).map(function() {
        return this.children[0].data.trim();
      });
      let documentDates = $(
        '.attachment-after td.views-field.views-field-field-os2web-cp-service-date > span',
      ).map(function() {
        return this.attribs.content;
      });

      let documentTitles = documentTitlesAndLinks.map(function() {
        return this.children[0].data;
      });

      let documentLinks = documentTitlesAndLinks.map(function() {
        let data = $(this)[0];
        return options.basePath + data.attribs.href;
      });

      let items = [];
      for (let i = 0; i < documentNumbers.length; i++) {
        let item = {
          caseTitle: caseTitle,
          caseNumber: caseNumber + '-' + documentNumbers[i],
          documentTitle: documentTitles[i].trim(),
          documentDate: new Date(documentDates[i]),
          originalDocumentLink: documentLinks[i].trim(),
          // Fields below are not available
          sender: 'Ikke oppgitt i postlisten',
          receiver: 'Ikke oppgitt i postlisten', // default value
          recordedDate: '',
          caseOfficer: '',
          legalParagraph: '',
          unit: '',
          caseResponsible: '',
          classification: '',
          documentType: '',
        };
        items.push(item);
      }

      return { parsed: items.length > 0, items: items };
    } catch (e) {
      return { parsed: false, error: e };
    }
  },
};
