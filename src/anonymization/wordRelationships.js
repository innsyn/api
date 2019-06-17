/* Copyright 2019 Schibsted */

module.exports = { getWordRelationships };

function getWordRelationships(words) {
  let wordsWithInfo = [];
  for (let i = 0; i < words.length; i++) {
    wordsWithInfo.push({
      id: words[i].id,
      name: words[i].word,
      isName: words[i].is_common_word === false,
      previousIsName: i === 0 ? false : words[i - 1].is_common_word === false,
      nextToPrevious:
        i === 0 ? false : words[i - 1].position === words[i].position - 1,
      nextIsName:
        i === words.length - 1 ? false : words[i + 1].is_common_word === false,
      nextToNext:
        i === words.length - 1
          ? false
          : words[i + 1].position - 1 === words[i].position,
    });
  }
  return wordsWithInfo;
}
