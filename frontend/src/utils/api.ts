import { useAuthStore } from '../store/authStore';

const API_BASE_URL = 'http://localhost:5000/api';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('mero_token') : null;
  
  const headers = new Headers(options.headers || {});
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (response.status === 401) {
    // Attempt token refresh or logout
    if (typeof window !== 'undefined') {
      const refresh = localStorage.getItem('mero_refresh_token');
      if (refresh) {
        try {
          const refRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: refresh }),
          });
          if (refRes.ok) {
            const data = await refRes.json();
            localStorage.setItem('mero_token', data.accessToken);
            if (data.refreshToken) {
              localStorage.setItem('mero_refresh_token', data.refreshToken);
            }
            // Retry request
            headers.set('Authorization', `Bearer ${data.accessToken}`);
            const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
            if (retryResponse.ok) return retryResponse.json();
          }
        } catch (e) {
          console.error('Failed to auto-refresh token', e);
        }
      }
      
      // If refresh fails or doesn't exist
      useAuthStore.getState().logout();
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }

  return response.json();
}
