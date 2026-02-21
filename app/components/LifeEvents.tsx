'use client';

import { useState } from 'react';
import { AppState, LifeEvent, generateId, todayStr } from '../types';

interface Props {
  state: AppState;
  onUpdate: (s: AppState) => void;
  onSwitchToChat: (prefill?: string) => void;
}

const SUGGESTIONS = [
  '🤕 I got injured',
  '💊 Started a new medication',
  '🧪 Had a chemical peel',
  '🏃 Training for a race',
  '🤰 I\'m pregnant',
  '😴 Not sleeping well lately',
  '✈️ Traveling soon',
  '🥗 Changed my diet',
];

export default function LifeEvents({ state, onUpdate, onSwitchToChat }: Props) {
  const [input, setInput] = useState('');
  const [showNotification, setShowNotification] = useState(false);

  const addEvent = (description: string) => {
    if (!description.trim()) return;

    const event: LifeEvent = {
      id: generateId(),
      date: todayStr(),
      description: description.trim(),
      processed: false,
    };

    const newState = { ...state, lifeEvents: [...state.lifeEvents, event] };
    onUpdate(newState);
    setInput('');

    if (state.anthropicKey) {
      // Send to chat for AI processing
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      onSwitchToChat(`I need to update my routine — ${description.trim()}`);
    } else {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }
  };

  return (
    <div className="mb-5 fade-in">
      {/* Notification banner */}
      {showNotification && (
        <div className="bg-[var(--sage-light)] border border-[var(--sage)]/30 rounded-xl p-3 mb-3 flex items-center gap-2 fade-in">
          <span className="text-lg">✨</span>
          <p className="text-sm text-[var(--sage)]">
            {state.anthropicKey
              ? 'Opening chat to adjust your routine...'
              : 'Event saved! Add an API key in Settings to get AI-powered routine adjustments.'}
          </p>
        </div>
      )}

      {/* Input section */}
      <div className="bg-gradient-to-r from-[var(--lavender-light)] to-[#f5f0ff] rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🔄</span>
          <h3 className="text-sm font-semibold">What&apos;s changed?</h3>
        </div>
        <p className="text-xs text-[var(--text-muted)] mb-3">Life events can affect your routine. Let us know!</p>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addEvent(input); }}
            placeholder="e.g. I started a new medication..."
            className="flex-1 px-3 py-2.5 rounded-xl bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--lavender)]/50"
          />
          <button
            onClick={() => addEvent(input)}
            disabled={!input.trim()}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium ${
              input.trim() ? 'bg-[var(--lavender)] text-white' : 'bg-white/50 text-gray-300'
            }`}
          >
            Share
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.slice(0, 4).map(s => (
            <button key={s} onClick={() => addEvent(s)}
              className="px-2.5 py-1 rounded-full bg-white/70 text-[10px] font-medium text-[var(--text-muted)] hover:bg-white transition-all">
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Recent events */}
      {state.lifeEvents.length > 0 && (
        <div className="mt-3 space-y-1">
          {state.lifeEvents.slice(-3).reverse().map(event => (
            <div key={event.id} className="flex items-center gap-2 px-3 py-2 bg-white/60 rounded-xl">
              <span className="text-xs">📌</span>
              <span className="text-xs text-[var(--text-muted)] flex-1">{event.description}</span>
              <span className="text-[10px] text-gray-300">{event.date}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
