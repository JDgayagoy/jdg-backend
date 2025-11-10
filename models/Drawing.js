import mongoose from 'mongoose';

const DrawingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  message: { type: String, required: true },
  imageUrl: { type: String, required: true },
  ipAddress: { type: String, required: true, unique: true },
}, {
  timestamps: true, // Automatically add createdAt/updatedAt timestamps
});

const Drawing = mongoose.model('Drawing', DrawingSchema);

export default Drawing;
