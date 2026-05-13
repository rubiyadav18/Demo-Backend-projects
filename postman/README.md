# Postman Collection for Products API

This folder contains Postman collection and environment files for testing the Products API.

## Files

1. **Products_API.postman_collection.json** - Main Postman collection with all API endpoints
2. **Products_API_Environment.postman_environment.json** - Local development environment
3. **Products_API_Production.postman_environment.json** - Production environment template

## How to Import

### Import Collection and Environment

1. Open Postman
2. Click **Import** button (top left)
3. Select both files:
   - `Products_API.postman_collection.json`
   - `Products_API_Environment.postman_environment.json`
4. Click **Import**

### Set Environment

1. Click the environment dropdown (top right)
2. Select **"Products API - Local"** for local testing
3. Or select **"Products API - Production"** and update the `base_url` value

## Collection Structure

### Root & Health
- **Root - API Info** - `GET /` - Get API information
- **Health Check** - `GET /health` - Check API health

### Products
- **Create Product** - `POST /api/products` - Create a new product
- **Get All Products** - `GET /api/products` - Get all products
- **Get Product by ID** - `GET /api/products/:id` - Get single product
- **Update Product** - `PUT /api/products/:id` - Update a product
- **Delete Product** - `DELETE /api/products/:id` - Delete a product

## Variables

### Collection Variables
- `base_url` - API base URL (default: `http://localhost:3000`)
- `product_id` - Product ID for testing (set after creating a product)

### Environment Variables
- `base_url` - Overrides collection variable
- `product_id` - Store product ID for reuse

## Usage Tips

1. **Create Product First**: Use "Create Product" to add a product, then copy the `_id` from the response
2. **Set Product ID**: Paste the product ID into the `product_id` variable to use in other requests
3. **Update Base URL**: Change `base_url` in environment for different servers (local, staging, production)

## Example Request Bodies

### Create Product
```json
{
  "name": "Laptop",
  "description": "High-performance laptop with 16GB RAM",
  "price": 999.99,
  "category": "Electronics",
  "inStock": true,
  "stockQuantity": 25
}
```

### Update Product
```json
{
  "name": "Updated Laptop",
  "price": 1099.99,
  "stockQuantity": 30
}
```

## Frontend Integration

For frontend integration, use these endpoints:

```javascript
// Base URL
const API_URL = 'http://localhost:3000/api/products';

// Create Product
fetch(API_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Laptop',
    price: 999.99,
    description: 'High-performance laptop',
    category: 'Electronics',
    inStock: true,
    stockQuantity: 25
  })
});

// Get All Products
fetch(API_URL);

// Get Product by ID
fetch(`${API_URL}/${productId}`);

// Update Product
fetch(`${API_URL}/${productId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Updated Name', price: 1099.99 })
});

// Delete Product
fetch(`${API_URL}/${productId}`, { method: 'DELETE' });
```
