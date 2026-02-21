'use client';

import { useState } from 'react';
import { AppState, WellnessArea, AREA_CONFIG } from '../types';
import { generateRoutine } from '../generate';

const GOALS = [
  'Feel more energized', 'Clear skin', 'Better sleep', 'Lose weight',
  'Build strength', 'Reduce stress', 'Eat healthier', 'Stay hydrated',
  'Build a routine', 'Feel happier',
];

interface Props { state: AppState; onUpdate: (s: AppState) => void; }

export default function Onboarding({ state, onUpdate }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [areas, setAreas] = useState<WellnessArea[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [constraints, setConstraints] = useState('');

  const toggleArea = (a: WellnessArea) =>
    setAreas(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const toggleGoal = (g: string) =>
    setGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  const finish = () => {
    const tasks = generateRoutine(areas);
    onUpdate({
      ...state,
      profile: { name, areas, goals, constraints, onboarded: true },
      tasks,
    });
  };

  const canNext = () => {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) return areas.length > 0;
    if (step === 2) return goals.length > 0;
    return true;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md slide-up">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {[0,1,2,3].map(i => (
            <div key={i} className={`h-2 rounded-full transition-all duration-300 ${
              i === step ? 'w-8 bg-[#8fbc8f]' : i < step ? 'w-2 bg-[#8fbc8f]/50' : 'w-2 bg-gray-200'
            }`} />
          ))}
        </div>

        {step === 0 && (
          <div className="fade-in text-center">
            <div className="text-5xl mb-4">🌸</div>
            <h1 className="text-3xl font-bold mb-2">Welcome to Bloom</h1>
            <p className="text-[var(--text-muted)] mb-8">Your personal wellness coach.<br />Let&apos;s build your perfect routine.</p>
            <input
              type="text"
              placeholder="What's your name?"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-white border border-gray-100 text-center text-lg focus:outline-none focus:ring-2 focus:ring-[#8fbc8f]/50 shadow-sm"
              autoFocus
            />
          </div>
        )}

        {step === 1 && (
          <div className="fade-in">
            <h2 className="text-2xl font-bold text-center mb-2">What matters to you?</h2>
            <p className="text-[var(--text-muted)] text-center mb-6">Pick the areas you want to focus on</p>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(AREA_CONFIG) as [WellnessArea, typeof AREA_CONFIG[WellnessArea]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => toggleArea(key)}
                  className={`p-4 rounded-2xl border-2 transition-all text-left ${
                    areas.includes(key)
                      ? 'border-[#8fbc8f] bg-[#e8f0e8] shadow-md scale-[1.02]'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <span className="text-2xl">{cfg.emoji}</span>
                  <div className="text-sm font-medium mt-1">{cfg.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="fade-in">
            <h2 className="text-2xl font-bold text-center mb-2">What are your goals?</h2>
            <p className="text-[var(--text-muted)] text-center mb-6">Select all that resonate</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {GOALS.map(g => (
                <button
                  key={g}
                  onClick={() => toggleGoal(g)}
                  className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                    goals.includes(g)
                      ? 'bg-[#c4b5e0] text-white shadow-md'
                      : 'bg-white border border-gray-100 text-gray-600 hover:border-gray-200'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="fade-in text-center">
            <div className="text-5xl mb-4">✨</div>
            <h2 className="text-2xl font-bold mb-2">Almost done!</h2>
            <p className="text-[var(--text-muted)] mb-6">Any constraints we should know about?</p>
            <textarea
              placeholder="e.g. allergies, injuries, limited time..."
              value={constraints}
              onChange={e => setConstraints(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-white border border-gray-100 text-base focus:outline-none focus:ring-2 focus:ring-[#8fbc8f]/50 shadow-sm resize-none h-28"
            />
            <p className="text-xs text-[var(--text-muted)] mt-3">Optional — skip if none</p>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="px-6 py-3.5 rounded-2xl bg-white border border-gray-100 text-gray-500 font-medium"
            >
              Back
            </button>
          )}
          <button
            onClick={() => step < 3 ? setStep(s => s + 1) : finish()}
            disabled={!canNext()}
            className={`flex-1 py-3.5 rounded-2xl font-semibold text-white transition-all ${
              canNext()
                ? 'bg-[#8fbc8f] hover:bg-[#7dab7d] shadow-lg shadow-[#8fbc8f]/30'
                : 'bg-gray-200 cursor-not-allowed'
            }`}
          >
            {step < 3 ? 'Continue' : 'Start Blooming 🌸'}
          </button>
        </div>
      </div>
    </div>
  );
}
