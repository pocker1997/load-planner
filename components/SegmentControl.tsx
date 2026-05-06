'use client';

import { Specialist, SPECIALISTS } from '@/types';

interface Props {
  value: Specialist;
  onChange: (s: Specialist) => void;
}

export default function SegmentControl({ value, onChange }: Props) {
  return (
    <div className="inline-flex bg-[#E5E5EA] rounded-full p-1 gap-1">
      {SPECIALISTS.map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
            value === s
              ? 'bg-[#1C1C1E] text-white shadow-sm'
              : 'text-[#3A3A3C] hover:text-[#1C1C1E]'
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
