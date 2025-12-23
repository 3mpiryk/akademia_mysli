import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Heart, Activity } from 'lucide-react';

export const Home: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-white">
      {/* Hero Section - Bulletproof Premium Design (No Buttons) */}
      <header className="relative h-[85vh] min-h-[600px] flex items-center overflow-hidden">
        
        {/* Background Image - Teenager/Youth Focus */}
        <div className="absolute inset-0 w-full h-full">
            <img 
                src="https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
                alt="Nastolatka, zdrowie psychiczne młodzieży" 
                className="w-full h-full object-cover object-center" 
            />
            {/* Gradient Overlay - Strong left-to-right fade for perfect text contrast */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/70 to-slate-900/30" />
        </div>

        {/* Content Container - Left Aligned */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-20">
            <div className="max-w-3xl animate-fade-in-up">
                
                {/* Brand Tagline */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-0.5 w-12 bg-accent-500"></div>
                    <span className="text-accent-400 font-bold tracking-widest uppercase text-sm">Akademia Myśli</span>
                </div>

                {/* Main Headline - Broken into lines for impact */}
                <h1 className="text-white font-serif font-bold leading-tight drop-shadow-lg mb-8 text-5xl sm:text-6xl md:text-7xl lg:text-8xl">
                    <span className="block mb-2">Zaufanie.</span>
                    <span className="block mb-2 text-primary-200">Empatia.</span>
                    <span className="block">Profesjonalizm.</span>
                </h1>

                <p className="text-lg md:text-xl text-gray-300 font-light max-w-xl mb-10 leading-relaxed">
                    Nowoczesne centrum medyczne dla dzieci i młodzieży. 
                    Łączymy ekspercką wiedzę psychiatryczną z ciepłem i zrozumieniem.
                </p>
            </div>
        </div>
      </header>

      {/* Trust Indicators - Clean & Minimal */}
      <section className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100 border-x border-gray-100">
                  <div className="p-8 text-center group hover:bg-gray-50 transition-colors">
                      <div className="text-4xl font-serif font-bold text-slate-800 mb-2 group-hover:text-primary-600 transition-colors">5000+</div>
                      <div className="text-gray-500 text-xs font-bold uppercase tracking-widest">Wizyt</div>
                  </div>
                  <div className="p-8 text-center group hover:bg-gray-50 transition-colors">
                      <div className="text-4xl font-serif font-bold text-slate-800 mb-2 group-hover:text-primary-600 transition-colors">15+</div>
                      <div className="text-gray-500 text-xs font-bold uppercase tracking-widest">Ekspertów</div>
                  </div>
                  <div className="p-8 text-center group hover:bg-gray-50 transition-colors">
                      <div className="text-4xl font-serif font-bold text-slate-800 mb-2 group-hover:text-primary-600 transition-colors">98%</div>
                      <div className="text-gray-500 text-xs font-bold uppercase tracking-widest">Zaufania</div>
                  </div>
                  <div className="p-8 text-center group hover:bg-gray-50 transition-colors">
                      <div className="text-4xl font-serif font-bold text-slate-800 mb-2 group-hover:text-primary-600 transition-colors">24/7</div>
                      <div className="text-gray-500 text-xs font-bold uppercase tracking-widest">Wsparcie AI</div>
                  </div>
              </div>
          </div>
      </section>

      {/* Detailed Content Sections */}
      <div className="bg-white">
        
        {/* Psychiatria - Right Image (UPDATED: Doctor with a KID) */}
        <section className="py-24 lg:py-32">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row items-center gap-16 xl:gap-24">
                    <div className="lg:w-1/2 order-2 lg:order-1">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Activity size={24}/></div>
                            <h2 className="text-sm font-bold text-blue-600 tracking-widest uppercase">Diagnoza Kliniczna</h2>
                        </div>
                        <h3 className="text-4xl lg:text-5xl font-serif font-bold text-slate-900 mb-8 leading-tight">
                            Psychiatria Dzieci <br/>i Młodzieży
                        </h3>
                        <div className="prose prose-lg text-slate-600 space-y-6 font-light leading-relaxed">
                            <p>
                                Rozumiemy, że wizyta u psychiatry to duży krok dla całej rodziny. Naszym celem jest zdjęcie odium z tego doświadczenia. Traktujemy problemy psychiczne tak samo poważnie i naturalnie jak dolegliwości somatyczne.
                            </p>
                            <p>
                                <strong className="text-slate-900 font-semibold">Kompleksowe podejście:</strong> Nie skupiamy się tylko na objawach. Analizujemy środowisko szkolne, sytuację rodzinną i parametry biologiczne, by postawić trafną diagnozę (ADHD, spektrum autyzmu, depresja, zaburzenia lękowe).
                            </p>
                        </div>
                        <div className="mt-10">
                            <Link to="/booking" className="inline-flex items-center gap-3 text-primary-700 font-bold text-lg hover:text-primary-500 transition-colors group border-b-2 border-primary-100 hover:border-primary-500 pb-1">
                                Umów konsultację diagnostyczną <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                            </Link>
                        </div>
                    </div>
                    <div className="lg:w-1/2 order-1 lg:order-2">
                         <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-200">
                             <img 
                                src="https://images.unsplash.com/photo-1606212557608-251a37c47318?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80" 
                                alt="Pediatra badający dziecko" 
                                className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-1000"
                             />
                         </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Psychoterapia - Left Image (UPDATED: TEENAGER/CHILD) */}
        <section className="py-24 lg:py-32 bg-slate-50">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row items-center gap-16 xl:gap-24">
                    <div className="lg:w-1/2">
                         <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-200">
                             <img 
                                src="https://images.unsplash.com/photo-1544717305-2782549b5136?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                                alt="Nastolatka podczas rozmowy" 
                                className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-1000"
                             />
                         </div>
                    </div>
                    <div className="lg:w-1/2">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-teal-50 rounded-lg text-teal-600"><Heart size={24}/></div>
                            <h2 className="text-sm font-bold text-teal-600 tracking-widest uppercase">Wsparcie Emocjonalne</h2>
                        </div>
                        <h3 className="text-4xl lg:text-5xl font-serif font-bold text-slate-900 mb-8 leading-tight">
                            Psychoterapia <br/>Indywidualna
                        </h3>
                        <div className="prose prose-lg text-slate-600 space-y-6 font-light leading-relaxed">
                            <p>
                                Gabinet terapeuty to bezpieczna przystań. Tutaj młody człowiek uczy się rozumieć swój wewnętrzny świat. Nasi terapeuci to przewodnicy, którzy pomagają nawigować przez trudne emocje, kryzysy rówieśnicze i rozwodowe.
                            </p>
                            <p>
                                Pracujemy w oparciu o dowody naukowe (EBM), wykorzystując techniki poznawczo-behawioralne oraz systemowe, aby przywrócić równowagę całej rodzinie.
                            </p>
                        </div>
                        <div className="mt-10">
                            <Link to="/services" className="inline-flex items-center gap-3 text-teal-700 font-bold text-lg hover:text-teal-500 transition-colors group border-b-2 border-teal-100 hover:border-teal-500 pb-1">
                                Sprawdź dostępnych terapeutów <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Specjalizacje Dodatkowe (Cards) - UPDATED IMAGES (KIDS/TEENS) */}
        <section className="py-24 lg:py-32">
             <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-6">Holistyczne podejście do zdrowia</h2>
                    <p className="text-lg text-slate-600">
                        Psychika i ciało to naczynia połączone. Dlatego nasz zespół uzupełniają specjaliści z dziedzin pokrewnych.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Neurologia - Child Focus */}
                    <div className="group bg-white rounded-[2rem] p-8 border border-slate-100 shadow-lg hover:shadow-2xl transition-all duration-300">
                        <div className="h-64 rounded-2xl overflow-hidden mb-8 relative">
                             <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors z-10"></div>
                             <img 
                                src="https://images.unsplash.com/photo-1516627145497-ae6963375dd9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                                alt="Neurologia dziecięca"
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                            />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-primary-600 transition-colors">Neurologia Dziecięca</h3>
                        <p className="text-slate-600 leading-relaxed">
                            Diagnostyka bólów głowy, omdleń, tików i zaburzeń koncentracji. Wykluczamy przyczyny organiczne problemów z zachowaniem.
                        </p>
                    </div>

                    {/* Seksuologia - Teens Focus */}
                    <div className="group bg-white rounded-[2rem] p-8 border border-slate-100 shadow-lg hover:shadow-2xl transition-all duration-300">
                        <div className="h-64 rounded-2xl overflow-hidden mb-8 relative">
                             <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors z-10"></div>
                             <img 
                                src="https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                                alt="Młodzież"
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                            />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-accent-600 transition-colors">Seksuologia i Tożsamość</h3>
                        <p className="text-slate-600 leading-relaxed">
                            Wsparcie w okresie dojrzewania. Rozmowy o tożsamości, orientacji i bezpiecznych relacjach w atmosferze pełnej akceptacji.
                        </p>
                    </div>
                </div>
             </div>
        </section>

        {/* Zooterapia - Immersive Section */}
        <section className="py-32 bg-slate-900 relative overflow-hidden">
             {/* Background Elements */}
             <div className="absolute inset-0">
                 <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-900/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
                 <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent-900/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
             </div>

             <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                    <div className="max-w-2xl">
                        <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">Terapia bez słów</h2>
                        <p className="text-xl text-slate-300 font-light">
                            Zwierzęta nie oceniają, nie wymagają i nie krytykują. Dlatego tak skutecznie docierają do dzieci zamkniętych w sobie.
                        </p>
                    </div>
                    <Link to="/booking" className="px-8 py-3 rounded-full border border-white/20 text-white hover:bg-white hover:text-slate-900 transition-all font-medium">
                        Umów zajęcia
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {/* Dogoterapia */}
                     <div className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors overflow-hidden">
                         <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                             <ShieldCheck size={120} className="text-white"/>
                         </div>
                         <div className="flex items-center gap-6 mb-6">
                             <img 
                                src="https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80" 
                                alt="Pies" 
                                className="w-20 h-20 rounded-2xl object-cover shadow-lg"
                             />
                             <h3 className="text-2xl font-bold text-white">Dogoterapia</h3>
                         </div>
                         <p className="text-slate-300 leading-relaxed relative z-10">
                             Kontakt z psem naturalnie obniża poziom stresu. Idealne wsparcie dla dzieci nadpobudliwych (ADHD) oraz wycofanych. Buduje poczucie sprawstwa i pewność siebie.
                         </p>
                     </div>

                     {/* Felinoterapia */}
                     <div className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors overflow-hidden">
                         <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                             <Heart size={120} className="text-white"/>
                         </div>
                         <div className="flex items-center gap-6 mb-6">
                             <img 
                                src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80" 
                                alt="Kot" 
                                className="w-20 h-20 rounded-2xl object-cover shadow-lg"
                             />
                             <h3 className="text-2xl font-bold text-white">Felinoterapia</h3>
                         </div>
                         <p className="text-slate-300 leading-relaxed relative z-10">
                             Koty uczą szacunku do granic i delikatności. Ich obecność działa kojąco na układ nerwowy. Szczególnie polecana w terapii zaburzeń ze spektrum autyzmu.
                         </p>
                     </div>
                </div>
             </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 bg-white">
            <div className="max-w-4xl mx-auto px-6 text-center">
                <h2 className="text-4xl font-serif font-bold text-slate-900 mb-6">Pierwszy krok jest najważniejszy</h2>
                <p className="text-xl text-slate-600 mb-10">
                    Nie musisz wiedzieć wszystkiego od razu. Jesteśmy tu, aby Cię poprowadzić.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link 
                        to="/register" 
                        className="bg-primary-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-primary-700 transition-all shadow-xl hover:shadow-primary-600/30"
                    >
                        Załóż konto Pacjenta
                    </Link>
                    <Link 
                        to="/services" 
                        className="bg-white text-slate-700 border-2 border-slate-200 px-10 py-4 rounded-full font-bold text-lg hover:border-slate-400 transition-all"
                    >
                        Zobacz cennik
                    </Link>
                </div>
            </div>
        </section>

        <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
                <div className="col-span-1 md:col-span-2">
                    <h4 className="text-white font-serif font-bold text-2xl mb-6">Akademia Myśli</h4>
                    <p className="text-sm leading-relaxed mb-8 max-w-sm text-slate-500">
                        Innowacyjne podejście do zdrowia psychicznego dzieci i młodzieży. 
                        Łączymy profesjonalizm medyczny z ludzką empatią.
                    </p>
                </div>
                <div>
                    <h4 className="text-white font-bold text-lg mb-6">Kontakt</h4>
                    <ul className="space-y-4 text-sm">
                        <li className="flex items-center gap-3">
                            <span className="w-1.5 h-1.5 bg-accent-500 rounded-full"></span> Warszawa, ul. Spokojna 15
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="w-1.5 h-1.5 bg-accent-500 rounded-full"></span> +48 22 123 45 67
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="w-1.5 h-1.5 bg-accent-500 rounded-full"></span> kontakt@akademiamysli.pl
                        </li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-bold text-lg mb-6">Informacje</h4>
                    <ul className="space-y-4 text-sm">
                        <li><Link to="/services" className="hover:text-white transition-colors">Cennik</Link></li>
                        <li><Link to="/login" className="hover:text-white transition-colors">Logowanie</Link></li>
                        <li className="hover:text-white transition-colors cursor-pointer">RODO i Prywatność</li>
                    </ul>
                </div>
            </div>
        </footer>
      </div>
    </div>
  );
};