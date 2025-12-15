import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Brain, MessageCircleHeart, HeartHandshake, Activity, Cat, Dog, Calendar } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  Brain: <Brain size={40} />,
  MessageCircleHeart: <MessageCircleHeart size={40} />,
  HeartHandshake: <HeartHandshake size={40} />,
  Activity: <Activity size={40} />,
  Cat: <Cat size={40} />,
  Dog: <Dog size={40} />
};

export const Home: React.FC = () => {
  const { services } = useApp();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-primary-500 to-accent-500 text-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
            Akademia Myśli
          </h1>
          <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto text-primary-50 font-light">
            Przychodnia Zdrowia Psychicznego dla Dzieci i Młodzieży. 
            Zrozumienie, Empatia, Profesjonalizm.
          </p>
          <Link 
            to="/register" 
            className="inline-block bg-white text-primary-600 font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition duration-300"
          >
            Zarejestruj się teraz
          </Link>
        </div>
      </header>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Nasze Specjalizacje</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Oferujemy kompleksową opiekę dostosowaną do potrzeb młodych pacjentów.
              Nasz zespół to wykwalifikowani specjaliści z powołaniem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <div key={service.id} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 flex flex-col items-center text-center">
                <div className="mb-6 text-primary-500 bg-primary-50 p-4 rounded-full">
                  {iconMap[service.iconName]}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{service.name}</h3>
                <p className="text-gray-600 mb-6 flex-grow">{service.description}</p>
                <div className="text-primary-600 font-semibold mb-4">
                  {service.durationMinutes} min • {service.price} PLN
                </div>
                <Link 
                  to="/login" // Redirect to login/booking if interested
                  className="w-full py-2 border border-primary-500 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  Umów wizytę
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto bg-primary-50 rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 mx-4 lg:mx-auto">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Potrzebujesz szybkiej konsultacji?</h2>
            <p className="text-gray-600">Sprawdź wolne terminy i umów się bez wychodzenia z domu.</p>
          </div>
          <Link to="/register" className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors shadow-lg">
            <Calendar size={20} />
            Znajdź termin
          </Link>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} Akademia Myśli. Wszelkie prawa zastrzeżone.</p>
          <div className="mt-4 flex justify-center gap-6">
            <span className="hover:text-white cursor-pointer">Polityka Prywatności</span>
            <span className="hover:text-white cursor-pointer">RODO</span>
            <span className="hover:text-white cursor-pointer">Kontakt</span>
          </div>
        </div>
      </footer>
    </div>
  );
};