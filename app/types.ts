export type WellnessArea = 'exercise' | 'supplements' | 'skincare' | 'nutrition' | 'sleep' | 'meditation' | 'hydration';

export const AREA_CONFIG: Record<WellnessArea, { emoji: string; label: string; color: string }> = {
  exercise: { emoji: '🏋️', label: 'Exercise', color: 'bg-rose-100 text-rose-700' },
  supplements: { emoji: '💊', label: 'Supplements', color: 'bg-violet-100 text-violet-700' },
  skincare: { emoji: '🧴', label: 'Skincare', color: 'bg-pink-100 text-pink-700' },
  nutrition: { emoji: '🥗', label: 'Nutrition', color: 'bg-emerald-100 text-emerald-700' },
  sleep: { emoji: '😴', label: 'Sleep', color: 'bg-indigo-100 text-indigo-700' },
  meditation: { emoji: '🧘', label: 'Meditation', color: 'bg-amber-100 text-amber-700' },
  hydration: { emoji: '💧', label: 'Hydration', color: 'bg-sky-100 text-sky-700' },
};

export type TimeBlock = 'morning' | 'midday' | 'afternoon' | 'evening' | 'night';

export const TIME_BLOCKS: { key: TimeBlock; label: string; emoji: string; hours: string }[] = [
  { key: 'morning', label: 'Morning', emoji: '🌅', hours: '6am – 10am' },
  { key: 'midday', label: 'Midday', emoji: '☀️', hours: '10am – 1pm' },
  { key: 'afternoon', label: 'Afternoon', emoji: '🌤️', hours: '1pm – 5pm' },
  { key: 'evening', label: 'Evening', emoji: '🌇', hours: '5pm – 9pm' },
  { key: 'night', label: 'Night', emoji: '🌙', hours: '9pm – 12am' },
];

export type Frequency = 'daily' | 'weekdays' | 'weekends' | 'mwf' | 'tts';

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: 'Every day',
  weekdays: 'Weekdays',
  weekends: 'Weekends',
  mwf: 'Mon / Wed / Fri',
  tts: 'Tue / Thu / Sat',
};

export interface Task {
  id: string;
  title: string;
  area: WellnessArea;
  timeBlock: TimeBlock;
  frequency: Frequency;
  order: number;
}

export interface TaskCompletion {
  taskId: string;
  date: string; // YYYY-MM-DD
  done: boolean;
  feedback?: 'loved' | 'too-hard' | 'skipped' | 'no-time';
  note?: string;
}

export interface DayRating {
  date: string;
  rating: number; // 1-5
  note?: string;
}

export interface UserProfile {
  name: string;
  areas: WellnessArea[];
  goals: string[];
  constraints: string;
  onboarded: boolean;
}

export interface AppState {
  profile: UserProfile;
  tasks: Task[];
  completions: TaskCompletion[];
  ratings: DayRating[];
}

export const DEFAULT_STATE: AppState = {
  profile: { name: '', areas: [], goals: [], constraints: '', onboarded: false },
  tasks: [],
  completions: [],
  ratings: [],
};

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function isTaskActiveToday(task: Task): boolean {
  const day = new Date().getDay(); // 0=Sun
  switch (task.frequency) {
    case 'daily': return true;
    case 'weekdays': return day >= 1 && day <= 5;
    case 'weekends': return day === 0 || day === 6;
    case 'mwf': return [1, 3, 5].includes(day);
    case 'tts': return [2, 4, 6].includes(day);
  }
}
