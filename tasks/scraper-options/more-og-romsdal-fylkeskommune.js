/* Copyright 2019 Schibsted */

const { URL } = require('url');
const { DateTime } = require('luxon');

module.exports = {
  get: function() {
    return {
      sourceId: 162,
      scraper: {
        pagination: {
          generate: {
            type: {
              name: 'date',
            },
            urlPattern:
              'http://einnsyn.mrfylke.no/postjournal?date={FULL_DATE}',
            numberOfPages: 10, // Read: days
          },
          evaluate() {
            const paginationUrls = [];
            const pagination = document.querySelector('.pagination');

            if (pagination) {
              const elements = pagination.querySelectorAll(
                'li:not(.next):not(.prev) a',
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
          containerSelector: '#journals_wrapper',
          waitForSelector: '.pagination li.next',
          nextSelector: '.pagination li.next a',
        },
      },
      parser: {
        name: 'HTML',
        container: '#journals_wrapper > table > tbody > tr',
        fields: [
          {
            name: 'caseNumber',
            path: 'td:nth-of-type(1) > a',
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
            path: 'td:nth-of-type(3)',
            type: {
              name: 'date',
            },
          },
          {
            name: 'documentType',
            path: 'td:nth-of-type(4)',
          },
          {
            name: 'documentTitle',
            path: 'td:nth-of-type(5)',
          },
          {
            name: 'senderOrReceiver',
            path: 'td:nth-of-type(6)',
          },
          {
            name: 'caseOfficer',
            path: 'td:nth-of-type(7)',
          },
          {
            name: 'legalParagraph',
            path($, row) {
              const link = $(row).find('td:nth-of-type(8) > a');
              const image = $(row).find('td:nth-of-type(8) > a > img');

              const getText = function(link) {
                const data = $(link).data('content');

                return $(data)
                  .find('div > span:nth-of-type(1)')
                  .text();
              };

              return image.attr('src') ===
                '/assets/paragraph-ea026965a0cfc4e0046e99bd583064a9.png'
                ? getText(link)
                : null;
            },
          },
          {
            name: 'sender',
            path($, row, data) {
              return data.documentType === 'I' ? data.senderOrReceiver : '';
            },
          },
          {
            name: 'receiver',
            path($, row, data) {
              return data.documentType === 'U' ? data.senderOrReceiver : '';
            },
          },
        ],
      },
    };
  },
};
