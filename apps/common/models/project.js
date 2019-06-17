/* Copyright 2019 Schibsted */

const BaseModel = require('./base');
const SourceModel = require('./source');

class ProjectModel extends BaseModel {
  static get tableName() {
    return 'project';
  }

  static get idColumn() {
    return 'id';
  }

  static get relationMappings() {
    return {
      sources: {
        relation: BaseModel.HasManyRelation,
        modelClass: SourceModel,
        join: {
          from: 'project.id',
          to: 'source.project_id',
        },
      },
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',

      properties: {
        id: { type: 'integer' },
        name: { type: 'string', maxLength: 100 },
        documentcloud_project_id: { type: 'string', maxLength: 100 },
        description: { type: ['string', 'null'], maxLength: 100 },
        registered_date: { type: 'string' },
        source_regex: { type: ['string', 'null'] },
        is_visisble: { type: 'boolean' },
        documentcloud_project_id_numeric: { type: 'integer' },
        dropbox_path: { type: 'string', maxLength: 200 },
        country_id: { type: 'integer' },
      },
    };
  }

  static buildQueryJoins(query) {
    query
      .joinEager({
        sources: {
          list: true,
        },
      })
      .modifyEager('sources', sourcesBuilder => {
        return sourcesBuilder.select('id', 'name', 'description', 'email');
      });

    query.orderBy([
      { column: 'project.name' },
      { column: 'sources.name' },
      { column: 'sources:list.name' },
    ]);
  }
}

module.exports = ProjectModel;
