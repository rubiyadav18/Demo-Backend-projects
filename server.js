require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const productsRouter = require('./routes/products');
const uploadRouter = require('./routes/upload');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
// CORS
// Set `CORS_ORIGINS` as a comma-separated list, e.g.:
// CORS_ORIGINS=http://localhost:5173,http://localhost:3000,https://your-frontend.com
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like Postman/curl)
    if (!origin) return callback(null, true);

    // If no origins configured, allow all (useful for quick dev)
    if (allowedOrigins.length === 0) return callback(null, true);

    if (allowedOrigins.includes(origin)) return callback(null, true);

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/upload', uploadRouter);
app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is working successfully on EC2 🚀',
  });
});
// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Products API',
    endpoints: {
      signup: 'POST /api/auth/signup',
      login: 'POST /api/auth/login',
      createProduct: 'POST /api/products',
      listProducts: 'GET /api/products',
      getProduct: 'GET /api/products/:id',
      uploadFile: 'POST /api/upload (multipart field: file)',
      listUploads: 'GET /api/upload',
      getUpload: 'GET /api/upload/:id',
    },
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'Connected'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});

// CORS / error handler (keep after routes)
app.use((err, req, res, next) => {
  if (err && err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS blocked this request. Add your frontend URL to CORS_ORIGINS.',
      origin: req.headers.origin || null,
    });
  }

  return next(err);
});

module.exports = app;
