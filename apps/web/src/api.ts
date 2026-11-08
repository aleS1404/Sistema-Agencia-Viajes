import type { ApiList, Booking, Complaint, Policy, Profile, Provider, ReportSummary, Service, User } from './types';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown };

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function token() {
  return localStorage.getItem('agencia_token');
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const payload = response.status === 204 ? undefined : await response.json().catch(() => undefined);
  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && 'message' in payload && String(payload.message)) ||
      'No se pudo completar la operación.';
    throw new ApiError(message, response.status, payload);
  }
  return payload as T;
}

function listData<T>(payload: T[] | ApiList<T>): T[] {
  return Array.isArray(payload) ? payload : payload.data;
}

export function normalizeService(raw: Record<string, unknown>): Service {
  const interests = Array.isArray(raw.interests)
    ? raw.interests
    : String(raw.interests ?? '').split(',').filter(Boolean).map((name, index) => ({ id: index + 1, code: name.trim().toUpperCase(), name: name.trim() }));
  const explanation = Array.isArray(raw.explanation)
    ? raw.explanation as string[]
    : String(raw.explanation ?? '').split(';').map((item) => item.trim()).filter(Boolean);
  return {
    ...(raw as unknown as Service),
    priceBob: Number(raw.priceBob ?? 0),
    durationDays: Number(raw.durationDays ?? 0),
    capacity: Number(raw.capacity ?? 0),
    status: String(raw.status ?? 'available') as Service['status'],
    destination: raw.destination && typeof raw.destination === 'object'
      ? raw.destination as Service['destination']
      : { id: Number(raw.destinationId ?? 0), city: String(raw.city ?? 'Bolivia'), department: String(raw.department ?? ''), country: 'Bolivia' },
    category: raw.category && typeof raw.category === 'object'
      ? raw.category as Service['category']
      : { id: Number(raw.categoryId ?? 0), code: '', name: String(raw.category ?? 'Servicio') },
    provider: raw.provider && typeof raw.provider === 'object'
      ? raw.provider as Service['provider']
      : { id: Number(raw.providerId ?? 0), tradeName: String(raw.provider ?? 'Proveedor') },
    interests,
    explanation,
  };
}

async function metadata() {
  return request<{
    destinations: Array<{ id: number; city: string; department: string; country: string }>;
    categories: Array<{ id: number; code: string; name: string }>;
    interests: Array<Profile['interests'][number]>;
  }>('/catalog/metadata');
}

export const api = {
  login: (email: string, password: string) =>
    request<{ accessToken: string; user: User }>('/auth/login', { method: 'POST', body: { email, password } }),
  register: (body: Record<string, unknown>) =>
    request<{ accessToken: string; user: User }>('/auth/register', { method: 'POST', body }),
  me: () => request<User>('/auth/me'),
  updateMe: (body: Partial<User>) => request<User>('/auth/me', { method: 'PATCH', body }),
  profile: () => request<Profile>('/auth/me'),
  updateProfile: (body: Partial<Profile> & { interestIds?: number[] }) =>
    request<Profile>('/auth/me', { method: 'PATCH', body }),
  interests: async () => (await metadata()).interests,

  services: async (query = '') => {
    if (query.includes('mine=true')) {
      return (await request<Array<Record<string, unknown>>>('/provider/services')).map(normalizeService);
    }
    const params = new URLSearchParams(query.replace(/^\?/, ''));
    if (params.has('search')) { params.set('q', params.get('search') || ''); params.delete('search'); }
    const suffix = params.toString() ? `?${params}` : '';
    return (await request<Array<Record<string, unknown>>>(`/catalog/services${suffix}`)).map(normalizeService);
  },
  service: async (id: number) => normalizeService(await request<Record<string, unknown>>(`/catalog/services/${id}`)),
  createService: (body: Partial<Service>) => request<Service>('/services', { method: 'POST', body }),
  updateService: (id: number, body: Partial<Service>) => request<Service>(`/services/${id}`, { method: 'PATCH', body }),
  recommendations: async () => (await request<Array<Record<string, unknown>>>('/recommendations')).map(normalizeService),
  categories: async () => (await metadata()).categories,
  destinations: async () => (await metadata()).destinations,

  bookings: async () => listData(await request<Booking[] | ApiList<Booking>>('/bookings')),
  booking: (id: number) => request<Booking>(`/bookings/${id}`),
  createBooking: (body: { items: Array<{ serviceId: number; quantity: number; serviceDate: string }> }) =>
    request<Booking>('/bookings', { method: 'POST', body }),
  pay: (bookingId: number, body: { method: string; amount?: number }) =>
    request(`/bookings/${bookingId}/payments`, { method: 'POST', body: { method: body.method, result: 'approved' } }),
  cancel: (bookingId: number, reason: string) =>
    request(`/bookings/${bookingId}/cancellations`, { method: 'POST', body: { reason } }),
  requestRefund: (bookingId: number, reason: string) =>
    request(`/bookings/${bookingId}/refunds`, { method: 'POST', body: { reason } }),

  complaints: async () => listData(await request<Complaint[] | ApiList<Complaint>>('/complaints')),
  createComplaint: (body: Pick<Complaint, 'subject' | 'description'> & { bookingId?: number }) =>
    request<Complaint>('/complaints', { method: 'POST', body }),
  updateComplaint: (id: number, body: Partial<Pick<Complaint, 'status' | 'resolution'>>) =>
    request<Complaint>(`/support/complaints/${id}`, { method: 'PATCH', body }),

  users: async () => listData(await request<User[] | ApiList<User>>('/admin/users')),
  updateUser: (id: number, body: Partial<Pick<User, 'status' | 'role'>>) =>
    request<User>(`/admin/users/${id}`, { method: 'PATCH', body }),
  providers: async () => listData(await request<Provider[] | ApiList<Provider>>('/providers')),
  createProvider: (body: Partial<Provider>) => request<Provider>('/admin/providers', { method: 'POST', body }),
  updateProvider: (id: number, body: Partial<Provider>) => request<Provider>(`/providers/${id}`, { method: 'PATCH', body }),
  policies: async () => (await request<Array<Record<string, unknown>>>('/policies')).map((row) => ({
    ...(row as unknown as Policy),
    cancellationHours: Number(row.minimumHoursBeforeService ?? row.cancellationHours ?? 0),
    refundPercentage: Number(row.refundPercentage ?? 0),
    active: Boolean(row.active),
  })),
  createPolicy: (body: Partial<Policy>) => request<Policy>('/admin/policies', { method: 'POST', body }),
  updatePolicy: (id: number, body: Partial<Policy>) => request<Policy>(`/policies/${id}`, { method: 'PATCH', body }),
  reportSummary: () => request<ReportSummary>('/admin/reports'),
  supportCancellations: () => request<Array<Record<string, unknown>>>('/support/cancellations'),
  resolveCancellation: (id: number, status: 'approved' | 'rejected') =>
    request(`/support/cancellations/${id}`, { method: 'PATCH', body: { status } }),
  approveRefund: (id: number, amount: number) =>
    request(`/support/cancellations/${id}/refunds`, { method: 'POST', body: { amount } }),
};

export { API_URL };
