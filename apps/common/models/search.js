/* Copyright 2019 Schibsted */

const BaseModel = require('./journal');
const JournalModel = require('./journal');
const JournalAnonymousModel = require('./journal_anonymous');
const {
  getNameCount,
} = require('../../../src/anonymization/nameCheckerForSearch');

class SearchModel {
  static async fetch(state = {}) {
    if (
      state.term &&
      state.term.length > 2 &&
      (await getNameCount(state.term)) >= 2
    ) {
      throw {
        status: 403,
        error: { message: 'Name search not allowed' },
      };
    }

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

  static async count(state = {}) {
    if (
      state.term &&
      state.term.length > 2 &&
      (await getNameCount(state.term)) >= 2
    ) {
      throw {
        status: 403,
        error: { message: 'Name search not allowed' },
      };
    }

    return BaseModel.count(state);
  }
}

module.exports = SearchModel;
