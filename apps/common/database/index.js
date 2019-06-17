/* Copyright 2019 Schibsted */

const Knex = require('knex');
const objection = require('objection');
const config = require('../../../config');
const knexConfig = require('../../../knexfile');
const { Model } = objection;

const knex = Knex(knexConfig[config.get('env')]);
Model.knex(knex);

module.exports = { knex, objection };
