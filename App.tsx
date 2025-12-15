import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Chatbot } from './components/Chatbot';
import { Home } from './pages/Home';
import { Login, Register } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { DoctorPanel } from './pages/DoctorPanel';
import { Booking } from './pages/Booking';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    // Don't show chatbot on login/register/doctor pages to keep clean
    const showChat = !['/login', '/register', '/doctor-panel'].includes(location.pathname);
    
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
      <HashRouter>
        <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/doctor-panel" element={<DoctorPanel />} />
            </Routes>
        </Layout>
      </HashRouter>
    </AppProvider>
  );
};

export default App;