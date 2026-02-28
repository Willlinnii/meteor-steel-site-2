import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../auth/firebase';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

/**
 * Validates file for guild document upload.
 * Returns { valid: true } or { valid: false, error: string }.
 */
export function validateFile(file) {
  if (!file) return { valid: false, error: 'No file selected.' };
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File must be under 10MB.' };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only PDF, JPEG, PNG, or WebP files are accepted.' };
  }
  return { valid: true };
}

/**
 * Uploads a guild document to Firebase Cloud Storage.
 * Returns { url, name } on success.
 */
export async function uploadGuildDocument(uid, file) {
  if (!storage) throw new Error('Firebase Storage not configured.');

  const validation = validateFile(file);
  if (!validation.valid) throw new Error(validation.error);

  const ext = file.name.split('.').pop() || 'pdf';
  const timestamp = Date.now();
  const path = `guild-docs/${uid}/credential-${timestamp}.${ext}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file, { contentType: file.type });
  const url = await getDownloadURL(storageRef);

  return { url, name: file.name };
}
