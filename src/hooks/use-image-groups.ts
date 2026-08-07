'use client';

import { useState, useCallback } from 'react';
import type { ImageGroup, ImageItem } from '@/lib/types';
import { generateId, readFileAsDataURL } from '@/lib/utils';

function createGroup(name: string): ImageGroup {
  return { id: generateId(), name, clothingImages: [], modelImages: [], collapsed: false };
}

export function useImageGroups() {
  const [groups, setGroups] = useState<ImageGroup[]>(() => [createGroup('分组 1')]);

  const addGroup = useCallback(() => {
    setGroups(prev => [createGroup(`分组 ${prev.length + 1}`), ...prev]);
  }, []);

  const removeGroup = useCallback((groupId: string) => {
    setGroups(prev => prev.length <= 1 ? prev : prev.filter(g => g.id !== groupId));
  }, []);

  const renameGroup = useCallback((groupId: string, name: string) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, name } : g));
  }, []);

  const toggleGroupCollapse = useCallback((groupId: string) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, collapsed: !g.collapsed } : g));
  }, []);

  const moveGroup = useCallback((groupId: string, direction: 'up' | 'down') => {
    setGroups(prev => {
      const index = prev.findIndex(g => g.id === groupId);
      if (index < 0) return prev;
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = prev.slice();
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return next;
    });
  }, []);

  const addImages = useCallback((groupId: string, type: 'clothing' | 'model', files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;
    Promise.all(imageFiles.map(async (file) => ({
      id: generateId(),
      url: await readFileAsDataURL(file),
      name: file.name,
    }))).then((newImages) => {
      setGroups(prev => prev.map(g => {
        if (g.id !== groupId) return g;
        if (type === 'clothing') return { ...g, clothingImages: [...g.clothingImages, ...newImages] };
        return { ...g, modelImages: [...g.modelImages, ...newImages] };
      }));
    });
  }, []);

  const removeImage = useCallback((groupId: string, type: 'clothing' | 'model', imageId: string) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      const key = type === 'clothing' ? 'clothingImages' : 'modelImages';
      return { ...g, [key]: g[key].filter(i => i.id !== imageId) };
    }));
  }, []);

  const clearImages = useCallback((groupId: string, type: 'clothing' | 'model') => {
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      const key = type === 'clothing' ? 'clothingImages' : 'modelImages';
      return { ...g, [key]: [] };
    }));
  }, []);

  const reorderImages = useCallback((groupId: string, type: 'clothing' | 'model', fromIndex: number, toIndex: number) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      const key = type === 'clothing' ? 'clothingImages' : 'modelImages';
      const list = g[key];
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= list.length || toIndex >= list.length || fromIndex === toIndex) return g;
      const next = list.slice();
      const [moved] = next.splice(fromIndex, 1);
      const insertIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
      next.splice(insertIndex, 0, moved);
      return { ...g, [key]: next };
    }));
  }, []);

  const updateImageUrl = useCallback((groupId: string, type: 'clothing' | 'model', imageId: string, newUrl: string) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      const key = type === 'clothing' ? 'clothingImages' : 'modelImages';
      return { ...g, [key]: g[key].map(img => img.id === imageId ? { ...img, url: newUrl } : img) };
    }));
  }, []);

  return {
    groups,
    addGroup,
    removeGroup,
    renameGroup,
    toggleGroupCollapse,
    moveGroup,
    addImages,
    removeImage,
    clearImages,
    reorderImages,
    updateImageUrl,
  };
}
