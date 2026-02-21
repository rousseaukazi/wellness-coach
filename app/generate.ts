import { Task, WellnessArea, generateId } from './types';

type TaskTemplate = { title: string; timeBlock: Task['timeBlock']; frequency: Task['frequency'] };

const TEMPLATES: Record<WellnessArea, TaskTemplate[]> = {
  exercise: [
    { title: '30-min workout', timeBlock: 'morning', frequency: 'weekdays' },
    { title: 'Stretching & mobility', timeBlock: 'morning', frequency: 'daily' },
    { title: 'Evening walk (20 min)', timeBlock: 'evening', frequency: 'daily' },
  ],
  supplements: [
    { title: 'Vitamin D + Fish Oil', timeBlock: 'morning', frequency: 'daily' },
    { title: 'Magnesium', timeBlock: 'night', frequency: 'daily' },
    { title: 'Probiotic', timeBlock: 'morning', frequency: 'daily' },
  ],
  skincare: [
    { title: 'Cleanser + Moisturizer + SPF', timeBlock: 'morning', frequency: 'daily' },
    { title: 'Double cleanse + Serum + Night cream', timeBlock: 'night', frequency: 'daily' },
    { title: 'Exfoliate (gentle)', timeBlock: 'night', frequency: 'mwf' },
  ],
  nutrition: [
    { title: 'Protein-rich breakfast', timeBlock: 'morning', frequency: 'daily' },
    { title: 'Balanced lunch with veggies', timeBlock: 'midday', frequency: 'daily' },
    { title: 'Light, nourishing dinner', timeBlock: 'evening', frequency: 'daily' },
  ],
  sleep: [
    { title: 'Screen off 30 min before bed', timeBlock: 'night', frequency: 'daily' },
    { title: 'Wind-down routine (read / journal)', timeBlock: 'night', frequency: 'daily' },
    { title: 'Consistent bedtime by 11pm', timeBlock: 'night', frequency: 'daily' },
  ],
  meditation: [
    { title: '10-min morning meditation', timeBlock: 'morning', frequency: 'daily' },
    { title: 'Gratitude journaling (3 things)', timeBlock: 'night', frequency: 'daily' },
  ],
  hydration: [
    { title: 'Glass of water on waking', timeBlock: 'morning', frequency: 'daily' },
    { title: 'Refill water bottle', timeBlock: 'midday', frequency: 'daily' },
    { title: 'Herbal tea', timeBlock: 'evening', frequency: 'daily' },
  ],
};

export function generateRoutine(areas: WellnessArea[]): Task[] {
  let order = 0;
  const tasks: Task[] = [];
  for (const area of areas) {
    for (const t of TEMPLATES[area] || []) {
      tasks.push({ id: generateId(), title: t.title, area, timeBlock: t.timeBlock, frequency: t.frequency, order: order++ });
    }
  }
  return tasks;
}
