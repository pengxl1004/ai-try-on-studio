'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AppSettings } from '@/lib/types';
import { DEFAULT_SETTINGS } from '@/lib/types';

const STORAGE_KEY = 'tryon_settings';

function loadSettings(): AppSettings {
  try {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed === 'object' && parsed !== null) {
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    }
  } catch {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
  return DEFAULT_SETTINGS;
}

export function useSettings() {
  const [settings, setSettingsRaw] = useState<AppSettings>(DEFAULT_SETTINGS);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      setSettingsRaw(loadSettings());
    }
  }, []);

  const setSettings = useCallback((updater: AppSettings | ((prev: AppSettings) => AppSettings)) => {
    setSettingsRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return next;
    });
  }, []);

  useEffect(() => {
    if (initialized.current) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch { /* ignore */ }
    }
  }, [settings]);

  return [settings, setSettings] as const;
}
