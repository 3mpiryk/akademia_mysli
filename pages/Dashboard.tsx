import React from 'react';
import { useApp } from '../context/AppContext';
import { Navigate, Link } from 'react-router-dom';
import { Calendar, FileText, Pill, Plus } from 'lucide-react';
import { AppointmentStatus, UserRole } from '../types';

export const Dashboard: React.FC = () => {
  const { user, appointments, bills, prescriptions, services, doctors } = useApp();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== UserRole.PATIENT) {
    const redirectPath = user.role === UserRole.DOCTOR ? '/akademia-mysli-panel-lekarza' : '/';
    return <Navigate to={redirectPath} replace />;
  }

  const myAppointments = appointments
    .filter(a => a.patientId === user.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const myBills = bills.filter(b => b.patientId === user.id);
  const myPrescriptions = prescriptions.filter(p => p.patientId === user.id);

  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || 'Usługa';
  const getDoctorName = (id: string) => doctors.find(d => d.id === id)?.name || 'Lekarz';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Witaj, {user.name}</h1>
          <p className="text-gray-500">Panel pacjenta - Twoje zdrowie w jednym miejscu.</p>
        </div>
        <Link 
          to="/booking" 
          className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition shadow-md"
        >
          <Plus size={20} />
          Umów nową wizytę
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Appointments Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6 text-primary-600">
              <Calendar size={24} />
              <h2 className="text-xl font-bold text-gray-900">Twoje Wizyty</h2>
            </div>
            
            {myAppointments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Brak historii wizyt.</p>
            ) : (
              <div className="space-y-4">
                {myAppointments.map(appt => (
                  <div key={appt.id} className="border-l-4 border-primary-500 bg-gray-50 p-4 rounded-r-lg flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-800">{getServiceName(appt.serviceId)}</h3>
                      <p className="text-sm text-gray-600">{getDoctorName(appt.doctorId)}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(appt.date).toLocaleDateString()} | {new Date(appt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      appt.status === AppointmentStatus.COMPLETED ? 'bg-green-100 text-green-700' :
                      appt.status === AppointmentStatus.CANCELLED ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {appt.status === AppointmentStatus.SCHEDULED ? 'Zaplanowana' : 
                       appt.status === AppointmentStatus.COMPLETED ? 'Odbyta' : 'Anulowana'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Prescriptions & Bills */}
        <div className="space-y-8">
          {/* Prescriptions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4 text-accent-600">
              <Pill size={24} />
              <h2 className="text-lg font-bold text-gray-900">E-Recepty</h2>
            </div>
            <div className="space-y-3">
              {myPrescriptions.length === 0 ? (
                <p className="text-sm text-gray-400">Brak aktywnych recept.</p>
              ) : (
                myPrescriptions.map(rx => (
                  <div key={rx.id} className="bg-accent-50 p-3 rounded-lg border border-accent-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-accent-700">Kod: {rx.code}</span>
                      <span className="text-xs text-accent-600">Wygasa: {new Date(rx.expiryDate).toLocaleDateString()}</span>
                    </div>
                    <ul className="text-sm text-gray-700 list-disc list-inside">
                      {rx.medications.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bills */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4 text-gray-700">
              <FileText size={24} />
              <h2 className="text-lg font-bold text-gray-900">Rachunki</h2>
            </div>
            <div className="space-y-3">
              {myBills.length === 0 ? (
                <p className="text-sm text-gray-400">Brak nieopłaconych rachunków.</p>
              ) : (
                myBills.map(bill => (
                  <div key={bill.id} className="flex justify-between items-center p-3 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">Wizyta {new Date(bill.issuedDate).toLocaleDateString()}</p>
                      <p className={`text-xs ${bill.isPaid ? 'text-green-600' : 'text-red-500'}`}>
                        {bill.isPaid ? 'Opłacono' : 'Do zapłaty'}
                      </p>
                    </div>
                    <span className="font-bold text-gray-800">{bill.amount} PLN</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
