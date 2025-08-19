import { useState } from 'react';
import { isAuthConfigured } from '@/lib/supabase';

export function EnvironmentInfo() {
  const [isVisible, setIsVisible] = useState(false);
  
  // Only show in development or when explicitly enabled
  if (import.meta.env.PROD && !import.meta.env.VITE_ENABLE_DEBUG) {
    return null;
  }
  
  const envInfo = {
    nodeEnv: import.meta.env.MODE,
    supabaseConfigured: isAuthConfigured(),
    buildTime: new Date().toISOString(),
    apiUrl: import.meta.env.VITE_API_URL || window.location.origin,
    hasLocalStorage: typeof localStorage !== 'undefined',
    userAgent: navigator.userAgent,
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-gray-800 text-white p-2 rounded-full shadow-lg"
        title="Environment Info"
      >
        {isVisible ? '✕' : 'ℹ️'}
      </button>
      
      {isVisible && (
        <div className="absolute bottom-12 right-0 bg-white p-4 rounded-lg shadow-xl border border-gray-200 w-80">
          <h3 className="text-lg font-semibold mb-2">Environment Info</h3>
          <div className="text-xs font-mono bg-gray-100 p-2 rounded overflow-auto max-h-60">
            <pre>{JSON.stringify(envInfo, null, 2)}</pre>
          </div>
          <div className="mt-2 text-right">
            <button
              onClick={() => setIsVisible(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnvironmentInfo;