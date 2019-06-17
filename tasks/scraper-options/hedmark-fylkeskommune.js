/* Copyright 2019 Schibsted */

const getFromPopupData = function($, row, regex) {
  const popupData = $(row)
    .find('td:nth-of-type(11) > a')
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

  return parts && parts.length === 2 ? parts[1].trim() : null;
};

module.exports = {
  get: function() {
    return {
      sourceId: 160,
      scraper: {
        pagination: {
          generate: {
            type: {
              name: 'date',
              config: {
                format: 'yyyy-MM-dd',
              },
            },
            urlPattern:
              'https://innsyn.hedmark.org/postjournal/search?enhet=&from_date={FULL_DATE}&sort=jdato&direction=desc&ndoktype=&page=1&query=&to_date={FULL_DATE}',
            offsetStart: 1,
            offsetStep: 1,
            numberOfPages: 10,
          },
          evaluate() {
            const paginationUrls = [];
            const pagination = document.querySelector('.pagination');

            if (pagination) {
              const elements = pagination.querySelectorAll(
                'a:not(.disabled):not(.previous_page):not(.next_page)',
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
          containerSelector: '.pagination',
          nextSelector: '.pagination a:last-child',
        },
      },
      parser: {
        name: 'HTML',
        container: '#offjournal-form-postjournal > table > tbody > tr',
        fields: [
          {
            name: 'caseNumber',
            path: 'td:nth-of-type(1) > a',
          },
          {
            name: 'recordedDate',
            path: 'td:nth-of-type(2)',
            type: {
              name: 'date',
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
            path: 'td:nth-of-type(4) > label',
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
              const image = $(row).find('td:nth-of-type(8) img');

              const getText = function(image) {
                const data = $(image).attr('title');

                return $(data)
                  .find('div > span:nth-of-type(1)')
                  .text();
              };

              return image.attr('src') ===
                '/assets/paragraph-3972e36976f72f9935b1e7f8a4d3918b.png'
                ? getText(image)
                : null;
            },
          },
          {
            name: 'unit',
            path($, row) {
              return getFromPopupData($, row, /Enhet:(.*)/);
            },
          },
          {
            name: 'originalDocumentLink',
            path($, row) {
              const link = $(row).find('td:nth-of-type(7) > a');

              return link.text() === 'Last ned' ? link.attr('href') : null;
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
