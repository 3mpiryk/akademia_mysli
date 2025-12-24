import React, { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
import { AppointmentStatus, type Appointment, type Bill, type Prescription, type Service, type User, UserRole } from '../types';
import { AppStore, type DoctorStatsItem, type PendingBookingData, type SeedData } from '../core/AppStore';

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

interface AppContextType {
  user: User | null;
  login: (email: string, pass: string) => User | null;
  logout: () => void;
  register: (name: string, email: string, pass: string) => void;
  services: Service[];
  appointments: Appointment[];
  bills: Bill[];
  prescriptions: Prescription[];
  bookAppointment: (doctorId: string, serviceId: string, date: string, patientId?: string) => void;
  doctors: User[];
  createBill: (apptId: string, amount: number) => void;
  getDoctorStats: (doctorId: string) => DoctorStatsItem[];
  setPendingBooking: (data: PendingBookingData | null) => void;
  pendingBooking: PendingBookingData | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const createSeedData = (): SeedData => ({
  appointments: [
    { id: 'a1', patientId: 'p1', doctorId: 'd1', serviceId: 's1', date: new Date(Date.now() - 86400000).toISOString(), status: AppointmentStatus.COMPLETED },
    { id: 'a2', patientId: 'p1', doctorId: 'd2', serviceId: 's2', date: new Date(Date.now() + 86400000).toISOString(), status: AppointmentStatus.SCHEDULED }
  ],
  bills: [
    { id: 'b1', appointmentId: 'a1', patientId: 'p1', amount: 250, isPaid: false, issuedDate: new Date().toISOString() }
  ],
  prescriptions: [
    { id: 'rx1', patientId: 'p1', doctorId: 'd1', medications: ['Hydroksyzyna 10mg'], code: '4455', issuedDate: new Date().toISOString(), expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }
  ]
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = useMemo(() => new AppStore({
    users: MOCK_USERS,
    services: MOCK_SERVICES,
    seed: createSeedData()
  }), []);

  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);

  const contextValue = useMemo<AppContextType>(() => ({
    ...state,
    login: store.login,
    logout: store.logout,
    register: store.register,
    bookAppointment: store.bookAppointment,
    createBill: store.createBill,
    getDoctorStats: store.getDoctorStats,
    setPendingBooking: store.setPendingBooking,
  }), [state, store]);

  return (
    <AppContext.Provider value={contextValue}>
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
