const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { overview } = require('../controllers/dashboard.controller');

router.get('/overview', authenticate, overview);

module.exports = router;