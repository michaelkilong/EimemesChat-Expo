// EimemesChat-Expo/hooks/useConversations.ts
import { useState, useEffect, useCallback } from 'react';
import {
  collection, query, orderBy, limit, onSnapshot,
  addDoc, getDocs, writeBatch, doc, deleteDoc,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

export interface Conversation {
  id: string;
  title?: string;
  messages?: any[];
  createdAt?: any;
  updatedAt?: any;
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) { setConversations([]); return; }

    const ref = collection(db, 'users', user.uid, 'conversations');
    const q = query(ref, orderBy('updatedAt', 'desc'), limit(200));
    const unsub = onSnapshot(q, snap => {
      setConversations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Conversation)));
    }, err => console.error('Conversations snapshot error:', err));

    return unsub;
  }, []);

  const createNewChat = useCallback(async (): Promise<string | null> => {
    const user = auth.currentUser;
    if (!user) return null;
    try {
      const ref = await addDoc(collection(db, 'users', user.uid, 'conversations'), {
        title: 'New conversation',
        createdAt: new Date(), updatedAt: new Date(), messages: [],
      });
      return ref.id;
    } catch (err) {
      console.error('createNewChat:', err);
      return null;
    }
  }, []);

  const deleteConv = useCallback(async (convId: string) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'conversations', convId));
    } catch (err) {
      console.error('deleteConv:', err);
    }
  }, []);

  const clearAllChats = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const snap = await getDocs(collection(db, 'users', user.uid, 'conversations'));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    } catch (err) {
      console.error('clearAllChats:', err);
    }
  }, []);

  return { conversations, createNewChat, deleteConv, clearAllChats };
}