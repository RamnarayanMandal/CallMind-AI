import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface AdminSocketState {
  socket: Socket | null;
  isConnected: boolean;
  infrastructureMetrics: any;
  liveCalls: any[];
  systemAlerts: any[];
  connect: () => void;
  disconnect: () => void;
}

export const useAdminSocket = create<AdminSocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  infrastructureMetrics: null,
  liveCalls: [],
  systemAlerts: [],

  connect: () => {
    const currentSocket = get().socket;
    if (currentSocket?.connected) return;

    // Use environment variable for backend URL, default to localhost:3001
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';
    
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    
    const newSocket = io(`${backendUrl}/admin`, {
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      transports: ['websocket'],
      auth: { token }
    });

    newSocket.on('connect', () => {
      set({ isConnected: true, socket: newSocket });
    });

    newSocket.on('disconnect', () => {
      set({ isConnected: false });
    });

    // Handle real-time metrics pushed from NestJS backend
    newSocket.on('admin:infrastructure:update', (metrics) => {
      set({ infrastructureMetrics: metrics });
    });

    newSocket.on('admin:monitoring:update', (data) => {
      if (data.type) {
        set((state) => ({ 
          systemAlerts: [data, ...state.systemAlerts].slice(0, 20) 
        }));
      } else {
        // It's a live call update
        set((state) => {
          const exists = state.liveCalls.find(c => c.id === data.id);
          if (exists) {
            return { liveCalls: state.liveCalls.map(c => c.id === data.id ? data : c) };
          }
          return { liveCalls: [data, ...state.liveCalls].slice(0, 50) };
        });
      }
    });

    set({ socket: newSocket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  }
}));
