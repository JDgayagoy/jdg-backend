import express from 'express';
import Drawing from '../models/Drawing.js';

const router = express.Router();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress;
}

router.get('/', async (req, res) => {
  try {
    const userIp = getClientIp(req);
    console.log('[CHECK-DRAWING] IP:', userIp);

    // only need existence — keep query light
    const existingDrawing = await Drawing.findOne({ ipAddress: userIp }).select('_id').lean();
    console.log('[CHECK-DRAWING] Found?', !!existingDrawing);
    return res.status(200).json({ hasPosted: !!existingDrawing });
  } catch (error) {
    console.error('Error checking drawing:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
