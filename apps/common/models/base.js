/* Copyright 2019 Schibsted */

require('../database');
const { Model } = require('objection');

class BaseModel extends Model {
  static buildQueryFrom(query, state = {}) {}
  static buildQueryColumns(query, state = {}) {
    query.select('*');
  }
  static buildQueryJoins(query, state = {}) {}
  static buildQueryWhere(query, state = {}) {
    if (state.id) {
      query.where('id', state.id);
    }
  }
  static buildQueryGroup(query, state = {}) {}

  static buildQueryPagination(query, state = {}) {
    if (state.limit) {
      query.limit(state.limit);
    }

    if (state.offset) {
      query.offset(state.offset);
    }
  }

  static async getBy(state = {}) {
    const query = this.query().select('*');
    this.buildQueryFrom(query, state);
    this.buildQueryColumns(query, state);
    this.buildQueryJoins(query, state);
    this.buildQueryWhere(query, state);
    this.buildQueryGroup(query, state);

    return await query.first();
  }

  static async fetch(state = {}) {
    const query = this.query();

    this.buildQueryFrom(query, state);
    this.buildQueryColumns(query, state);
    this.buildQueryJoins(query, state);
    this.buildQueryWhere(query, state);
    this.buildQueryGroup(query, state);
    this.buildQueryPagination(query, state);

    return query;
  }

  static async count(state = {}) {
    const query = this.query();

    this.buildQueryFrom(query, state);
    this.buildQueryJoins(query, state);
    this.buildQueryWhere(query, state);
    this.buildQueryGroup(query, state);

    const { count } = (await query
      .clone()
      .clearOrder()
      .count()
      .first()) || { count: '0' };

    return parseInt(count, 10);
  }

  static save() {}

  static delete() {}
}

module.exports = BaseModel;
