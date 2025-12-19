import { Appointment, Assessment, Evolution, LoginResponse, Patient } from '../types';

const API_URL = 'http://65.21.48.34:3000';

// --- MOCK DATA FOR OFFLINE MODE ---
const MOCK_USER = { id: 1, name: 'Admin Demo', email: 'admin@demo.com', role: 'admin' };
let mockPatients: Patient[] = [
    { id: 1, name: 'Maria Silva (Demo)', cpf: '123.456.789-00', phone: '(11) 99999-9999', birthDate: '1985-05-20', status: 'active' },
    { id: 2, name: 'João Santos (Demo)', cpf: '987.654.321-11', phone: '(21) 98888-8888', birthDate: '1990-10-10', status: 'active' },
    { id: 3, name: 'Ana Costa (Alta)', cpf: '456.789.123-22', phone: '(31) 97777-7777', birthDate: '1980-01-15', status: 'archived' }
];
let mockAppointments: Appointment[] = [];
// Store assessments/evolutions in memory for the session
const mockDb: any = {
    assessments: {},
    evolutions: {}
};

const getHeaders = () => {
  const token = localStorage.getItem('fisio_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

const handleResponse = async (response: Response) => {
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('fisio_token');
    localStorage.removeItem('fisio_user');
    window.location.reload();
    throw new Error('Sessão expirada');
  }
  
  const contentType = response.headers.get("content-type");
  let data;
  if (contentType && contentType.indexOf("application/json") !== -1) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMessage = (typeof data === 'object' && data.error) ? data.error : 'Ocorreu um erro na requisição';
    throw new Error(errorMessage);
  }
  return data;
};

// Helper to attempt fetch, fallback to mock if failed (Network error)
async function request<T>(fn: () => Promise<T>, fallback: () => Promise<T> | T): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        // If it's a network error (Failed to fetch), use fallback
        if (error.message === 'Failed to fetch' || error.message.includes('NetworkError') || error.name === 'TypeError') {
            console.warn(`API Unreachable at ${API_URL}. Using Mock Data fallback.`);
            return await fallback();
        }
        throw error;
    }
}

export const api = {
  login: async (identifier: string, password: string): Promise<LoginResponse> => {
    return request<LoginResponse>(
        async () => {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password }),
            });
            return handleResponse(res);
        },
        () => {
             // Mock Login
             return new Promise<LoginResponse>(resolve => setTimeout(() => {
                 resolve({ token: 'mock-token-123', user: MOCK_USER });
             }, 800));
        }
    );
  },

  getPatients: async (): Promise<Patient[]> => {
    return request(
        async () => {
            const res = await fetch(`${API_URL}/api/patients`, { headers: getHeaders() });
            return handleResponse(res);
        },
        () => Promise.resolve([...mockPatients])
    );
  },

  createPatient: async (data: Partial<Patient>): Promise<Patient> => {
     return request(
        async () => {
            const res = await fetch(`${API_URL}/api/patients`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return handleResponse(res);
        },
        () => {
            const newPatient = { ...data, id: Date.now(), status: 'active' } as Patient;
            mockPatients.push(newPatient);
            return Promise.resolve(newPatient);
        }
    );
  },

  updatePatient: async (id: number, data: Partial<Patient>): Promise<Patient> => {
    return request(
        async () => {
            const res = await fetch(`${API_URL}/api/patients/${id}`, {
                method: 'PATCH', 
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return handleResponse(res);
        },
        () => {
            const index = mockPatients.findIndex(p => p.id === id);
            if (index >= 0) {
                mockPatients[index] = { ...mockPatients[index], ...data };
                return Promise.resolve(mockPatients[index]);
            }
            throw new Error('Patient not found in mock');
        }
    );
  },

  getAssessment: async (patientId: number): Promise<Assessment | null> => {
    return request(
        async () => {
            const res = await fetch(`${API_URL}/api/patients/${patientId}/assessment`, { headers: getHeaders() });
            if (res.status === 404) return null;
            return handleResponse(res);
        },
        () => Promise.resolve(mockDb.assessments[patientId] || null)
    );
  },

  saveAssessment: async (patientId: number, data: Partial<Assessment>): Promise<Assessment> => {
    return request(
        async () => {
            const res = await fetch(`${API_URL}/api/patients/${patientId}/assessment`, {
                method: 'POST', 
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return handleResponse(res);
        },
        () => {
            const newAssessment = { ...data, patientId, id: Date.now() } as Assessment;
            mockDb.assessments[patientId] = newAssessment;
            return Promise.resolve(newAssessment);
        }
    );
  },

  getEvolutions: async (patientId: number): Promise<Evolution[]> => {
    return request(
        async () => {
            const res = await fetch(`${API_URL}/api/patients/${patientId}/evolutions`, { headers: getHeaders() });
            return handleResponse(res);
        },
        () => Promise.resolve(mockDb.evolutions[patientId] || [])
    );
  },

  createEvolution: async (patientId: number, data: Partial<Evolution>): Promise<Evolution> => {
    return request(
        async () => {
            const res = await fetch(`${API_URL}/api/patients/${patientId}/evolutions`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return handleResponse(res);
        },
        () => {
            const newEvo = { ...data, patientId, id: Date.now() } as Evolution;
            if (!mockDb.evolutions[patientId]) mockDb.evolutions[patientId] = [];
            mockDb.evolutions[patientId].unshift(newEvo);
            return Promise.resolve(newEvo);
        }
    );
  },

  getAppointmentsRange: async (startDate: string, endDate: string): Promise<Appointment[]> => {
    return request(
        async () => {
            const res = await fetch(`${API_URL}/api/appointments?startDate=${startDate}&endDate=${endDate}`, { headers: getHeaders() });
            const data = await handleResponse(res);
            if (Array.isArray(data)) {
                return data.sort((a: Appointment, b: Appointment) => {
                   if (a.date !== b.date) return a.date.localeCompare(b.date);
                   return a.time.localeCompare(b.time);
                });
            }
            return [];
        },
        () => {
             // Filter mock appointments by date range
             const start = new Date(startDate);
             const end = new Date(endDate);
             const filtered = mockAppointments.filter(app => {
                 const d = new Date(app.date);
                 return d >= start && d <= end;
             });
             return Promise.resolve(filtered.sort((a, b) => {
                 if (a.date !== b.date) return a.date.localeCompare(b.date);
                 return a.time.localeCompare(b.time);
             }));
        }
    );
  },

  createAppointment: async (data: Partial<Appointment>): Promise<Appointment> => {
    return request(
        async () => {
            const res = await fetch(`${API_URL}/api/appointments`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return handleResponse(res);
        },
        () => {
            const newApp = { ...data, id: Date.now() } as Appointment;
            mockAppointments.push(newApp);
            return Promise.resolve(newApp);
        }
    );
  },

  deleteAppointment: async (id: number): Promise<void> => {
    return request(
        async () => {
            const res = await fetch(`${API_URL}/api/appointments/${id}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Erro ao deletar');
        },
        () => {
            mockAppointments = mockAppointments.filter(a => a.id !== id);
            return Promise.resolve();
        }
    );
  }
};