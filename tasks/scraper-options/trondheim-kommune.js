/* Copyright 2019 Schibsted */

var request = require('request');

module.exports = {
  get: function() {
    return {
      parser: 'TrondheimKommune',
      sourceId: 150,
      delayBetweenRequests: 500,
      url:
        'https://innsyn.trondheim.kommune.no/postjournal/search?enhet=&from_date=2010-08-01&sort=jdato&direction=desc&ndoktype=&page=3&query=&to_date=#',
      pagination: {
        generate: {
          urlPattern:
            'https://innsyn.trondheim.kommune.no/postjournal/search?enhet=&from_date=2010-08-01&sort=jdato&direction=desc&ndoktype=&page={OFFSET}&query=&to_date=#',
          offsetStart: 1,
          offsetStep: 1,
          numberOfPages: 10,
        },
      },
    };
  },
};
