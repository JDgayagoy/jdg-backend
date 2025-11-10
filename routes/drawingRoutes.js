import express from 'express';
import cloudinary from 'cloudinary';
import Drawing from '../models/Drawing.js'; // Drawing model
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { name, message, imageData } = req.body;
    
    if (!message || !imageData) {
      return res.status(400).json({ error: 'Message and drawing data are required.' });
    }

    // 1. Get the client's IP address
    // NOTE: If running behind a proxy (like Nginx or a load balancer),
    // you must configure Express to trust proxies (app.set('trust proxy', true))
    // for req.ip to return the actual client IP instead of the proxy IP.
    const clientIp = req.ip; 

    // 2. Check the database for an existing drawing from this IP
    const existingDrawing = await Drawing.findOne({ ipAddress: clientIp });

    if (existingDrawing) {
      // 3. If a drawing exists, return an error and block submission
      return res.status(403).json({ 
        error: 'Forbidden: Only one drawing submission is allowed per IP address.' 
      });
    }

    const cloudinaryResponse = await cloudinary.v2.uploader.upload(imageData, {
      folder: 'drawings/',  // Optional: organize images in a folder on Cloudinary
      resource_type: 'auto', // Cloudinary auto-detects file type (image, video, etc.)
    });

    const imageUrl = cloudinaryResponse.secure_url;

    const newDrawing = new Drawing({
      name: name || 'Anonymous',
      message,
      imageUrl,
      ipAddress: clientIp, // 4. Save the IP address with the new drawing
    });

    const savedDrawing = await newDrawing.save();

    res.status(201).json({
      message: 'Drawing successfully uploaded to Cloudinary and saved to MongoDB.',
      drawingId: savedDrawing._id,
      imageUrl,
    });
  } catch (error) {
    console.error('Error saving drawing:', error);
    res.status(500).json({
      error: 'Failed to upload drawing to Cloudinary and save to the database.',
      details: error.message,
      name: error.name,
      code: error.code || null,
    });
  }
});

export default router;