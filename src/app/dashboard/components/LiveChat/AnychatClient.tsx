// components/AnychatClient.tsx (Updated)
"use client";

import { useState, useRef, useEffect } from 'react';
import { useAnychatDirectWebSocket } from '@/app/hooks/useAnychatDirectWebSocket';
import ConversationList from '../ConversationList/ConversationList';
// import ConversationList from './ConversationList';

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
  };
  unreadCount: number;
  unread: boolean;
  status: number;
  assigned_to: string | null;
  assignedTo?: any;
  botDriven: boolean;
  is_archive: number;
  widget_uid: string;
  integration_id?: string;
  tags: Array<{
    label: string;
    color?: string;
  }>;
}

export default function AnychatClient() {
  const [activeTab, setActiveTab] = useState<'active' | 'bot-driven' | 'archive'>('active');
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
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
  } = useAnychatDirectWebSocket();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConversation = (thread: Thread) => {
    setSelectedThread(thread);
    // Join the thread room
    joinRoom(thread.guid);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedThread) return;
    sendMessage(messageInput);
    setMessageInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRetryConnection = () => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('externalAccessToken');
    connect(token || undefined);
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Connection Error';
      default: return 'Disconnected';
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F1C] to-[#1e2a47] flex">
      {/* Conversation List Sidebar */}
      <ConversationList
        onSelectConversation={handleSelectConversation}
        currentConversation={selectedThread}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-[#1A2028] border-b border-[#2D3748] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full animate-pulse ${getStatusColor()}`}></div>
                <span className="text-white font-semibold">{getStatusText()}</span>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-300">
                <span>👥 {onlineUsers} online</span>
                {selectedThread && (
                  <span className="bg-[#536dfe] px-2 py-1 rounded text-white">
                    {selectedThread.client.name}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {!isConnected ? (
                <button
                  onClick={handleRetryConnection}
                  disabled={connectionStatus === 'connecting'}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {connectionStatus === 'connecting' ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Connecting...
                    </>
                  ) : (
                    'Connect'
                  )}
                </button>
              ) : (
                <button
                  onClick={disconnect}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 bg-[#1A2028] overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {!selectedThread ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-[#2D3748] rounded-full flex items-center justify-center">
                    <span className="text-2xl">💬</span>
                  </div>
                  <p>Select a conversation to start chatting</p>
                  <p className="text-sm mt-2">Choose from the list on the left</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-[#2D3748] rounded-full flex items-center justify-center">
                    <span className="text-2xl">💬</span>
                  </div>
                  <p>No messages yet in this conversation</p>
                  <p className="text-sm mt-2">Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md rounded-2xl p-4 ${
                        message.sender === 'user'
                          ? 'bg-[#536dfe] text-white rounded-br-none'
                          : message.sender === 'agent'
                          ? 'bg-[#2D3748] text-white rounded-bl-none'
                          : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                      }`}
                    >
                      {message.sender === 'system' && (
                        <div className="text-xs font-medium mb-1">System</div>
                      )}
                      
                      <div className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </div>
                      
                      <div className={`text-xs mt-2 ${
                        message.sender === 'user' ? 'text-blue-100' : 'text-gray-400'
                      }`}>
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            {selectedThread && (
              <div className="border-t border-[#2D3748] p-4">
                <div className="flex gap-2">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={!isConnected}
                    className="flex-1 p-3 bg-[#0F172A] border border-[#2D3748] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#536dfe] resize-none disabled:opacity-50"
                    rows={2}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!isConnected || !messageInput.trim()}
                    className="px-6 bg-[#536dfe] hover:bg-[#4056d1] disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}