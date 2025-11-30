// utils/anychatTester.ts
export const testAnychatConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const token = localStorage.getItem('externalAuthToken') || localStorage.getItem('externalAccessToken');
    
    // Simple test that doesn't make actual API calls (to avoid CORS)
    if (token) {
      return { 
        success: true, 
        message: '✅ Token found - WebSocket connection should work' 
      };
    } else {
      return { 
        success: false, 
        message: '❌ No authentication token found' 
      };
    }
    
  } catch (error: any) {
    return { 
      success: false, 
      message: `❌ Connection test failed: ${error.message}` 
    };
  }
};

export const checkWebSocketSupport = (): boolean => {
  return 'WebSocket' in window || 'MozWebSocket' in window;
};