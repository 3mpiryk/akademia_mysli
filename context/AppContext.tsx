import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Appointment, Service, Bill, Prescription, UserRole, AppointmentStatus } from '../types';

// --- MOCK DATA ---
const MOCK_SERVICES: Service[] = [
  {
    id: 's1',
    name: 'Psychiatria Dzieci i Młodzieży',
    description: 'Kompleksowa diagnoza i leczenie zaburzeń psychicznych u młodych pacjentów. Skupiamy się na biologicznym i psychospołecznym podłożu trudności.',
    price: 250,
    durationMinutes: 45,
    iconName: 'Brain'
  },
  {
    id: 's2',
    name: 'Psychoterapia Indywidualna',
    description: 'Bezpieczna przestrzeń do pracy nad emocjami, lękami i trudnościami w relacjach. Terapia dostosowana do etapu rozwojowego dziecka.',
    price: 180,
    durationMinutes: 50,
    iconName: 'MessageCircleHeart'
  },
  {
    id: 's3',
    name: 'Terapia z Seksuologiem',
    description: 'Wsparcie w zakresie dojrzewania, tożsamości płciowej i edukacji seksualnej. Dyskretna i pełna akceptacji atmosfera.',
    price: 200,
    durationMinutes: 50,
    iconName: 'HeartHandshake'
  },
  {
    id: 's4',
    name: 'Konsultacja Neurologiczna',
    description: 'Diagnostyka układu nerwowego, bólów głowy, tików i zaburzeń neurorozwojowych. Nowoczesne podejście medyczne.',
    price: 220,
    durationMinutes: 30,
    iconName: 'Activity'
  },
  {
    id: 's5',
    name: 'Felinoterapia (Zajęcia Grupowe)',
    description: 'Terapeutyczne zajęcia z udziałem kotów. Doskonałe dla dzieci z autyzmem, ADHD i zaburzeniami lękowymi. Uczy empatii i wycisza.',
    price: 100,
    durationMinutes: 60,
    iconName: 'Cat'
  },
  {
    id: 's6',
    name: 'Dogoterapia (Zajęcia Grupowe)',
    description: 'Zajęcia ruchowe i edukacyjne z psami terapeutycznymi. Wspierają rozwój motoryczny i społeczny dziecka.',
    price: 100,
    durationMinutes: 60,
    iconName: 'Dog'
  }
];

const MOCK_USERS: User[] = [
  { id: 'p1', email: 'pacjent@test.pl', name: 'Jan Kowalski', role: UserRole.PATIENT, password: 'password' },
  { id: 'd1', email: 'doktor@test.pl', name: 'Dr Anna Nowak', role: UserRole.DOCTOR, password: 'password', specialization: 'Psychiatra' },
  { id: 'd2', email: 'terapeuta@test.pl', name: 'Mgr Piotr Zieliński', role: UserRole.DOCTOR, password: 'password', specialization: 'Psychoterapeuta' }
];

interface PendingBookingData {
  doctorId: string;
  serviceId: string;
  date: string;
}

interface AppContextType {
  user: User | null;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  register: (name: string, email: string, pass: string) => void;
  services: Service[];
  appointments: Appointment[];
  bills: Bill[];
  prescriptions: Prescription[];
  bookAppointment: (doctorId: string, serviceId: string, date: string, patientId?: string) => void;
  doctors: User[];
  createBill: (apptId: string, amount: number) => void;
  getDoctorStats: (doctorId: string) => any;
  setPendingBooking: (data: PendingBookingData | null) => void;
  pendingBooking: PendingBookingData | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [pendingBooking, setPendingBooking] = useState<PendingBookingData | null>(null);

  // Seed initial data simulation
  useEffect(() => {
    // Fake some past data
    setAppointments([
      { id: 'a1', patientId: 'p1', doctorId: 'd1', serviceId: 's1', date: new Date(Date.now() - 86400000).toISOString(), status: AppointmentStatus.COMPLETED },
      { id: 'a2', patientId: 'p1', doctorId: 'd2', serviceId: 's2', date: new Date(Date.now() + 86400000).toISOString(), status: AppointmentStatus.SCHEDULED }
    ]);
    setBills([
      { id: 'b1', appointmentId: 'a1', patientId: 'p1', amount: 250, isPaid: false, issuedDate: new Date().toISOString() }
    ]);
    setPrescriptions([
        { id: 'rx1', patientId: 'p1', doctorId: 'd1', medications: ['Hydroksyzyna 10mg'], code: '4455', issuedDate: new Date().toISOString(), expiryDate: new Date(Date.now() + 30*24*60*60*1000).toISOString() }
    ]);
  }, []);

  const bookAppointment = (doctorId: string, serviceId: string, date: string, patientId?: string) => {
    const pId = patientId || user?.id;
    if (!pId) return;

    const newAppt: Appointment = {
      id: `a${Math.random().toString(36).substr(2, 9)}`,
      patientId: pId,
      doctorId,
      serviceId,
      date,
      status: AppointmentStatus.SCHEDULED
    };
    setAppointments(prev => [...prev, newAppt]);
  };

  const login = (email: string, pass: string) => {
    const found = MOCK_USERS.find(u => u.email === email && u.password === pass);
    if (found) {
      setUser(found);
      
      // AUTO-BOOKING LOGIC
      if (pendingBooking) {
        bookAppointment(pendingBooking.doctorId, pendingBooking.serviceId, pendingBooking.date, found.id);
        setPendingBooking(null);
      }
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  const register = (name: string, email: string, pass: string) => {
    // In a real app, check for email duplicates
    const newUser: User = {
      id: `p${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      password: pass,
      role: UserRole.PATIENT
    };
    setUser(newUser);

    // AUTO-BOOKING LOGIC
    if (pendingBooking) {
      bookAppointment(pendingBooking.doctorId, pendingBooking.serviceId, pendingBooking.date, newUser.id);
      setPendingBooking(null);
    }
  };

  const createBill = (apptId: string, amount: number) => {
    const appt = appointments.find(a => a.id === apptId);
    if (!appt) return;
    const newBill: Bill = {
        id: `b${Math.random().toString(36).substr(2, 9)}`,
        appointmentId: apptId,
        patientId: appt.patientId,
        amount,
        isPaid: false,
        issuedDate: new Date().toISOString()
    };
    setBills(prev => [...prev, newBill]);
  };

  const getDoctorStats = (doctorId: string) => {
    const doctorAppts = appointments.filter(a => a.doctorId === doctorId);
    const completed = doctorAppts.filter(a => a.status === AppointmentStatus.COMPLETED).length;
    const scheduled = doctorAppts.filter(a => a.status === AppointmentStatus.SCHEDULED).length;
    return [
        { name: 'Zakończone', value: completed },
        { name: 'Zaplanowane', value: scheduled },
    ];
  };

  const doctors = MOCK_USERS.filter(u => u.role === UserRole.DOCTOR);

  return (
    <AppContext.Provider value={{
      user, login, logout, register,
      services: MOCK_SERVICES,
      appointments,
      bills,
      prescriptions,
      bookAppointment,
      doctors,
      createBill,
      getDoctorStats,
      setPendingBooking,
      pendingBooking
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};