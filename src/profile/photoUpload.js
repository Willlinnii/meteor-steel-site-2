import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../auth/firebase';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_DIMENSION = 400;

/**
 * Validates a photo file for profile upload.
 * Returns { valid: true } or { valid: false, error: string }.
 */
export function validatePhoto(file) {
  if (!file) return { valid: false, error: 'No file selected.' };
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Photo must be under 5MB.' };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, or WebP images are accepted.' };
  }
  return { valid: true };
}

/**
 * Resizes an image file to MAX_DIMENSION x MAX_DIMENSION max using canvas.
 * Returns a Blob.
 */
function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
        resolve(file);
        return;
      }
      const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Canvas resize failed.'))),
        file.type,
        0.85,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image.')); };
    img.src = url;
  });
}

/**
 * Uploads a profile photo to Firebase Storage after client-side resize.
 * Returns the download URL.
 */
export async function uploadProfilePhoto(uid, file) {
  if (!storage) throw new Error('Firebase Storage not configured.');

  const validation = validatePhoto(file);
  if (!validation.valid) throw new Error(validation.error);

  const resized = await resizeImage(file);
  const ext = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1];
  const timestamp = Date.now();
  const path = `profile-photos/${uid}/avatar-${timestamp}.${ext}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, resized, { contentType: file.type });
  return await getDownloadURL(storageRef);
}
