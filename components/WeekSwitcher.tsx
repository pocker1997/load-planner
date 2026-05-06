'use client';

import { formatWeekLabel, nextWeekKey, prevWeekKey } from '@/lib/week';

interface Props {
  weekKey: string;
  onChange: (key: string) => void;
}

export default function WeekSwitcher({ weekKey, onChange }: Props) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(prevWeekKey(weekKey))}
        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/8 transition-colors text-[#3A3A3C]"
        aria-label="Попередній тиждень"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <span className="text-sm font-semibold text-[#1C1C1E] min-w-[120px] text-center">
        {formatWeekLabel(weekKey)}
      </span>
      <button
        onClick={() => onChange(nextWeekKey(weekKey))}
        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/8 transition-colors text-[#3A3A3C]"
        aria-label="Наступний тиждень"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
