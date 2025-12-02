"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type IframePageProps = {
  url?: string;
  title?: string;
};

export default function IframePage({
  url = "https://dashboard.chatbot24.ai/settings/live-chat-integrations",
  title = "Chatbot Dashboard"
}: IframePageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const router = useRouter();

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  // In your IframePage component, add:
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem("externalAuthToken");
    const iframe = document.getElementById("external-site-iframe") as HTMLIFrameElement;

    if (iframe && token) {
      // Send token to iframe once it's loaded
      const handleLoad = () => {
        iframe.contentWindow?.postMessage({
          type: 'AUTH_TOKEN',
          token: token
        }, '*');
      };

      iframe.addEventListener('load', handleLoad);
      return () => iframe.removeEventListener('load', handleLoad);
    }
  }, []);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setHasError(false);
    const iframe = document.getElementById("external-site-iframe") as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C]">
      {/* Header */}
      <div className="bg-[#1A2028] border-b border-[#2D3748] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            {/* <h1 className="text-xl font-bold text-white">{title}</h1> */}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-[#60A5FB] hover:bg-[#3B82F6] text-white rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <svg
              className="animate-spin h-8 w-8 text-[#60A5FB] mx-auto mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="text-gray-400">Loading {title}...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Failed to Load</h3>
            <p className="text-gray-400 mb-4">Unable to load {title}. Please check your connection.</p>
            <button
              onClick={handleRefresh}
              className="px-6 py-2 bg-[#60A5FB] hover:bg-[#3B82F6] text-white rounded-lg transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Iframe */}
      {!hasError && (
        <div className={`w-full ${isLoading ? 'h-0' : 'h-screen'}`}>
          {/* // Set credentials on iframe */}
          <iframe
            id="external-site-iframe"
            src={url}
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title={title}
            allow="camera; microphone; fullscreen; clipboard-write"
            allowFullScreen
            credential="include" // Add this
          />
        </div>
      )}
    </div>
  );
}