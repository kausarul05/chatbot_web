// hooks/useAnychatDirectWebSocket.ts
import { useState, useCallback, useEffect, useRef } from 'react';

interface Thread {
  guid: string;
  thread: string;
  client: {
    guid: string;
    name: string;
    email: string;
    data: {
      phoneNumber?: string;
    };
  };
  lastMessage: {
    id: string;
    content: string;
    timestamp: number;
    from_guid: string;
    last_edit?: number;
    is_service?: number;
  };
  unreadCount: number;
  unread: boolean;
  status: number; // 1=open, 2=resolved
  assigned_to: string | null;
  assignedTo?: {
    guid: string;
    firstname: string;
    lastname: string;
    email: string;
    image?: string;
  };
  botDriven: boolean;
  is_archive: number;
  widget_uid: string;
  integration_id?: string;
  tags: Array<{
    id?: string;
    label: string;
    color?: string;
  }>;
  operators?: Array<any>;
  lastMessageDate?: string;
}

interface AnychatMessage {
  id?: string;
  type: 'text' | 'image' | 'file' | 'system';
  content: string;
  timestamp: number;
  sender: 'user' | 'agent' | 'system';
  roomId?: string;
  userId?: string;
  from_guid?: string;
  thread?: string;
}

export const useAnychatDirectWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [messages, setMessages] = useState<AnychatMessage[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const authenticated = useRef(false);

  // Fetch conversation threads
  const fetchThreads = useCallback(async () => {
    try {
      const token = localStorage.getItem('chatbotAccessToken');
      const widgetUID = localStorage.getItem('widgetUID') || '4913c359-2647-3991-910f-d673af4b7e4d'; // From login response
      const workspace = localStorage.getItem('chatbotWorkspaceGuid') || '51530ed7-3432-3b8f-bc36-9950ea360bcb'; // From login response

      if (!token) {
        console.error('No token available for fetching threads');
        return;
      }

      // Fetch threads from API
      const response = await fetch(`https://api.chatbot24.ai/v1/threads?widget=${widgetUID}&workspace=${workspace}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch threads: ${response.status}`);
      }

      const data = await response.json();
      console.log('📋 Threads fetched:', data);

      // Transform API response to match Thread interface
      const formattedThreads: Thread[] = data.threads?.map((thread: any) => ({
        guid: thread.guid,
        thread: thread.guid,
        client: {
          guid: thread.client?.guid || thread.client_guid,
          name: thread.client?.name || 'Unknown User',
          email: thread.client?.email || '',
          data: thread.client?.data || {}
        },
        lastMessage: {
          id: thread.last_message?.id || `msg-${thread.guid}`,
          content: thread.last_message?.content || 'No messages yet',
          timestamp: thread.last_message?.timestamp || thread.last_message_date || Date.now(),
          from_guid: thread.last_message?.from_guid || thread.client?.guid,
          last_edit: thread.last_message?.last_edit,
          is_service: thread.last_message?.is_service
        },
        unreadCount: thread.unread_count || 0,
        unread: thread.unread || false,
        status: thread.status || 1,
        assigned_to: thread.assigned_to,
        assignedTo: thread.assigned_to_user,
        botDriven: thread.bot_driven || false,
        is_archive: thread.is_archive || 0,
        widget_uid: thread.widget_uid || widgetUID,
        integration_id: thread.integration_id,
        tags: thread.tags || [],
        operators: thread.operators,
        lastMessageDate: thread.last_message_date
      })) || [];

      setThreads(formattedThreads);

    } catch (error) {
      console.error('❌ Error fetching threads:', error);
    }
  }, []);

  // Fetch messages for a specific thread
  const fetchMessages = useCallback(async (threadGuid: string) => {
    try {
      const token = localStorage.getItem('chatbotAccessToken');
      
      if (!token) {
        console.error('No token available for fetching messages');
        return;
      }

      const response = await fetch(`https://api.chatbot24.ai/v1/threads/${threadGuid}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }

      const data = await response.json();
      console.log('📨 Messages fetched for thread:', threadGuid, data);

      // Transform API response to match AnychatMessage interface
      const formattedMessages: AnychatMessage[] = data.messages?.map((msg: any) => ({
        id: msg.id || msg.guid,
        type: msg.type || 'text',
        content: msg.content || msg.message,
        timestamp: msg.timestamp || msg.created_at,
        sender: msg.from_guid === localStorage.getItem('chatbotGuid') ? 'user' : 
                msg.is_service === 1 ? 'system' : 'agent',
        roomId: threadGuid,
        userId: msg.from_guid,
        from_guid: msg.from_guid,
        thread: threadGuid
      })) || [];

      setMessages(formattedMessages);

    } catch (error) {
      console.error('❌ Error fetching messages:', error);
    }
  }, []);

  const connect = useCallback(() => {
    try {
      setConnectionStatus('connecting');
      setError(null);
      
      // Get authentication data
      const token = localStorage.getItem('chatbotLoginToken') || 
                   localStorage.getItem('chatbotAccessToken');
      const guid = localStorage.getItem('chatbotGuid');
      const widgetUID = localStorage.getItem('widgetUID') || '4913c359-2647-3991-910f-d673af4b7e4d';
      const workspace = localStorage.getItem('chatbotWorkspaceGuid') || '51530ed7-3432-3b8f-bc36-9950ea360bcb';
      const deviceId = localStorage.getItem('deviceId') || 'unknown-device-id';
      
      if (!token || !guid) {
        setError('No authentication token found. Please login again.');
        setConnectionStatus('error');
        return;
      }

      // Create WebSocket URL
      const wsUrl = `wss://api.chatbot24.ai/chat/?token=${encodeURIComponent(token)}`;
      console.log('🔗 Connecting to WebSocket...');
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        
        // Send authentication message (similar to React Native)
        const authMessage = {
          action: 'auth',
          auth: {
            guid: guid,
            widget: widgetUID,
            workspace: workspace,
            token: token,
            deviceId: deviceId
          }
        };
        
        console.log('🔐 Sending authentication...');
        ws.send(JSON.stringify(authMessage));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message:', data);

          // Handle authentication response
          if (data.action === 'auth') {
            console.log('✅ Authentication successful');
            authenticated.current = true;
            setIsConnected(true);
            setConnectionStatus('connected');
            setError(null);
            
            // Fetch threads after authentication
            fetchThreads();
            
            // Add welcome message
            setMessages(prev => [...prev, {
              id: 'welcome',
              type: 'system',
              content: 'Connected to chat server',
              timestamp: Date.now(),
              sender: 'system'
            }]);
            return;
          }

          // Handle WebSocket errors
          if (data.action === 'wsError') {
            console.error('💥 WebSocket error:', data);
            if (data.errorCode === 403) {
              // Token expired - need to refresh
              console.log('Token expired, refreshing...');
              // You'll need to implement token refresh logic
            }
            return;
          }

          // Handle new messages
          if (data.action === 'new_message') {
            console.log('💬 New message received:', data);
            
            const newMessage: AnychatMessage = {
              id: data.message?.id || Date.now().toString(),
              type: data.message?.type || 'text',
              content: data.message?.content || data.message?.message || JSON.stringify(data),
              timestamp: data.message?.timestamp || Date.now(),
              sender: data.message?.from_guid === guid ? 'user' : 
                     data.message?.is_service === 1 ? 'system' : 'agent',
              roomId: data.message?.thread,
              userId: data.message?.from_guid,
              from_guid: data.message?.from_guid,
              thread: data.message?.thread
            };
            
            setMessages(prev => [...prev, newMessage]);
            
            // Update thread's last message
            if (data.message?.thread) {
              setThreads(prev => prev.map(thread => {
                if (thread.guid === data.message.thread) {
                  return {
                    ...thread,
                    lastMessage: {
                      id: data.message.id,
                      content: data.message.content,
                      timestamp: data.message.timestamp || Date.now(),
                      from_guid: data.message.from_guid
                    },
                    unreadCount: thread.guid === currentRoom ? 0 : thread.unreadCount + 1,
                    unread: thread.guid !== currentRoom
                  };
                }
                return thread;
              }));
            }
          }

          // Handle thread updates
          if (data.action === 'thread_update') {
            console.log('📝 Thread updated:', data);
            // Refresh threads list
            fetchThreads();
          }

          // Handle online users count
          if (data.online_users !== undefined) {
            setOnlineUsers(data.online_users);
          }

        } catch (parseError) {
          console.error('❌ Failed to parse message:', parseError, 'Raw:', event.data);
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
        authenticated.current = false;
        setIsConnected(false);
        setConnectionStatus('disconnected');
        wsRef.current = null;
        
        if (event.code !== 1000) {
          setError(`Connection closed: ${event.reason || 'Unknown reason'}`);
        }
      };

    } catch (error: any) {
      console.error('💥 WebSocket initialization error:', error);
      setConnectionStatus('error');
      setError(`Connection failed: ${error.message}`);
    }
  }, [fetchThreads, currentRoom]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close(1000, 'User disconnected');
      }
      wsRef.current = null;
    }
    authenticated.current = false;
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setError(null);
  }, []);

  const sendMessage = useCallback((content: string, type: 'text' | 'image' | 'file' = 'text') => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && content.trim() && currentRoom) {
      const messageData = {
        action: 'send_message',
        message: {
          content: content.trim(),
          type,
          thread: currentRoom,
          timestamp: Date.now()
        }
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
        roomId: currentRoom,
        userId: localStorage.getItem('chatbotGuid') || undefined
      };
      setMessages(prev => [...prev, userMessage]);
    } else {
      console.warn('⚠️ Cannot send message. WebSocket state:', wsRef.current?.readyState, 'Current room:', currentRoom);
    }
  }, [currentRoom]);

  const joinRoom = useCallback((roomId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setCurrentRoom(roomId);
      setMessages([]); // Clear messages for new room
      
      // Fetch messages for this thread
      fetchMessages(roomId);
      
      // Mark thread as read
      setThreads(prev => prev.map(thread => {
        if (thread.guid === roomId) {
          return {
            ...thread,
            unreadCount: 0,
            unread: false
          };
        }
        return thread;
      }));

      // Store current thread in localStorage
      localStorage.setItem('anychat_current_thread', roomId);
    }
  }, [fetchMessages]);

  const leaveRoom = useCallback((roomId: string) => {
    if (currentRoom === roomId) {
      setCurrentRoom(null);
      setMessages([]);
      localStorage.removeItem('anychat_current_thread');
    }
  }, [currentRoom]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshThreads = useCallback(() => {
    fetchThreads();
  }, [fetchThreads]);

  // Auto-connect on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      connect();
    }, 1000);

    return () => {
      clearTimeout(timer);
      disconnect();
    };
  }, [connect, disconnect]);

  // Load current thread from localStorage on mount
  useEffect(() => {
    const savedThread = localStorage.getItem('anychat_current_thread');
    if (savedThread) {
      setCurrentRoom(savedThread);
      // Don't fetch messages here - wait for joinRoom to be called
    }
  }, []);

  return {
    isConnected,
    connectionStatus,
    messages,
    threads,
    onlineUsers,
    currentRoom,
    error,
    sendMessage,
    joinRoom,
    leaveRoom,
    connect,
    disconnect,
    clearError,
    refreshThreads
  };
};