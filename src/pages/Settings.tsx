import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useSettings } from "../contexts/SettingsContext";
import * as ibgeService from "../services/ibgeService";
import api from "../services/api";

type Tab = "appearance" | "user" | "company" | "financial" | "operational" | "notifications" | "security" | "advanced";

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
  const { preferences, tenantSettings, updatePreferences, updateTenantSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<Tab>("appearance");
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

  const handleSaveTenantSettings = async (e: React.FormEvent) => {
    e.preventDefault();
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
    { id: "appearance", label: "Aparência", icon: Palette },
    { id: "user", label: "Usuário", icon: User },
    { id: "company", label: "Minha Oficina", icon: Building2 },
    { id: "financial", label: "Financeiro", icon: DollarSign },
    { id: "operational", label: "Operacional", icon: SettingsIcon },
    { id: "notifications", label: "Notificações", icon: Bell },
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
          <h1 className="text-2xl font-bold text-white mb-1">Configurações</h1>
          <p className="text-slate-300 text-sm">
            Personalize o sistema de acordo com suas preferências
          </p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-64 bg-white border-r border-slate-200 overflow-y-auto">
          <nav className="p-4 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "appearance" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl space-y-8"
            >
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Aparência</h2>
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

          {activeTab === "user" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl space-y-8"
            >
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">
                  Preferências do Usuário
                </h2>
                <p className="text-sm text-slate-500">
                  Configure suas preferências pessoais
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
                  Filtros Salvos
                </h3>
                <p className="text-sm text-slate-500">
                  O sistema salva automaticamente seus filtros preferidos em cada tela
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === "company" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl"
            >
              <div className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-1">
                  Minha Oficina
                </h2>
                <p className="text-sm text-slate-500">
                  Dados da sua empresa (aparecem em OS, PDF, etc)
                </p>
              </div>

              <form onSubmit={handleSaveTenantSettings} className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
                    Dados Básicos
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                        Razão Social
                      </label>
                      <input
                        type="text"
                        value={tenantForm.company_name || ""}
                        onChange={(e) =>
                          setTenantForm({ ...tenantForm, company_name: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                        Nome Fantasia
                      </label>
                      <input
                        type="text"
                        value={tenantForm.trade_name || ""}
                        onChange={(e) =>
                          setTenantForm({ ...tenantForm, trade_name: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                        CNPJ
                      </label>
                      <input
                        type="text"
                        value={tenantForm.cnpj || ""}
                        onChange={(e) =>
                          setTenantForm({ ...tenantForm, cnpj: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                        Telefone
                      </label>
                      <input
                        type="text"
                        value={tenantForm.phone || ""}
                        onChange={(e) =>
                          setTenantForm({ ...tenantForm, phone: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                        WhatsApp
                      </label>
                      <input
                        type="text"
                        value={tenantForm.whatsapp || ""}
                        onChange={(e) =>
                          setTenantForm({ ...tenantForm, whatsapp: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={tenantForm.email || ""}
                        onChange={(e) =>
                          setTenantForm({ ...tenantForm, email: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
                    Endereço
                  </h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-4">
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                        Endereço Completo
                      </label>
                      <input
                        type="text"
                        value={tenantForm.address || ""}
                        onChange={(e) =>
                          setTenantForm({ ...tenantForm, address: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                        Estado (UF)
                      </label>
                      <select
                        value={tenantForm.state || ""}
                        onChange={(e) =>
                          setTenantForm({ ...tenantForm, state: e.target.value })
                        }
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
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                        Cidade
                      </label>
                      <select
                        value={tenantForm.city || ""}
                        onChange={(e) =>
                          setTenantForm({ ...tenantForm, city: e.target.value })
                        }
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
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                        CEP
                      </label>
                      <input
                        type="text"
                        value={tenantForm.zip_code || ""}
                        onChange={(e) =>
                          setTenantForm({ ...tenantForm, zip_code: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Texts */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
                    Textos Padrão
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                        Frase Padrão para Orçamentos
                      </label>
                      <textarea
                        rows={3}
                        value={tenantForm.default_quote_text || ""}
                        onChange={(e) =>
                          setTenantForm({
                            ...tenantForm,
                            default_quote_text: e.target.value,
                          })
                        }
                        placeholder="Ex: Orçamento válido por 7 dias..."
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                        Assinatura Digital
                      </label>
                      <textarea
                        rows={2}
                        value={tenantForm.signature || ""}
                        onChange={(e) =>
                          setTenantForm({ ...tenantForm, signature: e.target.value })
                        }
                        placeholder="Ex: Atenciosamente, Equipe..."
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-medium shadow-lg disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Salvando..." : "Salvar Configurações"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === "financial" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl"
            >
              <div className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-1">
                  Configurações Financeiras
                </h2>
                <p className="text-sm text-slate-500">
                  Defina valores padrão e regras financeiras
                </p>
              </div>

              <form onSubmit={handleSaveTenantSettings} className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
                    Pagamentos
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                        Dias Padrão de Vencimento
                      </label>
                      <input
                        type="number"
                        value={tenantForm.default_due_days || 30}
                        onChange={(e) =>
                          setTenantForm({
                            ...tenantForm,
                            default_due_days: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                        Parcelamento Máximo
                      </label>
                      <input
                        type="number"
                        value={tenantForm.max_installments || 12}
                        onChange={(e) =>
                          setTenantForm({
                            ...tenantForm,
                            max_installments: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                        Condições de Pagamento Padrão
                      </label>
                      <input
                        type="text"
                        value={tenantForm.default_payment_terms || ""}
                        onChange={(e) =>
                          setTenantForm({
                            ...tenantForm,
                            default_payment_terms: e.target.value,
                          })
                        }
                        placeholder="Ex: 30/60 dias, À vista, etc"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                        Taxa Cartão (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={tenantForm.card_fee_percentage || 0}
                        onChange={(e) =>
                          setTenantForm({
                            ...tenantForm,
                            card_fee_percentage: parseFloat(e.target.value),
                          })
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                        Chave PIX
                      </label>
                      <input
                        type="text"
                        value={tenantForm.pix_key || ""}
                        onChange={(e) =>
                          setTenantForm({ ...tenantForm, pix_key: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
                    Multas e Juros
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                        Juros por Atraso (% ao mês)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={tenantForm.late_fee_percentage || 0}
                        onChange={(e) =>
                          setTenantForm({
                            ...tenantForm,
                            late_fee_percentage: parseFloat(e.target.value),
                          })
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                        Multa Fixa (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={tenantForm.fixed_penalty || 0}
                        onChange={(e) =>
                          setTenantForm({
                            ...tenantForm,
                            fixed_penalty: parseFloat(e.target.value),
                          })
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-medium shadow-lg disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Salvando..." : "Salvar Configurações"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === "operational" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl"
            >
              <div className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-1">
                  Configurações Operacionais
                </h2>
                <p className="text-sm text-slate-500">
                  Defina regras de operação da oficina
                </p>
              </div>

              <form onSubmit={handleSaveTenantSettings} className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
                    Ordens de Serviço
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                        Dias de Garantia Padrão
                      </label>
                      <input
                        type="number"
                        value={tenantForm.default_warranty_days || 90}
                        onChange={(e) =>
                          setTenantForm({
                            ...tenantForm,
                            default_warranty_days: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-medium shadow-lg disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Salvando..." : "Salvar Configurações"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === "notifications" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl"
            >
              <div className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-1">Notificações</h2>
                <p className="text-sm text-slate-500">
                  Configure alertas e lembretes automáticos
                </p>
              </div>

              <form onSubmit={handleSaveTenantSettings} className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
                    Alertas
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-900">
                          Alertar Estoque Baixo
                        </div>
                        <div className="text-sm text-slate-500">
                          Notificar quando peças atingirem estoque mínimo
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={tenantForm.alert_stock_low || false}
                        onChange={(e) =>
                          setTenantForm({
                            ...tenantForm,
                            alert_stock_low: e.target.checked,
                          })
                        }
                        className="w-5 h-5 text-slate-600 rounded focus:ring-slate-500"
                      />
                    </label>

                    <label className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-900">
                          Alertar Clientes Inadimplentes
                        </div>
                        <div className="text-sm text-slate-500">
                          Exibir avisos sobre clientes com contas em atraso
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={tenantForm.alert_overdue_clients || false}
                        onChange={(e) =>
                          setTenantForm({
                            ...tenantForm,
                            alert_overdue_clients: e.target.checked,
                          })
                        }
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
                        onChange={(e) =>
                          setTenantForm({
                            ...tenantForm,
                            alert_os_stopped_days: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-medium shadow-lg disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Salvando..." : "Salvar Configurações"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === "security" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl"
            >
              <div className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-1">Segurança</h2>
                <p className="text-sm text-slate-500">
                  Gerencie senha e configurações de segurança
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
                    Alterar Senha
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
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
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
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
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
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
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-medium shadow-lg disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Salvando..." : "Alterar Senha"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === "advanced" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl"
            >
              <div className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-1">Avançado</h2>
                <p className="text-sm text-slate-500">
                  Ferramentas administrativas e manutenção
                </p>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
                    Ferramentas
                  </h3>
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
                          alert("Filtros resetados!");
                        }
                      }}
                      className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-left text-sm font-medium text-slate-700 transition-colors"
                    >
                      Resetar Filtros Salvos
                    </button>

                    <button
                      type="button"
                      onClick={() => alert("Funcionalidade em desenvolvimento")}
                      className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-left text-sm font-medium text-slate-700 transition-colors"
                    >
                      Limpar Cache
                    </button>

                    <button
                      type="button"
                      onClick={() => alert("Funcionalidade em desenvolvimento")}
                      className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-left text-sm font-medium text-slate-700 transition-colors"
                    >
                      Ver Logs do Sistema
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
