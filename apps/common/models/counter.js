/* Copyright 2019 Schibsted */

const BaseModel = require('./base');

class CounterModel extends BaseModel {
  static get tableName() {
    return 'counter';
  }

  /**
   *
   * @param {*} query
   * @param {*} state
   */
  static buildQueryWhere(query, state) {
    // When both project_id and source_id are empty:
    if (!state.project_id && !state.source_id) {
      query.where('project_id', null).where('source_id', null);
    }

    // When there is a project_id.
    if (state.project_id) {
      query.where('project_id', state.project_id);
    }

    // When there is a source_id.
    if (state.source_id) {
      query.where('source_id', state.source_id);
    }

    // When there is a project_id but no source_id.
    if (state.project_id && !state.source_id) {
      query.where('source_id', null);
    }

    // When there is a source_id but no project_id.
    if (state.source_id && !state.project_id) {
      query.where('project_id', null);
    }
  }
}

module.exports = CounterModel;
