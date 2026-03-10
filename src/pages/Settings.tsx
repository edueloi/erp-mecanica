import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Palette,
  User,
  Building2,
  DollarSign,
  Settings as SettingsIcon,
  Bell,
  Shield,
  Database,
  Sun,
  Moon,
  MonitorSmartphone,
  Check,
  Save,
  Eye,
  EyeOff,
  X,
  Clock,
  Users,
  FileText,
  MessageSquare,
  Wrench,
  Upload,
  Image as ImageIcon,
  FileCheck,
  TestTube,
  Plus,
  Trash2,
  Edit2,
  ChevronRight,
} from "lucide-react";
import { useSettings } from "../contexts/SettingsContext";
import { useAuthStore } from "../services/authStore";
import * as ibgeService from "../services/ibgeService";
import api from "../services/api";

type Tab = 
  | "appearance" 
  | "user" 
  | "workshop" 
  | "hours" 
  | "team" 
  | "documents" 
  | "communication" 
  | "financial" 
  | "operational" 
  | "notifications" 
  | "security" 
  | "advanced";

const PREDEFINED_COLORS = [
  { name: "Slate", value: "#1e293b", class: "bg-slate-800" },
  { name: "Blue", value: "#1d4ed8", class: "bg-blue-700" },
  { name: "Green", value: "#16a34a", class: "bg-green-600" },
  { name: "Purple", value: "#7c3aed", class: "bg-purple-600" },
  { name: "Red", value: "#dc2626", class: "bg-red-600" },
  { name: "Orange", value: "#ea580c", class: "bg-orange-600" },
  { name: "Yellow", value: "#ca8a04", class: "bg-yellow-600" },
  { name: "Pink", value: "#db2777", class: "bg-pink-600" },
  { name: "Teal", value: "#0d9488", class: "bg-teal-600" },
  { name: "Indigo", value: "#4f46e5", class: "bg-indigo-600" },
  { name: "Gray", value: "#4b5563", class: "bg-gray-600" },
  { name: "Cyan", value: "#0891b2", class: "bg-cyan-600" },
];

export default function Settings() {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const { user: currentUser, setUser: setCurrentUser } = useAuthStore();
  const { preferences, tenantSettings, updatePreferences, updateTenantSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<Tab>((tab as Tab) || "user");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [estados, setEstados] = useState<ibgeService.Estado[]>([]);
  const [cidades, setCidades] = useState<ibgeService.Cidade[]>([]);
  
  // Form states
  const [tenantForm, setTenantForm] = useState(tenantSettings);
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showPasswords, setShowPasswords] = useState(false);
  
  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    photo_url: currentUser?.photo_url || "",
    profession: currentUser?.profession || "",
  });

  // User Management states
  const [usersList, setUsersList] = useState<any[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "MECHANIC",
    permissions: {
      dashboard: true,
      clients: true,
      vehicles: true,
      workOrders: true,
      appointments: true,
      inventory: false,
      finance: false,
      whatsapp: false,
      settings: false
    },
    photo_url: ""
  });

  const loadUsers = async () => {
    try {
      const response = await api.get("/users");
      setUsersList(response.data);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  useEffect(() => {
    if (tab && tab !== activeTab) {
      setActiveTab(tab as Tab);
    }
  }, [tab]);

  useEffect(() => {
    if (activeTab === "team") {
      loadUsers();
    }
  }, [activeTab]);

  useEffect(() => {
    setTenantForm(tenantSettings);
  }, [tenantSettings]);

  useEffect(() => {
    loadEstados();
  }, []);

  useEffect(() => {
    if (tenantForm.state) {
      loadCidades(tenantForm.state);
    }
  }, [tenantForm.state]);

  const loadEstados = async () => {
    try {
      const data = await ibgeService.getEstados();
      setEstados(data);
    } catch (error) {
      console.error("Error loading states:", error);
    }
  };

  const loadCidades = async (uf: string) => {
    try {
      const data = await ibgeService.getCidadesPorUF(uf);
      setCidades(data);
    } catch (error) {
      console.error("Error loading cities:", error);
    }
  };

  const handleThemeChange = async (theme: "light" | "dark" | "auto") => {
    setSaving(true);
    try {
      await updatePreferences({ theme_mode: theme });
      const themeNames = { light: 'Claro', dark: 'Escuro', auto: 'Automático' };
      showToast(`Tema alterado para ${themeNames[theme]}`, 'success');
    } catch (error) {
      showToast("Erro ao alterar tema", 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleColorChange = async (color: string) => {
    setSaving(true);
    try {
      await updatePreferences({ primary_color: color });
      const colorName = PREDEFINED_COLORS.find(c => c.value === color)?.name || 'Nova cor';
      showToast(`Cor alterada para ${colorName}`, 'success');
    } catch (error) {
      showToast("Erro ao alterar cor", 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTenantSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await updateTenantSettings(tenantForm);
      showToast("Configurações salvas com sucesso!", 'success');
    } catch (error: any) {
      showToast(error.response?.data?.error || "Erro ao salvar configurações", 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/users/${currentUser?.id}`, profileForm);
      if (currentUser) {
        setCurrentUser({ ...currentUser, ...profileForm });
      }
      showToast("Perfil atualizado com sucesso!", 'success');
    } catch (error: any) {
      showToast(error.response?.data?.error || "Erro ao salvar perfil", 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showToast("As senhas não coincidem", 'error');
      return;
    }

    if (passwordForm.new_password.length < 6) {
      showToast("A senha deve ter no mínimo 6 caracteres", 'error');
      return;
    }

    setSaving(true);
    try {
      await api.post("/settings/change-password", {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      showToast("Senha alterada com sucesso!", 'success');
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (error: any) {
      showToast(error.response?.data?.error || "Erro ao alterar senha", 'error');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "user", label: "Meu Perfil", icon: User },
    { id: "workshop", label: "Dados da Oficina", icon: Building2 },
    { id: "hours", label: "Horários", icon: Clock },
    { id: "team", label: "Equipe", icon: Users },
    { id: "documents", label: "Documentos/PDF", icon: FileText },
    { id: "communication", label: "WhatsApp", icon: MessageSquare },
    { id: "financial", label: "Financeiro", icon: DollarSign },
    { id: "operational", label: "Regras Operacionais", icon: Wrench },
    { id: "notifications", label: "Notificações", icon: Bell },
    { id: "appearance", label: "Aparência", icon: Palette },
    { id: "security", label: "Segurança", icon: Shield },
    { id: "advanced", label: "Avançado", icon: Database },
  ];

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Toast Notification */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl"
          style={{
            backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
            color: 'white',
          }}
        >
          {toast.type === 'success' ? (
            <Check className="w-6 h-6" />
          ) : (
            <X className="w-6 h-6" />
          )}
          <span className="font-medium">{toast.message}</span>
        </motion.div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">⚙️ Configurações</h1>
          <p className="text-slate-300 text-sm">
            Gerencie seu perfil e as configurações da sua oficina
          </p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-64 bg-white border-r border-slate-200 overflow-y-auto">
          <nav className="p-4 space-y-1">
            {tabs.map((tabItem) => {
              const Icon = tabItem.icon;
              const isActive = activeTab === tabItem.id;
              
              // Only show workshop/team/financial/etc to ADMIN/SUPER_ADMIN
              const isSystemTab = ["workshop", "hours", "team", "documents", "financial", "operational", "advanced"].includes(tabItem.id);
              if (isSystemTab && currentUser?.role !== "ADMIN" && currentUser?.role !== "SUPER_ADMIN") {
                return null;
              }

              return (
                <button
                  key={tabItem.id}
                  onClick={() => {
                    setActiveTab(tabItem.id as Tab);
                    navigate(`/settings/${tabItem.id}`);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tabItem.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {/* 0) MEU PERFIL */}
          {activeTab === "user" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">👤 Meu Perfil</h2>
                <p className="text-sm text-slate-600">
                  Gerencie suas informações pessoais e de acesso
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex flex-col items-center mb-8 pb-8 border-b border-slate-100">
                  <div className="relative group cursor-pointer" onClick={() => (document.getElementById('profile_photo_input') as HTMLInputElement)?.click()}>
                    <div className="w-32 h-32 rounded-[2.5rem] bg-slate-100 border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden transition-transform duration-500 group-hover:scale-105">
                      {profileForm.photo_url ? (
                        <img src={profileForm.photo_url} className="w-full h-full object-cover" />
                      ) : (
                        <User className="text-slate-300" size={60} />
                      )}
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload className="text-white" size={32} />
                      </div>
                    </div>
                    <button 
                      type="button"
                      className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-white shadow-xl text-slate-600 border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                  </div>
                  <input 
                    id="profile_photo_input"
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setProfileForm({ ...profileForm, photo_url: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <h3 className="mt-4 text-xl font-black text-slate-900 uppercase italic tracking-tight">{currentUser?.name}</h3>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{currentUser?.role}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Nome Completo</label>
                    <input 
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-400 outline-none transition-all font-medium"
                      placeholder="Seu nome"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">E-mail</label>
                    <input 
                      type="email"
                      value={profileForm.email}
                      disabled
                      className="w-full px-5 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-slate-500 font-medium cursor-not-allowed"
                      placeholder="seu@email.com"
                    />
                    <p className="text-[10px] text-slate-400 mt-1.5 font-bold italic">* E-mail não pode ser alterado</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Telefone / WhatsApp</label>
                    <input 
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-400 outline-none transition-all font-medium"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Cargo / Profissão</label>
                    <input 
                      type="text"
                      value={profileForm.profession}
                      onChange={(e) => setProfileForm({...profileForm, profession: e.target.value})}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-400 outline-none transition-all font-medium"
                      placeholder="Ex: Mecânico Chefe"
                    />
                  </div>
                </div>

                <div className="mt-10 flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all font-bold text-sm uppercase tracking-widest shadow-xl shadow-slate-900/20 disabled:opacity-50 active:scale-[0.98]"
                  >
                    <Save className="w-5 h-5" />
                    {saving ? "Salvando..." : "Salvar Perfil"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* 1) DADOS DA OFICINA */}
          {activeTab === "workshop" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">📋 Dados da Oficina</h2>
                <p className="text-sm text-slate-600">
                  Informações que aparecem em OS, orçamentos, PDFs e mensagens
                </p>
              </div>

              {/* Identidade / Marca */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-slate-600" />
                  Identidade / Marca
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Logo da Oficina
                    </label>
                    <div className="flex items-center gap-4">
                      {tenantForm.logo_url && (
                        <img 
                          src={tenantForm.logo_url} 
                          alt="Logo" 
                          className="w-20 h-20 object-contain rounded-xl border border-slate-200 bg-white p-2"
                        />
                      )}
                      <div className="flex-1">
                        <input
                          type="text"
                          value={tenantForm.logo_url || ""}
                          onChange={(e) => setTenantForm({ ...tenantForm, logo_url: e.target.value })}
                          placeholder="URL da logo (ex: https://...)"
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Cole a URL da imagem ou use o botão abaixo para fazer upload
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => showToast("Upload de imagem será implementado em breve", "success")}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Upload
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Nome Curto (Header PDF)
                    </label>
                    <input
                      type="text"
                      value={tenantForm.short_name || ""}
                      onChange={(e) => setTenantForm({ ...tenantForm, short_name: e.target.value })}
                      placeholder="Ex: OficinaX"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Cor Primária
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={tenantForm.primary_color || "#1e293b"}
                        onChange={(e) => setTenantForm({ ...tenantForm, primary_color: e.target.value })}
                        className="w-16 h-10 rounded-xl border border-slate-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={tenantForm.primary_color || "#1e293b"}
                        onChange={(e) => setTenantForm({ ...tenantForm, primary_color: e.target.value })}
                        className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Slogan / Frase
                    </label>
                    <input
                      type="text"
                      value={tenantForm.slogan || ""}
                      onChange={(e) => setTenantForm({ ...tenantForm, slogan: e.target.value })}
                      placeholder="Ex: Qualidade e confiança desde 1990"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Dados Básicos */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Dados Básicos</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Razão Social
                    </label>
                    <input
                      type="text"
                      value={tenantForm.company_name || ""}
                      onChange={(e) => setTenantForm({ ...tenantForm, company_name: e.target.value })}
                      placeholder="Razão Social"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Nome Fantasia
                    </label>
                    <input
                      type="text"
                      value={tenantForm.trade_name || ""}
                      onChange={(e) => setTenantForm({ ...tenantForm, trade_name: e.target.value })}
                      placeholder="Nome Fantasia"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      CNPJ
                    </label>
                    <input
                      type="text"
                      value={tenantForm.cnpj || ""}
                      onChange={(e) => setTenantForm({ ...tenantForm, cnpj: e.target.value })}
                      placeholder="00.000.000/0000-00"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      IE (Opcional)
                    </label>
                    <input
                      type="text"
                      value={tenantForm.ie || ""}
                      onChange={(e) => setTenantForm({ ...tenantForm, ie: e.target.value })}
                      placeholder="Inscrição Estadual"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Telefone
                    </label>
                    <input
                      type="text"
                      value={tenantForm.phone || ""}
                      onChange={(e) => setTenantForm({ ...tenantForm, phone: e.target.value })}
                      placeholder="(00) 0000-0000"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      WhatsApp Oficial
                    </label>
                    <input
                      type="text"
                      value={tenantForm.whatsapp || ""}
                      onChange={(e) => setTenantForm({ ...tenantForm, whatsapp: e.target.value })}
                      placeholder="(00) 00000-0000"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={tenantForm.email || ""}
                      onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })}
                      placeholder="contato@oficina.com"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Site (Opcional)
                    </label>
                    <input
                      type="text"
                      value={tenantForm.website || ""}
                      onChange={(e) => setTenantForm({ ...tenantForm, website: e.target.value })}
                      placeholder="https://oficina.com"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Instagram (Opcional)
                    </label>
                    <input
                      type="text"
                      value={tenantForm.instagram || ""}
                      onChange={(e) => setTenantForm({ ...tenantForm, instagram: e.target.value })}
                      placeholder="@oficina"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Endereço</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-4">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Endereço Completo
                    </label>
                    <input
                      type="text"
                      value={tenantForm.address || ""}
                      onChange={(e) => setTenantForm({ ...tenantForm, address: e.target.value })}
                      placeholder="Rua, Número, Bairro"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Estado (UF)
                    </label>
                    <select
                      value={tenantForm.state || ""}
                      onChange={(e) => setTenantForm({ ...tenantForm, state: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <option value="">Selecione</option>
                      {estados.map((estado) => (
                        <option key={estado.id} value={estado.sigla}>
                          {estado.sigla}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Cidade
                    </label>
                    <select
                      value={tenantForm.city || ""}
                      onChange={(e) => setTenantForm({ ...tenantForm, city: e.target.value })}
                      disabled={!tenantForm.state}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:bg-slate-50"
                    >
                      <option value="">Selecione</option>
                      {cidades.map((cidade) => (
                        <option key={cidade.id} value={cidade.nome}>
                          {cidade.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      CEP
                    </label>
                    <input
                      type="text"
                      value={tenantForm.zip_code || ""}
                      onChange={(e) => setTenantForm({ ...tenantForm, zip_code: e.target.value })}
                      placeholder="00000-000"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end sticky bottom-0 bg-slate-50 py-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => handleSaveTenantSettings()}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-semibold shadow-lg disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </motion.div>
          )}

          {/* 2) HORÁRIOS - Continue com as demais abas... */}
          {activeTab === "hours" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto space-y-6"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">🕒 Horários e Atendimento</h2>
                <p className="text-sm text-slate-600">
                  Defina quando sua oficina funciona
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Horário de Funcionamento</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                        Segunda a Sexta - Abertura
                      </label>
                      <input
                        type="time"
                        value={tenantForm.weekday_open || "08:00"}
                        onChange={(e) => setTenantForm({ ...tenantForm, weekday_open: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                        Segunda a Sexta - Fechamento
                      </label>
                      <input
                        type="time"
                        value={tenantForm.weekday_close || "18:00"}
                        onChange={(e) => setTenantForm({ ...tenantForm, weekday_close: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                        Sábado - Abertura
                      </label>
                      <input
                        type="time"
                        value={tenantForm.saturday_open || "08:00"}
                        onChange={(e) => setTenantForm({ ...tenantForm, saturday_open: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                        Sábado - Fechamento
                      </label>
                      <input
                        type="time"
                        value={tenantForm.saturday_close || "12:00"}
                        onChange={(e) => setTenantForm({ ...tenantForm, saturday_close: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                        Domingo - Abertura (Opcional)
                      </label>
                      <input
                        type="time"
                        value={tenantForm.sunday_open || ""}
                        onChange={(e) => setTenantForm({ ...tenantForm, sunday_open: e.target.value })}
                        placeholder="Fechado"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                        Domingo - Fechamento (Opcional)
                      </label>
                      <input
                        type="time"
                        value={tenantForm.sunday_close || ""}
                        onChange={(e) => setTenantForm({ ...tenantForm, sunday_close: e.target.value })}
                        placeholder="Fechado"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                        Intervalo de Almoço - Início
                      </label>
                      <input
                        type="time"
                        value={tenantForm.lunch_start || "12:00"}
                        onChange={(e) => setTenantForm({ ...tenantForm, lunch_start: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                        Intervalo de Almoço - Fim
                      </label>
                      <input
                        type="time"
                        value={tenantForm.lunch_end || "13:00"}
                        onChange={(e) => setTenantForm({ ...tenantForm, lunch_end: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Agendamentos</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Duração Padrão (minutos)
                    </label>
                    <select
                      value={tenantForm.default_appointment_duration || 60}
                      onChange={(e) => setTenantForm({ ...tenantForm, default_appointment_duration: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <option value="30">30 minutos</option>
                      <option value="60">60 minutos (1h)</option>
                      <option value="90">90 minutos (1h30)</option>
                      <option value="120">120 minutos (2h)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Tolerância para Atraso (min)
                    </label>
                    <input
                      type="number"
                      value={tenantForm.tolerance_minutes || 15}
                      onChange={(e) => setTenantForm({ ...tenantForm, tolerance_minutes: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end sticky bottom-0 bg-slate-50 py-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => handleSaveTenantSettings()}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-semibold shadow-lg disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </motion.div>
          )}

          {/* 3) EQUIPE E PERMISSÕES */}
          {activeTab === "team" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-5xl mx-auto space-y-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">👥 Equipe e Permissões</h2>
                  <p className="text-sm text-slate-600">
                    Gerencie os usuários e o que cada um pode acessar no sistema.
                    Limite contratado: <span className="font-bold text-slate-900">{usersList.length} / {tenantSettings.user_limit || 5} usuários</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingUser(null);
                    setUserForm({
                      name: "",
                      email: "",
                      password: "",
                      role: "MECHANIC",
                      permissions: {
                        dashboard: true,
                        clients: true,
                        vehicles: true,
                        workOrders: true,
                        appointments: true,
                        inventory: false,
                        finance: false,
                        whatsapp: false,
                        settings: false
                      },
                      photo_url: ""
                    });
                    setShowUserModal(true);
                  }}
                  disabled={usersList.length >= (tenantSettings.user_limit || 5)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-900 transition-all disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  Novo Usuário
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {usersList.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-10 text-slate-400" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Nenhum membro na equipe ainda</p>
                  </div>
                ) : (
                  usersList.map((user) => (
                    <div key={user.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 group flex flex-col p-6">
                       <div className="flex items-start justify-between mb-6">
                          <div className="relative group-hover:scale-105 transition-transform duration-500">
                             <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shadow-inner">
                                {user.photo_url ? (
                                   <img src={user.photo_url} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                   <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-400 font-bold text-xl uppercase italic">
                                      {user.name.charAt(0)}
                                   </div>
                                )}
                             </div>
                             <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-lg ${
                               user.role === 'ADMIN' ? 'bg-amber-500' : 
                               user.role === 'SUPER_ADMIN' ? 'bg-purple-500' : 'bg-slate-500'
                             }`}>
                                <Shield className="text-white" size={12} />
                             </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-300">
                             <button 
                                onClick={() => {
                                   setEditingUser(user);
                                   setUserForm({
                                      name: user.name,
                                      email: user.email,
                                      password: "",
                                      role: user.role,
                                      permissions: typeof user.permissions === 'string' 
                                        ? JSON.parse(user.permissions) 
                                        : (user.permissions || {
                                            dashboard: true,
                                            clients: true,
                                            vehicles: true,
                                            workOrders: true,
                                            appointments: true,
                                            inventory: false,
                                            finance: false,
                                            whatsapp: false,
                                            settings: false
                                          }),
                                      photo_url: user.photo_url || ""
                                   });
                                   setShowUserModal(true);
                                }}
                                className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-900 hover:text-white flex items-center justify-center transition-all"
                                title="Editar"
                             >
                                <Edit2 size={14} />
                             </button>
                             <button 
                                onClick={async () => {
                                   if (window.confirm(`Deseja realmente excluir o usuário ${user.name}?`)) {
                                      try {
                                         await api.delete(`/users/${user.id}`);
                                         showToast("Usuário excluído com sucesso!");
                                         loadUsers();
                                      } catch (error: any) {
                                         showToast(error.response?.data?.error || "Erro ao excluir usuário", "error");
                                      }
                                   }
                                }}
                                className="w-9 h-9 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"
                                title="Excluir"
                             >
                                <Trash2 size={14} />
                             </button>
                          </div>
                       </div>

                       <div className="flex-1">
                          <h4 className="font-black text-slate-900 leading-tight uppercase italic mb-1 line-clamp-1">{user.name}</h4>
                          <p className="text-xs text-slate-500 font-medium mb-4 truncate">{user.email}</p>
                          
                          <div className="flex flex-wrap gap-2">
                             <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                               user.role === 'ADMIN' ? 'bg-amber-50 text-amber-600 border-amber-100/50' :
                               user.role === 'SUPER_ADMIN' ? 'bg-purple-50 text-purple-600 border-purple-100/50' :
                               'bg-slate-50 text-slate-600 border-slate-100/50'
                             }`}>
                                {user.role === 'ADMIN' ? 'Admin' : 
                                 user.role === 'MECHANIC' ? 'Mecânico' :
                                 user.role === 'ATTENDANT' ? 'Atendente' : 
                                 user.role === 'FINANCE' ? 'Financeiro' : user.role}
                             </span>
                          </div>
                       </div>

                       <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                          <div className="flex flex-col">
                             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Desde</span>
                             <span className="text-[10px] font-bold text-slate-600">{new Date(user.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300">
                             <ChevronRight size={16} />
                          </div>
                       </div>
                    </div>
                  ))
                )}
              </div>

              {/* User Modal */}
              {showUserModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                  >
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                      <h3 className="text-xl font-bold text-slate-800">
                        {editingUser ? "Editar Usuário" : "Novo Usuário"}
                      </h3>
                      <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setSaving(true);
                        try {
                          if (editingUser) {
                            await api.patch(`/users/${editingUser.id}`, userForm);
                            showToast("Usuário atualizado com sucesso!");
                          } else {
                            await api.post("/users", userForm);
                            showToast("Usuário criado com sucesso!");
                          }
                          setShowUserModal(false);
                          loadUsers();
                        } catch (error: any) {
                          showToast(error.response?.data?.error || "Erro ao salvar usuário", "error");
                        } finally {
                          setSaving(false);
                        }
                      }}
                      className="p-6 overflow-y-auto space-y-6"
                    >
                      {/* Foto do Usuário */}
                      <div className="flex flex-col items-center mb-6">
                        <div className="relative group cursor-pointer" onClick={() => (document.getElementById('user_photo_input') as HTMLInputElement)?.click()}>
                          <div className="w-24 h-24 rounded-3xl bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                            {userForm.photo_url ? (
                              <img src={userForm.photo_url} className="w-full h-full object-cover" />
                            ) : (
                              <Users className="text-slate-300" size={40} />
                            )}
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Upload className="text-white" size={24} />
                            </div>
                          </div>
                          <button 
                            type="button"
                            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-white shadow-lg text-slate-500 border border-slate-100 flex items-center justify-center"
                          >
                            <Edit2 size={14} />
                          </button>
                        </div>
                        <input 
                          id="user_photo_input"
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setUserForm({ ...userForm, photo_url: reader.result as string });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Foto de Perfil</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nome Completo</label>
                          <input 
                            required
                            type="text"
                            value={userForm.name}
                            onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 outline-none"
                            placeholder="Ex: João Silva"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">E-mail (Login)</label>
                          <input 
                            required
                            type="email"
                            value={userForm.email}
                            onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 outline-none"
                            placeholder="joao@email.com"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cargo / Nível</label>
                          <select 
                            value={userForm.role}
                            onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 outline-none"
                          >
                            <option value="ADMIN">Administrador</option>
                            <option value="MECHANIC">Mecânico</option>
                            <option value="ATTENDANT">Atendente / Recepção</option>
                            <option value="FINANCE">Financeiro</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                            {editingUser ? "Nova Senha (deixe em branco para não alterar)" : "Senha Inicial"}
                          </label>
                          <input 
                            required={!editingUser}
                            type="password"
                            value={userForm.password}
                            onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 outline-none"
                            placeholder="******"
                          />
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-6">
                        <h4 className="font-bold text-slate-800 mb-4">Permissões de Acesso</h4>
                        <div className="grid grid-cols-2 gap-y-3">
                          {Object.keys(userForm.permissions).map((module) => (
                            <label key={module} className="flex items-center gap-3 cursor-pointer group">
                              <div className="relative inline-flex items-center">
                                <input 
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={(userForm.permissions as any)[module]}
                                  onChange={(e) => {
                                    setUserForm({
                                      ...userForm,
                                      permissions: {
                                        ...userForm.permissions,
                                        [module]: e.target.checked
                                      }
                                    });
                                  }}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-800"></div>
                              </div>
                              <span className="text-sm font-medium text-slate-700 capitalize">
                                {module === 'workOrders' ? 'Ordens de Serviço' :
                                 module === 'appointments' ? 'Agendamentos' :
                                 module === 'inventory' ? 'Estoque / Peças' :
                                 module === 'finance' ? 'Financeiro' :
                                 module === 'settings' ? 'Configurações' :
                                 module}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 mt-8">
                        <button 
                          type="button" 
                          onClick={() => setShowUserModal(false)}
                          className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button 
                          type="submit"
                          disabled={saving}
                          className="px-8 py-2.5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors disabled:opacity-50"
                        >
                          {saving ? "Salvando..." : editingUser ? "Salvar Alterações" : "Criar Usuário"}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}

          {/* 4) DOCUMENTOS / PDF */}
          {activeTab === "documents" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto space-y-6"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">📄 Documentos e PDF</h2>
                <p className="text-sm text-slate-600">
                  Configure como ficam seus documentos impressos
                </p>
              </div>

              {/* Configurações de PDF */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Configurações de PDF</h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900">Mostrar Logo no PDF</div>
                      <div className="text-sm text-slate-500">Exibir logo no cabeçalho dos documentos</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={tenantForm.show_logo_pdf || false}
                      onChange={(e) => setTenantForm({ ...tenantForm, show_logo_pdf: e.target.checked })}
                      className="w-5 h-5 text-slate-600 rounded focus:ring-slate-500"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900">Mostrar Dados da Oficina</div>
                      <div className="text-sm text-slate-500">Incluir endereço e contatos no PDF</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={tenantForm.show_company_data_pdf || false}
                      onChange={(e) => setTenantForm({ ...tenantForm, show_company_data_pdf: e.target.checked })}
                      className="w-5 h-5 text-slate-600 rounded focus:ring-slate-500"
                    />
                  </label>

                  <div className="border-t border-slate-200 pt-4 mt-4">
                    <p className="text-sm font-semibold text-slate-700 mb-3">Rodapé do PDF</p>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={tenantForm.pdf_footer_address || false}
                          onChange={(e) => setTenantForm({ ...tenantForm, pdf_footer_address: e.target.checked })}
                          className="w-4 h-4 text-slate-600 rounded focus:ring-slate-500"
                        />
                        <span className="text-sm text-slate-700">Endereço</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={tenantForm.pdf_footer_phone || false}
                          onChange={(e) => setTenantForm({ ...tenantForm, pdf_footer_phone: e.target.checked })}
                          className="w-4 h-4 text-slate-600 rounded focus:ring-slate-500"
                        />
                        <span className="text-sm text-slate-700">Telefone</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={tenantForm.pdf_footer_whatsapp || false}
                          onChange={(e) => setTenantForm({ ...tenantForm, pdf_footer_whatsapp: e.target.checked })}
                          className="w-4 h-4 text-slate-600 rounded focus:ring-slate-500"
                        />
                        <span className="text-sm text-slate-700">WhatsApp</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={tenantForm.pdf_footer_website || false}
                          onChange={(e) => setTenantForm({ ...tenantForm, pdf_footer_website: e.target.checked })}
                          className="w-4 h-4 text-slate-600 rounded focus:ring-slate-500"
                        />
                        <span className="text-sm text-slate-700">Site</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Textos Padrão */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Textos Padrão</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Termos e Condições
                    </label>
                    <textarea
                      rows={3}
                      value={tenantForm.terms_and_conditions || ""}
                      onChange={(e) => setTenantForm({ ...tenantForm, terms_and_conditions: e.target.value })}
                      placeholder="Texto que aparece em contratos e OS..."
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Texto de Garantia Padrão
                    </label>
                    <textarea
                      rows={2}
                      value={tenantForm.default_warranty_text || ""}
                      onChange={(e) => setTenantForm({ ...tenantForm, default_warranty_text: e.target.value })}
                      placeholder="Ex: Garantia de 90 dias para peças e serviços..."
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Texto Padrão para Orçamentos
                    </label>
                    <textarea
                      rows={3}
                      value={tenantForm.default_quote_text || ""}
                      onChange={(e) => setTenantForm({ ...tenantForm, default_quote_text: e.target.value })}
                      placeholder="Ex: Orçamento válido por 7 dias..."
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Texto do Recibo
                    </label>
                    <textarea
                      rows={2}
                      value={tenantForm.receipt_text || ""}
                      onChange={(e) => setTenantForm({ ...tenantForm, receipt_text: e.target.value })}
                      placeholder="Recebi(emos) de..."
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Assinatura Digital
                    </label>
                    <textarea
                      rows={2}
                      value={tenantForm.signature || ""}
                      onChange={(e) => setTenantForm({ ...tenantForm, signature: e.target.value })}
                      placeholder="Ex: Atenciosamente, Equipe OficinaX"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Numeração de OS */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Numeração de Ordem de Serviço</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Prefixo
                    </label>
                    <input
                      type="text"
                      value={tenantForm.os_prefix || "OFC"}
                      onChange={(e) => setTenantForm({ ...tenantForm, os_prefix: e.target.value })}
                      placeholder="OFC"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Formato
                    </label>
                    <input
                      type="text"
                      value={tenantForm.os_format || "OFC-{YEAR}-{NUMBER}"}
                      onChange={(e) => setTenantForm({ ...tenantForm, os_format: e.target.value })}
                      placeholder="OFC-{YEAR}-{NUMBER}"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={tenantForm.os_reset_yearly || false}
                        onChange={(e) => setTenantForm({ ...tenantForm, os_reset_yearly: e.target.checked })}
                        className="w-4 h-4 text-slate-600 rounded focus:ring-slate-500"
                      />
                      <span className="text-sm text-slate-700">Reiniciar numeração a cada ano</span>
                    </label>
                    <p className="text-xs text-slate-500 mt-2 ml-6">
                      Exemplo: OFC-2026-00001, OFC-2027-00001...
                    </p>
                  </div>
                </div>
              </div>

              {/* Botão Testar PDF */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Testar Configurações</h3>
                <button
                  type="button"
                  onClick={() => showToast("Gerando PDF de exemplo...", "success")}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <FileCheck className="w-5 h-5" />
                  Gerar PDF de Exemplo
                </button>
              </div>

              <div className="flex justify-end sticky bottom-0 bg-slate-50 py-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => handleSaveTenantSettings()}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-semibold shadow-lg disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </motion.div>
          )}

          {/* 5) COMUNICAÇÃO / WHATSAPP */}
          {activeTab === "communication" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto space-y-6"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">💬 WhatsApp e Comunicação</h2>
                <p className="text-sm text-slate-600">
                  Configure mensagens automáticas e integração WhatsApp
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Status da Integração</h3>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${tenantForm.whatsapp_connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {tenantForm.whatsapp_connected ? 'Conectado' : 'Desconectado'}
                      </p>
                      <p className="text-sm text-slate-600">
                        {tenantForm.whatsapp ? tenantForm.whatsapp : 'Nenhum número configurado'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => showToast("Abra a página WhatsApp para gerenciar conexão", "success")}
                    className="px-4 py-2 bg-slate-700 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors"
                  >
                    Gerenciar
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Bot Automático</h3>
                <label className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900">Ativar Bot por Padrão</div>
                    <div className="text-sm text-slate-500">Responder automaticamente novas conversas</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={tenantForm.whatsapp_bot_enabled || false}
                    onChange={(e) => setTenantForm({ ...tenantForm, whatsapp_bot_enabled: e.target.checked })}
                    className="w-5 h-5 text-slate-600 rounded focus:ring-slate-500"
                  />
                </label>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Templates de Mensagens</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Configure mensagens automáticas na página WhatsApp
                </p>
                <button
                  type="button"
                  onClick={() => showToast("Navegue para WhatsApp > Templates", "success")}
                  className="w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-700 transition-colors"
                >
                  Editar Templates
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Testar Mensagem</h3>
                <button
                  type="button"
                  onClick={() => showToast("Enviando mensagem de teste...", "success")}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <TestTube className="w-5 h-5" />
                  Enviar Mensagem de Teste
                </button>
              </div>

              <div className="flex justify-end sticky bottom-0 bg-slate-50 py-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => handleSaveTenantSettings()}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-semibold shadow-lg disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </motion.div>
          )}

          {/* 6) FINANCEIRO */}
          {activeTab === "financial" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto space-y-6"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">💰 Configurações Financeiras</h2>
                <p className="text-sm text-slate-600">
                  Defina padrões financeiros da oficina
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Pagamentos</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Dias Padrão de Vencimento
                    </label>
                    <input
                      type="number"
                      value={tenantForm.default_due_days || 30}
                      onChange={(e) => setTenantForm({ ...tenantForm, default_due_days: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Parcelamento Máximo
                    </label>
                    <input
                      type="number"
                      value={tenantForm.max_installments || 12}
                      onChange={(e) => setTenantForm({ ...tenantForm, max_installments: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Condições de Pagamento Padrão
                    </label>
                    <input
                      type="text"
                      value={tenantForm.default_payment_terms || ""}
                      onChange={(e) => setTenantForm({ ...tenantForm, default_payment_terms: e.target.value })}
                      placeholder="Ex: 30/60 dias, À vista, etc"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Taxa Cartão (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={tenantForm.card_fee_percentage || 0}
                      onChange={(e) => setTenantForm({ ...tenantForm, card_fee_percentage: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Chave PIX
                    </label>
                    <input
                      type="text"
                      value={tenantForm.pix_key || ""}
                      onChange={(e) => setTenantForm({ ...tenantForm, pix_key: e.target.value })}
                      placeholder="CPF, CNPJ, E-mail ou Telefone"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Formas de Pagamento Aceitas
                    </label>
                    <input
                      type="text"
                      value={tenantForm.payment_methods || "pix,card,cash"}
                      onChange={(e) => setTenantForm({ ...tenantForm, payment_methods: e.target.value })}
                      placeholder="pix,card,cash (separado por vírgula)"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Exemplo: pix,card,cash,transfer
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Multas e Juros</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Juros por Atraso (% ao mês)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={tenantForm.late_fee_percentage || 0}
                      onChange={(e) => setTenantForm({ ...tenantForm, late_fee_percentage: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Multa Fixa (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={tenantForm.fixed_penalty || 0}
                      onChange={(e) => setTenantForm({ ...tenantForm, fixed_penalty: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end sticky bottom-0 bg-slate-50 py-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => handleSaveTenantSettings()}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-semibold shadow-lg disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </motion.div>
          )}

          {/* 7) REGRAS OPERACIONAIS */}
          {activeTab === "operational" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto space-y-6"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">⚙️ Regras Operacionais</h2>
                <p className="text-sm text-slate-600">
                  Defina comportamentos do sistema
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Ordens de Serviço</h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900">Permitir finalizar OS sem pagamento</div>
                      <div className="text-sm text-slate-500">Permite finalizar mesmo sem receber</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={tenantForm.allow_finish_os_without_payment || false}
                      onChange={(e) => setTenantForm({ ...tenantForm, allow_finish_os_without_payment: e.target.checked })}
                      className="w-5 h-5 text-slate-600 rounded focus:ring-slate-500"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900">Permitir entregar veículo sem pagamento</div>
                      <div className="text-sm text-slate-500">Cliente pode retirar carro sem pagar</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={tenantForm.allow_deliver_without_payment || false}
                      onChange={(e) => setTenantForm({ ...tenantForm, allow_deliver_without_payment: e.target.checked })}
                      className="w-5 h-5 text-slate-600 rounded focus:ring-slate-500"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900">Exigir aprovação do cliente</div>
                      <div className="text-sm text-slate-500">Cliente deve aprovar orçamento antes de executar</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={tenantForm.require_client_approval || false}
                      onChange={(e) => setTenantForm({ ...tenantForm, require_client_approval: e.target.checked })}
                      className="w-5 h-5 text-slate-600 rounded focus:ring-slate-500"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900">Checklist obrigatório</div>
                      <div className="text-sm text-slate-500">Obriga preenchimento do checklist de vistoria</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={tenantForm.require_checklist || false}
                      onChange={(e) => setTenantForm({ ...tenantForm, require_checklist: e.target.checked })}
                      className="w-5 h-5 text-slate-600 rounded focus:ring-slate-500"
                    />
                  </label>

                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Dias de Garantia Padrão
                    </label>
                    <input
                      type="number"
                      value={tenantForm.default_warranty_days || 90}
                      onChange={(e) => setTenantForm({ ...tenantForm, default_warranty_days: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Estoque</h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900">Baixar estoque automático</div>
                      <div className="text-sm text-slate-500">Descontar peças ao finalizar OS</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={tenantForm.auto_decrease_stock || false}
                      onChange={(e) => setTenantForm({ ...tenantForm, auto_decrease_stock: e.target.checked })}
                      className="w-5 h-5 text-slate-600 rounded focus:ring-slate-500"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900">Alertar estoque baixo</div>
                      <div className="text-sm text-slate-500">Notificar quando atingir estoque mínimo</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={tenantForm.alert_stock_low || false}
                      onChange={(e) => setTenantForm({ ...tenantForm, alert_stock_low: e.target.checked })}
                      className="w-5 h-5 text-slate-600 rounded focus:ring-slate-500"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end sticky bottom-0 bg-slate-50 py-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => handleSaveTenantSettings()}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-semibold shadow-lg disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </motion.div>
          )}

          {/* 8) NOTIFICAÇÕES */}
          {activeTab === "notifications" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto space-y-6"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">🔔 Notificações</h2>
                <p className="text-sm text-slate-600">
                  Configure alertas e lembretes automáticos
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Alertas</h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900">Alertar Clientes Inadimplentes</div>
                      <div className="text-sm text-slate-500">Exibir avisos sobre clientes com contas em atraso</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={tenantForm.alert_overdue_clients || false}
                      onChange={(e) => setTenantForm({ ...tenantForm, alert_overdue_clients: e.target.checked })}
                      className="w-5 h-5 text-slate-600 rounded focus:ring-slate-500"
                    />
                  </label>

                  <div>
                    <label className="block font-medium text-slate-900 mb-2">
                      Alertar OS Parada há (dias)
                    </label>
                    <input
                      type="number"
                      value={tenantForm.alert_os_stopped_days || 7}
                      onChange={(e) => setTenantForm({ ...tenantForm, alert_os_stopped_days: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end sticky bottom-0 bg-slate-50 py-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => handleSaveTenantSettings()}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-semibold shadow-lg disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </motion.div>
          )}

          {/* 9) APARÊNCIA */}
          {activeTab === "appearance" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">🎨 Aparência</h2>
                <p className="text-sm text-slate-500">
                  Personalize o visual do sistema
                </p>
              </div>

              {/* Theme Mode */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
                  Tema
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => handleThemeChange("light")}
                    disabled={saving}
                    className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      preferences.theme_mode === "light"
                        ? "border-slate-700 bg-slate-50"
                        : "border-slate-200 hover:border-slate-300"
                    } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Sun className="w-8 h-8 text-slate-700" />
                    <div className="text-center">
                      <div className="font-medium text-slate-900">Claro</div>
                      <div className="text-xs text-slate-500">Tema diurno</div>
                    </div>
                    {preferences.theme_mode === "light" && (
                      <Check className="w-5 h-5 text-slate-700" />
                    )}
                  </button>

                  <button
                    onClick={() => handleThemeChange("dark")}
                    disabled={saving}
                    className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      preferences.theme_mode === "dark"
                        ? "border-slate-700 bg-slate-50"
                        : "border-slate-200 hover:border-slate-300"
                    } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Moon className="w-8 h-8 text-slate-700" />
                    <div className="text-center">
                      <div className="font-medium text-slate-900">Escuro</div>
                      <div className="text-xs text-slate-500">Tema noturno</div>
                    </div>
                    {preferences.theme_mode === "dark" && (
                      <Check className="w-5 h-5 text-slate-700" />
                    )}
                  </button>

                  <button
                    onClick={() => handleThemeChange("auto")}
                    disabled={saving}
                    className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      preferences.theme_mode === "auto"
                        ? "border-slate-700 bg-slate-50"
                        : "border-slate-200 hover:border-slate-300"
                    } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <MonitorSmartphone className="w-8 h-8 text-slate-700" />
                    <div className="text-center">
                      <div className="font-medium text-slate-900">Auto</div>
                      <div className="text-xs text-slate-500">Segue sistema</div>
                    </div>
                    {preferences.theme_mode === "auto" && (
                      <Check className="w-5 h-5 text-slate-700" />
                    )}
                  </button>
                </div>
              </div>

              {/* Primary Color */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
                  Cor Primária
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Escolha a cor principal do sistema (botões, destaques, etc)
                </p>
                <div className="grid grid-cols-6 gap-4">
                  {PREDEFINED_COLORS.map((color) => {
                    const isActive = preferences.primary_color === color.value;
                    return (
                      <button
                        key={color.value}
                        onClick={() => handleColorChange(color.value)}
                        disabled={saving}
                        className={`group relative ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={color.name}
                      >
                        <div
                          className={`w-full aspect-square rounded-2xl transition-all ${
                            color.class
                          } ${
                            isActive
                              ? "ring-4 ring-offset-2 ring-slate-400"
                              : "hover:scale-110"
                          }`}
                        >
                          {isActive && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Check className="w-6 h-6 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-center mt-2 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          {color.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Display Preferences */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
                  Exibição
                </h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900">
                        Mostrar Cards de Resumo
                      </div>
                      <div className="text-sm text-slate-500">
                        Exibir cards com estatísticas no topo das páginas
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.show_dashboard_cards}
                      onChange={(e) =>
                        updatePreferences({ show_dashboard_cards: e.target.checked })
                      }
                      className="w-5 h-5 text-slate-600 rounded focus:ring-slate-500"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900">
                        Barra Lateral Recolhida
                      </div>
                      <div className="text-sm text-slate-500">
                        Iniciar com menu lateral minimizado
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.sidebar_collapsed}
                      onChange={(e) =>
                        updatePreferences({ sidebar_collapsed: e.target.checked })
                      }
                      className="w-5 h-5 text-slate-600 rounded focus:ring-slate-500"
                    />
                  </label>

                  <div>
                    <label className="block font-medium text-slate-900 mb-2">
                      Linhas por Página
                    </label>
                    <select
                      value={preferences.default_rows_per_page}
                      onChange={(e) =>
                        updatePreferences({
                          default_rows_per_page: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <option value="10">10 linhas</option>
                      <option value="20">20 linhas</option>
                      <option value="50">50 linhas</option>
                      <option value="100">100 linhas</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 10) SEGURANÇA */}
          {activeTab === "security" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto space-y-6"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">🔒 Segurança</h2>
                <p className="text-sm text-slate-600">
                  Gerencie senha e configurações de segurança
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Alterar Senha</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                        Senha Atual
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords ? "text" : "password"}
                          value={passwordForm.current_password || ""}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              current_password: e.target.value,
                            })
                          }
                          required
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(!showPasswords)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPasswords ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                        Nova Senha
                      </label>
                      <input
                        type={showPasswords ? "text" : "password"}
                        value={passwordForm.new_password || ""}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            new_password: e.target.value,
                          })
                        }
                        required
                        minLength={6}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                        Confirmar Nova Senha
                      </label>
                      <input
                        type={showPasswords ? "text" : "password"}
                        value={passwordForm.confirm_password || ""}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            confirm_password: e.target.value,
                          })
                        }
                        required
                        minLength={6}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-semibold shadow-lg disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Salvando..." : "Alterar Senha"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* 11) AVANÇADO */}
          {activeTab === "advanced" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto space-y-6"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">🔧 Avançado</h2>
                <p className="text-sm text-slate-600">
                  Ferramentas administrativas e manutenção
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Integrações</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-slate-700">ViaCEP</span>
                    </div>
                    <span className="text-xs text-green-600 font-medium">Ativo</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-slate-700">FIPE API</span>
                    </div>
                    <span className="text-xs text-green-600 font-medium">Ativo</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${tenantForm.whatsapp_connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm font-medium text-slate-700">WPPConnect</span>
                    </div>
                    <span className={`text-xs font-medium ${tenantForm.whatsapp_connected ? 'text-green-600' : 'text-red-600'}`}>
                      {tenantForm.whatsapp_connected ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Ferramentas</h3>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          "Isso irá resetar todos os filtros salvos. Continuar?"
                        )
                      ) {
                        updatePreferences({ filters_json: "{}" });
                        showToast("Filtros resetados!", "success");
                      }
                    }}
                    className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-left text-sm font-medium text-slate-700 transition-colors"
                  >
                    Resetar Filtros Salvos
                  </button>

                  <button
                    type="button"
                    onClick={() => showToast("Funcionalidade em desenvolvimento", "success")}
                    className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-left text-sm font-medium text-slate-700 transition-colors"
                  >
                    Limpar Cache
                  </button>

                  <button
                    type="button"
                    onClick={() => showToast("Funcionalidade em desenvolvimento", "success")}
                    className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-left text-sm font-medium text-slate-700 transition-colors"
                  >
                    Ver Logs do Sistema
                  </button>

                  <button
                    type="button"
                    onClick={() => showToast("Funcionalidade em desenvolvimento", "success")}
                    className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-left text-sm font-medium text-slate-700 transition-colors"
                  >
                    Exportar Dados (Backup)
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Auditoria</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Logs de ações importantes (cancelamentos, estornos, alterações de valor)
                </p>
                <button
                  type="button"
                  onClick={() => showToast("Funcionalidade em desenvolvimento", "success")}
                  className="w-full px-4 py-3 bg-slate-700 text-white hover:bg-slate-800 rounded-xl text-sm font-medium transition-colors"
                >
                  Ver Logs de Auditoria
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
