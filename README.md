# Backend Task - Express.js API with MongoDB

A simple Express.js REST API with MongoDB and Mongoose for product management.

## Features

- **Create Products**: POST endpoint to create new products
- **List Products**: GET endpoint to retrieve all products
- **Get Product**: GET endpoint to retrieve a single product by ID
- MongoDB integration with Mongoose
- CORS enabled for cross-origin requests
- Health check endpoint

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update `MONGODB_URI` with your MongoDB connection string
   - For local MongoDB: `mongodb://localhost:27017/products`
   - For MongoDB Atlas: `mongodb+srv://username:password@cluster.mongodb.net/products?retryWrites=true&w=majority`

## Running the Server

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in the `PORT` environment variable).

## API Endpoints

### Products

- `POST /api/products` - Create a new product
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get a specific product by ID

### Other Endpoints

- `GET /` - API information
- `GET /health` - Health check endpoint

## Example Requests

### Create a Product
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop",
    "description": "High-performance laptop",
    "price": 999.99,
    "category": "Electronics",
    "inStock": true,
    "stockQuantity": 25
  }'
```

### Get All Products
```bash
curl http://localhost:3000/api/products
```

### Get Product by ID
```bash
curl http://localhost:3000/api/products/{productId}
```

## Product Schema

```javascript
{
  name: String (required),
  description: String,
  price: Number (required, min: 0),
  category: String,
  inStock: Boolean (default: true),
  stockQuantity: Number (default: 0, min: 0),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

## Deployment

### Deploy to Heroku

1. Install Heroku CLI
2. Login to Heroku: `heroku login`
3. Create a new app: `heroku create your-app-name`
4. Set MongoDB URI: `heroku config:set MONGODB_URI=your-mongodb-connection-string`
5. Deploy: `git push heroku main`

### Deploy to Railway

1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Add MongoDB service or set `MONGODB_URI` environment variable
5. Deploy: `railway up`

### Deploy to Render

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variable: `MONGODB_URI` with your MongoDB connection string
6. Deploy

### Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Set environment variables in Vercel dashboard: `MONGODB_URI`
3. Deploy: `vercel`

### MongoDB Atlas Setup (Cloud Database)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist your IP address (or use `0.0.0.0/0` for all IPs)
5. Get your connection string
6. Update `MONGODB_URI` in your `.env` file or deployment platform

## Environment Variables

- `MONGODB_URI` - MongoDB connection string (required)
- `PORT` - Server port (default: 3000)

## Project Structure

```
.
├── server.js              # Main server file
├── config/
│   └── database.js        # MongoDB connection
├── models/
│   └── Product.js         # Product model (Mongoose schema)
├── routes/
│   └── products.js        # Product routes
├── package.json           # Dependencies and scripts
├── .env.example          # Environment variables template
└── README.md             # This file
```

## Technologies Used

- Node.js
- Express.js
- MongoDB
- Mongoose
- CORS
- dotenv