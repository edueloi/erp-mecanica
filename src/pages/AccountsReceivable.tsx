import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
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
  ExternalLink,
  Wallet,
  ArrowUpCircle,
  TrendingDown,
  Download,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../services/api";

interface Account {
  id: string;
  client_name: string;
  client_phone: string;
  work_order_number?: string;
  work_order_id?: string;
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
  total_receivable: number;
  due_today: number;
  overdue: number;
  received_this_month: number;
}

export default function AccountsReceivable() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [stats, setStats] = useState<Stats>({
    total_receivable: 0,
    due_today: 0,
    overdue: 0,
    received_this_month: 0,
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
    client_id: "",
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
  });

  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    fetchAccounts();
    fetchStats();
    fetchClients();
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
      const response = await api.get("/accounts-receivable");
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
      const response = await api.get("/accounts-receivable/stats");
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await api.get("/clients");
      setClients(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setClients([]);
    }
  };

  const filterAccounts = () => {
    let filtered = accounts;

    if (searchTerm) {
      filtered = filtered.filter(
        (a) =>
          a.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.work_order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      await api.post("/accounts-receivable", newAccountForm);
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
      await api.post(`/accounts-receivable/${selectedAccount.id}/payment`, paymentForm);
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
      const response = await api.get(`/accounts-receivable/${account.id}`);
      setAccountDetail(response.data);
      setSelectedAccount(account);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Error fetching account detail:", error);
      alert("Erro ao carregar detalhes");
    }
  };

  const handleDelete = (account: Account) => {
    setAccountToDelete(account);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!accountToDelete) return;
    try {
      await api.delete(`/accounts-receivable/${accountToDelete.id}`);
      fetchAccounts();
      fetchStats();
      setDeleteConfirmOpen(false);
      setAccountToDelete(null);
    } catch (error: any) {
      alert(error.response?.data?.error || "Erro ao excluir conta");
    }
  };

  const openPaymentModal = (account: Account) => {
    setSelectedAccount(account);
    setPaymentForm({
      amount: account.balance.toString(),
      payment_date: new Date().toISOString().split("T")[0],
      payment_method: account.payment_method || "",
      document_number: "",
      notes: "",
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
      client_id: "",
      description: "",
      original_amount: "",
      due_date: "",
      payment_method: "",
      document_number: "",
      notes: "",
    });
    setPaymentForm({
      amount: "",
      payment_date: new Date().toISOString().split("T")[0],
      payment_method: "",
      document_number: "",
      notes: "",
    });
  };

  const handleExportExcel = () => {
    const dataToExport = filteredAccounts.map(account => ({
      Vencimento: formatDate(account.due_date),
      Cliente: account.client_name,
      Status: account.status === 'PAID' ? 'Pago' : account.status === 'OVERDUE' ? 'Atrasado' : account.status === 'PARTIAL' ? 'Parcial' : 'Aberto',
      'Valor Original': account.original_amount,
      'Valor Recebido': account.amount_paid,
      Saldo: account.balance,
      Descrição: account.description,
      'Forma de Pagamento': account.payment_method || '-',
      'Data de Criação': new Date(account.created_at).toLocaleDateString('pt-BR')
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contas a Receber");

    const wscols = [
      { wch: 15 }, // Vencimento
      { wch: 30 }, // Cliente
      { wch: 15 }, // Status
      { wch: 15 }, // Valor Original
      { wch: 15 }, // Valor Recebido
      { wch: 15 }, // Saldo
      { wch: 40 }, // Descrição
      { wch: 20 }, // Forma
      { wch: 15 }, // Criação
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Contas_a_Receber_${new Date().toISOString().split('T')[0]}.xlsx`);
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
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Contas a Receber</h1>
            <p className="text-slate-500 text-sm">
              Gestão de recebíveis e faturamento
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
            onClick={handleExportExcel}
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
          className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <div className="text-sm opacity-90 mb-1">Total a Receber</div>
          <div className="text-3xl font-bold">{formatCurrency(stats.total_receivable)}</div>
          <div className="text-xs opacity-75 mt-2">Saldo pendente</div>
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
          onClick={() => {
            const today = new Date().toISOString().split('T')[0];
            setSelectedStatus("OPEN");
          }}
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
          <div className="text-xs text-slate-500 mt-2">Compromissos do dia</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-green-50 border border-green-200 rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <ArrowUpCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1">
            Recebido no Mês
          </div>
          <div className="text-2xl font-bold text-green-700">
            {formatCurrency(stats.received_this_month)}
          </div>
          <div className="text-xs text-slate-600 mt-2">Sucesso de cobrança</div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por cliente, OS, descrição ou documento..."
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

            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <option value="all">Todas Formas</option>
              <option value="DINHEIRO">Dinheiro</option>
              <option value="PIX">PIX</option>
              <option value="CARTAO_DEBITO">Cartão Débito</option>
              <option value="CARTAO_CREDITO">Cartão Crédito</option>
              <option value="BOLETO">Boleto</option>
              <option value="TRANSFERENCIA">Transferência</option>
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
          <table className="w-full min-w-[1200px] border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Vencimento</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Cliente / Origem</th>
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
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-900 leading-none mb-1">{account.client_name}</span>
                      <span className="text-xs text-slate-500 font-medium">{account.client_phone || 'Sem telefone'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    {account.work_order_number ? (
                      <Link
                        to={`/work-orders/${account.work_order_id}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                      >
                        <FileText size={12} />
                        OS #{account.work_order_number}
                        {account.total_installments > 1 && (
                          <span className="opacity-60 ml-1">({account.installment_number}/{account.total_installments})</span>
                        )}
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium italic">Lançamento Direto</span>
                    )}
                  </td>
                  <td className="px-6 py-5 min-w-[300px] whitespace-nowrap">
                    <p className="text-sm text-slate-600 line-clamp-1 font-medium">{account.description}</p>
                    {account.payment_method && (
                      <span className="text-[10px] text-slate-400 font-medium">Via {account.payment_method}</span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right whitespace-nowrap">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-bold text-slate-900">{formatCurrency(account.original_amount)}</span>
                      {account.amount_paid > 0 && (
                        <span className="text-[10px] text-green-600 font-bold">Pago: {formatCurrency(account.amount_paid)}</span>
                      )}
                      <span className={`text-[10px] font-bold ${account.balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        Saldo: {formatCurrency(account.balance)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
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
                          className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-all shadow-sm active:scale-95"
                          title="Baixar Recebimento"
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
                          onClick={() => handleDelete(account)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all shadow-sm active:scale-95"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
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
            <h3 className="text-slate-900 font-bold">Nenhum recebível encontrado</h3>
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
                  <h2 className="text-lg font-semibold text-white">Nova Conta a Receber</h2>
                  <button
                    onClick={closeModals}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleNewAccount} className="p-6 space-y-4">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                      Cliente (Opcional - Lançamento Direto)
                    </label>
                    <select
                      value={newAccountForm.client_id}
                      onChange={(e) =>
                        setNewAccountForm({ ...newAccountForm, client_id: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <option value="">Nenhum / Lançamento Avulso</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                      Descrição *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAccountForm.description}
                      onChange={(e) =>
                        setNewAccountForm({ ...newAccountForm, description: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                        Valor (R$) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={newAccountForm.original_amount}
                        onChange={(e) =>
                          setNewAccountForm({
                            ...newAccountForm,
                            original_amount: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                        Vencimento *
                      </label>
                      <input
                        type="date"
                        required
                        value={newAccountForm.due_date}
                        onChange={(e) =>
                          setNewAccountForm({ ...newAccountForm, due_date: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                        Forma de Pagamento
                      </label>
                      <select
                        value={newAccountForm.payment_method}
                        onChange={(e) =>
                          setNewAccountForm({
                            ...newAccountForm,
                            payment_method: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      >
                        <option value="">Selecione</option>
                        <option value="DINHEIRO">Dinheiro</option>
                        <option value="PIX">PIX</option>
                        <option value="CARTAO_DEBITO">Cartão Débito</option>
                        <option value="CARTAO_CREDITO">Cartão Crédito</option>
                        <option value="BOLETO">Boleto</option>
                        <option value="TRANSFERENCIA">Transferência</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                        Nº Documento
                      </label>
                      <input
                        type="text"
                        value={newAccountForm.document_number}
                        onChange={(e) =>
                          setNewAccountForm({
                            ...newAccountForm,
                            document_number: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                      Observações
                    </label>
                    <textarea
                      rows={3}
                      value={newAccountForm.notes}
                      onChange={(e) =>
                        setNewAccountForm({ ...newAccountForm, notes: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModals}
                      className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-medium shadow-lg"
                    >
                      Criar Conta
                    </button>
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
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden pointer-events-auto"
              >
                <div className="bg-gradient-to-r from-green-700 to-green-600 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Registrar Pagamento</h2>
                  <button
                    onClick={closeModals}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Account Info Card */}
                <div className="p-6 bg-green-50 border-b border-green-200">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Cliente:</span>
                      <span className="font-medium text-slate-900">
                        {selectedAccount.client_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Descrição:</span>
                      <span className="font-medium text-slate-900">
                        {selectedAccount.description}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Saldo Devedor:</span>
                      <span className="font-bold text-green-700 text-lg">
                        {formatCurrency(selectedAccount.balance)}
                      </span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleRegisterPayment} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                        Valor Recebido (R$) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        max={selectedAccount.balance}
                        value={paymentForm.amount}
                        onChange={(e) =>
                          setPaymentForm({ ...paymentForm, amount: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                        Data do Pagamento *
                      </label>
                      <input
                        type="date"
                        required
                        value={paymentForm.payment_date}
                        onChange={(e) =>
                          setPaymentForm({ ...paymentForm, payment_date: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                        Forma de Pagamento *
                      </label>
                      <select
                        required
                        value={paymentForm.payment_method}
                        onChange={(e) =>
                          setPaymentForm({ ...paymentForm, payment_method: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                      >
                        <option value="">Selecione</option>
                        <option value="DINHEIRO">Dinheiro</option>
                        <option value="PIX">PIX</option>
                        <option value="CARTAO_DEBITO">Cartão Débito</option>
                        <option value="CARTAO_CREDITO">Cartão Crédito</option>
                        <option value="BOLETO">Boleto</option>
                        <option value="TRANSFERENCIA">Transferência</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                        Nº Documento
                      </label>
                      <input
                        type="text"
                        value={paymentForm.document_number}
                        onChange={(e) =>
                          setPaymentForm({ ...paymentForm, document_number: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                      Observações
                    </label>
                    <textarea
                      rows={2}
                      value={paymentForm.notes}
                      onChange={(e) =>
                        setPaymentForm({ ...paymentForm, notes: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModals}
                      className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-medium shadow-lg"
                    >
                      Confirmar Pagamento
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
        {showDetailModal && accountDetail && (
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
                <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Detalhes da Conta</h2>
                  <button
                    onClick={closeModals}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Account Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Cliente</p>
                      <p className="font-medium text-slate-900">{accountDetail.client_name}</p>
                      <p className="text-sm text-slate-500">{accountDetail.client_phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">OS Vinculada</p>
                      <p className="font-medium text-slate-900">
                        {accountDetail.work_order_number || "- - -"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Vencimento</p>
                      <p className="font-medium text-slate-900">
                        {formatDate(accountDetail.due_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Status</p>
                      {getStatusBadge(accountDetail.status)}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Valor Original</p>
                      <p className="font-medium text-slate-900">
                        {formatCurrency(accountDetail.original_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Valor Pago</p>
                      <p className="font-medium text-green-600">
                        {formatCurrency(accountDetail.amount_paid)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Saldo</p>
                      <p className="font-bold text-orange-600 text-lg">
                        {formatCurrency(accountDetail.balance)}
                      </p>
                    </div>
                  </div>

                  {/* Payment History */}
                  {accountDetail.payments && accountDetail.payments.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
                        Histórico de Pagamentos
                      </h3>
                      <div className="space-y-3">
                        {accountDetail.payments.map((payment: Payment) => (
                          <div
                            key={payment.id}
                            className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="font-medium text-slate-900">
                                  {formatCurrency(payment.amount)}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                {formatDate(payment.payment_date)} • {payment.payment_method}
                              </p>
                              {payment.notes && (
                                <p className="text-xs text-slate-600 mt-1">{payment.notes}</p>
                              )}
                            </div>
                            <div className="text-right text-xs text-slate-500">
                              {payment.created_by_name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {accountDetail.payments && accountDetail.payments.length === 0 && (
                    <div className="text-center py-6 text-slate-400">
                      Nenhum pagamento registrado
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={closeModals}
                      className="px-6 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-medium"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110]"
              onClick={() => setDeleteConfirmOpen(false)}
            />
            <div className="fixed inset-0 flex items-center justify-center z-[120] p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden pointer-events-auto"
              >
                <div className="p-6">
                  <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-6 h-6 text-rose-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 italic tracking-tighter uppercase">Excluir Recebível</h3>
                  <p className="text-slate-600 text-sm mb-6 font-medium">
                    Tem certeza que deseja excluir este recebível de <span className="font-black text-slate-900">{accountToDelete?.client_name}</span>? Esta ação não pode ser desfeita e afetará o fluxo de caixa histórico.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteConfirmOpen(false)}
                      className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all text-[10px] font-black uppercase tracking-widest italic"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all text-[10px] font-black uppercase tracking-widest italic shadow-lg shadow-rose-200"
                    >
                      Excluir Agora
                    </button>
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
