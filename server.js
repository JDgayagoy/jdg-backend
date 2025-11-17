import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cloudinary from 'cloudinary';

import drawingRoutes from './routes/postDrawing.js';      // POST /api/postDrawing
import drawings from './routes/getDrawingRoutes.js';      // GET /api/getDrawings
import checkNoteRoute from './routes/checkNoteRoutes.js'; // GET /api/check-drawing
import spotifyRoute from './routes/spotifyRoutes.js';

dotenv.config();

const app = express();

// ✅ Important so req.ip uses X-Forwarded-For behind Render/proxies
app.set('trust proxy', true);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || '*', // you haven't touched this yet
    credentials: true,
  })
);

app.use(express.json({ limit: '100mb' }));

app.use('/api/spotify', spotifyRoute);
app.use('/api/getDrawings', drawings);
app.use('/api/postDrawing', drawingRoutes);
app.use('/api/check-drawing', checkNoteRoute);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
  })
  .catch((err) => console.error('Mongo connection error:', err));
