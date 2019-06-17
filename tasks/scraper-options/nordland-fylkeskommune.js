/* Copyright 2019 Schibsted */

module.exports = {
  get: function() {
    return {
      sourceId: 165,
      url: 'https://www.nfk.no',
      scraper: {
        pagination: {
          generate: {
            type: {
              name: 'date',
            },
            numberOfPages: 10, // days
            urlPattern:
              'https://www.nfk.no/innsyn.aspx?response=journalpost_postliste&pf=alt&MId1=15468&scripturi=/innsyn.aspx&skin=infolink&fradato={FULL_DATE}',
          },
          evaluate() {
            const paginationUrls = [];
            const pagination = document.querySelector('.pagination');

            if (pagination) {
              const elements = pagination.querySelectorAll(
                'li:not(.disabled):not(:first-child):not(:last-child) a',
              );

              for (let element of elements) {
                const url = element.getAttribute('href');
                const text = element.innerText;
                paginationUrls.push({ url, text });
              }
            }

            return {
              paginationUrls,
            };
          },
          containerSelector: 'body',
          waitForSelector: '.i-jp',
          nextSelector: '.pagination li:last-child a',
        },
      },
      parser: {
        name: 'HTML',
        container: '#div_sok_resultstable > ul.i-jp > li',
        fields: [
          {
            name: 'caseNumber',
            path: 'div.det > h3 > a',
            after: function(value) {
              return value.substring(0, value.indexOf(' ')).trim();
            },
          },
          {
            name: 'documentTitle',
            path: 'div.det > h3 > a',
            after: function(value) {
              return value.substring(value.indexOf('-') + 1).trim();
            },
          },
          {
            name: 'caseTitle',
            path: 'div.met.i-exp.i-hs > div:nth-of-type(1) > a',
          },
          {
            name: 'legalParagraph',
            path: 'div.det > div',
            after: function(value) {
              const startAfterString = 'offentlighet etter';
              let index = value.indexOf(startAfterString);
              if (index === -1) return '';
              index += startAfterString.length;
              return value.substring(index).trim();
            },
          },
          {
            name: 'unit',
            path: 'div.met.i-exp.i-hs > div:nth-of-type(4) > strong',
          },
          {
            name: 'recordedDate',
            path: 'div.det > div.i-hs > strong:nth-of-type(1)',
            type: {
              name: 'date',
            },
          },
          {
            name: 'documentDate',
            path: 'div.met.i-exp.i-hs > div:nth-of-type(2) > strong',
            type: {
              name: 'date',
            },
          },
          {
            name: 'documentType',
            path: 'div.met.i-exp.i-hs > div:nth-of-type(3) > strong',
            after: function(value) {
              return value === 'Utgående dokument'
                ? 'U'
                : value === 'Innkommende dokument'
                ? 'I'
                : 'X';
            },
          },
          {
            name: 'caseOfficer',
            path: 'div.met.i-exp.i-hs > div:nth-of-type(5) > strong',
          },
          {
            name: 'sender',
            path($, row) {
              const label = $(row)
                .find('div.det > div.i-hs > span:nth-of-type(2)')
                .text()
                .trim();
              const value = $(row)
                .find('div.det > div.i-hs > strong:nth-of-type(2)')
                .text()
                .trim();

              return label.startsWith('Avsender(e):') ? value : '';
            },
          },
          {
            name: 'receiver',
            path($, row) {
              const label = $(row)
                .find('div.det > div.i-hs > span:nth-of-type(2)')
                .text()
                .trim();
              const value = $(row)
                .find('div.det > div.i-hs > strong:nth-of-type(2)')
                .text()
                .trim();

              return label.startsWith('Mottaker(e):') ? value : '';
            },
          },
        ],
      },
    };
  },
};
