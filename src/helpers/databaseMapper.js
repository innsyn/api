/* Copyright 2019 Schibsted */

let parserHelper = require('./parserHelper');

module.exports = { mapJournalsToDb };

function mapJournalsToDb(parsedPages, source) {
  let allItems = [];

  parsedPages.forEach(function(page) {
    if (page.parsed) {
      page.items.forEach(function(entry) {
        let mappedItem = parserHelper.mapItems([entry])[0];
        mappedItem.source_id = source.id;
        mappedItem.project_id = source.project_id;
        allItems.push(mappedItem);
      });
    }
  });

  return allItems;
}
