/* Copyright 2019 Schibsted */

const { compose } = require('compose-middleware');
const api = require('./api');

module.exports = compose([api]);
