'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { SPECIALISTS, Specialist } from '@/types';
import { loadCalendarIds, saveCalendarIds, CalendarIds } from '@/lib/calendarSettings';
import { useStoreContext } from '@/lib/storeContext';

interface Props {
  weekKey: string;
}

function IconCalendar() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="2.5" width="12" height="10.5" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1 6h12" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4.5 1v3M9.5 1v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.5 2.5l1 1M10.5 10.5l1 1M11.5 2.5l-1 1M3.5 10.5l-1 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export default function CalendarSync({ weekKey }: Props) {
  const { data: session, status } = useSession();
  const { setMeetingHours } = useStoreContext();

  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [calendarIds, setCalendarIds] = useState<CalendarIds>({ Ростік: '', Таня: '', Аліна: '' });
  const [draftIds, setDraftIds] = useState<CalendarIds>({ Ростік: '', Таня: '', Аліна: '' });

  useEffect(() => {
    const loaded = loadCalendarIds();
    setCalendarIds(loaded);
    setDraftIds(loaded);
  }, []);

  const handleSaveSettings = () => {
    saveCalendarIds(draftIds);
    setCalendarIds(draftIds);
    setShowSettings(false);
  };

  const hasCalendarIds = SPECIALISTS.some((s) => calendarIds[s].trim());

  const handleSync = async () => {
    if (!session) {
      signIn('google');
      return;
    }
    setSyncing(true);
    setSyncDone(false);

    for (const specialist of SPECIALISTS) {
      const calId = calendarIds[specialist].trim();
      if (!calId) continue;
      try {
        const res = await fetch(
          `/api/calendar?weekKey=${encodeURIComponent(weekKey)}&calendarId=${encodeURIComponent(calId)}`
        );
        if (!res.ok) continue;
        const { hours } = await res.json();
        if (typeof hours === 'number') {
          setMeetingHours(weekKey, specialist, hours);
        }
      } catch {
        // skip specialist on error
      }
    }

    setSyncing(false);
    setSyncDone(true);
    setTimeout(() => setSyncDone(false), 2500);
  };

  const isLoading = status === 'loading';

  return (
    <div className="flex items-center gap-2">
      {/* Settings button */}
      <button
        onClick={() => {
          setDraftIds(calendarIds);
          setShowSettings(true);
        }}
        className="w-8 h-8 rounded-xl bg-[#E5E5EA] hover:bg-[#D1D1D6] flex items-center justify-center text-[#636366] transition-colors"
        title="Налаштувати календарі"
      >
        <IconSettings />
      </button>

      {/* Sync / login button */}
      {session ? (
        <button
          onClick={handleSync}
          disabled={syncing || isLoading || !hasCalendarIds}
          className={`flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold transition-all ${
            syncDone
              ? 'bg-[#34C759] text-white'
              : 'bg-[#E5E5EA] hover:bg-[#D1D1D6] text-[#1C1C1E] disabled:opacity-40 disabled:cursor-not-allowed'
          }`}
        >
          <IconCalendar />
          {syncing ? 'Синхронізація…' : syncDone ? 'Готово' : 'Синх. Calendar'}
        </button>
      ) : (
        <button
          onClick={() => signIn('google')}
          disabled={isLoading}
          className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold bg-[#E5E5EA] hover:bg-[#D1D1D6] text-[#1C1C1E] transition-colors disabled:opacity-40"
        >
          <IconCalendar />
          Підключити Calendar
        </button>
      )}

      {/* Settings modal */}
      {showSettings && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowSettings(false)}
        >
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-[360px] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#1C1C1E]">Календарі</h2>
              {session && (
                <button
                  onClick={() => signOut()}
                  className="text-[11px] text-[#8E8E93] hover:text-[#FF3B30] transition-colors"
                >
                  Вийти з Google
                </button>
              )}
            </div>

            <p className="text-xs text-[#8E8E93] -mt-2">
              Вкажи email-адресу Google Calendar для кожного дизайнера
            </p>

            <div className="flex flex-col gap-3">
              {SPECIALISTS.map((s) => (
                <div key={s} className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold tracking-widest text-[#8E8E93] uppercase">
                    {s}
                  </label>
                  <input
                    type="email"
                    value={draftIds[s]}
                    onChange={(e) =>
                      setDraftIds((prev) => ({ ...prev, [s]: e.target.value }))
                    }
                    placeholder="email@gmail.com"
                    className="h-9 px-3 rounded-xl bg-[#F2F2F7] text-sm text-[#1C1C1E] outline-none focus:ring-2 focus:ring-[#007AFF]/40 placeholder:text-[#C7C7CC]"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 h-10 rounded-xl bg-[#F2F2F7] text-sm font-semibold text-[#636366] hover:bg-[#E5E5EA] transition-colors"
              >
                Скасувати
              </button>
              <button
                onClick={handleSaveSettings}
                className="flex-1 h-10 rounded-xl bg-[#1C1C1E] text-sm font-semibold text-white hover:bg-[#3A3A3C] transition-colors"
              >
                Зберегти
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
