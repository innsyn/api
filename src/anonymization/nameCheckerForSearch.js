/* Copyright 2019 Schibsted */

module.exports = { getNameCount };
const queries = require('../helpers/queries');

function getNameCount(searchString) {
  return new Promise(function(resolve, reject) {
    const words = capitalize(splitSearchString(searchString));
    // search for all words
    queries.getNamesToAnonymizeFromList(words).then(function(result) {
      resolve(result.length);
    });
  });
}

function splitSearchString(searchString) {
  if (!searchString) return [];
  return searchString
    .replace(/^\s+|\s+$|\s+(?=\s)/g, '')
    .replace(/[.,;:]/g, '')
    .replace(/\s\s/g, ' ')
    .split(' ');
}

function capitalize(words) {
  return words.map(w => {
    w = w.toLowerCase();
    let nameParts = w.split('-');
    for (let i = 0; i < nameParts.length; i++) {
      let part = nameParts[i];
      nameParts[i] = part.charAt(0).toUpperCase() + part.slice(1);
    }
    w = nameParts.join('-');
    return w;
  });
}
