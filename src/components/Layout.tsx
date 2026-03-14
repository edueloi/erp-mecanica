import React, { useState, useEffect, useRef } from 'react';
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
  PanelLeft,
  AlertTriangle,
  ClipboardSignature,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../services/authStore';
import { useSettings } from '../contexts/SettingsContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import api from '../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

interface AppNotification {
  id: string;
  type: 'entry' | 'appointment' | 'stock_low' | 'stock_zero';
  title: string;
  description: string;
  link: string;
  severity: 'info' | 'warning' | 'error';
}

const DISMISSED_KEY = 'mecaerp_dismissed_notifications';

function getDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveDismissed(ids: Set<string>) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(ids)));
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { tenantSettings, preferences, updatePreferences } = useSettings();

  const isCollapsed = preferences.sidebar_collapsed;

  // Notification state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(getDismissed);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const visibleNotifications = notifications.filter(n => !dismissed.has(n.id));
  const unreadCount = visibleNotifications.length;

  // Close bell dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifications = async () => {
    setLoadingNotifs(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const [partsLow, partsZero, appointmentsToday, entries] = await Promise.allSettled([
        api.get('/parts?status=low'),
        api.get('/parts?status=zero'),
        api.get(`/appointments?date=${today}`),
        api.get('/entries'),
      ]);

      const notifs: AppNotification[] = [];

      // ── Low stock ──
      if (partsZero.status === 'fulfilled') {
        for (const p of partsZero.value.data || []) {
          notifs.push({
            id: `stock-zero-${p.id}`,
            type: 'stock_zero',
            title: 'Peça sem estoque',
            description: `${p.name}${p.code ? ` (${p.code})` : ''} — estoque zerado`,
            link: '/parts',
            severity: 'error',
          });
        }
      }
      if (partsLow.status === 'fulfilled') {
        for (const p of partsLow.value.data || []) {
          notifs.push({
            id: `stock-low-${p.id}`,
            type: 'stock_low',
            title: 'Estoque baixo',
            description: `${p.name}${p.code ? ` (${p.code})` : ''} — ${p.stock_quantity} un (mín: ${p.min_stock})`,
            link: '/parts',
            severity: 'warning',
          });
        }
      }

      // ── Appointments today ──
      if (appointmentsToday.status === 'fulfilled') {
        for (const a of appointmentsToday.value.data || []) {
          if (a.status === 'CANCELLED') continue;
          notifs.push({
            id: `appt-${a.id}`,
            type: 'appointment',
            title: 'Agendamento hoje',
            description: `${a.time ? a.time.substring(0, 5) + ' — ' : ''}${a.client_name || a.title || 'Cliente'} · ${a.plate || a.model || ''}`.trim().replace(/·\s*$/, ''),
            link: '/appointments',
            severity: 'info',
          });
        }
      }

      // ── Draft entries (last 48h) ──
      if (entries.status === 'fulfilled') {
        const cutoff = Date.now() - 48 * 60 * 60 * 1000;
        for (const e of entries.value.data || []) {
          if (e.status !== 'DRAFT') continue;
          if (new Date(e.created_at).getTime() < cutoff) continue;
          notifs.push({
            id: `entry-${e.id}`,
            type: 'entry',
            title: 'Nova entrada pendente',
            description: `${e.vehicle_plate ? e.vehicle_plate + ' — ' : ''}${e.customer_name || 'Cliente não informado'}`,
            link: `/vehicle-entries/${e.id}`,
            severity: 'info',
          });
        }
      }

      setNotifications(notifs);
    } catch (err) {
      console.error('Error fetching notifications', err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  // Fetch on mount + every 2 minutes
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 120_000);
    return () => clearInterval(interval);
  }, []);

  const dismiss = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    saveDismissed(next);
  };

  const dismissAll = () => {
    const next = new Set(dismissed);
    visibleNotifications.forEach(n => next.add(n.id));
    setDismissed(next);
    saveDismissed(next);
  };

  const severityStyles: Record<string, string> = {
    error: 'bg-red-50 border-red-100 text-red-700',
    warning: 'bg-amber-50 border-amber-100 text-amber-700',
    info: 'bg-blue-50 border-blue-100 text-blue-700',
  };

  const severityIconColor: Record<string, string> = {
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
  };

  const typeIcon: Record<string, React.ReactNode> = {
    stock_zero: <AlertTriangle size={16} />,
    stock_low: <Package size={16} />,
    appointment: <Calendar size={16} />,
    entry: <ClipboardCheck size={16} />,
  };

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
          {/* Left: hamburger + collapse toggle */}
          <div className="flex items-center gap-3">
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

            {/* Page breadcrumb hint */}
            <span className="hidden md:block text-sm font-bold text-slate-300 select-none">
              {tenantSettings?.trade_name || tenantSettings?.company_name || 'MecaERP'}
            </span>
          </div>

          {/* Right: notification bell */}
          <div className="flex items-center gap-2">
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => { setShowNotifications(v => !v); if (!showNotifications) fetchNotifications(); }}
                className="relative p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center leading-none border-2 border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Bell size={16} className="text-slate-500" />
                      <span className="text-sm font-black text-slate-900 uppercase tracking-wide">Alertas</span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-black rounded-full">{unreadCount}</span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={dismissAll}
                        className="text-[11px] font-bold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Limpar todos
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-50">
                    {loadingNotifs ? (
                      <div className="flex items-center justify-center py-10 text-slate-400 text-sm gap-2">
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                        Carregando alertas...
                      </div>
                    ) : visibleNotifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
                        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
                          <CheckCircle2 size={22} className="text-emerald-500" />
                        </div>
                        <p className="text-sm font-bold text-slate-700">Tudo em dia!</p>
                        <p className="text-xs text-slate-400">Nenhum alerta pendente no momento.</p>
                      </div>
                    ) : (
                      visibleNotifications.map(n => (
                        <div key={n.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 group transition-colors">
                          <div className={cn('mt-0.5 shrink-0', severityIconColor[n.severity])}>
                            {typeIcon[n.type]}
                          </div>
                          <Link
                            to={n.link}
                            onClick={() => { dismiss(n.id); setShowNotifications(false); }}
                            className="flex-1 min-w-0"
                          >
                            <p className="text-xs font-black text-slate-800 leading-tight">{n.title}</p>
                            <p className="text-[11px] text-slate-500 leading-snug mt-0.5 truncate">{n.description}</p>
                          </Link>
                          <button
                            onClick={() => dismiss(n.id)}
                            className="shrink-0 p-1 text-slate-200 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 mt-0.5"
                            title="Dispensar"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {visibleNotifications.length > 0 && (
                    <div className="px-5 py-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
                      Clique em um alerta para ir direto ao item · fechar descarta o alerta
                    </div>
                  )}
                </div>
              )}
            </div>
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
