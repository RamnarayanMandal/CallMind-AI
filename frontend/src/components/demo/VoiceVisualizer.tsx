import React from 'react';
import { motion } from 'framer-motion';

interface VoiceVisualizerProps {
  status: 'idle' | 'listening' | 'thinking' | 'speaking';
  isRecording: boolean;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ status, isRecording }) => {
  const getVariants = () => {
    switch (status) {
      case 'listening':
        return {
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
          transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
        };
      case 'thinking':
        return {
          rotate: [0, 360],
          borderRadius: ["20%", "50%", "20%"],
          transition: { repeat: Infinity, duration: 2, ease: "linear" }
        };
      case 'speaking':
        return {
          scaleY: [1, 1.5, 0.8, 1.2, 1],
          transition: { repeat: Infinity, duration: 0.8, ease: "easeInOut" }
        };
      default:
        return {
          scale: 1,
          opacity: 0.8,
          transition: { duration: 0.5 }
        };
    }
  };

  const getStatusText = () => {
    if (status === 'listening') return isRecording ? "Listening to you..." : "Preparing to listen...";
    if (status === 'thinking') return "AI is thinking...";
    if (status === 'speaking') return "AI is speaking...";
    return "Ready to connect";
  };

  const getColorClass = () => {
    switch (status) {
      case 'listening': return 'bg-blue-500';
      case 'thinking': return 'bg-purple-500';
      case 'speaking': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8 p-12 bg-slate-900 rounded-xl border border-slate-800 shadow-2xl">
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Outer glow ring */}
        <motion.div
          animate={status !== 'idle' ? { scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
          className={`absolute inset-0 rounded-full blur-xl ${getColorClass()} opacity-20`}
        />
        
        {/* Central orb */}
        <motion.div
          animate={getVariants()}
          className={`w-24 h-24 rounded-full shadow-lg z-10 flex items-center justify-center ${getColorClass()}`}
        >
          {status === 'idle' && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
          {status === 'listening' && (
            <div className="flex space-x-1">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  animate={{ height: ['10px', '24px', '10px'] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                  className="w-1.5 bg-white rounded-full"
                />
              ))}
            </div>
          )}
          {status === 'speaking' && (
            <div className="flex space-x-1 items-center h-10">
              {[1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  animate={{ height: ['20%', '100%', '20%'] }}
                  transition={{ repeat: Infinity, duration: 0.4 + (i * 0.1), delay: i * 0.05 }}
                  className="w-1.5 bg-white rounded-full"
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
      
      <div className="text-center">
        <h3 className="text-xl font-medium text-white mb-1">{getStatusText()}</h3>
        <p className="text-slate-400 text-sm">
          {status === 'idle' ? "Click Start Demo to begin" : "Speak into your microphone"}
        </p>
      </div>
    </div>
  );
};
