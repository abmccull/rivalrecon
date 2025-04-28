// Auth Debug Script
// This script helps diagnose authentication issues by monitoring localStorage and cookies
(function() {
  console.log('[Auth Debug] Script loaded');
  
  // Check auth state periodically
  const checkInterval = setInterval(() => {
    // Look for Supabase auth data in localStorage
    const authKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('sb-') && key.includes('auth')
    );
    
    const hasLocalStorageAuth = authKeys.length > 0;
    console.log('[Auth Debug] Auth data in localStorage:', hasLocalStorageAuth);
    
    if (hasLocalStorageAuth) {
      const key = authKeys[0];
      try {
        const authData = JSON.parse(localStorage.getItem(key) || '{}');
        console.log('[Auth Debug] Has valid session:', !!authData?.access_token);
      } catch (e) {
        console.log('[Auth Debug] Error parsing auth data:', e);
      }
    }
    
    // Check for auth cookies
    const hasCookies = document.cookie.split(';').some(cookie => 
      cookie.trim().startsWith('sb-') || cookie.includes('supabase-auth')
    );
    console.log('[Auth Debug] Auth cookies present:', hasCookies);
    
    // Log current path
    console.log('[Auth Debug] Current path:', window.location.pathname);
  }, 3000);
  
  // Clean up after 1 minute to avoid console spam
  setTimeout(() => {
    clearInterval(checkInterval);
    console.log('[Auth Debug] Auth monitoring stopped');
  }, 60000);
})(); 