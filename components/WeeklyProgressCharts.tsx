'use client';

import { AppState, Task, TaskCompletion, WellnessArea, AREA_CONFIG, isTaskActiveOnDay } from '../app/types';
import { calculateTaskStreak, calculateGlobalStreaks } from '../lib/streakCalculation';

interface WeeklyProgressChartsProps {
  state: AppState;
}

interface WeekData {
  weekStart: Date;
  weekLabel: string;
  completionRate: number;
  totalTasks: number;
  completedTasks: number;
  perfectDays: number;
  areaBreakdown: Record<WellnessArea, { completed: number; total: number; rate: number }>;
}

export default function WeeklyProgressCharts({ state }: WeeklyProgressChartsProps) {
  if (state.tasks.length === 0 || state.completions.length === 0) {
    return (
      <div className="mb-6 p-6 bg-[var(--surface-secondary)] rounded-xl text-center">
        <div className="text-4xl mb-2">📊</div>
        <p className="text-[var(--text-muted)]">
          Complete some tasks to see your progress charts!
        </p>
      </div>
    );
  }

  const weeklyData = generateWeeklyData(state.tasks, state.completions);
  const streakData = calculateGlobalStreaks(state.tasks, state.completions);

  return (
    <div className="space-y-6">
      {/* Overall Progress Chart */}
      <div className="bg-[var(--surface-secondary)] rounded-xl p-5">
        <h3 className="text-lg font-semibold text-[var(--text-default)] mb-4">
          📈 Weekly Progress
        </h3>
        
        <div className="space-y-4">
          {/* Chart bars */}
          <div className="flex items-end justify-between h-32 gap-2">
            {weeklyData.map((week, index) => {
              const height = week.completionRate;
              const color = height >= 80 ? 'bg-green-500' :
                           height >= 60 ? 'bg-blue-500' :
                           height >= 40 ? 'bg-orange-500' : 'bg-red-500';
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full relative flex items-end justify-center" style={{ height: '100px' }}>
                    <div 
                      className={`w-full ${color} rounded-t transition-all duration-500 min-h-[4px]`}
                      style={{ height: `${Math.max(height, 4)}%` }}
                      title={`${week.weekLabel}: ${height.toFixed(0)}% completion`}
                    />
                    
                    {/* Perfect days indicator */}
                    {week.perfectDays > 0 && (
                      <div className="absolute -top-2 text-xs">
                        {'⭐'.repeat(Math.min(week.perfectDays, 3))}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 text-xs text-[var(--text-muted)] text-center">
                    {week.weekLabel}
                  </div>
                  <div className="text-xs font-medium text-[var(--text-default)]">
                    {height.toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>80%+</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>60-79%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>40-59%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>&lt;40%</span>
            </div>
            <div className="flex items-center gap-1">
              <span>⭐</span>
              <span>Perfect days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Area Breakdown */}
      <div className="bg-[var(--surface-secondary)] rounded-xl p-5">
        <h3 className="text-lg font-semibold text-[var(--text-default)] mb-4">
          🎯 Progress by Area
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(AREA_CONFIG).map(([area, config]) => {
            const areaData = streakData.streaksByArea[area as WellnessArea];
            if (!areaData) return null;

            const completionRate = areaData.completionRate;
            const currentStreak = areaData.currentStreak;

            return (
              <div 
                key={area}
                className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-primary)]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{config.emoji}</span>
                    <span className="font-medium text-[var(--text-default)]">
                      {config.label}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {currentStreak > 0 && `${currentStreak} day streak`}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
                    <span>Last 30 days</span>
                    <span>{completionRate.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-[var(--border)] rounded-full h-2">
                    <div 
                      className="bg-[var(--accent)] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(completionRate, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Badge */}
                <div className="text-xs text-[var(--text-muted)]">
                  {areaData.badge}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Streak Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[var(--accent-bg)] rounded-xl p-4 text-center border border-[var(--accent-border)]">
          <div className="text-2xl font-bold text-[var(--accent)] mb-1">
            {streakData.overallStreak}
          </div>
          <div className="text-sm text-[var(--text-muted)] mb-1">
            Day Streak
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            At least one task daily
          </div>
        </div>

        <div className="bg-[var(--surface-secondary)] rounded-xl p-4 text-center border border-[var(--border)]">
          <div className="text-2xl font-bold text-[var(--text-default)] mb-1">
            {streakData.perfectDays}
          </div>
          <div className="text-sm text-[var(--text-muted)] mb-1">
            Perfect Days
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            All active tasks completed
          </div>
        </div>

        <div className="bg-[var(--surface-secondary)] rounded-xl p-4 text-center border border-[var(--border)]">
          <div className="text-2xl font-bold text-[var(--text-default)] mb-1">
            {streakData.totalCompletions}
          </div>
          <div className="text-sm text-[var(--text-muted)] mb-1">
            Total Completions
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            All time
          </div>
        </div>
      </div>

      {/* Consistency Heatmap */}
      <div className="bg-[var(--surface-secondary)] rounded-xl p-5">
        <h3 className="text-lg font-semibold text-[var(--text-default)] mb-4">
          🔥 Consistency Heatmap (Last 28 Days)
        </h3>
        
        <ConsistencyHeatmap tasks={state.tasks} completions={state.completions} />
      </div>
    </div>
  );
}

function ConsistencyHeatmap({ tasks, completions }: { tasks: Task[]; completions: TaskCompletion[] }) {
  const today = new Date();
  const days: { date: Date; dateStr: string; completionRate: number; label: string }[] = [];
  
  // Generate last 28 days
  for (let i = 27; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Calculate completion rate for this day
    const dayOfWeek = date.getDay();
    const activeTasks = tasks.filter(t => isTaskActiveOnDay(t, dayOfWeek));
    const completedTasks = completions.filter(c => 
      c.date === dateStr && c.done && activeTasks.some(t => t.id === c.taskId)
    );
    
    const completionRate = activeTasks.length > 0 ? 
      (completedTasks.length / activeTasks.length) * 100 : 0;
    
    days.push({
      date,
      dateStr,
      completionRate,
      label: date.getDate().toString()
    });
  }

  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((day, index) => {
        const intensity = day.completionRate;
        const color = intensity === 0 ? 'bg-gray-100' :
                     intensity < 25 ? 'bg-green-200' :
                     intensity < 50 ? 'bg-green-300' :
                     intensity < 75 ? 'bg-green-400' :
                     intensity < 100 ? 'bg-green-500' : 'bg-green-600';

        return (
          <div
            key={index}
            className={`aspect-square ${color} rounded text-xs flex items-center justify-center text-gray-700 font-medium transition-all hover:scale-110`}
            title={`${day.date.toLocaleDateString()}: ${intensity.toFixed(0)}% completion`}
          >
            {day.label}
          </div>
        );
      })}
    </div>
  );
}

function generateWeeklyData(tasks: Task[], completions: TaskCompletion[]): WeekData[] {
  const weeks: WeekData[] = [];
  const today = new Date();
  
  // Generate data for last 8 weeks
  for (let weekOffset = 7; weekOffset >= 0; weekOffset--) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (weekOffset * 7));
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Go to Sunday
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    let totalTasks = 0;
    let completedTasks = 0;
    let perfectDays = 0;
    
    const areaBreakdown: Record<WellnessArea, { completed: number; total: number; rate: number }> = {} as any;
    
    // Initialize area breakdown
    Object.keys(AREA_CONFIG).forEach(area => {
      areaBreakdown[area as WellnessArea] = { completed: 0, total: 0, rate: 0 };
    });

    // Check each day of the week
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDay = new Date(weekStart);
      currentDay.setDate(weekStart.getDate() + dayOffset);
      const dayStr = currentDay.toISOString().split('T')[0];
      const dayOfWeek = currentDay.getDay();
      
      // Get active tasks for this day
      const activeTasks = tasks.filter(t => isTaskActiveOnDay(t, dayOfWeek));
      const completedDayTasks = completions.filter(c => 
        c.date === dayStr && c.done && activeTasks.some(t => t.id === c.taskId)
      );
      
      totalTasks += activeTasks.length;
      completedTasks += completedDayTasks.length;
      
      // Check if it was a perfect day
      if (activeTasks.length > 0 && completedDayTasks.length === activeTasks.length) {
        perfectDays++;
      }
      
      // Update area breakdown
      activeTasks.forEach(task => {
        areaBreakdown[task.area].total++;
        if (completedDayTasks.some(c => c.taskId === task.id)) {
          areaBreakdown[task.area].completed++;
        }
      });
    }
    
    // Calculate area completion rates
    Object.keys(areaBreakdown).forEach(area => {
      const areaData = areaBreakdown[area as WellnessArea];
      areaData.rate = areaData.total > 0 ? (areaData.completed / areaData.total) * 100 : 0;
    });
    
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    weeks.push({
      weekStart,
      weekLabel: weekOffset === 0 ? 'This week' : 
                 weekOffset === 1 ? 'Last week' :
                 `${weekOffset}w ago`,
      completionRate,
      totalTasks,
      completedTasks,
      perfectDays,
      areaBreakdown
    });
  }
  
  return weeks;
}