/* Copyright 2019 Schibsted */

const getWordRelationships = require('./wordRelationships')
  .getWordRelationships;
module.exports = { toAnonymize: getNamesWithNameNeighbors };

// RULE #1: Get names with name neighbors
// IMPORTANT: The names MUST be sorted on position for this to work
function getNamesWithNameNeighbors(words) {
  const namesToAnonymize = getWordRelationships(words);

  // names with name neighbors
  const toAnonymize = namesToAnonymize
    .filter(
      n =>
        n.isName &&
        ((n.previousIsName && n.nextToPrevious) ||
          (n.nextIsName && n.nextToNext)),
    )
    .map(n => n.name);

  return { toAnonymize: toAnonymize, remarks: [] };
}
