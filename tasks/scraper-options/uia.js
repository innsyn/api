/* Copyright 2019 Schibsted */

module.exports = {
  get: function() {
    return {
      sourceId: 7,
      baseUrl: 'https://uia-uninett.pj.360online.com',
      scraper: {
        url: 'https://uia-uninett.pj.360online.com/Journal/Search',
        pagination: {
          generate: {
            urlPattern:
              'https://uia-uninett.pj.360online.com/Journal/Search/?querytype=and&offset={OFFSET}',
            offsetStart: 0,
            offsetStep: 10,
            numberOfPages: 10,
          },
        },
      },
      parser: {
        name: 'Tieto',
      },
    };
  },
};
