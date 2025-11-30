// hooks/useAnychatDirectWebSocket.ts
import { useState, useCallback, useEffect, useRef } from 'react';

interface AnychatMessage {
  id?: string;
  type: 'text' | 'image' | 'file' | 'system';
  content: string;
  timestamp: number;
  sender: 'user' | 'agent' | 'system';
  roomId?: string;
  userId?: string;
}

export const useAnychatSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<AnychatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    try {
      setError(null);
      
      const token = localStorage.getItem('externalAuthToken') || localStorage.getItem('externalAccessToken');
      const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
      const agencyId = process.env.NEXT_PUBLIC_AGENCY_ID;

      // Create WebSocket URL with query parameters
      const wsUrl = `wss://api.anychat.one/chat/?token=${encodeURIComponent(token || '')}&projectId=${projectId}&agencyId=${agencyId}`;
      
      console.log('🔗 Connecting to WebSocket:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Received message:', data);
          
          const newMessage: AnychatMessage = {
            id: data.id || Date.now().toString(),
            type: data.type || 'text',
            content: data.content || data.message,
            timestamp: data.timestamp || Date.now(),
            sender: data.sender || 'user',
            roomId: data.roomId,
            userId: data.userId
          };
          
          setMessages(prev => [...prev, newMessage]);
        } catch (parseError) {
          console.error('❌ Failed to parse message:', parseError);
        }
      };

      ws.onerror = (error) => {
        console.error('💥 WebSocket error:', error);
        setError('WebSocket connection failed');
        setIsConnected(false);
      };

      ws.onclose = (event) => {
        console.log('🔴 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        if (event.code !== 1000) {
          setError(`Connection closed: ${event.reason || 'Unknown reason'}`);
        }
      };

    } catch (error: any) {
      console.error('💥 WebSocket initialization error:', error);
      setError(`Connection failed: ${error.message}`);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
    setIsConnected(false);
    setError(null);
  }, []);

  const sendMessage = useCallback((content: string, type: 'text' | 'image' | 'file' = 'text') => {
    if (wsRef.current && isConnected && content.trim()) {
      const messageData = {
        action: 'send_message',
        content: content.trim(),
        type,
        timestamp: Date.now(),
        projectId: process.env.NEXT_PUBLIC_PROJECT_ID
      };

      console.log('📤 Sending message:', messageData);
      wsRef.current.send(JSON.stringify(messageData));

      // Add to local messages immediately
      const userMessage: AnychatMessage = {
        id: `temp-${Date.now()}`,
        type,
        content: content.trim(),
        timestamp: Date.now(),
        sender: 'user'
      };
      setMessages(prev => [...prev, userMessage]);
    }
  }, [isConnected]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    connectionStatus: isConnected ? 'connected' : 'disconnected',
    messages,
    onlineUsers: 0, // You'll need to implement this
    currentRoom: null, // You'll need to implement this
    error,
    sendMessage,
    joinRoom: () => {}, // Implement if needed
    leaveRoom: () => {}, // Implement if needed
    connect,
    disconnect,
    clearError
  };
};