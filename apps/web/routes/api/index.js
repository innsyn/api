/* Copyright 2019 Schibsted */

const express = require('express');
const MenuController = require('../../controllers/api/menu');
const SearchController = require('../../controllers/api/search');
const CountController = require('../../controllers/api/count');

const router = express.Router();

router.get('/api/menu', MenuController.browse);
router.get('/api/search', SearchController.browse);
router.get('/api/count', CountController.read);

module.exports = router;
