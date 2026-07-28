const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const activitiesController = require('../controllers/activities.controller');

router.use(authenticate);
router.get('/', activitiesController.list);
router.post('/', activitiesController.create);
router.get('/timeline/:entityType/:entityId', activitiesController.timeline);
router.delete('/:id', activitiesController.remove);

module.exports = router;
