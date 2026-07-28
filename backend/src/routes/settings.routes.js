const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const settingsController = require('../controllers/settings.controller');
const financeController = require('../controllers/finance.controller');

router.use(authenticate);

router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSetting);
router.put('/bulk', settingsController.updateBulk);

router.get('/profile', settingsController.getProfile);
router.put('/profile', settingsController.updateProfile);
router.post('/change-password', settingsController.changePassword);

router.get('/finance/summary', financeController.getOverview);
router.get('/finance/by-user', financeController.revenueByUser);
router.get('/finance/by-company', financeController.revenueByCompany);
router.get('/finance/by-product', financeController.revenueByProduct);
router.get('/finance/monthly', financeController.monthlyRevenueSeries);

module.exports = router;
