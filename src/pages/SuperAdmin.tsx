import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  Users, 
  Shield, 
  Plus, 
  Trash2, 
  Edit2, 
  LogOut,
  ChevronRight,
  Search,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  Package,
  Clock,
  Ban,
  AlertTriangle,
  Mail,
  LayoutDashboard,
  BarChart3,
  UserCircle,
  Settings as SettingsIcon,
  Phone,
  TrendingUp,
  Target,
  CreditCard,
  ArrowUpRight,
  History,
  Activity,
  X,
  Wallet,
  Zap,
  Layers
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../services/authStore";
import api from "../services/api";
import { twMerge } from 'tailwind-merge';
import SuperAdminModal from "../components/SuperAdminModal";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import TenantUsersModal from "../components/TenantUsersModal";
import PricingPlansModal from "../components/PricingPlansModal";

function cn(...inputs: any[]) {
  return twMerge(inputs.filter(Boolean).map(i => typeof i === 'object' ? Object.keys(i).filter(k => i[k]).join(' ') : i).join(' '));
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; bg: string; border: string }> = {
  ACTIVE: { label: "Ativo", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", icon: CheckCircle },
  INACTIVE: { label: "Inativo", color: "text-slate-400", bg: "bg-slate-50", border: "border-slate-100", icon: Clock },
  TRIAL: { label: "Teste", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", icon: Calendar },
  OVERDUE: { label: "Atrasado", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", icon: AlertTriangle },
  PENDING_PAYMENT: { label: "Pendente", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100", icon: DollarSign },
  BLOCKED: { label: "Bloqueado", color: "text-red-600", bg: "bg-red-50", border: "border-red-100", icon: Ban },
};

type AdminTab = 'dashboard' | 'workshops' | 'plans' | 'profile';

export default function SuperAdmin() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [tenants, setTenants] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; tenant: any | null }>({ isOpen: false, tenant: null });
  const [usersModal, setUsersModal] = useState<{ isOpen: boolean; tenant: any | null }>({ isOpen: false, tenant: null });
  
  // History Drawer State
  const [historyDrawer, setHistoryDrawer] = useState<{ isOpen: boolean; tenant: any | null; logs: any[] }>({ isOpen: false, tenant: null, logs: [] });
  
  // Activation Modal State
  const [activationModal, setActivationModal] = useState<{ isOpen: boolean; tenant: any | null; payment_method: string; payment_date: string }>({ 
    isOpen: false, tenant: null, payment_method: 'PIX', payment_date: new Date().toISOString().split('T')[0] 
  });

  const navigate = useNavigate();
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);

  const [form, setForm] = useState({
    name: "",
    document: "",
    phone: "",
    address: "",
    user_limit: 5,
    subscription_value: 0,
    due_day: 5,
    plan_id: "",
    logo_url: "",
    admin_name: "",
    admin_email: "",
    admin_password: ""
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [tenantsRes, plansRes] = await Promise.all([
        api.get("/superadmin/tenants"),
        api.get("/superadmin/plans")
      ]);
      setTenants(Array.isArray(tenantsRes.data) ? tenantsRes.data : []);
      setPlans(Array.isArray(plansRes.data) ? plansRes.data : []);
    } catch (err: any) {
      showToast("Erro ao carregar dados", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'SUPER_ADMIN') {
      navigate('/');
      return;
    }
    loadData();
  }, []);

  const calculateUsageTime = (createdAt: string) => {
    if (!createdAt) return "---";
    const start = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} dias`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} ${diffMonths === 1 ? 'mês' : 'meses'}`;
    const diffYears = Math.floor(diffMonths / 12);
    return `${diffYears} ${diffYears === 1 ? 'ano' : 'anos'}`;
  };

  const stats = useMemo(() => {
    const totalMRR = tenants.reduce((acc, t) => acc + (t.subscription_value || 0), 0);
    const activeTenants = tenants.filter(t => t.status === 'ACTIVE').length;
    const totalUsers = tenants.reduce((acc, t) => acc + (t.user_count || 0), 0);
    const overdueCount = tenants.filter(t => t.status === 'OVERDUE' || t.status === 'BLOCKED').length;
    const ticketMedio = tenants.length > 0 ? totalMRR / tenants.length : 0;

    const planStats = plans.map(p => {
      const count = tenants.filter(t => t.plan_id === p.id).length;
      const revenue = tenants.filter(t => t.plan_id === p.id).reduce((acc, t) => acc + (t.subscription_value || 0), 0);
      const percentage = tenants.length > 0 ? (count / tenants.length) * 100 : 0;
      return { label: p.name, count, revenue, percentage: Math.round(percentage) };
    }).sort((a, b) => b.count - a.count);

    return { totalMRR, activeTenants, totalUsers, overdueCount, ticketMedio, planStats };
  }, [tenants, plans]);

  const loadTenantLogs = async (tenant: any) => {
    try {
      const res = await api.get(`/superadmin/tenants/${tenant.id}/logs`);
      setHistoryDrawer({ 
        isOpen: true, 
        tenant, 
        logs: Array.isArray(res.data) ? res.data : [] 
      });
    } catch (err) {
      setHistoryDrawer({ isOpen: true, tenant, logs: [] });
      showToast("Logs indisponíveis", "error");
    }
  };

  const handleStatusChange = async (tenant: any, newStatus: string) => {
    if (newStatus === 'ACTIVE' && tenant.status !== 'ACTIVE') {
      setActivationModal({ 
        isOpen: true, 
        tenant, 
        payment_method: 'PIX', 
        payment_date: new Date().toISOString().split('T')[0] 
      });
      return;
    }

    try {
      await api.patch(`/superadmin/tenants/${tenant.id}`, { status: newStatus });
      showToast("Status atualizado");
      loadData();
    } catch (err) {
      showToast("Erro ao atualizar status", "error");
    }
  };

  const confirmActivation = async () => {
    if (!activationModal.tenant) return;
    setSaving(true);
    try {
      await api.patch(`/superadmin/tenants/${activationModal.tenant.id}`, { 
        status: 'ACTIVE',
        payment_date: activationModal.payment_date,
        payment_method: activationModal.payment_method
      });
      showToast("Sistema ativado com sucesso");
      setActivationModal({ ...activationModal, isOpen: false });
      loadData();
    } catch (err) {
      showToast("Erro ao ativar sistema", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingTenant) {
        await api.patch(`/superadmin/tenants/${editingTenant.id}`, form);
        showToast("Dados atualizados");
      } else {
        await api.post("/superadmin/tenants", form);
        showToast("Novo parceiro cadastrado");
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Erro ao processar", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.tenant) return;
    setSaving(true);
    try {
      await api.delete(`/superadmin/tenants/${deleteModal.tenant.id}`);
      showToast("Parceiro removido");
      setDeleteModal({ isOpen: false, tenant: null });
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Erro ao excluir", "error");
    } finally {
      setSaving(false);
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.phone?.includes(searchTerm) ||
    t.admin_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans antialiased text-slate-900 overflow-hidden h-screen">
      {/* Sidebar */}
      <aside className="w-20 lg:w-60 bg-slate-900 text-white flex flex-col shrink-0 relative z-30 transition-all duration-300 shadow-2xl">
        <div className="p-4 lg:p-6 text-center lg:text-left">
          <div className="flex items-center lg:items-start gap-3 mb-8 justify-center lg:justify-start">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shrink-0">
              <Shield className="text-white" size={22} />
            </div>
            <div className="hidden lg:block overflow-hidden">
              <h1 className="font-black text-base leading-none tracking-tight uppercase italic">MecaERP</h1>
              <p className="text-emerald-400 text-[8px] font-black uppercase tracking-widest mt-1">Super Admin</p>
            </div>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'workshops', label: 'Parceiros', icon: Building2 },
              { id: 'plans', label: 'Planos', icon: Package },
              { id: 'profile', label: 'Meu Perfil', icon: UserCircle },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as AdminTab)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-xs transition-all group",
                  activeTab === item.id 
                    ? "bg-emerald-50 text-emerald-600 shadow-md" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon size={18} className={activeTab === item.id ? "text-emerald-600" : "text-slate-500 group-hover:text-white"} />
                <span className="hidden lg:block uppercase tracking-wider">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-slate-800">
          <button 
            onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center justify-center lg:justify-start gap-3 w-full px-3 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest"
          >
            <LogOut size={18} />
            <span className="hidden lg:block">Desconectar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 relative z-20">
          <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
            <span className="text-emerald-600 font-black italic">Sistema Central</span>
            <ChevronRight size={10} />
            <span className="text-slate-900">{activeTab}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-emerald-700 uppercase">Live Monitor</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6 pb-20">
            
            {activeTab === 'dashboard' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Visão do Negócio</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'MRR Consolidado', value: `R$ ${stats.totalMRR.toLocaleString('pt-BR')}`, icon: DollarSign, color: 'emerald' },
                    { label: 'Ticket Médio', value: `R$ ${stats.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'blue' },
                    { label: 'Ativos', value: stats.activeTenants, icon: Building2, color: 'purple' },
                    { label: 'Usuários', value: stats.totalUsers, icon: Users, color: 'orange' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", 
                        stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                        stat.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                        stat.color === 'purple' ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'
                      )}>
                        <stat.icon size={20} />
                      </div>
                      <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">{stat.label}</p>
                      <h3 className="text-xl font-black text-slate-900 leading-none mt-1">{stat.value}</h3>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest flex items-center gap-2 mb-8">
                      <BarChart3 className="text-emerald-500" size={16} /> Volume por Plano
                    </h4>
                    <div className="space-y-6">
                      {stats.planStats.map((p, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-tight">
                            <span>{p.label} ({p.count})</span>
                            <span className="text-emerald-600">{p.percentage}%</span>
                          </div>
                          <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${p.percentage}%` }} className={cn("h-full", i === 0 ? "bg-emerald-500" : "bg-slate-400")} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 border border-red-100">
                      <AlertTriangle size={32} />
                    </div>
                    <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest leading-none">Inadimplência</h4>
                    <p className="text-2xl font-black text-red-600 mt-2">{stats.overdueCount}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Contratos em alerta</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'workshops' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Oficinas Parceiras</h2>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1 italic">Gestão da Rede</p>
                  </div>
                  <button 
                    onClick={() => { setEditingTenant(null); setShowModal(true); }}
                    className="h-10 px-5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-md"
                  >
                    <Plus size={14} className="text-emerald-400" /> Novo Parceiro
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
                    <div className="relative w-full sm:max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input 
                          type="text" 
                          placeholder="Pesquisar parceiro..." 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                        />
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                      {filteredTenants.length} Parceiros
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4 lg:p-6 bg-slate-50/30">
                    {loading ? (
                      <div className="col-span-full py-20 text-center text-slate-400 font-black text-[10px] uppercase tracking-widest animate-pulse italic">Processando Banco de Dados...</div>
                    ) : filteredTenants.map((t) => (
                      <motion.div 
                        key={t.id} 
                        layout
                        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-emerald-200 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-slate-100 p-1.5 overflow-hidden">
                              {t.logo_url ? <img src={t.logo_url} className="w-full h-full object-contain" /> : <Building2 className="text-slate-200" size={20} />}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-black text-slate-900 text-sm leading-tight truncate uppercase italic">{t.name}</h4>
                              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest truncate">{t.plan_name || 'Contrato Custom'}</p>
                            </div>
                          </div>
                          <select 
                            value={t.status || 'ACTIVE'} 
                            onChange={(e) => handleStatusChange(t, e.target.value)}
                            className={cn(
                              "h-7 px-2 rounded-lg text-[8px] font-black uppercase tracking-tighter border-2 transition-all outline-none cursor-pointer shadow-sm",
                              STATUS_CONFIG[t.status || 'ACTIVE'].bg,
                              STATUS_CONFIG[t.status || 'ACTIVE'].color,
                              STATUS_CONFIG[t.status || 'ACTIVE'].border
                            )}
                          >
                            {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                              <option key={val} value={val} className="text-slate-900 font-bold">{cfg.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2 mb-4 bg-slate-50/50 p-3 rounded-xl border border-slate-100 italic">
                          <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                            <span>Desde</span>
                            <span className="text-slate-900">{new Date(t.created_at).toLocaleDateString('pt-BR')} ({calculateUsageTime(t.created_at)})</span>
                          </div>
                          <div className="h-px bg-slate-100 my-1" />
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                            <Mail size={12} className="text-slate-300 shrink-0" />
                            <span className="truncate">{t.admin_email}</span>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] font-black text-slate-900">R$ {t.subscription_value?.toLocaleString('pt-BR')}</span>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Mensalidade</span>
                          </div>
                        </div>

                        <div className="flex gap-1.5">
                          <button onClick={() => loadTenantLogs(t)} title="Histórico" className="w-8 h-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-100">
                            <History size={14} />
                          </button>
                          <button onClick={() => setUsersModal({ isOpen: true, tenant: t })} title="Usuários" className="flex-1 h-8 bg-slate-50 text-slate-600 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-1.5 hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-slate-100">
                            <Users size={12} /> Usuários
                          </button>
                          <button onClick={() => { setEditingTenant(t); setShowModal(true); }} title="Editar" className="flex-1 h-8 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-1.5 hover:bg-slate-800 transition-all">
                            <Edit2 size={12} /> Editar
                          </button>
                          <button onClick={() => setDeleteModal({ isOpen: true, tenant: t })} title="Excluir" className="w-8 h-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-100 transition-all border border-red-100">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ABAS DE PLANOS TOTALMENTE REFORMULADA */}
            {activeTab === 'plans' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pb-20">
                <div className="bg-slate-900 rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl border border-slate-800">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 mb-2">
                        <Zap size={14} className="text-emerald-400" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Modelos de Venda</span>
                      </div>
                      <h2 className="text-4xl font-black text-white uppercase tracking-tight">Planos & Preços</h2>
                      <p className="text-slate-400 font-bold text-sm italic">Defina as ofertas exclusivas para sua rede de parceiros.</p>
                    </div>
                    <button 
                      onClick={() => setShowPlansModal(true)}
                      className="group relative flex items-center justify-center gap-3 px-10 py-5 bg-emerald-500 text-white rounded-[1.5rem] font-black shadow-2xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all active:scale-[0.98] uppercase text-xs tracking-[0.2em]"
                    >
                      <Plus className="w-5 h-5 text-white" />
                      <span>Configurar Planos</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {plans.map((p, i) => (
                    <div key={i} className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl transition-all flex flex-col gap-8 relative overflow-hidden group border-b-8 border-b-emerald-500">
                      <div className="flex items-start justify-between">
                        <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-emerald-400 shadow-xl group-hover:scale-110 transition-transform duration-500">
                          <Package size={28} />
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Assinatura</p>
                          <p className="text-xs font-black text-emerald-600 uppercase tracking-tighter">{p.months_duration === 1 ? 'Mensal' : `${p.months_duration} meses`}</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{p.name}</h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Oferta Premium Enterprise</p>
                      </div>

                      <div className="space-y-4 py-6 border-y border-slate-50 bg-slate-50/30 rounded-2xl px-4">
                        <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest">
                          <div className="flex items-center gap-2 text-slate-500"><Users size={14} /> Capacidade</div>
                          <span className="text-slate-900">{p.user_limit} Usuários</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest">
                          <div className="flex items-center gap-2 text-slate-500"><Layers size={14} /> Cloud</div>
                          <span className="text-emerald-600">Dedicado</span>
                        </div>
                      </div>

                      <div className="flex items-baseline gap-2 mt-auto pt-4">
                        <span className="text-xs font-black text-slate-400 uppercase">Investimento</span>
                        <span className="text-5xl font-black text-slate-900 tabular-nums leading-none">R${p.monthly_value.toLocaleString('pt-BR')}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase">/mês</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl mx-auto space-y-6">
                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm text-center space-y-6">
                  <div className="w-28 h-24 bg-slate-900 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto shadow-xl relative">
                    <span className="text-4xl font-black">{user?.name?.charAt(0)}</span>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center border-4 border-white text-white shadow-lg">
                      <Shield size={18} />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none italic">Administrador Root</h2>
                    <p className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.4em] mt-2">Privilégios de Acesso Totais</p>
                  </div>
                  <div className="pt-6 space-y-3">
                    <div className="h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 flex items-center justify-between text-xs font-bold text-slate-500">
                      <span className="uppercase text-[10px] tracking-widest">E-mail Corporativo</span>
                      <span>{user?.email}</span>
                    </div>
                    <button className="w-full h-14 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-xl">
                      <ShieldIcon size={18} className="text-emerald-400" /> Segurança da Conta
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </div>
        </div>

        {/* SIDE DRAWER - HISTÓRICO CORRIGIDO */}
        <AnimatePresence>
          {historyDrawer.isOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setHistoryDrawer({ ...historyDrawer, isOpen: false })}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-[100]"
              />
              <motion.div 
                initial={{ x: '100%' }} 
                animate={{ x: 0 }} 
                exit={{ x: '100%' }} 
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute right-0 top-0 h-full w-full sm:w-[400px] lg:w-[30%] bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.1)] z-[110] border-l border-slate-100 flex flex-col"
              >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <Activity size={20} className="text-emerald-500" />
                    <div>
                      <h3 className="font-black text-sm uppercase tracking-widest leading-none">Auditoria</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">Histórico de Eventos</p>
                    </div>
                  </div>
                  <button onClick={() => setHistoryDrawer({ ...historyDrawer, isOpen: false })} className="p-2 hover:bg-white hover:text-red-500 rounded-xl transition-all text-slate-400"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
                  <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl border border-emerald-100 flex items-center justify-center shadow-sm shrink-0">
                      {historyDrawer.tenant?.logo_url ? <img src={historyDrawer.tenant?.logo_url} className="w-full h-full object-contain" /> : <Building2 className="text-emerald-600" size={24} />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-slate-900 text-sm truncate uppercase tracking-tighter leading-none italic">{historyDrawer.tenant?.name}</p>
                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1">{historyDrawer.tenant?.plan_name || 'Personalizado'}</p>
                    </div>
                  </div>

                  <div className="relative pl-4 space-y-8 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                    {Array.isArray(historyDrawer.logs) && historyDrawer.logs.length > 0 ? historyDrawer.logs.map((log) => (
                      <div key={log.id} className="relative pl-10">
                        <div className={cn(
                          "absolute left-0 top-1 w-2.5 h-2.5 rounded-full border-4 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.05)] z-10",
                          log.action_type === 'PAYMENT_RECORDED' ? 'bg-emerald-500' :
                          log.action_type === 'USER_CREATED' ? 'bg-blue-500' :
                          log.action_type === 'USER_DELETED' ? 'bg-red-500' : 'bg-slate-400'
                        )} />
                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">{log.action_type.replace('_', ' ')}</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-1 leading-relaxed uppercase">{log.description}</p>
                        {log.payment_method && (
                          <div className="mt-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 inline-flex items-center gap-2">
                            <Wallet size={10} className="text-emerald-500" />
                            <span className="text-[8px] font-black text-slate-600 uppercase italic">{log.payment_method} • R$ {historyDrawer.tenant?.subscription_value?.toLocaleString('pt-BR')}</span>
                          </div>
                        )}
                        <p className="text-[8px] font-black text-slate-400 mt-2 uppercase">{new Date(log.created_at).toLocaleString('pt-BR')}</p>
                      </div>
                    )) : (
                      <div className="py-10 text-center text-slate-400 italic text-xs uppercase tracking-widest font-black opacity-50">Sem logs de auditoria</div>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* MODAL DE ATIVAÇÃO CORRIGIDO */}
        <AnimatePresence>
          {activationModal.isOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200">
                <div className="p-10 text-center space-y-6">
                  <div className="w-20 h-20 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center text-emerald-500 mx-auto border border-emerald-100 shadow-inner group">
                    <CheckCircle size={40} className="group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Ativar Sistema</h3>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Confirmação de Recebimento</p>
                  </div>
                  
                  <div className="space-y-4 text-left">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Método Utilizado</label>
                      <select 
                        value={activationModal.payment_method}
                        onChange={(e) => setActivationModal({ ...activationModal, payment_method: e.target.value })}
                        className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-sm font-black outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all uppercase tracking-tighter"
                      >
                        <option value="PIX">PIX (Instantâneo)</option>
                        <option value="CARTAO">Cartão de Crédito</option>
                        <option value="BOLETO">Boleto Bancário</option>
                        <option value="DINHEIRO">Dinheiro Vivo</option>
                        <option value="CORTESIA">Liberação Cortesia</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Data da Efetivação</label>
                      <input 
                        type="date"
                        value={activationModal.payment_date}
                        onChange={(e) => setActivationModal({ ...activationModal, payment_date: e.target.value })}
                        className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-sm font-black outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all uppercase tracking-tighter"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button onClick={() => setActivationModal({ ...activationModal, isOpen: false })} className="flex-1 h-14 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">Abortar</button>
                    <button onClick={confirmActivation} disabled={saving} className="flex-1 h-14 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 italic">
                      {saving ? "Processando..." : "Confirmar Recebimento"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className={cn("fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-800/10 backdrop-blur-md", toast.type === 'success' ? 'bg-slate-900 text-white' : 'bg-red-600 text-white')}>
              {toast.type === 'success' ? <CheckCircle className="text-emerald-400" size={18} /> : <AlertCircle className="text-white" size={18} />}
              <span className="font-black text-[10px] uppercase tracking-widest italic">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <SuperAdminModal isOpen={showModal} onClose={() => setShowModal(false)} editingTenant={editingTenant} form={form} setForm={setForm} onSubmit={handleSubmit} saving={saving} />
      <PricingPlansModal isOpen={showPlansModal} onClose={() => setShowPlansModal(false)} />
      
      {/* CORREÇÃO DO MODAL DE DELETAR: Agora usando 'isOpen' corretamente */}
      <DeleteConfirmationModal 
        isOpen={deleteModal.isOpen} 
        onClose={() => setDeleteModal({ isOpen: false, tenant: null })} 
        onConfirm={handleDelete} 
        title="Remover Unidade" 
        message="Deseja excluir permanentemente este parceiro da rede?" 
        itemName={deleteModal.tenant?.name || ""} 
        loading={saving} 
      />
      
      <TenantUsersModal isOpen={usersModal.isOpen} onClose={() => setUsersModal({ isOpen: false, tenant: null })} tenant={usersModal.tenant} />
    </div>
  );
}

// Icon wrapper for consistency
import { Shield as ShieldIcon } from "lucide-react";
