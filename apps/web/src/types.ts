export type Role = 'ADMIN' | 'CUSTOMER' | 'SUPPORT' | 'PROVIDER';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
  status: 'pending' | 'active' | 'blocked' | 'disabled';
}

export interface Profile {
  maxBudgetBob?: number;
  availableDays?: number;
  notes?: string;
  interests: Array<{ id: number; code: string; name: string; weight?: number }>;
}

export interface Service {
  id: number;
  code: string;
  name: string;
  description: string;
  durationDays: number;
  priceBob: number;
  capacity: number;
  status: 'draft' | 'available' | 'unavailable' | 'archived';
  destination?: { id: number; city: string; department: string; country: string };
  category?: { id: number; code: string; name: string };
  provider?: { id: number; code?: string; tradeName: string };
  interests?: Array<{ id: number; code: string; name: string }>;
  score?: number;
  explanation?: string[];
}

export interface BookingItem {
  id: number;
  serviceId: number;
  quantity: number;
  unitPrice: number;
  serviceDate: string;
  service?: Service;
}

export interface Booking {
  id: number;
  code: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'partially_refunded' | 'refunded' | 'completed';
  currency: string;
  totalAmount: number;
  bookedAt: string;
  items?: BookingItem[];
  payments?: Payment[];
}

export interface Payment {
  id: number;
  bookingId: number;
  referenceCode: string;
  method: 'cash' | 'card_simulated' | 'transfer_simulated';
  status: 'pending' | 'approved' | 'rejected' | 'refunded' | 'partially_refunded';
  amount: number;
  paidAt?: string;
}

export interface Complaint {
  id: number;
  code: string;
  bookingId?: number;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  resolution?: string;
  createdAt: string;
  customer?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
}

export interface Provider {
  id: number;
  code: string;
  legalName: string;
  tradeName: string;
  email: string;
  phone?: string;
  status: 'pending' | 'active' | 'suspended';
}

export interface Policy {
  id: number;
  name: string;
  description: string;
  cancellationHours: number;
  refundPercentage: number;
  active: boolean;
}

export interface ReportSummary {
  bookings: number;
  confirmedBookings: number;
  totalRevenueBob: number;
  cancellations: number;
  openComplaints: number;
  activeServices: number;
  totalUsers: number;
  activeUsers: number;
  usersByRole: Partial<Record<Role, number>>;
  recentBookings?: Array<{ date: string; total: number }>;
  topServices?: Array<{ name: string; bookings: number }>;
}

export interface CancellationRisk {
  id: number;
  code: string;
  customer: string;
  email: string;
  status: Booking['status'];
  totalAmount: number;
  daysUntilService: number;
  score: number;
  level: 'low' | 'medium' | 'high';
  factors: string[];
}

export interface AdminDashboard {
  generatedAt: string;
  filters: { dateFrom: string; dateTo: string; destinationId?: number | null; status?: string | null; forecastDays: number };
  kpis: {
    bookings: number;
    confirmedBookings: number;
    revenueBob: number;
    averageTicketBob: number;
    cancellations: number;
    openComplaints: number;
    activeServices: number;
    totalUsers: number;
    activeUsers: number;
  };
  bookingStatus: Array<{ status: string; total: number }>;
  daily: Array<{ date: string; bookings: number; amount: number }>;
  destinationDemand: Array<{ id: number; city: string; bookings: number; travelers: number; amount: number }>;
  topServices: Array<{ id: number; name: string; city: string; bookings: number }>;
  usersByRole: Partial<Record<Role, number>>;
  forecast: {
    model: string;
    history: Array<{ date: string; bookings: number; amount: number }>;
    points: Array<{ date: string; bookings: number; revenueBob: number }>;
    projectedBookings: number;
    projectedRevenueBob: number;
    trend: string;
    slope: number;
    confidence: number;
    disclaimer: string;
  };
  cancellationRisks: CancellationRisk[];
  alerts: Array<{ severity: 'high' | 'medium' | 'info'; title: string; route: string }>;
}

export interface AssistantResponse {
  intent: string;
  answer: string;
  data?: unknown;
  actions: Array<{ label: string; route: string }>;
  suggestedQuestions: string[];
  confidence: number;
  mode: string;
}

export interface ApiList<T> {
  data: T[];
  total?: number;
}
