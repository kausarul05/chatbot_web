"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardRedirect() {
  const router = useRouter();
  const [status, setStatus] = useState("Preparing dashboard...");

  useEffect(() => {
    const setupDashboardAccess = async () => {
      const email = localStorage.getItem("externalUserEmail");
      const encodedPassword = sessionStorage.getItem("externalPassword");
      
      if (!email || !encodedPassword) {
        router.push("/dashboard");
        return;
      }

      try {
        const password = atob(encodedPassword);
        
        // Create a hidden iframe to login to dashboard
        setStatus("Logging into dashboard...");
        
        // Method 1: Try to login via API first
        const deviceInfo = {
          type: "browser",
          appVersion: "1.8.45",
          language: navigator.language || "en-GB",
          platform: navigator.platform || "Win32",
          userAgent: navigator.userAgent,
        };
        
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Dhaka";
        
        await fetch("https://api.chatbot24.ai/v1/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: 'include',
          body: JSON.stringify({
            device: deviceInfo,
            password: password,
            timezone: timezone,
            username: email,
          }),
        });

        // Wait for cookies to propagate
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setStatus("Opening dashboard...");
        
        // Now open the dashboard
        const dashboardWindow = window.open(
          "https://dashboard.chatbot24.ai/settings/live-chat-integrations",
          '_blank',
          'noopener,noreferrer,width=1200,height=800'
        );
        
        if (dashboardWindow) {
          // Monitor the new window
          const checkInterval = setInterval(() => {
            if (dashboardWindow.closed) {
              clearInterval(checkInterval);
              router.push("/dashboard");
            }
          }, 1000);
        } else {
          setStatus("Popup blocked! Opening in same tab...");
          window.location.href = "https://dashboard.chatbot24.ai/settings/live-chat-integrations";
          return;
        }
        
        // Redirect to main dashboard after a delay
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
        
      } catch (error) {
        console.error("Dashboard setup failed:", error);
        setStatus("Failed to setup dashboard. Redirecting...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
    };

    setupDashboardAccess();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-6"></div>
        <h2 className="text-2xl font-bold text-white mb-3">Setting Up Dashboard Access</h2>
        <p className="text-gray-400 mb-4">{status}</p>
        <div className="inline-flex items-center gap-2 text-sm text-gray-500">
          <svg className="w-4 h-4 animate-pulse text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>This may take a few seconds...</span>
        </div>
      </div>
    </div>
  );
}