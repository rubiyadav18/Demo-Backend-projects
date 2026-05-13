const productService = require('../services/productService');

class ProductController {
  // Create a new product
  async createProduct(req, res) {
    try {
      const product = await productService.createProduct(req.body);

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product
      });
    } catch (error) {
      // Validation errors
      if (
        error.message === 'Product name is required' ||
        error.message === 'Product price is required' ||
        error.message === 'Price must be a valid number greater than or equal to 0' ||
        error.message.includes('required') ||
        error.message.includes('Price must be')
      ) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      // Mongoose validation errors
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error creating product',
        error: error.message
      });
    }
  }

  // Get all products
  async getAllProducts(req, res) {
    try {
      const products = await productService.getAllProducts();

      res.json({
        success: true,
        count: products.length,
        data: products
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching products',
        error: error.message
      });
    }
  }

  // Get product by ID
  async getProductById(req, res) {
    try {
      const product = await productService.getProductById(req.params.id);

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      if (error.message === 'Product not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error fetching product',
        error: error.message
      });
    }
  }

  // Update product by ID
  async updateProduct(req, res) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: product
      });
    } catch (error) {
      if (error.message === 'Product not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error updating product',
        error: error.message
      });
    }
  }

  // Delete product by ID
  async deleteProduct(req, res) {
    try {
      await productService.deleteProduct(req.params.id);

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      if (error.message === 'Product not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error deleting product',
        error: error.message
      });
    }
  }
}

module.exports = new ProductController();
