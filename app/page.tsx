'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppState, DEFAULT_STATE } from './types';
import { loadState, saveState } from './store';
import Onboarding from './components/Onboarding';
import DailyView from './components/DailyView';
import RoutineEditor from './components/RoutineEditor';
import Settings from './components/Settings';

type View = 'daily' | 'editor' | 'settings';

export default function Home() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<View>('daily');

  useEffect(() => {
    setState(loadState());
    setLoaded(true);
  }, []);

  const update = useCallback((next: AppState) => {
    setState(next);
    saveState(next);
  }, []);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center fade-in">
          <div className="text-4xl mb-3">🌸</div>
          <div className="text-lg font-medium text-[var(--text-muted)]">Loading Bloom...</div>
        </div>
      </div>
    );
  }

  if (!state.profile.onboarded) {
    return <Onboarding state={state} onUpdate={update} />;
  }

  return (
    <div className="min-h-screen pb-20">
      {view === 'daily' && <DailyView state={state} onUpdate={update} />}
      {view === 'editor' && <RoutineEditor state={state} onUpdate={update} />}
      {view === 'settings' && <Settings state={state} onUpdate={update} />}

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 z-50">
        <div className="max-w-lg mx-auto flex justify-around py-2">
          {([
            { key: 'daily', emoji: '🌸', label: 'Today' },
            { key: 'editor', emoji: '✏️', label: 'Routine' },
            { key: 'settings', emoji: '⚙️', label: 'Settings' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className={`flex flex-col items-center py-1 px-4 rounded-xl transition-all ${
                view === tab.key ? 'text-[#6b8f6b] scale-105' : 'text-gray-400'
              }`}
            >
              <span className="text-xl">{tab.emoji}</span>
              <span className="text-[11px] font-medium mt-0.5">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
