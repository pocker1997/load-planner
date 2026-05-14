'use client';

import { useState, useRef, useEffect } from 'react';
import { useStoreContext } from '@/lib/storeContext';

function IconPlus() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M7.5 2v11M2 7.5h11" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M1.5 3h9M4 3V2h4v1M4.5 5.5v3M7.5 5.5v3M2.5 3l.7 6.5h5.6L9.5 3"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function BacklogColumn() {
  const { backlog, addBacklogTask, deleteBacklogTask, renameBacklogTask } = useStoreContext();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditVal(name);
  };

  const saveEdit = (id: string) => {
    const trimmed = editVal.trim();
    if (trimmed) renameBacklogTask(id, trimmed);
    setEditingId(null);
  };

  const handleAdd = () => {
    const id = addBacklogTask('Нова задача');
    setTimeout(() => startEdit(id, 'Нова задача'), 30);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <p className="text-xs font-semibold tracking-widest text-[#8E8E93] uppercase mb-3 flex-shrink-0">
        Беклог
      </p>

      {/* Cards */}
      <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto pr-0.5">
        {backlog.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[11px] text-[#C7C7CC] text-center leading-relaxed">
              Перетягни сюди<br />або додай задачу
            </p>
          </div>
        )}

        {backlog.map((task) => (
          <div
            key={task.id}
            draggable={editingId !== task.id}
            onDragStart={(e) => handleDragStart(e, task.id)}
            className="group flex-shrink-0 bg-[#3A3A3C] rounded-2xl px-4 py-3 flex items-center gap-2 cursor-grab active:cursor-grabbing"
            style={{ minHeight: 56 }}
          >
            {/* Drag dots */}
            <div className="flex-shrink-0 flex flex-col gap-[3px] opacity-30 group-hover:opacity-60 transition-opacity">
              {[0,1,2].map(i => (
                <div key={i} className="flex gap-[3px]">
                  <div className="w-[3px] h-[3px] rounded-full bg-white" />
                  <div className="w-[3px] h-[3px] rounded-full bg-white" />
                </div>
              ))}
            </div>

            {/* Name */}
            {editingId === task.id ? (
              <input
                autoFocus
                value={editVal}
                onChange={(e) => setEditVal(e.target.value)}
                onBlur={() => saveEdit(task.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit(task.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                className="flex-1 min-w-0 bg-transparent outline-none text-white text-xs font-semibold border-b border-white/40 pb-0.5 placeholder:text-white/30"
                placeholder="Назва задачі"
              />
            ) : (
              <span
                onClick={() => startEdit(task.id, task.name)}
                className="flex-1 min-w-0 text-xs font-semibold text-white/90 truncate cursor-text hover:text-white transition-colors"
              >
                {task.name}
              </span>
            )}

            {/* Delete */}
            {editingId !== task.id && (
              <button
                onClick={() => deleteBacklogTask(task.id)}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-white/50 hover:text-white"
              >
                <IconTrash />
              </button>
            )}
          </div>
        ))}

        {/* Add button */}
        <button
          onClick={handleAdd}
          className="flex-shrink-0 h-9 rounded-2xl bg-[#E5E5EA] hover:bg-[#D1D1D6] transition-colors flex items-center justify-center"
        >
          <IconPlus />
        </button>
      </div>
    </div>
  );
}
