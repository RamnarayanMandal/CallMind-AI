"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDemoSocket } from '@/hooks/useDemoSocket';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { VoiceVisualizer } from '@/components/demo/VoiceVisualizer';
import { DemoControls } from '@/components/demo/DemoControls';
import { RealtimeTranscript } from '@/components/demo/RealtimeTranscript';
import { toast } from 'sonner';

export default function AgentDemoPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;
  const [mounted, setMounted] = useState(false);

  const {
    isConnected,
    isSessionActive,
    status,
    transcripts,
    error,
    startDemo,
    stopDemo,
    sendAudio
  } = useDemoSocket(agentId);

  const {
    isRecording,
    startRecording,
    stopRecording
  } = useVoiceRecorder((audioBuffer) => {
    if (isConnected && status !== 'speaking') {
      sendAudio(audioBuffer);
    } else if (status === 'speaking') {
      toast.warning("Recording ignored because AI is speaking.");
    }
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  if (!mounted) return null;

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] p-4 md:p-8 bg-slate-950">
      <div className="max-w-6xl w-full mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              className="text-slate-400 hover:text-white hover:bg-slate-800"
              onClick={() => router.back()}
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Real-time AI Demo
            </h1>
          </div>
          
          <div className="flex items-center space-x-2 text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full text-sm font-medium border border-amber-500/20">
            <ShieldAlert className="w-4 h-4" />
            <span className="hidden sm:inline">Browser Preview Mode</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Visualizer & Controls */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-2">Agent Interactive Preview</h2>
              <p className="text-slate-400 text-sm mb-6">
                Test your AI agent's voice, personality, and response latency directly in your browser before deploying to phone numbers.
              </p>
              
              <VoiceVisualizer 
                status={status} 
                isRecording={isRecording} 
              />
            </div>
            
            <DemoControls
              isConnected={isConnected}
              isSessionActive={isSessionActive}
              isRecording={isRecording}
              status={status}
              onStartDemo={startDemo}
              onStopDemo={stopDemo}
              onStartRecording={startRecording}
              onStopRecording={stopRecording}
            />
          </div>
          
          {/* Right Column: Transcript */}
          <div className="lg:col-span-7 h-[600px]">
            <RealtimeTranscript transcripts={transcripts} />
          </div>
          
        </div>
      </div>
    </div>
  );
}
