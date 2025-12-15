import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { Stethoscope, LogOut, User, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <div className="bg-primary-500 p-2 rounded-full text-white">
                <Stethoscope size={24} />
              </div>
              <span className="font-bold text-xl text-gray-800">Akademia Myśli</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">Strona główna</Link>
            <Link to="/#services" className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">Usługi</Link>
            
            {user ? (
              <>
                {user.role === UserRole.PATIENT && (
                  <Link to="/dashboard" className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">Panel Pacjenta</Link>
                )}
                {user.role === UserRole.DOCTOR && (
                  <Link to="/doctor-panel" className="text-red-600 hover:text-red-800 px-3 py-2 rounded-md text-sm font-medium font-bold">Centrum Lekarza</Link>
                )}
                <div className="flex items-center gap-4 ml-4">
                  <span className="text-sm text-gray-500 flex items-center gap-1"><User size={16}/> {user.name}</span>
                  <button onClick={handleLogout} className="text-gray-500 hover:text-gray-700">
                    <LogOut size={20} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 ml-4">
                <Link to="/login" className="text-primary-600 hover:text-primary-800 px-3 py-2 rounded-md text-sm font-medium">Logowanie</Link>
                <Link to="/register" className="bg-primary-500 text-white hover:bg-primary-600 px-4 py-2 rounded-md text-sm font-medium transition-colors">Rejestracja</Link>
              </div>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-500 hover:text-gray-700 p-2">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" className="block text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md text-base font-medium">Strona główna</Link>
            {user ? (
               <>
                 <Link to={user.role === UserRole.DOCTOR ? "/doctor-panel" : "/dashboard"} className="block text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md text-base font-medium">
                   {user.role === UserRole.DOCTOR ? "Centrum Lekarza" : "Panel Pacjenta"}
                 </Link>
                 <button onClick={handleLogout} className="w-full text-left block text-red-600 hover:bg-red-50 px-3 py-2 rounded-md text-base font-medium">Wyloguj</button>
               </>
            ) : (
              <>
                <Link to="/login" className="block text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md text-base font-medium">Logowanie</Link>
                <Link to="/register" className="block text-primary-600 font-bold hover:bg-gray-100 px-3 py-2 rounded-md text-base">Rejestracja</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};