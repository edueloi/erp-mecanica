import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  ClipboardList, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Search,
  ChevronRight,
  Calendar,
  Package,
  Wrench,
  Truck,
  CreditCard,
  BarChart3,
  MessageSquare,
  ChevronDown,
  Plus,
  History,
  Store,
  Target,
  ClipboardCheck,
  Shield
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../services/authStore';
import { useSettings } from '../contexts/SettingsContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavItem {
  icon: any;
  label: string;
  path?: string;
  section?: string;
  children?: NavItem[];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { tenantSettings } = useSettings();

  const menuSections = [
    {
      title: 'Operação',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Calendar, label: 'Agendamentos', path: '/appointments' },
        { icon: ClipboardList, label: 'Ordens de Serviço', path: '/work-orders' },
        { icon: ClipboardCheck, label: 'Entrada / Checklist', path: '/vehicle-entries' },
        { icon: Target, label: 'Plano de Ação', path: '/action-plans' },
      ]
    },
    {
      title: 'Cadastros',
      items: [
        { icon: Users, label: 'Clientes', path: '/clients' },
        { icon: Car, label: 'Veículos', path: '/vehicles' },
        { icon: Wrench, label: 'Serviços', path: '/services' },
        { icon: Package, label: 'Peças', path: '/parts' },
        { icon: Truck, label: 'Fornecedores', path: '/suppliers' },
      ]
    },
    {
      title: 'Financeiro',
      items: [
        { icon: CreditCard, label: 'Contas a Receber', path: '/finance/receivables' },
        { icon: BarChart3, label: 'Fluxo de Caixa', path: '/finance/cashflow' },
      ]
    },
    {
      title: 'Comunicação',
      items: [
        { icon: MessageSquare, label: 'WhatsApp', path: '/communication/whatsapp' },
        { icon: History, label: 'Histórico', path: '/communication/history' },
      ]
    },
    {
      title: 'Sistema',
      items: [
        { icon: Store, label: 'Minha Oficina', path: '/settings/shop' },
      ]
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredMenuSections = menuSections.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') return true;
      if (!user?.permissions) return true;

      const perms = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions;
      
      if (item.path === '/') return perms.dashboard;
      if (item.path === '/appointments') return perms.appointments;
      if (item.path === '/work-orders' || item.path === '/vehicle-entries' || item.path === '/action-plans') return perms.workOrders;
      if (item.path === '/clients' || item.path === '/vehicles') return perms.clients;
      if (item.path === '/services' || item.path === '/parts' || item.path === '/suppliers') return perms.inventory;
      if (item.path?.startsWith('/finance')) return perms.finance;
      if (item.path?.startsWith('/communication')) return perms.whatsapp;
      if (item.path?.startsWith('/settings')) return perms.settings;

      return true;
    })
  })).filter(section => section.items.length > 0);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-slate-900 text-white z-50 transform transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 flex flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between shrink-0 border-b border-slate-800/50 mb-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center font-bold text-slate-900 overflow-hidden shrink-0 shadow-lg shadow-black/20">
              {tenantSettings?.logo_url ? (
                <img src={tenantSettings.logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <Shield size={20} className="text-emerald-500" />
              )}
            </div>
            <span className="text-lg font-black tracking-tight truncate">
              {tenantSettings?.trade_name || tenantSettings?.company_name || 'MecaERP'}
            </span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1.5 hover:bg-slate-800 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-8 pb-8 pt-4 custom-scrollbar">
          {filteredMenuSections.map((section) => (
            <div key={section.title} className="space-y-2">
              <div className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                {section.title}
              </div>
              
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group",
                        isActive 
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                          : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      )}
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <item.icon size={18} className={cn(isActive ? "text-white" : "text-slate-500 group-hover:text-white")} />
                      <span className="text-sm font-bold">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 shrink-0 bg-slate-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-slate-800/30 rounded-2xl border border-slate-800/50">
            <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center text-sm font-black border border-slate-600 uppercase text-emerald-400">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black truncate text-white uppercase tracking-tight">{user?.name}</p>
              <p className="text-[9px] text-slate-500 truncate uppercase font-black tracking-widest">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-bold text-xs uppercase tracking-widest"
          >
            <LogOut size={16} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0 z-20 sticky top-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-slate-600 lg:hidden hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="hidden md:flex items-center bg-slate-100 rounded-2xl px-4 py-2 w-96 border border-transparent focus-within:border-emerald-500/30 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-emerald-500/5 transition-all">
              <Search size={18} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por placa, cliente ou OS..." 
                className="bg-transparent border-none focus:ring-0 text-sm w-full ml-2 font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <button className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-[0.98]">
              <Plus size={16} className="text-emerald-400" /> Nova OS
            </button>
            <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>
            <button className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all relative">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto bg-[#f8fafc]">
          <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
