/* Copyright 2019 Schibsted */

const { Scraper } = require('../apps/common/scraper');
console.log('Getting options for source');

const scrape = async function(options) {
  const scraper = new Scraper(options);
  await scraper.run();
};

try {
  const source = process.argv[2];
  const options = require('./scraper-options/' + source).get();

  scrape(options)
    .then(function() {
      console.log('Synchronization complete');
      process.exit(0);
    })
    .catch(function(error) {
      console.log('Failed!', error);
      process.exit(1);
    });
} catch (e) {
  console.log(
    'Could not get parser options. ' +
      'Check that the command line argument corresponds to an options file in tasks/scraper-options.',
  );
  console.log('Exception details: ', e);
  process.exit(1);
}
