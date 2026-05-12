'use client';

import { useState } from 'react';
import { useStoreContext } from '@/lib/storeContext';
import { WeekData } from '@/types';
import { formatWeekLabel } from '@/lib/week';

interface Props {
  weekKey: string;
}

function IconShare() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5 7.5L9 4M9 4H6.5M9 4V6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 3H3a1 1 0 00-1 1v7a1 1 0 001 1h8a1 1 0 001-1v-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function encodeWeekData(weekKey: string, data: WeekData): string {
  const payload = { weekKey, data };
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

export default function ShareButton({ weekKey }: Props) {
  const { getSpecData } = useStoreContext();
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const weekData: WeekData = {
      Ростік: getSpecData(weekKey, 'Ростік'),
      Таня: getSpecData(weekKey, 'Таня'),
      Аліна: getSpecData(weekKey, 'Аліна'),
    };

    const encoded = encodeWeekData(weekKey, weekData);
    const url = `${window.location.origin}/view?d=${encoded}`;

    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleShare}
      className={`flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold transition-all ${
        copied
          ? 'bg-[#34C759] text-white'
          : 'bg-[#E5E5EA] hover:bg-[#D1D1D6] text-[#1C1C1E]'
      }`}
    >
      <IconShare />
      {copied ? 'Скопійовано!' : 'Поділитись'}
    </button>
  );
}
