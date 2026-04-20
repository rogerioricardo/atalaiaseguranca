
import React, { useState, useEffect } from 'react';
// App Entry Point - Sync Fix Attempt
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
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
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
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
      <Route path="/payment/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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
