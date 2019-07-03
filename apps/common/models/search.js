/* Copyright 2019 Schibsted */

const JournalModel = require('./journal');
const JournalAnonymousModel = require('./journal_anonymous');

class SearchModel {
  static async fetch(state = {}) {
    const journals = await JournalModel.fetch({
      ...state,
      select: {
        id: true,
      },
    });

    const ids = journals.map(journal => journal.id);

    const annonymous_journals = await JournalAnonymousModel.fetch({
      ids,
    });

    return annonymous_journals.map(journal => journal.data);
  }
}

module.exports = SearchModel;
