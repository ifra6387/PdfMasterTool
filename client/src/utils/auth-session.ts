// Simple session management utilities for Replit authentication

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
  };
  token: string;
  timestamp: number;
}

export const SESSION_KEY = 'pdf_auth_session';
export const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Save authentication session to localStorage
 */
export function saveAuthSession(user: any, token: string): void {
  const session: AuthSession = {
    user,
    token,
    timestamp: Date.now()
  };
  
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem('token', token); // For backward compatibility
}

/**
 * Get authentication session from localStorage
 */
export function getAuthSession(): AuthSession | null {
  try {
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (!sessionData) return null;
    
    const session: AuthSession = JSON.parse(sessionData);
    
    // Check if session is expired
    if (Date.now() - session.timestamp > SESSION_DURATION) {
      clearAuthSession();
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error getting auth session:', error);
    clearAuthSession();
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const session = getAuthSession();
  return session !== null;
}

/**
 * Clear all authentication data
 */
export function clearAuthSession(): void {
  // Clear localStorage
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('token');
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  localStorage.removeItem('supabase_session');
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  // Clear cookies
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  });
}

/**
 * Call backend logout endpoint
 */
export async function logoutFromServer(): Promise<void> {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthSession()?.token || ''}`
      }
    });
    
    if (!response.ok) {
      console.warn('Backend logout failed, proceeding with client-side cleanup');
    }
  } catch (error) {
    console.warn('Backend logout error:', error);
  }
}