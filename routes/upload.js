const express = require('express');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const Upload = require('../models/Upload');

const router = express.Router();

function getBucketName() {
  return (
    process.env.AWS_S3_BUCKET ||
    process.env.AWS_BUCKET_NAME ||
    ''
  ).trim();
}

function getConfiguredRegion() {
  return (process.env.AWS_REGION || 'us-east-1').trim();
}

function getS3Client() {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const sessionToken = process.env.AWS_SESSION_TOKEN;

  const credentials =
    accessKeyId && secretAccessKey
      ? {
          accessKeyId,
          secretAccessKey,
          ...(sessionToken && { sessionToken }),
        }
      : undefined;

  return new S3Client({
    region: getConfiguredRegion(),
    // Fixes PermanentRedirect when AWS_REGION does not match the bucket's region
    followRegionRedirects: true,
    ...(credentials && { credentials }),
  });
}

const maxMb = Number(process.env.MAX_UPLOAD_MB) || 10;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxMb * 1024 * 1024 },
});

function sanitizeFilename(name) {
  const base = path.basename(name || 'file');
  const cleaned = base.replace(/[^\w.\-]/g, '_');
  return (cleaned || 'file').slice(0, 200);
}

function buildPublicUrl(bucketName, key, bucketRegion) {
  const base = process.env.S3_PUBLIC_URL_BASE;
  console.log('base', base);
  if (base) {
    const trimmed = base.replace(/\/+$/, '');
    const encodedKey = key.split('/').map(encodeURIComponent).join('/');
    return `${trimmed}/${encodedKey}`;
  }
  const reg = (bucketRegion || getConfiguredRegion()).trim();
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  return `https://${bucketName}.s3.${reg}.amazonaws.com/${encodedKey}`;
}

function handleMulter(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size is ${maxMb} MB.`,
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message || 'Upload parsing failed',
    });
  });
}

/**
 * GET /api/upload
 * List recent uploads (newest first). Optional query: limit (default 50, max 100).
 */
router.get('/', async (req, res) => {
  try {
    const raw = Number(req.query.limit);
    const limit = Math.min(
      Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 50,
      100
    );
    const data = await Upload.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return res.json({ success: true, data });
  } catch (err) {
    console.error('List uploads error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to list uploads',
    });
  }
});

/**
 * GET /api/upload/:id
 * Get one upload record by MongoDB _id (includes url, key, metadata).
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid upload id',
      });
    }
    const doc = await Upload.findById(id).lean();
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Upload not found',
      });
    }
    return res.json({ success: true, data: doc });
  } catch (err) {
    console.error('Get upload error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to get upload',
    });
  }
});

/**
 * POST /api/upload
 * multipart/form-data field name: "file"
 */
router.post('/', handleMulter, async (req, res) => {
  try {
    const bucket = getBucketName();
    if (!bucket) {
      return res.status(503).json({
        success: false,
        message:
          'S3 is not configured. Set AWS_S3_BUCKET or AWS_BUCKET_NAME (and AWS credentials / IAM role).',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file sent. Use form field name "file" (multipart/form-data).',
      });
    }

    const rawPrefix = process.env.S3_UPLOAD_PREFIX || 'uploads';
    const prefix = rawPrefix.replace(/^\/+|\/+$/g, '');
    const safeName = sanitizeFilename(req.file.originalname);
    const key = `${prefix}/${Date.now()}-${safeName}`;

    const client = getS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype || 'application/octet-stream',
      })
    );

    let bucketRegion = getConfiguredRegion();
    try {
      const head = await client.send(new HeadBucketCommand({ Bucket: bucket }));
      if (head.BucketRegion) bucketRegion = head.BucketRegion;
    } catch {
      // URL falls back to AWS_REGION if HeadBucket is not allowed
    }

    const url = buildPublicUrl(bucket, key, bucketRegion);

    let record;
    try {
      record = await Upload.create({
        key,
        url,
        bucket,
        region: bucketRegion,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype || 'application/octet-stream',
        size: req.file.size,
      });
    } catch (dbErr) {
      console.error('Upload DB save error:', dbErr);
      try {
        await client.send(
          new DeleteObjectCommand({ Bucket: bucket, Key: key })
        );
      } catch (delErr) {
        console.error('S3 rollback after DB failure:', delErr);
      }
      return res.status(500).json({
        success: false,
        message: 'File reached S3 but could not be saved to the database.',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'File uploaded',
      data: {
        id: record._id,
        key,
        url,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        createdAt: record.createdAt,
      },
    });
  } catch (err) {
    console.error('S3 upload error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to upload to S3',
    });
  }
});

module.exports = router;
