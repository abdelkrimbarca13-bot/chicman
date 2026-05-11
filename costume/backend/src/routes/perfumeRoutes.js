const express = require('express');
const router = express.Router();
const perfumeController = require('../controllers/perfumeController');
const auth = require('../middleware/auth');

router.get('/', auth, perfumeController.getAllPerfumes);
router.post('/', auth, perfumeController.createPerfume);
router.put('/:id', auth, perfumeController.updatePerfume);
router.delete('/:id', auth, perfumeController.deletePerfume);

router.post('/sales', auth, perfumeController.createPerfumeSale);
router.get('/sales', auth, perfumeController.getPerfumeSales);
router.get('/stats', auth, perfumeController.getPerfumeStats);

module.exports = router;
