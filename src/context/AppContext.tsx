// AppContext.tsx — v1.0
// Replaces browser APIs (localStorage, history) with RN equivalents.
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { User } from 'firebase/auth';
import type { View } from '../types';
import { darkTheme, lightTheme, type Theme } from '../theme';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
  authReady: boolean;
  setAuthReady: (r: boolean) => void;
  view: View;
  setView: (v: View) => void;
  theme: Theme;
  isDark: boolean;
  setIsDark: (d: boolean) => void;
  showToast: (msg: string, dur?: number) => void;
  toastMsg: string;
  toastVisible: boolean;
  showConfirm: (msg: string, yesLabel?: string, title?: string) => Promise<boolean>;
  confirmState: { open: boolean; title: string; msg: string; yesLabel: string };
  handleConfirmYes: () => void;
  handleConfirmNo: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (o: boolean) => void;
}

const AppContext = createContext<AppContextType>(null!);
export const useApp = () => useContext(AppContext);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady,   setAuthReady]   = useState(false);
  const [view,        setView]        = useState<View>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark,      setIsDark]      = useState(true);

  const theme = isDark ? darkTheme : lightTheme;

  // Toast
  const [toastMsg,     setToastMsg]     = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, dur = 3500) => {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), dur);
  }, []);

  // Confirm dialog
  const [confirmState, setConfirmState] = useState<{
    open: boolean; title: string; msg: string; yesLabel: string;
  }>({ open: false, title: '', msg: '', yesLabel: 'Delete' });
  const confirmResolve = useRef<((v: boolean) => void) | null>(null);

  const showConfirm = useCallback((msg: string, yesLabel = 'Delete', title = 'Are you sure?') => {
    return new Promise<boolean>(resolve => {
      confirmResolve.current = resolve;
      setConfirmState({ open: true, title, msg, yesLabel });
    });
  }, []);

  const handleConfirmYes = useCallback(() => {
    setConfirmState(s => ({ ...s, open: false }));
    confirmResolve.current?.(true);
    confirmResolve.current = null;
  }, []);

  const handleConfirmNo = useCallback(() => {
    setConfirmState(s => ({ ...s, open: false }));
    confirmResolve.current?.(false);
    confirmResolve.current = null;
  }, []);

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser,
      authReady, setAuthReady,
      view, setView,
      theme, isDark, setIsDark,
      showToast, toastMsg, toastVisible,
      showConfirm, confirmState, handleConfirmYes, handleConfirmNo,
      sidebarOpen, setSidebarOpen,
    }}>
      {children}
    </AppContext.Provider>
  );
}
