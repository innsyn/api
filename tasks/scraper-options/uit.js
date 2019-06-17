/* Copyright 2019 Schibsted */

const { URL } = require('url');
const { DateTime } = require('luxon');

module.exports = {
  get: function() {
    return {
      sourceId: 12,
      scraper: {
        pagination: {
          generate: {
            type: {
              name: 'date',
            },
            numberOfPages: 10,
            urlPattern:
              'https://uit.no/om/offjour?elementsprpage=20&uitgyldigfra={FULL_DATE}&uitgyldigtil={FULL_DATE}&searchtitle=&searchinnhold=&pageindex=1',
          },
          evaluate() {
            const paginationUrls = [];
            const pagination = document.querySelector('.pagination');

            if (pagination) {
              const elements = pagination.querySelectorAll(
                'a:not(.prev):not(.next)',
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
          async: true,
          containerSelector: '.pagination',
          waitForSelector: '.pagination .next',
          nextSelector: '.pagination a.next',
        },
      },
      parser: {
        name: 'HTML',
        container: 'table[summary="Offentlig journal dokumenter"]',
        fields: [
          {
            name: 'caseNumber',
            path: 'tr:nth-of-type(2) > td:nth-of-type(1)',
          },
          {
            name: 'caseTitle',
            path: 'tr:nth-of-type(3) > td',
          },
          {
            name: 'documentTitle',
            path: 'tr:nth-of-type(4) > td',
          },
          {
            name: 'legalParagraph',
            path: 'tr:nth-of-type(6) > td:nth-of-type(2)',
          },
          {
            name: 'recordedDate',
            path: 'tr:nth-of-type(6) > td:nth-of-type(1)',
            type: {
              name: 'date',
            },
          },
          {
            name: 'documentDate',
            path: 'tr:nth-of-type(6) > td:nth-of-type(1)',
            type: {
              name: 'date',
            },
          },
          {
            name: 'documentType',
            path: 'tr:nth-of-type(5) > td:nth-of-type(1)',
          },
          {
            name: 'sender',
            path: 'tr:nth-of-type(8) > td',
          },
          {
            name: 'receiver',
            path: 'tr:nth-of-type(9) > td',
          },
          {
            name: 'caseOfficer',
            path: 'tr:nth-of-type(5) > td:nth-of-type(2)',
          },
          {
            name: 'caseResponsible',
            path: 'tr:nth-of-type(2) > td:nth-of-type(2)',
          },
        ],
      },
    };
  },
};
