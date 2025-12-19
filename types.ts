export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  crefito?: string;
}

export interface Patient {
  id: number;
  name: string;
  cpf?: string;
  phone: string;
  birthDate?: string;
  status: 'active' | 'archived';
  email?: string;
  address?: string;
}

export interface Assessment {
  id?: number;
  patientId: number;
  complaint: string;
  hda?: string;
  hpp?: string;
  painLevel?: number; // 0-10
  vitals?: string;
  respiratory?: string; // Novo
  neurological?: string; // Novo
  functionalTests?: string; // Novo
  inspection?: string;
  rom?: string;
  diagnosis: string;
  ambulation?: string;
  tonus?: string;
  tonusOther?: string;
  treatmentGoal?: string;
  treatmentConduct?: string;
  plan?: string;
  createdAt?: string;
}

export interface Evolution {
  id?: number;
  patientId: number;
  date: string;
  subjective: string;
  objective?: string;
  assessment: string;
  plan?: string;
}

export interface Appointment {
  id: number;
  patientId: number;
  patientName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: string;
  notes?: string;
  status?: string;
  isRecurring?: boolean;
}

export interface LoginResponse {
  token: string;
  user: User;
}