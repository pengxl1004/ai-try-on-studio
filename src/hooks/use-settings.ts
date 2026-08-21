'use client';

import { useState, useEffect } from 'react';
import type { AppSettings } from '@/lib/types';
import { DEFAULT_SETTINGS } from '@/lib/types';

const STORAGE_KEY = 'tryon_settings';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        }
      }
    } catch {
      // ignore parse errors
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch {
        // ignore storage errors
      }
    }
  }, [settings, loaded]);

  return [settings, setSettings] as const;
}
