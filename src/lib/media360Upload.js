import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../auth/firebase';

const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const VIDEO_TYPES = ['video/mp4', 'video/webm'];
const ALL_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES];

export function validate360File(file) {
  if (!file) return { valid: false, error: 'No file selected.' };
  if (!ALL_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, WebP, MP4, or WebM files are accepted.' };
  }
  const isVideo = VIDEO_TYPES.includes(file.type);
  const limit = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  if (file.size > limit) {
    return { valid: false, error: `File must be under ${isVideo ? '100' : '20'}MB.` };
  }
  return { valid: true, type: isVideo ? 'video' : 'image' };
}

export async function upload360Media(slot, file) {
  if (!storage) throw new Error('Firebase Storage not configured.');

  const validation = validate360File(file);
  if (!validation.valid) throw new Error(validation.error);

  const ext = file.name.split('.').pop().toLowerCase();
  const timestamp = Date.now();
  const path = `360-media/${slot}/${timestamp}.${ext}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file, { contentType: file.type });
  const url = await getDownloadURL(storageRef);

  return { url, storagePath: path, type: validation.type };
}

export async function delete360Media(storagePath) {
  if (!storage) throw new Error('Firebase Storage not configured.');
  const storageRef = ref(storage, storagePath);
  await deleteObject(storageRef);
}
