'use client';

import { useState } from 'react';
import { AppState, AREA_CONFIG, TIME_BLOCKS, isTaskActiveOnDay, getWeekDates, WellnessArea } from '../types';

interface Props { state: AppState; onUpdate: (s: AppState) => void; }

export default function WeeklyView({ state }: Props) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const weekDays = getWeekDates();

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <h1 className="text-2xl font-bold mb-1">This Week 📅</h1>
      <p className="text-sm text-[var(--text-muted)] mb-5">
        {weekDays[0].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {weekDays[6].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </p>

      <div className="space-y-2">
        {weekDays.map(day => {
          const dayTasks = state.tasks.filter(t => isTaskActiveOnDay(t, day.dayOfWeek)).sort((a, b) => a.order - b.order);
          const dayCompletions = state.completions.filter(c => c.date === day.dateStr && c.done);
          const doneCount = dayCompletions.length;
          const totalCount = dayTasks.length;
          const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
          const isExpanded = expandedDay === day.dateStr;
          const isPast = day.dateStr < new Date().toISOString().split('T')[0];
          const isComplete = doneCount === totalCount && totalCount > 0;

          // Group by area for summary
          const areaCounts: Partial<Record<WellnessArea, number>> = {};
          dayTasks.forEach(t => { areaCounts[t.area] = (areaCounts[t.area] || 0) + 1; });

          return (
            <div key={day.dateStr} className="fade-in">
              <button
                onClick={() => setExpandedDay(isExpanded ? null : day.dateStr)}
                className={`w-full bg-white rounded-2xl p-4 shadow-sm text-left transition-all ${
                  day.isToday ? 'ring-2 ring-[var(--sage)]/40' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                    day.isToday ? 'bg-[var(--sage)] text-white' :
                    isComplete ? 'bg-[var(--sage-light)] text-[var(--sage)]' :
                    isPast ? 'bg-gray-100 text-gray-400' : 'bg-[var(--lavender-light)] text-[var(--lavender)]'
                  }`}>
                    <span className="text-[10px] font-bold uppercase leading-none">{day.label}</span>
                    <span className="text-sm font-bold leading-none mt-0.5">{day.date.getDate()}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">
                        {day.isToday ? 'Today' : day.date.toLocaleDateString('en-US', { weekday: 'long' })}
                      </span>
                      {isComplete && <span className="text-xs">✅</span>}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {Object.entries(areaCounts).slice(0, 4).map(([area, count]) => (
                        <span key={area} className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-50">
                          {AREA_CONFIG[area as WellnessArea].emoji}{count}
                        </span>
                      ))}
                      <span className="text-[10px] text-[var(--text-muted)]">{totalCount} tasks</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className={`text-sm font-bold ${isComplete ? 'text-[var(--sage)]' : 'text-gray-400'}`}>
                        {progress}%
                      </span>
                    </div>
                    <svg className={`w-4 h-4 text-gray-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Mini progress bar */}
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-3">
                  <div className="h-full bg-gradient-to-r from-[var(--sage)] to-[#a8d5a8] rounded-full transition-all"
                    style={{ width: `${progress}%` }} />
                </div>
              </button>

              {/* Expanded day view */}
              {isExpanded && (
                <div className="mt-1 space-y-1 pl-2 slide-up">
                  {TIME_BLOCKS.map(block => {
                    const blockTasks = dayTasks.filter(t => t.timeBlock === block.key);
                    if (blockTasks.length === 0) return null;
                    return (
                      <div key={block.key} className="bg-white/60 rounded-xl p-3">
                        <div className="text-[10px] font-medium text-[var(--text-muted)] uppercase mb-1.5">
                          {block.emoji} {block.label}
                        </div>
                        {blockTasks.map(task => {
                          const isDone = dayCompletions.some(c => c.taskId === task.id);
                          return (
                            <div key={task.id} className={`flex items-center gap-2 py-1 ${isDone ? 'opacity-50' : ''}`}>
                              <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[8px] ${
                                isDone ? 'bg-[var(--sage)] border-[var(--sage)] text-white' : 'border-gray-200'
                              }`}>
                                {isDone && '✓'}
                              </span>
                              <span className={`text-xs ${isDone ? 'line-through text-gray-400' : ''}`}>{task.title}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ml-auto ${AREA_CONFIG[task.area].color}`}>
                                {AREA_CONFIG[task.area].emoji}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
