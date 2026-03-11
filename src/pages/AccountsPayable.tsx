import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  DollarSign,
  Calendar,
  AlertCircle,
  TrendingUp,
  X,
  Eye,
  FileText,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  CircleDot,
  Truck,
  Wallet,
  ArrowDownCircle,
  TrendingDown,
  Download,
} from "lucide-react";
import api from "../services/api";

interface Account {
  id: string;
  supplier_name?: string;
  supplier_phone?: string;
  purchase_order_number?: string;
  purchase_order_id?: string;
  installment_number: number;
  total_installments: number;
  description: string;
  original_amount: number;
  amount_paid: number;
  balance: number;
  due_date: string;
  status: "OPEN" | "PARTIAL" | "PAID" | "OVERDUE";
  payment_method: string;
  document_number?: string;
  created_at: string;
}

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  document_number?: string;
  notes?: string;
  created_by_name: string;
  created_at: string;
}

interface Stats {
  total_payable: number;
  due_today: number;
  overdue: number;
  paid_this_month: number;
}

export default function AccountsPayable() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_payable: 0,
    due_today: 0,
    overdue: 0,
    paid_this_month: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("all");
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [showCurrentMonthOnly, setShowCurrentMonthOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [accountDetail, setAccountDetail] = useState<any>(null);

  // Form states
  const [newAccountForm, setNewAccountForm] = useState({
    supplier_id: "",
    description: "",
    original_amount: "",
    due_date: "",
    payment_method: "",
    document_number: "",
    notes: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "",
    document_number: "",
    notes: "",
    account_id: "", // Cash account ID
  });

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [cashAccounts, setCashAccounts] = useState<any[]>([]);

  useEffect(() => {
    fetchAccounts();
    fetchStats();
    fetchSuppliers();
    fetchCashAccounts();
  }, []);

  useEffect(() => {
    filterAccounts();
  }, [
    searchTerm,
    selectedStatus,
    selectedPaymentMethod,
    showOverdueOnly,
    showCurrentMonthOnly,
    accounts,
  ]);

  const fetchAccounts = async () => {
    try {
      const response = await api.get("/accounts-payable");
      setAccounts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get("/accounts-payable/stats");
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await api.get("/suppliers");
      setSuppliers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      setSuppliers([]);
    }
  };

  const fetchCashAccounts = async () => {
    try {
      const response = await api.get("/cashflow/accounts");
      setCashAccounts(Array.isArray(response.data) ? response.data : []);
      if (response.data?.length > 0) {
        setPaymentForm(prev => ({ ...prev, account_id: response.data[0].id }));
      }
    } catch (error) {
      console.error("Error fetching cash accounts:", error);
    }
  };

  const filterAccounts = () => {
    let filtered = accounts;

    if (searchTerm) {
      filtered = filtered.filter(
        (a) =>
          (a.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (a.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
          a.purchase_order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.document_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((a) => a.status === selectedStatus);
    }

    if (selectedPaymentMethod !== "all") {
      filtered = filtered.filter((a) => a.payment_method === selectedPaymentMethod);
    }

    if (showOverdueOnly) {
      filtered = filtered.filter((a) => a.status === "OVERDUE");
    }

    if (showCurrentMonthOnly) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      filtered = filtered.filter((a) => a.due_date.startsWith(currentMonth));
    }

    setFilteredAccounts(filtered);
  };

  const handleNewAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/accounts-payable", newAccountForm);
      fetchAccounts();
      fetchStats();
      closeModals();
    } catch (error) {
      console.error("Error creating account:", error);
      alert("Erro ao criar conta");
    }
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;

    try {
      await api.post(`/accounts-payable/${selectedAccount.id}/payment`, paymentForm);
      fetchAccounts();
      fetchStats();
      closeModals();
      alert("Pagamento registrado com sucesso!");
    } catch (error: any) {
      console.error("Error registering payment:", error);
      alert(error.response?.data?.error || "Erro ao registrar pagamento");
    }
  };

  const handleViewDetail = async (account: Account) => {
    try {
      const response = await api.get(`/accounts-payable/${account.id}`);
      setAccountDetail(response.data);
      setSelectedAccount(account);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Error fetching account detail:", error);
      alert("Erro ao carregar detalhes");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta conta?")) return;

    try {
      await api.delete(`/accounts-payable/${id}`);
      fetchAccounts();
      fetchStats();
    } catch (error: any) {
      alert(error.response?.data?.error || "Erro ao excluir conta");
    }
  };

  const openPaymentModal = (account: Account) => {
    setSelectedAccount(account);
    setPaymentForm({
      amount: account.balance.toString(),
      payment_date: new Date().toISOString().split("T")[0],
      payment_method: account.payment_method || "PIX",
      document_number: "",
      notes: "",
      account_id: cashAccounts[0]?.id || "",
    });
    setShowPaymentModal(true);
  };

  const closeModals = () => {
    setShowNewModal(false);
    setShowPaymentModal(false);
    setShowDetailModal(false);
    setSelectedAccount(null);
    setAccountDetail(null);
    setNewAccountForm({
      supplier_id: "",
      description: "",
      original_amount: "",
      due_date: "",
      payment_method: "",
      document_number: "",
      notes: "",
    });
  };

  const formatCurrency = (value: any) => {
    const val = typeof value === 'string' ? parseFloat(value) : Number(value);
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(isNaN(val) ? 0 : val);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString + "T12:00:00");
      return isNaN(date.getTime()) ? "-" : date.toLocaleDateString("pt-BR");
    } catch {
      return "-";
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      OPEN: { label: "Aberto", class: "bg-yellow-100 text-yellow-800", icon: CircleDot },
      PARTIAL: { label: "Parcial", class: "bg-blue-100 text-blue-800", icon: Clock },
      PAID: { label: "Pago", class: "bg-green-100 text-green-800", icon: CheckCircle },
      OVERDUE: { label: "Atrasado", class: "bg-red-100 text-red-800", icon: AlertCircle },
    };
    const badge = badges[status as keyof typeof badges] || badges.OPEN;
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.class}`}
      >
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg">
            <TrendingDown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Contas a Pagar</h1>
            <p className="text-slate-500 text-sm">
              Gestão de despesas e fornecedores
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-colors text-sm font-medium shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Nova Conta
          </button>
          <button
            onClick={() => alert("Exportar - Em desenvolvimento")}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <div className="text-sm opacity-90 mb-1">Total a Pagar</div>
          <div className="text-3xl font-bold">{formatCurrency(stats.total_payable)}</div>
          <div className="text-xs opacity-75 mt-2">Compromissos pendentes</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
          onClick={() => setSelectedStatus("OVERDUE")}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1">
            Total em Atraso
          </div>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(stats.overdue)}
          </div>
          <div className="text-xs text-slate-500 mt-2 italic">Atenção necessária</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
          onClick={() => setSelectedStatus("OPEN")}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1">
            Vence Hoje
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(stats.due_today)}
          </div>
          <div className="text-xs text-slate-500 mt-2">Pagamentos do dia</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <ArrowDownCircle className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1">
            Pago no Mês
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            {formatCurrency(stats.paid_this_month)}
          </div>
          <div className="text-xs text-slate-600 mt-2">Saídas confirmadas</div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por fornecedor, descrição, pedido ou documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all font-medium"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <option value="all">Todos Status</option>
              <option value="OPEN">Abertos</option>
              <option value="PARTIAL">Parciais</option>
              <option value="PAID">Pagos</option>
              <option value="OVERDUE">Atrasados</option>
            </select>
          </div>

          <div className="flex gap-2 border-l border-slate-200 pl-4">
            <button
              onClick={() => setShowCurrentMonthOnly(!showCurrentMonthOnly)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                showCurrentMonthOnly
                  ? "bg-slate-800 text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Calendar className="w-4 h-4" />
              Este Mês
            </button>
          </div>
        </div>
      </div>

      {/* Grid Style Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Vencimento</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Fornecedor / Origem</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Vínculo</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Descrição</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Valores</th>
                <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Status / Incluído</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAccounts.map((account, index) => (
                <motion.tr
                  key={account.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="hover:bg-slate-50/80 transition-all group"
                >
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold ${account.status === 'OVERDUE' ? 'text-red-600' : 'text-slate-900'}`}>
                        {formatDate(account.due_date)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium tracking-tight">Vencimento</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-900 leading-none mb-1">{account.supplier_name || 'Despesa Geral'}</span>
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <Truck size={10} /> {account.supplier_phone || 'Sem contato'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {account.purchase_order_number ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-colors">
                        <FileText size={12} />
                        Pedido #{account.purchase_order_number}
                        {account.total_installments > 1 && (
                          <span className="opacity-60 ml-1">({account.installment_number}/{account.total_installments})</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium italic">Lançamento Direto</span>
                    )}
                  </td>
                  <td className="px-6 py-5 min-w-[200px]">
                    <p className="text-sm text-slate-600 line-clamp-1 font-medium">{account.description}</p>
                    {account.payment_method && (
                      <span className="text-[10px] text-slate-400 font-medium tracking-tight">Via {account.payment_method}</span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-bold text-slate-900">{formatCurrency(account.original_amount)}</span>
                      {account.amount_paid > 0 && (
                        <span className="text-[10px] text-emerald-600 font-bold">Pago: {formatCurrency(account.amount_paid)}</span>
                      )}
                      <span className={`text-[10px] font-bold ${account.balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        Saldo: {formatCurrency(account.balance)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col items-center gap-1.5">
                      {getStatusBadge(account.status)}
                      <span className="text-[10px] text-slate-400 font-medium">
                        Incluído {new Date(account.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {account.status !== "PAID" && (
                        <button
                          onClick={() => openPaymentModal(account)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all shadow-sm active:scale-95"
                          title="Faturar / Pagar"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleViewDetail(account)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm active:scale-95"
                        title="Ver Vínculo"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {account.amount_paid === 0 && (
                        <button
                          onClick={() => handleDelete(account.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all shadow-sm active:scale-95"
                          title="Remover"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredAccounts.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-slate-900 font-bold">Nenhuma despesa encontrada</h3>
            <p className="text-slate-500 text-sm">Tente ajustar seus filtros de busca</p>
          </div>
        )}
      </div>

      {/* New Account Modal */}
      <AnimatePresence>
        {showNewModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
              onClick={closeModals}
            />
            <div className="fixed inset-0 flex items-center justify-center z-[100] p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden pointer-events-auto"
              >
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Nova Conta a Pagar</h2>
                  <button onClick={closeModals} className="text-white/80 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleNewAccount} className="p-6 space-y-4">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">Fornecedor (Opcional)</label>
                    <select
                      value={newAccountForm.supplier_id}
                      onChange={(e) => setNewAccountForm({ ...newAccountForm, supplier_id: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <option value="">Nenhum / Lançamento Avulso</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} {s.contact_name ? `(${s.contact_name})` : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">Descrição *</label>
                    <input
                      type="text" required
                      value={newAccountForm.description}
                      onChange={(e) => setNewAccountForm({ ...newAccountForm, description: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">Valor (R$) *</label>
                      <input
                        type="number" step="0.01" required
                        value={newAccountForm.original_amount}
                        onChange={(e) => setNewAccountForm({ ...newAccountForm, original_amount: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">Vencimento *</label>
                      <input
                        type="date" required
                        value={newAccountForm.due_date}
                        onChange={(e) => setNewAccountForm({ ...newAccountForm, due_date: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">Forma de Pagamento</label>
                      <select
                        value={newAccountForm.payment_method}
                        onChange={(e) => setNewAccountForm({ ...newAccountForm, payment_method: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      >
                         <option value="">Selecione...</option>
                         <option value="PIX">PIX</option>
                         <option value="DINHEIRO">Dinheiro</option>
                         <option value="CARTAO_DEBITO">Cartão Débito</option>
                         <option value="CARTAO_CREDITO">Cartão Crédito</option>
                         <option value="BOLETO">Boleto</option>
                         <option value="TRANSFERENCIA">Transferência</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">Nº Documento</label>
                      <input
                        type="text"
                        value={newAccountForm.document_number}
                        onChange={(e) => setNewAccountForm({ ...newAccountForm, document_number: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">Observações</label>
                    <textarea
                      rows={2}
                      value={newAccountForm.notes}
                      onChange={(e) => setNewAccountForm({ ...newAccountForm, notes: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={closeModals} className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium">Cancelar</button>
                    <button type="submit" className="px-6 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-medium shadow-lg">Criar Conta</button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedAccount && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
              onClick={closeModals}
            />
            <div className="fixed inset-0 flex items-center justify-center z-[100] p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden pointer-events-auto"
              >
                <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Baixar Conta a Pagar</h2>
                  <button onClick={closeModals} className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1 transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleRegisterPayment} className="p-6 space-y-4">
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 mb-2">
                    <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Fornecedor / Origem</div>
                    <div className="text-emerald-900 font-bold">{selectedAccount.supplier_name || 'Despesa Geral'}</div>
                    <div className="text-emerald-700 text-sm mt-1">{selectedAccount.description}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">Valor do Pagamento *</label>
                      <input
                        type="number" step="0.01" required
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 font-bold text-emerald-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">Data do Pagamento *</label>
                      <input
                        type="date" required
                        value={paymentForm.payment_date}
                        onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">Conta de Saída (Caixa) *</label>
                    <select
                      required
                      value={paymentForm.account_id}
                      onChange={(e) => setPaymentForm({ ...paymentForm, account_id: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 font-medium"
                    >
                      <option value="">Selecione o caixa...</option>
                      {cashAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>{acc.name} (Saldo: {formatCurrency(acc.balance)})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">Forma de Pagamento</label>
                      <select
                        value={paymentForm.payment_method}
                        onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      >
                         <option value="PIX">PIX</option>
                         <option value="DINHEIRO">Dinheiro</option>
                         <option value="CARTAO_DEBITO">Cartão Débito</option>
                         <option value="TRANSFERENCIA">Transferência</option>
                         <option value="BOLETO">Boleto</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">Nº Comprovante</label>
                      <input
                        type="text"
                        value={paymentForm.document_number}
                        onChange={(e) => setPaymentForm({ ...paymentForm, document_number: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={closeModals} className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium">Cancelar</button>
                    <button type="submit" className="px-6 py-2.5 bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 transition-colors text-sm font-medium shadow-lg flex items-center gap-2">
                        <CheckCircle size={16} /> Confirmar Pagamento
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedAccount && accountDetail && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
              onClick={closeModals}
            />
            <div className="fixed inset-0 flex items-center justify-center z-[100] p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden pointer-events-auto flex flex-col"
              >
                  <div className="bg-slate-800 px-6 py-4 flex items-center justify-between text-white shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                           <Truck size={20} />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg leading-tight">{selectedAccount.supplier_name || 'Despesa Geral'}</h2>
                            <p className="text-xs text-slate-400">{selectedAccount.description}</p>
                        </div>
                      </div>
                      <button onClick={closeModals} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X size={20} />
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-auto p-6 space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</span>
                              {getStatusBadge(selectedAccount.status)}
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Vencimento</span>
                              <span className="text-sm font-bold text-slate-900">{formatDate(selectedAccount.due_date)}</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Valor Original</span>
                              <span className="text-sm font-bold text-slate-900">{formatCurrency(selectedAccount.original_amount)}</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-emerald-100">
                              <span className="block text-[10px] font-bold text-emerald-500 uppercase mb-1">Saldo Devedor</span>
                              <span className="text-sm font-bold text-emerald-700">{formatCurrency(selectedAccount.balance)}</span>
                          </div>
                      </div>

                      <div>
                          <h3 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-2">
                             <Clock size={14} className="text-slate-400" /> Histórico de Pagamentos
                          </h3>
                          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                              <table className="w-full text-xs">
                                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                                      <tr>
                                          <th className="px-4 py-2.5 text-left">Data</th>
                                          <th className="px-4 py-2.5 text-left">Método</th>
                                          <th className="px-4 py-2.5 text-left">Responsável</th>
                                          <th className="px-4 py-2.5 text-right">Valor</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                      {accountDetail.payments?.map((p: any) => (
                                          <tr key={p.id}>
                                              <td className="px-4 py-2.5">{formatDate(p.payment_date)}</td>
                                              <td className="px-4 py-2.5 font-medium">{p.payment_method}</td>
                                              <td className="px-4 py-2.5 text-slate-500">{p.created_by_name}</td>
                                              <td className="px-4 py-2.5 text-right font-bold text-emerald-600">{formatCurrency(p.amount)}</td>
                                          </tr>
                                      )) || (
                                          <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">Nenhum pagamento registrado</td></tr>
                                      )}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
