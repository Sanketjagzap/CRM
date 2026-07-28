const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { globalSearch } = require('../controllers/search.controller');

router.get('/', authenticate, globalSearch);

module.exports = router;