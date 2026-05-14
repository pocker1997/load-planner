'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppStore, BacklogTask, defaultWeekData, Specialist, SpecialistData, Task, TaskStatus, TASK_COLORS, WeekData } from '@/types';
import { nextWeekKey } from './week';

const STORAGE_KEY = 'dlp_store_v1';
const BACKLOG_KEY = 'dlp_backlog_v1';

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

function loadBacklog(): BacklogTask[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BACKLOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBacklog(tasks: BacklogTask[]) {
  localStorage.setItem(BACKLOG_KEY, JSON.stringify(tasks));
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
  const [backlog, setBacklog] = useState<BacklogTask[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setStore(loadStore());
    setBacklog(loadBacklog());
    setHydrated(true);
  }, []);

  const persist = useCallback((next: AppStore) => {
    setStore(next);
    saveStore(next);
  }, []);

  const persistBacklog = useCallback((next: BacklogTask[]) => {
    setBacklog(next);
    saveBacklog(next);
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

  // ── Backlog ────────────────────────────────────────────────────────────────

  const addBacklogTask = useCallback(
    (name: string): string => {
      const id = crypto.randomUUID();
      persistBacklog([...backlog, { id, name }]);
      return id;
    },
    [backlog, persistBacklog]
  );

  const deleteBacklogTask = useCallback(
    (id: string) => {
      persistBacklog(backlog.filter((t) => t.id !== id));
    },
    [backlog, persistBacklog]
  );

  const renameBacklogTask = useCallback(
    (id: string, name: string) => {
      persistBacklog(backlog.map((t) => (t.id === id ? { ...t, name } : t)));
    },
    [backlog, persistBacklog]
  );

  // Move backlog task → specialist column
  const assignBacklogTask = useCallback(
    (backlogTaskId: string, weekKey: string, specialist: Specialist, hours: number) => {
      const task = backlog.find((t) => t.id === backlogTaskId);
      if (!task) return;

      persistBacklog(backlog.filter((t) => t.id !== backlogTaskId));

      const weekData = getWeekData(store, weekKey);
      const specData = weekData[specialist];
      const newTask: Task = {
        id: crypto.randomUUID(),
        name: task.name,
        hours,
        colorIndex: nextColorIndex(specData.tasks),
        status: 'active',
      };
      persist({
        ...store,
        [weekKey]: {
          ...weekData,
          [specialist]: { ...specData, tasks: [...specData.tasks, newTask] },
        },
      });
    },
    [backlog, persistBacklog, store, persist]
  );

  // Move specialist task → backlog (drop hours)
  const unassignTask = useCallback(
    (weekKey: string, specialist: Specialist, taskId: string) => {
      const weekData = getWeekData(store, weekKey);
      const specData = weekData[specialist];
      const task = specData.tasks.find((t) => t.id === taskId);
      if (!task) return;

      persist({
        ...store,
        [weekKey]: {
          ...weekData,
          [specialist]: { ...specData, tasks: specData.tasks.filter((t) => t.id !== taskId) },
        },
      });

      persistBacklog([...backlog, { id: crypto.randomUUID(), name: task.name }]);
    },
    [store, persist, backlog, persistBacklog]
  );

  return {
    hydrated,
    getSpecData,
    addTask,
    deleteTask,
    updateTask,
    setTaskStatus,
    postponeTask,
    setMeetingHours,
    backlog,
    addBacklogTask,
    deleteBacklogTask,
    renameBacklogTask,
    assignBacklogTask,
    unassignTask,
  };
}
