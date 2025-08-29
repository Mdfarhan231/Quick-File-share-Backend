// Main Express server entry point

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fileRoutes from "./routes/fileRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middlewares
// Middlewares
app.use(cors({
  origin: 'https://quick-file-share.vercel.app' // Replace with your actual Vercel frontend URL
}));
app.use(express.json());


// Routes
app.use("/", fileRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "Backend is running!" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
