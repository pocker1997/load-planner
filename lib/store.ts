'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppStore, defaultWeekData, Specialist, SpecialistData, Task, TaskStatus, TASK_COLORS, WeekData } from '@/types';
import { nextWeekKey } from './week';

const STORAGE_KEY = 'dlp_store_v1';

function loadStore(): AppStore {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStore(store: AppStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function getWeekData(store: AppStore, weekKey: string): WeekData {
  return store[weekKey] ?? defaultWeekData();
}

function getSpecialistData(store: AppStore, weekKey: string, specialist: Specialist): SpecialistData {
  return getWeekData(store, weekKey)[specialist];
}

function nextColorIndex(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  const used = tasks.map((t) => t.colorIndex);
  for (let i = 0; i < TASK_COLORS.length; i++) {
    if (!used.includes(i)) return i;
  }
  return (Math.max(...used) + 1) % TASK_COLORS.length;
}

export function useStore() {
  const [store, setStore] = useState<AppStore>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setStore(loadStore());
    setHydrated(true);
  }, []);

  const persist = useCallback((next: AppStore) => {
    setStore(next);
    saveStore(next);
  }, []);

  const getSpecData = useCallback(
    (weekKey: string, specialist: Specialist): SpecialistData =>
      getSpecialistData(store, weekKey, specialist),
    [store]
  );

  const addTask = useCallback(
    (weekKey: string, specialist: Specialist, name: string, hours: number): string => {
      const weekData = getWeekData(store, weekKey);
      const specData = weekData[specialist];
      const id = crypto.randomUUID();
      const newTask: Task = { id, name, hours, colorIndex: nextColorIndex(specData.tasks), status: 'active' };
      const next: AppStore = {
        ...store,
        [weekKey]: {
          ...weekData,
          [specialist]: { ...specData, tasks: [...specData.tasks, newTask] },
        },
      };
      persist(next);
      return id;
    },
    [store, persist]
  );

  const deleteTask = useCallback(
    (weekKey: string, specialist: Specialist, taskId: string) => {
      const weekData = getWeekData(store, weekKey);
      const specData = weekData[specialist];
      const next: AppStore = {
        ...store,
        [weekKey]: {
          ...weekData,
          [specialist]: { ...specData, tasks: specData.tasks.filter((t) => t.id !== taskId) },
        },
      };
      persist(next);
    },
    [store, persist]
  );

  const updateTask = useCallback(
    (weekKey: string, specialist: Specialist, taskId: string, name: string, hours: number) => {
      const weekData = getWeekData(store, weekKey);
      const specData = weekData[specialist];
      const next: AppStore = {
        ...store,
        [weekKey]: {
          ...weekData,
          [specialist]: {
            ...specData,
            tasks: specData.tasks.map((t) => (t.id === taskId ? { ...t, name, hours } : t)),
          },
        },
      };
      persist(next);
    },
    [store, persist]
  );

  const setTaskStatus = useCallback(
    (weekKey: string, specialist: Specialist, taskId: string, status: TaskStatus) => {
      const weekData = getWeekData(store, weekKey);
      const specData = weekData[specialist];
      const next: AppStore = {
        ...store,
        [weekKey]: {
          ...weekData,
          [specialist]: {
            ...specData,
            tasks: specData.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
          },
        },
      };
      persist(next);
    },
    [store, persist]
  );

  // Mark as postponed in current week + copy to next week as active
  const postponeTask = useCallback(
    (weekKey: string, specialist: Specialist, taskId: string) => {
      const weekData = getWeekData(store, weekKey);
      const specData = weekData[specialist];
      const task = specData.tasks.find((t) => t.id === taskId);
      if (!task) return;

      const markedTasks = specData.tasks.map((t) =>
        t.id === taskId ? { ...t, status: 'postponed' as TaskStatus } : t
      );

      const nextWk = nextWeekKey(weekKey);
      const nextWeekData = getWeekData(store, nextWk);
      const nextSpecData = nextWeekData[specialist];
      const copy: Task = {
        id: crypto.randomUUID(),
        name: task.name,
        hours: task.hours,
        colorIndex: nextColorIndex(nextSpecData.tasks),
        status: 'active',
      };

      const next: AppStore = {
        ...store,
        [weekKey]: {
          ...weekData,
          [specialist]: { ...specData, tasks: markedTasks },
        },
        [nextWk]: {
          ...nextWeekData,
          [specialist]: { ...nextSpecData, tasks: [...nextSpecData.tasks, copy] },
        },
      };
      persist(next);
    },
    [store, persist]
  );

  const setMeetingHours = useCallback(
    (weekKey: string, specialist: Specialist, hours: number) => {
      const weekData = getWeekData(store, weekKey);
      const specData = weekData[specialist];
      const next: AppStore = {
        ...store,
        [weekKey]: {
          ...weekData,
          [specialist]: { ...specData, meetingHours: hours },
        },
      };
      persist(next);
    },
    [store, persist]
  );

  return { hydrated, getSpecData, addTask, deleteTask, updateTask, setTaskStatus, postponeTask, setMeetingHours };
}
