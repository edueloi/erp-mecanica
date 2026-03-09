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
  MoreVertical,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  Eye,
  Package,
  Settings
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

export default function SuperAdmin() {
  const [tenants, setTenants] = useState<any[]>([]);
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
    admin_name: "",
    admin_email: "",
    admin_password: ""
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadTenants = async () => {
    try {
      setLoading(true);
      const res = await api.get("/superadmin/tenants");
      setTenants(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      showToast(err.response?.data?.error || "Erro ao carregar oficinas", "error");
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'SUPER_ADMIN') {
      navigate('/');
      return;
    }
    loadTenants();
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
          plan_id: form.plan_id || null
        });
        showToast("Oficina atualizada com sucesso");
      } else {
        await api.post("/superadmin/tenants", form);
        showToast("Oficina criada com sucesso");
      }
      setShowModal(false);
      loadTenants();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Erro ao salvar", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.tenant) return;
    setSaving(true);
    try {
      await api.delete(`/superadmin/tenants/${deleteModal.tenant.id}`);
      showToast("Oficina excluída com sucesso");
      setDeleteModal({ isOpen: false, tenant: null });
      loadTenants();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Erro ao excluir", "error");
    } finally {
      setSaving(false);
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.phone?.includes(searchTerm)
  );

  const totalMRR = tenants.reduce((acc, t) => acc + (t.subscription_value || 0), 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans antialiased text-slate-900">
      {/* Refined Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-50">
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
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-xl font-bold text-xs transition-all border border-slate-200"
          >
            <Package size={16} className="text-emerald-500" />
            <span className="hidden sm:inline">Planos e Preços</span>
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
            <p className="text-slate-500 font-medium">Gestão completa de oficinas, assinaturas e limites.</p>
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
            { 
              label: 'Oficinas Ativas', 
              value: tenants.length, 
              icon: Building2, 
              color: 'text-emerald-600', 
              bg: 'bg-emerald-50', 
            },
            { 
              label: 'Usuários Totais', 
              value: tenants.reduce((acc, t) => acc + t.user_count, 0), 
              icon: Users, 
              color: 'text-blue-600', 
              bg: 'bg-blue-50', 
            },
            { 
              label: 'Faturamento MRR', 
              value: `R$ ${totalMRR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
              icon: DollarSign, 
              color: 'text-amber-600', 
              bg: 'bg-amber-50', 
            },
            { 
              label: 'Média por Oficina', 
              value: tenants.length ? (tenants.reduce((acc, t) => acc + t.user_count, 0) / tenants.length).toFixed(1) : 0, 
              icon: Shield, 
              color: 'text-purple-600', 
              bg: 'bg-purple-50', 
            },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
            >
              <div className="relative z-10">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300", stat.bg, stat.color)}>
                  <stat.icon size={24} />
                </div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
                <h3 className="text-2xl font-black text-slate-900 tabular-nums">{stat.value}</h3>
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
                  placeholder="Buscar oficina por nome ou telefone..." 
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

          {/* Desktop Table - Hidden on small screens */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Oficina / Plano</th>
                  <th className="px-8 py-5 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] text-center">Mensalidade / Venc.</th>
                  <th className="px-8 py-5 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] text-center">Usuários / Limite</th>
                  <th className="px-8 py-5 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-32 text-center">
                      <div className="w-12 h-12 border-4 border-slate-100 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-slate-500 font-bold">Processando dados...</p>
                    </td>
                  </tr>
                ) : filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-32 text-center">
                      <div className="max-w-xs mx-auto space-y-3">
                        <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mx-auto">
                          <Building2 size={32} />
                        </div>
                        <p className="text-slate-400 font-bold">Nenhuma oficina encontrada.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((t, idx) => (
                    <motion.tr 
                      key={t.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-slate-900 rounded-[1.25rem] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-slate-900/10 group-hover:scale-110 transition-transform">
                            {t.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-slate-900 text-base tracking-tight leading-none group-hover:text-emerald-600 transition-colors">
                                {t.name}
                              </h4>
                              {t.plan_name && (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-lg uppercase tracking-wider border border-emerald-100">
                                  {t.plan_name}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                <Phone className="w-3.5 h-3.5" /> {t.phone || 'N/A'}
                              </span>
                              <span className="w-1 h-1 bg-slate-300 rounded-full" />
                              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                <MapPin className="w-3.5 h-3.5" /> {t.city || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-sm font-black text-slate-900 tabular-nums">
                            R$ {(t.subscription_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-black uppercase tracking-widest rounded-lg border border-amber-100">
                            <Calendar size={10} />
                            DIA {t.due_day || 5}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-end gap-1.5">
                            <span className="text-lg font-black text-slate-900 leading-none">{t.user_count}</span>
                            <span className="text-[10px] font-bold text-slate-300 uppercase pb-0.5">/ {t.user_limit} USERS</span>
                          </div>
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (t.user_count / t.user_limit) * 100)}%` }}
                              className={cn(
                                "h-full transition-all",
                                (t.user_count / t.user_limit) > 0.9 ? 'bg-red-500' : 'bg-emerald-500'
                              )}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => setUsersModal({ isOpen: true, tenant: t })}
                            className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-2xl transition-all shadow-sm"
                            title="Ver Usuários"
                          >
                            <Users className="w-4.5 h-4.5" />
                          </button>
                          <button 
                            onClick={() => {
                              setEditingTenant(t);
                              setForm({
                                ...form,
                                name: t.name,
                                document: t.document || "",
                                phone: t.phone || "",
                                address: t.address || "",
                                user_limit: t.user_limit,
                                subscription_value: t.subscription_value || 0,
                                due_day: t.due_day || 5,
                                plan_id: t.plan_id || ""
                              });
                              setShowModal(true);
                            }}
                            className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 rounded-2xl transition-all shadow-sm"
                            title="Configurações"
                          >
                            <Edit2 className="w-4.5 h-4.5" />
                          </button>
                          <button 
                            onClick={() => setDeleteModal({ isOpen: true, tenant: t })}
                            className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded-2xl transition-all shadow-sm"
                            title="Excluir Oficina"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Grid - Visible only on small screens */}
          <div className="lg:hidden p-4 space-y-4">
            {loading ? (
              <div className="py-20 text-center">
                <div className="w-10 h-10 border-4 border-slate-100 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-500 font-bold">Processando...</p>
              </div>
            ) : filteredTenants.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <p className="font-bold">Nenhuma oficina encontrada.</p>
              </div>
            ) : (
              filteredTenants.map((t, idx) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-slate-50/50 rounded-3xl p-5 border border-slate-100 space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-slate-900/10">
                        {t.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-black text-slate-900 text-base leading-none">{t.name}</h4>
                          {t.plan_name && (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded-lg uppercase tracking-wider border border-emerald-100">
                              {t.plan_name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span className="text-xs font-bold text-slate-400">{t.phone || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-black text-slate-900">R$ {(t.subscription_value || 0).toLocaleString('pt-BR')}</span>
                      <span className="text-[9px] font-black text-amber-600 uppercase bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">Dia {t.due_day || 5}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-white rounded-2xl p-3 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-slate-400" />
                      <span className="text-xs font-bold text-slate-600">Usuários: <span className="text-slate-900">{t.user_count}/{t.user_limit}</span></span>
                    </div>
                    <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all",
                          (t.user_count / t.user_limit) > 0.9 ? 'bg-red-500' : 'bg-emerald-500'
                        )}
                        style={{ width: `${Math.min(100, (t.user_count / t.user_limit) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button 
                      onClick={() => setUsersModal({ isOpen: true, tenant: t })}
                      className="flex-1 h-11 bg-white border border-slate-200 text-blue-600 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:bg-blue-50 transition-all"
                    >
                      <Users size={16} /> Usuários
                    </button>
                    <button 
                      onClick={() => {
                        setEditingTenant(t);
                        setForm({
                          ...form,
                          name: t.name,
                          document: t.document || "",
                          phone: t.phone || "",
                          address: t.address || "",
                          user_limit: t.user_limit,
                          subscription_value: t.subscription_value || 0,
                          due_day: t.due_day || 5,
                          plan_id: t.plan_id || ""
                        });
                        setShowModal(true);
                      }}
                      className="flex-1 h-11 bg-white border border-slate-200 text-amber-600 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:bg-amber-50 transition-all"
                    >
                      <Edit2 size={16} /> Editar
                    </button>
                    <button 
                      onClick={() => setDeleteModal({ isOpen: true, tenant: t })}
                      className="w-11 h-11 bg-white border border-slate-200 text-red-600 rounded-xl flex items-center justify-center shadow-sm active:bg-red-50 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </main>

      <SuperAdminModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        editingTenant={editingTenant}
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
        saving={saving}
      />

      <PricingPlansModal 
        isOpen={showPlansModal}
        onClose={() => setShowPlansModal(false)}
      />

      <DeleteConfirmationModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, tenant: null })}
        onConfirm={handleDelete}
        title="Excluir Oficina"
        message="Tem certeza que deseja excluir esta oficina? Todos os usuários e dados vinculados serão apagados permanentemente."
        itemName={deleteModal.tenant?.name || ""}
        loading={saving}
      />

      <TenantUsersModal 
        isOpen={usersModal.isOpen}
        onClose={() => setUsersModal({ isOpen: false, tenant: null })}
        tenant={usersModal.tenant}
      />

      {/* Notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={cn(
              "fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 rounded-[1.5rem] shadow-2xl flex items-center gap-3 border",
              toast.type === 'success' 
                ? 'bg-slate-900 border-emerald-500/20 text-white' 
                : 'bg-red-600 border-red-500/20 text-white'
            )}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="text-emerald-400" size={20} />
            ) : (
              <AlertCircle className="text-red-200" size={20} />
            )}
            <span className="font-bold text-sm tracking-tight">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
