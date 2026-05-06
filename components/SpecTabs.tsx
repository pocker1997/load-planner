'use client';

import { Specialist, SPECIALISTS } from '@/types';

export type ViewMode = Specialist | 'Всі';

interface Props {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}

const TABS: ViewMode[] = [...SPECIALISTS, 'Всі'];

export default function SpecTabs({ value, onChange }: Props) {
  return (
    <div className="inline-flex bg-[#E5E5EA] rounded-full p-1 gap-0.5">
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
            value === tab
              ? 'bg-[#1C1C1E] text-white shadow-sm'
              : 'text-[#3A3A3C] hover:text-[#1C1C1E]'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
