import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, pendingBooking } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(email, password)) {
      if (pendingBooking) {
        alert("Pomyślnie zalogowano. Twoja wizyta została automatycznie potwierdzona!");
      }
      navigate('/dashboard');
    } else {
      setError('Nieprawidłowy email lub hasło.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Witaj ponownie</h2>
          {pendingBooking ? (
             <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
               <p className="font-bold mb-1">Dokończ rezerwację</p>
               Zaloguj się, aby potwierdzić wizytę na dzień <strong>{new Date(pendingBooking.date).toLocaleDateString()}</strong>.
             </div>
          ) : (
             <p className="mt-2 text-sm text-gray-500">
               Zaloguj się do swojego konta pacjenta
             </p>
          )}
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Adres email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm bg-white text-gray-900 transition-all"
                  placeholder="np. jan@kowalski.pl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Hasło</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm bg-white text-gray-900 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors shadow-lg hover:shadow-xl"
            >
              {pendingBooking ? 'Zaloguj i rezerwuj' : 'Zaloguj się'}
            </button>
          </div>
          
          <div className="text-center text-sm">
             <span className="text-gray-500">Nie masz konta? </span>
             <Link to="/register" className="font-bold text-primary-600 hover:text-primary-500">
               Zarejestruj się
             </Link>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100">
             <p className="text-xs text-center text-gray-400 uppercase tracking-wider font-semibold mb-3">Dane testowe</p>
             <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1 text-center">
                <p>Pacjent: <span className="font-mono text-gray-700">pacjent@test.pl</span> / <span className="font-mono text-gray-700">password</span></p>
                <p>Lekarz: <span className="font-mono text-gray-700">doktor@test.pl</span> / <span className="font-mono text-gray-700">password</span></p>
             </div>
        </div>
      </div>
    </div>
  );
};

export const Register: React.FC = () => {
  const { register, pendingBooking } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register(name, email, password);
    if (pendingBooking) {
        alert("Konto utworzone. Twoja wizyta została automatycznie potwierdzona!");
    }
    navigate('/dashboard'); 
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dołącz do nas</h2>
          {pendingBooking && (
             <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
               <p className="font-bold mb-1">Ostatni krok!</p>
               Utwórz konto, aby potwierdzić wizytę na dzień <strong>{new Date(pendingBooking.date).toLocaleDateString()}</strong>.
             </div>
          )}
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Imię i Nazwisko</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon size={18} className="text-gray-400" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm bg-white text-gray-900 transition-all"
                  placeholder="Jan Kowalski"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Adres email</label>
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm bg-white text-gray-900 transition-all"
                  placeholder="jan@kowalski.pl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Hasło</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm bg-white text-gray-900 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors shadow-lg hover:shadow-xl"
            >
              {pendingBooking ? 'Zarejestruj i potwierdź wizytę' : 'Zarejestruj się'} <ArrowRight className="ml-2" size={20} />
            </button>
          </div>
          
          <div className="text-center text-sm">
             <span className="text-gray-500">Masz już konto? </span>
             <Link to="/login" className="font-bold text-primary-600 hover:text-primary-500">
               Zaloguj się
             </Link>
          </div>
        </form>
      </div>
    </div>
  );
};