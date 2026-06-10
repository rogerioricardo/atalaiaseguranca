
import React, { useState, useEffect } from 'react';
// App Entry Point - Sync Fix Attempt
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/auth/context';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Cameras from '@/pages/Cameras';
import Alerts from '@/pages/Alerts';
import Chat from '@/pages/Chat';
import Profile from '@/pages/Profile';
import MapPage from '@/pages/MapPage';
import IntegratorUsers from '@/pages/IntegratorUsers';
import PaymentSuccess from '@/pages/PaymentSuccess';
import Welcome from '@/pages/Welcome';
import WhatsAppAdmin from '@/pages/WhatsAppAdmin';
import FinancialAdmin from '@/pages/FinancialAdmin';
import Documentation from '@/pages/Documentation';
import Terms from '@/pages/Terms';
import Privacy from '@/pages/Privacy';
import ResetPassword from '@/pages/ResetPassword';
import { ShieldCheck, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/UI';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    let timer: any;
    if (loading) {
      timer = setTimeout(() => {
        setShowRetry(true);
      }, 7000);
    } else {
      setShowRetry(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white px-6 text-center">
        <Loader2 size={48} className="text-atalaia-neon animate-spin mb-4" />
        <div className="flex flex-col items-center gap-2">
           <div className="flex items-center gap-2 text-gray-400">
              <ShieldCheck size={18} />
              <span className="text-sm font-medium tracking-wider uppercase">Acessando link seguro...</span>
           </div>
           {showRetry && (
             <div className="mt-8 animate-in fade-in zoom-in">
                <p className="text-xs text-gray-600 mb-4 max-w-xs">A conexão com o servidor de segurança está demorando. Deseja tentar recarregar?</p>
                <Button onClick={() => window.location.reload()} variant="outline" className="text-xs">
                   <RefreshCw size={14} className="mr-2" /> Reiniciar Conexão
                </Button>
             </div>
           )}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AppRoutes = () => {
  const { sessionTerminatedReason, clearSessionTerminatedReason } = useAuth();

  return (
    <>
      {sessionTerminatedReason && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-zinc-950 border border-red-500/30 rounded-2xl p-6 md:p-8 shadow-[0_0_50px_rgba(239,68,68,0.15)] flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="relative mb-6">
               <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-500 mb-1 animate-pulse">
                  <ShieldCheck size={32} />
               </div>
               <div className="absolute inset-x-0 -bottom-2 flex justify-center">
                  <span className="px-2 py-0.5 bg-red-500 text-[9px] font-black uppercase text-black tracking-widest rounded-sm">BLOQUEADO</span>
               </div>
            </div>

            <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-3 font-sans">Sessão Interrompida</h3>
            
            <p className="text-xs text-zinc-400 leading-relaxed mb-6">
              {sessionTerminatedReason}
            </p>

            <div className="p-3.5 bg-red-500/5 border border-red-500/10 rounded-xl mb-6 text-left w-full text-[10px] text-zinc-500 leading-normal font-mono">
              💡 <strong>Controle de Compartilhamento Atalaia:</strong> Para preservar a privacidade das imagens das câmeras táticas e sensores de segurança comunitários, o uso de sessões simultâneas é desativado por padrão.
            </div>

            <button
              onClick={clearSessionTerminatedReason}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(220,38,38,0.25)] hover:scale-[1.01]"
            >
              Entendido, Fazer Login Novamente
            </button>
          </div>
        </div>
      )}

      <Routes>
        <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/docs" element={<Documentation />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      
      {/* Protected Routes */}
      <Route path="/welcome" element={
        <ProtectedRoute>
          <Welcome />
        </ProtectedRoute>
      } />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/cameras" element={
        <ProtectedRoute>
          <Cameras />
        </ProtectedRoute>
      } />

      <Route path="/alerts" element={
        <ProtectedRoute>
          <Alerts />
        </ProtectedRoute>
      } />

      <Route path="/chat" element={
        <ProtectedRoute>
          <Chat />
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />

      <Route path="/map" element={
        <ProtectedRoute>
          <MapPage />
        </ProtectedRoute>
      } />

      <Route path="/integrator/users" element={
        <ProtectedRoute>
          <IntegratorUsers />
        </ProtectedRoute>
      } />
      
      <Route path="/admin/whatsapp" element={
        <ProtectedRoute>
          <WhatsAppAdmin />
        </ProtectedRoute>
      } />
      
      <Route path="/admin/financial" element={
        <ProtectedRoute>
          <FinancialAdmin />
        </ProtectedRoute>
      } />
      
      <Route path="/admin/bairros" element={<ProtectedRoute><Cameras /></ProtectedRoute>} />
      
      {/* Payment Routes */}
      <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
      <Route path="/payment/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
