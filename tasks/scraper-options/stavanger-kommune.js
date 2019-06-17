/* Copyright 2019 Schibsted */

module.exports = {
  get: function() {
    return {
      sourceId: 149,
      baseUrl: 'https://stavangerkommune.pj.360online.com',
      scraper: {
        url: 'https://stavangerkommune.pj.360online.com/Journal/Search',
        pagination: {
          generate: {
            type: {
              name: 'date',
            },
            urlPattern:
              'https://stavangerkommune.pj.360online.com/Journal/Search/?querytype=and&FromDate={FULL_DATE}&ToDate={FULL_DATE}&offset=1',
            offsetStart: 1,
            offsetStep: 1,
            numberOfPages: 10,
          },
          evaluate() {
            const paginationUrls = [];
            const pagination = document.querySelector(
              '.paging > div:nth-of-type(2)',
            );

            const notAllowed = ['«', '‹', '›', '»'];

            if (pagination) {
              const elements = Array.from(
                pagination.querySelectorAll('a'),
              ).filter(element => !notAllowed.includes(element.innerText));

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
          containerSelector:
            '.paging > div:nth-of-type(2) > :nth-last-child(2)',
          nextSelector: '.paging > div:nth-of-type(2) > :nth-last-child(2)',
        },
      },
      parser: {
        name: 'Tieto',
      },
    };
  },
};
