// components/ConversationList.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';

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

interface ConversationListProps {
  onSelectConversation: (thread: Thread) => void;
  currentConversation?: Thread | null;
  activeTab: 'active' | 'bot-driven' | 'archive';
  onTabChange: (tab: 'active' | 'bot-driven' | 'archive') => void;
}

export default function ConversationList({ 
  onSelectConversation, 
  currentConversation,
  activeTab,
  onTabChange
}: ConversationListProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Sample data based on your React Native structure
  const sampleThreads: Thread[] = [
    {
      guid: 'thread-1',
      thread: 'thread-1',
      client: {
        guid: 'client-1',
        name: 'John Doe',
        email: 'john@example.com',
        data: { phoneNumber: '+1234567890' }
      },
      lastMessage: {
        id: 'msg-1',
        content: 'Hello, I need help with my order',
        timestamp: Date.now() - 300000,
        from_guid: 'client-1'
      },
      unreadCount: 2,
      unread: true,
      status: 1,
      assigned_to: null,
      botDriven: false,
      is_archive: 0,
      widget_uid: 'widget-1',
      integration_id: 'web-chat',
      tags: [
        { label: 'Urgent', color: '#FF6B6B' },
        { label: 'Billing', color: '#4ECDC4' }
      ]
    },
    {
      guid: 'thread-2',
      thread: 'thread-2',
      client: {
        guid: 'client-2',
        name: 'Sarah Smith',
        email: 'sarah@example.com',
        data: { phoneNumber: '+0987654321' }
      },
      lastMessage: {
        id: 'msg-2',
        content: 'Thank you for your help!',
        timestamp: Date.now() - 600000,
        from_guid: 'agent-1'
      },
      unreadCount: 0,
      unread: false,
      status: 1,
      assigned_to: 'agent-1',
      assignedTo: {
        guid: 'agent-1',
        firstname: 'Mike',
        lastname: 'Johnson',
        email: 'mike@company.com'
      },
      botDriven: false,
      is_archive: 0,
      widget_uid: 'widget-1',
      integration_id: 'whatsapp',
      tags: [
        { label: 'Resolved', color: '#51CF66' }
      ]
    },
    {
      guid: 'thread-3',
      thread: 'thread-3',
      client: {
        guid: 'client-3',
        name: 'AI Customer',
        email: 'ai@example.com',
        data: {}
      },
      lastMessage: {
        id: 'msg-3',
        content: 'How can I reset my password?',
        timestamp: Date.now() - 120000,
        from_guid: 'client-3'
      },
      unreadCount: 1,
      unread: true,
      status: 1,
      assigned_to: null,
      botDriven: true,
      is_archive: 0,
      widget_uid: 'widget-2',
      integration_id: 'web-chat',
      tags: [
        { label: 'AI', color: '#9C27B0' }
      ]
    }
  ];

  // Simulate loading threads
  useEffect(() => {
    const loadThreads = async () => {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setThreads(sampleThreads);
        setLoading(false);
      }, 1000);
    };

    loadThreads();
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return new Date(timestamp).toLocaleDateString();
  };

  const getChannelIcon = (integrationId?: string) => {
    switch (integrationId) {
      case 'whatsapp': return '💬';
      case 'messenger': return '📱';
      case 'instagram': return '📸';
      case 'telegram': return '✈️';
      case 'web-chat': return '🌐';
      default: return '💬';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: return 'bg-green-500'; // Open
      case 2: return 'bg-gray-500'; // Resolved
      default: return 'bg-blue-500';
    }
  };

  const filteredThreads = threads.filter(thread => {
    if (activeTab === 'active') {
      return !thread.botDriven && thread.is_archive === 0;
    }
    if (activeTab === 'bot-driven') {
      return thread.botDriven && thread.is_archive === 0;
    }
    if (activeTab === 'archive') {
      return thread.is_archive === 1;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="w-80 bg-[#1A2028] border-r border-[#2D3748] h-full flex flex-col">
        <div className="p-4 border-b border-[#2D3748]">
          <h2 className="text-lg font-semibold text-white">Conversations</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-[#60A5FB] mx-auto mb-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-400">Loading conversations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-[#1A2028] border-r border-[#2D3748] h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#2D3748]">
        <h2 className="text-lg font-semibold text-white mb-3">Conversations</h2>
        
        {/* Tabs */}
        <div className="flex space-x-1 bg-[#0F172A] rounded-lg p-1">
          {(['active', 'bot-driven', 'archive'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-[#536dfe] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'active' && 'Human'}
              {tab === 'bot-driven' && 'AI Agent'}
              {tab === 'archive' && 'Archive'}
            </button>
          ))}
        </div>
      </div>

      {/* Threads List */}
      <div className="flex-1 overflow-y-auto">
        {filteredThreads.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#2D3748] rounded-full flex items-center justify-center">
                <span className="text-2xl">💬</span>
              </div>
              <p>No conversations in {activeTab}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredThreads.map((thread) => (
              <div
                key={thread.guid}
                onClick={() => onSelectConversation(thread)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  currentConversation?.guid === thread.guid
                    ? 'bg-[#536dfe] text-white'
                    : 'bg-[#1A2028] hover:bg-[#2D3748] text-gray-300'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">
                      {getChannelIcon(thread.integration_id)}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(thread.status)}`}></span>
                    <span className="font-medium text-sm truncate max-w-24">
                      {thread.client.name || 'Unknown User'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <span className="text-xs opacity-75">
                      {formatTime(thread.lastMessage.timestamp)}
                    </span>
                    {thread.unreadCount > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                        currentConversation?.guid === thread.guid
                          ? 'bg-white text-[#536dfe]'
                          : 'bg-[#536dfe] text-white'
                      }`}>
                        {thread.unreadCount > 99 ? '99+' : thread.unreadCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Last Message */}
                <p className={`text-sm mb-2 line-clamp-2 ${
                  currentConversation?.guid === thread.guid ? 'text-blue-100' : 'text-gray-400'
                }`}>
                  {thread.lastMessage.content}
                </p>

                {/* Footer - Tags & Assignment */}
                <div className="flex items-center justify-between">
                  <div className="flex space-x-1 flex-wrap">
                    {thread.tags.slice(0, 2).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{ 
                          backgroundColor: `${tag.color}20`,
                          color: tag.color,
                          border: `1px solid ${tag.color}40`
                        }}
                      >
                        {tag.label}
                      </span>
                    ))}
                    {thread.tags.length > 2 && (
                      <span className="px-2 py-1 rounded text-xs bg-gray-600 text-gray-300">
                        +{thread.tags.length - 2}
                      </span>
                    )}
                  </div>
                  
                  {thread.assignedTo && (
                    <div className="flex items-center space-x-1">
                      <div className="w-6 h-6 bg-[#536dfe] rounded-full flex items-center justify-center text-xs text-white">
                        {thread.assignedTo.firstname[0]}{thread.assignedTo.lastname[0]}
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Agent Badge */}
                {thread.botDriven && (
                  <div className="mt-2">
                    <span className="px-2 py-1 rounded text-xs bg-purple-600 text-white">
                      🤖 AI Agent
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-3 border-t border-[#2D3748] bg-[#0F172A]">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Total: {filteredThreads.length}</span>
          <span>
            Unread: {filteredThreads.filter(t => t.unreadCount > 0).length}
          </span>
        </div>
      </div>
    </div>
  );
}