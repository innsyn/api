/* Copyright 2019 Schibsted */

const getWordRelationships = require('./wordRelationships')
  .getWordRelationships;
module.exports = { toAnonymize: getNamesWithAbbreviatedMiddleName };

// RULE #3: Get abbreviated names with name neighbors
function getNamesWithAbbreviatedMiddleName(words) {
  const namesToAnonymize = getWordRelationships(words);

  // abbreviated name with name neighbors
  let result = [];
  for (let index = 0; index < namesToAnonymize.length; index++) {
    let current = namesToAnonymize[index];

    if (
      current.name.length === 1 &&
      current.previousIsName &&
      current.nextToPrevious &&
      current.nextIsName &&
      current.nextToNext
    ) {
      result.push(namesToAnonymize[index - 1].name);
      result.push(current.name);
      result.push(namesToAnonymize[index + 1].name);
    }
  }
  return { toAnonymize: result, remarks: [] };
}
