import { useState, useEffect, useCallback, useRef } from 'react';
import { demoSocketService } from '@/lib/socket';

export interface TranscriptEntry {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

export function useDemoSocket(agentId: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    const socket = demoSocketService.connect();

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setIsSessionActive(false);
      setStatus('idle');
    });

    socket.on('demo-started', (data) => {
      console.log('Demo started:', data);
      setIsSessionActive(true);
    });

    socket.on('processing-status', (data: { status: any }) => {
      setStatus(data.status);
    });

    socket.on('transcript', (data: { role: 'user' | 'agent', text: string }) => {
      setTranscripts(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        role: data.role,
        text: data.text,
        timestamp: new Date()
      }]);
    });

    socket.on('error', (data: { message: string }) => {
      setError(data.message);
      setStatus('idle');
      setIsSessionActive(false);
    });

    socket.on('audio-response', (audioBuffer: ArrayBuffer) => {
      if (!audioRef.current) return;
      
      const blob = new Blob([audioBuffer], { type: 'audio/mp3' }); // usually TTS is mp3 or wav
      const url = URL.createObjectURL(blob);
      
      audioRef.current.src = url;
      audioRef.current.onended = () => {
        URL.revokeObjectURL(url);
        setStatus('idle');
      };
      
      audioRef.current.play().catch(e => console.error("Error playing audio. Autoplay might be blocked.", e));
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('demo-started');
      socket.off('processing-status');
      socket.off('transcript');
      socket.off('audio-response');
      socket.off('error');
    };
  }, []);

  const startDemo = useCallback(() => {
    // Unlock audio context on user interaction
    if (audioRef.current) {
      audioRef.current.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU5LjI3LjEwMAAAAAAAAAAAAAAA//MUxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq';
      audioRef.current.play().catch(() => {});
    }

    const socket = demoSocketService.getSocket();
    if (socket) {
      socket.emit('start-demo', { agentId });
      setTranscripts([]);
      setError(null);
    }
  }, [agentId]);

  const stopDemo = useCallback(() => {
    const socket = demoSocketService.getSocket();
    if (socket) {
      socket.emit('stop-demo');
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setIsSessionActive(false);
    setStatus('idle');
  }, []);

  const sendAudio = useCallback((audioData: ArrayBuffer) => {
    const socket = demoSocketService.getSocket();
    if (socket && isConnected) {
      socket.emit('audio-stream', audioData);
    }
  }, [isConnected]);

  return {
    isConnected,
    isSessionActive,
    status,
    transcripts,
    error,
    startDemo,
    stopDemo,
    sendAudio
  };
}
