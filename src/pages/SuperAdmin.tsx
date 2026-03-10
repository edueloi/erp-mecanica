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
  Menu,
  Eye,
  EyeOff,
  Lock,
  FileText,
  BookOpen,
  User as UserIcon,
  Fingerprint,
  Key,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  PieChart as PieChartIcon
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useRef } from "react";
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

type AdminTab = 'dashboard' | 'workshops' | 'plans' | 'profile' | 'team' | 'permissions';

export default function SuperAdmin() {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  
  const activeTab = tab || 'dashboard';

  const [tenants, setTenants] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [permissionProfiles, setPermissionProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any | null>(null);
  const [editingProfile, setEditingProfile] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; tenant: any | null }>({ isOpen: false, tenant: null });
  const [usersModal, setUsersModal] = useState<{ isOpen: boolean; tenant: any | null }>({ isOpen: false, tenant: null });
  const [historyDrawer, setHistoryDrawer] = useState<{ isOpen: boolean; tenant: any | null; logs: any[] }>({ isOpen: false, tenant: null, logs: [] });
  const [activationModal, setActivationModal] = useState<{ isOpen: boolean; tenant: any | null; payment_method: string; payment_date: string }>({ 
    isOpen: false, tenant: null, payment_method: 'PIX', payment_date: new Date().toISOString().split('T')[0] 
  });
  const [deleteTeamConfig, setDeleteTeamConfig] = useState<{ isOpen: boolean; member: any | null }>({ isOpen: false, member: null });
  const [deleteProfileConfig, setDeleteProfileConfig] = useState<{ isOpen: boolean; profile: any | null }>({ isOpen: false, profile: null });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showTeamPassword, setShowTeamPassword] = useState(false);
  const [editingMember, setEditingMember] = useState<any | null>(null);

  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);
  const setUser = useAuthStore(state => state.setUser);
  const isVendedor = user?.role === 'VENDEDOR';
  const isMasterRoot = user?.email === 'admin@mecaerp.com.br';

  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    surname: user?.surname || "",
    email: user?.email || "",
    phone: user?.phone || "",
    cpf: user?.cpf || "",
    profession: user?.profession || "",
    biography: user?.biography || "",
    education: user?.education || "",
    photo_url: user?.photo_url || "",
    password: ""
  });

  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const [showProfilePassword, setShowProfilePassword] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        surname: user.surname || "",
        email: user.email || "",
        phone: user.phone || "",
        cpf: user.cpf || "",
        profession: user.profession || "",
        biography: user.biography || "",
        education: user.education || "",
        photo_url: user.photo_url || "",
        password: ""
      });
    }
  }, [user]);

  const handleProfilePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Logic: Replace old photo by just setting the new state. 
        // Backend handles storage if it's base64 or just replaces the record.
        setProfileForm({ ...profileForm, photo_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isMasterRoot) {
      showToast("Este acesso é restrito e não pode ser alterado por aqui.", "error");
      return;
    }
    setSaving(true);
    try {
      // Create a copy without empty password
      const dataToSave = { ...profileForm };
      if (!dataToSave.password) delete (dataToSave as any).password;

      await api.patch(`/users/${user?.id}`, dataToSave);
      
      // Update local store
      const updatedUser = { ...user, ...dataToSave } as any;
      delete updatedUser.password;
      setUser(updatedUser);
      
      showToast("Perfil atualizado com sucesso!");
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Erro ao atualizar perfil", "error");
    } finally {
      setSaving(false);
    }
  };

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
    name: "", email: "", password: "", role: "VENDEDOR", phone: "", cpf: "", profession: "", permission_profile_id: "", photo_url: ""
  });

  const [permissionsForm, setPermissionsForm] = useState({
    name: "",
    description: "",
    permissions: {
        ver_dashboard: true,
        ver_clientes: false,
        gerenciar_clientes: false,
        ver_veiculos: false,
        gerenciar_veiculos: false,
        ver_os: false,
        gerenciar_os: false,
        ver_financeiro: false,
        gerenciar_financeiro: false,
        ver_estoque: false,
        gerenciar_estoque: false,
        ver_equipe: false,
        gerenciar_equipe: false,
        ver_configuracoes: false,
        gerenciar_configuracoes: false,
        ver_relatorios: false
    }
  });

  const PERMISSION_LABELS: Record<string, string> = {
    ver_dashboard: "Ver Dashboard",
    ver_clientes: "Ver Clientes",
    gerenciar_clientes: "Gerenciar Clientes",
    ver_veiculos: "Ver Veículos",
    gerenciar_veiculos: "Gerenciar Veículos",
    ver_os: "Ver Ordens de Serviço",
    gerenciar_os: "Gerenciar OS",
    ver_financeiro: "Ver Financeiro",
    gerenciar_financeiro: "Gerenciar Financeiro",
    ver_estoque: "Ver Estoque",
    gerenciar_estoque: "Gerenciar Estoque",
    ver_equipe: "Ver Equipe",
    gerenciar_equipe: "Gerenciar Equipe",
    ver_configuracoes: "Ver Configurações",
    gerenciar_configuracoes: "Gerenciar Configurações",
    ver_relatorios: "Ver Relatórios"
  };

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
        const [teamRes, profilesRes] = await Promise.all([
          api.get("/superadmin/team"),
          api.get("/superadmin/permission-profiles")
        ]);
        setTeam(Array.isArray(teamRes.data) ? teamRes.data : []);
        setPermissionProfiles(Array.isArray(profilesRes.data) ? profilesRes.data : []);
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
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const totalMRR = tenants.reduce((acc, t) => acc + (t.subscription_value || 0), 0);
    const myEarnings = isVendedor ? totalMRR * 0.30 : 0;
    const activeTenantsCount = tenants.filter(t => t.status === 'ACTIVE').length;
    const totalUsers = tenants.reduce((acc, t) => acc + (t.user_count || 0), 0);
    const overdueCount = tenants.filter(t => t.status === 'OVERDUE' || t.status === 'BLOCKED').length;
    const ticketMedio = tenants.length > 0 ? totalMRR / tenants.length : 0;

    // Monthly Data for Chart (Last 6 Months)
    const monthlyData = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(now.getMonth() - (5 - i));
      const m = d.getMonth();
      const y = d.getFullYear();
      const name = d.toLocaleString('pt-BR', { month: 'short' }).toUpperCase();
      
      const monTenants = tenants.filter(t => {
        const cd = new Date(t.created_at);
        return cd.getMonth() === m && cd.getFullYear() === y;
      });

      const revenue = tenants.filter(t => {
          const cd = new Date(t.created_at);
          // Simple logic: if created before or during this month, adds to revenue
          // Real logic would check payment history, but for dashboard demo we use created_at cumulative
          return cd.getTime() <= d.getTime() && t.status === 'ACTIVE';
      }).reduce((acc, t) => acc + (t.subscription_value || 0), 0);

      return { name, revenue, clients: monTenants.length };
    });

    // Growth Comparison (Month over Month)
    const prevMonthRevenue = monthlyData[4]?.revenue || 0;
    const revenueGrowth = prevMonthRevenue > 0 ? ((totalMRR - prevMonthRevenue) / prevMonthRevenue) * 100 : 12.5;

    const planStats = plans.map(p => {
      const count = tenants.filter(t => t.plan_id === p.id).length;
      const revenue = tenants.filter(t => t.plan_id === p.id).reduce((acc, t) => acc + (t.subscription_value || 0), 0);
      const percentage = tenants.length > 0 ? (count / tenants.length) * 100 : 0;
      return { name: p.name, value: count, revenue, percentage: Math.round(percentage) };
    }).sort((a, b) => b.value - a.value);

    const statusDistribution = [
        { name: 'Ativos', value: activeTenantsCount, color: '#10b981' },
        { name: 'Atrasados', value: overdueCount, color: '#f43f5e' },
        { name: 'Testes', value: tenants.filter(t => t.status === 'TRIAL').length, color: '#3b82f6' }
    ].filter(s => s.value > 0);

    return { totalMRR, myEarnings, activeTenantsCount, totalUsers, overdueCount, ticketMedio, planStats, monthlyData, revenueGrowth, statusDistribution };
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

  const handlePermissionsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingProfile) {
        await api.patch(`/superadmin/permission-profiles/${editingProfile.id}`, permissionsForm);
        showToast("Perfil atualizado");
      } else {
        await api.post("/superadmin/permission-profiles", permissionsForm);
        showToast("Perfil criado");
      }
      setShowPermissionsModal(false);
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Erro ao salvar perfil", "error");
    } finally {
      setSaving(false);
    }
  };

  const deletePermissionProfile = async () => {
    if (!deleteProfileConfig.profile) return;
    setSaving(true);
    try {
      await api.delete(`/superadmin/permission-profiles/${deleteProfileConfig.profile.id}`);
      showToast("Perfil removido");
      setDeleteProfileConfig({ isOpen: false, profile: null });
      loadData();
    } catch (err) {
      showToast("Erro ao remover", "error");
    } finally {
      setSaving(false);
    }
  };


  const handleEditTeamMember = (member: any) => {
    setEditingMember(member);
    setTeamForm({
      name: member.name,
      email: member.email,
      password: "", // Deixa vazio para não trocar se não quiser
      role: member.role,
      phone: member.phone || "",
      cpf: member.cpf || "",
      profession: member.profession || "",
      permission_profile_id: member.permission_profile_id || "",
      photo_url: member.photo_url || ""
    });
    setShowTeamModal(true);
  };

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const selectedProfile = permissionProfiles.find(p => p.id === teamForm.permission_profile_id);
      const permissions = selectedProfile ? selectedProfile.permissions : (teamForm.role === 'SUPER_ADMIN' ? {
          ver_dashboard: true, ver_clientes: true, gerenciar_clientes: true, ver_veiculos: true, gerenciar_veiculos: true, ver_os: true, gerenciar_os: true, ver_financeiro: true, gerenciar_financeiro: true, ver_estoque: true, gerenciar_estoque: true, ver_equipe: true, gerenciar_equipe: true, ver_configuracoes: true, gerenciar_configuracoes: true, ver_relatorios: true
      } : {});

      const finalData = { ...teamForm, permissions };
      if (!finalData.password) delete (finalData as any).password;

      if (editingMember) {
        await api.patch(`/superadmin/team/${editingMember.id}`, finalData);
        showToast("Membro atualizado!");
      } else {
        await api.post("/superadmin/team", finalData);
        showToast("Membro adicionado!");
      }

      setShowTeamModal(false);
      setEditingMember(null);
      setTeamForm({ name: "", email: "", password: "", role: "VENDEDOR", phone: "", cpf: "", profession: "", permission_profile_id: "", photo_url: "" });
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Erro ao salvar", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteTeamMember = async () => {
    if (!deleteTeamConfig.member) return;
    setSaving(true);
    try {
      await api.delete(`/superadmin/team/${deleteTeamConfig.member.id}`);
      showToast("Membro removido");
      setDeleteTeamConfig({ isOpen: false, member: null });
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Erro ao remover", "error");
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


  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.admin_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'workshops', label: isVendedor ? 'Minha Carteira' : 'Parceiros', icon: Building2 },
    !isVendedor && { id: 'team', label: 'Equipe', icon: Briefcase },
    !isVendedor && { id: 'permissions', label: 'Permissões', icon: Fingerprint },
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
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shrink-0 overflow-hidden border-2 border-white/10", isVendedor ? "bg-blue-500" : "bg-emerald-500")}>
              {user?.photo_url ? (
                <img src={user.photo_url} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                isVendedor ? <TrendingUp className="text-white" size={22} /> : <Shield className="text-white" size={22} />
              )}
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
           <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center">
                 {user?.photo_url ? (
                    <img src={user.photo_url} alt={user.name} className="w-full h-full object-cover" />
                 ) : (
                    <UserCircle size={20} className="text-slate-500" />
                 )}
              </div>
              <div className="overflow-hidden">
                 <p className="text-[10px] font-black text-white uppercase truncate">{user?.name}</p>
                 <p className="text-[8px] font-bold text-slate-500 truncate">{user?.email}</p>
              </div>
           </div>
          <button onClick={() => { logout(); navigate('/login'); }} className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-bold text-xs uppercase tracking-widest"><LogOut size={18} /><span>Sair</span></button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] overflow-hidden relative w-full">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shrink-0 relative z-20">
          <div className="flex items-center gap-3 overflow-hidden">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-all shrink-0">
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">
              <span className={cn("italic font-black hidden sm:inline", isVendedor ? "text-blue-600" : "text-emerald-600")}>{isVendedor ? 'Sales' : 'Root'}</span>
              <ChevronRight size={10} className="hidden sm:inline" /><span className="text-slate-900 truncate">{activeTab}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-900 uppercase italic leading-none">{user?.name} {user?.surname}</span>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">{user?.role}</span>
             </div>
             <button 
                onClick={() => navigate('/superadmin/profile')}
                className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm hover:border-emerald-500 transition-all"
             >
                {user?.photo_url ? (
                   <img src={user.photo_url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                   <UserCircle className="text-slate-300" size={24} />
                )}
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6 pb-20">
            {activeTab === 'dashboard' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {/* Header Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {[
                    { label: 'Receita Mensal (MRR)', value: `R$ ${stats.totalMRR.toLocaleString('pt-BR')}`, sub: `${stats.revenueGrowth >= 0 ? '+' : ''}${stats.revenueGrowth.toFixed(1)}% vs mês ant.`, icon: DollarSign, color: 'emerald', trend: stats.revenueGrowth >= 0 ? 'up' : 'down' },
                    { label: 'Workshops Ativos', value: stats.activeTenantsCount, sub: `${tenants.length} total cadastrados`, icon: Building2, color: 'blue', trend: 'up' },
                    { label: 'Usuários Totais', value: stats.totalUsers.toLocaleString(), sub: 'Em todas as unidades', icon: Users, color: 'orange', trend: 'up' },
                    { label: 'Ticket Médio', value: `R$ ${stats.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, sub: 'Por unidade / mês', icon: Target, color: 'purple', trend: 'neutral' },
                  ].map((stat, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-5 sm:p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", 
                            stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 
                            stat.color === 'blue' ? 'bg-blue-50 text-blue-600' : 
                            stat.color === 'orange' ? 'bg-orange-50 text-orange-600' : 
                            'bg-purple-50 text-purple-600'
                        )}>
                          <stat.icon size={24} />
                        </div>
                        <div className={cn("flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter", 
                            stat.trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 
                            stat.trend === 'down' ? 'bg-red-50 text-red-600' : 
                            'bg-slate-50 text-slate-400'
                        )}>
                            {stat.trend === 'up' ? <ArrowUpRight size={12} /> : stat.trend === 'down' ? <ArrowDownRight size={12} /> : null}
                            {stat.trend !== 'neutral' ? stat.sub.split(' ')[0] : '---'}
                        </div>
                      </div>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-1">{stat.label}</p>
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
                      <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase flex items-center gap-1 group-hover:text-slate-600 transition-colors">
                          <Activity size={10} /> {stat.sub}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* Main Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Revenue Chart */}
                  <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="font-black text-slate-900 uppercase italic flex items-center gap-2">
                                <TrendingUp className="text-emerald-500" size={20} /> Evolução de Receita
                            </h3>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Crescimento Mensal nos últimos 6 meses</p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase">
                            <span className="px-3 py-1 bg-slate-100 rounded-lg text-slate-500">6 Meses</span>
                        </div>
                    </div>
                    <div className="h-[200px] sm:h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.monthlyData}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} tickFormatter={(v) => `R$ ${v}`} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                    itemStyle={{ fontWeight: 900, fontSize: '10px', textTransform: 'uppercase' }}
                                    labelStyle={{ fontWeight: 900, fontSize: '11px', marginBottom: '8px', color: '#0f172a' }}
                                />
                                <Area type="monotone" dataKey="revenue" name="Receita" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Distribution Chart (Pie) */}
                  <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
                    <h3 className="font-black text-slate-900 uppercase italic flex items-center gap-2 mb-2">
                        <PieChartIcon className="text-blue-500" size={20} /> Status de Oficinas
                    </h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">Distribuição de base ativa</p>
                    <div className="flex-1 min-h-[180px] sm:min-h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.statusDistribution}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {stats.statusDistribution.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', padding: '12px' }}
                                    itemStyle={{ fontWeight: 900, fontSize: '10px', textTransform: 'uppercase' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-3 mt-4">
                        {stats.statusDistribution.map((s, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                                    <span className="text-[10px] font-black text-slate-500 uppercase">{s.name}</span>
                                </div>
                                <span className="text-xs font-black text-slate-900">{s.value}</span>
                            </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Plans & Distribution Table */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
                     <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-black text-slate-900 uppercase italic flex items-center gap-2">
                                <Package className="text-orange-500" size={20} /> Performance por Plano
                            </h3>
                            <button className="text-[10px] font-black text-blue-600 uppercase hover:underline">Ver Detalhes</button>
                        </div>
                        <div className="space-y-4">
                            {stats.planStats.map((p: any, i: number) => (
                                <div key={i} className="group p-4 bg-slate-50 rounded-2xl border border-slate-100/50 hover:bg-slate-100 transition-all">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-black text-slate-900 uppercase">{p.name}</span>
                                        <span className="text-[10px] font-black text-slate-400">{p.percentage}% da base</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
                                        <motion.div 
                                            initial={{ width: 0 }} 
                                            animate={{ width: `${p.percentage}%` }}
                                            transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                                            className="h-full bg-orange-500 rounded-full shadow-sm"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <p className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1"><Users size={10} /> {p.value} Oficinas</p>
                                            <p className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1"><DollarSign size={10} /> R$ {p.revenue.toLocaleString('pt-BR')}</p>
                                        </div>
                                        <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                            <ArrowUpRight size={12} className="text-slate-400" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>

                     <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-black p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[300px]">
                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-6 border border-white/10 shadow-xl">
                                <TrendingUp className="text-emerald-400" size={30} />
                            </div>
                            <h3 className="text-3xl font-black text-white italic tracking-tight uppercase">Dashboard<br/>Analítico MecaERP</h3>
                            <p className="text-xs text-slate-400 font-bold mt-4 uppercase tracking-[0.2em] leading-relaxed">Sua plataforma centralizada de inteligência para gestão de parceiros e escala comercial.</p>
                        </div>
                        <div className="flex gap-4 mt-8 relative z-10">
                            <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 flex-1">
                                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Total Movimentado</p>
                                <p className="text-xl font-black text-emerald-400 italic">R$ {(stats.totalMRR * 12).toLocaleString('pt-BR')}</p>
                                <p className="text-[8px] font-black text-slate-600 uppercase mt-0.5">Ano Corrente</p>
                            </div>
                            <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 flex-1">
                                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Projeção 30d</p>
                                <p className="text-xl font-black text-blue-400 italic">+{stats.revenueGrowth.toFixed(1)}%</p>
                                <p className="text-[8px] font-black text-slate-600 uppercase mt-0.5">Estabilidade</p>
                            </div>
                        </div>
                        <Activity className="absolute -right-20 -top-20 text-white/5 w-[400px] h-[400px] rotate-12" />
                     </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'workshops' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase italic">Gestão de Parceiros</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Total de {filteredTenants.length} oficinas cadastradas</p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="text"
                        placeholder="Buscar parceiro..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-10 pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <button onClick={() => { setEditingTenant(null); setShowModal(true); }} className="h-10 px-4 sm:px-6 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shrink-0">
                      <Plus size={16} /> <span className="hidden sm:inline">Novo</span>
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredTenants.map((t) => (
                    <div key={t.id} className="bg-white p-5 sm:p-6 rounded-[2rem] border border-slate-200 shadow-sm relative group hover:border-emerald-200 transition-all flex flex-col h-full">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 shadow-inner overflow-hidden">
                            {t.logo_url ? <img src={t.logo_url} className="w-full h-full object-cover" /> : <Building2 className="text-slate-300" size={24} />}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-black text-slate-900 text-sm leading-tight truncate uppercase italic">{t.name}</h4>
                            <div className="flex items-center gap-1.5 mt-1">
                                <Package size={10} className="text-emerald-500" />
                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{t.plan_name || 'Personalizado'}</p>
                            </div>
                          </div>
                        </div>
                        <select 
                            value={t.status || 'ACTIVE'} 
                            onChange={(e) => handleStatusChange(t, e.target.value)} 
                            className={cn(
                                "h-7 px-3 rounded-xl text-[9px] font-black uppercase border transition-all cursor-pointer outline-none", 
                                STATUS_CONFIG[t.status || 'ACTIVE']?.bg || 'bg-slate-50', 
                                STATUS_CONFIG[t.status || 'ACTIVE']?.color || 'text-slate-600',
                                STATUS_CONFIG[t.status || 'ACTIVE']?.border || 'border-slate-100'
                            )}
                        >
                          {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (<option key={val} value={val}>{cfg.label}</option>))}
                        </select>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                            <div className="flex items-center gap-2">
                                <Calendar size={12} className="text-slate-400" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Início</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-700">{new Date(t.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-emerald-50/30 rounded-2xl border border-emerald-100/30">
                            <div className="flex items-center gap-2">
                                <Clock size={12} className="text-emerald-500" />
                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Vencimento</span>
                            </div>
                            <span className="text-[10px] font-black text-emerald-700">{calculateExpirationDate(t.last_payment_date, t.plan_duration)}</span>
                        </div>
                      </div>

                      <div className="mt-auto grid grid-cols-4 gap-2">
                        <button onClick={() => loadTenantLogs(t)} title="Histórico" className="h-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-100 border border-slate-100 transition-all"><History size={16} /></button>
                        <button onClick={() => setUsersModal({ isOpen: true, tenant: t })} title="Usuários" className="h-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-100 border border-slate-100 transition-all"><Users size={16} /></button>
                        <button onClick={() => { setEditingTenant(t); setShowModal(true); }} className="col-span-1 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-emerald-600 transition-all shadow-lg shadow-slate-900/10"><Edit2 size={14} /></button>
                        <button onClick={() => setDeleteModal({ isOpen: true, tenant: t })} title="Excluir" className="h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-100 border border-red-100 transition-all"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'team' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 mb-2 italic uppercase tracking-tight">
                      👥 Equipe Interna
                    </h2>
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {team.slice(0, 5).map((m, i) => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm">
                            {m.photo_url ? (
                              <img src={m.photo_url} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-400">
                                {m.name.charAt(0)}
                              </div>
                            )}
                          </div>
                        ))}
                        {team.length > 5 && (
                          <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                            +{team.length - 5}
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-500">
                        Gerencie sua equipe comercial e administrativa. <span className="font-bold text-slate-900">{team.length}</span> membros ativos.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingMember(null);
                      setTeamForm({ name: "", email: "", password: "", role: "VENDEDOR", phone: "", cpf: "", profession: "", permission_profile_id: "", photo_url: "" });
                      setShowTeamModal(true);
                    }}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                  >
                    <Plus className="w-5 h-5" />
                    Novo Integrante
                  </button>
                </div>

                {/* Stats Row for Team */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Total Equipe", count: team.length, color: "slate", icon: Users },
                    { label: "Administradores", count: team.filter(m => m.role === 'SUPER_ADMIN').length, color: "emerald", icon: Shield },
                    { label: "Vendedores", count: team.filter(m => m.role === 'VENDEDOR').length, color: "blue", icon: TrendingUp },
                    { label: "Perfis Ativos", count: permissionProfiles.length, color: "amber", icon: Key },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner", `bg-${stat.color}-50 text-${stat.color}-600`)}>
                        <stat.icon size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                        <p className="text-xl font-black text-slate-900 italic tracking-tight">{stat.count}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {team.length === 0 ? (
                  <div className="bg-white p-24 rounded-[3rem] border border-dashed border-slate-300 text-center space-y-6">
                    <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
                      <Briefcase size={40} className="text-slate-300" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 italic uppercase">Sua equipe ainda não foi montada</h3>
                      <p className="text-slate-500 max-w-sm mx-auto mt-2 font-medium">Comece adicionando novos membros para ajudar na expansão do MecaERP.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {team.map((m) => (
                      <motion.div 
                        layout
                        key={m.id} 
                        className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm relative group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 flex flex-col overflow-hidden"
                      >
                        {/* Member Card Header with Action Buttons */}
                        <div className="absolute top-0 right-0 p-6 z-10 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                            {(isMasterRoot || (user?.permissions?.gerenciar_equipe && m.role !== 'SUPER_ADMIN' && m.email !== 'admin@mecaerp.com.br')) && m.email !== user?.email && (
                                <>
                                    <button 
                                        onClick={() => handleEditTeamMember(m)} 
                                        className="w-10 h-10 rounded-2xl bg-white shadow-xl text-slate-400 hover:text-blue-600 flex items-center justify-center transition-all border border-slate-100 active:scale-90"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button 
                                        onClick={() => setDeleteTeamConfig({ isOpen: true, member: m })} 
                                        className="w-10 h-10 rounded-2xl bg-white shadow-xl text-slate-400 hover:text-red-500 flex items-center justify-center transition-all border border-slate-100 active:scale-90"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Top Decorative Element */}
                        <div className={cn("h-24 w-full relative overflow-hidden", m.role === 'SUPER_ADMIN' ? "bg-emerald-600" : "bg-blue-600")}>
                            <Activity className="absolute -right-10 -top-10 text-white/10 w-40 h-40 rotate-12" />
                            <div className="absolute bottom-4 left-8">
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border backdrop-blur-md",
                                    m.role === 'SUPER_ADMIN' ? "bg-emerald-400/20 text-emerald-100 border-emerald-400/30" : "bg-blue-400/20 text-blue-100 border-blue-400/30"
                                )}>
                                    {m.role === 'SUPER_ADMIN' ? 'Administrador' : 'Vendedor Comercial'}
                                </span>
                            </div>
                        </div>

                        <div className="px-8 pb-8 -mt-10 relative z-10 flex flex-col items-center">
                            <div className="relative mb-6">
                                <div className="w-24 h-24 rounded-[2.5rem] p-1.5 bg-white shadow-2xl relative overflow-hidden">
                                    <div className="w-full h-full rounded-[2rem] overflow-hidden bg-slate-100 flex items-center justify-center">
                                        {m.photo_url ? (
                                            <img src={m.photo_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        ) : (
                                            <div className={cn("w-full h-full flex items-center justify-center", m.role === 'SUPER_ADMIN' ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500')}>
                                                {m.role === 'SUPER_ADMIN' ? <Shield size={40} /> : <TrendingUp size={40} />}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center">
                                    <div className={cn("w-full h-full rounded-xl flex items-center justify-center", m.role === 'SUPER_ADMIN' ? 'bg-emerald-500' : 'bg-blue-500')}>
                                        <CheckCircle size={12} className="text-white" />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="text-center w-full">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic truncate">{m.name}</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{m.profession || 'Colaborador Corporativo'}</p>
                            </div>

                            <div className="w-full mt-8 space-y-3 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                                        <Mail size={14} className="text-slate-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">E-mail</p>
                                        <p className="text-xs font-bold text-slate-700 truncate">{m.email}</p>
                                    </div>
                                </div>
                                {m.phone && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                                            <Phone size={14} className="text-slate-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Contato</p>
                                            <p className="text-xs font-bold text-slate-700">{m.phone}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="w-full mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">Engajamento</p>
                                    <p className="text-[10px] font-black text-slate-600 mt-1 flex items-center gap-1.5 uppercase italic">
                                        {new Date(m.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                                <div className="flex -space-x-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-slate-400 shadow-sm"><ArrowUpRight size={12} /></div>
                                    <div className={cn("w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white shadow-sm", m.role === 'SUPER_ADMIN' ? 'bg-emerald-500' : 'bg-blue-500')}><Activity size={12} /></div>
                                </div>
                            </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'permissions' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-900 uppercase">Gestão de Permissões</h2>
                  <button onClick={() => { setEditingProfile(null); setPermissionsForm({ name: "", description: "", permissions: { ver_dashboard: true, ver_clientes: false, gerenciar_clientes: false, ver_veiculos: false, gerenciar_veiculos: false, ver_os: false, gerenciar_os: false, ver_financeiro: false, gerenciar_financeiro: false, ver_estoque: false, gerenciar_estoque: false, ver_equipe: false, gerenciar_equipe: false, ver_configuracoes: false, gerenciar_configuracoes: false, ver_relatorios: false } }); setShowPermissionsModal(true); }} className="h-10 px-6 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-lg">
                    <Plus size={16} /> Criar Perfil de Acesso
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {permissionProfiles.map((profile) => (
                        <div key={profile.id} className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-emerald-200 transition-all group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                                    <Key size={24} />
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                    <button onClick={() => { setEditingProfile(profile); setPermissionsForm({ name: profile.name, description: profile.description || "", permissions: profile.permissions }); setShowPermissionsModal(true); }} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 flex items-center justify-center"><Edit2 size={14} /></button>
                                    <button onClick={() => setDeleteProfileConfig({ isOpen: true, profile: profile })} className="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center"><Trash2 size={14} /></button>
                                </div>
                            </div>
                            <h3 className="text-sm font-black text-slate-900 uppercase truncate mb-1">{profile.name}</h3>
                            <p className="text-[10px] text-slate-500 font-bold mb-4 line-clamp-2 min-h-[30px]">{profile.description || 'Sem descrição definida'}</p>
                            
                            <div className="flex flex-wrap gap-1.5 border-t border-slate-50 pt-4">
                                {Object.entries(profile.permissions).filter(([_, val]) => val).map(([key]) => (
                                    <span key={key} className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[8px] font-black uppercase border border-emerald-100/50">
                                        {PERMISSION_LABELS[key] || key}
                                    </span>
                                ))}
                                {Object.values(profile.permissions).every(v => !v) && <span className="text-[8px] text-slate-300 italic font-bold">Nenhuma permissão ativa</span>}
                            </div>
                        </div>
                    ))}
                    {permissionProfiles.length === 0 && (
                        <div className="md:col-span-2 lg:col-span-3 bg-white p-20 rounded-3xl border border-slate-200 text-center space-y-4">
                            <Fingerprint size={48} className="mx-auto text-slate-200" />
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Crie perfis de acesso para sua equipe</p>
                        </div>
                    )}
                </div>
              </motion.div>
            )}

            {activeTab === 'plans' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase italic">Planos de Assinatura</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Configurações globais de precificação</p>
                  </div>
                  <button onClick={() => setShowPlansModal(true)} className="h-10 px-5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-md w-full sm:w-auto justify-center">
                    <Plus size={14} /> Gerenciar Planos
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {plans.map((p) => (
                    <div key={p.id} className="bg-white p-5 sm:p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all">
                      <div className="absolute top-0 right-0 p-6">
                        <div className={cn("px-3 py-1 rounded-xl text-[9px] font-black uppercase border", p.active ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100")}>
                          {p.active ? "Ativo" : "Inativo"}
                        </div>
                      </div>
                      
                      <div className="mb-8">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                            <Zap size={24} />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 uppercase italic">{p.name}</h3>
                        <p className="text-xs text-slate-500 font-bold mt-1 line-clamp-1">{p.description || "Sem descrição"}</p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                          <div className="flex items-center gap-2">
                            <Users size={16} className="text-slate-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Limite Usuários</span>
                          </div>
                          <span className="text-sm font-black text-slate-900">{p.user_limit}</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-slate-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duração Contrato</span>
                          </div>
                          <span className="text-sm font-black text-slate-900">{p.months_duration} {p.months_duration === 1 ? 'mês' : 'meses'}</span>
                        </div>
                        
                        <div className="pt-6 border-t border-slate-50 flex items-end justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Investimento</p>
                                <h4 className="text-3xl font-black text-slate-900 leading-none mt-1">
                                    <span className="text-sm">R$</span> {p.monthly_value.toLocaleString('pt-BR')}
                                </h4>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                                <ChevronRight size={20} />
                            </div>
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
                  {!isMasterRoot && (
                    <button 
                      onClick={handleProfileSubmit}
                      disabled={saving}
                      className="h-10 px-6 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center gap-2"
                    >
                      {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                  )}
                </div>
                
                {isMasterRoot ? (
                  <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
                    <Shield size={48} className="mx-auto text-emerald-500" />
                    <h3 className="text-lg font-black text-slate-900 uppercase">Acesso Master Administrador</h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto">
                      Este perfil ({user?.email}) é a conta raiz do sistema. Por segurança, seus dados são fixos e só podem ser alterados através das configurações de ambiente do servidor.
                    </p>
                    <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-[10px] text-slate-400 font-bold uppercase">Nome: {user?.name}</div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-[10px] text-slate-400 font-bold uppercase">Função: {user?.role}</div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div className="lg:col-span-1 space-y-4 sm:space-y-6">
                      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
                        <div className="relative inline-block mb-4">
                          <div className="w-32 h-32 rounded-[2.5rem] bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                            {profileForm.photo_url ? (
                              <img src={profileForm.photo_url} alt={user?.name} className="w-full h-full object-cover" />
                            ) : (
                              <UserCircle className="text-slate-300" size={64} />
                            )}
                          </div>
                          <button 
                            type="button"
                            onClick={() => profileFileInputRef.current?.click()}
                            className="absolute -bottom-2 -right-2 w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-emerald-600 transition-all border-4 border-white"
                          >
                            <Plus size={18} />
                          </button>
                          <input 
                            ref={profileFileInputRef}
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleProfilePhotoUpload} 
                          />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 uppercase leading-tight">{profileForm.name} {profileForm.surname}</h3>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">{profileForm.profession || user?.role}</p>
                        
                        <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-center gap-6">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase">Sistema</p>
                                <p className="text-xs font-bold text-slate-700">{user?.role}</p>
                            </div>
                            <div className="w-px h-8 bg-slate-100" />
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase">Cargo</p>
                                <p className="text-xs font-bold text-slate-700 truncate max-w-[100px]">{profileForm.profession || '---'}</p>
                            </div>
                        </div>
                      </div>
                      
                      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Lock size={12} className="text-blue-500" /> Segurança
                        </h4>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nova Senha</label>
                            <div className="relative">
                                <input 
                                    type={showProfilePassword ? "text" : "password"} 
                                    placeholder="Deixe vazio para manter"
                                    value={profileForm.password}
                                    onChange={(e) => setProfileForm({...profileForm, password: e.target.value})}
                                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 pr-10 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" 
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowProfilePassword(!showProfilePassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showProfilePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
                        <div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                                <UserIcon size={12} className="text-emerald-500" /> Identidade & Bio
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nome</label>
                                    <input 
                                        value={profileForm.name} 
                                        onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" 
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Sobrenome</label>
                                    <input 
                                        value={profileForm.surname} 
                                        onChange={(e) => setProfileForm({...profileForm, surname: e.target.value})}
                                        placeholder="Seu sobrenome"
                                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" 
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Biografia / Resumo Profissional</label>
                                    <textarea 
                                        rows={3}
                                        value={profileForm.biography} 
                                        onChange={(e) => setProfileForm({...profileForm, biography: e.target.value})}
                                        placeholder="Conte um pouco sobre você..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none" 
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                                <Briefcase size={12} className="text-blue-500" /> Atuação & Carreira
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Cargo no Sistema</label>
                                    <select 
                                        value={profileForm.profession} 
                                        onChange={(e) => setProfileForm({...profileForm, profession: e.target.value})}
                                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all appearance-none" 
                                    >
                                        <option value="">Selecione sua função</option>
                                        <option value="Vendedor Externo">Vendedor Externo</option>
                                        <option value="Vendedor Interno">Vendedor Interno</option>
                                        <option value="Consultor de Vendas">Consultor de Vendas</option>
                                        <option value="Marketing">Marketing</option>
                                        <option value="Engenheiro de Software">Engenheiro de Software</option>
                                        <option value="Analista de Sistema">Analista de Sistema</option>
                                        <option value="Gerente de Projetos">Gerente de Projetos</option>
                                        <option value="Gerente de Tecnologia">Gerente de Tecnologia</option>
                                        <option value="Arquiteto de Dados">Arquiteto de Dados</option>
                                        <option value="Engenheiro de Dados">Engenheiro de Dados</option>
                                        <option value="Produtor">Produtor</option>
                                        <option value="Outros / Tecnologia">Outros / Tecnologia</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Escolaridade</label>
                                    <input 
                                        value={profileForm.education} 
                                        onChange={(e) => setProfileForm({...profileForm, education: e.target.value})}
                                        placeholder="Ex: Graduação em TI"
                                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" 
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                                <Mail size={12} className="text-purple-500" /> Contato Corporativo
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">E-mail</label>
                                    <input 
                                        disabled
                                        value={profileForm.email} 
                                        className="w-full h-12 bg-slate-100 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-500 cursor-not-allowed" 
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Telefone</label>
                                    <input 
                                        value={profileForm.phone} 
                                        onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" 
                                    />
                                </div>
                            </div>
                        </div>
                      </div>
                    </div>
                    <div className="lg:col-span-3 mt-8 flex justify-end">
                      <button 
                        type="submit"
                        disabled={saving}
                        className="w-full sm:w-auto h-14 px-10 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                      >
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                      </button>
                    </div>
                  </form>
                )}
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
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden relative">
                <div className="bg-slate-900 p-6 sm:p-8 text-white relative flex items-center justify-between overflow-hidden">
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="relative group">
                        <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden">
                            {teamForm.photo_url ? (
                                <img src={teamForm.photo_url} className="w-full h-full object-cover" />
                            ) : (
                                <UserCircle size={32} className="text-white/40" />
                            )}
                        </div>
                        <button 
                            type="button"
                            onClick={() => (document.getElementById('team_photo_input') as HTMLInputElement)?.click()}
                            className="absolute -bottom-1 -right-1 w-6 h-6 bg-white text-slate-900 rounded-lg flex items-center justify-center shadow-lg hover:bg-emerald-500 hover:text-white transition-all"
                        >
                            <Edit2 size={12} />
                        </button>
                        <input 
                            id="team_photo_input"
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => setTeamForm({ ...teamForm, photo_url: reader.result as string });
                                    reader.readAsDataURL(file);
                                }
                            }}
                        />
                    </div>
                    <div>
                        <h3 className="font-black uppercase tracking-[0.2em] text-[8px] sm:text-xs opacity-70 mb-1">Gerenciar Acessos</h3>
                        <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight">{editingMember ? 'Editar Colaborador' : 'Novo Colaborador'}</h2>
                    </div>
                  </div>
                  <button onClick={() => setShowTeamModal(false)} className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all group relative z-10"><X size={20} className="group-hover:rotate-90 transition-all duration-300" /></button>
                  <Briefcase size={120} className="absolute -right-10 -bottom-10 text-white/5 rotate-12" />
                </div>
                
                <form onSubmit={handleTeamSubmit} className="p-6 sm:p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Identificação</label>
                      <input 
                        required 
                        placeholder="Nome Completo" 
                        value={teamForm.name} 
                        onChange={e=>setTeamForm({...teamForm, name: e.target.value})} 
                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all" 
                      />
                    </div>
                       <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Nível de Acesso</label>
                    <select 
                      value={teamForm.role} 
                      onChange={e=>setTeamForm({...teamForm, role: e.target.value})} 
                      className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all appearance-none"
                    >
                      <option value="VENDEDOR">Vendedor Comercial</option>
                      <option value="SUPER_ADMIN">Administrador Global</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Perfil de Permissões</label>
                    <select 
                      value={teamForm.permission_profile_id} 
                      onChange={e=>setTeamForm({...teamForm, permission_profile_id: e.target.value})} 
                      className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all appearance-none"
                    >
                      <option value="">Acesso Padrão</option>
                      {permissionProfiles.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Cargo / Função Especializada</label>
                    <select 
                        value={teamForm.profession} 
                        onChange={(e) => setTeamForm({...teamForm, profession: e.target.value})}
                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all appearance-none" 
                    >
                        <option value="">Selecione a função</option>
                        <option value="Vendedor Externo">Vendedor Externo</option>
                        <option value="Vendedor Interno">Vendedor Interno</option>
                        <option value="Consultor de Vendas">Consultor de Vendas</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Engenheiro de Software">Engenheiro de Software</option>
                        <option value="Analista de Sistema">Analista de Sistema</option>
                        <option value="Gerente de Projetos">Gerente de Projetos</option>
                        <option value="Gerente de Tecnologia">Gerente de Tecnologia</option>
                        <option value="Arquiteto de Dados">Arquiteto de Dados</option>
                        <option value="Engenheiro de Dados">Engenheiro de Dados</option>
                        <option value="Produtor">Produtor</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Acesso ao Sistema</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input required type="email" placeholder="E-mail Corporativo" value={teamForm.email} onChange={e=>setTeamForm({...teamForm, email: e.target.value})} className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input 
                          required 
                          type={showTeamPassword ? "text" : "password"} 
                          placeholder="Senha de Acesso" 
                          value={teamForm.password} 
                          onChange={e=>setTeamForm({...teamForm, password: e.target.value})} 
                          className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-12 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all" 
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowTeamPassword(!showTeamPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showTeamPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button type="button" onClick={() => setShowTeamModal(false)} className="flex-1 h-14 bg-slate-50 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">Cancelar</button>
                    <button type="submit" disabled={saving} className="flex-[2] h-14 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 shadow-xl shadow-slate-900/10 hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2">
                      {saving ? 'Salvando...' : <>{editingMember ? <Edit2 size={16} /> : <Shield size={16} />} {editingMember ? 'Salvar Alterações' : 'Finalizar Cadastro'}</>}
                    </button>
                  </div>
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
        <AnimatePresence>
          {showPermissionsModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden relative">
                <div className="bg-emerald-600 p-6 sm:p-8 text-white relative flex items-center justify-between">
                  <div>
                    <h3 className="font-black uppercase tracking-[0.2em] text-[10px] opacity-70 mb-1">Configurações de Segurança</h3>
                    <h2 className="text-2xl font-black uppercase tracking-tight">{editingProfile ? 'Editar Perfil' : 'Novo Perfil de Acesso'}</h2>
                  </div>
                  <button onClick={() => setShowPermissionsModal(false)} className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all group"><X size={20} /></button>
                </div>
                
                <form onSubmit={handlePermissionsSubmit} className="p-6 sm:p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nome do Perfil</label>
                      <input 
                        required 
                        placeholder="Ex: Marketing, Analista..." 
                        value={permissionsForm.name} 
                        onChange={e=>setPermissionsForm({...permissionsForm, name: e.target.value})} 
                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-sm font-bold text-slate-700" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Descrição Breve</label>
                      <input 
                        placeholder="Para que serve este perfil?" 
                        value={permissionsForm.description} 
                        onChange={e=>setPermissionsForm({...permissionsForm, description: e.target.value})} 
                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-sm font-bold text-slate-700" 
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 border-b border-slate-100 pb-2">O que este usuário poderá ver/fazer?</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(permissionsForm.permissions).map(([key, val]) => (
                            <label key={key} className={cn(
                                "flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer group",
                                val ? "bg-emerald-50 border-emerald-500 shadow-sm" : "bg-slate-50 border-slate-100 opacity-60 hover:opacity-100 hover:border-slate-200"
                            )}>
                                <div className="min-w-0">
                                    <p className={cn("text-[9px] font-black uppercase tracking-wider", val ? "text-emerald-700" : "text-slate-500")}>
                                        {PERMISSION_LABELS[key] || key}
                                    </p>
                                </div>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={val}
                                        onChange={(e) => setPermissionsForm({
                                            ...permissionsForm, 
                                            permissions: { ...permissionsForm.permissions, [key]: e.target.checked }
                                        })}
                                    />
                                    <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                                </div>
                            </label>
                        ))}
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setShowPermissionsModal(false)} className="flex-1 h-12 bg-slate-50 text-slate-500 rounded-xl font-black text-xs uppercase hover:bg-slate-100 transition-all">Cancelar</button>
                    <button type="submit" disabled={saving} className="flex-[2] h-12 bg-slate-900 text-white rounded-xl font-black text-xs uppercase hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10">
                      {saving ? 'Gravando...' : <><CheckCircle size={16} /> Salvar Perfil</>}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <SuperAdminModal isOpen={showModal} onClose={() => setShowModal(false)} editingTenant={editingTenant} form={form} setForm={setForm} onSubmit={handleSubmit} saving={saving} />
      <PricingPlansModal isOpen={showPlansModal} onClose={() => setShowPlansModal(false)} />
      <DeleteConfirmationModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, tenant: null })} onConfirm={handleDelete} title="Excluir" message="Tem certeza?" itemName={deleteModal.tenant?.name || ""} loading={saving} />
      <DeleteConfirmationModal 
        isOpen={deleteTeamConfig.isOpen} 
        onClose={() => setDeleteTeamConfig({ isOpen: false, member: null })} 
        onConfirm={deleteTeamMember} 
        title="Remover Membro" 
        message="Tem certeza que deseja remover este colaborador da equipe? Esta ação não pode ser desfeita." 
        itemName={deleteTeamConfig.member?.name || ""} 
        loading={saving} 
      />
      <DeleteConfirmationModal 
        isOpen={deleteProfileConfig.isOpen} 
        onClose={() => setDeleteProfileConfig({ isOpen: false, profile: null })} 
        onConfirm={deletePermissionProfile} 
        title="Remover Perfil" 
        message="Tem certeza que deseja remover este perfil de permissões?" 
        itemName={deleteProfileConfig.profile?.name || ""} 
        loading={saving} 
      />
      <TenantUsersModal isOpen={usersModal.isOpen} onClose={() => setUsersModal({ isOpen: false, tenant: null })} tenant={usersModal.tenant} />

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={cn(
                "fixed bottom-8 right-8 z-[500] px-6 py-4 rounded-[1.5rem] shadow-2xl flex items-center gap-3 backdrop-blur-xl border-2",
                toast.type === 'success' ? 'bg-emerald-500/90 text-white border-emerald-400/20' : 'bg-red-500/90 text-white border-red-400/20'
            )}
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-70 leading-none">Notificação</span>
                <span className="font-black text-sm uppercase italic tracking-tight">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
