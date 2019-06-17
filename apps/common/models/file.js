/* Copyright 2019 Schibsted */

const BaseModel = require('./base');

class FileModel extends BaseModel {
  static get tableName() {
    return 'file';
  }
}

module.exports = FileModel;
