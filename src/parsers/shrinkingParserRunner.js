/* Copyright 2019 Schibsted */

logYellow('Getting scraper configuration');

try {
  let scraperOptionsName = process.argv[2];
  let configuration = require('./scraper-options/' + scraperOptionsName).get();

  callback(null, configuration);
} catch (e) {
  logYellow(
    'Could not get parser options. ' +
      'Check that the command line argument corresponds to an options file in tasks/scraper-options.',
  );
  logRed('Exception details: ', e);
  process.exit(1);
}
