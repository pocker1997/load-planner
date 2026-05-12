'use client';

import { Specialist } from '@/types';

const STORAGE_KEY = 'dlp_calendar_ids';

export type CalendarIds = Record<Specialist, string>;

export function loadCalendarIds(): CalendarIds {
  if (typeof window === 'undefined') return defaultCalendarIds();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultCalendarIds();
  } catch {
    return defaultCalendarIds();
  }
}

export function saveCalendarIds(ids: CalendarIds) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

function defaultCalendarIds(): CalendarIds {
  return { Ростік: '', Таня: '', Аліна: '' };
}
