const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { list, markRead } = require('../controllers/notification.controller');

router.get('/', authenticate, list);
router.patch('/:id/read', authenticate, markRead);

module.exports = router;