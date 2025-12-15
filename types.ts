export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  ADMIN = 'ADMIN'
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password?: string; // In real app, this is hashed
  specialization?: string; // Only for doctors
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  iconName: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  serviceId: string;
  date: string; // ISO String
  status: AppointmentStatus;
  notes?: string;
}

export interface Bill {
  id: string;
  appointmentId: string;
  patientId: string;
  amount: number;
  isPaid: boolean;
  issuedDate: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  medications: string[];
  code: string;
  issuedDate: string;
  expiryDate: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}