import { getClerkToken } from './token-store';
import type { Spirit, CollectionEntry, WishlistEntry, Rating, TasteProfile, PaginatedResponse } from '@pour/shared';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';

async function getAuthToken(): Promise<string | null> {
  return getClerkToken();
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
    autocomplete: (q: string) =>
      request<{ spirits: Array<{ id: string; name: string; distilleryName?: string; imageUrl?: string; avgRating: number }>; distilleries: Array<{ name: string }> }>(
        `/search/autocomplete?q=${encodeURIComponent(q)}`
      ),
    browse: (filters: { category?: string; region?: string; abv_min?: number; abv_max?: number; rating_min?: number; age_min?: number; sort?: string; page?: number }) => {
      const params = new URLSearchParams();
      if (filters.category) params.set('category', filters.category);
      if (filters.region) params.set('region', filters.region);
      if (filters.abv_min != null) params.set('abv_min', String(filters.abv_min));
      if (filters.abv_max != null) params.set('abv_max', String(filters.abv_max));
      if (filters.rating_min != null) params.set('rating_min', String(filters.rating_min));
      if (filters.age_min != null) params.set('age_min', String(filters.age_min));
      if (filters.sort) params.set('sort', filters.sort);
      if (filters.page) params.set('page', String(filters.page));
      return request<{ data: Spirit[]; total: number; page: number; perPage: number; facets: unknown[] }>(`/spirits/browse?${params}`);
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
