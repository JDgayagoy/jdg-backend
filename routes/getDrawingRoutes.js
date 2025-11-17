import express from 'express';
import Drawing from '../models/Drawing.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    console.log('[GET-DRAWINGS] Request received');
    const drawings = await Drawing.aggregate([{ $sample: { size: 10 } }]);
    console.log('[GET-DRAWINGS] Returning', drawings.length, 'drawings');
    return res.status(200).json(drawings);
  } catch (error) {
    console.error('Error fetching random drawings:', error);
    return res.status(500).json({ error: 'Failed to load random drawings' });
  }
});

export default router;
