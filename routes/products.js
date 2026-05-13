const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Create a new product
router.post('/', (req, res) => productController.createProduct(req, res));

// Get all products
router.get('/', (req, res) => productController.getAllProducts(req, res));

// Get a single product by ID
router.get('/:id', (req, res) => productController.getProductById(req, res));

// Update a product by ID
router.put('/:id', (req, res) => productController.updateProduct(req, res));

// Delete a product by ID
router.delete('/:id', (req, res) => productController.deleteProduct(req, res));

module.exports = router;

