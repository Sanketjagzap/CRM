const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getMetrics } = require('../controllers/analytics.controller');

router.get('/metrics', authenticate, getMetrics);

module.exports = router;