const express = require('express');
const router = express.Router();
const cashController = require('../controllers/cashController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/status', cashController.getDailyCash);
router.post('/initial', cashController.setInitialCash);
router.post('/expense', cashController.createExpense);
router.put('/expense/:id', cashController.updateExpense);
router.delete('/expense/:id', cashController.deleteExpense);
router.get('/expenses', cashController.getExpenses);

router.post('/withdrawal', cashController.createWithdrawal);
router.put('/withdrawal/:id', cashController.updateWithdrawal);
router.delete('/withdrawal/:id', cashController.deleteWithdrawal);
router.get('/withdrawals', cashController.getWithdrawals);

router.put('/payment/:id', cashController.updatePayment);
router.delete('/payment/:id', cashController.deletePayment);

router.get('/summary', cashController.getGlobalSummary);
router.get('/export-excel', cashController.exportHistoryExcel);
router.get('/report', cashController.getDailyReport);
router.get('/history', cashController.getHistory);
router.get('/details/:date', cashController.getDayDetails);
router.get('/search', cashController.searchBySlipNumber);

module.exports = router;
