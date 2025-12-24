import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Chatbot } from './components/Chatbot';
import { Home } from './pages/Home';
import { Services } from './pages/Services';
import { Login, Register } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Booking } from './pages/Booking';
import { PatientRecord } from './pages/PatientRecord';
import { AdminPanel } from './pages/AdminPanel';
import { PatientOnboarding } from './pages/PatientOnboarding';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    // Don't show chatbot on login/register/doctor pages to keep clean
    const showChat = !['/login', '/register', '/onboarding', '/doctor-panel', '/akademia-mysli-panel-lekarza', '/panel-administratora'].includes(location.pathname);
    
    return (
        <>
            <Navbar />
            <main>{children}</main>
            {showChat && <Chatbot />}
        </>
    );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/services" element={<Services />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/onboarding" element={<PatientOnboarding />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/doctor-panel" element={<Navigate to="/akademia-mysli-panel-lekarza" replace />} />
              <Route path="/akademia-mysli-panel-lekarza" element={<PatientRecord />} />
              <Route path="/panel-administratora" element={<AdminPanel />} />
            </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
