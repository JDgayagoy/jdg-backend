import express from 'express';
import Drawing from '../models/Drawing.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const userIp = req.ip;
  try {
    const existingDrawing = await Drawing.findOne({ ipAddress: userIp });
    if (existingDrawing) {
      return res.status(200).json({ hasPosted: true });
    } else {
      return res.status(200).json({ hasPosted: false });
    }
  } catch (error) {
    console.error('Error checking drawing:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
