//  File inside controllers

import multer from "multer";
import { nanoid } from "nanoid";
import path from "path";
import fs from "fs";

// Setup multer storage (save files into /uploads folder)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage: storage });

// In-memory store for uploaded files metadata
// Example: { "abc123": { filePath, originalName, expiresAt } }
let files = {};

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

    // Example insecure link: rik.com/abc123
    const insecureLink = `rik.com/${id}`;

    res.json({
      link: insecureLink,
      expiresAt
    });
  }
];

// ------------------ Download Controller ------------------//
export const handleDownload = (req, res) => {
  const { id } = req.params;
  const fileRecord = files[id];

  if (!fileRecord) {
    return res.status(404).json({ error: "File not found or expired" });
  }

  // Check expiry 
  if (Date.now() > fileRecord.expiresAt) {
    // Delete expired file from server
    try {
      fs.unlinkSync(fileRecord.filePath);
    } catch (err) {
      console.error("Error deleting expired file:", err.message);
    }
    delete files[id];
    return res.status(410).json({ error: "Link expired" });
  }

  // Send file for download
  res.download(fileRecord.filePath, fileRecord.originalName);
};

// ------------------ Cleanup Task ------------------
// Optional: Every minute, remove expired files
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
