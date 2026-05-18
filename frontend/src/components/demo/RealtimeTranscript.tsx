import React, { useEffect, useRef } from 'react';
import { TranscriptEntry } from '@/hooks/useDemoSocket';
import { Bot, User } from 'lucide-react';

interface RealtimeTranscriptProps {
  transcripts: TranscriptEntry[];
}

export const RealtimeTranscript: React.FC<RealtimeTranscriptProps> = ({ transcripts }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  if (transcripts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-900 rounded-xl border border-slate-800">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <Bot className="w-8 h-8 text-slate-500" />
        </div>
        <h4 className="text-slate-300 font-medium mb-2">No Conversation Yet</h4>
        <p className="text-slate-500 text-sm max-w-sm">
          Start the demo and speak into your microphone to see the real-time transcript here.
        </p>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col h-[500px] overflow-y-auto p-6 bg-slate-900 rounded-xl border border-slate-800 space-y-6 scroll-smooth"
      ref={scrollRef}
    >
      {transcripts.map((entry) => (
        <div 
          key={entry.id} 
          className="flex flex-col mb-6 animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-md">
              [{entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]
            </span>
            <span className={`text-sm font-bold ${entry.role === 'agent' ? 'text-purple-400' : 'text-blue-400'}`}>
              {entry.role === 'agent' ? 'AI Agent' : 'User'}
            </span>
          </div>
          <div className="pl-[4.5rem]">
            <p className="text-slate-300 leading-relaxed font-medium">
              {entry.text}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
