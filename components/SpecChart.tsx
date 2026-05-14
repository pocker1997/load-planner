'use client';

import { useEffect, useRef, useState } from 'react';
import { MEETINGS_COLOR, Specialist, TaskStatus, TASK_COLORS, TOTAL_HOURS } from '@/types';
import { useStoreContext } from '@/lib/storeContext';

function snap(h: number) {
  return Math.max(0.5, Math.round(h * 2) / 2);
}

interface DragState {
  id: string;
  startY: number;
  startHours: number;
  previewHours: number;
}

interface Props {
  specialist: Specialist;
  weekKey: string;
  compact?: boolean;
}

// ── Icons ──────────────────────────────────────────────────────────────────
function IconCheck() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconArrow() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M1.5 3h9M4 3V2h4v1M4.5 5.5v3M7.5 5.5v3M2.5 3l.7 6.5h5.6L9.5 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconBacklog() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M9 6H3M3 6l2.5-2.5M3 6l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M7.5 2v11M2 7.5h11" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Status badge ────────────────────────────────────────────────────────────
const STATUS_LABEL: Record<TaskStatus, string> = {
  active: '',
  done: 'Виконано',
  postponed: 'Перенесено',
};

export default function SpecChart({ specialist, weekKey, compact }: Props) {
  const { getSpecData, addTask, deleteTask, updateTask, setTaskStatus, postponeTask, setMeetingHours, assignBacklogTask, unassignTask } =
    useStoreContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const dragCounterRef = useRef(0);

  const [drag, setDrag] = useState<DragState | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editNameVal, setEditNameVal] = useState('');
  const [editingHours, setEditingHours] = useState<string | null>(null);
  const [editHoursVal, setEditHoursVal] = useState('');
  const [isDropOver, setIsDropOver] = useState(false);

  const data = getSpecData(weekKey, specialist);
  const { tasks, meetingHours } = data;

  const liveMeetings = drag?.id === 'meetings' ? drag.previewHours : meetingHours;
  const liveTasks = tasks.map((t) => ({
    ...t,
    hours: drag?.id === t.id ? drag.previewHours : t.hours,
  }));

  const totalAllocated = liveMeetings + liveTasks.reduce((s, t) => s + t.hours, 0);
  const remaining = TOTAL_HOURS - totalAllocated;
  const isOverloaded = totalAllocated > TOTAL_HOURS;

  // ── Resize drag ───────────────────────────────────────────────────────────
  const onDragStart = (e: React.MouseEvent, id: string, hours: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag({ id, startY: e.clientY, startHours: hours, previewHours: hours });
  };

  useEffect(() => {
    if (!drag) return;
    const onMove = (e: MouseEvent) => {
      const h = containerRef.current?.getBoundingClientRect().height ?? 600;
      const deltaHours = ((e.clientY - drag.startY) / h) * TOTAL_HOURS;
      setDrag((d) => (d ? { ...d, previewHours: snap(d.startHours + deltaHours) } : null));
    };
    const onUp = () => {
      if (!drag) return;
      if (drag.id === 'meetings') {
        setMeetingHours(weekKey, specialist, drag.previewHours);
      } else {
        const task = tasks.find((t) => t.id === drag.id);
        if (task) updateTask(weekKey, specialist, drag.id, task.name, drag.previewHours);
      }
      setDrag(null);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [drag, tasks, weekKey, specialist, setMeetingHours, updateTask]);

  // ── Backlog drop ──────────────────────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current++;
    setIsDropOver(true);
  };
  const handleDragLeave = () => {
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDropOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDropOver(false);
    const backlogTaskId = e.dataTransfer.getData('text/plain');
    if (backlogTaskId) assignBacklogTask(backlogTaskId, weekKey, specialist, 2);
  };

  // ── Editing ───────────────────────────────────────────────────────────────
  const startEditName = (id: string, name: string) => {
    setEditingName(id);
    setEditNameVal(name);
    setEditingHours(null);
  };
  const saveEditName = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task) updateTask(weekKey, specialist, id, editNameVal.trim() || task.name, task.hours);
    setEditingName(null);
  };

  const startEditHours = (id: string, hours: number) => {
    setEditingHours(id);
    setEditHoursVal(String(hours));
    setEditingName(null);
  };
  const saveEditHours = (id: string) => {
    const h = parseFloat(editHoursVal);
    if (!isNaN(h) && h > 0) {
      if (id === 'meetings') setMeetingHours(weekKey, specialist, h);
      else {
        const task = tasks.find((t) => t.id === id);
        if (task) updateTask(weekKey, specialist, id, task.name, h);
      }
    }
    setEditingHours(null);
  };

  // ── Add ───────────────────────────────────────────────────────────────────
  const handleAdd = () => {
    if (remaining <= 0) return;
    const hours = Math.min(2, Math.max(0.5, snap(remaining)));
    const newId = addTask(weekKey, specialist, 'Нова задача', hours);
    setTimeout(() => {
      setEditingName(newId);
      setEditNameVal('Нова задача');
    }, 30);
  };

  // ── Blocks ────────────────────────────────────────────────────────────────
  const meetingsBlock = {
    id: 'meetings' as const,
    label: 'МІТИНГИ',
    hours: liveMeetings,
    color: MEETINGS_COLOR,
    canEditName: false,
    canAction: false,
    status: 'active' as TaskStatus,
  };
  const taskBlocks = liveTasks.map((t) => ({
    id: t.id,
    label: t.name,
    hours: t.hours,
    color: TASK_COLORS[t.colorIndex % TASK_COLORS.length],
    canEditName: true,
    canAction: true,
    status: t.status ?? 'active',
  }));
  const blocks = [meetingsBlock, ...taskBlocks];

  const hoursSize = compact ? 'text-xl' : 'text-3xl';

  return (
    <div
      className="flex flex-col h-full"
      style={drag ? { userSelect: 'none', cursor: 'ns-resize' } : undefined}
    >
      {/* ВІЛЬНО header */}
      <div className="flex items-baseline justify-between px-0.5 mb-2.5 flex-shrink-0">
        <span className="text-[10px] font-semibold tracking-widest text-[#8E8E93] uppercase">
          {isOverloaded ? '⚠ ПЕРЕВАНТАЖЕННЯ' : 'ВІЛЬНО'}
        </span>
        <span className={`font-bold ${hoursSize} ${isOverloaded ? 'text-[#FF3B30]' : 'text-[#1C1C1E]'}`}>
          {isOverloaded ? `+${totalAllocated - TOTAL_HOURS}h` : `${remaining}h`}
        </span>
      </div>

      {/* Drop zone wrapper */}
      <div
        ref={containerRef}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="flex flex-col flex-1 min-h-0 gap-2 rounded-2xl transition-all duration-150"
        style={isDropOver ? { outline: '2px dashed #7C6CF2', outlineOffset: 4 } : undefined}
      >
        {blocks.map((block) => {
          const isThisDrag = drag?.id === block.id;
          const isEditName = editingName === block.id;
          const isEditHours = editingHours === block.id;
          const isEditing = isEditName || isEditHours;
          const isDone = block.status === 'done';
          const isPostponed = block.status === 'postponed';
          const isInactive = isDone || isPostponed;

          return (
            <div
              key={block.id}
              className="rounded-2xl relative overflow-hidden flex-shrink-0 group/bar"
              style={{
                backgroundColor: block.color,
                flex: Math.max(block.hours, 0.01),
                minHeight: isEditName ? 110 : 72,
                opacity: isDone ? 0.5 : isPostponed ? 0.65 : 1,
                transition: isThisDrag || drag ? 'none' : 'flex 0.18s ease, opacity 0.2s ease, min-height 0.15s ease',
              }}
            >
              {/* ── Name row ─────────────────────────────── */}
              <div className="absolute top-0 left-0 right-0 flex items-start px-5 pt-4 pr-28 gap-2">
                {isInactive && (
                  <span className="flex-shrink-0 mt-px px-2 py-0.5 rounded-full bg-white/25 text-white text-[10px] font-semibold leading-none self-center">
                    {STATUS_LABEL[block.status]}
                  </span>
                )}
                <div className="flex items-center gap-0.5 flex-1 min-w-0">
                  <span className={`${compact ? 'text-[10px]' : 'text-xs'} font-bold tracking-widest text-white/70 uppercase flex-shrink-0`}>
                    #
                  </span>
                  {block.canEditName && isEditName ? (
                    <input
                      autoFocus
                      value={editNameVal}
                      onChange={(e) => setEditNameVal(e.target.value)}
                      onBlur={() => saveEditName(block.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEditName(block.id);
                        if (e.key === 'Escape') setEditingName(null);
                      }}
                      placeholder="Назва задачі"
                      className={`flex-1 min-w-0 bg-transparent outline-none border-b border-white/40 text-white font-semibold uppercase tracking-widest pb-0.5 placeholder:text-white/40 ${compact ? 'text-[10px]' : 'text-xs'}`}
                    />
                  ) : (
                    <span
                      onClick={() => block.canEditName && !isInactive && startEditName(block.id, block.label)}
                      className={`${compact ? 'text-[10px]' : 'text-xs'} font-bold tracking-widest uppercase leading-none truncate ${block.canEditName && !isInactive ? 'cursor-text hover:text-white' : ''} ${isDone ? 'line-through text-white/60' : 'text-white/90'}`}
                    >
                      {block.label}
                    </span>
                  )}
                </div>
              </div>

              {/* ── Hours ────────────────────────────────── */}
              <div className="absolute top-3 right-5 flex items-baseline">
                {isEditHours ? (
                  <>
                    <input
                      autoFocus
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={editHoursVal}
                      onChange={(e) => setEditHoursVal(e.target.value)}
                      onBlur={() => saveEditHours(block.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEditHours(block.id);
                        if (e.key === 'Escape') setEditingHours(null);
                      }}
                      className={`${hoursSize} font-bold text-white bg-transparent outline-none border-b border-white/50 text-right w-20`}
                    />
                    <span className={`${hoursSize} font-bold text-white leading-none`}>h</span>
                  </>
                ) : (
                  <span
                    onClick={() => !isInactive && startEditHours(block.id, block.hours)}
                    className={`${hoursSize} font-bold text-white leading-none select-none ${!isInactive ? 'cursor-text' : ''}`}
                  >
                    {block.hours}h
                  </span>
                )}
              </div>

              {/* ── Action pills (hover, tasks only, not while editing) ── */}
              {block.canAction && !isEditing && (
                <div className="absolute bottom-8 left-4 flex gap-1.5 opacity-0 group-hover/bar:opacity-100 transition-opacity duration-150 pointer-events-none group-hover/bar:pointer-events-auto">
                  {/* Done */}
                  <button
                    onClick={() => setTaskStatus(weekKey, specialist, block.id, isDone ? 'active' : 'done')}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                      isDone
                        ? 'bg-white text-[#1C1C1E]'
                        : 'bg-white/20 hover:bg-white/35 text-white backdrop-blur-sm'
                    }`}
                  >
                    <IconCheck />
                    Виконано
                  </button>

                  {/* Postpone */}
                  <button
                    onClick={() => { if (!isPostponed) postponeTask(weekKey, specialist, block.id); }}
                    disabled={isPostponed}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                      isPostponed
                        ? 'bg-white text-[#1C1C1E] opacity-80 cursor-default'
                        : 'bg-white/20 hover:bg-white/35 text-white backdrop-blur-sm'
                    }`}
                  >
                    <IconArrow />
                    Перенести
                  </button>

                  {/* To backlog */}
                  <button
                    onClick={() => unassignTask(weekKey, specialist, block.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold bg-white/20 hover:bg-white/35 text-white backdrop-blur-sm transition-all"
                  >
                    <IconBacklog />
                    В беклог
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => deleteTask(weekKey, specialist, block.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold bg-white/20 hover:bg-red-500/60 text-white backdrop-blur-sm transition-all"
                  >
                    <IconTrash />
                    Видалити
                  </button>
                </div>
              )}

              {/* ── Drag handle ──────────────────────────── */}
              <div
                onMouseDown={(e) => onDragStart(e, block.id, block.hours)}
                className="absolute bottom-0 left-0 right-0 h-7 cursor-ns-resize flex items-end justify-center pb-2 group/handle"
              >
                <div className="w-10 h-1 rounded-full bg-white/0 group-hover/handle:bg-white/35 transition-colors duration-150" />
              </div>
            </div>
          );
        })}

        {/* Add button */}
        <button
          onClick={handleAdd}
          disabled={remaining <= 0}
          className="flex-shrink-0 h-9 rounded-2xl bg-[#E5E5EA] hover:bg-[#D1D1D6] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          <IconPlus />
        </button>

        {/* Spacer */}
        {!isOverloaded && remaining > 0 && (
          <div style={{ flex: Math.max(remaining, 0) }} className="min-h-0" />
        )}
      </div>
    </div>
  );
}
