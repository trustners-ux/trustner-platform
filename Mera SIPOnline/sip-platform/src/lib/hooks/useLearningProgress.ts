'use client';

import { useState, useEffect, useCallback } from 'react';

interface ProgressData {
  completedSections: string[]; // array of "moduleSlug/sectionSlug" strings
  lastVisited: string | null;
  lastVisitedAt: string | null;
}

const STORAGE_KEY = 'merasip_learning_progress';

function getStoredProgress(): ProgressData {
  if (typeof window === 'undefined') return { completedSections: [], lastVisited: null, lastVisitedAt: null };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { completedSections: [], lastVisited: null, lastVisitedAt: null };
}

export function useLearningProgress() {
  const [progress, setProgress] = useState<ProgressData>({ completedSections: [], lastVisited: null, lastVisitedAt: null });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setProgress(getStoredProgress());
    setIsLoaded(true);
  }, []);

  const saveProgress = useCallback((data: ProgressData) => {
    setProgress(data);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }, []);

  const markSectionComplete = useCallback((moduleSlug: string, sectionSlug: string) => {
    const key = `${moduleSlug}/${sectionSlug}`;
    setProgress(prev => {
      if (prev.completedSections.includes(key)) return prev;
      const updated = {
        ...prev,
        completedSections: [...prev.completedSections, key],
        lastVisited: key,
        lastVisitedAt: new Date().toISOString(),
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const markSectionVisited = useCallback((moduleSlug: string, sectionSlug: string) => {
    const key = `${moduleSlug}/${sectionSlug}`;
    setProgress(prev => {
      const updated = { ...prev, lastVisited: key, lastVisitedAt: new Date().toISOString() };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const isSectionComplete = useCallback((moduleSlug: string, sectionSlug: string) => {
    return progress.completedSections.includes(`${moduleSlug}/${sectionSlug}`);
  }, [progress.completedSections]);

  const getModuleProgress = useCallback((moduleSlug: string, totalSections: number) => {
    const completed = progress.completedSections.filter(s => s.startsWith(`${moduleSlug}/`)).length;
    return { completed, total: totalSections, percentage: totalSections > 0 ? Math.round((completed / totalSections) * 100) : 0 };
  }, [progress.completedSections]);

  const getTotalProgress = useCallback((modules: { slug: string; sections: { slug: string }[] }[]) => {
    const totalSections = modules.reduce((acc, m) => acc + m.sections.length, 0);
    const completed = progress.completedSections.length;
    return { completed, total: totalSections, percentage: totalSections > 0 ? Math.round((completed / totalSections) * 100) : 0 };
  }, [progress.completedSections]);

  return {
    progress,
    isLoaded,
    markSectionComplete,
    markSectionVisited,
    isSectionComplete,
    getModuleProgress,
    getTotalProgress,
  };
}
