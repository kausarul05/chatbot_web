"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Get session from localStorage
    const storedSessionId = localStorage.getItem('chatbotSessionId');
    const chatbotEmail = localStorage.getItem('externalUserEmail');
    
    if (!storedSessionId || !chatbotEmail) {
      router.push('/login');
      return;
    }
    
    setSessionId(storedSessionId);
    setIsLoading(false);
  }, [router]);

  // const openInNewTab = () => {
  //   window.open('https://dashboard.chatbot24.ai/app', '_blank');
  // };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#60A5FB] mb-4"></div>
          <p className="text-gray-300">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1C] flex flex-col">
      {/* Header */}
      <div className="bg-[#1A2028] border-b border-[#2D3748] p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white">Chatbot24.ai Dashboard</h1>
          <p className="text-gray-400 text-sm">Embedded View</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="bg-[#4A5568] text-white px-4 py-2 rounded-lg hover:bg-[#2D3748] transition-colors"
          >
            Refresh
          </button>
          {/* <button
            onClick={openInNewTab}
            className="bg-[#60A5FB] text-white px-4 py-2 rounded-lg hover:bg-[#3B82F6] transition-colors"
          >
            Open in New Tab
          </button> */}
          <button
            onClick={() => {
              localStorage.clear();
              router.push('/login');
            }}
            className="bg-[#DC2626] text-white px-4 py-2 rounded-lg hover:bg-[#B91C1C] transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Dashboard Iframe */}
      <div className="flex-1">
        <iframe
          src={`https://chatbotwebbackend-production.up.railway.app/api/proxy/chatbot/embed-dashboard?sessionId=${sessionId}`}
          className="w-full h-full border-0"
          title="Chatbot24.ai Dashboard"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
          allow="autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}