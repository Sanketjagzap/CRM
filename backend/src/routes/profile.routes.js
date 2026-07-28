const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { updateProfile } = require('../controllers/profile.controller');

router.put('/', authenticate, updateProfile);

module.exports = router;