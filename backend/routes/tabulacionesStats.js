const express = require('express');
const router = express.Router();
const { getTabulacionesStats } = require('../controllers/tabulacionesStatsController');

router.get('/', getTabulacionesStats);

module.exports = router;
