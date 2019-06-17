/* Copyright 2019 Schibsted */

const q = require('./queries');
const JournalAnonymizer = require('./../anonymization/journalAnonymizer');
const namesWithNeighbors = require('../anonymization/namesWithNeighbors')
  .toAnonymize;
const ssnRule = require('../anonymization/SSNs').toAnonymize;
const abbreviatedMiddleName = require('../anonymization/abbreviatedMiddleName')
  .toAnonymize;
const shouldPersist = require('./../anonymization/persistJournalChecker')
  .shouldPersist;

module.exports = { save };

function save(singleItemOrList) {
  return new Promise(function(resolve, reject) {
    resolve(saveInner(singleItemOrList));
  });
}

async function saveInner(singleItemOrList) {
  let journals = asArray(singleItemOrList);
  await persistAll(journals);
}

async function persistAll(journals) {
  const anonymizer = new JournalAnonymizer({
    saveAnonymous: q.createOrUpdateAnonymizedJournal,
    getNames: q.getNamesInWordlist,
    wordSeparatorRegex: '[\\s,\\.()\\/:;´]',
    anonymizationRules: function() {
      return [namesWithNeighbors, ssnRule, abbreviatedMiddleName];
    },
  });

  for (let journal of journals) {
    if (!shouldPersist(journal)) continue;

    let journalItem = await q.persistJournalItem(journal);
    if (journalItem !== undefined) {
      await anonymizer.anonymize(journalItem);
    }
  }
}

function asArray(singleItemOrList) {
  let items = [];
  if (Array.isArray(singleItemOrList)) {
    items = singleItemOrList;
  } else {
    items.push(singleItemOrList);
  }
  return items;
}
