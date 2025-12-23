import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Brain, MessageCircleHeart, HeartHandshake, Activity, Cat, Dog, ArrowRight } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  Brain: <Brain size={40} />,
  MessageCircleHeart: <MessageCircleHeart size={40} />,
  HeartHandshake: <HeartHandshake size={40} />,
  Activity: <Activity size={40} />,
  Cat: <Cat size={40} />,
  Dog: <Dog size={40} />
};

export const Services: React.FC = () => {
  const { services } = useApp();

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Cennik i Usługi</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transparentne zasady, jasne koszty. Inwestycja w zdrowie psychiczne Twojego dziecka to inwestycja w jego przyszłość.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div key={service.id} className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="text-primary-500 bg-primary-50 p-4 rounded-full">
                  {iconMap[service.iconName]}
                </div>
                <div className="text-right">
                    <span className="block text-2xl font-bold text-gray-900">{service.price} PLN</span>
                    <span className="text-sm text-gray-500">{service.durationMinutes} min</span>
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{service.name}</h3>
              <p className="text-gray-600 mb-8 flex-grow leading-relaxed">{service.description}</p>
              
              <div className="mt-auto">
                <Link 
                  to="/booking" 
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-primary-500 text-primary-600 font-bold rounded-xl hover:bg-primary-500 hover:text-white transition-colors"
                >
                  Umów wizytę <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-blue-50 rounded-3xl p-8 md:p-12 text-center border border-blue-100">
            <h2 className="text-2xl font-bold text-blue-900 mb-4">Masz pytania dotyczące pierwszej wizyty?</h2>
            <p className="text-blue-700 mb-8 max-w-2xl mx-auto">
                Nie wiesz, do jakiego specjalisty się udać? Nasz zespół recepcji oraz asystent AI chętnie pomogą w doborze odpowiedniej ścieżki terapeutycznej.
            </p>
            <Link to="/register" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition shadow-lg">
                Zarejestruj się i sprawdź terminy
            </Link>
        </div>
      </div>
    </div>
  );
};