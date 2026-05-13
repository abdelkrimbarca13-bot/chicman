const express = require('express');
const router = express.Router();
const perfumeController = require('../controllers/perfumeController');
const auth = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', auth, perfumeController.getAllPerfumes);
router.post('/', auth, perfumeController.createPerfume);
router.put('/:id', auth, perfumeController.updatePerfume);
router.delete('/:id', auth, perfumeController.deletePerfume);

router.get('/template', auth, perfumeController.downloadTemplate);
router.post('/import', [auth, upload.single('file')], perfumeController.importPerfumes);

router.post('/sales', auth, perfumeController.createPerfumeSale);
router.delete('/sales/:id', auth, perfumeController.deletePerfumeSale);
router.get('/sales', auth, perfumeController.getPerfumeSales);
router.get('/stats', auth, perfumeController.getPerfumeStats);

module.exports = router;
