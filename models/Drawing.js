import mongoose from 'mongoose';

const drawingSchema = new mongoose.Schema(
  {
    name: { type: String, default: 'Anonymous' },
    message: { type: String, required: true },
    imageUrl: { type: String, required: true },
    ipAddress: { type: String, required: true }, // used for IP check
  },
  { timestamps: true }
);

// index IP address for fast existence checks
drawingSchema.index({ ipAddress: 1 });

const Drawing = mongoose.model('Drawing', drawingSchema);

export default Drawing;
