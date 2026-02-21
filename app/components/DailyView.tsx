'use client';

import { useState } from 'react';
import { AppState, Task, TaskCompletion, TIME_BLOCKS, AREA_CONFIG, todayStr, isTaskActiveToday, generateId } from '../types';
import LifeEvents from './LifeEvents';

interface Props { state: AppState; onUpdate: (s: AppState) => void; onSwitchToChat: (prefill?: string) => void; }

function FeedbackModal({ task, completion, onSave, onClose }: {
  task: Task;
  completion?: TaskCompletion;
  onSave: (c: Partial<TaskCompletion>) => void;
  onClose: () => void;
}) {
  const [feedback, setFeedback] = useState(completion?.feedback || null);
  const [note, setNote] = useState(completion?.note || '');

  const options = [
    { key: 'loved' as const, emoji: '❤️', label: 'Loved it' },
    { key: 'too-hard' as const, emoji: '😮‍💨', label: 'Too hard' },
    { key: 'skipped' as const, emoji: '⏭️', label: 'Skipped' },
    { key: 'no-time' as const, emoji: '⏰', label: 'No time' },
  ];

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end justify-center" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 slide-up" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
        <h3 className="font-semibold text-lg mb-1">{AREA_CONFIG[task.area].emoji} {task.title}</h3>
        <p className="text-sm text-[var(--text-muted)] mb-4">How did it go?</p>
        <div className="flex gap-2 mb-4">
          {options.map(o => (
            <button
              key={o.key}
              onClick={() => setFeedback(o.key)}
              className={`flex-1 py-3 rounded-xl text-center transition-all ${
                feedback === o.key ? 'bg-[#e8f0e8] border-2 border-[#8fbc8f]' : 'bg-gray-50 border-2 border-transparent'
              }`}
            >
              <div className="text-xl">{o.emoji}</div>
              <div className="text-[10px] font-medium mt-1">{o.label}</div>
            </button>
          ))}
        </div>
        <textarea
          placeholder="Any notes? (optional)"
          value={note}
          onChange={e => setNote(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#8fbc8f]/50 resize-none h-20 mb-4"
        />
        <button
          onClick={() => { onSave({ feedback: feedback || undefined, note: note || undefined }); onClose(); }}
          className="w-full py-3 rounded-xl bg-[#8fbc8f] text-white font-semibold"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function DayRatingModal({ onSave, onClose }: { onSave: (rating: number, note: string) => void; onClose: () => void }) {
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end justify-center" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 slide-up" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
        <h3 className="font-semibold text-lg text-center mb-1">How was your day? 🌙</h3>
        <div className="flex justify-center gap-3 my-4">
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={() => setRating(n)}
              className={`text-3xl transition-transform ${rating >= n ? 'scale-125' : 'opacity-30'}`}>
              {n <= 2 ? '😔' : n === 3 ? '😐' : n === 4 ? '😊' : '🤩'}
            </button>
          ))}
        </div>
        <textarea placeholder="Reflect on today..." value={note} onChange={e => setNote(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-gray-50 text-sm focus:outline-none resize-none h-20 mb-4" />
        <button disabled={!rating} onClick={() => { onSave(rating, note); onClose(); }}
          className={`w-full py-3 rounded-xl font-semibold text-white ${rating ? 'bg-[#c4b5e0]' : 'bg-gray-200'}`}>
          Save Reflection
        </button>
      </div>
    </div>
  );
}

export default function DailyView({ state, onUpdate, onSwitchToChat }: Props) {
  const [feedbackTask, setFeedbackTask] = useState<Task | null>(null);
  const [showDayRating, setShowDayRating] = useState(false);

  const today = todayStr();
  const activeTasks = state.tasks.filter(isTaskActiveToday).sort((a, b) => a.order - b.order);
  const completionMap = new Map(
    state.completions.filter(c => c.date === today).map(c => [c.taskId, c])
  );

  const doneCount = activeTasks.filter(t => completionMap.get(t.id)?.done).length;
  const progress = activeTasks.length > 0 ? Math.round((doneCount / activeTasks.length) * 100) : 0;
  const todayRating = state.ratings.find(r => r.date === today);

  const toggleDone = (taskId: string) => {
    const existing = completionMap.get(taskId);
    const done = !existing?.done;
    const newCompletions = state.completions.filter(c => !(c.taskId === taskId && c.date === today));
    if (done || existing) {
      newCompletions.push({ taskId, date: today, done, feedback: existing?.feedback, note: existing?.note });
    }
    onUpdate({ ...state, completions: newCompletions });
  };

  const saveFeedback = (taskId: string, fb: Partial<TaskCompletion>) => {
    const existing = completionMap.get(taskId);
    const newCompletions = state.completions.filter(c => !(c.taskId === taskId && c.date === today));
    newCompletions.push({ taskId, date: today, done: existing?.done || false, ...fb });
    onUpdate({ ...state, completions: newCompletions });
  };

  const saveDayRating = (rating: number, note: string) => {
    const newRatings = state.ratings.filter(r => r.date !== today);
    newRatings.push({ date: today, rating, note: note || undefined });
    onUpdate({ ...state, ratings: newRatings });
  };

  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      {/* Header */}
      <div className="mb-6 fade-in">
        <h1 className="text-2xl font-bold">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {state.profile.name} 🌸
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">{dayName}</p>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 fade-in">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Today&apos;s Progress</span>
          <span className="text-sm font-bold text-[#8fbc8f]">{progress}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#8fbc8f] to-[#a8d5a8] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-2">
          {doneCount} of {activeTasks.length} tasks done
          {progress === 100 && ' — Amazing! 🎉'}
        </p>
      </div>

      {/* Life Events */}
      <LifeEvents state={state} onUpdate={onUpdate} onSwitchToChat={onSwitchToChat} />

      {/* Time blocks */}
      {TIME_BLOCKS.map(block => {
        const blockTasks = activeTasks.filter(t => t.timeBlock === block.key);
        if (blockTasks.length === 0) return null;
        return (
          <div key={block.key} className="mb-5 fade-in">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{block.emoji}</span>
              <h2 className="font-semibold text-sm text-[var(--text-muted)] uppercase tracking-wide">{block.label}</h2>
              <span className="text-xs text-gray-300">{block.hours}</span>
            </div>
            <div className="space-y-2">
              {blockTasks.map(task => {
                const comp = completionMap.get(task.id);
                const isDone = comp?.done || false;
                return (
                  <div key={task.id} className={`bg-white rounded-xl p-3.5 shadow-sm flex items-center gap-3 transition-all ${isDone ? 'opacity-60' : ''}`}>
                    <button
                      onClick={() => toggleDone(task.id)}
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isDone ? 'bg-[#8fbc8f] border-[#8fbc8f] check-pop' : 'border-gray-200 hover:border-[#8fbc8f]'
                      }`}
                    >
                      {isDone && <span className="text-white text-xs">✓</span>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${isDone ? 'line-through text-gray-400' : ''}`}>{task.title}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${AREA_CONFIG[task.area].color}`}>
                          {AREA_CONFIG[task.area].emoji} {AREA_CONFIG[task.area].label}
                        </span>
                        {comp?.feedback && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100">
                            {comp.feedback === 'loved' ? '❤️' : comp.feedback === 'too-hard' ? '😮‍💨' : comp.feedback === 'skipped' ? '⏭️' : '⏰'}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setFeedbackTask(task)}
                      className="text-gray-300 hover:text-gray-500 p-1"
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Day rating */}
      <div className="mb-8">
        {todayRating ? (
          <div className="bg-[#f0ebfa] rounded-2xl p-4 text-center">
            <span className="text-2xl">{todayRating.rating <= 2 ? '😔' : todayRating.rating === 3 ? '😐' : todayRating.rating === 4 ? '😊' : '🤩'}</span>
            <p className="text-sm font-medium mt-1">Day rated: {todayRating.rating}/5</p>
            {todayRating.note && <p className="text-xs text-[var(--text-muted)] mt-1">{todayRating.note}</p>}
          </div>
        ) : (
          <button
            onClick={() => setShowDayRating(true)}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-[#c4b5e0] hover:text-[#c4b5e0] transition-all"
          >
            🌙 Rate your day
          </button>
        )}
      </div>

      {/* Modals */}
      {feedbackTask && (
        <FeedbackModal
          task={feedbackTask}
          completion={completionMap.get(feedbackTask.id)}
          onSave={fb => saveFeedback(feedbackTask.id, fb)}
          onClose={() => setFeedbackTask(null)}
        />
      )}
      {showDayRating && (
        <DayRatingModal onSave={saveDayRating} onClose={() => setShowDayRating(false)} />
      )}
    </div>
  );
}
