'use client';

import { useState } from 'react';
import { AppState, Task, WellnessArea, TimeBlock, Frequency, AREA_CONFIG, TIME_BLOCKS, FREQUENCY_LABELS, generateId } from '../types';

interface Props { state: AppState; onUpdate: (s: AppState) => void; }

function TaskForm({ task, onSave, onCancel }: {
  task?: Task;
  onSave: (t: Task) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(task?.title || '');
  const [area, setArea] = useState<WellnessArea>(task?.area || 'exercise');
  const [timeBlock, setTimeBlock] = useState<TimeBlock>(task?.timeBlock || 'morning');
  const [frequency, setFrequency] = useState<Frequency>(task?.frequency || 'daily');

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end justify-center" onClick={onCancel}>
      <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 slide-up max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
        <h3 className="font-semibold text-lg mb-4">{task ? 'Edit Task' : 'New Task'}</h3>
        
        <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Task Name</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Take Vitamin D"
          className="w-full px-4 py-3 rounded-xl bg-gray-50 text-sm mt-1 mb-4 focus:outline-none focus:ring-2 focus:ring-[#8fbc8f]/50"
          autoFocus
        />

        <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Category</label>
        <div className="flex flex-wrap gap-2 mt-1 mb-4">
          {(Object.entries(AREA_CONFIG) as [WellnessArea, typeof AREA_CONFIG[WellnessArea]][]).map(([key, cfg]) => (
            <button key={key} onClick={() => setArea(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                area === key ? 'bg-[#e8f0e8] border-2 border-[#8fbc8f]' : 'bg-gray-50 border-2 border-transparent'
              }`}>
              {cfg.emoji} {cfg.label}
            </button>
          ))}
        </div>

        <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Time of Day</label>
        <div className="flex flex-wrap gap-2 mt-1 mb-4">
          {TIME_BLOCKS.map(b => (
            <button key={b.key} onClick={() => setTimeBlock(b.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                timeBlock === b.key ? 'bg-[#f0ebfa] border-2 border-[#c4b5e0]' : 'bg-gray-50 border-2 border-transparent'
              }`}>
              {b.emoji} {b.label}
            </button>
          ))}
        </div>

        <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Frequency</label>
        <div className="flex flex-wrap gap-2 mt-1 mb-6">
          {(Object.entries(FREQUENCY_LABELS) as [Frequency, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setFrequency(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                frequency === key ? 'bg-[#e8f0e8] border-2 border-[#8fbc8f]' : 'bg-gray-50 border-2 border-transparent'
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="px-6 py-3 rounded-xl bg-gray-50 text-gray-500 font-medium">Cancel</button>
          <button
            disabled={!title.trim()}
            onClick={() => onSave({
              id: task?.id || generateId(),
              title: title.trim(),
              area, timeBlock, frequency,
              order: task?.order || 999,
            })}
            className={`flex-1 py-3 rounded-xl font-semibold text-white ${title.trim() ? 'bg-[#8fbc8f]' : 'bg-gray-200'}`}
          >
            {task ? 'Save Changes' : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RoutineEditor({ state, onUpdate }: Props) {
  const [editing, setEditing] = useState<Task | null>(null);
  const [adding, setAdding] = useState(false);
  const [filterArea, setFilterArea] = useState<WellnessArea | 'all'>('all');

  const tasks = state.tasks
    .filter(t => filterArea === 'all' || t.area === filterArea)
    .sort((a, b) => {
      const blockOrder = TIME_BLOCKS.findIndex(tb => tb.key === a.timeBlock) - TIME_BLOCKS.findIndex(tb => tb.key === b.timeBlock);
      return blockOrder || a.order - b.order;
    });

  const saveTask = (task: Task) => {
    const exists = state.tasks.find(t => t.id === task.id);
    const newTasks = exists
      ? state.tasks.map(t => t.id === task.id ? task : t)
      : [...state.tasks, { ...task, order: state.tasks.length }];
    onUpdate({ ...state, tasks: newTasks });
    setEditing(null);
    setAdding(false);
  };

  const deleteTask = (id: string) => {
    onUpdate({ ...state, tasks: state.tasks.filter(t => t.id !== id) });
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">My Routine ✏️</h1>
        <button
          onClick={() => setAdding(true)}
          className="bg-[#8fbc8f] text-white w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg shadow-[#8fbc8f]/30"
        >
          +
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
        <button onClick={() => setFilterArea('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
            filterArea === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100'
          }`}>All</button>
        {(Object.entries(AREA_CONFIG) as [WellnessArea, typeof AREA_CONFIG[WellnessArea]][]).map(([key, cfg]) => (
          <button key={key} onClick={() => setFilterArea(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
              filterArea === key ? 'bg-gray-800 text-white' : 'bg-gray-100'
            }`}>
            {cfg.emoji} {cfg.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {tasks.map(task => (
          <div key={task.id} className="bg-white rounded-xl p-3.5 shadow-sm flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{task.title}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${AREA_CONFIG[task.area].color}`}>
                  {AREA_CONFIG[task.area].emoji} {AREA_CONFIG[task.area].label}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100">
                  {TIME_BLOCKS.find(b => b.key === task.timeBlock)?.emoji} {FREQUENCY_LABELS[task.frequency]}
                </span>
              </div>
            </div>
            <button onClick={() => setEditing(task)} className="text-gray-300 hover:text-gray-500 p-1">
              ✏️
            </button>
            <button onClick={() => deleteTask(task.id)} className="text-gray-300 hover:text-red-400 p-1">
              🗑️
            </button>
          </div>
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-12 text-[var(--text-muted)]">
          <div className="text-4xl mb-2">📝</div>
          <p>No tasks yet. Tap + to add one!</p>
        </div>
      )}

      {(editing || adding) && (
        <TaskForm
          task={editing || undefined}
          onSave={saveTask}
          onCancel={() => { setEditing(null); setAdding(false); }}
        />
      )}
    </div>
  );
}
