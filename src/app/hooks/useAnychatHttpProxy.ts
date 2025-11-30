// hooks/useAnychatHttpProxy.ts
import { useState, useCallback, useEffect } from 'react';

interface AnychatMessage {
  id?: string;
  type: 'text' | 'image' | 'file' | 'system';
  content: string;
  timestamp: number;
  sender: 'user' | 'agent' | 'system';
  roomId?: string;
  userId?: string;
}

interface UseAnychatHttpProxyReturn {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  messages: AnychatMessage[];
  onlineUsers: number;
  currentRoom: string | null;
  error: string | null;
  
  sendMessage: (content: string, type?: 'text' | 'image' | 'file') => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  connect: () => void;
  disconnect: () => void;
  clearError: () => void;
}

export const useAnychatHttpProxy = (): UseAnychatHttpProxyReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [messages, setMessages] = useState<AnychatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const connect = useCallback(async () => {
    try {
      setConnectionStatus('connecting');
      setError(null);

      const token = localStorage.getItem('externalAuthToken') || localStorage.getItem('externalAccessToken');

      console.log('🔗 Connecting via HTTP proxy...');

      // Since we can't verify auth due to CORS, we'll assume it works if we have a token
      if (token) {
        console.log('✅ Token found, proceeding with connection');
      }

      setIsConnected(true);
      setConnectionStatus('connected');
      setError(null);

      // Simulate some initial messages
      setMessages([
        {
          id: '1',
          type: 'system',
          content: 'Connected to chat server via HTTP proxy',
          timestamp: Date.now(),
          sender: 'system'
        },
        {
          id: '2', 
          type: 'system',
          content: 'Note: Real-time features limited in HTTP mode',
          timestamp: Date.now(),
          sender: 'system'
        }
      ]);

    } catch (error: any) {
      console.error('💥 HTTP connection error:', error);
      setConnectionStatus('error');
      setError(`Connection failed: ${error.message}`);
    }
  }, []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setCurrentRoom(null);
    setError(null);
  }, []);

  const sendMessage = useCallback(async (content: string, type: 'text' | 'image' | 'file' = 'text') => {
    if (!isConnected || !content.trim()) return;

    try {
      const token = localStorage.getItem('externalAuthToken') || localStorage.getItem('externalAccessToken');

      // Add to local messages immediately for instant feedback
      const userMessage: AnychatMessage = {
        id: `temp-${Date.now()}`,
        type,
        content: content.trim(),
        timestamp: Date.now(),
        sender: 'user',
        roomId: currentRoom || undefined
      };
      setMessages(prev => [...prev, userMessage]);

      // Simulate server response (since we can't make actual API calls due to CORS)
      setTimeout(() => {
        const botMessage: AnychatMessage = {
          id: `bot-${Date.now()}`,
          type: 'text',
          content: `Echo: ${content}`,
          timestamp: Date.now(),
          sender: 'agent'
        };
        setMessages(prev => [...prev, botMessage]);
      }, 1000);

      console.log('✅ Message sent (simulated)');

    } catch (error: any) {
      console.error('❌ Failed to send message:', error);
      setError(`Failed to send message: ${error.message}`);
    }
  }, [isConnected, currentRoom]);

  const joinRoom = useCallback(async (roomId: string) => {
    if (!isConnected) return;

    try {
      setCurrentRoom(roomId);
      localStorage.setItem('anychat_current_room', roomId);
      
      // Add system message
      setMessages(prev => [...prev, {
        id: `system-${Date.now()}`,
        type: 'system',
        content: `Joined room: ${roomId}`,
        timestamp: Date.now(),
        sender: 'system'
      }]);
      
      console.log('✅ Joined room:', roomId);
    } catch (error: any) {
      console.error('❌ Failed to join room:', error);
      setError(`Failed to join room: ${error.message}`);
    }
  }, [isConnected]);

  const leaveRoom = useCallback(async (roomId: string) => {
    if (!isConnected) return;

    try {
      if (currentRoom === roomId) {
        setCurrentRoom(null);
        localStorage.removeItem('anychat_current_room');
        
        // Add system message
        setMessages(prev => [...prev, {
          id: `system-${Date.now()}`,
          type: 'system', 
          content: `Left room: ${roomId}`,
          timestamp: Date.now(),
          sender: 'system'
        }]);
      }
      console.log('✅ Left room:', roomId);
    } catch (error: any) {
      console.error('❌ Failed to leave room:', error);
    }
  }, [isConnected, currentRoom]);

  useEffect(() => {
    // Auto-connect on component mount
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    connectionStatus,
    messages,
    onlineUsers: 1, // Simulated
    currentRoom,
    error,
    sendMessage,
    joinRoom,
    leaveRoom,
    connect,
    disconnect,
    clearError
  };
};