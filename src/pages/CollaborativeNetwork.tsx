import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, MessageSquare, Printer, Video, Smartphone, Eye } from 'lucide-react';
import { CollaborativeNetworkSection } from '@/components/CollaborativeNetworkSection';

const CollaborativeNetwork: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#010101] text-white font-sans overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-[#010101]/90 backdrop-blur-md border-b border-white/5 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* LOGO CLICÁVEL (VOLTAR AO TOPO) */}
            <button 
              onClick={scrollToTop}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none group"
            >
              <ShieldCheck className="text-atalaia-neon h-6 w-6 group-hover:scale-110 transition-transform" />
              <span className="text-xl font-bold tracking-tight text-white">ATALAIA</span>
            </button>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
              <button onClick={() => navigate('/#como-funciona')} className="text-gray-300 hover:text-white transition-colors">Como funciona</button>
              <button onClick={() => navigate('/#funcionalidades')} className="text-gray-300 hover:text-white transition-colors">Funcionalidades</button>
              <button onClick={() => navigate('/#mapa-cameras')} className="text-gray-300 hover:text-white transition-colors">Mapa de Câmeras</button>
              <button onClick={() => navigate('/#planos')} className="text-gray-300 hover:text-white transition-colors">Planos</button>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <button onClick={() => navigate('/login')} className="text-sm font-medium text-white hover:text-atalaia-neon transition-colors">
                Entrar
              </button>
              <button onClick={() => navigate('/login?mode=register')} className="bg-white hover:bg-gray-100 text-black px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-105">
                Começar
              </button>
            </div>
            
            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => navigate('/')} className="text-white hover:text-atalaia-neon focus:outline-none">
                <span className="text-xs uppercase font-bold tracking-widest border border-white/20 px-3 py-1.5 rounded-full">Voltar</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content (with padding top for navbar) */}
      <div className="pt-20">
        <CollaborativeNetworkSection />
      </div>

      {/* Footer */}
      <footer className="bg-[#040404] pt-24 pb-12 border-t border-white/5 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16 text-sm">
            {/* Brand Column */}
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <ShieldCheck className="text-atalaia-neon h-6 w-6" />
                <span className="text-xl font-bold tracking-tight text-white">ATALAIA</span>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6 max-w-sm">
                A primeira plataforma de vigilância digital com IA do Brasil. Monitore, alerte e proteja o que mais importa com a tecnologia Atalaia.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 rounded-full bg-[#111] flex items-center justify-center text-gray-400 hover:bg-atalaia-neon hover:text-black transition-all">
                   <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-[#111] flex items-center justify-center text-gray-400 hover:bg-atalaia-neon hover:text-black transition-all">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>
                </a>
              </div>
            </div>

            {/* Support Column */}
            <div>
              <h4 className="text-white font-bold mb-6 uppercase text-xs tracking-widest">Suporte</h4>
              <ul className="space-y-4">
                <li><button onClick={() => navigate('/docs')} className="hover:text-atalaia-neon transition-colors text-gray-400">Documentação</button></li>
                <li><button onClick={() => navigate('/login')} className="hover:text-atalaia-neon transition-colors text-gray-400">Central de Ajuda</button></li>
                <li><button className="hover:text-atalaia-neon transition-colors text-gray-400">Contato</button></li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h4 className="text-white font-bold mb-6 uppercase text-xs tracking-widest">Legal</h4>
              <ul className="space-y-4">
                <li><button onClick={() => navigate('/terms')} className="hover:text-atalaia-neon transition-colors text-gray-400">Termos de Uso</button></li>
                <li><button onClick={() => navigate('/privacy')} className="hover:text-atalaia-neon transition-colors text-gray-400">Privacidade</button></li>
                <li><button className="hover:text-atalaia-neon transition-colors text-gray-400">Cookies</button></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest font-medium opacity-50">
            <p>© 2025 ALIEN MONITORAMENTO ELETRONICO LTDA. TODOS OS DIREITOS RESERVADOS.</p>
            <div className="flex gap-8">
              <span>CNPJ: 51.482.661/0001-31</span>
              <span>BRASIL</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CollaborativeNetwork;
