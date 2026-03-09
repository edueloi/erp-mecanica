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
  History,
  Activity,
  X,
  Wallet,
  Zap,
  Layers,
  Briefcase,
  Menu
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
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

type AdminTab = 'dashboard' | 'workshops' | 'plans' | 'profile' | 'team';

export default function SuperAdmin() {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  
  const activeTab = tab || 'dashboard';

  const [tenants, setTenants] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; tenant: any | null }>({ isOpen: false, tenant: null });
  const [usersModal, setUsersModal] = useState<{ isOpen: boolean; tenant: any | null }>({ isOpen: false, tenant: null });
  const [historyDrawer, setHistoryDrawer] = useState<{ isOpen: boolean; tenant: any | null; logs: any[] }>({ isOpen: false, tenant: null, logs: [] });
  const [activationModal, setActivationModal] = useState<{ isOpen: boolean; tenant: any | null; payment_method: string; payment_date: string }>({ 
    isOpen: false, tenant: null, payment_method: 'PIX', payment_date: new Date().toISOString().split('T')[0] 
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);
  const isVendedor = user?.role === 'VENDEDOR';

  const [form, setForm] = useState({
    name: "", document: "", phone: "", address: "", user_limit: 5, subscription_value: 0, due_day: 5, plan_id: "", logo_url: "", admin_name: "", admin_email: "", admin_password: "", admin_photo: ""
  });

  useEffect(() => {
    if (editingTenant) {
      setForm({
        name: editingTenant.name || "",
        document: editingTenant.document || "",
        phone: editingTenant.phone || "",
        address: editingTenant.address || "",
        user_limit: editingTenant.user_limit || 5,
        subscription_value: editingTenant.subscription_value || 0,
        due_day: editingTenant.due_day || 5,
        plan_id: editingTenant.plan_id || "",
        logo_url: editingTenant.logo_url || "",
        admin_name: editingTenant.admin_name || "",
        admin_email: editingTenant.admin_email || "",
        admin_password: "",
        admin_photo: editingTenant.admin_photo || ""
      });
    } else {
      setForm({
        name: "", document: "", phone: "", address: "", user_limit: 5, subscription_value: 0, due_day: 5, plan_id: "", logo_url: "", admin_name: "", admin_email: "", admin_password: "", admin_photo: ""
      });
    }
  }, [editingTenant]);

  // Formulário para Membro da Equipe
  const [teamForm, setTeamForm] = useState({
    name: "", email: "", password: "", role: "VENDEDOR", phone: "", cpf: "", profession: ""
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
      
      if (!isVendedor) {
        const teamRes = await api.get("/superadmin/team");
        setTeam(Array.isArray(teamRes.data) ? teamRes.data : []);
      }
    } catch (err: any) {
      showToast("Erro ao carregar dados", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'VENDEDOR')) {
      navigate('/');
      return;
    }
    loadData();
  }, [activeTab]);

  const calculateUsageTime = (createdAt: string) => {
    if (!createdAt) return "---";
    const start = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 30) return `${diffDays} dias`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} ${diffMonths === 1 ? 'mês' : 'meses'}`;
    return `${Math.floor(diffMonths / 12)} anos`;
  };

  const calculateExpirationDate = (lastPaymentDate: string, durationMonths: number) => {
    if (!lastPaymentDate) return "Não Ativado";
    const date = new Date(lastPaymentDate);
    date.setMonth(date.getMonth() + (durationMonths || 1));
    return date.toLocaleDateString('pt-BR');
  };

  const stats = useMemo(() => {
    const totalMRR = tenants.reduce((acc, t) => acc + (t.subscription_value || 0), 0);
    const myEarnings = isVendedor ? totalMRR * 0.30 : 0;
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

    return { totalMRR, myEarnings, activeTenants, totalUsers, overdueCount, ticketMedio, planStats };
  }, [tenants, plans, isVendedor]);

  const loadTenantLogs = async (tenant: any) => {
    try {
      const res = await api.get(`/superadmin/tenants/${tenant.id}/logs`);
      setHistoryDrawer({ isOpen: true, tenant, logs: Array.isArray(res.data) ? res.data : [] });
    } catch (err) {
      setHistoryDrawer({ isOpen: true, tenant, logs: [] });
    }
  };

  const handleStatusChange = async (tenant: any, newStatus: string) => {
    if (newStatus === 'ACTIVE' && tenant.status !== 'ACTIVE') {
      setActivationModal({ isOpen: true, tenant, payment_method: 'PIX', payment_date: new Date().toISOString().split('T')[0] });
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
        status: 'ACTIVE', payment_date: activationModal.payment_date, payment_method: activationModal.payment_method
      });
      showToast("Sistema ativado!");
      setActivationModal({ ...activationModal, isOpen: false });
      loadData();
    } catch (err) {
      showToast("Erro ao ativar", "error");
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
        showToast("Parceiro criado");
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Erro", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/superadmin/team", teamForm);
      showToast("Membro adicionado!");
      setShowTeamModal(false);
      setTeamForm({ name: "", email: "", password: "", role: "VENDEDOR", phone: "", cpf: "", profession: "" });
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Erro", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.tenant) return;
    setSaving(true);
    try {
      await api.delete(`/superadmin/tenants/${deleteModal.tenant.id}`);
      showToast("Removido com sucesso");
      setDeleteModal({ isOpen: false, tenant: null });
      loadData();
    } catch (err: any) {
      showToast("Erro ao excluir", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteTeamMember = async (id: string) => {
    if (confirm("Remover este membro da equipe?")) {
      try {
        await api.delete(`/superadmin/team/${id}`);
        showToast("Membro removido");
        loadData();
      } catch (err: any) {
        showToast(err.response?.data?.error || "Erro", "error");
      }
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.admin_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'workshops', label: isVendedor ? 'Minha Carteira' : 'Parceiros', icon: Building2 },
    !isVendedor && { id: 'team', label: 'Equipe', icon: Briefcase },
    !isVendedor && { id: 'plans', label: 'Planos', icon: Package },
    { id: 'profile', label: 'Meu Perfil', icon: UserCircle },
  ].filter(Boolean) as any[];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans antialiased text-slate-900 overflow-hidden h-screen relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col z-50 transform transition-transform duration-300 shadow-2xl lg:relative lg:translate-x-0 lg:w-60 lg:z-30",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 flex items-center justify-between lg:justify-start gap-3 border-b border-slate-800 lg:border-none mb-4 lg:mb-8">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shrink-0", isVendedor ? "bg-blue-500" : "bg-emerald-500")}>
              {isVendedor ? <TrendingUp className="text-white" size={22} /> : <Shield className="text-white" size={22} />}
            </div>
            <div className="overflow-hidden">
              <h1 className="font-black text-base leading-none tracking-tight uppercase italic">MecaERP</h1>
              <p className={cn("text-[8px] font-black uppercase tracking-widest mt-1", isVendedor ? "text-blue-400" : "text-emerald-400")}>
                {isVendedor ? 'Vendedor' : 'Super Admin'}
              </p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 hover:bg-slate-800 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-4 flex-1">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button 
                key={item.id} 
                onClick={() => {
                  navigate(`/superadmin/${item.id}`);
                  setIsSidebarOpen(false);
                }} 
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all group", 
                  activeTab === item.id 
                    ? (isVendedor ? "bg-blue-50 text-blue-600 shadow-md" : "bg-emerald-50 text-emerald-600 shadow-md") 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon size={18} className={activeTab === item.id ? (isVendedor ? "text-blue-600" : "text-emerald-600") : "text-slate-500 group-hover:text-white"} />
                <span className="uppercase tracking-wider">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-slate-800">
          <button onClick={() => { logout(); navigate('/login'); }} className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-bold text-xs uppercase tracking-widest"><LogOut size={18} /><span>Sair</span></button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] overflow-hidden relative w-full">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shrink-0 relative z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-all">
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <span className={cn("italic font-black", isVendedor ? "text-blue-600" : "text-emerald-600")}>{isVendedor ? 'Sales' : 'Root'}</span>
              <ChevronRight size={10} /><span className="text-slate-900">{activeTab}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6 pb-20">
            {activeTab === 'dashboard' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {isVendedor ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">Meus Ganhos (30%)</p>
                      <h3 className="text-4xl font-black mt-2">R$ {stats.myEarnings.toLocaleString('pt-BR')}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col justify-center">
                      <p className="text-[10px] font-black uppercase text-slate-400">Ativos na Carteira</p>
                      <p className="text-3xl font-black text-slate-900 mt-1">{stats.activeTenants}</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'MRR Total', value: `R$ ${stats.totalMRR.toLocaleString('pt-BR')}`, icon: DollarSign, color: 'emerald' },
                      { label: 'Unidades', value: stats.activeTenants, icon: Building2, color: 'purple' },
                      { label: 'Usuários', value: stats.totalUsers, icon: Users, color: 'orange' },
                      { label: 'Atrasos', value: stats.overdueCount, icon: AlertTriangle, color: 'red' },
                    ].map((stat, i) => (
                      <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : stat.color === 'purple' ? 'bg-purple-50 text-purple-600' : stat.color === 'orange' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600')}>
                          <stat.icon size={20} />
                        </div>
                        <p className="text-slate-400 text-[9px] font-black uppercase">{stat.label}</p>
                        <h3 className="text-xl font-black text-slate-900">{stat.value}</h3>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'workshops' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-900 uppercase">Parceiros</h2>
                  <button onClick={() => { setEditingTenant(null); setShowModal(true); }} className="h-10 px-3 lg:px-5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-md">
                    <Plus size={14} /> 
                    <span className="hidden sm:inline">Novo Cadastro</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredTenants.map((t) => (
                    <div key={t.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 border border-slate-100">
                            {t.logo_url ? <img src={t.logo_url} className="w-full h-full object-contain" /> : <Building2 className="text-slate-300" size={18} />}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-black text-slate-900 text-sm leading-tight truncate uppercase">{t.name}</h4>
                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{t.plan_name || 'Custom'}</p>
                          </div>
                        </div>
                        <select value={t.status || 'ACTIVE'} onChange={(e) => handleStatusChange(t, e.target.value)} className={cn("h-6 px-2 rounded-lg text-[8px] font-black uppercase border", STATUS_CONFIG[t.status || 'ACTIVE']?.bg || 'bg-slate-50', STATUS_CONFIG[t.status || 'ACTIVE']?.color || 'text-slate-600')}>
                          {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (<option key={val} value={val}>{cfg.label}</option>))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Membro desde</p>
                          <div className="flex items-center gap-1.5">
                            <Calendar size={10} className="text-slate-400" />
                            <p className="text-[9px] font-bold text-slate-700">{new Date(t.created_at).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Validade</p>
                          <div className="flex items-center gap-1.5">
                            <Clock size={10} className="text-emerald-500" />
                            <p className="text-[9px] font-bold text-emerald-600">{calculateExpirationDate(t.last_payment_date, t.plan_duration)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-1 mt-auto pt-4 border-t border-slate-50">
                        <button onClick={() => loadTenantLogs(t)} title="Histórico" className="w-8 h-8 bg-slate-50 text-slate-500 rounded-lg flex items-center justify-center hover:bg-slate-100 border border-slate-200 shrink-0"><History size={14} /></button>
                        <button onClick={() => setUsersModal({ isOpen: true, tenant: t })} className="flex-1 h-8 bg-slate-50 text-slate-600 rounded-lg text-[8px] font-black uppercase flex items-center justify-center gap-1 border border-slate-200 px-1"><Users size={12} /><span className="hidden sm:inline">Usuários</span></button>
                        <button onClick={() => { setEditingTenant(t); setShowModal(true); }} className="flex-1 h-8 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase flex items-center justify-center gap-1 px-1"><Edit2 size={12} /><span className="hidden sm:inline">Editar</span></button>
                        <button onClick={() => setDeleteModal({ isOpen: true, tenant: t })} title="Excluir" className="w-8 h-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center border border-red-100 shrink-0"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'team' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-900 uppercase">Equipe</h2>
                  <button onClick={() => setShowTeamModal(true)} className="h-10 px-5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase flex items-center gap-2"><Plus size={14} /> Novo Membro</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {team.map((m) => (
                    <div key={m.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
                      <button onClick={() => deleteTeamMember(m.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                      <h3 className="font-black text-slate-900 uppercase">{m.name}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'plans' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-900 uppercase">Planos de Preços</h2>
                  <button onClick={() => setShowPlansModal(true)} className="h-10 px-5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-md">
                    <Plus size={14} /> Gerenciar Planos
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {plans.map((p) => (
                    <div key={p.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4">
                        <div className={cn("px-2 py-1 rounded-lg text-[8px] font-black uppercase", p.active ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400")}>
                          {p.active ? "Ativo" : "Inativo"}
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <h3 className="text-lg font-black text-slate-900 uppercase">{p.name}</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">{p.description || "Sem descrição"}</p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-2">
                            <Users size={14} className="text-slate-400" />
                            <span className="text-[10px] font-black text-slate-600 uppercase">Usuários</span>
                          </div>
                          <span className="text-sm font-black text-slate-900">{p.user_limit}</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-slate-400" />
                            <span className="text-[10px] font-black text-slate-600 uppercase">Duração</span>
                          </div>
                          <span className="text-sm font-black text-slate-900">{p.months_duration} {p.months_duration === 1 ? 'mês' : 'meses'}</span>
                        </div>
                        
                        <div className="pt-4 border-t border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Mensal</p>
                          <h4 className="text-2xl font-black text-emerald-600">R$ {p.monthly_value.toLocaleString('pt-BR')}</h4>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-900 uppercase">Meu Perfil</h2>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
                      <div className="relative inline-block mb-4">
                        <div className="w-24 h-24 rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                          {user?.photo_url ? (
                            <img src={user.photo_url} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <UserCircle className="text-slate-300" size={48} />
                          )}
                        </div>
                        <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-emerald-600 transition-all border-4 border-white">
                          <Plus size={14} />
                        </button>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 uppercase">{user?.name}</h3>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">{user?.role}</p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Segurança</h4>
                      <button className="w-full h-12 bg-slate-50 text-slate-600 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-slate-100 border border-slate-200 transition-all">
                        <Shield size={14} /> Alterar Senha
                      </button>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-2">
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dados Pessoais</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nome Completo</label>
                          <input disabled value={user?.name} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-500" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">E-mail</label>
                          <input disabled value={user?.email} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-500" />
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-400 italic">Dica: Para alterar seus dados, contate o administrador do sistema raiz.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {historyDrawer.isOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setHistoryDrawer({ ...historyDrawer, isOpen: false })} className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-[100]" />
              <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="absolute right-0 top-0 h-full w-full sm:w-[400px] lg:w-[35%] bg-white shadow-2xl z-[110] border-l border-slate-100 flex flex-col">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div>
                    <h3 className="font-black text-sm uppercase">Histórico de Auditoria</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">{historyDrawer.tenant?.name}</p>
                  </div>
                  <button onClick={() => setHistoryDrawer({ ...historyDrawer, isOpen: false })} className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors"><X size={20} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {historyDrawer.logs.length === 0 ? (
                    <div className="text-center py-20">
                      <History size={40} className="mx-auto text-slate-200 mb-4" />
                      <p className="text-slate-400 font-bold text-xs uppercase">Nenhum registro encontrado</p>
                    </div>
                  ) : (
                    historyDrawer.logs.map((log) => (
                      <div key={log.id} className="relative pl-10 border-l-2 border-slate-100 pb-2">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-emerald-500 shadow-sm flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        </div>
                        
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 hover:border-emerald-200 transition-all group">
                          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-200/60">
                            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                              {log.user_photo ? (
                                <img src={log.user_photo} className="w-full h-full object-cover" />
                              ) : (
                                <UserCircle className="text-slate-300" size={24} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-black text-slate-900 uppercase truncate">{log.user_name || 'Sistema'}</p>
                              <p className="text-[9px] font-bold text-slate-400 truncate">{log.user_email || 'automático'}</p>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">{log.action_type}</p>
                            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{log.description}</p>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-1 text-slate-400">
                              <Clock size={10} />
                              <span className="text-[8px] font-black uppercase">{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                            </div>
                            {log.payment_method && (
                              <div className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[8px] font-black uppercase">
                                {log.payment_method}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showTeamModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden p-8">
                <div className="flex justify-between mb-6">
                  <h3 className="font-black uppercase tracking-widest text-sm">Criar Acesso</h3>
                  <button onClick={() => setShowTeamModal(false)}><X size={20} /></button>
                </div>
                <form onSubmit={handleTeamSubmit} className="space-y-4">
                  <input required placeholder="Nome" value={teamForm.name} onChange={e=>setTeamForm({...teamForm, name: e.target.value})} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold" />
                  <select value={teamForm.role} onChange={e=>setTeamForm({...teamForm, role: e.target.value})} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold">
                    <option value="VENDEDOR">Vendedor</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                  <input required type="email" placeholder="E-mail" value={teamForm.email} onChange={e=>setTeamForm({...teamForm, email: e.target.value})} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold" />
                  <input required type="password" placeholder="Senha" value={teamForm.password} onChange={e=>setTeamForm({...teamForm, password: e.target.value})} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold" />
                  <button type="submit" disabled={saving} className="w-full h-14 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600">Criar Agora</button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activationModal.isOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center space-y-4">
                <CheckCircle size={40} className="mx-auto text-emerald-500" />
                <h3 className="text-xl font-black uppercase">Registrar Recebimento</h3>
                <div className="space-y-3 text-left">
                  <select value={activationModal.payment_method} onChange={e=>setActivationModal({...activationModal, payment_method: e.target.value})} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-sm">
                    <option value="PIX">PIX</option><option value="CARTAO">Cartão</option><option value="BOLETO">Boleto</option>
                  </select>
                  <input type="date" value={activationModal.payment_date} onChange={e=>setActivationModal({...activationModal, payment_date: e.target.value})} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-sm" />
                </div>
                <div className="flex gap-2 pt-4">
                  <button onClick={() => setActivationModal({...activationModal, isOpen: false})} className="flex-1 h-12 bg-slate-100 text-slate-500 font-black rounded-xl uppercase text-xs">Sair</button>
                  <button onClick={confirmActivation} className="flex-1 h-12 bg-emerald-600 text-white font-black rounded-xl uppercase text-xs">Ativar</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <SuperAdminModal isOpen={showModal} onClose={() => setShowModal(false)} editingTenant={editingTenant} form={form} setForm={setForm} onSubmit={handleSubmit} saving={saving} />
      <PricingPlansModal isOpen={showPlansModal} onClose={() => setShowPlansModal(false)} />
      <DeleteConfirmationModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, tenant: null })} onConfirm={handleDelete} title="Excluir" message="Tem certeza?" itemName={deleteModal.tenant?.name || ""} loading={saving} />
      <TenantUsersModal isOpen={usersModal.isOpen} onClose={() => setUsersModal({ isOpen: false, tenant: null })} tenant={usersModal.tenant} />
    </div>
  );
}
