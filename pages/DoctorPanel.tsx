import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Navigate } from 'react-router-dom';
import { UserRole, AppointmentStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, DollarSign, Users, ClipboardList } from 'lucide-react';

export const DoctorPanel: React.FC = () => {
  const { user, appointments, getDoctorStats, createBill, services } = useApp();
  const [activeTab, setActiveTab] = useState<'schedule' | 'stats'>('schedule');

  if (!user || user.role !== UserRole.DOCTOR) {
    return <Navigate to="/" replace />;
  }

  const myAppointments = appointments
    .filter(a => a.doctorId === user.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const stats = getDoctorStats(user.id);
  
  const handleIssueBill = (apptId: string, serviceId: string) => {
      const service = services.find(s => s.id === serviceId);
      if(service) {
          createBill(apptId, service.price);
          alert('Faktura została wystawiona.');
      }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
       <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
           <div className="max-w-7xl mx-auto flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <ClipboardList className="text-red-600" />
                    Centrum Medyczne - Panel Lekarza
                </h1>
                <div className="text-sm text-gray-500">Dr {user.name} | {user.specialization}</div>
           </div>
       </div>

       <div className="max-w-7xl mx-auto px-4 py-8">
           {/* Quick Stats Cards */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                   <div className="flex items-center gap-4">
                       <div className="p-3 bg-blue-100 text-blue-600 rounded-full"><Calendar size={24} /></div>
                       <div>
                           <p className="text-sm text-gray-500">Wizyty dzisiaj</p>
                           <h3 className="text-2xl font-bold">4</h3>
                       </div>
                   </div>
               </div>
               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                   <div className="flex items-center gap-4">
                       <div className="p-3 bg-green-100 text-green-600 rounded-full"><DollarSign size={24} /></div>
                       <div>
                           <p className="text-sm text-gray-500">Przychód (mc)</p>
                           <h3 className="text-2xl font-bold">12 400 PLN</h3>
                       </div>
                   </div>
               </div>
               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                   <div className="flex items-center gap-4">
                       <div className="p-3 bg-purple-100 text-purple-600 rounded-full"><Users size={24} /></div>
                       <div>
                           <p className="text-sm text-gray-500">Pacjenci ogółem</p>
                           <h3 className="text-2xl font-bold">128</h3>
                       </div>
                   </div>
               </div>
           </div>

           {/* Tabs */}
           <div className="flex space-x-4 mb-6">
                <button 
                    onClick={() => setActiveTab('schedule')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'schedule' ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Grafik i Wizyty
                </button>
                <button 
                    onClick={() => setActiveTab('stats')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'stats' ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Statystyki
                </button>
           </div>

           {/* Content */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
               {activeTab === 'schedule' && (
                   <div className="overflow-x-auto">
                       <table className="min-w-full text-left">
                           <thead>
                               <tr className="border-b border-gray-100 text-gray-500 text-sm">
                                   <th className="pb-3 font-medium">Data</th>
                                   <th className="pb-3 font-medium">Godzina</th>
                                   <th className="pb-3 font-medium">Pacjent ID</th>
                                   <th className="pb-3 font-medium">Status</th>
                                   <th className="pb-3 font-medium">Akcje</th>
                               </tr>
                           </thead>
                           <tbody className="text-sm">
                               {myAppointments.map(appt => (
                                   <tr key={appt.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                       <td className="py-4">{new Date(appt.date).toLocaleDateString()}</td>
                                       <td className="py-4 font-bold">{new Date(appt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                       <td className="py-4 text-gray-600">{appt.patientId}</td>
                                       <td className="py-4">
                                           <span className={`px-2 py-1 rounded text-xs ${
                                               appt.status === AppointmentStatus.SCHEDULED ? 'bg-blue-100 text-blue-700' :
                                               appt.status === AppointmentStatus.COMPLETED ? 'bg-green-100 text-green-700' :
                                               'bg-red-100 text-red-700'
                                           }`}>
                                               {appt.status}
                                           </span>
                                       </td>
                                       <td className="py-4">
                                           {appt.status === AppointmentStatus.SCHEDULED && (
                                               <button 
                                                    onClick={() => handleIssueBill(appt.id, appt.serviceId)}
                                                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded border border-gray-300"
                                               >
                                                   Wystaw Fakturę
                                               </button>
                                           )}
                                       </td>
                                   </tr>
                               ))}
                               {myAppointments.length === 0 && (
                                   <tr>
                                       <td colSpan={5} className="py-8 text-center text-gray-400">Brak zaplanowanych wizyt</td>
                                   </tr>
                               )}
                           </tbody>
                       </table>
                   </div>
               )}

               {activeTab === 'stats' && (
                   <div className="h-80 w-full">
                       <h3 className="text-lg font-bold mb-4">Podsumowanie Wizyt</h3>
                       <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={stats}>
                               <CartesianGrid strokeDasharray="3 3" />
                               <XAxis dataKey="name" />
                               <YAxis allowDecimals={false} />
                               <Tooltip />
                               <Legend />
                               <Bar dataKey="value" fill="#0ea5e9" name="Ilość wizyt" />
                           </BarChart>
                       </ResponsiveContainer>
                   </div>
               )}
           </div>
       </div>
    </div>
  );
};