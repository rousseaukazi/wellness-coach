'use client';

import { AppState, Task, TaskCompletion, generateId, todayStr, isTaskActiveToday, AREA_CONFIG } from '../app/types';

interface QuickActionsProps {
  state: AppState;
  onUpdate: (state: AppState) => void;
}

interface QuickAction {
  id: string;
  title: string;
  emoji: string;
  description: string;
  taskIds: string[];
  color: string;
  bgColor: string;
}

export default function QuickActions({ state, onUpdate }: QuickActionsProps) {
  const today = todayStr();
  const todayCompletions = state.completions.filter(c => c.date === today);
  const activeTasks = state.tasks.filter(isTaskActiveToday);

  // Generate smart quick actions based on user's routine
  const quickActions = generateQuickActions(state.tasks, todayCompletions);

  const handleQuickAction = (action: QuickAction) => {
    const newCompletions = [...state.completions];
    let completedCount = 0;

    action.taskIds.forEach(taskId => {
      const existingCompletion = todayCompletions.find(c => c.taskId === taskId);
      
      if (!existingCompletion) {
        newCompletions.push({
          taskId,
          date: today,
          done: true,
          feedback: 'loved', // Default to positive feedback for quick actions
          note: `Completed via "${action.title}" quick action`
        });
        completedCount++;
      }
    });

    if (completedCount > 0) {
      onUpdate({
        ...state,
        completions: newCompletions
      });
    }
  };

  const getActionStatus = (action: QuickAction): 'completed' | 'partial' | 'pending' => {
    const completedTasks = action.taskIds.filter(taskId =>
      todayCompletions.some(c => c.taskId === taskId && c.done)
    );
    
    if (completedTasks.length === action.taskIds.length) return 'completed';
    if (completedTasks.length > 0) return 'partial';
    return 'pending';
  };

  if (quickActions.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-[var(--text-default)]">
          ⚡ Quick Actions
        </h3>
        <div className="text-xs text-[var(--text-muted)]">
          Tap to complete multiple tasks
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {quickActions.map(action => {
          const status = getActionStatus(action);
          const isCompleted = status === 'completed';
          const isPartial = status === 'partial';
          
          return (
            <button
              key={action.id}
              onClick={() => !isCompleted && handleQuickAction(action)}
              disabled={isCompleted}
              className={`
                relative p-4 rounded-2xl text-left transition-all duration-200
                ${isCompleted 
                  ? 'bg-[var(--accent-bg)] border-2 border-[var(--accent-border)] cursor-default' 
                  : `${action.bgColor} border-2 border-transparent hover:border-[var(--accent-border)] active:scale-95 cursor-pointer`
                }
              `}
            >
              {/* Status indicator */}
              <div className="absolute top-2 right-2">
                {isCompleted ? (
                  <div className="w-6 h-6 bg-[var(--accent)] rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : isPartial ? (
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                ) : (
                  <div className="w-6 h-6 border-2 border-[var(--text-muted)] rounded-full opacity-30"></div>
                )}
              </div>

              {/* Action content */}
              <div className="pr-8">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{action.emoji}</span>
                  <span className={`font-semibold ${action.color}`}>
                    {action.title}
                  </span>
                </div>
                
                <p className="text-sm text-[var(--text-muted)] mb-2 leading-snug">
                  {action.description}
                </p>

                {/* Task count */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)]">
                    {action.taskIds.length} task{action.taskIds.length !== 1 ? 's' : ''}
                  </span>
                  
                  {!isCompleted && (
                    <div className={`px-2 py-1 rounded-full ${action.color} bg-opacity-20 font-medium`}>
                      Tap to complete
                    </div>
                  )}
                  
                  {isCompleted && (
                    <div className="px-2 py-1 rounded-full bg-[var(--accent-bg)] text-[var(--accent)] font-medium">
                      Done! 🎉
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Progress summary */}
      <div className="mt-4 p-3 bg-[var(--surface-secondary)] rounded-xl">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--text-muted)]">
            Quick action progress today
          </span>
          <span className="font-medium text-[var(--text-default)]">
            {quickActions.filter(a => getActionStatus(a) === 'completed').length} / {quickActions.length} completed
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="mt-2 w-full bg-[var(--border)] rounded-full h-2">
          <div 
            className="bg-[var(--accent)] h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${(quickActions.filter(a => getActionStatus(a) === 'completed').length / quickActions.length) * 100}%` 
            }}
          />
        </div>
      </div>
    </div>
  );
}

function generateQuickActions(tasks: Task[], todayCompletions: TaskCompletion[]): QuickAction[] {
  const actions: QuickAction[] = [];
  
  // Group tasks by time block and area for smart grouping
  const morningTasks = tasks.filter(t => t.timeBlock === 'morning' && isTaskActiveToday(t));
  const exerciseTasks = tasks.filter(t => t.area === 'exercise' && isTaskActiveToday(t));
  const supplementTasks = tasks.filter(t => t.area === 'supplements' && isTaskActiveToday(t));
  const skincareTasks = tasks.filter(t => t.area === 'skincare' && isTaskActiveToday(t));
  const eveningTasks = tasks.filter(t => t.timeBlock === 'evening' && isTaskActiveToday(t));

  // Morning routine action
  if (morningTasks.length >= 2) {
    actions.push({
      id: 'morning-routine',
      title: 'Morning Routine',
      emoji: '🌅',
      description: 'Complete your morning wellness tasks to start the day right',
      taskIds: morningTasks.map(t => t.id),
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    });
  }

  // Workout action
  if (exerciseTasks.length >= 1) {
    actions.push({
      id: 'workout',
      title: 'Workout Done',
      emoji: '💪',
      description: 'Mark your exercise and fitness activities as complete',
      taskIds: exerciseTasks.map(t => t.id),
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    });
  }

  // Supplements action  
  if (supplementTasks.length >= 2) {
    actions.push({
      id: 'supplements',
      title: 'Supplements Taken',
      emoji: '💊',
      description: 'All vitamins and supplements for today',
      taskIds: supplementTasks.map(t => t.id),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    });
  }

  // Skincare routine action
  if (skincareTasks.length >= 2) {
    actions.push({
      id: 'skincare',
      title: 'Skincare Routine',
      emoji: '✨',
      description: 'Complete your skincare regimen',
      taskIds: skincareTasks.map(t => t.id),
      color: 'text-pink-600',
      bgColor: 'bg-pink-50'
    });
  }

  // Evening routine action
  if (eveningTasks.length >= 2) {
    actions.push({
      id: 'evening-routine',
      title: 'Evening Routine',
      emoji: '🌙',
      description: 'Wind down with your evening wellness routine',
      taskIds: eveningTasks.map(t => t.id),
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    });
  }

  // Self-care Sunday (weekends)
  const today = new Date();
  if (today.getDay() === 0 || today.getDay() === 6) {
    const selfCareTasks = tasks.filter(t => 
      ['skincare', 'meditation', 'supplements'].includes(t.area) && isTaskActiveToday(t)
    );
    
    if (selfCareTasks.length >= 2) {
      actions.push({
        id: 'self-care',
        title: 'Self-Care Time',
        emoji: '🛁',
        description: 'Take time for yourself this weekend',
        taskIds: selfCareTasks.map(t => t.id),
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50'
      });
    }
  }

  // Filter out actions where all tasks are already completed
  const activeActions = actions.filter(action => {
    const allCompleted = action.taskIds.every(taskId =>
      todayCompletions.some(c => c.taskId === taskId && c.done)
    );
    return !allCompleted;
  });

  return activeActions.slice(0, 4); // Limit to 4 actions to avoid overwhelm
}