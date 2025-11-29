"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// import { Eye, EyeOff } from "lucide-react";

type LoginFormData = {
  email: string;
  password: string;
  rememberMe: boolean;
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

    // Temporary admin login logic
    if (formData.email === "admin@example.com" && formData.password === "123456789") {
      localStorage.setItem("authToken", "admin-token");
      localStorage.setItem("userData", JSON.stringify({ role: "admin" }));
      if (formData.rememberMe) localStorage.setItem("rememberMe", "true");
      router.push("/dashboard");
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
      // Your API login logic here
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulated API call
      
      // For demo purposes, simulate successful login
      localStorage.setItem("authToken", "demo-token");
      localStorage.setItem("userData", JSON.stringify({ role: "user" }));
      if (formData.rememberMe) localStorage.setItem("rememberMe", "true");
      router.push("/dashboard");
      
    } catch (err: any) {
      setError(err?.error || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) handleLogin();
  };

  return (
    <div className="min-h-screen flex bg-[#0A0F1C]">
      {/* Left Side - Logo and Login Form */}
      <div className="flex-1 flex flex-col justify-center px-12 lg:px-24 py-12">
        {/* Logo Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            {/* <div className="w-10 h-10 bg-gradient-to-r from-[#60A5FB] to-[#3B82F6] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">FS</span>
            </div> */}
            <span className="text-2xl font-bold bg-gradient-to-r from-[#60A5FB] to-[#3B82F6] bg-clip-text text-transparent">
              Chatbot
            </span>
          </div>
          <p className="text-gray-400 text-sm">Intelligent Image Enhancement</p>
        </div>

        {/* Login Form */}
        <div className="max-w-md w-full">
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-white mb-3">Welcome Back!</h2>
            <p className="text-[#94A3B8] text-lg">
              Sign in to continue your creative journey
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm backdrop-blur-sm">
              {error}
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
                  {/* {showPassword ? <EyeOff size={20} /> : <Eye size={20} />} */}
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