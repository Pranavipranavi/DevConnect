import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import cloudinary from '../config/cloudinary.js';

const toDataUri = (file) => `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadRoot = path.resolve(__dirname, '..', 'uploads');

const extensionFor = (file) => {
  const fromName = path.extname(file.originalname || '').toLowerCase();
  if (fromName && fromName.length <= 8) return fromName;
  return `.${String(file.mimetype || 'image/jpeg').split('/')[1] || 'jpg'}`;
};

const localUploadUrl = async (file, folder) => {
  const safeFolder = String(folder || 'images').replace(/[^a-z0-9_-]/gi, '').toLowerCase() || 'images';
  const targetDir = path.join(uploadRoot, safeFolder);
  await fs.mkdir(targetDir, { recursive: true });

  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extensionFor(file)}`;
  await fs.writeFile(path.join(targetDir, filename), file.buffer);

  const publicOrigin = process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${publicOrigin.replace(/\/$/, '')}/uploads/${safeFolder}/${filename}`;
};

export const uploadImage = async (file, folder) => {
  if (!file) return null;
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return localUploadUrl(file, folder);
  }
  const result = await cloudinary.uploader.upload(toDataUri(file), {
    folder: `devconnect/${folder}`,
    resource_type: 'image',
    transformation: [{ quality: 'auto', fetch_format: 'auto' }]
  });
  return result.secure_url;
};
