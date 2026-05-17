

const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in .env");
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;




// PORT=3000
// MONGO_URI=mongodb+srv:rubiy564_db_user:yr9yQo5aDXrKhFw9@cluster0.xq2hm6j.mongodb.net/myDB?retryWrites=true&w=majority
// JWT_SECRET=mysecretkey
// NODE_ENV=production