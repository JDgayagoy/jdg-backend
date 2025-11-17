import express from 'express';
import cloudinary from 'cloudinary';
import Drawing from '../models/Drawing.js';

const router = express.Router();

// helper to get client IP consistently
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
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

    const clientIp = getClientIp(req);
    console.log('[POST-DRAWING] IP:', clientIp);

    const existingDrawing = await Drawing.findOne({ ipAddress: clientIp });

    if (existingDrawing) {
      return res.status(403).json({
        error:
          'Forbidden: Only one drawing submission is allowed per IP address.',
      });
    }

    const cloudinaryResponse = await cloudinary.v2.uploader.upload(imageData, {
      folder: 'drawings/',
      resource_type: 'auto',
    });

    const imageUrl = cloudinaryResponse.secure_url;

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
    });
  }
});

export default router;
