import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { Check, User as UserIcon, Calendar, ArrowRight, LogIn, UserPlus, X } from 'lucide-react';

export const Booking: React.FC = () => {
  const { user, services, doctors, appointments, bookAppointment, setPendingBooking } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (user && user.role !== UserRole.PATIENT) {
    const redirectPath = user.role === UserRole.DOCTOR ? '/akademia-mysli-panel-lekarza' : '/';
    return <Navigate to={redirectPath} replace />;
  }

  // Generate some slots for the next 7 days
  const generateSlots = (doctorId: string) => {
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

  const handleBookingAttempt = () => {
      const dateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      dateTime.setHours(parseInt(hours), parseInt(minutes));
      const finalDate = dateTime.toISOString();

      if (user) {
          // If logged in, book immediately
          bookAppointment(selectedDoctor, selectedService, finalDate);
          navigate('/dashboard');
      } else {
          // If not logged in, save intent and show modal
          setPendingBooking({
              serviceId: selectedService,
              doctorId: selectedDoctor,
              date: finalDate
          });
          setShowAuthModal(true);
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Rezerwacja Wizyty</h1>
            <p className="text-gray-500">Wybierz usługę, specjalistę i dogodny termin.</p>
        </div>

        {/* Progress Bar */}
        <div className="flex justify-center mb-12">
            <div className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${step >= 1 ? 'bg-primary-600 border-primary-600 text-white' : 'border-gray-300 text-gray-300'}`}>1</div>
                <div className={`w-16 h-1 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${step >= 2 ? 'bg-primary-600 border-primary-600 text-white' : 'border-gray-300 text-gray-300'}`}>2</div>
                <div className={`w-16 h-1 ${step >= 3 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${step >= 3 ? 'bg-primary-600 border-primary-600 text-white' : 'border-gray-300 text-gray-300'}`}>3</div>
            </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 min-h-[400px]">
            
            {step === 1 && (
            <div className="space-y-6 animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Wybierz usługę</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map(s => (
                    <button
                    key={s.id}
                    onClick={() => { setSelectedService(s.id); setStep(2); }}
                    className="text-left p-6 border-2 border-gray-100 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all group"
                    >
                    <span className="font-bold text-lg text-gray-800 group-hover:text-primary-700">{s.name}</span>
                    <div className="mt-2 flex justify-between items-center text-gray-500">
                        <span>{s.durationMinutes} min</span>
                        <span className="font-bold text-primary-600">{s.price} PLN</span>
                    </div>
                    </button>
                ))}
                </div>
            </div>
            )}

            {step === 2 && (
            <div className="space-y-6 animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Wybierz specjalistę</h2>
                <div className="grid grid-cols-1 gap-4">
                {doctors.map(d => (
                    <button
                    key={d.id}
                    onClick={() => { setSelectedDoctor(d.id); setStep(3); }}
                    className="flex items-center gap-6 text-left p-6 border-2 border-gray-100 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all group"
                    >
                    <div className="bg-gray-100 p-4 rounded-full group-hover:bg-white transition-colors">
                        <UserIcon size={32} className="text-gray-500 group-hover:text-primary-600" />
                    </div>
                    <div>
                        <span className="font-bold text-xl text-gray-800 block">{d.name}</span>
                        <span className="text-primary-600 font-medium">{d.specialization}</span>
                    </div>
                    <div className="ml-auto">
                        <ArrowRight className="text-gray-300 group-hover:text-primary-600 transform group-hover:translate-x-1 transition-all" />
                    </div>
                    </button>
                ))}
                </div>
                <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-800 underline mt-4">Wróć do wyboru usług</button>
            </div>
            )}

            {step === 3 && (
            <div className="space-y-6 animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-800">Dostępne terminy</h2>
                <p className="text-gray-500 -mt-4 mb-4">Lekarz: {doctors.find(d => d.id === selectedDoctor)?.name}</p>
                
                {availableSlots.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl">
                    <p className="text-red-500 font-medium">Brak wolnych terminów dla tego lekarza w najbliższym czasie.</p>
                    <button onClick={() => setStep(2)} className="mt-4 text-primary-600 hover:underline">Zmień specjalistę</button>
                </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {availableSlots.map((date, idx) => {
                            const dateStr = date.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' });
                            const timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                            return (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setSelectedDate(date.toString());
                                        setSelectedTime(timeStr);
                                    }}
                                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                                        selectedDate === date.toString() 
                                        ? 'bg-primary-600 text-white border-primary-600 scale-105 shadow-md' 
                                        : 'border-gray-100 hover:border-primary-400 hover:text-primary-600 bg-gray-50 text-gray-800'
                                    }`}
                                >
                                    <div className="text-xs uppercase tracking-wider font-semibold opacity-80 mb-1">{dateStr}</div>
                                    <div className="text-xl font-bold">{timeStr}</div>
                                </button>
                            )
                        })}
                    </div>
                )}

                <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100">
                    <button onClick={() => setStep(2)} className="px-6 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium transition-colors">Wróć</button>
                    <button 
                        disabled={!selectedDate}
                        onClick={handleBookingAttempt}
                        className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
                    >
                        {user ? 'Potwierdź rezerwację' : 'Dalej: Dane pacjenta'}
                    </button>
                </div>
            </div>
            )}
        </div>

        {/* AUTH MODAL */}
        {showAuthModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative animate-scale-up">
                    <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                    
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Calendar size={32} />
                        </div>
                        <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Termin został wstępnie zarezerwowany!</h3>
                        <p className="text-gray-600 mb-8">Aby dokończyć rezerwację i przypisać ją do Twojej historii medycznej, prosimy o wybór jednej z opcji:</p>

                        <div className="space-y-4">
                            <button 
                                onClick={() => navigate('/login')}
                                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-primary-600 text-primary-700 py-3 px-4 rounded-xl font-bold hover:bg-primary-50 transition-colors"
                            >
                                <LogIn size={20} />
                                Mam już konto
                            </button>
                            
                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-gray-200"></div>
                                <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">Nowy pacjent?</span>
                                <div className="flex-grow border-t border-gray-200"></div>
                            </div>

                            <button 
                                onClick={() => navigate('/register')}
                                className="w-full flex items-center justify-center gap-3 bg-primary-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-primary-700 shadow-lg hover:shadow-xl transition-all"
                            >
                                <UserPlus size={20} />
                                Zarejestruj pacjenta
                            </button>
                        </div>
                    </div>
                    <div className="bg-gray-50 p-4 text-center text-xs text-gray-500">
                        Rezerwacja nastąpi automatycznie po zalogowaniu lub rejestracji.
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
