// components/ConversationList.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';

// Remove the sampleThreads and update the component to use real data
interface ConversationListProps {
  threads: any[];
  onSelectConversation: (thread: any) => void;
  currentConversation?: any | null;
  activeTab: 'active' | 'bot-driven' | 'archive';
  onTabChange: (tab: 'active' | 'bot-driven' | 'archive') => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export default function ConversationList({ 
  threads = [],
  onSelectConversation, 
  currentConversation,
  activeTab,
  onTabChange,
  onRefresh,
  refreshing = false
}: ConversationListProps) {
  const [filteredThreads, setFilteredThreads] = useState(threads);

  // Update filtered threads when threads or activeTab changes
  useEffect(() => {
    const filtered = threads.filter(thread => {
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
    
    // Sort by last message timestamp (newest first)
    filtered.sort((a, b) => {
      const timeA = a.lastMessage?.timestamp || 0;
      const timeB = b.lastMessage?.timestamp || 0;
      return timeB - timeA;
    });
    
    setFilteredThreads(filtered);
  }, [threads, activeTab]);

  const formatTime = (timestamp: number) => {
    if (!timestamp) return 'Just now';
    
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
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

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <div className="w-80 bg-[#1A2028] border-r border-[#2D3748] h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#2D3748]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Conversations</h2>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#2D3748] disabled:opacity-50"
            title="Refresh conversations"
          >
            <svg 
              className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        
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
              <p className="text-sm mt-2">New conversations will appear here</p>
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
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <span className="text-sm">
                      {getChannelIcon(thread.integration_id)}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(thread.status)}`}></span>
                    <span className="font-medium text-sm truncate">
                      {thread.client?.name || 'Unknown User'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <span className="text-xs opacity-75 whitespace-nowrap">
                      {formatTime(thread.lastMessage?.timestamp)}
                    </span>
                    {thread.unreadCount > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium min-w-5 text-center ${
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
                  {thread.lastMessage?.content || 'No messages yet'}
                </p>

                {/* Footer - Tags & Assignment */}
                <div className="flex items-center justify-between">
                  <div className="flex space-x-1 flex-wrap gap-1">
                    {thread.tags?.slice(0, 2).map((tag: any, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{ 
                          backgroundColor: `${tag.color || '#9CA3AF'}20`,
                          color: tag.color || '#9CA3AF',
                          border: `1px solid ${tag.color || '#9CA3AF'}40`
                        }}
                      >
                        {tag.label}
                      </span>
                    ))}
                    {thread.tags?.length > 2 && (
                      <span className="px-2 py-1 rounded text-xs bg-gray-600 text-gray-300">
                        +{thread.tags.length - 2}
                      </span>
                    )}
                  </div>
                  
                  {thread.assignedTo && (
                    <div className="flex items-center space-x-1">
                      <div className="w-6 h-6 bg-[#536dfe] rounded-full flex items-center justify-center text-xs text-white">
                        {thread.assignedTo.firstname?.[0] || 'A'}{thread.assignedTo.lastname?.[0] || 'G'}
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