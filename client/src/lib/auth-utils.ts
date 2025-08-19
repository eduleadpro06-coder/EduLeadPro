// Shared utility for getting the correct redirect URL for authentication
export const getAuthRedirectUrl = (path: string = '/login') => {
  // Use production URL from environment variable if available
  const productionUrl = import.meta.env.VITE_PRODUCTION_URL;
  
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // If we have a production URL configured and we're not on localhost
    if (productionUrl && !hostname.includes('localhost')) {
      return productionUrl + path;
    }
    
    // For Vercel deployments or custom domains
    if (hostname.includes('vercel.app') || !hostname.includes('localhost')) {
      return window.location.origin + path;
    }
  }
  
  // Fallback to current origin or localhost for development
  return typeof window !== 'undefined' ? window.location.origin + path : 'http://localhost:3000' + path;
};