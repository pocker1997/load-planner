'use client';

import { useState } from 'react';
import { currentWeekKey } from '@/lib/week';
import { StoreProvider, useStoreContext } from '@/lib/storeContext';
import { SPECIALISTS } from '@/types';
import SpecTabs, { ViewMode } from '@/components/SpecTabs';
import WeekSwitcher from '@/components/WeekSwitcher';
import SpecChart from '@/components/SpecChart';
import CalendarSync from '@/components/CalendarSync';

function AppContent() {
  const [weekKey, setWeekKey] = useState(currentWeekKey);
  const [view, setView] = useState<ViewMode>('Ростік');
  const { hydrated } = useStoreContext();

  if (!hydrated) {
    return (
      <div className="h-screen bg-[#F2F2F7] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#1C1C1E]/20 border-t-[#1C1C1E] animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#F2F2F7] flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 pt-5 pb-4">
        <SpecTabs value={view} onChange={setView} />
        <div className="flex items-center gap-3">
          <CalendarSync weekKey={weekKey} />
          <WeekSwitcher weekKey={weekKey} onChange={setWeekKey} />
        </div>
      </header>

      {/* Chart area */}
      <main className="flex-1 min-h-0 px-6 pb-6">
        {view === 'Всі' ? (
          <div className="h-full grid grid-cols-3 gap-4">
            {SPECIALISTS.map((spec) => (
              <div key={spec} className="flex flex-col min-h-0">
                <p className="text-xs font-semibold tracking-widest text-[#8E8E93] uppercase mb-3 flex-shrink-0">
                  {spec}
                </p>
                <div className="flex-1 min-h-0">
                  <SpecChart specialist={spec} weekKey={weekKey} compact />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full">
            <SpecChart specialist={view} weekKey={weekKey} />
          </div>
        )}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
