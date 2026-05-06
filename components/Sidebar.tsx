'use client';

import { useState } from 'react';
import { Specialist, SpecialistData, TASK_COLORS, Task } from '@/types';
import { formatWeekLabel, nextWeekKey, prevWeekKey } from '@/lib/week';

interface Props {
  weekKey: string;
  onWeekChange: (key: string) => void;
  specData: SpecialistData;
  selectedSpec: Specialist;
  onAddTask: (name: string, hours: number) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, name: string, hours: number) => void;
  onMeetingHoursChange: (hours: number) => void;
}

export default function Sidebar({
  weekKey,
  onWeekChange,
  specData,
  selectedSpec,
  onAddTask,
  onDeleteTask,
  onUpdateTask,
  onMeetingHoursChange,
}: Props) {
  const [taskName, setTaskName] = useState('');
  const [taskHours, setTaskHours] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editHours, setEditHours] = useState('');

  const handleAdd = () => {
    const h = parseFloat(taskHours);
    if (!taskName.trim() || isNaN(h) || h <= 0) return;
    onAddTask(taskName.trim(), h);
    setTaskName('');
    setTaskHours('');
  };

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setEditName(task.name);
    setEditHours(String(task.hours));
  };

  const confirmEdit = () => {
    if (!editingId) return;
    const h = parseFloat(editHours);
    if (!editName.trim() || isNaN(h) || h <= 0) return;
    onUpdateTask(editingId, editName.trim(), h);
    setEditingId(null);
  };

  return (
    <aside className="w-72 flex-shrink-0 bg-white shadow-[1px_0_0_0_#E5E5EA] flex flex-col h-full overflow-hidden">
      {/* Week switcher */}
      <div className="px-5 pt-6 pb-4 border-b border-[#E5E5EA]">
        <p className="text-[10px] font-semibold tracking-widest text-[#8E8E93] uppercase mb-2">Тиждень</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onWeekChange(prevWeekKey(weekKey))}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F2F2F7] transition-colors text-[#3A3A3C]"
            aria-label="Попередній тиждень"
          >
            <ChevronLeft />
          </button>
          <span className="flex-1 text-center text-sm font-semibold text-[#1C1C1E]">
            {formatWeekLabel(weekKey)}
          </span>
          <button
            onClick={() => onWeekChange(nextWeekKey(weekKey))}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F2F2F7] transition-colors text-[#3A3A3C]"
            aria-label="Наступний тиждень"
          >
            <ChevronRight />
          </button>
        </div>
      </div>

      {/* Meetings input */}
      <div className="px-5 py-4 border-b border-[#E5E5EA]">
        <label className="text-[10px] font-semibold tracking-widest text-[#8E8E93] uppercase block mb-2">
          Мітинги, год — {selectedSpec}
        </label>
        <input
          type="number"
          min="0"
          max="40"
          step="0.5"
          value={specData.meetingHours || ''}
          placeholder="0"
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            onMeetingHoursChange(isNaN(v) ? 0 : v);
          }}
          className="w-full h-10 px-3 rounded-xl bg-[#F2F2F7] text-sm font-medium text-[#1C1C1E] outline-none focus:ring-2 focus:ring-[#1C1C1E]/10"
        />
      </div>

      {/* Add task form */}
      <div className="px-5 py-4 border-b border-[#E5E5EA]">
        <p className="text-[10px] font-semibold tracking-widest text-[#8E8E93] uppercase mb-3">
          Нова задача — {selectedSpec}
        </p>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Назва задачі"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="h-10 px-3 rounded-xl bg-[#F2F2F7] text-sm text-[#1C1C1E] outline-none focus:ring-2 focus:ring-[#1C1C1E]/10 placeholder:text-[#AEAEB2]"
          />
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Год"
              min="0.5"
              step="0.5"
              value={taskHours}
              onChange={(e) => setTaskHours(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="w-20 h-10 px-3 rounded-xl bg-[#F2F2F7] text-sm text-[#1C1C1E] outline-none focus:ring-2 focus:ring-[#1C1C1E]/10 placeholder:text-[#AEAEB2]"
            />
            <button
              onClick={handleAdd}
              disabled={!taskName.trim() || !taskHours}
              className="flex-1 h-10 rounded-xl bg-[#1C1C1E] text-white text-sm font-semibold disabled:opacity-30 hover:bg-[#3A3A3C] active:scale-[0.98] transition-all"
            >
              Додати
            </button>
          </div>
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <p className="text-[10px] font-semibold tracking-widest text-[#8E8E93] uppercase mb-3">
          Задачі {selectedSpec}
        </p>
        {specData.tasks.length === 0 ? (
          <p className="text-xs text-[#AEAEB2] text-center pt-4">Ще немає задач</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {specData.tasks.map((task) => (
              <li key={task.id}>
                {editingId === task.id ? (
                  <div className="flex flex-col gap-1.5 p-2 bg-[#F2F2F7] rounded-xl">
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8 px-2 rounded-lg bg-white text-sm text-[#1C1C1E] outline-none"
                    />
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        value={editHours}
                        onChange={(e) => setEditHours(e.target.value)}
                        className="w-16 h-8 px-2 rounded-lg bg-white text-sm text-[#1C1C1E] outline-none"
                      />
                      <button
                        onClick={confirmEdit}
                        className="flex-1 h-8 rounded-lg bg-[#1C1C1E] text-white text-xs font-semibold"
                      >
                        ОК
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="w-8 h-8 rounded-lg bg-[#E5E5EA] text-[#3A3A3C] text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#F2F2F7] group transition-colors">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: TASK_COLORS[task.colorIndex % TASK_COLORS.length] }}
                    />
                    <span className="flex-1 text-sm text-[#1C1C1E] truncate">{task.name}</span>
                    <span className="text-xs font-semibold text-[#8E8E93] flex-shrink-0">{task.hours}h</span>
                    <button
                      onClick={() => startEdit(task)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-[#E5E5EA] text-[#8E8E93]"
                      aria-label="Редагувати"
                    >
                      <PencilIcon />
                    </button>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-[#FFE5E5] text-[#FF3B30]"
                      aria-label="Видалити"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.8 7.5h6.4L11 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
