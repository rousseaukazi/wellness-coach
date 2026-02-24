// Smart suggestions engine for personalized wellness recommendations

import { AppState, Task, TaskCompletion, WellnessArea, TimeBlock, isTaskActiveOnDay, AREA_CONFIG } from '../app/types';
import { calculateTaskStreak, calculateGlobalStreaks } from './streakCalculation';

export interface Suggestion {
  id: string;
  type: 'timing' | 'frequency' | 'area_focus' | 'habit_stack' | 'motivation' | 'schedule_optimization';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  emoji: string;
  actionable: string;
  reasoning: string;
  confidence: number; // 0-100
  area?: WellnessArea;
  timeBlock?: TimeBlock;
}

export interface SuggestionContext {
  totalDays: number;
  completionRate: number;
  consistentAreas: WellnessArea[];
  strugglingAreas: WellnessArea[];
  bestTimeBlocks: TimeBlock[];
  worstTimeBlocks: TimeBlock[];
  currentStreaks: Record<string, number>;
  recentTrend: 'improving' | 'stable' | 'declining';
}

export function generateSmartSuggestions(state: AppState): Suggestion[] {
  if (state.tasks.length === 0 || state.completions.length === 0) {
    return getOnboardingSuggestions(state);
  }

  const context = analyzeBehaviorPatterns(state);
  const suggestions: Suggestion[] = [];

  // Generate different types of suggestions
  suggestions.push(...generateTimingOptimizationSuggestions(state, context));
  suggestions.push(...generateAreaFocusSuggestions(state, context));
  suggestions.push(...generateHabitStackingSuggestions(state, context));
  suggestions.push(...generateMotivationSuggestions(state, context));
  suggestions.push(...generateScheduleOptimizationSuggestions(state, context));

  // Sort by priority and confidence, limit to top suggestions
  return suggestions
    .sort((a, b) => {
      const priorityScore = { high: 3, medium: 2, low: 1 };
      const aScore = priorityScore[a.priority] * (a.confidence / 100);
      const bScore = priorityScore[b.priority] * (b.confidence / 100);
      return bScore - aScore;
    })
    .slice(0, 6); // Limit to 6 suggestions to avoid overwhelm
}

function analyzeBehaviorPatterns(state: AppState): SuggestionContext {
  const completions = state.completions.filter(c => c.done);
  const uniqueDates = [...new Set(completions.map(c => c.date))];
  const totalDays = Math.max(uniqueDates.length, 1);
  
  // Calculate overall completion rate
  const last30Days = getLast30Days();
  const recent30DayCompletions = completions.filter(c => last30Days.includes(c.date));
  const completionRate = recent30DayCompletions.length / Math.max(last30Days.length * state.tasks.length, 1) * 100;

  // Analyze area performance
  const areaPerformance = analyzeAreaPerformance(state);
  const consistentAreas = areaPerformance.filter(a => a.rate >= 70).map(a => a.area);
  const strugglingAreas = areaPerformance.filter(a => a.rate < 40 && a.total >= 5).map(a => a.area);

  // Analyze time block performance
  const timeBlockPerformance = analyzeTimeBlockPerformance(state);
  const bestTimeBlocks = timeBlockPerformance.filter(t => t.rate >= 70).map(t => t.timeBlock);
  const worstTimeBlocks = timeBlockPerformance.filter(t => t.rate < 40 && t.total >= 5).map(t => t.timeBlock);

  // Calculate current streaks
  const streakData = calculateGlobalStreaks(state.tasks, state.completions);
  const currentStreaks: Record<string, number> = {};
  Object.entries(streakData.streaksByArea).forEach(([area, data]) => {
    currentStreaks[area] = data.currentStreak;
  });

  // Determine recent trend
  const recentCompletions = completions.filter(c => {
    const date = new Date(c.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= weekAgo;
  }).length;
  
  const previousCompletions = completions.filter(c => {
    const date = new Date(c.date);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= twoWeeksAgo && date < weekAgo;
  }).length;

  let recentTrend: 'improving' | 'stable' | 'declining' = 'stable';
  if (recentCompletions > previousCompletions * 1.2) recentTrend = 'improving';
  else if (recentCompletions < previousCompletions * 0.8) recentTrend = 'declining';

  return {
    totalDays,
    completionRate,
    consistentAreas,
    strugglingAreas,
    bestTimeBlocks,
    worstTimeBlocks,
    currentStreaks,
    recentTrend
  };
}

function generateTimingOptimizationSuggestions(state: AppState, context: SuggestionContext): Suggestion[] {
  const suggestions: Suggestion[] = [];
  
  // Suggest moving struggling tasks to better time blocks
  if (context.worstTimeBlocks.length > 0 && context.bestTimeBlocks.length > 0) {
    const strugglingTasks = state.tasks.filter(t => 
      context.worstTimeBlocks.includes(t.timeBlock) && 
      context.strugglingAreas.includes(t.area)
    );
    
    if (strugglingTasks.length > 0) {
      suggestions.push({
        id: 'timing-optimization',
        type: 'timing',
        priority: 'high',
        title: 'Reschedule Struggling Tasks',
        description: `Move ${strugglingTasks[0].title} to your most productive time`,
        emoji: '⏰',
        actionable: `Try doing ${strugglingTasks[0].title} during your ${context.bestTimeBlocks[0]} instead`,
        reasoning: `Your completion rate is ${context.worstTimeBlocks.length > 0 ? 'low' : 'higher'} during ${context.bestTimeBlocks[0]}`,
        confidence: 85,
        timeBlock: context.bestTimeBlocks[0]
      });
    }
  }

  // Suggest consolidating tasks to reduce decision fatigue
  const morningTasks = state.tasks.filter(t => t.timeBlock === 'morning').length;
  if (morningTasks >= 4) {
    suggestions.push({
      id: 'morning-consolidation',
      type: 'timing',
      priority: 'medium',
      title: 'Streamline Morning Routine',
      description: 'Group similar morning tasks together for better flow',
      emoji: '🌅',
      actionable: 'Combine your morning skincare and supplement tasks into one focused block',
      reasoning: `You have ${morningTasks} morning tasks - grouping reduces decision fatigue`,
      confidence: 70
    });
  }

  return suggestions;
}

function generateAreaFocusSuggestions(state: AppState, context: SuggestionContext): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Focus on struggling areas
  if (context.strugglingAreas.length > 0) {
    const area = context.strugglingAreas[0];
    const areaConfig = AREA_CONFIG[area];
    
    suggestions.push({
      id: `focus-${area}`,
      type: 'area_focus',
      priority: 'high',
      title: `Boost Your ${areaConfig.label}`,
      description: `Your ${areaConfig.label.toLowerCase()} consistency needs attention`,
      emoji: areaConfig.emoji,
      actionable: `Focus on just one ${areaConfig.label.toLowerCase()} task this week to build momentum`,
      reasoning: `Your ${areaConfig.label.toLowerCase()} completion rate is below 40%`,
      confidence: 80,
      area
    });
  }

  // Leverage strong areas
  if (context.consistentAreas.length > 0 && context.strugglingAreas.length > 0) {
    const strongArea = context.consistentAreas[0];
    const weakArea = context.strugglingAreas[0];
    
    suggestions.push({
      id: 'leverage-strength',
      type: 'area_focus', 
      priority: 'medium',
      title: 'Build on Your Success',
      description: `Use your ${AREA_CONFIG[strongArea].label.toLowerCase()} success to improve ${AREA_CONFIG[weakArea].label.toLowerCase()}`,
      emoji: '🚀',
      actionable: `Add a simple ${AREA_CONFIG[weakArea].label.toLowerCase()} task right after your ${AREA_CONFIG[strongArea].label.toLowerCase()} routine`,
      reasoning: `You're consistent with ${AREA_CONFIG[strongArea].label.toLowerCase()} (great!), so pair it with ${AREA_CONFIG[weakArea].label.toLowerCase()}`,
      confidence: 75
    });
  }

  return suggestions;
}

function generateHabitStackingSuggestions(state: AppState, context: SuggestionContext): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Find opportunities for habit stacking
  const consistentTasks = state.tasks.filter(t => {
    const streaks = Object.values(context.currentStreaks);
    return streaks.some(streak => streak >= 7); // Has a good streak
  });

  if (consistentTasks.length > 0 && context.strugglingAreas.length > 0) {
    const anchorTask = consistentTasks[0];
    const targetArea = context.strugglingAreas[0];
    
    suggestions.push({
      id: 'habit-stacking',
      type: 'habit_stack',
      priority: 'medium',
      title: 'Stack Your Habits',
      description: 'Attach new habits to existing strong ones',
      emoji: '🔗',
      actionable: `After you ${anchorTask.title.toLowerCase()}, immediately do one ${AREA_CONFIG[targetArea].label.toLowerCase()} task`,
      reasoning: `Your ${anchorTask.title} routine is solid - use it as an anchor for building ${AREA_CONFIG[targetArea].label.toLowerCase()} habits`,
      confidence: 70
    });
  }

  return suggestions;
}

function generateMotivationSuggestions(state: AppState, context: SuggestionContext): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Celebrate achievements
  const globalStreaks = calculateGlobalStreaks(state.tasks, state.completions);
  if (globalStreaks.overallStreak >= 7) {
    suggestions.push({
      id: 'celebrate-streak',
      type: 'motivation',
      priority: 'low',
      title: 'Celebrate Your Streak!',
      description: `You've maintained habits for ${globalStreaks.overallStreak} days straight`,
      emoji: '🎉',
      actionable: 'Reward yourself with something special - you\'ve earned it!',
      reasoning: `Celebrating milestones reinforces positive behavior`,
      confidence: 90
    });
  }

  // Address declining performance
  if (context.recentTrend === 'declining') {
    suggestions.push({
      id: 'motivation-boost',
      type: 'motivation',
      priority: 'medium',
      title: 'Get Back on Track',
      description: 'Your consistency has dipped recently - that\'s totally normal!',
      emoji: '💪',
      actionable: 'Focus on just 2-3 essential tasks this week to rebuild momentum',
      reasoning: 'Small wins help overcome temporary setbacks',
      confidence: 75
    });
  }

  return suggestions;
}

function generateScheduleOptimizationSuggestions(state: AppState, context: SuggestionContext): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Too many tasks in one time block
  const timeBlockCounts = state.tasks.reduce((acc, task) => {
    acc[task.timeBlock] = (acc[task.timeBlock] || 0) + 1;
    return acc;
  }, {} as Record<TimeBlock, number>);

  const overloadedBlocks = Object.entries(timeBlockCounts).filter(([_, count]) => count >= 4);
  if (overloadedBlocks.length > 0) {
    const [block, count] = overloadedBlocks[0];
    
    suggestions.push({
      id: 'schedule-optimization',
      type: 'schedule_optimization',
      priority: 'medium',
      title: 'Balance Your Schedule',
      description: `You have ${count} tasks scheduled for ${block} - consider spreading them out`,
      emoji: '⚖️',
      actionable: `Move 1-2 less critical ${block} tasks to a lighter time slot`,
      reasoning: 'Overloaded time blocks can lead to skipped tasks and stress',
      confidence: 65,
      timeBlock: block as TimeBlock
    });
  }

  return suggestions;
}

function getOnboardingSuggestions(state: AppState): Suggestion[] {
  return [
    {
      id: 'start-small',
      type: 'area_focus',
      priority: 'high',
      title: 'Start with 2-3 Simple Habits',
      description: 'Begin your wellness journey with manageable daily tasks',
      emoji: '🌱',
      actionable: 'Choose 1-2 areas that matter most to you and add simple daily tasks',
      reasoning: 'Starting small leads to sustainable long-term habits',
      confidence: 95
    },
    {
      id: 'morning-foundation',
      type: 'timing',
      priority: 'medium',  
      title: 'Build a Morning Foundation',
      description: 'Morning routines set the tone for successful days',
      emoji: '🌅',
      actionable: 'Add one simple morning wellness task to start your day positively',
      reasoning: 'Morning habits have the highest success and consistency rates',
      confidence: 85
    }
  ];
}

function analyzeAreaPerformance(state: AppState): Array<{area: WellnessArea, completed: number, total: number, rate: number}> {
  const areaStats: Record<WellnessArea, {completed: number, total: number}> = {} as any;
  
  // Initialize all areas
  Object.keys(AREA_CONFIG).forEach(area => {
    areaStats[area as WellnessArea] = { completed: 0, total: 0 };
  });

  // Count completions by area
  state.tasks.forEach(task => {
    const taskCompletions = state.completions.filter(c => c.taskId === task.id && c.done);
    areaStats[task.area].total += 30; // Assume 30 possible completions
    areaStats[task.area].completed += taskCompletions.length;
  });

  return Object.entries(areaStats).map(([area, stats]) => ({
    area: area as WellnessArea,
    completed: stats.completed,
    total: stats.total,
    rate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
  }));
}

function analyzeTimeBlockPerformance(state: AppState): Array<{timeBlock: TimeBlock, completed: number, total: number, rate: number}> {
  const timeStats: Record<TimeBlock, {completed: number, total: number}> = {
    morning: { completed: 0, total: 0 },
    midday: { completed: 0, total: 0 },
    afternoon: { completed: 0, total: 0 },
    evening: { completed: 0, total: 0 },
    night: { completed: 0, total: 0 }
  };

  state.tasks.forEach(task => {
    const taskCompletions = state.completions.filter(c => c.taskId === task.id && c.done);
    timeStats[task.timeBlock].total += 30; // Assume 30 possible completions
    timeStats[task.timeBlock].completed += taskCompletions.length;
  });

  return Object.entries(timeStats).map(([timeBlock, stats]) => ({
    timeBlock: timeBlock as TimeBlock,
    completed: stats.completed,
    total: stats.total,
    rate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
  }));
}

function getLast30Days(): string[] {
  const days: string[] = [];
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    days.push(date.toISOString().split('T')[0]);
  }
  
  return days;
}