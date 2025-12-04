"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type LoginFormData = {
  email: string;
  password: string;
  rememberMe: boolean;
};

type ChatbotLoginResponse = {
  tfa_required: boolean;
  accessToken: string;
  guid: string;
  role: string;
  domains: string[];
  loginToken: string;
  is_agency: number;
  client_limit: number;
  widgetUID: string;
  defaultWorkspace: any;
  workspaces: any[];
  tariff: string;
};

type LocalLoginResponse = {
  token?: string;
  user?: {
    id?: string;
    email?: string;
    name?: string;
    role?: string;
  };
  message?: string;
  error?: string;
  success?: boolean;
};

// Function to generate a unique device ID
const generateDeviceId = () => {
  if (typeof window !== 'undefined') {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }
  return 'unknown-device-id';
};

// Function to get device information
const getDeviceInfo = () => {
  if (typeof window !== 'undefined' && navigator) {
    return {
      type: "browser",
      appVersion: "1.8.45",
      language: navigator.language || "en-GB",
      platform: navigator.platform || "Win32",
      userAgent: navigator.userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      deviceID: generateDeviceId(),
    };
  }
  return {
    type: "browser",
    appVersion: "1.8.45",
    language: "en-GB",
    platform: "Win32",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    deviceID: generateDeviceId(),
  };
};

// Function to get timezone
const getTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "Asia/Dhaka";
  }
};

// Function to login to chatbot24.ai
const loginToChatbot24 = async (email: string, password: string): Promise<ChatbotLoginResponse> => {
  const deviceInfo = getDeviceInfo();
  const timezone = getTimezone();

  const payload = {
    device: {
      type: deviceInfo.type,
      appVersion: deviceInfo.appVersion,
      language: deviceInfo.language,
      platform: deviceInfo.platform,
      userAgent: deviceInfo.userAgent,
      deviceID: deviceInfo.deviceID
    },
    password: password,
    timezone: timezone,
    username: email
  };

  console.log("Sending chatbot login request...");

  const response = await fetch("https://api.chatbot24.ai/v1/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Chatbot login failed:", errorText);
    let errorMessage = `Chatbot login failed with status: ${response.status}`;
    
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // If response is not JSON, use the text
      errorMessage = errorText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }

  const data = await response.json();
  console.log("Chatbot24.ai login successful!");
  return data;
};

// Function to login to local API
const loginToLocalAPI = async (email: string, password: string): Promise<LocalLoginResponse> => {
  console.log("Sending local login request...");
  
  const response = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email,
      password: password
      // Note: We're NOT sending chatbotData to local API
    }),
  });

  const responseText = await response.text();
  console.log("Local API response:", responseText.substring(0, 200) + "...");

  if (!response.ok) {
    let errorMessage = `Local login failed with status: ${response.status}`;
    
    try {
      const errorData = JSON.parse(responseText);
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      errorMessage = responseText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }

  try {
    const data = JSON.parse(responseText);
    return data;
  } catch (error) {
    console.error("Failed to parse local API response:", error);
    throw new Error("Invalid response from local server");
  }
};

// Function to establish WebSocket connection using chatbot24.ai token
const connectWebSocket = (chatbotToken: string, guid: string) => {
  if (typeof window === 'undefined') return null;

  try {
    // Use chatbot24.ai token for WebSocket connection
    // Trying both accessToken and loginToken to see which one works
    const wsUrl = `wss://api.chatbot24.ai/chat/?token=${chatbotToken}`;
    console.log("Connecting WebSocket to:", wsUrl);
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('✅ WebSocket connection established with chatbot24.ai');
      localStorage.setItem('websocketConnected', 'true');
      localStorage.setItem('websocketToken', chatbotToken);
      
      // Store WebSocket instance globally
      (window as any).chatbotWebSocket = ws;
      
      // Send initial message with user info
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          const initMessage = {
            type: 'init',
            token: chatbotToken,
            guid: guid,
            timestamp: Date.now(),
            action: 'user_connected'
          };
          ws.send(JSON.stringify(initMessage));
          console.log('Sent WebSocket init message');
        }
      }, 1000);
    };

    ws.onclose = (event) => {
      console.log('WebSocket connection closed. Code:', event.code, 'Reason:', event.reason);
      localStorage.removeItem('websocketConnected');
      localStorage.removeItem('websocketToken');
      (window as any).chatbotWebSocket = null;
      
      // Attempt reconnection if not clean close
      if (!event.wasClean && event.code !== 1000) {
        console.log('Attempting to reconnect WebSocket in 3 seconds...');
        setTimeout(() => {
          const storedToken = localStorage.getItem('chatbotLoginToken') || 
                            localStorage.getItem('chatbotAccessToken');
          const storedGuid = localStorage.getItem('chatbotGuid');
          if (storedToken && storedGuid) {
            connectWebSocket(storedToken, storedGuid);
          }
        }, 3000);
      }
    };

    ws.onerror = (error: Event) => {
      console.error('WebSocket error:', error);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 WebSocket message received:', data);
        
        // Handle welcome/connection confirmation
        if (data.type === 'welcome' || data.event === 'connected' || data.status === 'connected') {
          console.log('✅ WebSocket connection confirmed by server');
        }
        
        // Handle chat messages
        if (data.type === 'message' || data.message) {
          console.log('💬 Chat message:', data);
        }
        
        // You can add more message handlers here based on your needs
        
      } catch (e) {
        console.log('📨 Raw WebSocket message:', event.data);
      }
    };

    return ws;
  } catch (error) {
    console.error('❌ Failed to create WebSocket:', error);
    return null;
  }
};

// Function to send message through WebSocket
export const sendWebSocketMessage = (message: any) => {
  if (typeof window !== 'undefined' && (window as any).chatbotWebSocket) {
    const ws = (window as any).chatbotWebSocket;
    if (ws.readyState === WebSocket.OPEN) {
      const messageString = typeof message === 'string' ? message : JSON.stringify(message);
      ws.send(messageString);
      console.log('📤 Message sent via WebSocket:', message);
      return true;
    } else {
      console.warn('⚠️ WebSocket is not connected. State:', ws.readyState);
      return false;
    }
  } else {
    console.warn('⚠️ WebSocket is not initialized');
    return false;
  }
};

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (error) setError("");
  };

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log("🔑 Step 1: Logging into chatbot24.ai...");
      
      // Step 1: Login to chatbot24.ai
      const chatbotData = await loginToChatbot24(formData.email, formData.password);
      
      console.log("✅ Chatbot24.ai login successful!");
      console.log("Access Token:", chatbotData.accessToken.substring(0, 30) + "...");
      console.log("Login Token:", chatbotData.loginToken.substring(0, 30) + "...");
      console.log("GUID:", chatbotData.guid);

      // Store chatbot data
      localStorage.setItem("chatbotAccessToken", chatbotData.accessToken);
      localStorage.setItem("chatbotLoginToken", chatbotData.loginToken);
      localStorage.setItem("chatbotGuid", chatbotData.guid);
      localStorage.setItem("chatbotRole", chatbotData.role);
      localStorage.setItem("chatbotWorkspace", JSON.stringify(chatbotData.defaultWorkspace));

      console.log("🏠 Step 2: Logging into local system...");
      
      // Step 2: Login to local system
      const localData = await loginToLocalAPI(formData.email, formData.password);
      
      console.log("✅ Local login response received");

      // Handle local login response
      let authToken = localData.token;
      let userData = localData.user || {};

      if (!authToken) {
        console.warn("⚠️ No token from local API, but continuing with chatbot login...");
        // We can continue even without local token since chatbot login succeeded
        authToken = chatbotData.accessToken; // Fallback to chatbot token
      }

      // Store credentials
      localStorage.setItem("authToken", authToken);
      localStorage.setItem("userData", JSON.stringify({
        id: userData.id || "",
        email: userData.email || formData.email,
        name: userData.name || formData.email.split('@')[0],
        role: userData.role || "user",
        chatbotGuid: chatbotData.guid,
        chatbotRole: chatbotData.role
      }));
      localStorage.setItem("externalUserEmail", formData.email);
      localStorage.setItem("externalUserPassword", formData.password);

      console.log("🔌 Step 3: Establishing WebSocket connection with chatbot24.ai token...");
      
      // Step 3: Establish WebSocket connection using chatbot24.ai token
      // First try with loginToken (seems to be for WebSocket based on expiration time)
      // If that fails, try with accessToken
      let ws = null;
      let wsTokenToUse = chatbotData.loginToken; // Start with loginToken
      
      console.log("Trying WebSocket with loginToken...");
      ws = connectWebSocket(chatbotData.loginToken, chatbotData.guid);
      
      if (!ws) {
        console.log("Trying WebSocket with accessToken...");
        ws = connectWebSocket(chatbotData.accessToken, chatbotData.guid);
      }
      
      if (ws) {
        console.log("✅ WebSocket connection initiated");
        // Store which token worked
        localStorage.setItem('websocketTokenUsed', wsTokenToUse === chatbotData.loginToken ? 'loginToken' : 'accessToken');
      } else {
        console.warn("⚠️ WebSocket connection failed, but login was successful");
      }

      // Store remember me preference
      if (formData.rememberMe) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("savedEmail", formData.email);
      } else {
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("savedEmail");
      }

      // Navigate to dashboard
      console.log("🚀 Redirecting to dashboard...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);

    } catch (err: any) {
      console.error("❌ Login error:", err);
      
      let errorMessage = err.message || "Login failed. Please try again.";
      
      // Provide user-friendly error messages
      if (errorMessage.includes("Chatbot login failed")) {
        if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
          errorMessage = "Invalid email or password for chatbot service";
        } else if (errorMessage.includes("Network")) {
          errorMessage = "Cannot connect to chatbot service. Please check your internet connection.";
        }
      } else if (errorMessage.includes("Local login failed")) {
        errorMessage = "Local authentication failed. Using chatbot service only.";
        // We can still continue if chatbot login succeeded
      }
      
      setError(errorMessage);
      
      // Partial cleanup - keep chatbot data if that succeeded
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) handleLogin();
  };

  // Load saved email on component mount
  useState(() => {
    if (typeof window !== 'undefined') {
      const rememberMe = localStorage.getItem("rememberMe");
      const savedEmail = localStorage.getItem("savedEmail");
      
      if (rememberMe === "true" && savedEmail) {
        setFormData(prev => ({
          ...prev,
          email: savedEmail,
          rememberMe: true
        }));
      }
    }
  });

  return (
    <div className="min-h-screen flex flex-row-reverse bg-[#0A0F1C]">
      {/* Left Side - Logo and Login Form */}
      <div className="flex-1 flex justify-center items-center px-12 lg:px-24 py-12">
        {/* Login Form */}
        <div className="max-w-md w-full">
          {/* Logo Section */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-[#60A5FB] to-[#3B82F6] bg-clip-text text-transparent">
                Chatbot
              </span>
            </div>
            <p className="text-gray-400 text-sm">Intelligent Image Enhancement</p>
          </div>
          
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-white mb-3">Welcome Back!</h2>
            <p className="text-[#94A3B8] text-lg">
              Sign in to continue your creative journey
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm backdrop-blur-sm">
              <div className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className="w-full p-4 bg-[#1A2028] border border-[#2D3748] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#60A5FB] focus:border-transparent transition-all duration-200 disabled:opacity-50"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className="w-full p-4 bg-[#1A2028] border border-[#2D3748] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#60A5FB] focus:border-transparent transition-all duration-200 disabled:opacity-50"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <label className="flex items-center group cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="w-5 h-5 appearance-none bg-[#1A2028] border-2 border-[#4A5568] rounded checked:bg-[#60A5FB] checked:border-[#60A5FB] transition-all duration-200 disabled:opacity-50"
                    disabled={isLoading}
                  />
                  <svg
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white pointer-events-none opacity-0 checked:opacity-100 transition-opacity duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="ml-3 text-sm text-gray-300 group-hover:text-white transition-colors">
                  Remember Me
                </span>
              </label>
              <button
                onClick={() => router.push("/forgot-password")}
                className="text-sm text-[#60A5FB] hover:text-[#3B82F6] transition-colors cursor-pointer disabled:opacity-50"
                disabled={isLoading}
              >
                Forgot Password?
              </button>
            </div>

            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#60A5FB] to-[#3B82F6] text-white py-4 rounded-xl font-bold cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center group"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  Signing In...
                </>
              ) : (
                <span className="group-hover:scale-105 transition-transform duration-200">
                  Sign In
                </span>
              )}
            </button>

            {/* Register Link */}
            <div className="text-center pt-4">
              <p className="text-gray-400 text-sm">
                Don't have an account?{" "}
                <button
                  onClick={() => router.push("/register")}
                  className="text-[#60A5FB] hover:text-[#3B82F6] font-semibold transition-colors cursor-pointer"
                >
                  Create Account
                </button>
              </p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-[#2D3748]">
            <div className="text-center text-gray-400 text-sm">
              <p>© 2025 Chatbot AI. All rights reserved.</p>
              <p className="mt-2">
                <button className="text-[#60A5FB] hover:text-[#3B82F6] transition-colors cursor-pointer">
                  Terms & Conditions
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="flex-1 hidden lg:flex relative bg-gradient-to-br from-[#1E3A8A] to-[#0F172A]">
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
        <div className="absolute inset-0 flex items-center justify-center p-12 z-20">
          <div className="text-center text-white max-w-lg">
            <h3 className="text-3xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Transform Your Images with AI
            </h3>
            <p className="text-gray-300 text-lg leading-relaxed">
              Experience the power of artificial intelligence to enhance, edit, and perfect your photos with just one click.
            </p>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-[#60A5FB] rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-1/3 left-1/3 w-24 h-24 bg-[#3B82F6] rounded-full blur-2xl opacity-30 animate-pulse delay-1000" />
      </div>
    </div>
  );
}