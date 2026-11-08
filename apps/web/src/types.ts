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
  recentBookings?: Array<{ date: string; total: number }>;
  topServices?: Array<{ name: string; bookings: number }>;
}

export interface ApiList<T> {
  data: T[];
  total?: number;
}
