import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  Users, 
  Shield, 
  Plus, 
  Trash2, 
  Edit2, 
  LogOut,
  Phone,
  MapPin,
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
  Mail
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

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  ACTIVE: { label: "Ativo", color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle },
  INACTIVE: { label: "Inativo", color: "text-slate-400", bg: "bg-slate-50", icon: Clock },
  TRIAL: { label: "Teste", color: "text-blue-600", bg: "bg-blue-50", icon: Calendar },
  OVERDUE: { label: "Atrasado", color: "text-amber-600", bg: "bg-amber-50", icon: AlertTriangle },
  PENDING_PAYMENT: { label: "Pendente", color: "text-purple-600", bg: "bg-purple-50", icon: DollarSign },
  BLOCKED: { label: "Bloqueado", color: "text-red-600", bg: "bg-red-50", icon: Ban },
};

export default function SuperAdmin() {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingTenant) {
        await api.patch(`/superadmin/tenants/${editingTenant.id}`, { 
          name: form.name,
          document: form.document,
          phone: form.phone,
          address: form.address,
          user_limit: form.user_limit,
          subscription_value: form.subscription_value,
          due_day: form.due_day,
          plan_id: form.plan_id || null,
          logo_url: form.logo_url,
          admin_name: form.admin_name,
          admin_email: form.admin_email,
          admin_password: form.admin_password || undefined
        });
        showToast("Oficina atualizada com sucesso");
      } else {
        await api.post("/superadmin/tenants", form);
        showToast("Oficina criada com sucesso");
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Erro ao salvar", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateField = async (tenantId: string, field: string, value: any) => {
    try {
      await api.patch(`/superadmin/tenants/${tenantId}`, { [field]: value });
      showToast("Dados atualizados com sucesso");
      loadData();
    } catch (err: any) {
      showToast("Erro ao atualizar", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.tenant) return;
    setSaving(true);
    try {
      await api.delete(`/superadmin/tenants/${deleteModal.tenant.id}`);
      showToast("Oficina excluída com sucesso");
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

  const totalMRR = tenants.reduce((acc, t) => acc + (t.subscription_value || 0), 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans antialiased text-slate-900">
      {/* Refined Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/10">
            <Shield className="text-white w-6 h-6" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-slate-900 font-bold text-lg leading-none tracking-tight">MecaERP</h1>
            <p className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Super Painel</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={() => setShowPlansModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-bold text-xs transition-all border border-emerald-100 shadow-sm"
          >
            <Package size={16} />
            <span className="hidden sm:inline">Tabelas de Preço</span>
          </button>

          <div className="h-8 w-px bg-slate-200 hidden sm:block mx-2" />

          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-bold text-slate-900 tabular-nums">{user?.name}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Administrador Geral</span>
          </div>
          
          <button 
            onClick={() => { logout(); navigate('/login'); }}
            className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 border border-transparent hover:border-red-100"
            title="Sair do sistema"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Breadcrumb & Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              <span>Admin</span>
              <ChevronRight size={10} />
              <span className="text-emerald-600">Dashboard Central</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Visão Geral</h2>
            <p className="text-slate-500 font-medium">Gestão completa de oficinas, assinaturas e status.</p>
          </div>
          
          <button 
            onClick={() => {
              setEditingTenant(null);
              setForm({
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
              setShowModal(true);
            }}
            className="group relative flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/10 rounded-2xl transition-all" />
            <Plus className="w-5 h-5 text-emerald-400" />
            <span>Nova Oficina</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Oficinas Ativas', value: tenants.length, icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Usuários Totais', value: tenants.reduce((acc, t) => acc + (t.user_count || 0), 0), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Faturamento MRR', value: `R$ ${totalMRR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Inadimplentes', value: tenants.filter(t => t.status === 'OVERDUE' || t.status === 'PENDING_PAYMENT').length, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all group">
              <div className="relative z-10">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300", stat.bg, stat.color)}>
                  <stat.icon size={24} />
                </div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
                <h3 className="text-2xl font-black text-slate-900 tabular-nums tracking-tight">{stat.value}</h3>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters & Table Section */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white">
             <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar por nome, e-mail ou telefone..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 font-medium text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
             </div>
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-3">
                  {filteredTenants.length} OFICINAS CADASTRADAS
                </span>
             </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Oficina / Contato</th>
                  <th className="px-8 py-5 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] text-center">Status de Acesso</th>
                  <th className="px-8 py-5 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] text-center">Assinatura</th>
                  <th className="px-8 py-5 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={4} className="py-32 text-center text-slate-400 font-bold">Processando dados...</td></tr>
                ) : filteredTenants.map((t, idx) => {
                  return (
                    <motion.tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-5">
                          <div className={cn("w-14 h-14 rounded-[1.25rem] flex items-center justify-center overflow-hidden shadow-lg shadow-slate-900/10", t.logo_url ? "bg-white border border-slate-200" : "bg-slate-900 text-white")}>
                            {t.logo_url ? (
                              <img src={t.logo_url} alt={t.name} className="w-full h-full object-contain p-2" />
                            ) : (
                              <span className="font-black text-xl">{t.name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-black text-slate-900 text-base tracking-tight leading-none">{t.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Mail size={10} /> {t.admin_email || 'N/A'}</span>
                              <span className="w-1 h-1 bg-slate-300 rounded-full" />
                              <select 
                                value={t.plan_id || ""} 
                                onChange={(e) => handleUpdateField(t.id, 'plan_id', e.target.value || null)}
                                className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 outline-none cursor-pointer hover:bg-emerald-100 transition-all uppercase"
                              >
                                <option value="">Sem Plano</option>
                                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <select 
                          value={t.status || 'ACTIVE'} 
                          onChange={(e) => handleUpdateField(t.id, 'status', e.target.value)}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer outline-none shadow-sm",
                            STATUS_CONFIG[t.status || 'ACTIVE'].bg,
                            STATUS_CONFIG[t.status || 'ACTIVE'].color,
                            "border-transparent hover:border-current"
                          )}
                        >
                          {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                            <option key={val} value={val} className="text-slate-900 font-medium">{cfg.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-sm font-black text-slate-900 tabular-nums">R$ {(t.subscription_value || 0).toLocaleString('pt-BR')}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">DIA {t.due_day || 5}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setUsersModal({ isOpen: true, tenant: t })} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-2xl transition-all shadow-sm"><Users size={18} /></button>
                          <button onClick={() => { 
                            setEditingTenant(t); 
                            setForm({
                              name: t.name,
                              document: t.document || "",
                              phone: t.phone || "",
                              address: t.address || "",
                              user_limit: t.user_limit,
                              subscription_value: t.subscription_value || 0,
                              due_day: t.due_day || 5,
                              plan_id: t.plan_id || "",
                              logo_url: t.logo_url || "",
                              admin_name: t.admin_name || "",
                              admin_email: t.admin_email || "",
                              admin_password: ""
                            }); 
                            setShowModal(true); 
                          }} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-2xl transition-all shadow-sm"><Edit2 size={18} /></button>
                          <button onClick={() => setDeleteModal({ isOpen: true, tenant: t })} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded-2xl transition-all shadow-sm"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Grid */}
          <div className="lg:hidden p-4 space-y-4">
            {filteredTenants.map((t, idx) => (
              <motion.div key={t.id} className="bg-slate-50/50 rounded-3xl p-5 border border-slate-100 space-y-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg", t.logo_url ? "bg-white border border-slate-200" : "bg-slate-900 text-white")}>
                      {t.logo_url ? (
                        <img src={t.logo_url} alt={t.name} className="w-full h-full object-contain p-1.5" />
                      ) : (
                        <span className="font-black text-lg">{t.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-base leading-none">{t.name}</h4>
                      <div className="text-[10px] text-slate-400 font-bold mt-1 flex items-center gap-1"><Mail size={10} /> {t.admin_email || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900">R$ {t.subscription_value?.toLocaleString('pt-BR')}</div>
                    <div className="text-[9px] font-bold text-slate-400">DIA {t.due_day || 5}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select 
                    value={t.plan_id || ""} 
                    onChange={(e) => handleUpdateField(t.id, 'plan_id', e.target.value || null)}
                    className="flex-1 h-9 px-3 rounded-xl text-[10px] font-black text-emerald-600 bg-white border border-emerald-100 outline-none uppercase"
                  >
                    <option value="">Sem Plano</option>
                    {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <select 
                    value={t.status || 'ACTIVE'} 
                    onChange={(e) => handleUpdateField(t.id, 'status', e.target.value)}
                    className={cn(
                      "flex-1 h-9 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider border shadow-sm outline-none",
                      STATUS_CONFIG[t.status || 'ACTIVE'].bg,
                      STATUS_CONFIG[t.status || 'ACTIVE'].color,
                      "border-current/10"
                    )}
                  >
                    {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                      <option key={val} value={val} className="text-slate-900 font-medium">{cfg.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <button onClick={() => setUsersModal({ isOpen: true, tenant: t })} className="h-12 bg-white border border-slate-200 text-blue-600 rounded-2xl font-bold text-[10px] flex items-center justify-center gap-2 shadow-sm"><Users size={16} /> USUÁRIOS</button>
                  <button onClick={() => { 
                    setEditingTenant(t); 
                    setForm({
                      name: t.name,
                      document: t.document || "",
                      phone: t.phone || "",
                      address: t.address || "",
                      user_limit: t.user_limit,
                      subscription_value: t.subscription_value || 0,
                      due_day: t.due_day || 5,
                      plan_id: t.plan_id || "",
                      logo_url: t.logo_url || "",
                      admin_name: t.admin_name || "",
                      admin_email: t.admin_email || "",
                      admin_password: ""
                    }); 
                    setShowModal(true); 
                  }} className="h-12 bg-white border border-slate-200 text-amber-600 rounded-2xl font-bold text-[10px] flex items-center justify-center gap-2 shadow-sm"><Edit2 size={16} /> EDITAR</button>
                  <button onClick={() => setDeleteModal({ isOpen: true, tenant: t })} className="h-12 bg-white border border-slate-200 text-red-600 rounded-2xl flex items-center justify-center shadow-sm"><Trash2 size={16} /></button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <SuperAdminModal isOpen={showModal} onClose={() => setShowModal(false)} editingTenant={editingTenant} form={form} setForm={setForm} onSubmit={handleSubmit} saving={saving} />
      <PricingPlansModal isOpen={showPlansModal} onClose={() => setShowPlansModal(false)} />
      <DeleteConfirmationModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, tenant: null })} onConfirm={handleDelete} title="Excluir Oficina" message="Tem certeza que deseja excluir esta oficina?" itemName={deleteModal.tenant?.name || ""} loading={saving} />
      <TenantUsersModal isOpen={usersModal.isOpen} onClose={() => setUsersModal({ isOpen: false, tenant: null })} tenant={usersModal.tenant} />

      {/* Notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }} className={cn("fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 rounded-[1.5rem] shadow-2xl flex items-center gap-3 border", toast.type === 'success' ? 'bg-slate-900 border-emerald-500/20 text-white' : 'bg-red-600 border-red-500/20 text-white')}>
            {toast.type === 'success' ? <CheckCircle className="text-emerald-400" size={20} /> : <AlertCircle className="text-red-200" size={20} />}
            <span className="font-bold text-sm tracking-tight">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
