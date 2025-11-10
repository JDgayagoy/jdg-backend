// server/routes/getDrawingRoutes.js
import express from "express";
import Drawing from '../models/Drawing.js'; // adjust path if needed

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // Fetch 10 random drawings
    const drawings = await Drawing.aggregate([{ $sample: { size: 10 } }]);
    return res.status(200).json(drawings);
  } catch (error) {
    console.error("Error fetching random drawings:", error);
    return res.status(500).json({ error: "Failed to load random drawings" });
  }
});

export default router;
