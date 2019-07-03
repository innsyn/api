/* Copyright 2019 Schibsted */

const BaseModel = require('./base');

class JournalModel extends BaseModel {
  static tableName() {
    return 'journal';
  }

  static idColumn() {
    return 'id';
  }

  static buildQueryColumns(query, state) {
    if (state.select && state.select.id) {
      query.select('id');
    }
  }

  static buildQueryWhere(query, state) {
    const { project_id, source_id, from, to, term, caseNumber } = state;

    if (project_id) {
      query.where('project_id', project_id);
    }

    if (source_id) {
      query.where('source_id', source_id);
    }

    if (from) {
      query.where('document_date', '>=', from);
    }

    if (to) {
      query.where('document_date', '<=', to);
    }

    if (term) {
      query.whereRaw("search_column @@ to_tsquery('norwegian',  ?)", [
        term.split(' ').join(' & '),
      ]);
    }

    if (caseNumber) {
      query.where('caseNumber', caseNumber);
    }

    query.orderBy('document_date', 'desc');
  }
}

module.exports = JournalModel;
