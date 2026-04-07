const express = require('express');
const router = express.Router();
const cashController = require('../controllers/cashController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/status', cashController.getDailyCash);
router.post('/initial', cashController.setInitialCash);
router.post('/expense', cashController.createExpense);
router.get('/expenses', cashController.getExpenses);
router.get('/report', cashController.getDailyReport);
router.get('/history', cashController.getHistory);
router.get('/details/:date', cashController.getDayDetails);

module.exports = router;
