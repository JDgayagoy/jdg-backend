import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import drawingRoutes from './routes/drawingRoutes.js'; // The drawing upload route
import cloudinary from 'cloudinary';
import drawings from './routes/getDrawingRoutes.js';
import checkNoteRoute from './routes/checkNoteRoutes.js'; // Import the check drawing route
import spotifyRoute from './routes/spotifyRoutes.js';
dotenv.config();

const app = express();

app.set('trust proxy', true);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use(cors({ 
  origin: process.env.CLIENT_ORIGIN || '*',
  credentials: true, // Allow sending cookies and credentials
}));

app.use(express.json({ limit: '100mb' }));
app.use('/api/spotify', spotifyRoute);
// Register routes
app.use('/api/getDrawings', drawings);
app.use('/api/postDrawing', drawingRoutes);
app.use('/api/check-drawing',checkNoteRoute );

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
  })
  .catch((err) => console.error('Mongo connection error:', err));
