// Streak calculation utilities for habit tracking

import { Task, TaskCompletion, WellnessArea, isTaskActiveOnDay } from '../app/types';

export interface StreakData {
  taskId: string;
  taskTitle: string;
  area: WellnessArea;
  currentStreak: number;
  longestStreak: number;
  completionRate: number; // Last 30 days
  lastCompletedDate: string | null;
  streakBroken: boolean;
  daysInRow: number;
  streakBadge: string;
  encouragement: string;
}

export interface GlobalStreaks {
  overallStreak: number; // Days with at least one task completed
  perfectDays: number; // Days with all active tasks completed
  totalCompletions: number;
  streaksByArea: Record<WellnessArea, {
    currentStreak: number;
    completionRate: number;
    badge: string;
  }>;
}

export function calculateTaskStreak(
  task: Task, 
  completions: TaskCompletion[], 
  endDate: Date = new Date()
): StreakData {
  
  // Get completions for this task, sorted by date (newest first)
  const taskCompletions = completions
    .filter(c => c.taskId === task.id && c.done)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const today = endDate.toISOString().split('T')[0];
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let lastCompletedDate: string | null = null;

  // Calculate current streak (counting back from today)
  const currentDate = new Date(endDate);
  let streakActive = true;
  
  for (let i = 0; i < 365; i++) { // Check up to a year back
    const checkDate = new Date(currentDate);
    checkDate.setDate(currentDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];
    const dayOfWeek = checkDate.getDay();
    
    // Only count days when this task should be active
    if (!isTaskActiveOnDay(task, dayOfWeek)) {
      continue;
    }
    
    const wasCompleted = taskCompletions.some(c => c.date === dateStr);
    
    if (wasCompleted) {
      if (streakActive) currentStreak++;
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
      if (!lastCompletedDate) lastCompletedDate = dateStr;
    } else {
      if (streakActive) {
        streakActive = false;
        // If today was supposed to be done but wasn't, streak is broken
        if (i === 0) currentStreak = 0;
      }
      tempStreak = 0;
    }
    
    // Stop checking if we've gone back far enough
    if (!wasCompleted && i > 30) break;
  }

  // Calculate completion rate for last 30 days
  const thirtyDaysAgo = new Date(endDate);
  thirtyDaysAgo.setDate(endDate.getDate() - 30);
  
  let activeDaysInPeriod = 0;
  let completedDaysInPeriod = 0;
  
  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(endDate);
    checkDate.setDate(endDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];
    const dayOfWeek = checkDate.getDay();
    
    if (isTaskActiveOnDay(task, dayOfWeek)) {
      activeDaysInPeriod++;
      if (taskCompletions.some(c => c.date === dateStr)) {
        completedDaysInPeriod++;
      }
    }
  }
  
  const completionRate = activeDaysInPeriod > 0 ? 
    (completedDaysInPeriod / activeDaysInPeriod) * 100 : 0;

  // Determine if streak is broken (didn't do task today when it was supposed to be done)
  const todayDayOfWeek = endDate.getDay();
  const shouldDoToday = isTaskActiveOnDay(task, todayDayOfWeek);
  const didToday = taskCompletions.some(c => c.date === today);
  const streakBroken = shouldDoToday && !didToday && currentStreak > 0;

  // Generate streak badge
  const streakBadge = getStreakBadge(currentStreak, completionRate);
  
  // Generate encouragement message
  const encouragement = getEncouragementMessage(currentStreak, completionRate, streakBroken);

  return {
    taskId: task.id,
    taskTitle: task.title,
    area: task.area,
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    completionRate,
    lastCompletedDate,
    streakBroken,
    daysInRow: currentStreak,
    streakBadge,
    encouragement
  };
}

export function calculateGlobalStreaks(
  tasks: Task[], 
  completions: TaskCompletion[], 
  endDate: Date = new Date()
): GlobalStreaks {
  
  let overallStreak = 0;
  let perfectDays = 0;
  const totalCompletions = completions.filter(c => c.done).length;
  
  // Calculate overall streak (days with at least one completion)
  const currentDate = new Date(endDate);
  let hasOverallStreak = true;
  
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(currentDate);
    checkDate.setDate(currentDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];
    
    const dayCompletions = completions.filter(c => c.date === dateStr && c.done);
    
    if (dayCompletions.length > 0) {
      if (hasOverallStreak) overallStreak++;
      
      // Check if it was a perfect day (all active tasks completed)
      const dayOfWeek = checkDate.getDay();
      const activeTasks = tasks.filter(t => isTaskActiveOnDay(t, dayOfWeek));
      const completedTasks = dayCompletions.filter(c => 
        activeTasks.some(t => t.id === c.taskId)
      );
      
      if (activeTasks.length > 0 && completedTasks.length === activeTasks.length) {
        perfectDays++;
      }
    } else {
      hasOverallStreak = false;
    }
    
    if (!hasOverallStreak && i > 30) break;
  }

  // Calculate streaks by area
  const streaksByArea: Record<WellnessArea, any> = {} as any;
  
  const areas: WellnessArea[] = ['exercise', 'supplements', 'skincare', 'nutrition', 'sleep', 'meditation', 'hydration'];
  
  areas.forEach(area => {
    const areaTasks = tasks.filter(t => t.area === area);
    if (areaTasks.length === 0) return;
    
    const areaCompletions = completions.filter(c => 
      areaTasks.some(t => t.id === c.taskId) && c.done
    );
    
    // Calculate area streak
    let areaStreak = 0;
    let hasAreaStreak = true;
    let areaCompletedDays = 0;
    let areaActiveDays = 0;
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(currentDate);
      checkDate.setDate(currentDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      const dayOfWeek = checkDate.getDay();
      
      const dayAreaTasks = areaTasks.filter(t => isTaskActiveOnDay(t, dayOfWeek));
      const dayAreaCompletions = areaCompletions.filter(c => c.date === dateStr);
      
      if (dayAreaTasks.length > 0) {
        areaActiveDays++;
        if (dayAreaCompletions.length > 0) {
          areaCompletedDays++;
          if (hasAreaStreak) areaStreak++;
        } else {
          hasAreaStreak = false;
        }
      }
    }
    
    const areaCompletionRate = areaActiveDays > 0 ? (areaCompletedDays / areaActiveDays) * 100 : 0;
    
    streaksByArea[area] = {
      currentStreak: areaStreak,
      completionRate: areaCompletionRate,
      badge: getAreaBadge(area, areaCompletionRate)
    };
  });

  return {
    overallStreak,
    perfectDays,
    totalCompletions,
    streaksByArea
  };
}

function getStreakBadge(streak: number, completionRate: number): string {
  if (streak >= 30) return '👑 Streak Master';
  if (streak >= 21) return '🔥 On Fire';
  if (streak >= 14) return '⭐ Two Weeks';
  if (streak >= 7) return '📈 Week Strong';
  if (streak >= 3) return '💪 Building';
  if (completionRate >= 80) return '🎯 Consistent';
  if (completionRate >= 60) return '📊 Regular';
  return '🌱 Starting';
}

function getAreaBadge(area: WellnessArea, completionRate: number): string {
  const areaEmojis = {
    exercise: completionRate >= 80 ? '🏆 Athlete' : completionRate >= 60 ? '💪 Active' : '🏃 Building',
    supplements: completionRate >= 80 ? '💎 Dedicated' : completionRate >= 60 ? '💊 Consistent' : '🌱 Starting',
    skincare: completionRate >= 80 ? '✨ Glowing' : completionRate >= 60 ? '🧴 Regular' : '🌸 Learning',
    nutrition: completionRate >= 80 ? '🥗 Nourished' : completionRate >= 60 ? '🍎 Healthy' : '🌱 Growing',
    sleep: completionRate >= 80 ? '😴 Rested' : completionRate >= 60 ? '🛏️ Regular' : '🌙 Improving',
    meditation: completionRate >= 80 ? '🧘 Zen' : completionRate >= 60 ? '☮️ Peaceful' : '🌸 Mindful',
    hydration: completionRate >= 80 ? '💧 Hydrated' : completionRate >= 60 ? '🚰 Regular' : '💦 Learning'
  };
  
  return areaEmojis[area];
}

function getEncouragementMessage(streak: number, completionRate: number, streakBroken: boolean): string {
  if (streakBroken) {
    return "Don't let one day stop you! Get back on track 💪";
  }
  
  if (streak >= 21) {
    return "Incredible dedication! You're unstoppable 🔥";
  }
  
  if (streak >= 7) {
    return "Amazing work! Keep the momentum going ⭐";
  }
  
  if (streak >= 3) {
    return "Great start! You're building a solid habit 📈";
  }
  
  if (completionRate >= 70) {
    return "You're doing great! Stay consistent 🎯";
  }
  
  return "Every day is a new chance to grow 🌱";
}