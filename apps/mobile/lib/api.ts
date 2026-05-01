import * as SecureStore from 'expo-secure-store';
import type { Spirit, CollectionEntry, WishlistEntry, Rating, TasteProfile, PaginatedResponse } from '@pour/shared';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';

async function getAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync('clerk_token');
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options?.headers,
  };

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error ?? `HTTP ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export const api = {
  spirits: {
    get: (id: string) => request<Spirit & { attributes: Array<{key: string; value: string}> }>(`/spirits/${id}`),
    ratings: (id: string, page = 1) =>
      request<PaginatedResponse<Rating & { user: { displayName: string; avatarUrl: string | null } }>>(
        `/spirits/${id}/ratings?page=${page}`
      ),
  },

  scan: {
    barcode: (barcode: string) => request<{ spirit: Spirit; source: string; confidence: number }>(`/scan?barcode=${encodeURIComponent(barcode)}`),
    ocr: (imageBase64: string) =>
      request<{ spirit: Spirit; source: string; confidence: number; candidateName?: string }>(
        '/scan/ocr', { method: 'POST', body: JSON.stringify({ imageBase64 }) }
      ),
  },

  search: {
    query: (q: string, category?: string, page = 1) => {
      const params = new URLSearchParams({ q, page: String(page) });
      if (category) params.set('category', category);
      return request<{ data: Spirit[]; total: number; page: number; perPage: number }>(`/search?${params}`);
    },
  },

  users: {
    me: () => request<{ id: string; displayName: string; avatarUrl: string | null; tasteProfile: TasteProfile | null }>('/users/me'),
    saveTasteProfile: (quizData: Record<string, unknown>) =>
      request<TasteProfile>('/users/me/taste-profile', { method: 'POST', body: JSON.stringify(quizData) }),
    recommendations: () => request<Array<Spirit & { matchScore: number }>>('/users/me/recommendations'),
  },

  collections: {
    list: () => request<CollectionEntry[]>('/collections'),
    add: (data: { spiritId: string; bottleStatus: string; pricePaid?: number | null; notes?: string | null }) =>
      request<CollectionEntry>('/collections', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { bottleStatus?: string; pricePaid?: number | null; notes?: string | null }) =>
      request<CollectionEntry>(`/collections/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => request<void>(`/collections/${id}`, { method: 'DELETE' }),
  },

  wishlists: {
    list: () => request<WishlistEntry[]>('/wishlists'),
    add: (data: { spiritId: string; targetPrice?: number | null }) =>
      request<WishlistEntry>('/wishlists', { method: 'POST', body: JSON.stringify(data) }),
    remove: (id: string) => request<void>(`/wishlists/${id}`, { method: 'DELETE' }),
  },

  ratings: {
    submit: (data: {
      spiritId: string;
      score: number;
      flavor: { sweet: number; smoke: number; fruit: number; grain: number; spice: number; floral: number; body: number };
      notes?: string | null;
    }) => request<Rating>('/ratings', { method: 'POST', body: JSON.stringify(data) }),
  },
};
