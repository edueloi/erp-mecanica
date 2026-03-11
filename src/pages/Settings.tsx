import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
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
  CreditCard,
  Bot,
  Target,
  AlertTriangle,
  LayoutGrid,
} from "lucide-react";
import { useSettings } from "../contexts/SettingsContext";
import { useAuthStore } from "../services/authStore";
import * as ibgeService from "../services/ibgeService";
import api from "../services/api";
import { cn } from "../utils/cn";

type Tab = 
  | "overview"
  | "appearance" 
  | "user" 
  | "shop"
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
  const [activeTab, setActiveTab] = useState<Tab>((tab as any) || "overview");
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
    surname: currentUser?.surname || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    photo_url: currentUser?.photo_url || "",
    profession: currentUser?.profession || "",
    biography: currentUser?.biography || "",
    education: currentUser?.education || "",
    cpf: currentUser?.cpf || "",
  });

  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.name || "",
        surname: currentUser.surname || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        photo_url: currentUser.photo_url || "",
        profession: currentUser.profession || "",
        biography: currentUser.biography || "",
        education: currentUser.education || "",
        cpf: currentUser.cpf || "",
      });
    }
  }, [currentUser]);

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
    { id: "overview", label: "Início", icon: LayoutGrid },
    { id: "user", label: "Meu Perfil", icon: User },
    { id: "shop", label: "Minha Oficina", icon: Building2 },
    { id: "hours", label: "Horários", icon: Clock },
    { id: "team", label: "Equipe", icon: Users },
    { id: "documents", label: "Docs/PDFs", icon: FileText },
    { id: "communication", label: "WhatsApp", icon: MessageSquare },
    { id: "financial", label: "Financeiro", icon: DollarSign },
    { id: "operational", label: "Regras", icon: Wrench },
    { id: "notifications", label: "Notificações", icon: Bell },
    { id: "appearance", label: "Aparência", icon: Palette },
    { id: "security", label: "Segurança", icon: Shield },
    { id: "advanced", label: "Avançado", icon: Database },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Toast Notification */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-2.5 rounded-xl shadow-md"
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

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Premium Navigation Bar */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="relative max-w-7xl mx-auto">
            {/* Scroll fade indicators */}
            <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white/95 to-transparent z-10 pointer-events-none rounded-l-xl" />
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white/95 to-transparent z-10 pointer-events-none rounded-r-xl" />

            <div className="flex items-center overflow-x-auto no-scrollbar px-6 py-2 gap-1">
              {tabs.map((tabItem) => {
                const Icon = tabItem.icon;
                const isActive = activeTab === tabItem.id;
                return (
                  <button
                    key={tabItem.id}
                    onClick={() => { 
                      setActiveTab(tabItem.id as Tab); 
                      navigate(`/settings/${tabItem.id}`); 
                    }}
                    className={cn(
                      "relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 whitespace-nowrap group cursor-pointer shrink-0",
                      isActive 
                        ? "bg-slate-900 text-white shadow-lg shadow-slate-900/15" 
                        : "text-slate-400 hover:text-slate-700 hover:bg-slate-100/60"
                    )}
                  >
                    <Icon className={cn(
                      "w-4 h-4 transition-all duration-300",
                      isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                    )} />
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wider transition-all",
                      isActive ? "text-white" : ""
                    )}>
                      {tabItem.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 lg:p-6 bg-[#F8FAFC]">
          <AnimatePresence mode="wait">
            {/* 00) AJUSTES HUB (OVERVIEW) */}
            {activeTab === "overview" && (
              <motion.div
                key="settings-hub"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="max-w-4xl mx-auto py-4"
              >
                <div className="mb-3">
                  <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                    ⚙️ Central de Ajustes
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">Configure cada detalhe da sua oficina</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {tabs.slice(1).map((tabItem, idx) => {
                    const Icon = tabItem.icon;
                    return (
                      <motion.button
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        key={tabItem.id}
                        onClick={() => { setActiveTab(tabItem.id as Tab); navigate(`/settings/${tabItem.id}`); }}
                        className="group bg-white border border-slate-100 p-3 rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-col items-center gap-2"
                      >
                        <div className="w-9 h-9 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider text-center leading-tight group-hover:text-slate-900 transition-colors">{tabItem.label}</span>
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* 0) MEU PERFIL */}
            {activeTab === "user" && (
              <motion.div
                key="user-profile"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="max-w-3xl mx-auto space-y-3"
              >
              <h2 className="text-base font-bold text-slate-900">👤 Perfil Pessoal</h2>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative group cursor-pointer shrink-0" onClick={() => (document.getElementById('profile_photo_input') as HTMLInputElement)?.click()}>
                    <div className="w-14 h-14 rounded-xl bg-slate-50 border-2 border-white shadow-md flex items-center justify-center overflow-hidden group-hover:scale-105 transition-all">
                      {profileForm.photo_url ? (
                        <img src={profileForm.photo_url} className="w-full h-full object-cover" />
                      ) : (
                        <User className="text-slate-200" size={28} />
                      )}
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                        <Upload className="text-white" size={16} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{currentUser?.name}</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{currentUser?.role}</span>
                  </div>
                </div>
                <input id="profile_photo_input" type="file" className="hidden" accept="image/*"
                  onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { setProfileForm({ ...profileForm, photo_url: reader.result as string }); }; reader.readAsDataURL(file); } }}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Nome</label><input type="text" value={profileForm.name} onChange={(e) => setProfileForm({...profileForm, name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:bg-white outline-none transition-all text-sm font-medium" placeholder="Seu nome" /></div>
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">E-mail</label><input type="email" value={profileForm.email} disabled className="w-full px-3 py-2 bg-slate-100 border border-slate-100 rounded-lg text-sm text-slate-400 cursor-not-allowed" /></div>
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">WhatsApp</label><input type="text" value={profileForm.phone} onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:bg-white outline-none transition-all text-sm font-medium" placeholder="(00) 00000-0000" /></div>
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Função</label><input type="text" value={profileForm.profession} onChange={(e) => setProfileForm({...profileForm, profession: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:bg-white outline-none transition-all text-sm font-medium" placeholder="Ex: Mecânico Chefe" /></div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button onClick={handleSaveProfile} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all text-xs font-bold shadow-sm active:scale-[0.98] disabled:opacity-50 cursor-pointer">
                    <Save className="w-3.5 h-3.5" />{saving ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* 1) DADOS DA OFICINA */}
          {activeTab === "shop" && (
            <motion.div
              key="shop-settings"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              className="max-w-4xl mx-auto space-y-3 pb-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 mb-1 italic uppercase tracking-tight">🏢 Minha Oficina</h2>
                  <p className="text-sm font-medium text-slate-500">
                    Sua identidade profissional em todos os documentos e comunicações
                  </p>
                </div>
                <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-[#F8FAFC] rounded-xl border border-slate-200">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Sincronizado</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {/* Identidade Visual Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-bl-[10rem] -mr-32 -mt-32 transition-all group-hover:bg-slate-100/50" />
                  
                  <div className="relative flex flex-col md:flex-row items-center gap-3">
                    {/* Logo Upload */}
                    <div className="relative group/logo cursor-pointer shrink-0" onClick={() => (document.getElementById('workshop_logo_hero') as HTMLInputElement)?.click()}>
                      <div className="w-32 h-32 rounded-xl bg-white border-4 border-slate-50 shadow-md flex items-center justify-center overflow-hidden transition-all duration-500 group-hover/logo:scale-105 group-hover/logo:rotate-1">
                        {tenantForm.logo_url ? (
                          <img 
                            src={tenantForm.logo_url} 
                            alt="Logo" 
                            className="w-full h-full object-contain p-4"
                          />
                        ) : (
                          <Building2 className="text-slate-200" size={28} />
                        )}
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/logo:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                           <Upload className="text-white" size={16} />
                           <span className="text-[10px] text-white font-bold uppercase tracking-wider">Alterar Logo</span>
                        </div>
                      </div>
                    </div>

                    {/* Brand Identity Info */}
                    <div className="flex-1 space-y-3 w-full">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-1">Identidade da Marca</h3>
                        <p className="text-xs text-slate-500 font-medium">Sua cor e logo em orçamentos e comunicações</p>
                      </div>

                      <div className="flex flex-col gap-3">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-2">Cor de Destaque</label>
                          <div className="flex gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100 items-center">
                             <input
                               type="color"
                               value={tenantForm.primary_color || "#1e293b"}
                               onChange={(e) => setTenantForm({ ...tenantForm, primary_color: e.target.value })}
                               className="w-8 h-8 rounded-lg border-2 border-white shadow-md cursor-pointer shrink-0"
                             />
                             <div className="flex-1">
                               <input
                                 type="text"
                                 value={tenantForm.primary_color || ""}
                                 onChange={(e) => setTenantForm({ ...tenantForm, primary_color: e.target.value })}
                                 className="w-full bg-transparent border-none text-sm font-black font-mono text-slate-700 focus:ring-0 p-0"
                                 placeholder="#HEXCODE"
                               />
                               <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Código Hexadecimal</div>
                             </div>
                          </div>
                        </div>

                        <div className="px-6 py-5 bg-slate-900 rounded-xl text-white shadow-sm flex flex-col justify-center">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Dica Premium</span>
                          </div>
                          <p className="text-[10px] leading-relaxed opacity-90 font-medium italic">"Use arquivos PNG com fundo transparente para um acabamento profissional em seus PDFs."</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Section */}
                <div className="space-y-3">
                  {/* Basic Info */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                       <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                          <FileText size={20} />
                       </div>
                       <div>
                          <h3 className="text-sm font-bold text-slate-900">Cadastro e Contato</h3>
                          <p className="text-xs text-slate-500 font-medium">Informações oficiais para orçamentos e faturas</p>
                       </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-2">Razão Social</label>
                        <input
                          type="text"
                          value={tenantForm.company_name || ""}
                          onChange={(e) => setTenantForm({ ...tenantForm, company_name: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:bg-white focus:border-slate-900 outline-none transition-all font-bold text-slate-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-2">Nome Fantasia</label>
                        <input
                          type="text"
                          value={tenantForm.trade_name || ""}
                          onChange={(e) => setTenantForm({ ...tenantForm, trade_name: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:bg-white focus:border-slate-900 outline-none transition-all font-bold text-slate-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-2">Nome Curto (PDF)</label>
                        <input
                          type="text"
                          value={tenantForm.short_name || ""}
                          onChange={(e) => setTenantForm({ ...tenantForm, short_name: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:bg-white focus:border-slate-900 outline-none transition-all font-bold text-slate-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-2">CNPJ / CPF</label>
                        <input
                          type="text"
                          value={tenantForm.cnpj || ""}
                          onChange={(e) => setTenantForm({ ...tenantForm, cnpj: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:bg-white focus:border-slate-900 outline-none transition-all font-bold text-slate-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-2">Inscrição Estadual (IE)</label>
                        <input
                          type="text"
                          value={tenantForm.ie || ""}
                          onChange={(e) => setTenantForm({ ...tenantForm, ie: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:bg-white focus:border-slate-900 outline-none transition-all font-bold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-2">Slogan / Frase de Impacto</label>
                        <input
                          type="text"
                          value={tenantForm.slogan || ""}
                          onChange={(e) => setTenantForm({ ...tenantForm, slogan: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:bg-white focus:border-slate-900 outline-none transition-all font-bold text-slate-800 italic"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-2">Telefone (Fixo)</label>
                           <input
                             type="text"
                             value={tenantForm.phone || ""}
                             onChange={(e) => setTenantForm({ ...tenantForm, phone: e.target.value })}
                             className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 outline-none transition-all font-bold"
                           />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-2">WhatsApp Oficial</label>
                        <input
                          type="text"
                          value={tenantForm.whatsapp || ""}
                          onChange={(e) => setTenantForm({ ...tenantForm, whatsapp: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white border-2 border-emerald-500/20 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-emerald-600"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-2">E-mail Comercial</label>
                        <input
                          type="email"
                          value={tenantForm.email || ""}
                          onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 outline-none transition-all font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-2">Website</label>
                        <input
                          type="text"
                          value={tenantForm.website || ""}
                          onChange={(e) => setTenantForm({ ...tenantForm, website: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 outline-none transition-all font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-2">Instagram (@perfil)</label>
                        <input
                          type="text"
                          value={tenantForm.instagram || ""}
                          onChange={(e) => setTenantForm({ ...tenantForm, instagram: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 outline-none transition-all font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Location Info */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                       <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                          <Target size={20} />
                       </div>
                       <div>
                          <h3 className="text-sm font-bold text-slate-900">Localização</h3>
                          <p className="text-xs text-slate-500 font-medium">Onde seus clientes devem levar os veículos</p>
                       </div>
                    </div>

                    <div className="flex flex-col gap-3">
                       <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-2">CEP</label>
                          <input
                            type="text"
                            value={tenantForm.zip_code || ""}
                            onChange={(e) => setTenantForm({ ...tenantForm, zip_code: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 outline-none transition-all font-bold"
                          />
                       </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-2">UF</label>
                          <select
                            value={tenantForm.state || ""}
                            onChange={(e) => setTenantForm({ ...tenantForm, state: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 outline-none transition-all font-bold appearance-none cursor-pointer"
                          >
                            <option value="">--</option>
                            {estados.map((estado) => (
                              <option key={estado.id} value={estado.sigla}>{estado.sigla}</option>
                            ))}
                          </select>
                        </div>
                       <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-2">Cidade</label>
                        <select
                          value={tenantForm.city || ""}
                          onChange={(e) => setTenantForm({ ...tenantForm, city: e.target.value })}
                          disabled={!tenantForm.state}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 outline-none transition-all font-bold appearance-none cursor-pointer disabled:opacity-50"
                        >
                          <option value="">Selecione a cidade</option>
                          {cidades.map((cidade) => (
                            <option key={cidade.id} value={cidade.nome}>{cidade.nome}</option>
                          ))}
                        </select>
                       </div>
                       <div className="md:col-span-4 space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-2">Endereço Completo</label>
                          <input
                            type="text"
                            value={tenantForm.address || ""}
                            onChange={(e) => setTenantForm({ ...tenantForm, address: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 outline-none transition-all font-bold"
                          />
                       </div>
                    </div>
                  </div>

                  {/* Botão Salvar Centralizado */}
                  <div className="flex justify-end pt-3">
                    <button
                      type="button"
                      onClick={() => handleSaveTenantSettings()}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-xs shadow-lg shadow-slate-900/20 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? "Salvando..." : "Atualizar Oficina"}
                    </button>
                  </div>
                </div>
              </div>

              <input 
                id="workshop_logo_hero"
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setTenantForm({ ...tenantForm, logo_url: reader.result as string });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </motion.div>
          )}

          {/* 2) HORÁRIOS */}
          {activeTab === "hours" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto space-y-3"
            >
              <div className="mb-3">
                <h2 className="text-sm font-bold text-slate-900 mb-2">🕒 Horários e Atendimento</h2>
                <p className="text-sm text-slate-600">
                  Defina quando sua oficina funciona
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Horário de Funcionamento</h3>
                <div className="space-y-4">
                  <div className="flex flex-col gap-4">
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

                  <div className="flex flex-col gap-4">
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

                  <div className="flex flex-col gap-4">
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

                  <div className="flex flex-col gap-4">
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

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Agendamentos</h3>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Duração Padrão (minutos)
                    </label>
                    <select
                      value={tenantForm.default_appointment_duration || 60}
                      onChange={(e) => setTenantForm({ ...tenantForm, default_appointment_duration: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
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
                  className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-semibold shadow-lg disabled:opacity-50 cursor-pointer"
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
              className="max-w-4xl mx-auto space-y-3"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 mb-2 italic uppercase tracking-tight">
                    👥 Equipe e Permissões
                  </h2>
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {usersList.slice(0, 5).map((u, i) => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm">
                          {u.photo_url ? (
                            <img src={u.photo_url} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-400">
                              {u.name.charAt(0)}
                            </div>
                          )}
                        </div>
                      ))}
                      {usersList.length > 5 && (
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                          +{usersList.length - 5}
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium text-slate-500">
                      Gerencie sua equipe. <span className="font-bold text-slate-900">{usersList.length} de {tenantSettings.user_limit || 5}</span> licenças em uso.
                    </p>
                  </div>
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
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-slate-800 transition-all shadow-sm shadow-slate-900/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  Novo Integrante
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Administradores", count: usersList.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length, color: "amber" },
                  { label: "Mecânicos", count: usersList.filter(u => u.role === 'MECHANIC').length, color: "blue" },
                  { label: "Atendentes", count: usersList.filter(u => u.role === 'ATTENDANT').length, color: "emerald" },
                  { label: "Financeiro", count: usersList.filter(u => u.role === 'FINANCE').length, color: "purple" },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider">{stat.label}</span>
                    <span className={`text-sm font-black text-${stat.color}-600 bg-${stat.color}-50 px-3 py-1 rounded-xl`}>{stat.count}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {usersList.length === 0 ? (
                  <div className="col-span-full py-24 text-center bg-white rounded-xl border border-dashed border-slate-300">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-2">Sua oficina ainda está vazia</h3>
                    <p className="text-slate-500 max-w-xs mx-auto">Comece adicionando seus colaboradores para gerenciar permissões e atividades.</p>
                  </div>
                ) : (
                  usersList.map((user) => (
                    <motion.div 
                      layout
                      key={user.id} 
                      className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-500 group overflow-hidden"
                    >
                       <div className="p-8">
                          <div className="flex items-start justify-between mb-3">
                             <div className="relative">
                                <div className="w-12 h-12 rounded-xl bg-slate-100 border-2 border-white shadow-lg overflow-hidden group-hover:scale-110 transition-transform duration-700">
                                   {user.photo_url ? (
                                      <img src={user.photo_url} alt={user.name} className="w-full h-full object-cover" />
                                   ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-slate-300 font-black text-sm uppercase italic">
                                         {user.name.charAt(0)}
                                      </div>
                                   )}
                                </div>
                                <div className={cn(
                                  "absolute -bottom-1 -right-1 w-8 h-8 rounded-xl border-2 border-white flex items-center justify-center shadow-sm transition-transform duration-500 group-hover:rotate-12",
                                  user.role === 'ADMIN' ? 'bg-amber-500' : 
                                  user.role === 'SUPER_ADMIN' ? 'bg-indigo-600' : 'bg-slate-800'
                                )}>
                                   <Shield className="text-white" size={12} />
                                </div>
                             </div>
                             
                             <div className="flex gap-2">
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
                                   className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white flex items-center justify-center transition-all duration-300 cursor-pointer"
                                >
                                   <Edit2 size={16} />
                                </button>
                                <button 
                                   onClick={async () => {
                                      if (window.confirm(`Deseja realmente excluir o usuário ${user.name}?`)) {
                                         try {
                                            await api.delete(`/users/${user.id}`);
                                            showToast("Usuário removido com sucesso!");
                                            loadUsers();
                                         } catch (error: any) {
                                            showToast(error.response?.data?.error || "Erro ao excluir", "error");
                                         }
                                      }
                                   }}
                                   className="w-10 h-10 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all duration-300 cursor-pointer"
                                >
                                   <Trash2 size={16} />
                                </button>
                             </div>
                          </div>

                          <div className="space-y-1 mb-3">
                             <h4 className="font-black text-slate-900 text-sm leading-tight uppercase italic truncate">{user.name}</h4>
                             <p className="text-xs text-slate-400 font-bold tracking-tight truncate">{user.email}</p>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                             <span className={cn(
                               "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border shadow-sm transition-colors",
                               user.role === 'ADMIN' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                               user.role === 'SUPER_ADMIN' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                               'bg-slate-50 text-slate-600 border-slate-100'
                             )}>
                                {user.role === 'ADMIN' ? 'Administrador' : 
                                 user.role === 'MECHANIC' ? 'Mecânico' :
                                 user.role === 'ATTENDANT' ? 'Atendimento' : 
                                 user.role === 'FINANCE' ? 'Financeiro' : user.role}
                             </span>
                          </div>

                          <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                             <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-wider">Membro desde</span>
                                <span className="text-xs font-bold text-slate-600 tracking-tight">{new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric', day: '2-digit' })}</span>
                             </div>
                             <div className="flex -space-x-1">
                                {[1,2,3].map(i => (
                                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                ))}
                             </div>
                          </div>
                       </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* User Modal */}
              {showUserModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    onClick={() => setShowUserModal(false)}
                    className="absolute inset-0 bg-slate-900/80 backdrop-blur-md cursor-pointer" 
                  />
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-md w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col relative z-10 border border-white/20"
                  >
                    <div className="px-4 py-8 bg-gradient-to-r from-slate-900 to-slate-800 flex justify-between items-center shrink-0">
                      <div>
                        <h3 className="text-sm font-black text-white italic uppercase tracking-tight">
                          {editingUser ? "✨ Ajustar Integrante" : "🚀 Novo Integrante"}
                        </h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">Configurações de acesso e perfil</p>
                      </div>
                      <button 
                        onClick={() => setShowUserModal(false)} 
                        className="w-8 h-8 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all flex items-center justify-center active:scale-90 cursor-pointer"
                      >
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
                            showToast("Integrante atualizado!");
                          } else {
                            await api.post("/users", userForm);
                            showToast("🚀 Novo integrante a bordo!");
                          }
                          setShowUserModal(false);
                          loadUsers();
                        } catch (error: any) {
                          showToast(error.response?.data?.error || "Erro ao salvar", "error");
                        } finally {
                          setSaving(false);
                        }
                      }}
                      className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3"
                    >
                      {/* Photo Upload */}
                      <div className="flex flex-col items-center">
                        <div 
                          className="relative group cursor-pointer" 
                          onClick={() => (document.getElementById('user_photo_input') as HTMLInputElement)?.click()}
                        >
                          <div className="w-32 h-32 rounded-xl bg-slate-50 border-4 border-slate-100 shadow-sm flex items-center justify-center overflow-hidden transition-transform duration-500 group-hover:scale-105">
                            {userForm.photo_url ? (
                              <img src={userForm.photo_url} className="w-full h-full object-cover" />
                            ) : (
                              <User className="text-slate-200" size={24} />
                            )}
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                              <Upload className="text-white" size={16} />
                              <span className="text-[10px] text-white font-bold uppercase tracking-wider">Mudar Foto</span>
                            </div>
                          </div>
                          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-slate-900 text-white shadow-sm flex items-center justify-center border-2 border-white">
                            <Plus size={18} />
                          </div>
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
                      </div>

                      <div className="flex flex-col gap-3">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Nome Completo</label>
                          <input 
                            required
                            type="text"
                            value={userForm.name}
                            onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:bg-white focus:border-slate-900 outline-none transition-all font-bold text-slate-900"
                            placeholder="Ex: Pedro Alvares"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">E-mail de Acesso</label>
                          <input 
                            required
                            type="email"
                            value={userForm.email}
                            onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:bg-white focus:border-slate-900 outline-none transition-all font-bold text-slate-900"
                            placeholder="pedro@oficina.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Cargo / Função</label>
                          <select 
                            value={userForm.role}
                            onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:bg-white focus:border-slate-900 outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer"
                          >
                            <option value="ADMIN">Administrador Geral</option>
                            <option value="MECHANIC">Mecânico / Técnico</option>
                            <option value="ATTENDANT">Atendimento / Recepcionista</option>
                            <option value="FINANCE">Gestor Financeiro</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                            {editingUser ? "Nova Senha (opcional)" : "Senha de Acesso"}
                          </label>
                          <input 
                            required={!editingUser}
                            type="password"
                            value={userForm.password}
                            onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:bg-white focus:border-slate-900 outline-none transition-all font-bold text-slate-900"
                            placeholder="••••••"
                          />
                        </div>
                      </div>

                      <div className="pt-6">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="h-px flex-1 bg-slate-100" />
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Módulos Habilitados</h4>
                          <div className="h-px flex-1 bg-slate-100" />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.keys(userForm.permissions).map((module) => (
                            <label 
                              key={module} 
                              className={cn(
                                "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300",
                                (userForm.permissions as any)[module] 
                                  ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/10" 
                                  : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                              )}
                            >
                              <div className="relative inline-flex items-center cursor-pointer">
                                <input 
                                  type="checkbox"
                                  className="sr-only"
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
                                <div className={cn(
                                  "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all",
                                  (userForm.permissions as any)[module] ? "bg-white border-white" : "bg-transparent border-slate-200"
                                )}>
                                  {(userForm.permissions as any)[module] && <Check className="text-slate-900" size={12} strokeWidth={4} />}
                                </div>
                              </div>
                              <span className="text-[11px] font-bold uppercase tracking-wider truncate">
                                {module === 'dashboard' ? 'Início' :
                                 module === 'workOrders' ? 'Ordens' :
                                 module === 'appointments' ? 'Agenda' :
                                 module === 'inventory' ? 'Estoque' :
                                 module === 'finance' ? 'Financeiro' :
                                 module === 'settings' ? 'Ajustes' :
                                 module === 'clients' ? 'Clientes' :
                                 module === 'vehicles' ? 'Veículos' :
                                 module === 'whatsapp' ? 'WhatsApp' : module}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 flex flex-col sm:flex-row gap-4">
                        <button 
                          type="button" 
                          onClick={() => setShowUserModal(false)}
                          className="flex-1 px-4 py-2.5 border-2 border-slate-100 text-slate-400 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-slate-50 hover:border-slate-200 transition-all active:scale-95 cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button 
                          type="submit"
                          disabled={saving}
                          className="flex-[2] px-4 py-2.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-slate-800 transition-all shadow-md shadow-slate-900/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                          {saving ? "Processando..." : editingUser ? "Confirmar Alterações" : "Ativar Novo Membro"}
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
              className="max-w-4xl mx-auto space-y-3"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 mb-2 italic uppercase tracking-tight">📄 Docs/PDFs</h2>
                  <p className="text-sm font-medium text-slate-500">
                    Personalize o layout e as regras de impressão de seus documentos
                  </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                   <FileCheck size={16} />
                   <span className="text-[10px] font-bold uppercase tracking-wider">Padrão ABNT</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {/* Column 1: Layout & Numbering */}
                <div className="space-y-3">
                  {/* PDF Configuration */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center gap-4 mb-3">
                       <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                          <Palette size={16} />
                       </div>
                       <div>
                          <h3 className="text-sm font-bold text-slate-900">Layout do Cabeçalho</h3>
                          <p className="text-xs text-slate-500 font-medium">O que deve aparecer no topo de cada folha</p>
                       </div>
                    </div>

                    <div className="space-y-4">
                      <label className="flex items-center group cursor-pointer p-4 rounded-xl border border-slate-50 hover:bg-slate-50 transition-all">
                        <div className="flex-1">
                          <div className="text-sm font-black text-slate-800 uppercase tracking-tight">Exibir Logo da Oficina</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">Sua marca no topo esquerdo</div>
                        </div>
                        <div className="relative inline-flex items-center">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={tenantForm.show_logo_pdf || false}
                            onChange={(e) => setTenantForm({ ...tenantForm, show_logo_pdf: e.target.checked })}
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900 shadow-inner"></div>
                        </div>
                      </label>

                      <label className="flex items-center group cursor-pointer p-4 rounded-xl border border-slate-50 hover:bg-slate-50 transition-all">
                        <div className="flex-1">
                          <div className="text-sm font-black text-slate-800 uppercase tracking-tight">Dados de Contato</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">Endereço e telefones no topo</div>
                        </div>
                        <div className="relative inline-flex items-center">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={tenantForm.show_company_data_pdf || false}
                            onChange={(e) => setTenantForm({ ...tenantForm, show_company_data_pdf: e.target.checked })}
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900 shadow-inner"></div>
                        </div>
                      </label>

                      <div className="pt-4 mt-4 border-t border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-4 ml-1">Rodapé Customizado (O que exibir)</p>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: 'pdf_footer_address', label: 'Endereço' },
                            { id: 'pdf_footer_phone', label: 'Telefone' },
                            { id: 'pdf_footer_whatsapp', label: 'WhatsApp' },
                            { id: 'pdf_footer_website', label: 'Site (URL)' }
                          ].map(item => (
                            <label key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-300 transition-all cursor-pointer bg-slate-50/50">
                              <input
                                type="checkbox"
                                checked={(tenantForm as any)[item.id] || false}
                                onChange={(e) => setTenantForm({ ...tenantForm, [item.id]: e.target.checked })}
                                className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                              />
                              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{item.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* OS Numbering */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center gap-4 mb-3">
                       <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-500">
                          <Database size={16} />
                       </div>
                       <div>
                          <h3 className="text-sm font-bold text-slate-900">Numeração de OS</h3>
                          <p className="text-xs text-slate-500 font-medium">Configure o sequencial de seus registros</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Prefixo</label>
                        <input
                          type="text"
                          value={tenantForm.os_prefix || "OFC"}
                          onChange={(e) => setTenantForm({ ...tenantForm, os_prefix: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:bg-white focus:border-slate-900 outline-none transition-all font-bold text-slate-900"
                          placeholder="Ex: OS"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Próximo Número</label>
                        <input
                          type="number"
                          className="w-full px-4 py-2.5 bg-slate-100 border border-slate-100 rounded-xl text-slate-400 font-bold cursor-not-allowed"
                          value="128"
                          disabled
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Formato Visual</label>
                        <input
                          type="text"
                          value={tenantForm.os_format || "OFC-{YEAR}-{NUMBER}"}
                          onChange={(e) => setTenantForm({ ...tenantForm, os_format: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:bg-white focus:border-slate-900 outline-none transition-all font-bold text-slate-600 font-mono"
                          placeholder="Ex: {YEAR}{NUMBER}"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Standard Texts */}
                <div className="space-y-3">
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm h-full flex flex-col">
                    <div className="flex items-center gap-4 mb-3">
                       <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                          <FileText size={16} />
                       </div>
                       <div>
                          <h3 className="text-sm font-bold text-slate-900">Cláusulas e Textos</h3>
                          <p className="text-xs text-slate-500 font-medium">Textos automáticos que poupam seu tempo</p>
                       </div>
                    </div>

                    <div className="space-y-3 flex-1">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Termos de Uso e Autorização</label>
                        <textarea
                          rows={4}
                          value={tenantForm.terms_and_conditions || ""}
                          onChange={(e) => setTenantForm({ ...tenantForm, terms_and_conditions: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:bg-white focus:border-slate-900 outline-none transition-all font-medium text-sm text-slate-700 leading-relaxed active:border-slate-900"
                          placeholder="Texto exibido na entrada do veículo..."
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Política de Garantia Padrão</label>
                        <textarea
                          rows={3}
                          value={tenantForm.default_warranty_text || ""}
                          onChange={(e) => setTenantForm({ ...tenantForm, default_warranty_text: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:bg-white focus:border-slate-900 outline-none transition-all font-medium text-sm text-slate-700 leading-relaxed"
                          placeholder="Regras de garantia (Ex: 90 dias)..."
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Validade e Regras de Orçamento</label>
                        <textarea
                          rows={3}
                          value={tenantForm.default_quote_text || ""}
                          onChange={(e) => setTenantForm({ ...tenantForm, default_quote_text: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:bg-white focus:border-slate-900 outline-none transition-all font-medium text-sm text-slate-700 leading-relaxed"
                          placeholder="Prazo de validade do orçamento..."
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => showToast("Visualizando exemplo de PDF...", "success")}
                      className="mt-8 flex items-center justify-center gap-2 px-6 py-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all font-bold text-xs active:scale-95 cursor-pointer border border-blue-100"
                    >
                      <Plus className="w-4 h-4" />
                      Visualizar Exemplo
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 pb-4 sticky bottom-0 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pointer-events-none">
                <button
                  type="button"
                  onClick={() => handleSaveTenantSettings()}
                  disabled={saving}
                  className="pointer-events-auto flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-xs shadow-lg shadow-slate-900/20 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Salvando..." : "Salvar Configurações"}
                </button>
              </div>
            </motion.div>
          )}

          {/* 5) COMUNICAÇÃO / WHATSAPP */}
          {activeTab === "communication" && (
            <motion.div
              key="communication"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              className="max-w-4xl mx-auto space-y-3"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 mb-2 italic uppercase tracking-tight">💬 Comunicação e WhatsApp</h2>
                  <p className="text-sm font-medium text-slate-500">
                    Gerencie a integração com clientes e canais de contato
                  </p>
                </div>
                {tenantForm.whatsapp_connected ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Conectado</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl border border-red-100">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Desconectado</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center gap-4 mb-3">
                     <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                        <MessageSquare size={16} />
                     </div>
                     <div>
                        <h3 className="text-sm font-bold text-slate-900">Status WhatsApp</h3>
                        <p className="text-xs text-slate-500 font-medium">Instância de conexão ativa</p>
                     </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Número Conectado</div>
                      <div className="text-sm font-mono font-black text-slate-900">{tenantForm.whatsapp || 'Não Vinculado'}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => showToast("Redirecionando para central de WhatsApp...")}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-xs active:scale-95 cursor-pointer shadow-lg shadow-slate-900/10"
                    >
                      Configurar Conexão
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center gap-4 mb-3">
                     <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                        <Bot size={16} />
                     </div>
                     <div>
                        <h3 className="text-sm font-bold text-slate-900">Automação Bot</h3>
                        <p className="text-xs text-slate-500 font-medium">Respostas automáticas inteligentes</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center group cursor-pointer p-4 rounded-xl border border-slate-50 hover:bg-slate-50 transition-all">
                      <div className="flex-1">
                        <div className="text-sm font-black text-slate-800 uppercase tracking-tight">Ativar Bot por Padrão</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">Responder novos contatos 24/7</div>
                      </div>
                      <div className="relative inline-flex items-center">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={tenantForm.whatsapp_bot_enabled || false}
                          onChange={(e) => setTenantForm({ ...tenantForm, whatsapp_bot_enabled: e.target.checked })}
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900 shadow-inner"></div>
                      </div>
                    </label>

                    <button
                      type="button"
                      onClick={() => showToast("Acessando editor de fluxos...")}
                      className="w-full px-4 py-4 bg-slate-50 text-slate-600 rounded-xl border border-slate-100 hover:bg-slate-100 transition-all font-bold text-xs cursor-pointer"
                    >
                      Editar Templates & Fluxos
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
                      <TestTube size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Testar Comunicação</h3>
                      <p className="text-xs text-slate-500 font-medium">Verifique se as notificações estão chegando</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => showToast("Enviando SMS e WhatsApp de teste...", "success")}
                    className="flex items-center gap-3 px-4 py-4 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-all font-bold text-xs cursor-pointer"
                  >
                    Simular Envio
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => handleSaveTenantSettings()}
                  disabled={saving}
                  className="flex items-center gap-3 px-6 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-xs shadow-md shadow-slate-900/20 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-5 h-5" />
                  {saving ? "Salvando..." : "Salvar Configurações"}
                </button>
              </div>
            </motion.div>
          )}

          {/* 6) FINANCEIRO */}
          {activeTab === "financial" && (
            <motion.div
              key="financial"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              className="max-w-4xl mx-auto space-y-3"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 mb-2 italic uppercase tracking-tight">💰 Gestão Financeira</h2>
                  <p className="text-sm font-medium text-slate-500">
                    Defina taxas, juros e regras de faturamento padrão
                  </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl">
                   <DollarSign size={16} />
                   <span className="text-[10px] font-bold uppercase tracking-wider">BRL / Real</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {/* Column 1: Payments */}
                <div className="lg:col-span-2 space-y-3">
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center gap-4 mb-3">
                       <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                          <CreditCard size={16} />
                       </div>
                       <div>
                          <h3 className="text-sm font-bold text-slate-900">Regras de Recebimento</h3>
                          <p className="text-xs text-slate-500 font-medium">Configure como você cobra seus clientes</p>
                       </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Vencimento Padrão (Dias)</label>
                        <input
                          type="number"
                          value={tenantForm.default_due_days || 30}
                          onChange={(e) => setTenantForm({ ...tenantForm, default_due_days: parseInt(e.target.value) })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:bg-white focus:border-slate-900 outline-none transition-all font-bold text-slate-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Parcelamento Máximo</label>
                        <input
                          type="number"
                          value={tenantForm.max_installments || 12}
                          onChange={(e) => setTenantForm({ ...tenantForm, max_installments: parseInt(e.target.value) })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:bg-white focus:border-slate-900 outline-none transition-all font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Chave PIX Principal</label>
                        <input
                          type="text"
                          value={tenantForm.pix_key || ""}
                          onChange={(e) => setTenantForm({ ...tenantForm, pix_key: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:bg-white focus:border-slate-900 outline-none transition-all font-bold text-slate-900"
                          placeholder="CNPJ, E-mail ou Aleatória"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Formas Acetias (Slug)</label>
                        <input
                          type="text"
                          value={tenantForm.payment_methods || "pix,card,cash"}
                          onChange={(e) => setTenantForm({ ...tenantForm, payment_methods: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:bg-white focus:border-slate-900 outline-none transition-all font-bold text-slate-600 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Fees & Interest */}
                <div className="space-y-3">
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center gap-4 mb-3">
                       <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                          <AlertTriangle size={16} />
                       </div>
                       <div>
                          <h3 className="text-sm font-bold text-slate-900">Multas e Juros</h3>
                          <p className="text-xs text-slate-500 font-medium">Rigor com atrasos</p>
                       </div>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Juros ao Mês (%)</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            value={tenantForm.late_fee_percentage || 0}
                            onChange={(e) => setTenantForm({ ...tenantForm, late_fee_percentage: parseFloat(e.target.value) })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5"
                          />
                          <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300">%</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Multa Fixa (R$)</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            value={tenantForm.fixed_penalty || 0}
                            onChange={(e) => setTenantForm({ ...tenantForm, fixed_penalty: parseFloat(e.target.value) })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5"
                          />
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300">R$</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-50">
                         <div className="px-4 py-2.5 bg-slate-900 text-white rounded-xl">
                           <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Cálculo Automático</div>
                           <div className="text-xs font-bold leading-relaxed">O sistema calcula juros mora diários automaticamente no boleto/fatura.</div>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => handleSaveTenantSettings()}
                  disabled={saving}
                  className="flex items-center gap-3 px-6 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-xs shadow-md shadow-slate-900/20 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-5 h-5" />
                  {saving ? "Salvando..." : "Salvar Configurações Financeiras"}
                </button>
              </div>
            </motion.div>
          )}

          {/* 7) REGRAS OPERACIONAIS */}
          {activeTab === "operational" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto space-y-3"
            >
              <div className="mb-3">
                <h2 className="text-sm font-bold text-slate-900 mb-2">⚙️ Regras</h2>
                <p className="text-sm text-slate-600">
                  Defina comportamentos do sistema
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Ordens de Serviço</h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-medium text-slate-900">Permitir finalizar OS sem pagamento</div>
                      <div className="text-sm text-slate-500">Permite finalizar mesmo sem receber</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={tenantForm.allow_finish_os_without_payment || false}
                      onChange={(e) => setTenantForm({ ...tenantForm, allow_finish_os_without_payment: e.target.checked })}
                      className="w-5 h-5 text-slate-600 rounded focus:ring-slate-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-medium text-slate-900">Permitir entregar veículo sem pagamento</div>
                      <div className="text-sm text-slate-500">Cliente pode retirar carro sem pagar</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={tenantForm.allow_deliver_without_payment || false}
                      onChange={(e) => setTenantForm({ ...tenantForm, allow_deliver_without_payment: e.target.checked })}
                      className="w-5 h-5 text-slate-600 rounded focus:ring-slate-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-medium text-slate-900">Exigir aprovação do cliente</div>
                      <div className="text-sm text-slate-500">Cliente deve aprovar orçamento antes de executar</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={tenantForm.require_client_approval || false}
                      onChange={(e) => setTenantForm({ ...tenantForm, require_client_approval: e.target.checked })}
                      className="w-5 h-5 text-slate-600 rounded focus:ring-slate-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-medium text-slate-900">Checklist obrigatório</div>
                      <div className="text-sm text-slate-500">Obriga preenchimento do checklist de vistoria</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={tenantForm.require_checklist || false}
                      onChange={(e) => setTenantForm({ ...tenantForm, require_checklist: e.target.checked })}
                      className="w-5 h-5 text-slate-600 rounded focus:ring-slate-500 cursor-pointer"
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

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Estoque</h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-medium text-slate-900">Baixar estoque automático</div>
                      <div className="text-sm text-slate-500">Descontar peças ao finalizar OS</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={tenantForm.auto_decrease_stock || false}
                      onChange={(e) => setTenantForm({ ...tenantForm, auto_decrease_stock: e.target.checked })}
                      className="w-5 h-5 text-slate-600 rounded focus:ring-slate-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-medium text-slate-900">Alertar estoque baixo</div>
                      <div className="text-sm text-slate-500">Notificar quando atingir estoque mínimo</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={tenantForm.alert_stock_low || false}
                      onChange={(e) => setTenantForm({ ...tenantForm, alert_stock_low: e.target.checked })}
                      className="w-5 h-5 text-slate-600 rounded focus:ring-slate-500 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end sticky bottom-0 bg-slate-50 py-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => handleSaveTenantSettings()}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-semibold shadow-lg disabled:opacity-50 cursor-pointer"
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
              className="max-w-3xl mx-auto space-y-3"
            >
              <div className="mb-3">
                <h2 className="text-sm font-bold text-slate-900 mb-2">🔔 Notificações</h2>
                <p className="text-sm text-slate-600">
                  Configure alertas e lembretes automáticos
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Alertas</h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-medium text-slate-900">Alertar Clientes Inadimplentes</div>
                      <div className="text-sm text-slate-500">Exibir avisos sobre clientes com contas em atraso</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={tenantForm.alert_overdue_clients || false}
                      onChange={(e) => setTenantForm({ ...tenantForm, alert_overdue_clients: e.target.checked })}
                      className="w-5 h-5 text-slate-600 rounded focus:ring-slate-500 cursor-pointer"
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
                  className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-semibold shadow-lg disabled:opacity-50 cursor-pointer"
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
              className="max-w-4xl mx-auto space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 mb-1">🎨 Aparência & Personalização</h2>
                  <p className="text-sm text-slate-500">
                    Ajuste as cores e o comportamento visual do seu sistema
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (confirm("Deseja restaurar as cores padrões do sistema?")) {
                      setSaving(true);
                      try {
                        await updatePreferences({
                          primary_color: "#1e293b",
                          secondary_color: "#64748b",
                          sidebar_color: "#0f172a",
                          sidebar_text_color: "#94a3b8",
                          header_color: "#ffffff"
                        });
                        showToast("Cores restauradas!", "success");
                      } finally {
                        setSaving(false);
                      }
                    }
                  }}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Restaurar Padrões
                </button>
              </div>

              {/* Theme Mode */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Sun className="w-4 h-4" /> Modo de Visualização
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'light', label: 'Claro', icon: Sun, desc: 'Ideal para ambientes iluminados' },
                    { id: 'dark', label: 'Escuro', icon: Moon, desc: 'Conforto visual e economia' },
                    { id: 'auto', label: 'Sistema', icon: MonitorSmartphone, desc: 'Segue seu computador' }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => handleThemeChange(mode.id as any)}
                      disabled={saving}
                      className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer group ${
                        preferences.theme_mode === mode.id
                          ? "border-slate-900 bg-slate-50 shadow-md"
                          : "border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
                      } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <mode.icon className={`w-8 h-8 transition-colors ${preferences.theme_mode === mode.id ? 'text-slate-900' : 'text-slate-300 group-hover:text-slate-400'}`} />
                      <div className="text-center">
                        <div className={`font-black text-xs uppercase tracking-wider ${preferences.theme_mode === mode.id ? 'text-slate-900' : 'text-slate-400'}`}>{mode.label}</div>
                        <div className="text-[10px] text-slate-400 font-medium mt-1 leading-tight">{mode.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Palette */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Palette className="w-4 h-4" /> Paleta de Cores do Sistema
                </h3>
                
                <div className="flex flex-col gap-3">
                  {/* Primary & Secondary */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Cor de Destaque (Primária)</label>
                      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <input
                          type="color"
                          value={preferences.primary_color || "#1e293b"}
                          onChange={(e) => updatePreferences({ primary_color: e.target.value })}
                          className="w-8 h-8 rounded-lg border-2 border-white shadow-lg cursor-pointer"
                        />
                        <div className="flex-1">
                          <input
                            type="text"
                            value={preferences.primary_color || ""}
                            onChange={(e) => updatePreferences({ primary_color: e.target.value })}
                            className="bg-transparent border-none font-mono font-bold text-sm text-slate-600 focus:ring-0 p-0 w-full"
                          />
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Botões, seleções e ícones ativos</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Cor de Apoio (Secundária)</label>
                      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <input
                          type="color"
                          value={preferences.secondary_color || "#64748b"}
                          onChange={(e) => updatePreferences({ secondary_color: e.target.value })}
                          className="w-8 h-8 rounded-lg border-2 border-white shadow-lg cursor-pointer"
                        />
                        <div className="flex-1">
                          <input
                            type="text"
                            value={preferences.secondary_color || ""}
                            onChange={(e) => updatePreferences({ secondary_color: e.target.value })}
                            className="bg-transparent border-none font-mono font-bold text-sm text-slate-600 focus:ring-0 p-0 w-full"
                          />
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Textos de apoio e ícones inativos</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar & Header */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Menu Lateral (Fundo)</label>
                      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <input
                          type="color"
                          value={preferences.sidebar_color || "#0f172a"}
                          onChange={(e) => updatePreferences({ sidebar_color: e.target.value })}
                          className="w-8 h-8 rounded-lg border-2 border-white shadow-lg cursor-pointer"
                        />
                        <div className="flex-1">
                          <input
                            type="text"
                            value={preferences.sidebar_color || ""}
                            onChange={(e) => updatePreferences({ sidebar_color: e.target.value })}
                            className="bg-transparent border-none font-mono font-bold text-sm text-slate-600 focus:ring-0 p-0 w-full"
                          />
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Cor de fundo da barra lateral</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Menu Lateral (Texto)</label>
                      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <input
                          type="color"
                          value={preferences.sidebar_text_color || "#94a3b8"}
                          onChange={(e) => updatePreferences({ sidebar_text_color: e.target.value })}
                          className="w-8 h-8 rounded-lg border-2 border-white shadow-lg cursor-pointer"
                        />
                        <div className="flex-1">
                          <input
                            type="text"
                            value={preferences.sidebar_text_color || ""}
                            onChange={(e) => updatePreferences({ sidebar_text_color: e.target.value })}
                            className="bg-transparent border-none font-mono font-bold text-sm text-slate-600 focus:ring-0 p-0 w-full"
                          />
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Nomes e ícones inativos do menu</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Display Preferences */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <MonitorSmartphone className="w-4 h-4" /> Comportamento da Interface
                </h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer group">
                    <div>
                      <div className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">Resumo Automático</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">Mostrar cards de estatísticas no topo</div>
                    </div>
                    <div className="relative inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.show_dashboard_cards}
                        onChange={(e) => updatePreferences({ show_dashboard_cards: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer group">
                    <div>
                      <div className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">Menu Minimalista</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">Iniciar com a barra lateral recolhida</div>
                    </div>
                    <div className="relative inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.sidebar_collapsed}
                        onChange={(e) => updatePreferences({ sidebar_collapsed: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                    </div>
                  </label>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <div className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">Volume de Dados</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">Linhas exibidas por página em tabelas</div>
                    </div>
                    <select
                      value={preferences.default_rows_per_page}
                      onChange={(e) => updatePreferences({ default_rows_per_page: parseInt(e.target.value) })}
                      className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider outline-none focus:ring-2 focus:ring-slate-900/5 cursor-pointer"
                    >
                      <option value="10">10 Linhas</option>
                      <option value="20">20 Linhas</option>
                      <option value="50">50 Linhas</option>
                      <option value="100">100 Linhas</option>
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
              className="max-w-2xl mx-auto space-y-3"
            >
              <div className="mb-3">
                <h2 className="text-sm font-bold text-slate-900 mb-2">🔒 Segurança</h2>
                <p className="text-sm text-slate-600">
                  Gerencie senha e configurações de segurança
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-3">
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 mb-4">Alterar Senha</h3>
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
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
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
                    className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-semibold shadow-lg disabled:opacity-50 cursor-pointer"
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
              className="max-w-2xl mx-auto space-y-3"
            >
              <div className="mb-3">
                <h2 className="text-sm font-bold text-slate-900 mb-2">🔧 Avançado</h2>
                <p className="text-sm text-slate-600">
                  Ferramentas administrativas e manutenção
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Integrações</h3>
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

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Ferramentas</h3>
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
                    className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-left text-sm font-medium text-slate-700 transition-colors cursor-pointer"
                  >
                    Resetar Filtros Salvos
                  </button>

                  <button
                    type="button"
                    onClick={() => showToast("Funcionalidade em desenvolvimento", "success")}
                    className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-left text-sm font-medium text-slate-700 transition-colors cursor-pointer"
                  >
                    Limpar Cache
                  </button>

                  <button
                    type="button"
                    onClick={() => showToast("Funcionalidade em desenvolvimento", "success")}
                    className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-left text-sm font-medium text-slate-700 transition-colors cursor-pointer"
                  >
                    Ver Logs do Sistema
                  </button>

                  <button
                    type="button"
                    onClick={() => showToast("Funcionalidade em desenvolvimento", "success")}
                    className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-left text-sm font-medium text-slate-700 transition-colors cursor-pointer"
                  >
                    Exportar Dados (Backup)
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Auditoria</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Logs de ações importantes (cancelamentos, estornos, alterações de valor)
                </p>
                <button
                  type="button"
                  onClick={() => showToast("Funcionalidade em desenvolvimento", "success")}
                  className="w-full px-4 py-3 bg-slate-700 text-white hover:bg-slate-800 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                >
                  Ver Logs de Auditoria
                </button>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
