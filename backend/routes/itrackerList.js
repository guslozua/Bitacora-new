// routes/itrackerList.js
const express = require('express');
const router = express.Router();
const { getItrackerList } = require('../controllers/itrackerListController');

// GET /api/itracker/list?year=2025&month=3&estado=CERRADO&usuario=Sergio&equipo=CentroX&causa=Genesys&ticket=123456
router.get('/list', getItrackerList);

module.exports = router;
