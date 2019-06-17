/* Copyright 2019 Schibsted */

const BaseModel = require('./base');
const ListModel = require('./list');

class SourceModel extends BaseModel {
  static tableName() {
    return 'source';
  }

  static idColumn() {
    return 'id';
  }

  static relationMappings() {
    return {
      list: {
        relation: BaseModel.HasOneRelation,
        modelClass: ListModel,
        join: {
          from: 'source.list_id',
          to: 'list.id',
        },
      },
    };
  }
}

module.exports = SourceModel;
