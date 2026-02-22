import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, firebaseConfigured } from '../auth/firebase';

const STAGE_ORDER = [
  'golden-age', 'falling-star', 'impact-crater', 'forge',
  'quenching', 'integration', 'drawing', 'new-age',
];

export default function use360Media() {
  const [slots, setSlots] = useState({});

  useEffect(() => {
    if (!firebaseConfigured || !db) return;
    const unsub = onSnapshot(
      doc(db, 'site-content', '360-media'),
      (snap) => setSlots(snap.exists() ? snap.data().slots || {} : {}),
      () => setSlots({}),
    );
    return unsub;
  }, []);

  const getSlot = useCallback((key) => slots[key] || null, [slots]);

  const getSlotsByPrefix = useCallback((prefix) => {
    const entries = Object.entries(slots)
      .filter(([k]) => k.startsWith(prefix + '.'))
      .map(([k, v]) => ({ slot: k, ...v }));
    // Sort by stage order for monomyth prefix
    if (prefix === 'monomyth') {
      entries.sort((a, b) => {
        const ai = STAGE_ORDER.indexOf(a.slot.replace('monomyth.', ''));
        const bi = STAGE_ORDER.indexOf(b.slot.replace('monomyth.', ''));
        return ai - bi;
      });
    }
    return entries;
  }, [slots]);

  const hasAnySlots = useCallback(
    (prefix) => Object.keys(slots).some(k => k.startsWith(prefix + '.')),
    [slots],
  );

  return useMemo(
    () => ({ slots, getSlot, getSlotsByPrefix, hasAnySlots }),
    [slots, getSlot, getSlotsByPrefix, hasAnySlots],
  );
}
