import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';

// NOTE: uses the standard Cloudinary env var names. If your existing
// Cloudinary setup uses a single CLOUDINARY_URL instead, swap the config
// call below for: cloudinary.config(true) — it auto-reads CLOUDINARY_URL.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const GRAPH_VERSION = 'v18.0';

/**
 * WhatsApp media messages only carry a media *id*, not a URL. This
 * resolves that id to a short-lived (a few minutes) download URL.
 */
export async function getWhatsAppMediaUrl(mediaId) {
  const res = await axios.get(`https://graph.facebook.com/${GRAPH_VERSION}/${mediaId}`, {
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` },
  });
  return res.data.url;
}

/**
 * Downloads the actual image bytes from that short-lived URL. Meta
 * requires the same bearer token on the download request too.
 */
export async function downloadWhatsAppMedia(mediaUrl) {
  const res = await axios.get(mediaUrl, {
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` },
    responseType: 'arraybuffer',
  });
  return Buffer.from(res.data);
}

/**
 * Uploads an image buffer to Cloudinary and returns { url, publicId }.
 */
export function uploadBufferToCloudinary(buffer, folder = 'heaven-homes-listings') {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * One-shot convenience: WhatsApp media id -> Cloudinary { url, publicId }.
 */
export async function saveWhatsAppImageToCloudinary(mediaId, folder) {
  const tempUrl = await getWhatsAppMediaUrl(mediaId);
  const buffer = await downloadWhatsAppMedia(tempUrl);
  return uploadBufferToCloudinary(buffer, folder);
}

export default cloudinary;