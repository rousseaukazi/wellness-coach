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

export interface LifeEvent {
  id: string;
  date: string;
  description: string;
  processed: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AppState {
  profile: UserProfile;
  tasks: Task[];
  completions: TaskCompletion[];
  ratings: DayRating[];
  lifeEvents: LifeEvent[];
  chatHistory: ChatMessage[];
  anthropicKey?: string;
}

export const DEFAULT_STATE: AppState = {
  profile: { name: '', areas: [], goals: [], constraints: '', onboarded: false },
  tasks: [],
  completions: [],
  ratings: [],
  lifeEvents: [],
  chatHistory: [],
};

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function isTaskActiveOnDay(task: Task, dayOfWeek: number): boolean {
  switch (task.frequency) {
    case 'daily': return true;
    case 'weekdays': return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekends': return dayOfWeek === 0 || dayOfWeek === 6;
    case 'mwf': return [1, 3, 5].includes(dayOfWeek);
    case 'tts': return [2, 4, 6].includes(dayOfWeek);
  }
}

export function isTaskActiveToday(task: Task): boolean {
  return isTaskActiveOnDay(task, new Date().getDay());
}

export function getWeekDates(): { date: Date; dateStr: string; dayOfWeek: number; label: string; isToday: boolean }[] {
  const today = new Date();
  const currentDay = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((currentDay + 6) % 7));
  
  const days = [];
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({
      date: d,
      dateStr,
      dayOfWeek: d.getDay(),
      label: dayLabels[d.getDay()],
      isToday: dateStr === todayStr(),
    });
  }
  return days;
}
