const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/auth');

router.get('/', auth, productController.getAllProducts);
router.post('/', auth, productController.createProduct);
router.put('/:id', auth, productController.updateProduct);
router.delete('/:id', auth, productController.deleteProduct);

router.post('/sales', auth, productController.createProductSale);
router.get('/sales', auth, productController.getProductSales);
router.get('/stats', auth, productController.getProductStats);

module.exports = router;
