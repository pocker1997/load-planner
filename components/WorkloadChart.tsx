'use client';

import { useEffect, useRef, useState } from 'react';
import { MEETINGS_COLOR, SpecialistData, TASK_COLORS, TOTAL_HOURS } from '@/types';

interface Props {
  data: SpecialistData;
  onUpdateTaskHours: (taskId: string, hours: number) => void;
  onUpdateMeetingHours: (hours: number) => void;
}

interface DragState {
  id: string;        // task id or 'meetings'
  startY: number;
  startHours: number;
  liveHours: number;
}

function snap(h: number): number {
  return Math.max(0.5, Math.round(h * 2) / 2);
}

export default function WorkloadChart({ data, onUpdateTaskHours, onUpdateMeetingHours }: Props) {
  const { tasks, meetingHours } = data;
  const containerRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  // Live hours override during drag (so chart updates in real-time)
  const getLiveHours = (id: string, base: number) =>
    drag?.id === id ? drag.liveHours : base;

  const liveMeetingHours = getLiveHours('meetings', meetingHours);
  const liveTasks = tasks.map((t) => ({ ...t, hours: getLiveHours(t.id, t.hours) }));

  const totalAllocated = liveTasks.reduce((s, t) => s + t.hours, 0) + liveMeetingHours;
  const remaining = TOTAL_HOURS - totalAllocated;
  const isOverloaded = totalAllocated > TOTAL_HOURS;

  const blocks: Array<{ label: string; hours: number; color: string; id: string }> = [];
  if (liveMeetingHours > 0 || meetingHours > 0) {
    blocks.push({ label: 'МІТИНГИ', hours: liveMeetingHours, color: MEETINGS_COLOR, id: 'meetings' });
  }
  liveTasks.forEach((t) => {
    blocks.push({
      label: t.name.toUpperCase(),
      hours: t.hours,
      color: TASK_COLORS[t.colorIndex % TASK_COLORS.length],
      id: t.id,
    });
  });

  // --- Drag logic ---
  const handleDragStart = (e: React.MouseEvent, id: string, currentHours: number) => {
    e.preventDefault();
    setDrag({ id, startY: e.clientY, startHours: currentHours, liveHours: currentHours });
  };

  useEffect(() => {
    if (!drag) return;

    const onMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const h = container.getBoundingClientRect().height;
      const deltaY = e.clientY - drag.startY;
      // pixels → hours: full container height = 40h
      const deltaHours = (deltaY / h) * TOTAL_HOURS;
      const newHours = snap(drag.startHours + deltaHours);
      setDrag((d) => d ? { ...d, liveHours: newHours } : null);
    };

    const onUp = () => {
      if (!drag) return;
      if (drag.id === 'meetings') {
        onUpdateMeetingHours(drag.liveHours);
      } else {
        onUpdateTaskHours(drag.id, drag.liveHours);
      }
      setDrag(null);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [drag, onUpdateTaskHours, onUpdateMeetingHours]);

  return (
    // Capture drag cursor globally while dragging
    <div
      className="flex flex-col h-full"
      style={drag ? { cursor: 'ns-resize', userSelect: 'none' } : undefined}
    >
      {/* Free / overload header */}
      <div className="flex items-baseline justify-between px-1 mb-3 flex-shrink-0">
        <span className="text-xs font-semibold tracking-widest text-[#8E8E93] uppercase">
          {isOverloaded ? '⚠ ПЕРЕВАНТАЖЕННЯ' : 'ВІЛЬНО'}
        </span>
        <span className={`text-3xl font-bold tracking-tight ${isOverloaded ? 'text-[#FF3B30]' : 'text-[#1C1C1E]'}`}>
          {isOverloaded ? `+${totalAllocated - TOTAL_HOURS}h` : `${remaining}h`}
        </span>
      </div>

      {/* Block stack */}
      <div ref={containerRef} className="flex flex-col flex-1 min-h-0 gap-2">
        {blocks.length === 0 ? (
          <div className="flex-1 rounded-2xl bg-[#E5E5EA]/50 flex items-center justify-center text-[#AEAEB2] text-sm">
            Задач ще немає
          </div>
        ) : (
          <>
            {blocks.map((block) => (
              <div
                key={block.id}
                className="rounded-2xl relative overflow-hidden flex-shrink-0"
                style={{ backgroundColor: block.color, flex: block.hours, minHeight: 64 }}
              >
                {/* Task label */}
                <span className="absolute top-4 left-5 text-xs font-bold tracking-widest text-white/90 uppercase leading-none pointer-events-none">
                  #{block.label}
                </span>
                {/* Hours — live update while dragging */}
                <span className="absolute top-3 right-5 text-3xl font-bold text-white leading-none pointer-events-none">
                  {block.hours}h
                </span>

                {/* Drag handle — bottom strip */}
                <div
                  onMouseDown={(e) => handleDragStart(e, block.id, block.hours)}
                  className="absolute bottom-0 left-0 right-0 h-6 flex items-end justify-center pb-1.5 cursor-ns-resize group/handle"
                  title="Потягни, щоб змінити години"
                >
                  <div className="w-10 h-1 rounded-full bg-white/0 group-hover/handle:bg-white/40 transition-colors" />
                </div>
              </div>
            ))}

            {/* Spacer for remaining hours */}
            {!isOverloaded && remaining > 0 && (
              <div style={{ flex: remaining }} className="min-h-0" />
            )}
          </>
        )}
      </div>
    </div>
  );
}
