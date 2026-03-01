import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useAuthStore } from './services/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Vehicles from './pages/Vehicles';
import VehicleDetail from './pages/VehicleDetail';
import WorkOrders from './pages/WorkOrders';
import WorkOrderDetail from './pages/WorkOrderDetail';
import Appointments from './pages/Appointments';
import Services from './pages/Services';

const Placeholder = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
      <Settings size={32} />
    </div>
    <h2 className="text-xl font-bold text-slate-900">{title}</h2>
    <p>Esta funcionalidade está em desenvolvimento.</p>
  </div>
);

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/clients" element={<PrivateRoute><Clients /></PrivateRoute>} />
        <Route path="/clients/:id" element={<PrivateRoute><ClientDetail /></PrivateRoute>} />
        <Route path="/vehicles" element={<PrivateRoute><Vehicles /></PrivateRoute>} />
        <Route path="/vehicles/:id" element={<PrivateRoute><VehicleDetail /></PrivateRoute>} />
        <Route path="/work-orders" element={<PrivateRoute><WorkOrders /></PrivateRoute>} />
        <Route path="/work-orders/:id" element={<PrivateRoute><WorkOrderDetail /></PrivateRoute>} />
        <Route path="/appointments" element={<PrivateRoute><Appointments /></PrivateRoute>} />
        <Route path="/services" element={<PrivateRoute><Services /></PrivateRoute>} />
        <Route path="/parts" element={<PrivateRoute><Placeholder title="Peças" /></PrivateRoute>} />
        <Route path="/suppliers" element={<PrivateRoute><Placeholder title="Fornecedores" /></PrivateRoute>} />
        <Route path="/finance/receivables" element={<PrivateRoute><Placeholder title="Contas a Receber" /></PrivateRoute>} />
        <Route path="/finance/cashflow" element={<PrivateRoute><Placeholder title="Fluxo de Caixa" /></PrivateRoute>} />
        <Route path="/communication/whatsapp" element={<PrivateRoute><Placeholder title="WhatsApp" /></PrivateRoute>} />
        <Route path="/communication/history" element={<PrivateRoute><Placeholder title="Histórico de Mensagens" /></PrivateRoute>} />
        <Route path="/settings/shop" element={<PrivateRoute><Placeholder title="Minha Oficina" /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Placeholder title="Configurações" /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
