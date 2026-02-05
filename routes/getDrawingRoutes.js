import express from 'express';
import Drawing from '../models/Drawing.js';

const router = express.Router();

// Simple in-memory cache to avoid hitting DB on every request for random set
const cache = {
  data: null,
  expiresAt: 0,
};

router.get('/', async (req, res) => {
  try {
    console.log('[GET-DRAWINGS] Request received');

    // return cached data if fresh
    if (cache.data && Date.now() < cache.expiresAt) {
      console.log('[GET-DRAWINGS] Returning cached drawings');
      return res.status(200).json(cache.data);
    }

    // sample 10 and only project needed fields to reduce document size
    const drawings = await Drawing.aggregate([
      { $sample: { size: 10 } },
      { $project: { name: 1, message: 1, imageUrl: 1, createdAt: 1 } },
    ]);

    // cache for 30 seconds
    cache.data = drawings;
    cache.expiresAt = Date.now() + 30 * 1000;

    console.log('[GET-DRAWINGS] Returning', drawings.length, 'drawings');
    return res.status(200).json(drawings);
  } catch (error) {
    console.error('Error fetching random drawings:', error);
    return res.status(500).json({ error: 'Failed to load random drawings' });
  }
});

export default router;
