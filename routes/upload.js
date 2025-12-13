const express = require('express');
const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Multer memory storage
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
const isConfigured = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

// Helper function to upload buffer to Cloudinary
function uploadFromBuffer(buffer, folder = 'user-uploads') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// POST /api/upload
router.post('/upload', upload.single('image'), async (req, res) => {
  console.log("🔥 Upload route hit");   // should appear in terminal
  try {
    if (!req.file) {
      console.log("⚠️ No file received");
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log("📂 File received:", req.file.originalname);
    if (isConfigured) {
      const result = await uploadFromBuffer(req.file.buffer);
      console.log("✅ Cloudinary result:", result);
      return res.json({ url: result.secure_url, public_id: result.public_id });
    } else {
      const filename = `${Date.now()}-${req.file.originalname}`;
      const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
      const filePath = path.join(uploadDir, filename);
      await fs.promises.mkdir(uploadDir, { recursive: true });
      await fs.promises.writeFile(filePath, req.file.buffer);
      console.log("✅ Saved locally:", filePath);
      return res.json({ url: `/uploads/${filename}`, public_id: filename });
    }
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: 'Upload failed' });
  }
});


module.exports = router;
