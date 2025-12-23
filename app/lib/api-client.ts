// app/lib/api-client.ts (with context support)
import { ApiError } from '@/app/lib/errors';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface ApiClientOptions extends RequestInit {
  requiresAuth?: boolean;
  token?: string | null; // Pass token explicitly from context
}

export async function apiClient<T = any>(
  endpoint: string, 
  options?: ApiClientOptions
): Promise<T> {
  const { requiresAuth = false, token, ...fetchOptions } = options || {};
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions?.headers as Record<string, string>),
  };
  
  // Use provided token or fall back to localStorage
  const authToken = token ?? (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  } else if (requiresAuth) {
    throw new Error('Authentication required');
  }
  
  const res = await fetch(url, {
    ...fetchOptions,
    headers,
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ 
      message: res.statusText 
    }));
    
    throw new ApiError(
      res.status, 
      error.message || 'Something went wrong',
      error
    );
  }
  
  if (res.status === 204) return null as T;
  return res.json();
}