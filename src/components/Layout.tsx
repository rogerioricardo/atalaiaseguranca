
import React, { useState } from 'react';
import { useAuth } from '@/auth/context';
import { UserRole } from '@/types';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  DollarSign
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        <div className="p-6 border-b border-atalaia-border">
          {/* LOGOTIPO CLICÁVEL (VOLTAR PARA A LANDING) */}
          <Link to="/" className="flex items-center gap-2 group transition-opacity hover:opacity-80">
            <div className="w-10 h-10 rounded-lg bg-atalaia-neon flex items-center justify-center shadow-[0_0_15px_rgba(0,255,102,0.4)] group-hover:scale-105 transition-transform">
              <ShieldCheck className="text-black" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white group-hover:text-atalaia-neon transition-colors">ATALAIA</h1>
              <p className="text-xs text-atalaia-neon font-medium tracking-widest">SEGURANÇA</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <div className="mb-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Principal
          </div>
          
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          
          {user?.role !== UserRole.ADMIN && (
             <>
               <NavItem to="/alerts" icon={Bell} label="Central de Alertas" />
               <NavItem to="/chat" icon={MessageCircle} label="Chat da Comunidade" />
             </>
          )}

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
          {/* LOGOTIPO MÓVEL CLICÁVEL */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
             <ShieldCheck className="text-atalaia-neon" size={24} />
             <span className="font-bold">ATALAIA</span>
          </Link>
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-400 hover:text-white">
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
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
