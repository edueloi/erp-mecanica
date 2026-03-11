import React from 'react';
import { 
  createBrowserRouter, 
  createRoutesFromElements, 
  RouterProvider, 
  Route, 
  Navigate 
} from 'react-router-dom';
import { Settings as SettingsIcon } from 'lucide-react';
import { useAuthStore } from './services/authStore';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
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
import AccountsPayable from './pages/AccountsPayable';
import CashFlow from './pages/CashFlow';
import WhatsApp from './pages/WhatsApp';
import CommunicationHistory from './pages/CommunicationHistory';
import Settings from './pages/Settings';
import ActionPlans from './pages/ActionPlans';
import VehicleEntries from './pages/VehicleEntries';
import VehicleEntryDetail from './pages/VehicleEntryDetail';
import EntryPublicForm from './pages/EntryPublicForm';
import SuperAdmin from './pages/SuperAdmin';
import WarrantyTermsPage from './pages/WarrantyTerms';
import LegalPage from './pages/LegalPage';
import LandingPage from './pages/LandingPage';
import SplashScreen from './components/SplashScreen';

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
  
  if (!isAuthenticated || (user?.role !== 'SUPER_ADMIN' && user?.role !== 'VENDEDOR')) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      
      <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
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
      <Route path="/finance/payables" element={<PrivateRoute><Layout><AccountsPayable /></Layout></PrivateRoute>} />
      <Route path="/finance/cashflow" element={<PrivateRoute><Layout><CashFlow /></Layout></PrivateRoute>} />
      <Route path="/communication/whatsapp" element={<PrivateRoute><Layout><WhatsApp /></Layout></PrivateRoute>} />
      <Route path="/communication/history" element={<PrivateRoute><Layout><CommunicationHistory /></Layout></PrivateRoute>} />
      <Route path="/action-plans" element={<PrivateRoute><Layout><ActionPlans /></Layout></PrivateRoute>} />
      <Route path="/action-plans/:boardId" element={<PrivateRoute><Layout><ActionPlans /></Layout></PrivateRoute>} />
      <Route path="/vehicle-entries" element={<PrivateRoute><Layout><VehicleEntries /></Layout></PrivateRoute>} />
      <Route path="/vehicle-entries/:id" element={<PrivateRoute><Layout><VehicleEntryDetail /></Layout></PrivateRoute>} />
      <Route path="/warranty" element={<PrivateRoute><Layout><WarrantyTermsPage /></Layout></PrivateRoute>} />
      <Route path="/settings/:tab?" element={<PrivateRoute><Layout><Settings /></Layout></PrivateRoute>} />
      <Route path="/checklist-upload/:token" element={<ChecklistPublicUpload />} />
      <Route path="/entry-upload/:token" element={<EntryPublicForm />} />

      <Route path="/superadmin/:tab?" element={<SuperAdminRoute><SuperAdmin /></SuperAdminRoute>} />

      <Route path="/termos" element={<LegalPage title="Termos de Uso" lastUpdate="2026-03-10" type="terms" />} />
      <Route path="/privacidade" element={<LegalPage title="Política de Privacidade" lastUpdate="2026-03-10" type="privacy" />} />
      <Route path="/lgpd" element={<LegalPage title="Conformidade LGPD" lastUpdate="2026-03-10" type="lgpd" />} />

      <Route path="*" element={<Navigate to="/" />} />
    </>
  )
);

function AppContent() {
  const { loading, tenantSettings } = useSettings();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  if (loading && isAuthenticated) {
    return <SplashScreen logoUrl={tenantSettings?.logo_url} tenantName={tenantSettings?.company_name || tenantSettings?.trade_name} />;
  }

  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}
