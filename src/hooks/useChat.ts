// useChat.ts — v1.1 (Expo)
// Uses XMLHttpRequest for streaming — works on all RN/Expo versions.
// v1.1: Fixed XHR abort (onabort event), cleaner stop handling.
import { useState, useRef, useCallback } from 'react';
import { arrayUnion, updateDoc, getDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useApp } from '../context/AppContext';
import { getTime } from '../lib/markdown';
import type { Message, Attachment } from '../types';
import { API_BASE, DAILY_LIMIT, MAX_MSGS, AI_TIMEOUT } from '../constants';

function todayStr() { return new Date().toISOString().slice(0, 10); }

export function useChat(
  convId: string | null,
  setConvId: (id: string) => void,
  conversations: Array<{ id: string; messages?: Message[] }>,
  createNewChat: () => Promise<string | null>,
  setConvTitle: (t: string) => void,
  isStreamingRef: React.MutableRefObject<boolean>,
  setMessages: (msgs: Message[]) => void,
) {
  const { currentUser, showToast } = useApp();

  const [isSending,        setIsSending]       = useState(false);
  const [isStreaming,      setIsStreaming]      = useState(false);
  const [isTyping,         setIsTyping]         = useState(false);
  const [streamText,       setStreamText]       = useState('');
  const [streamDone,       setStreamDone]       = useState(false);
  const [streamModel,      setStreamModel]      = useState('');
  const [streamDisclaimer, setStreamDisclaimer] = useState<'critical' | 'web' | false>(false);
  const [isSearching,      setIsSearching]      = useState(false);
  const [streamSources,    setStreamSources]    = useState<{ title: string; url: string }[]>([]);

  const xhrRef           = useRef<XMLHttpRequest | null>(null);
  const renderQueueRef   = useRef<string[]>([]);
  const displayedRef     = useRef('');
  const renderTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastProcessedRef = useRef(0);
  const abortedRef       = useRef(false);

  const pumpQueue = useCallback(() => {
    if (renderQueueRef.current.length === 0) { renderTimerRef.current = null; return; }
    displayedRef.current += renderQueueRef.current.shift()!;
    setStreamText(displayedRef.current);
    renderTimerRef.current = setTimeout(pumpQueue, 18);
  }, []);

  const enqueue = useCallback((token: string) => {
    renderQueueRef.current.push(token);
    if (!renderTimerRef.current) pumpQueue();
  }, [pumpQueue]);

  const drainQueue = () => new Promise<void>(resolve => {
    function check() {
      if (renderQueueRef.current.length === 0 && !renderTimerRef.current) { resolve(); return; }
      setTimeout(check, 25);
    }
    check();
  });

  const getUserMetaRef = useCallback(() =>
    currentUser ? doc(db, 'users', currentUser.uid) : null,
  [currentUser]);

  const checkAndIncrementDailyCount = useCallback(async (): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const ref  = getUserMetaRef()!;
      const snap = await getDoc(ref);
      const data = snap.exists() ? snap.data() : {};
      const today      = todayStr();
      const lastDate   = data.lastDate || '';
      const dailyCount = lastDate === today ? (data.dailyCount || 0) : 0;
      if (dailyCount >= DAILY_LIMIT) return false;
      await setDoc(ref, { dailyCount: dailyCount + 1, lastDate: today }, { merge: true });
      return true;
    } catch { return true; }
  }, [currentUser, getUserMetaRef]);

  const getConvDocRef = useCallback((id: string) =>
    currentUser ? doc(db, 'users', currentUser.uid, 'conversations', id) : null,
  [currentUser]);

  const sendMessage = useCallback(async (
    text: string,
    chipsUsedSetter: () => void,
    attachment?: Attachment,
    useWebSearch?: boolean,
  ) => {
    if (!text.trim() || isSending || !currentUser) return;

    const allowed = await checkAndIncrementDailyCount();
    if (!allowed) {
      showToast(`Daily limit of ${DAILY_LIMIT} messages reached. Resets tomorrow!`);
      return;
    }

    setIsSending(true);
    chipsUsedSetter();
    abortedRef.current = false;

    let activeConvId = convId;
    if (!activeConvId) {
      const newId = await createNewChat();
      if (!newId) { setIsSending(false); return; }
      activeConvId = newId;
      setConvId(newId);
    }

    const convRef = getConvDocRef(activeConvId)!;
    const conv    = conversations.find(c => c.id === activeConvId);

    if ((conv?.messages?.length ?? 0) >= MAX_MSGS) {
      showToast(`Max ${MAX_MSGS} messages reached. Start a new chat.`);
      setIsSending(false); return;
    }

    const isFirstMessage = !conv?.messages?.length;
    if (isFirstMessage) {
      const tempTitle = text.slice(0, 50) + (text.length > 50 ? '...' : '');
      updateDoc(convRef, { title: tempTitle }).catch(console.error);
      setConvTitle(tempTitle);
    }

    const userMsg: Message = {
      role: 'user', content: text, time: getTime(),
      ...(attachment && { attachment: { name: attachment.name, type: attachment.type } }),
    };
    try {
      await updateDoc(convRef, { messages: arrayUnion(userMsg), updatedAt: new Date() });
    } catch (err: any) {
      showToast(err.code === 'permission-denied'
        ? 'Permission denied. Please sign out and back in.'
        : 'Failed to send message. Check your connection.');
      setIsSending(false); return;
    }

    // Reset stream state
    renderQueueRef.current   = [];
    displayedRef.current     = '';
    lastProcessedRef.current = 0;
    if (renderTimerRef.current) { clearTimeout(renderTimerRef.current); renderTimerRef.current = null; }
    setStreamText('');
    setStreamDone(false);
    setStreamModel('');
    setStreamDisclaimer(false as const);
    setIsSearching(false);
    setStreamSources([]);
    setIsTyping(true);

    try {
      const snap    = await getDoc(convRef);
      const history = snap.exists() ? (snap.data().messages || []).slice(-20) : [];
      const idToken = await currentUser.getIdToken();

      const body: Record<string, unknown> = {
        message: text, history, isFirstMessage, useWebSearch: !!useWebSearch,
      };
      if (attachment) {
        body.attachment = {
          name: attachment.name, type: attachment.type,
          mimeType: attachment.mimeType, content: attachment.content,
        };
      }

      let fullText   = '';
      let model      = '';
      let disclaimer: 'critical' | 'web' | false = false;
      let sources: { title: string; url: string }[] = [];
      let buf = '';

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;
        xhr.open('POST', `${API_BASE}/api/chat`);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Authorization', `Bearer ${idToken}`);
        xhr.timeout = AI_TIMEOUT;

        xhr.onreadystatechange = () => {
          if (xhr.readyState < 3) return;

          const newText = xhr.responseText.slice(lastProcessedRef.current);
          lastProcessedRef.current = xhr.responseText.length;

          buf += newText;
          const lines = buf.split('\n');
          buf = lines.pop()!;

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            try {
              const parsed = JSON.parse(raw);
              if (parsed.searching) { setIsTyping(false); setIsSearching(true); }
              if (parsed.error)     { setIsTyping(false); enqueue(parsed.error); }
              if (parsed.token)     {
                setIsTyping(false); setIsSearching(false);
                fullText += parsed.token; enqueue(parsed.token);
              }
              if (parsed.outputBlocked && parsed.safeReply) {
                fullText = parsed.safeReply;
                renderQueueRef.current = [];
                displayedRef.current   = fullText;
                setStreamText(fullText);
              }
              if (parsed.done) {
                model      = parsed.model      || '';
                disclaimer = parsed.disclaimer || false;
                sources    = parsed.sources    || [];
                if (sources.length) setStreamSources(sources);
                if (parsed.outputBlocked && parsed.reply) fullText = parsed.reply;
              }
              if (parsed.title) {
                const aiTitle = parsed.title as string;
                updateDoc(convRef, { title: aiTitle }).catch(console.error);
                setConvTitle(aiTitle);
              }
            } catch { /* malformed chunk */ }
          }

          if (xhr.readyState === 3 && !isStreamingRef.current) {
            isStreamingRef.current = true;
            setIsStreaming(true);
          }
        };

        xhr.onload    = () => resolve();
        xhr.onerror   = () => reject(new Error('Network error'));
        xhr.ontimeout = () => reject(new Error('Request timed out'));
        xhr.onabort   = () => { abortedRef.current = true; resolve(); };
        xhr.send(JSON.stringify(body));
      });

      if (abortedRef.current) {
        setIsTyping(false);
        isStreamingRef.current = false;
        setIsStreaming(false);
        xhrRef.current = null;
        setIsSending(false);
        return;
      }

      await drainQueue();
      setStreamModel(model);
      setStreamDisclaimer(disclaimer);
      setStreamDone(true);

      const aiMsg: Message = {
        role: 'assistant', content: fullText,
        time: getTime(), model, disclaimer,
        ...(sources.length && { sources }),
      };
      await updateDoc(convRef, { messages: arrayUnion(aiMsg), updatedAt: new Date() });

      try {
        const freshSnap = await getDoc(convRef);
        if (freshSnap.exists()) {
          const freshData = freshSnap.data();
          setMessages(freshData.messages || []);
          setConvTitle(freshData.title || '');
        }
      } catch { /* fallback */ }

      isStreamingRef.current = false;
      setIsStreaming(false);
      setStreamDone(false);
      xhrRef.current = null;

    } catch (err: any) {
      setIsTyping(false);
      isStreamingRef.current = false;
      setIsStreaming(false);
      xhrRef.current = null;

      const errorMsg = err.code === 'permission-denied'
        ? 'Permission denied. Please sign out and back in.'
        : "I'm sorry, something went wrong. Please try again.";
      try {
        await updateDoc(getConvDocRef(activeConvId)!, {
          messages: arrayUnion({ role: 'assistant', content: errorMsg, time: getTime(), model: '' }),
          updatedAt: new Date(),
        });
      } catch { /* ignore */ }
    } finally {
      setIsSending(false);
    }
  }, [isSending, currentUser, convId, conversations, createNewChat, setConvId, setConvTitle,
      isStreamingRef, setMessages, checkAndIncrementDailyCount, showToast, getConvDocRef, enqueue]);

  const stopStreaming = useCallback(() => {
    abortedRef.current = true;
    xhrRef.current?.abort();
    xhrRef.current = null;
  }, []);

  return {
    isSending, isStreaming, isTyping, isSearching,
    streamText, streamDone, streamModel, streamDisclaimer, streamSources,
    sendMessage, stopStreaming, setStreamDone,
  };
}
