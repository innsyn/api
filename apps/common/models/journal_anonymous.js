/* Copyright 2019 Schibsted */

const BaseModel = require('./base');

class JournalAnonymousModel extends BaseModel {
  static tableName() {
    return 'journal_anonymous';
  }

  static idColumn() {
    return 'id';
  }

  static buildQueryWhere(query, state) {
    if (Array.isArray(state.ids)) {
      query.where('id', 'in', state.ids);
    }
  }
}

module.exports = JournalAnonymousModel;
