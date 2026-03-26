// useTheme.ts — v1.0 (Expo)
import { useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { useApp } from '../context/AppContext';

const THEME_KEY = 'ec_theme';

export function useTheme() {
  const { isDark, setIsDark } = useApp();
  const systemScheme = useColorScheme();

  // Init from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(saved => {
      if (saved === 'dark') { setIsDark(true); return; }
      if (saved === 'light') { setIsDark(false); return; }
      // No saved preference — follow system
      setIsDark(systemScheme === 'dark');
    }).catch(() => {
      setIsDark(systemScheme === 'dark');
    });
  }, []); // eslint-disable-line

  const toggleTheme = useCallback(async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light').catch(() => {});
  }, [isDark, setIsDark]);

  return { isDark, toggleTheme };
}
