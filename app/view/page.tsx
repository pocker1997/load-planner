'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Specialist, SPECIALISTS, TASK_COLORS, MEETINGS_COLOR, WeekData, TaskStatus } from '@/types';
import { formatWeekLabel } from '@/lib/week';
import { Suspense } from 'react';

// ── Decode ────────────────────────────────────────────────────────────────────
function decodePayload(d: string): { weekKey: string; data: WeekData } | null {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(d))));
  } catch {
    return null;
  }
}

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_LABEL: Record<TaskStatus, string> = {
  active: '',
  done: 'Виконано',
  postponed: 'Перенесено',
};

// ── Single bar ────────────────────────────────────────────────────────────────
interface BarProps {
  label: string;
  hours: number;
  color: string;
  status?: TaskStatus;
  flex: number;
}

function Bar({ label, hours, color, status = 'active', flex }: BarProps) {
  const isDone = status === 'done';
  const isPostponed = status === 'postponed';
  const isInactive = isDone || isPostponed;

  return (
    <div
      className="rounded-2xl relative overflow-hidden flex-shrink-0"
      style={{
        backgroundColor: color,
        flex,
        minHeight: 64,
        opacity: isDone ? 0.5 : isPostponed ? 0.65 : 1,
      }}
    >
      <div className="absolute top-0 left-0 right-0 flex items-start px-5 pt-4 pr-24 gap-2">
        {isInactive && (
          <span className="flex-shrink-0 mt-px px-2 py-0.5 rounded-full bg-white/25 text-white text-[10px] font-semibold leading-none self-center">
            {STATUS_LABEL[status]}
          </span>
        )}
        <div className="flex items-center gap-0.5 flex-1 min-w-0">
          <span className="text-xs font-bold tracking-widest text-white/70 uppercase flex-shrink-0">#</span>
          <span
            className={`text-xs font-bold tracking-widest uppercase leading-none truncate text-white/90 ${
              isDone ? 'line-through text-white/60' : ''
            }`}
          >
            {label}
          </span>
        </div>
      </div>

      <div className="absolute top-3 right-5">
        <span className="text-3xl font-bold text-white leading-none select-none">
          {hours}h
        </span>
      </div>
    </div>
  );
}

// ── Specialist column ─────────────────────────────────────────────────────────
function SpecColumn({ specialist, data }: { specialist: Specialist; data: WeekData[Specialist] }) {
  const TOTAL = 40;
  const totalAllocated = data.meetingHours + data.tasks.reduce((s, t) => s + t.hours, 0);
  const remaining = TOTAL - totalAllocated;
  const isOverloaded = totalAllocated > TOTAL;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Specialist name */}
      <p className="text-xs font-semibold tracking-widest text-[#8E8E93] uppercase mb-3 flex-shrink-0">
        {specialist}
      </p>

      {/* Free hours */}
      <div className="flex items-baseline justify-between px-0.5 mb-2.5 flex-shrink-0">
        <span className="text-[10px] font-semibold tracking-widest text-[#8E8E93] uppercase">
          {isOverloaded ? '⚠ ПЕРЕВАНТАЖЕННЯ' : 'ВІЛЬНО'}
        </span>
        <span className={`font-bold text-xl ${isOverloaded ? 'text-[#FF3B30]' : 'text-[#1C1C1E]'}`}>
          {isOverloaded ? `+${totalAllocated - TOTAL}h` : `${remaining}h`}
        </span>
      </div>

      {/* Bars */}
      <div className="flex flex-col flex-1 min-h-0 gap-2">
        {/* Meetings */}
        {data.meetingHours > 0 && (
          <Bar
            label="МІТИНГИ"
            hours={data.meetingHours}
            color={MEETINGS_COLOR}
            flex={data.meetingHours}
          />
        )}

        {/* Tasks */}
        {data.tasks.map((task) => (
          <Bar
            key={task.id}
            label={task.name}
            hours={task.hours}
            color={TASK_COLORS[task.colorIndex % TASK_COLORS.length]}
            status={task.status}
            flex={task.hours}
          />
        ))}

        {/* Spacer */}
        {!isOverloaded && remaining > 0 && (
          <div style={{ flex: remaining }} className="min-h-0" />
        )}
      </div>
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────
function ViewContent() {
  const searchParams = useSearchParams();
  const d = searchParams.get('d');

  const payload = useMemo(() => (d ? decodePayload(d) : null), [d]);

  if (!payload) {
    return (
      <div className="h-screen bg-[#F2F2F7] flex items-center justify-center">
        <p className="text-[#8E8E93] text-sm">Невірне або застаріле посилання</p>
      </div>
    );
  }

  const { weekKey, data } = payload;

  return (
    <div className="h-screen bg-[#F2F2F7] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 pt-5 pb-4">
        <div>
          <p className="text-[10px] font-semibold tracking-widest text-[#8E8E93] uppercase mb-0.5">
            Планування на тиждень
          </p>
          <p className="text-lg font-bold text-[#1C1C1E]">{formatWeekLabel(weekKey)}</p>
        </div>
        <span className="text-[11px] text-[#8E8E93] bg-white/60 px-3 py-1.5 rounded-full font-medium">
          Режим перегляду
        </span>
      </header>

      {/* Columns */}
      <main className="flex-1 min-h-0 px-6 pb-6">
        <div className="h-full grid grid-cols-3 gap-4">
          {SPECIALISTS.map((spec) => (
            <SpecColumn key={spec} specialist={spec} data={data[spec]} />
          ))}
        </div>
      </main>
    </div>
  );
}

export default function ViewPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-[#F2F2F7] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#1C1C1E]/20 border-t-[#1C1C1E] animate-spin" />
      </div>
    }>
      <ViewContent />
    </Suspense>
  );
}
