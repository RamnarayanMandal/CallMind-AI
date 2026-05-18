import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Play, Square, RefreshCw } from 'lucide-react';

interface DemoControlsProps {
  isConnected: boolean;
  isSessionActive: boolean;
  isRecording: boolean;
  status: string;
  onStartDemo: () => void;
  onStopDemo: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export const DemoControls: React.FC<DemoControlsProps> = ({
  isConnected,
  isSessionActive,
  isRecording,
  status,
  onStartDemo,
  onStopDemo,
  onStartRecording,
  onStopRecording
}) => {
  return (
    <div className="flex flex-col items-center p-6 bg-slate-900 rounded-xl border border-slate-800 shadow-md w-full">
      <div className="flex flex-wrap gap-4 justify-center">
        {!isSessionActive ? (
          <Button 
            onClick={onStartDemo} 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8"
            disabled={!isConnected}
          >
            <Play className="w-4 h-4 mr-2" />
            {isConnected ? "Start Demo Session" : "Connecting..."}
          </Button>
        ) : (
          <>
            <Button 
              onClick={onStopDemo} 
              variant="destructive" 
              size="lg"
            >
              <Square className="w-4 h-4 mr-2" />
              End Session
            </Button>
            
            <Button
              onClick={isRecording ? onStopRecording : onStartRecording}
              variant={isRecording ? "secondary" : "default"}
              size="lg"
              className={isRecording ? "bg-red-500 hover:bg-red-600 text-white" : "bg-emerald-500 hover:bg-emerald-600"}
              disabled={status !== 'idle' && status !== 'listening'}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-4 h-4 mr-2" />
                  Stop Recording & Send
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  Hold to Speak
                </>
              )}
            </Button>
          </>
        )}
      </div>
      
      {isConnected && (
        <div className="mt-4 text-xs text-slate-400 flex items-center">
          <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
          Connected to AI WebSocket
        </div>
      )}
    </div>
  );
};
