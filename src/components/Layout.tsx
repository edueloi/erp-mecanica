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
  DollarSign,
  BarChart3,
  MessageSquare,
  ChevronDown,
  Plus,
  History,
  Store,
  Target,
  ClipboardCheck,
  Shield,
  PanelLeftClose,
  PanelLeft
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { tenantSettings, preferences, updatePreferences } = useSettings();

  const isCollapsed = preferences.sidebar_collapsed;

  const menuSections = [
    {
      title: 'Operação',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Calendar, label: 'Agendamentos', path: '/appointments' },
        { icon: ClipboardList, label: 'Ordens de Serviço', path: '/work-orders' },
        { icon: ClipboardCheck, label: 'Entrada / Checklist', path: '/vehicle-entries' },
        { icon: Target, label: 'Plano de Ação', path: '/action-plans' },
        { icon: Shield, label: 'Termos de Garantia', path: '/warranty' },
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
        { icon: DollarSign, label: 'Contas a Pagar', path: '/finance/payables' },
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

  const toggleSidebar = () => {
    updatePreferences({ sidebar_collapsed: !isCollapsed });
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
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 transform transition-all duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 flex flex-col border-r border-white/5 shadow-2xl",
          isMobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "lg:w-20" : "lg:w-64"
        )}
        style={{ backgroundColor: preferences.sidebar_color || '#0f172a' }}
      >
        <div className={cn(
          "p-6 flex items-center justify-between shrink-0 border-b border-white/5 mb-2",
          isCollapsed && "lg:px-4 lg:justify-center",
          (preferences.sidebar_display === 'logo_only' || preferences.sidebar_display === 'name_only') && "lg:justify-center"
        )}>
          <div className={cn(
            "flex items-center gap-3 overflow-hidden",
            (preferences.sidebar_display === 'logo_only' || preferences.sidebar_display === 'name_only') && "justify-center w-full"
          )}>
            {(preferences.sidebar_display === 'name_and_logo' || preferences.sidebar_display === 'logo_only' || !preferences.sidebar_display) && (
              <div className={cn(
                "bg-white rounded-xl flex items-center justify-center font-bold text-slate-900 overflow-hidden shrink-0 shadow-lg shadow-black/20",
                preferences.sidebar_display === 'logo_only' ? "w-14 h-14" : "w-12 h-12"
              )}>
                {tenantSettings?.logo_url ? (
                  <img src={tenantSettings.logo_url} alt="Logo" className="w-full h-full object-contain p-0.5" />
                ) : (
                  <Shield size={preferences.sidebar_display === 'logo_only' ? 28 : 24} style={{ color: preferences.primary_color }} />
                )}
              </div>
            )}
            {!isCollapsed && preferences.sidebar_display !== 'logo_only' && (
              <span className="text-lg font-black tracking-tight truncate text-white">
                {tenantSettings?.trade_name || tenantSettings?.company_name || 'MecaERP'}
              </span>
            )}
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-8 pb-8 pt-4 custom-scrollbar overflow-x-hidden">
          {filteredMenuSections.map((section) => (
            <div key={section.title} className="space-y-2">
              {!isCollapsed && (
                <div className="px-4 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: preferences.sidebar_text_color || '#94a3b8', opacity: 0.5 }}>
                  {section.title}
                </div>
              )}
              
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={isCollapsed ? item.label : ''}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group relative",
                        isActive 
                          ? "shadow-lg" 
                          : "hover:bg-white/5",
                        isCollapsed && "lg:justify-center lg:px-0"
                      )}
                      style={{ 
                        backgroundColor: isActive ? preferences.primary_color : 'transparent',
                        color: isActive ? '#ffffff' : (preferences.sidebar_text_color || '#94a3b8'),
                        boxShadow: isActive ? `0 10px 15px -3px ${preferences.primary_color}33` : 'none'
                      }}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon size={18} className={cn(isActive ? "text-white" : "transition-colors group-hover:text-white")} />
                      {!isCollapsed && <span className="text-sm font-bold truncate">{item.label}</span>}
                      {isCollapsed && isActive && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-l-full shadow-[0_0_10px_#fff]" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 shrink-0 bg-black/10 backdrop-blur-sm">
          <Link 
            to="/settings/user"
            className={cn(
              "flex items-center gap-3 px-4 py-3 mb-2 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors group/user",
              isCollapsed && "lg:px-0 lg:justify-center"
            )}
            style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
          >
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-sm font-black border border-white/10 uppercase overflow-hidden shrink-0 transition-all group-hover/user:scale-110" style={{ color: preferences.primary_color }}>
              {user?.photo_url ? (
                <img src={user.photo_url} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0) || 'U'
              )}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black truncate text-white uppercase tracking-tight group-hover/user:text-emerald-400 transition-colors">{user?.name}</p>
                <p className="text-[9px] truncate uppercase font-black tracking-widest" style={{ color: preferences.sidebar_text_color || '#94a3b8', opacity: 0.6 }}>{user?.role}</p>
              </div>
            )}
          </Link>
          <button 
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full px-4 py-3 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-bold text-xs uppercase tracking-widest cursor-pointer",
              isCollapsed && "lg:px-0 lg:justify-center"
            )}
            style={{ color: preferences.sidebar_text_color || '#94a3b8' }}
          >
            <LogOut size={16} />
            {!isCollapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative h-screen">
        {/* Header */}
        <header 
          className="h-16 border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0 z-20 sticky top-0"
          style={{ backgroundColor: preferences.header_color || '#ffffff' }}
        >
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-slate-600 lg:hidden hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu size={24} />
            </button>
            
            <button 
              onClick={toggleSidebar}
              className="hidden lg:flex p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              title={isCollapsed ? "Expandir Menu" : "Recolher Menu"}
            >
              {isCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
            </button>

            <div className="hidden md:flex items-center bg-slate-100/50 rounded-2xl px-4 py-2 w-96 border border-transparent focus-within:border-slate-300 focus-within:bg-white transition-all">
              <Search size={18} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por placa, cliente ou OS..." 
                className="bg-transparent border-none focus:ring-0 text-sm w-full ml-2 font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <button 
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-[0.98] cursor-pointer"
              style={{ backgroundColor: preferences.primary_color }}
            >
              <Plus size={16} className="text-white/80" /> Nova OS
            </button>
            <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>
            <button className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all relative cursor-pointer">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: preferences.primary_color }}></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        {['/clients', '/parts', '/suppliers', '/services', '/vehicles'].includes(location.pathname) ? (
          <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-[#f8fafc]">
            {children}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto bg-[#f8fafc] custom-scrollbar">
            <div className={location.pathname.startsWith('/settings') || location.pathname === '/finance/cashflow' ? '' : 'px-4 py-4'}>
              {children}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
