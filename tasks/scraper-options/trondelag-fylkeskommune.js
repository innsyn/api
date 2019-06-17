/* Copyright 2019 Schibsted */

module.exports = {
  get: function() {
    return {
      sourceId: 175,
      baseUrl: 'https://trfk.pj.360online.com',
      scraper: {
        url: 'https://trfk.pj.360online.com/Journal/Search',
        pagination: {
          generate: {
            urlPattern:
              'https://trfk.pj.360online.com/Journal/Search/?querytype=and&offset={OFFSET}',
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
