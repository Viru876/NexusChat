import multer from 'multer';

// Store files in memory so we can stream buffers to Cloudinary.
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
  },
});

export const uploadSingle = upload.single('file');
export const uploadAvatar = upload.single('avatar');
