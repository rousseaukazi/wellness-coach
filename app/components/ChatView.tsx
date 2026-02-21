'use client';

import { useState, useRef, useEffect } from 'react';
import { AppState, ChatMessage, generateId, AREA_CONFIG } from '../types';

interface Props { state: AppState; onUpdate: (s: AppState) => void; prefill?: string; onClearPrefill?: () => void; }

function buildSystemPrompt(state: AppState): string {
  const { profile, tasks, lifeEvents, completions } = state;
  const recentCompletions = completions.slice(-50);
  const taskList = tasks.map(t => `- ${t.title} (${AREA_CONFIG[t.area].label}, ${t.timeBlock}, ${t.frequency})`).join('\n');
  const eventList = lifeEvents.length > 0
    ? lifeEvents.map(e => `- [${e.date}] ${e.description}`).join('\n')
    : 'None yet';

  return `You are Bloom, a warm, knowledgeable, and supportive wellness coach. You know this person well and genuinely care about their wellbeing.

## About ${profile.name}
- **Wellness areas:** ${profile.areas.map(a => AREA_CONFIG[a].label).join(', ')}
- **Goals:** ${profile.goals.join(', ')}
- **Constraints:** ${profile.constraints || 'None mentioned'}

## Current Routine
${taskList || 'No tasks yet'}

## Recent Life Events
${eventList}

## Recent Task Completions
${recentCompletions.length} completions logged. ${recentCompletions.filter(c => c.feedback === 'too-hard').length} marked as "too hard", ${recentCompletions.filter(c => c.feedback === 'loved').length} marked as "loved it".

## Your Personality
- Warm, encouraging, never judgmental
- Explain the WHY behind every recommendation (science-backed when possible)
- Be specific and actionable, not vague
- If they mention a life event (injury, pregnancy, new medication, skin procedure, etc.), acknowledge it seriously and explain how it affects their routine
- You can suggest adding, removing, or modifying tasks. When you do, format suggestions clearly
- Keep responses concise but caring — like a knowledgeable friend, not a textbook
- Use emoji naturally but don't overdo it

## Routine Modification Format
When suggesting routine changes, include a JSON block that the app can parse:
\`\`\`routine-update
{"add": [{"title": "...", "area": "skincare|exercise|...", "timeBlock": "morning|midday|afternoon|evening|night", "frequency": "daily|weekdays|weekends|mwf|tts"}], "remove": ["task title to remove"], "modify": [{"title": "existing task title", "changes": {"frequency": "...", "timeBlock": "..."}}]}
\`\`\`
Only include this block when you're actually suggesting changes. The user will be asked to confirm.`;
}

async function callClaude(messages: { role: string; content: string }[], systemPrompt: string, apiKey: string): Promise<string> {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`API error ${resp.status}: ${err}`);
  }

  const data = await resp.json();
  return data.content[0]?.text || 'Sorry, I couldn\'t generate a response.';
}

export default function ChatView({ state, onUpdate, prefill, onClearPrefill }: Props) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const hasKey = !!state.anthropicKey;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.chatHistory, loading]);

  useEffect(() => {
    if (prefill && hasKey && !loading) {
      setInput(prefill);
      onClearPrefill?.();
      // Auto-send after a brief delay
      setTimeout(() => {
        const fakeInput = prefill;
        setInput('');
        // Trigger send manually
        const userMsg: ChatMessage = {
          id: generateId(),
          role: 'user',
          content: fakeInput,
          timestamp: Date.now(),
        };
        const newHistory = [...state.chatHistory, userMsg];
        onUpdate({ ...state, chatHistory: newHistory });
        setLoading(true);
        callClaude(
          newHistory.slice(-20).map(m => ({ role: m.role, content: m.content })),
          buildSystemPrompt(state),
          state.anthropicKey!
        ).then(response => {
          const assistantMsg: ChatMessage = { id: generateId(), role: 'assistant', content: response, timestamp: Date.now() };
          const updateMatch = response.match(/```routine-update\n([\s\S]*?)\n```/);
          if (updateMatch) setPendingUpdate(updateMatch[1]);
          onUpdate({ ...state, chatHistory: [...newHistory, assistantMsg] });
        }).catch(err => {
          const errorMsg: ChatMessage = { id: generateId(), role: 'assistant', content: `Error: ${err.message}`, timestamp: Date.now() };
          onUpdate({ ...state, chatHistory: [...newHistory, errorMsg] });
        }).finally(() => setLoading(false));
      }, 300);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  const sendMessage = async () => {
    if (!input.trim() || !state.anthropicKey || loading) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    const newHistory = [...state.chatHistory, userMsg];
    onUpdate({ ...state, chatHistory: newHistory });
    setInput('');
    setLoading(true);

    try {
      const apiMessages = newHistory.slice(-20).map(m => ({ role: m.role, content: m.content }));
      const response = await callClaude(apiMessages, buildSystemPrompt(state), state.anthropicKey);

      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };

      // Check for routine updates
      const updateMatch = response.match(/```routine-update\n([\s\S]*?)\n```/);
      if (updateMatch) {
        setPendingUpdate(updateMatch[1]);
      }

      onUpdate({ ...state, chatHistory: [...newHistory, assistantMsg] });
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: `I'm having trouble connecting right now. ${err instanceof Error ? err.message : 'Please check your API key in Settings.'}`,
        timestamp: Date.now(),
      };
      onUpdate({ ...state, chatHistory: [...newHistory, errorMsg] });
    } finally {
      setLoading(false);
    }
  };

  const applyRoutineUpdate = () => {
    if (!pendingUpdate) return;
    try {
      const update = JSON.parse(pendingUpdate);
      let tasks = [...state.tasks];

      if (update.remove) {
        tasks = tasks.filter(t => !update.remove.some((r: string) => t.title.toLowerCase().includes(r.toLowerCase())));
      }

      if (update.add) {
        for (const add of update.add) {
          tasks.push({
            id: generateId(),
            title: add.title,
            area: add.area,
            timeBlock: add.timeBlock || 'morning',
            frequency: add.frequency || 'daily',
            order: tasks.length,
          });
        }
      }

      if (update.modify) {
        for (const mod of update.modify) {
          const idx = tasks.findIndex(t => t.title.toLowerCase().includes(mod.title.toLowerCase()));
          if (idx >= 0) {
            tasks[idx] = { ...tasks[idx], ...mod.changes };
          }
        }
      }

      onUpdate({ ...state, tasks });
      setPendingUpdate(null);
    } catch {
      setPendingUpdate(null);
    }
  };

  const formatMessage = (content: string) => {
    // Remove routine-update blocks from display
    return content.replace(/```routine-update\n[\s\S]*?\n```/g, '').trim();
  };

  if (!hasKey) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 text-center">
        <div className="text-5xl mb-4">💬</div>
        <h2 className="text-xl font-bold mb-2">AI Wellness Coach</h2>
        <p className="text-[var(--text-muted)] mb-4">
          To chat with your AI wellness coach, add your Anthropic API key in Settings.
        </p>
        <div className="bg-[var(--lavender-light)] rounded-2xl p-4 text-sm text-left">
          <p className="font-medium mb-1">What you can do:</p>
          <ul className="space-y-1 text-[var(--text-muted)]">
            <li>• Ask why a task was recommended</li>
            <li>• Get personalized supplement advice</li>
            <li>• Report life events that affect your routine</li>
            <li>• Ask for routine adjustments</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold">Chat with Bloom 💬</h1>
        <p className="text-xs text-[var(--text-muted)]">Your AI wellness coach</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {state.chatHistory.length === 0 && (
          <div className="text-center py-8 fade-in">
            <div className="text-4xl mb-3">🌸</div>
            <p className="text-[var(--text-muted)] text-sm">
              Hi {state.profile.name}! Ask me anything about your wellness routine.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {['Why was retinol recommended?', 'Help me sleep better', 'What supplements for energy?'].map(q => (
                <button key={q} onClick={() => { setInput(q); }}
                  className="px-3 py-2 rounded-xl bg-[var(--sage-light)] text-sm text-[var(--sage)] font-medium">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {state.chatHistory.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} fade-in`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-[var(--sage)] text-white rounded-br-md'
                : 'bg-white shadow-sm border border-gray-50 rounded-bl-md'
            }`}>
              {formatMessage(msg.content)}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start fade-in">
            <div className="bg-white shadow-sm border border-gray-50 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {pendingUpdate && (
          <div className="bg-[var(--lavender-light)] rounded-2xl p-4 fade-in">
            <p className="text-sm font-medium mb-2">✨ Routine update suggested</p>
            <div className="flex gap-2">
              <button onClick={applyRoutineUpdate}
                className="flex-1 py-2 rounded-xl bg-[var(--sage)] text-white text-sm font-medium">
                Apply Changes
              </button>
              <button onClick={() => setPendingUpdate(null)}
                className="px-4 py-2 rounded-xl bg-white text-sm font-medium">
                Skip
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 bg-[var(--bg)]">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask your wellness coach..."
            rows={1}
            className="flex-1 px-4 py-3 rounded-2xl bg-white border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--sage)]/50 resize-none"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              input.trim() && !loading ? 'bg-[var(--sage)] text-white' : 'bg-gray-100 text-gray-300'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
