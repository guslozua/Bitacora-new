const express = require('express');
const router = express.Router();
const { getAbmStats } = require('../controllers/abmStatsController');

router.get('/', getAbmStats);

module.exports = router;
