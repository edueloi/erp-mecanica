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
  Store
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../services/authStore';
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

  const menuSections = [
    {
      title: 'Operação',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Calendar, label: 'Agendamentos', path: '/appointments' },
        { icon: ClipboardList, label: 'Ordens de Serviço', path: '/work-orders' },
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
        { icon: Settings, label: 'Configurações', path: '/settings' },
      ]
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
        <div className="p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-white">M</div>
            <span className="text-xl font-bold tracking-tight">MecaERP</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-8 pb-8 pt-4">
          {menuSections.map((section) => (
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

        <div className="p-4 border-t border-slate-800 shrink-0">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold border-2 border-slate-800">
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 truncate uppercase font-bold">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-slate-600 lg:hidden"
            >
              <Menu size={24} />
            </button>
            <div className="hidden md:flex items-center bg-slate-100 rounded-full px-4 py-2 w-96 border border-transparent focus-within:border-emerald-500 focus-within:bg-white transition-all">
              <Search size={18} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por placa, cliente ou OS..." 
                className="bg-transparent border-none focus:ring-0 text-sm w-full ml-2"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20">
              <Plus size={16} /> Nova OS
            </button>
            <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>
            <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-full relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
