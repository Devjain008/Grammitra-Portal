import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directory exists
const uploadDir = './uploads/chat';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    // Strip codec info from extension (e.g. "audio/webm;codecs=opus" → .webm)
    const baseMime = file.mimetype.split(';')[0].trim();
    const extMap = {
      'audio/webm': '.webm', 'audio/ogg': '.ogg', 'audio/mpeg': '.mp3',
      'audio/mp4': '.m4a', 'audio/wav': '.wav', 'audio/aac': '.aac',
      'video/mp4': '.mp4', 'video/webm': '.webm', 'video/ogg': '.ogv',
      'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif',
      'image/webp': '.webp',
    };
    const ext = extMap[baseMime] || path.extname(file.originalname) || '.bin';
    cb(null, `chat-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Strip codec suffix like "audio/webm;codecs=opus" → "audio/webm"
  const baseMime = file.mimetype.split(';')[0].trim();

  const allowed =
    baseMime.startsWith('image/') ||
    baseMime.startsWith('video/') ||
    baseMime.startsWith('audio/') ||
    baseMime === 'application/pdf' ||
    baseMime === 'application/zip' ||
    baseMime === 'application/x-zip-compressed' ||
    baseMime === 'application/msword' ||
    baseMime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    baseMime === 'application/vnd.ms-excel' ||
    baseMime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    baseMime === 'text/plain';

  if (allowed) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB
});

export default upload;
