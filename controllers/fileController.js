import multer from "multer";
import { nanoid } from "nanoid";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

// ------------------ Multer Setup ------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage: storage });

// ------------------ In-Memory Store ------------------
let files = {}; 
// Example: { "abc123": { filePath, originalName, expiresAt } }

// ✅ Load HOSTNAME from .env (fallback localhost for dev)
const HOSTNAME = process.env.HOSTNAME || "http://localhost:10000";

// ------------------ Upload Controller ------------------
export const handleUpload = [
  upload.single("file"), // expecting "file" field from frontend
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const id = nanoid(6); // short random ID
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    files[id] = {
      filePath: req.file.path,
      originalName: req.file.originalname,
      expiresAt
    };

    // ✅ Generate link with Render hostname
    const fileLink = `${HOSTNAME}/file/${id}`;

    res.json({
      id,
      link: fileLink,
      expiresAt
    });
  }
];

// ------------------ Download Controller ------------------
export const handleDownload = (req, res) => {
  const { id } = req.params;
  const fileRecord = files[id];

  if (!fileRecord) {
    return res.status(404).json({ error: "File not found or expired" });
  }

  // Check expiry 
  if (Date.now() > fileRecord.expiresAt) {
    try {
      fs.unlinkSync(fileRecord.filePath);
    } catch (err) {
      console.error("Error deleting expired file:", err.message);
    }
    delete files[id];
    return res.status(410).json({ error: "Link expired" });
  }

  res.download(fileRecord.filePath, fileRecord.originalName);
};

// ------------------ Cleanup Task ------------------
setInterval(() => {
  const now = Date.now();
  for (const id in files) {
    if (files[id].expiresAt < now) {
      try {
        fs.unlinkSync(files[id].filePath);
      } catch (err) {
        console.error("Cleanup error:", err.message);
      }
      delete files[id];
      console.log(`🗑️ Deleted expired file with id: ${id}`);
    }
  }
}, 60 * 1000);
