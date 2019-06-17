/* Copyright 2019 Schibsted */

const { URL } = require('url');
const { DateTime } = require('luxon');

module.exports = {
  get: function() {
    return {
      sourceId: 159,
      scraper: {
        pagination: {
          generate: {
            type: {
              name: 'date',
            },
            urlPattern: 'https://innsyn-vs.tromsfylke.no/?date={FULL_DATE}',
            numberOfPages: 10, // Read: days
          },
          evaluate() {
            const paginationUrls = [];
            const pagination = document.querySelector('.pagination');

            if (pagination) {
              const elements = pagination.querySelectorAll(
                'a:not(.previous_page)',
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
          containerSelector: 'body',
          waitForSelector: '.pagination .next_page',
          nextSelector: '.pagination .next_page',
        },
      },
      parser: {
        name: 'HTML',
        container: 'table:nth-of-type(2) > tbody > tr:not(:first-child)',
        fields: [
          {
            name: 'caseNumber',
            path: 'td:nth-of-type(1)',
          },
          {
            name: 'recordedDate',
            fallback(data, request) {
              const url = new URL(request.url);
              const date = url.searchParams.get('date');

              return DateTime.fromFormat(date, 'dd.MM.yyyy', {
                zone: 'Europe/Oslo',
              }).toSQL();
            },
          },
          {
            name: 'documentDate',
            path: 'td:nth-of-type(2)',
            type: {
              name: 'date',
            },
          },
          {
            name: 'documentType',
            path: 'td:nth-of-type(3) > div',
          },
          {
            name: 'caseTitle',
            path: 'td:nth-of-type(4)',
          },
          {
            name: 'senderOrReciever',
            path: 'td:nth-of-type(5)',
          },
          {
            name: 'caseOfficer',
            path: 'td:nth-of-type(6)',
          },
          {
            name: 'legalParagraph',
            path($, row) {
              const image = $(row).find('td:nth-of-type(7) > a > img');

              return image.attr('src') ===
                '/assets/innsyn_engine/paragraph-ea026965a0cfc4e0046e99bd583064a9.png'
                ? $(row)
                    .find('td:nth-of-type(7) > a')
                    .text()
                    .trim()
                : null;
            },
          },
          {
            name: 'sender',
            path($, row, data) {
              return data.documentType === 'I' ? data.senderOrReciever : '';
            },
          },
          {
            name: 'reciever',
            path($, row, data) {
              return data.documentType === 'U' ? data.senderOrReciever : '';
            },
          },
        ],
      },
    };
  },
};
