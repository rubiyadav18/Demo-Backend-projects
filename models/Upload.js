const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, index: true },
    url: { type: String, required: true },
    bucket: { type: String, trim: true },
    region: { type: String, trim: true },
    originalName: { type: String, trim: true },
    mimeType: { type: String, trim: true },
    size: { type: Number, min: 0 },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Upload', uploadSchema);
