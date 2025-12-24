import { AppointmentStatus, type Appointment, type Bill, type Prescription, type Service, type User, UserRole } from '../types';

export type DoctorStatsItem = {
  name: string;
  value: number;
};

export type PendingBookingData = {
  doctorId: string;
  serviceId: string;
  date: string;
};

export type SeedData = {
  appointments: Appointment[];
  bills: Bill[];
  prescriptions: Prescription[];
};

export type AppState = {
  user: User | null;
  services: Service[];
  appointments: Appointment[];
  bills: Bill[];
  prescriptions: Prescription[];
  doctors: User[];
  pendingBooking: PendingBookingData | null;
};

type AppStoreParams = {
  users: User[];
  services: Service[];
  seed: SeedData;
};

export class AppStore {
  private users: User[];
  private services: Service[];
  private state: AppState;
  private listeners = new Set<() => void>();

  constructor(params: AppStoreParams) {
    this.users = params.users.map(user => ({ ...user }));
    this.services = params.services.map(service => ({ ...service }));
    this.state = {
      user: null,
      services: this.services,
      appointments: params.seed.appointments.map(appt => ({ ...appt })),
      bills: params.seed.bills.map(bill => ({ ...bill })),
      prescriptions: params.seed.prescriptions.map(rx => ({ ...rx })),
      doctors: this.getDoctors(),
      pendingBooking: null,
    };
  }

  getState = () => this.state;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  login = (email: string, pass: string) => {
    const found = this.users.find(user => (
      user.role === UserRole.PATIENT &&
      user.email === email &&
      user.password === pass
    )) || null;
    if (found) {
      this.setState({ user: found });
      if (this.state.pendingBooking) {
        const booking = this.state.pendingBooking;
        this.bookAppointment(booking.doctorId, booking.serviceId, booking.date, found.id);
        this.setState({ pendingBooking: null });
      }
    }
    return found;
  };

  logout = () => {
    if (this.state.user) {
      this.setState({ user: null });
    }
  };

  register = (name: string, email: string, pass: string) => {
    const newUser: User = {
      id: `p${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      password: pass,
      role: UserRole.PATIENT,
    };
    this.users = [...this.users, newUser];
    this.setState({
      user: newUser,
      doctors: this.getDoctors(),
    });
    if (this.state.pendingBooking) {
      const booking = this.state.pendingBooking;
      this.bookAppointment(booking.doctorId, booking.serviceId, booking.date, newUser.id);
      this.setState({ pendingBooking: null });
    }
  };

  bookAppointment = (doctorId: string, serviceId: string, date: string, patientId?: string) => {
    const resolvedPatientId = patientId || this.state.user?.id;
    if (!resolvedPatientId) return;
    const newAppt: Appointment = {
      id: `a${Math.random().toString(36).substr(2, 9)}`,
      patientId: resolvedPatientId,
      doctorId,
      serviceId,
      date,
      status: AppointmentStatus.SCHEDULED,
    };
    this.setState({
      appointments: [...this.state.appointments, newAppt],
    });
  };

  createBill = (apptId: string, amount: number) => {
    const appt = this.state.appointments.find(a => a.id === apptId);
    if (!appt) return;
    const newBill: Bill = {
      id: `b${Math.random().toString(36).substr(2, 9)}`,
      appointmentId: apptId,
      patientId: appt.patientId,
      amount,
      isPaid: false,
      issuedDate: new Date().toISOString(),
    };
    this.setState({
      bills: [...this.state.bills, newBill],
    });
  };

  getDoctorStats = (doctorId: string): DoctorStatsItem[] => {
    const doctorAppts = this.state.appointments.filter(a => a.doctorId === doctorId);
    const completed = doctorAppts.filter(a => a.status === AppointmentStatus.COMPLETED).length;
    const scheduled = doctorAppts.filter(a => a.status === AppointmentStatus.SCHEDULED).length;
    return [
      { name: 'Zakończone', value: completed },
      { name: 'Zaplanowane', value: scheduled },
    ];
  };

  setPendingBooking = (data: PendingBookingData | null) => {
    this.setState({ pendingBooking: data });
  };

  private getDoctors() {
    return this.users.filter(user => user.role === UserRole.DOCTOR);
  }

  private emit() {
    this.listeners.forEach(listener => listener());
  }

  private setState(next: Partial<AppState>) {
    this.state = { ...this.state, ...next };
    this.emit();
  }
}
