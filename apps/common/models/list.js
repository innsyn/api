/* Copyright 2019 Schibsted */

const BaseModel = require('./base');

class ListModel extends BaseModel {
  static tableName() {
    return 'list';
  }

  static idColumn() {
    return 'id';
  }
}

module.exports = ListModel;
