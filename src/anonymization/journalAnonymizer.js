/* Copyright 2019 Schibsted */

module.exports = JournalAnonymizer;

/***
 *
 *
 * @param options.wordSeparatorRegex Regex to split words in a journal property/field.
 * @param options.getNames Async or Promise function that accepts a list of words and returns a list of words to anonymize.
 * @param options.journalNameConnector Async or Promise function to save a journal name connection f(journalId, nameId).
 * @param options.saveAnonymous Async or Promise function to save anonymized journal f(journalId, jsonData).
 * @param options.anonymizationRules List of functions in order to run on journal fields f(text, names).
 * @param options.replaceString String to use as replacement for words to anonymize.
 * @constructor
 */
function JournalAnonymizer(options) {
  let opt = options;

  const getOptionsOrDefault = function() {
    opt = opt || {};
    opt.wordSeparatorRegex = opt.wordSeparatorRegex || "[\\s,\\.()\\/:;´']";
    opt.getNames =
      opt.getNames ||
      function() {
        return [];
      };
    opt.saveAnonymous = opt.saveAnonymous || function() {};
    opt.anonymizationRules =
      opt.anonymizationRules ||
      function() {
        return [];
      };
    opt.replaceString = opt.replaceString || '****';
    return opt;
  };

  const innerAnonymize = function(text, names, wordSeparator, replaceString) {
    const WORD_SEP = wordSeparator;
    replaceString = replaceString || '****';

    names.forEach(function(name) {
      if (name.length > 1) {
        // stop one character long "name", can be characters messing with the regex created
        const r = new RegExp(
          '^(' +
            name +
            ')' +
            WORD_SEP +
            '|' +
            WORD_SEP +
            '(' +
            name +
            ')' +
            WORD_SEP +
            '|' +
            WORD_SEP +
            '(' +
            name +
            ')$',
          'i',
        );
        text = text
          .replace(r, function(match, capture1, capture2, capture3) {
            const capture = capture1 || capture2 || capture3;
            const startChar = match[0] !== capture[0] ? match[0] : '';
            const endChar =
              match[match.length - 1] !== capture[capture.length - 1]
                ? match[match.length - 1]
                : '';
            return startChar + replaceString + endChar;
          })
          .trim();
      }
    });
    return text;
  };

  this.anonymize = async function(journal) {
    const options = getOptionsOrDefault();

    const stringProperties = getStringPropertiesFromObject(journal);
    const journalText = combinePropertiesFromObject(stringProperties);
    let words = splitIntoWords(journalText, options.wordSeparatorRegex);
    const names = await options.getNames(words);

    let remarks = [];

    for (let prop in journal) {
      // skip inherited
      if (!journal.hasOwnProperty(prop)) continue;
      // ...and non-string properties
      if (typeof journal[prop] !== 'string') continue;

      let wordsWithPosition = addPositionToWords(
        journal[prop],
        names,
        options.wordSeparatorRegex,
      );

      let namesToAnonymize = [];
      const rules = options.anonymizationRules();
      for (let rule of rules) {
        let result = rule(wordsWithPosition, journal[prop]);
        namesToAnonymize = namesToAnonymize.concat(result.toAnonymize);
        remarks = remarks.concat(result.remarks);
      }
      journal[prop] = innerAnonymize(
        journal[prop],
        namesToAnonymize,
        options.wordSeparatorRegex,
        options.replaceString,
      );
    }

    options.saveAnonymous(journal, remarks.join());

    return journal;
  };

  const getStringPropertiesFromObject = function(obj) {
    let newObj = {};

    // 1. for each property, get words from journal with position
    for (let prop in obj) {
      // skip inherited
      if (!obj.hasOwnProperty(prop)) continue;
      // ...and non-string properties
      if (typeof obj[prop] !== 'string') continue;

      newObj[prop] = obj[prop];
    }

    return newObj;
  };

  const combinePropertiesFromObject = function(obj) {
    let res = '';
    for (let prop in obj) {
      res = res + obj[prop] + ' ';
    }
    return res;
  };

  const splitIntoWords = function(str, regex) {
    return str
      .split(new RegExp(regex))
      .filter(w => w.length > 0)
      .filter(w => w !== '-')
      .filter(w => w !== '+');
  };

  const addPositionToWords = function(text, names, regex) {
    let wordList = [];
    const textWords = splitIntoWords(text, regex);

    for (let wordIndex = 0; wordIndex < textWords.length; wordIndex++) {
      let wordInfo = {
        word: textWords[wordIndex],
        position: wordIndex + 1,
        is_common_word: true,
        id: -1,
      };

      for (let nameIndex = 0; nameIndex < names.length; nameIndex++) {
        if (
          names[nameIndex].name.toLowerCase() ===
          textWords[wordIndex].toLowerCase()
        ) {
          wordInfo.id = names[nameIndex].id;
          wordInfo.is_common_word = names[nameIndex].is_common_word;
          break;
        }
      }
      wordList.push(wordInfo);
    }
    return wordList;
  };
}
