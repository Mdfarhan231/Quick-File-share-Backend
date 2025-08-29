// File inside routes

import express from "express";
import { handleUpload, handleDownload } from "../controllers/fileController.js";

const router = express.Router();

// POST /upload → file upload API
router.post("/upload", handleUpload);

// GET /file/:id → file download API
router.get("/file/:id", handleDownload);

export default router;
