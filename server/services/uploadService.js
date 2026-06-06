import cloudinary from '../config/cloudinary.js';

const toDataUri = (file) => `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

export const uploadImage = async (file, folder) => {
  if (!file) return null;
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return null;
  }
  const result = await cloudinary.uploader.upload(toDataUri(file), {
    folder: `devconnect/${folder}`,
    resource_type: 'image',
    transformation: [{ quality: 'auto', fetch_format: 'auto' }]
  });
  return result.secure_url;
};
