import express from 'express';
import cloudinary from 'cloudinary';
import Drawing from '../models/Drawing.js';

const router = express.Router();

// Helper to get client IP consistently
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // X-Forwarded-For can be: "client, proxy1, proxy2"
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress;
}

router.post('/', async (req, res) => {
  try {
    const { name, message, imageData } = req.body;

    if (!message || !imageData) {
      return res
        .status(400)
        .json({ error: 'Message and drawing data are required.' });
    }

    // ✅ 1. Get the client's IP address (behind proxy)
    const clientIp = getClientIp(req);
    console.log('[POST-DRAWING] IP:', clientIp);

    // ✅ 2. Check if this IP already submitted a drawing
    const existingDrawing = await Drawing.findOne({ ipAddress: clientIp });

    if (existingDrawing) {
      return res.status(403).json({
        error:
          'Forbidden: Only one drawing submission is allowed per IP address.',
      });
    }

    // 3. Upload the image to Cloudinary
    const cloudinaryResponse = await cloudinary.v2.uploader.upload(imageData, {
      folder: 'drawings/',
      resource_type: 'auto',
    });

    const imageUrl = cloudinaryResponse.secure_url;

    // 4. Save the drawing in MongoDB with the IP
    const newDrawing = new Drawing({
      name: name || 'Anonymous',
      message,
      imageUrl,
      ipAddress: clientIp,
    });

    const savedDrawing = await newDrawing.save();

    res.status(201).json({
      message:
        'Drawing successfully uploaded to Cloudinary and saved to MongoDB.',
      drawingId: savedDrawing._id,
      imageUrl,
    });
  } catch (error) {
    console.error('Error saving drawing:', error);
    res.status(500).json({
      error:
        'Failed to upload drawing to Cloudinary and save to the database.',
      details: error.message,
      name: error.name,
      code: error.code || null,
    });
  }
});

export default router;
