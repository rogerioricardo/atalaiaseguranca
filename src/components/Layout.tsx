
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/auth/context';
import { UserRole } from '@/types';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MockService } from '@/services/mockService';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Camera, 
  Map as MapIcon, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Users,
  User as UserIcon,
  MessageCircle,
  MessageSquare,
  FileText,
  DollarSign,
  Smartphone,
  Download
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [partnerLogo, setPartnerLogo] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState<string | null>(null);

  useEffect(() => {
    const fetchPartnerBranding = async () => {
      if (!user) {
        setPartnerName(null);
        setPartnerLogo(null);
        return;
      }
      if (user.role === UserRole.INTEGRATOR) {
        setPartnerName(user.companyName || null);
        setPartnerLogo(user.companyLogo || null);
      } else if (user.neighborhoodId) {
        try {
          const integrator = await MockService.getNeighborhoodIntegrator(user.neighborhoodId);
          if (integrator) {
            setPartnerName(integrator.companyName || null);
            setPartnerLogo(integrator.companyLogo || null);
          } else {
            setPartnerName(null);
            setPartnerLogo(null);
          }
        } catch (e) {
          console.error("[Layout] Erro ao carregar co-branding do Integrador", e);
          setPartnerName(null);
          setPartnerLogo(null);
        }
      } else {
        setPartnerName(null);
        setPartnerLogo(null);
      }
    };
    fetchPartnerBranding();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const roleNames: Record<string, string> = {
    ADMIN: 'Administrador',
    INTEGRATOR: 'Integrador',
    SCR: 'Motovigia',
    RESIDENT: 'Morador'
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
          isActive 
            ? 'bg-atalaia-neon/10 text-atalaia-neon border border-atalaia-neon/20 shadow-[0_0_15px_rgba(0,255,102,0.1)]' 
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <Icon size={20} className={isActive ? 'text-atalaia-neon' : 'text-gray-500 group-hover:text-white'} />
        <span className="font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#010101] text-gray-100 flex overflow-hidden">
      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/90 z-40 lg:hidden backdrop-blur-md"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#040404] border-r border-atalaia-border
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-5 border-b border-atalaia-border space-y-3">
          {/* LOGOTIPOS EM CO-BRANDING JUNTOS NO TOPO */}
          <div className="flex items-center justify-between gap-2">
            <Link to="/" className="flex items-center gap-2 group transition-opacity hover:opacity-80">
              <div className="w-9 h-9 rounded-lg bg-atalaia-neon flex items-center justify-center shadow-[0_0_15px_rgba(0,255,102,0.3)] group-hover:scale-105 transition-transform">
                <ShieldCheck className="text-black" size={22} />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-white group-hover:text-atalaia-neon transition-colors">ATALAIA</h1>
                <p className="text-[9px] text-atalaia-neon font-bold tracking-widest leading-none">SEGURANÇA</p>
              </div>
            </Link>

            {partnerLogo && (
              <div className="flex items-center gap-1 animate-in fade-in zoom-in-95 duration-500 shrink-0">
                <span className="text-zinc-600 text-[10px]">🤝</span>
                <div className="flex items-center gap-1.5 bg-zinc-950 border border-white/10 px-2 py-1.5 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                   {partnerLogo.startsWith('http') || partnerLogo.startsWith('data:') ? (
                     <img referrerPolicy="no-referrer" src={partnerLogo} alt={partnerName || 'Parceiro'} className="w-5 h-5 rounded object-cover bg-zinc-800 shrink-0" />
                   ) : null}
                   <span className="text-[10px] font-black text-atalaia-neon max-w-[85px] truncate uppercase tracking-wider" title={partnerName || 'Parceiro'}>
                     {partnerName?.split(' ')[0]}
                   </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {/* BOTÃO DE DESTAQUE DO APLICATIVO */}
          <div className="mb-6 px-2">
            <a 
              href="/atalaia-seguranca.apk" 
              download="atalaia-seguranca.apk"
              className="flex items-center justify-between gap-2.5 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-atalaia-neon/15 to-atalaia-neon/5 hover:from-atalaia-neon/30 hover:to-blue-500/10 border border-atalaia-neon/30 hover:border-atalaia-neon text-white font-bold text-sm tracking-wide shadow-[0_0_15px_rgba(0,255,102,0.05)] hover:shadow-[0_0_25px_rgba(0,255,102,0.2)] transition-all duration-300 transform hover:-translate-y-0.5 group"
            >
              <div className="flex items-center gap-2">
                <Smartphone size={16} className="text-atalaia-neon animate-bounce" />
                <span className="font-sans font-bold">Instalar Aplicativo</span>
              </div>
              <Download size={14} className="text-zinc-500 group-hover:text-atalaia-neon transition-colors group-hover:translate-y-0.5" />
            </a>
          </div>

          <div className="mb-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Principal
          </div>
          
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          
          <NavItem to="/alerts" icon={Bell} label="Central de Alertas" />
          <NavItem to="/chat" icon={MessageCircle} label="Chat da Comunidade" />

          <div className="mt-8 mb-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Monitoramento
          </div>
          
          <NavItem to="/cameras" icon={Camera} label="Gestão de Câmeras nos Bairros" />
          
          {(user?.role === UserRole.INTEGRATOR || user?.role === UserRole.ADMIN) && (
             <NavItem 
               to="/integrator/users" 
               icon={Users} 
               label={user.role === UserRole.ADMIN ? "Gestão Geral do Sistema" : "Gestão de Moradores"} 
             />
          )}

          {user?.role === UserRole.ADMIN && (
             <>
               <NavItem to="/admin/whatsapp" icon={MessageSquare} label="Central WhatsApp" />
               <NavItem to="/admin/financial" icon={DollarSign} label="Financeiro" />
             </>
          )}

          <div className="mt-8 mb-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Comunidade
          </div>

          <NavItem to="/map" icon={MapIcon} label="Mapa Comunitário" />
          <NavItem to="/profile" icon={UserIcon} label="Meu Perfil" />
          
          {/* New Help Section */}
          <div className="mt-8 mb-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Ajuda
          </div>
          <NavItem to="/docs" icon={FileText} label="Manual do Sistema" />

        </nav>

        <div className="p-4 border-t border-atalaia-border">
          <Link to="/profile" className="flex items-center gap-3 px-4 py-3 mb-2 hover:bg-white/5 rounded-lg transition-colors group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-atalaia-accent to-blue-600 p-[2px]">
                {user?.photoUrl ? (
                    <img src={user.photoUrl} alt="Profile" className="w-full h-full rounded-full object-cover bg-black" />
                ) : (
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-xs font-bold text-white">
                        {user?.name.charAt(0)}
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate group-hover:text-atalaia-neon transition-colors">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate capitalize">
                {user?.role ? roleNames[user.role] : ''}
              </p>
            </div>
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-[#040404] border-b border-atalaia-border flex items-center px-4 justify-between z-30">
          {/* LOGOTIPO MÓVEL CLICÁVEL COM CO-BRANDING */}
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
               <ShieldCheck className="text-atalaia-neon" size={20} />
               <span className="font-bold text-sm tracking-tight">ATALAIA</span>
            </Link>
            {partnerLogo && (
              <div className="flex items-center gap-1 animate-in fade-in duration-300">
                <span className="text-zinc-600 text-[9px]">🤝</span>
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-lg">
                   {partnerLogo.startsWith('http') || partnerLogo.startsWith('data:') ? (
                     <img referrerPolicy="no-referrer" src={partnerLogo} alt={partnerName || 'Parceiro'} className="w-4 h-4 rounded object-cover bg-zinc-800" />
                   ) : null}
                   <span className="text-[9px] font-bold text-atalaia-neon max-w-[65px] truncate uppercase">{partnerName?.split(' ')[0]}</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <a 
              href="/atalaia-seguranca.apk" 
              download="atalaia-seguranca.apk"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-atalaia-neon/10 border border-atalaia-neon/30 text-atalaia-neon text-xs font-bold transition-all shadow-[0_0_10px_rgba(0,255,102,0.1)] active:scale-95"
              title="Baixar APK"
            >
              <Smartphone size={13} className="animate-pulse" />
              <span>Baixar App</span>
            </a>
            <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-400 hover:text-white">
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 relative bg-[#010101]">
            {/* Background Effects */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-atalaia-accent/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-atalaia-neon/3 rounded-full blur-[100px]" />
            </div>
            
            <div className="relative z-10">
                 {children}
            </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
