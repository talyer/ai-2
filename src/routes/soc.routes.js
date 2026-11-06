'use strict';

const express = require('express');
const socController = require('../controllers/soc.controller');

const router = express.Router();

router.get('/', socController.showDashboard);
router.get('/feed', socController.feed);
router.get('/incidents/:id', socController.showIncident);
router.post('/lab/simulate', socController.runDrill);
router.post('/incidents/:id/analyze', socController.requestAnalysis);
router.post('/incidents/:id/resolve', socController.resolve);

module.exports = router;
