'use client';

import { useState } from 'react';
import { AppState, WellnessArea, AREA_CONFIG } from '../types';

interface Props { state: AppState; onUpdate: (s: AppState) => void; }

export default function Settings({ state, onUpdate }: Props) {
  const [name, setName] = useState(state.profile.name);
  const [areas, setAreas] = useState<WellnessArea[]>(state.profile.areas);
  const [goals, setGoals] = useState(state.profile.goals.join(', '));
  const [constraints, setConstraints] = useState(state.profile.constraints);
  const [saved, setSaved] = useState(false);

  const toggleArea = (a: WellnessArea) =>
    setAreas(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const save = () => {
    onUpdate({
      ...state,
      profile: {
        ...state.profile,
        name, areas,
        goals: goals.split(',').map(g => g.trim()).filter(Boolean),
        constraints,
      },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const resetAll = () => {
    if (confirm('This will erase all your data and start fresh. Are you sure?')) {
      localStorage.removeItem('bloom-wellness-state');
      window.location.reload();
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <h1 className="text-2xl font-bold mb-6">Settings ⚙️</h1>

      <div className="space-y-5">
        <div>
          <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-100 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-[#8fbc8f]/50" />
        </div>

        <div>
          <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Wellness Areas</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {(Object.entries(AREA_CONFIG) as [WellnessArea, typeof AREA_CONFIG[WellnessArea]][]).map(([key, cfg]) => (
              <button key={key} onClick={() => toggleArea(key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  areas.includes(key) ? 'bg-[#e8f0e8] border-2 border-[#8fbc8f]' : 'bg-gray-50 border-2 border-transparent'
                }`}>
                {cfg.emoji} {cfg.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Goals</label>
          <input type="text" value={goals} onChange={e => setGoals(e.target.value)}
            placeholder="Comma-separated goals"
            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-100 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-[#8fbc8f]/50" />
        </div>

        <div>
          <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Constraints</label>
          <textarea value={constraints} onChange={e => setConstraints(e.target.value)}
            placeholder="Allergies, injuries, time limits..."
            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-100 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-[#8fbc8f]/50 resize-none h-20" />
        </div>

        <button onClick={save}
          className="w-full py-3 rounded-xl bg-[#8fbc8f] text-white font-semibold shadow-lg shadow-[#8fbc8f]/30">
          {saved ? '✓ Saved!' : 'Save Changes'}
        </button>

        <div className="pt-4 border-t border-gray-100">
          <h3 className="text-sm font-medium mb-3">Data</h3>
          <div className="flex gap-3 text-sm">
            <div className="bg-gray-50 rounded-xl p-3 flex-1 text-center">
              <div className="text-lg font-bold">{state.tasks.length}</div>
              <div className="text-[var(--text-muted)] text-xs">Tasks</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 flex-1 text-center">
              <div className="text-lg font-bold">{state.completions.filter(c => c.done).length}</div>
              <div className="text-[var(--text-muted)] text-xs">Completions</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 flex-1 text-center">
              <div className="text-lg font-bold">{state.ratings.length}</div>
              <div className="text-[var(--text-muted)] text-xs">Days Rated</div>
            </div>
          </div>
        </div>

        <button onClick={resetAll}
          className="w-full py-3 rounded-xl border-2 border-red-200 text-red-400 font-medium hover:bg-red-50 transition-all">
          Reset Everything
        </button>
      </div>
    </div>
  );
}
