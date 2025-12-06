"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Get session from localStorage
    const storedSessionId = localStorage.getItem('chatbotSessionId');
    const chatbotEmail = localStorage.getItem('externalUserEmail');
    
    if (!storedSessionId || !chatbotEmail) {
      setError('Please login first');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
      return;
    }
    
    setSessionId(storedSessionId);
    
    // Listen for messages from iframe
    const handleMessage = (event: MessageEvent) => {
      console.log('Message from iframe:', event.data);
      
      if (event.data.type === 'SESSION_EXPIRED') {
        setError('Session expired. Please login again.');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else if (event.data.type === 'IFRAME_LOADED') {
        setIsLoading(false);
      } else if (event.data.type === 'IFRAME_ERROR') {
        setError(`Iframe error: ${event.data.message}`);
        setIsLoading(false);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [router]);

  const refreshIframe = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
      setIsLoading(true);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
        <div className="text-center p-8 bg-[#1A2028] rounded-xl border border-[#2D3748]">
          <h2 className="text-2xl text-white mb-4">Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-[#60A5FB] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#3B82F6] transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1C]">
      {/* Top Bar */}
      <div className="bg-[#1A2028] border-b border-[#2D3748] p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white">Chatbot24.ai Dashboard</h1>
          <p className="text-gray-400 text-sm">Integrated Live Chat Settings</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={refreshIframe}
            className="bg-[#4A5568] text-white px-4 py-2 rounded-lg hover:bg-[#2D3748] transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={() => router.push('/login')}
            className="bg-[#DC2626] text-white px-4 py-2 rounded-lg hover:bg-[#B91C1C] transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#60A5FB] mb-4"></div>
            <p className="text-gray-300">Loading Chatbot24.ai Dashboard...</p>
            <p className="text-gray-400 text-sm mt-2">This may take a few moments</p>
          </div>
        </div>
      )}

      {/* Iframe Container - FULL SCREEN */}
      <div className={`${isLoading ? 'hidden' : 'block'} h-[calc(100vh-80px)]`}>
        {sessionId && (
          <iframe
            ref={iframeRef}
            src={`http://localhost:5000/api/proxy/chatbot/page/settings/live-chat-integrations?sessionId=${sessionId}`}
            className="w-full h-full border-0"
            title="Chatbot24.ai Dashboard"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
            allow="autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; microphone; camera"
            allowFullScreen
            onLoad={() => setIsLoading(false)}
            onError={(e) => {
              console.error('Iframe error:', e);
              setError('Failed to load dashboard');
              setIsLoading(false);
            }}
          />
        )}
      </div>
    </div>
  );
}