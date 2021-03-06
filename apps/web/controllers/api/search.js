/* Copyright 2019 Schibsted */

const Joi = require('@hapi/joi');
const SearchModel = require('../../../common/models/search');

class SearchController {
  static async browse(req, res, next) {
    // Validate query params
    const schema = Joi.object()
      .keys({
        projectId: Joi.number().integer(),
        sourceId: Joi.number().integer(),
        from: Joi.date(),
        to: Joi.date(),
        term: Joi.string(),
        caseNumber: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer(),
      })
      .unknown(true);

    const { error, value } = schema.validate(req.query);

    if (error) next(new Error(error));

    const {
      projectId,
      sourceId,
      from,
      to,
      term,
      caseNumber,
      limit = 20,
      page = 1,
    } = value;

    try {
      const data = await SearchModel.fetch({
        project_id: projectId,
        source_id: sourceId,
        from,
        to,
        term,
        case_number: caseNumber,
        limit,
        offset: (page - 1) * limit,
      });

      res.send(data);
    } catch ({ status, error }) {
      res.status(status);
      res.send(error);
    }
  }
}

module.exports = SearchController;
