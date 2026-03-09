import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Settings as SettingsIcon } from 'lucide-react';
import { useAuthStore } from './services/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Vehicles from './pages/Vehicles';
import VehicleDetail from './pages/VehicleDetail';
import VehicleChecklist from './pages/VehicleChecklist';
import ChecklistPublicUpload from './pages/ChecklistPublicUpload';
import WorkOrders from './pages/WorkOrders';
import WorkOrderDetail from './pages/WorkOrderDetail';
import Appointments from './pages/Appointments';
import Services from './pages/Services';
import Parts from './pages/Parts';
import Suppliers from './pages/Suppliers';
import AccountsReceivable from './pages/AccountsReceivable';
import CashFlow from './pages/CashFlow';
import WhatsApp from './pages/WhatsApp';
import CommunicationHistory from './pages/CommunicationHistory';
import Settings from './pages/Settings';
import ActionPlans from './pages/ActionPlans';
import VehicleEntries from './pages/VehicleEntries';
import VehicleEntryDetail from './pages/VehicleEntryDetail';
import EntryPublicForm from './pages/EntryPublicForm';
import SuperAdmin from './pages/SuperAdmin';

const Placeholder = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
      <SettingsIcon size={32} />
    </div>
    <h2 className="text-xl font-bold text-slate-900">{title}</h2>
    <p>Esta funcionalidade está em desenvolvimento.</p>
  </div>
);

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  if (!isAuthenticated || user?.role !== 'SUPER_ADMIN') {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
        <Route path="/clients" element={<PrivateRoute><Layout><Clients /></Layout></PrivateRoute>} />
        <Route path="/clients/:id" element={<PrivateRoute><Layout><ClientDetail /></Layout></PrivateRoute>} />
        <Route path="/vehicles" element={<PrivateRoute><Layout><Vehicles /></Layout></PrivateRoute>} />
        <Route path="/vehicles/:id" element={<PrivateRoute><Layout><VehicleDetail /></Layout></PrivateRoute>} />
        <Route path="/vehicles/:vehicleId/checklist" element={<PrivateRoute><Layout><VehicleChecklist /></Layout></PrivateRoute>} />
        <Route path="/vehicles/:vehicleId/checklist/:checklistId" element={<PrivateRoute><Layout><VehicleChecklist /></Layout></PrivateRoute>} />
        <Route path="/work-orders" element={<PrivateRoute><Layout><WorkOrders /></Layout></PrivateRoute>} />
        <Route path="/work-orders/:id" element={<PrivateRoute><Layout><WorkOrderDetail /></Layout></PrivateRoute>} />
        <Route path="/appointments" element={<PrivateRoute><Layout><Appointments /></Layout></PrivateRoute>} />
        <Route path="/services" element={<PrivateRoute><Layout><Services /></Layout></PrivateRoute>} />
        <Route path="/parts" element={<PrivateRoute><Layout><Parts /></Layout></PrivateRoute>} />
        <Route path="/suppliers" element={<PrivateRoute><Layout><Suppliers /></Layout></PrivateRoute>} />
        <Route path="/finance/receivables" element={<PrivateRoute><Layout><AccountsReceivable /></Layout></PrivateRoute>} />
        <Route path="/finance/cashflow" element={<PrivateRoute><Layout><CashFlow /></Layout></PrivateRoute>} />
        <Route path="/communication/whatsapp" element={<PrivateRoute><Layout><WhatsApp /></Layout></PrivateRoute>} />
        <Route path="/communication/history" element={<PrivateRoute><Layout><CommunicationHistory /></Layout></PrivateRoute>} />
        <Route path="/action-plans" element={<PrivateRoute><Layout><ActionPlans /></Layout></PrivateRoute>} />
        <Route path="/action-plans/:boardId" element={<PrivateRoute><Layout><ActionPlans /></Layout></PrivateRoute>} />
        <Route path="/vehicle-entries" element={<PrivateRoute><Layout><VehicleEntries /></Layout></PrivateRoute>} />
        <Route path="/vehicle-entries/:id" element={<PrivateRoute><Layout><VehicleEntryDetail /></Layout></PrivateRoute>} />
        <Route path="/settings/shop" element={<PrivateRoute><Layout><Settings /></Layout></PrivateRoute>} />
        <Route path="/checklist-upload/:token" element={<ChecklistPublicUpload />} />
        <Route path="/entry-upload/:token" element={<EntryPublicForm />} />


        <Route path="/superadmin" element={<SuperAdminRoute><SuperAdmin /></SuperAdminRoute>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
