import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Building2, 
  Users, 
  Shield, 
  Plus, 
  Trash2, 
  Edit2, 
  LogOut,
  Save,
  X,
  Phone,
  Mail,
  MapPin,
  ClipboardList,
  ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../services/authStore";
import api from "../services/api";

export default function SuperAdmin() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const navigate = useNavigate();
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);

  const [form, setForm] = useState({
    name: "",
    document: "",
    phone: "",
    address: "",
    user_limit: 5,
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
      setTenants(res.data);
    } catch (err: any) {
      showToast(err.response?.data?.error || "Erro ao carregar oficinas", "error");
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
        await api.patch(`/superadmin/tenants/${editingTenant.id}/limit`, { user_limit: form.user_limit });
        showToast("Limite atualizado com sucesso");
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

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Deseja realmente excluir a oficina "${name}"? Isso apagará todos os dados vinculados!`)) {
      try {
        await api.delete(`/superadmin/tenants/${id}`);
        showToast("Oficina excluída com sucesso");
        loadTenants();
      } catch (err: any) {
        showToast(err.response?.data?.error || "Erro ao excluir", "error");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg">
            M
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">MecaERP</h1>
            <span className="text-emerald-500 text-xs font-semibold uppercase tracking-wider">Super Admin Panel</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span className="text-slate-300 text-sm font-medium">{user?.name}</span>
          </div>
          <button 
            onClick={() => { logout(); navigate('/login'); }}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
        {/* Toast Container */}
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`fixed top-20 right-10 z-[100] px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 ${
              toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {toast.message}
          </motion.div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900">Gerenciamento de Oficinas</h2>
            <p className="text-slate-500">Controle de tenants, usuários e limites do sistema.</p>
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
                admin_name: "",
                admin_email: "",
                admin_password: ""
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-5 h-5" />
            Nova Oficina
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-white">
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl overflow-hidden relative group">
            <div className="relative z-10">
              <p className="text-slate-400 text-sm font-semibold mb-1 uppercase tracking-wider">Total de Oficinas</p>
              <h3 className="text-4xl font-black">{tenants.length}</h3>
            </div>
            <Building2 className="absolute -right-4 -bottom-4 w-24 h-24 text-slate-800 opacity-50 group-hover:scale-110 transition-transform" />
          </div>
          <div className="bg-emerald-600 p-6 rounded-3xl shadow-xl shadow-emerald-600/20 overflow-hidden relative group">
            <div className="relative z-10">
              <p className="text-emerald-100 text-sm font-semibold mb-1 uppercase tracking-wider">Total de Usuários</p>
              <h3 className="text-4xl font-black">{tenants.reduce((acc, t) => acc + t.user_count, 0)}</h3>
            </div>
            <Users className="absolute -right-4 -bottom-4 w-24 h-24 text-emerald-500 opacity-40 group-hover:scale-110 transition-transform" />
          </div>
          <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl overflow-hidden relative group">
            <div className="relative z-10">
              <p className="text-slate-400 text-sm font-semibold mb-1 uppercase tracking-wider">Média Usuários/Tenant</p>
              <h3 className="text-4xl font-black">{tenants.length ? (tenants.reduce((acc, t) => acc + t.user_count, 0) / tenants.length).toFixed(1) : 0}</h3>
            </div>
            <Shield className="absolute -right-4 -bottom-4 w-24 h-24 text-slate-700 opacity-50 group-hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* Tenant Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-5 text-slate-400 font-bold text-xs uppercase tracking-widest">Oficina / Detalhes</th>
                  <th className="px-8 py-5 text-slate-400 font-bold text-xs uppercase tracking-widest text-center">Usuários / Limite</th>
                  <th className="px-8 py-5 text-slate-400 font-bold text-xs uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-slate-400 font-bold text-xs uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center">
                      <div className="w-10 h-10 border-4 border-slate-100 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-slate-500 font-medium">Carregando oficinas...</p>
                    </td>
                  </tr>
                ) : tenants.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center text-slate-400">
                      Nenhuma oficina cadastrada.
                    </td>
                  </tr>
                ) : (
                  tenants.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 font-bold text-xl group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                            {t.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-lg leading-tight mb-1">{t.name}</h4>
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Phone className="w-3 h-3" /> {t.phone || 'N/A'}
                              </span>
                              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                <MapPin className="w-3 h-3" /> {t.city || 'N/A'} - {t.state || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="inline-flex flex-col gap-1">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-lg font-black text-slate-900">{t.user_count}</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-xl font-black text-emerald-600">{t.user_limit}</span>
                          </div>
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden mx-auto">
                            <div 
                              className={`h-full transition-all ${
                                (t.user_count / t.user_limit) > 0.9 ? 'bg-red-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, (t.user_count / t.user_limit) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">
                          Ativo
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => {
                              setEditingTenant(t);
                              setForm({
                                ...form,
                                name: t.name,
                                user_limit: t.user_limit
                              });
                              setShowModal(true);
                            }}
                            className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all"
                            title="Editar Limite"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(t.id, t.name)}
                            className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                            title="Excluir Oficina"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-2xl font-black text-slate-900">
                  {editingTenant ? 'Ajustar Limite de Usuários' : 'Cadastrar Nova Oficina'}
                </h3>
                <p className="text-slate-500 text-sm">{editingTenant ? editingTenant.name : 'Preencha os dados básicos para iniciar.'}</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-8">
              {editingTenant ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Nome da Oficina</label>
                    <input 
                      disabled
                      type="text"
                      value={form.name}
                      className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-slate-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Limite de Usuários Máximo</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range"
                        min="1"
                        max="50"
                        value={form.user_limit}
                        onChange={(e) => setForm({...form, user_limit: parseInt(e.target.value)})}
                        className="flex-1 accent-emerald-600 h-2 bg-slate-100 rounded-full appearance-none cursor-pointer"
                      />
                      <div className="w-20 h-14 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl flex items-center justify-center text-2xl font-black">
                        {form.user_limit}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                       <Building2 className="w-4 h-4" /> Dados da Oficina
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Nome Fantasia</label>
                        <input 
                          required
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm({...form, name: e.target.value})}
                          placeholder="Ex: Marcone Auto Peças"
                          className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">CNPJ / CPF</label>
                        <input 
                          type="text"
                          value={form.document}
                          onChange={(e) => setForm({...form, document: e.target.value})}
                          placeholder="00.000.000/0000-00"
                          className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Telefone</label>
                        <input 
                          type="text"
                          value={form.phone}
                          onChange={(e) => setForm({...form, phone: e.target.value})}
                          placeholder="(00) 00000-0000"
                          className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Limite de Usuários Inicial</label>
                        <input 
                          type="number"
                          value={form.user_limit}
                          onChange={(e) => setForm({...form, user_limit: parseInt(e.target.value)})}
                          className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 pt-6 border-t border-slate-100">
                    <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                       <Users className="w-4 h-4" /> Administrador Inicial
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Nome do Admin</label>
                        <input 
                          required
                          type="text"
                          value={form.admin_name}
                          onChange={(e) => setForm({...form, admin_name: e.target.value})}
                          placeholder="Ex: João da Silva"
                          className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">E-mail de Login</label>
                        <input 
                          required
                          type="email"
                          value={form.admin_email}
                          onChange={(e) => setForm({...form, admin_email: e.target.value})}
                          placeholder="admin@email.com"
                          className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Senha Provisória</label>
                        <input 
                          required
                          type="password"
                          value={form.admin_password}
                          onChange={(e) => setForm({...form, admin_password: e.target.value})}
                          placeholder="••••••••"
                          className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="pt-8 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-16 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="flex-[2] h-16 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  {saving ? 'Processando...' : editingTenant ? 'Salvar Limite' : 'Finalizar Cadastro'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
