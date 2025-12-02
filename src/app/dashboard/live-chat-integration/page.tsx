"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LiveChatIntegration() {
  const router = useRouter();

  useEffect(() => {
    const openDashboard = () => {
      const email = localStorage.getItem("externalUserEmail");
      const password = localStorage.getItem("externalUserPassword");
      
      if (!email || !password) {
        alert("Please login first");
        router.push("/login");
        return;
      }

      // Open our proxy page
      const proxyUrl = `http://localhost:5000/api/proxy/chatbot/login-and-redirect?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
      
      // Open in new tab
      const newWindow = window.open(proxyUrl, '_blank', 'noopener,noreferrer');
      
      if (newWindow) {
        // Close this page after 1 second
        setTimeout(() => {
          router.back();
        }, 1000);
      } else {
        // If popup blocked, open in same window
        window.location.href = proxyUrl;
      }
    };

    openDashboard();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-6"></div>
        <h2 className="text-xl font-bold text-white mb-2">Opening Chatbot Dashboard</h2>
        <p className="text-gray-400">Please wait...</p>
      </div>
    </div>
  );
}