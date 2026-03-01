import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../auth/firebase';

/**
 * Deterministic conversation ID for two UIDs (sorted so order doesn't matter).
 */
export function makeFriendConversationId(uid1, uid2) {
  return [uid1, uid2].sort().join('_');
}

/**
 * Returns the conversationId for an existing (or newly created) 1-to-1 conversation.
 */
export async function getOrCreateFriendConversation({
  myUid, myHandle, myPhotoURL,
  friendUid, friendHandle, friendPhotoURL,
}) {
  const conversationId = makeFriendConversationId(myUid, friendUid);
  const ref = doc(db, 'friend-conversations', conversationId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      participantUids: [myUid, friendUid].sort(),
      participantHandles: { [myUid]: myHandle || '', [friendUid]: friendHandle || '' },
      participantPhotos: { [myUid]: myPhotoURL || null, [friendUid]: friendPhotoURL || null },
      lastMessage: null,
      lastMessageAt: serverTimestamp(),
      lastMessageBy: null,
      unreadBy: [],
      createdAt: serverTimestamp(),
    });
  }

  return conversationId;
}
