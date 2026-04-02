'use client';

import { useState, useEffect, useCallback } from 'react';

interface GyanProgress {
  completedTopics: string[]; // "categorySlug/topicSlug"
  lastVisited: string | null;
  lastVisitedAt: string | null;
}

const DEFAULT_PROGRESS: GyanProgress = {
  completedTopics: [],
  lastVisited: null,
  lastVisitedAt: null,
};

function getStorageKey(employeeCode: string) {
  return `mfgyan_progress_${employeeCode}`;
}

export function useGyanProgress(employeeCode: string) {
  const [progress, setProgress] = useState<GyanProgress>(DEFAULT_PROGRESS);

  useEffect(() => {
    if (!employeeCode) return;
    try {
      const raw = localStorage.getItem(getStorageKey(employeeCode));
      if (raw) setProgress(JSON.parse(raw));
    } catch {
      // ignore parse errors
    }
  }, [employeeCode]);

  const save = useCallback(
    (updated: GyanProgress) => {
      setProgress(updated);
      if (employeeCode) {
        localStorage.setItem(getStorageKey(employeeCode), JSON.stringify(updated));
      }
    },
    [employeeCode]
  );

  const markComplete = useCallback(
    (categorySlug: string, topicSlug: string) => {
      const key = `${categorySlug}/${topicSlug}`;
      if (progress.completedTopics.includes(key)) return;
      save({
        ...progress,
        completedTopics: [...progress.completedTopics, key],
        lastVisited: key,
        lastVisitedAt: new Date().toISOString(),
      });
    },
    [progress, save]
  );

  const markVisited = useCallback(
    (categorySlug: string, topicSlug: string) => {
      const key = `${categorySlug}/${topicSlug}`;
      save({
        ...progress,
        lastVisited: key,
        lastVisitedAt: new Date().toISOString(),
      });
    },
    [progress, save]
  );

  const isComplete = useCallback(
    (categorySlug: string, topicSlug: string) => {
      return progress.completedTopics.includes(`${categorySlug}/${topicSlug}`);
    },
    [progress.completedTopics]
  );

  const getCategoryProgress = useCallback(
    (categorySlug: string, totalTopics: number) => {
      const completed = progress.completedTopics.filter((k) =>
        k.startsWith(`${categorySlug}/`)
      ).length;
      return { completed, total: totalTopics, percent: totalTopics > 0 ? Math.round((completed / totalTopics) * 100) : 0 };
    },
    [progress.completedTopics]
  );

  const getTotalProgress = useCallback(
    (totalTopics: number) => {
      const completed = progress.completedTopics.length;
      return { completed, total: totalTopics, percent: totalTopics > 0 ? Math.round((completed / totalTopics) * 100) : 0 };
    },
    [progress.completedTopics]
  );

  return {
    progress,
    markComplete,
    markVisited,
    isComplete,
    getCategoryProgress,
    getTotalProgress,
  };
}
