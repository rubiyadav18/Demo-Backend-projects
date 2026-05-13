const Product = require('../models/Product');

class ProductService {
  // Create a new product
  async createProduct(productData) {
    const { name, description, price, category, inStock, stockQuantity } = productData;

    // Validation
    if (!name || name.trim() === '') {
      throw new Error('Product name is required');
    }

    if (price === undefined || price === null || price === '') {
      throw new Error('Product price is required');
    }

    // Convert price to number if it's a string
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    if (isNaN(numericPrice) || numericPrice < 0) {
      throw new Error('Price must be a valid number greater than or equal to 0');
    }

    const product = new Product({
      name: name.trim(),
      description: description ? description.trim() : undefined,
      price: numericPrice,
      category: category ? category.trim() : undefined,
      inStock: inStock !== undefined ? inStock : true,
      stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : 0,
    });

    const savedProduct = await product.save();
    return savedProduct;
  }

  // Get all products
  async getAllProducts() {
    const products = await Product.find().sort({ createdAt: -1 });
    return products;
  }

  // Get product by ID
  async getProductById(productId) {
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    return product;
  }

  // Update product by ID
  async updateProduct(productId, updateData) {
    const product = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  // Delete product by ID
  async deleteProduct(productId) {
    const product = await Product.findByIdAndDelete(productId);

    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }
}

module.exports = new ProductService();
