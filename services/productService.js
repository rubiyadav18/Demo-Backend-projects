const mongoose = require('mongoose');
const Product = require('../models/Product');
const Upload = require('../models/Upload');

const UPLOAD_MATCH_MS = 10000;

function toImagePayload(upload) {
  return {
    id: upload._id,
    url: upload.url,
    key: upload.key,
    originalName: upload.originalName,
    mimeType: upload.mimeType,
    size: upload.size,
  };
}

async function attachImagesToProducts(products) {
  if (!products.length) return [];

  const productIds = products.map((p) => p._id);
  const uploadIds = products
    .map((p) => p.uploadId)
    .filter((id) => id && mongoose.Types.ObjectId.isValid(id));

  const uploadQuery = [
    { productId: { $in: productIds } },
    { productId: null },
    { productId: { $exists: false } },
  ];
  if (uploadIds.length) {
    uploadQuery.push({ _id: { $in: uploadIds } });
  }

  const uploads = await Upload.find({ $or: uploadQuery }).lean();

  const byProductId = new Map();
  const byUploadId = new Map();
  const unlinked = [];

  for (const upload of uploads) {
    byUploadId.set(String(upload._id), upload);
    if (upload.productId) {
      const key = String(upload.productId);
      if (!byProductId.has(key)) byProductId.set(key, []);
      byProductId.get(key).push(upload);
    } else {
      unlinked.push(upload);
    }
  }

  const usedUploadIds = new Set();

  const enriched = products.map((product) => {
    const pid = String(product._id);
    const linked = [...(byProductId.get(pid) || [])];

    if (product.uploadId) {
      const fromRef = byUploadId.get(String(product.uploadId));
      if (fromRef && !linked.some((u) => String(u._id) === String(fromRef._id))) {
        linked.unshift(fromRef);
      }
    }

    for (const u of linked) usedUploadIds.add(String(u._id));

    let imageUrl = product.imageUrl || linked[0]?.url || null;
    const images = linked.map(toImagePayload);

    return {
      ...product,
      imageUrl,
      images,
    };
  });

  for (const item of enriched) {
    if (item.imageUrl && item.images.length) continue;

    let best = null;
    let bestDiff = UPLOAD_MATCH_MS + 1;

    for (const upload of unlinked) {
      if (usedUploadIds.has(String(upload._id))) continue;
      const diff = Math.abs(
        new Date(item.createdAt).getTime() - new Date(upload.createdAt).getTime()
      );
      if (diff <= UPLOAD_MATCH_MS && diff < bestDiff) {
        best = upload;
        bestDiff = diff;
      }
    }

    if (best) {
      usedUploadIds.add(String(best._id));
      const payload = toImagePayload(best);
      item.images = [payload];
      item.imageUrl = payload.url;
    }
  }

  return enriched;
}

class ProductService {
  async createProduct(productData) {
    const {
      name,
      description,
      price,
      category,
      inStock,
      stockQuantity,
      imageUrl,
      uploadId,
    } = productData;

    if (!name || name.trim() === '') {
      throw new Error('Product name is required');
    }

    if (price === undefined || price === null || price === '') {
      throw new Error('Product price is required');
    }

    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

    if (isNaN(numericPrice) || numericPrice < 0) {
      throw new Error('Price must be a valid number greater than or equal to 0');
    }

    let resolvedImageUrl = imageUrl ? String(imageUrl).trim() : undefined;
    let resolvedUploadId = uploadId;

    if (uploadId) {
      if (!mongoose.Types.ObjectId.isValid(uploadId)) {
        throw new Error('Invalid uploadId');
      }
      const uploadDoc = await Upload.findById(uploadId);
      if (!uploadDoc) {
        throw new Error('Upload not found');
      }
      resolvedImageUrl = resolvedImageUrl || uploadDoc.url;
      resolvedUploadId = uploadDoc._id;
    }

    const product = new Product({
      name: name.trim(),
      description: description ? description.trim() : undefined,
      price: numericPrice,
      category: category ? category.trim() : undefined,
      inStock: inStock !== undefined ? inStock : true,
      stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : 0,
      ...(resolvedImageUrl && { imageUrl: resolvedImageUrl }),
      ...(resolvedUploadId && { uploadId: resolvedUploadId }),
    });

    const savedProduct = await product.save();

    if (resolvedUploadId) {
      await Upload.findByIdAndUpdate(resolvedUploadId, {
        productId: savedProduct._id,
      });
    }

    const [withImages] = await attachImagesToProducts([
      savedProduct.toObject ? savedProduct.toObject() : savedProduct,
    ]);
    return withImages;
  }

  async getAllProducts() {
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    return attachImagesToProducts(products);
  }

  async getProductById(productId) {
    const product = await Product.findById(productId).lean();

    if (!product) {
      throw new Error('Product not found');
    }

    const [withImages] = await attachImagesToProducts([product]);
    return withImages;
  }

  async updateProduct(productId, updateData) {
    const product = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      throw new Error('Product not found');
    }

    const [withImages] = await attachImagesToProducts([
      product.toObject ? product.toObject() : product,
    ]);
    return withImages;
  }

  async deleteProduct(productId) {
    const product = await Product.findByIdAndDelete(productId);

    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }
}

module.exports = new ProductService();
