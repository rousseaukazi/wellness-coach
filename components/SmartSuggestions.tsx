'use client';

import { generateSmartSuggestions, Suggestion } from '../lib/smartSuggestions';
import { AppState } from '../app/types';

interface SmartSuggestionsProps {
  state: AppState;
}

export default function SmartSuggestions({ state }: SmartSuggestionsProps) {
  const suggestions = generateSmartSuggestions(state);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-[var(--text-default)]">
          💡 Smart Suggestions
        </h3>
        <div className="text-xs text-[var(--text-muted)]">
          Personalized for you
        </div>
      </div>

      <div className="space-y-3">
        {suggestions.slice(0, 3).map((suggestion) => (
          <SuggestionCard key={suggestion.id} suggestion={suggestion} />
        ))}
      </div>

      {/* Show additional suggestions in a collapsible section */}
      {suggestions.length > 3 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-[var(--text-muted)] hover:text-[var(--text-default)] mb-3">
            Show {suggestions.length - 3} more suggestions
          </summary>
          <div className="space-y-3">
            {suggestions.slice(3).map((suggestion) => (
              <SuggestionCard key={suggestion.id} suggestion={suggestion} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const priorityColors = {
    high: 'border-red-200 bg-red-50',
    medium: 'border-orange-200 bg-orange-50', 
    low: 'border-blue-200 bg-blue-50'
  };

  const priorityBadgeColors = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-orange-100 text-orange-700',
    low: 'bg-blue-100 text-blue-700'
  };

  return (
    <div className={`p-4 rounded-xl border ${priorityColors[suggestion.priority]} transition-all hover:shadow-sm`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{suggestion.emoji}</span>
          <h4 className="font-semibold text-[var(--text-default)]">
            {suggestion.title}
          </h4>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Priority badge */}
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${priorityBadgeColors[suggestion.priority]}`}>
            {suggestion.priority}
          </div>
          
          {/* Confidence indicator */}
          <div className="text-xs text-[var(--text-muted)]">
            {suggestion.confidence}% confidence
          </div>
        </div>
      </div>

      <p className="text-sm text-[var(--text-muted)] mb-3">
        {suggestion.description}
      </p>

      {/* Actionable advice */}
      <div className="bg-white bg-opacity-60 rounded-lg p-3 mb-2">
        <div className="text-xs font-medium text-[var(--text-muted)] mb-1">
          💪 Try This:
        </div>
        <div className="text-sm text-[var(--text-default)] font-medium">
          {suggestion.actionable}
        </div>
      </div>

      {/* Reasoning */}
      <div className="text-xs text-[var(--text-muted)] italic">
        Why: {suggestion.reasoning}
      </div>

      {/* Suggestion type indicator */}
      <div className="mt-2 flex items-center justify-between">
        <div className="text-xs text-[var(--text-muted)]">
          {getSuggestionTypeLabel(suggestion.type)}
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button className="text-xs text-[var(--text-muted)] hover:text-[var(--text-default)] transition-colors">
            👍 Helpful
          </button>
          <button className="text-xs text-[var(--text-muted)] hover:text-[var(--text-default)] transition-colors">
            👎 Not for me
          </button>
        </div>
      </div>
    </div>
  );
}

function getSuggestionTypeLabel(type: Suggestion['type']): string {
  const typeLabels = {
    timing: '⏰ Timing Optimization',
    frequency: '📅 Frequency Adjustment', 
    area_focus: '🎯 Area Focus',
    habit_stack: '🔗 Habit Stacking',
    motivation: '💪 Motivation Boost',
    schedule_optimization: '⚖️ Schedule Balance'
  };
  
  return typeLabels[type] || type;
}