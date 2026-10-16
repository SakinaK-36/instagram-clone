import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.warn('WARNING: Cloudinary credentials are missing in .env, so image uploads will fail.');
}

const storage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: 'instagram_posts',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    // Cap the stored size so huge photos don't slow the feed down
    transformation: [{ width: 1080, crop: 'limit', quality: 'auto' }],
  }),
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG or WEBP images are allowed'));
    }
  },
});

// Best-effort removal of an uploaded image, given its stored URL
export const deleteImageByUrl = async (url: string): Promise<void> => {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
  if (!match) return;
  try {
    await cloudinary.uploader.destroy(match[1]);
  } catch (err) {
    console.error('Failed to delete image from Cloudinary:', err);
  }
};