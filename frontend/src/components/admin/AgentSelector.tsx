'use client';

import { Bot, Loader2 } from 'lucide-react';

interface AgentOption {
  _id: string;
  name: string;
  language: string;
  isActive: boolean;
}

interface AgentSelectorProps {
  agents: AgentOption[];
  loading?: boolean;
  value?: string;
  onChange: (agentId: string) => void;
  disabled?: boolean;
}

export function AgentSelector({ agents, loading, value, onChange, disabled }: AgentSelectorProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading agents...
      </div>
    );
  }

  return (
    <div className="relative">
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 appearance-none cursor-pointer"
      >
        <option value="" className="text-slate-400">Select an AI agent...</option>
        {agents.map((agent) => (
          <option key={agent._id} value={agent._id} className="text-white">
            {agent.name} ({agent.language}) - {agent.isActive ? 'Active' : 'Inactive'}
          </option>
        ))}
      </select>
      {!value && (
        <Bot className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
      )}
    </div>
  );
}
