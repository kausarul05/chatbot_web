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

export const useAnychatDirectWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [messages, setMessages] = useState<AnychatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    try {
      setConnectionStatus('connecting');
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
        setConnectionStatus('connected');
        setError(null);
        
        // Add welcome message
        setMessages(prev => [...prev, {
          id: 'welcome',
          type: 'system',
          content: 'Connected to Anychat server via WebSocket',
          timestamp: Date.now(),
          sender: 'system'
        }]);
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
          
          // Update online users if provided
          if (data.onlineUsers !== undefined) {
            setOnlineUsers(data.onlineUsers);
          }
          
          // Update room if provided
          if (data.roomId) {
            setCurrentRoom(data.roomId);
          }
        } catch (parseError) {
          console.error('❌ Failed to parse message:', parseError);
        }
      };

      ws.onerror = (error) => {
        console.error('💥 WebSocket error:', error);
        setError('WebSocket connection failed');
        setIsConnected(false);
        setConnectionStatus('error');
      };

      ws.onclose = (event) => {
        console.log('🔴 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        if (event.code !== 1000) {
          setError(`Connection closed: ${event.reason || 'Unknown reason'}`);
        }
      };

    } catch (error: any) {
      console.error('💥 WebSocket initialization error:', error);
      setConnectionStatus('error');
      setError(`Connection failed: ${error.message}`);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setError(null);
  }, []);

  const sendMessage = useCallback((content: string, type: 'text' | 'image' | 'file' = 'text') => {
    if (wsRef.current && isConnected && content.trim()) {
      const messageData = {
        action: 'send_message',
        content: content.trim(),
        type,
        timestamp: Date.now(),
        projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
        roomId: currentRoom
      };

      console.log('📤 Sending message:', messageData);
      wsRef.current.send(JSON.stringify(messageData));

      // Add to local messages immediately
      const userMessage: AnychatMessage = {
        id: `temp-${Date.now()}`,
        type,
        content: content.trim(),
        timestamp: Date.now(),
        sender: 'user',
        roomId: currentRoom || undefined
      };
      setMessages(prev => [...prev, userMessage]);
    }
  }, [isConnected, currentRoom]);

  const joinRoom = useCallback((roomId: string) => {
    if (wsRef.current && isConnected) {
      const joinData = {
        action: 'join_room',
        roomId,
        projectId: process.env.NEXT_PUBLIC_PROJECT_ID
      };
      
      console.log('🚪 Joining room:', roomId);
      wsRef.current.send(JSON.stringify(joinData));
      setCurrentRoom(roomId);
      localStorage.setItem('anychat_current_room', roomId);
    }
  }, [isConnected]);

  const leaveRoom = useCallback((roomId: string) => {
    if (wsRef.current && isConnected) {
      const leaveData = {
        action: 'leave_room', 
        roomId
      };
      
      console.log('🚪 Leaving room:', roomId);
      wsRef.current.send(JSON.stringify(leaveData));
      
      if (currentRoom === roomId) {
        setCurrentRoom(null);
        localStorage.removeItem('anychat_current_room');
      }
    }
  }, [isConnected, currentRoom]);

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
    connectionStatus,
    messages,
    onlineUsers,
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