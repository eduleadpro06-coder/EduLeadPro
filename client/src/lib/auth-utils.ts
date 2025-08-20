// Shared utility for getting the correct redirect URL for authentication
export const getAuthRedirectUrl = (path: string = '/auth/callback') => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const port = window.location.port;
    const protocol = window.location.protocol;
    
    // For local development (localhost or 127.0.0.1)
    if (hostname.includes('localhost') || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}${port ? ':' + port : ''}${path}`;
    }
    
    // For production or deployed environments
    return `${window.location.origin}${path}`;
  }
  
  // Fallback for server-side rendering
  return `http://localhost:5000${path}`;
};