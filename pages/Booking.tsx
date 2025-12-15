import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { UserRole } from '../types';
import { Check, User as UserIcon, Calendar, Clock } from 'lucide-react';

export const Booking: React.FC = () => {
  const { user, services, doctors, appointments, bookAppointment } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  if (!user) return <Navigate to="/login" replace />;

  // Generate some slots for the next 7 days
  const generateSlots = (doctorId: string) => {
    // In a real app, this would come from backend based on doctor's schedule table
    // Here we generate fake slots 9:00 - 15:00 for next 3 days
    const slots = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    
    for (let i = 1; i <= 3; i++) {
        const day = new Date(today);
        day.setDate(today.getDate() + i);
        
        for (let h = 9; h < 16; h++) {
            const slotDate = new Date(day);
            slotDate.setHours(h, 0, 0, 0);
            
            // Check collision
            const isTaken = appointments.some(a => 
                a.doctorId === doctorId && 
                new Date(a.date).getTime() === slotDate.getTime() &&
                a.status !== 'CANCELLED'
            );

            if (!isTaken) {
                slots.push(slotDate);
            }
        }
    }
    return slots;
  };

  const availableSlots = selectedDoctor ? generateSlots(selectedDoctor) : [];

  const handleBooking = () => {
      const dateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      dateTime.setHours(parseInt(hours), parseInt(minutes));
      
      bookAppointment(selectedDoctor, selectedService, dateTime.toISOString());
      alert('Wizyta została zarezerwowana pomyślnie!');
      navigate('/dashboard');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Rezerwacja Wizyty</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className={step >= 1 ? 'text-primary-600 font-bold' : ''}>1. Usługa</span>
          <span>&gt;</span>
          <span className={step >= 2 ? 'text-primary-600 font-bold' : ''}>2. Lekarz</span>
          <span>&gt;</span>
          <span className={step >= 3 ? 'text-primary-600 font-bold' : ''}>3. Termin</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Wybierz rodzaj wizyty</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedService(s.id); setStep(2); }}
                  className="text-left p-4 border rounded-lg hover:border-primary-500 hover:bg-primary-50 transition flex flex-col gap-1"
                >
                  <span className="font-bold text-gray-800">{s.name}</span>
                  <span className="text-sm text-gray-500">{s.price} PLN • {s.durationMinutes} min</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Wybierz specjalistę</h2>
            <div className="grid grid-cols-1 gap-4">
              {doctors.map(d => (
                <button
                  key={d.id}
                  onClick={() => { setSelectedDoctor(d.id); setStep(3); }}
                  className="flex items-center gap-4 text-left p-4 border rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
                >
                  <div className="bg-gray-100 p-3 rounded-full">
                    <UserIcon size={24} className="text-gray-600" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-800 block">{d.name}</span>
                    <span className="text-sm text-gray-500">{d.specialization}</span>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(1)} className="text-sm text-gray-500 underline mt-4">Wróć</button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Wybierz termin</h2>
            
            {availableSlots.length === 0 ? (
               <p className="text-red-500">Brak wolnych terminów dla tego lekarza w najbliższym czasie.</p>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availableSlots.map((date, idx) => {
                        const dateStr = date.toLocaleDateString();
                        const timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                        return (
                            <button
                                key={idx}
                                onClick={() => {
                                    setSelectedDate(date.toString());
                                    setSelectedTime(timeStr);
                                }}
                                className={`p-3 rounded-lg border text-center transition ${
                                    selectedDate === date.toString() 
                                    ? 'bg-primary-600 text-white border-primary-600' 
                                    : 'hover:border-primary-500 hover:text-primary-600'
                                }`}
                            >
                                <div className="text-xs opacity-75">{dateStr}</div>
                                <div className="font-bold">{timeStr}</div>
                            </button>
                        )
                    })}
                </div>
            )}

            <div className="flex gap-4 mt-8 pt-4 border-t">
                 <button onClick={() => setStep(2)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Wróć</button>
                 <button 
                    disabled={!selectedDate}
                    onClick={handleBooking}
                    className="flex-1 bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    Potwierdź rezerwację
                 </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};