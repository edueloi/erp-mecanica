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
} from "lucide-react";
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

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta conta?")) return;

    try {
      await api.delete(`/accounts-receivable/${id}`);
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + "T00:00:00").toLocaleDateString("pt-BR");
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
    <div className="flex flex-col h-full -m-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-8 border-b border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Contas a Receber</h1>
            <p className="text-slate-300 text-sm">
              Controle financeiro completo das receitas
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowNewModal(true)}
              className="h-9 px-4 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nova Conta
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="hidden lg:grid grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <p className="text-slate-300 text-xs font-medium">Total a Receber</p>
                <p className="text-white text-2xl font-bold">
                  {formatCurrency(stats.total_receivable)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-yellow-300" />
              </div>
              <div>
                <p className="text-slate-300 text-xs font-medium">Vencendo Hoje</p>
                <p className="text-white text-2xl font-bold">
                  {formatCurrency(stats.due_today)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-300" />
              </div>
              <div>
                <p className="text-slate-300 text-xs font-medium">Em Atraso</p>
                <p className="text-white text-2xl font-bold">
                  {formatCurrency(stats.overdue)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-300" />
              </div>
              <div>
                <p className="text-slate-300 text-xs font-medium">Recebido no Mês</p>
                <p className="text-white text-2xl font-bold">
                  {formatCurrency(stats.received_this_month)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por cliente, OS ou documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 h-9 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="all">Todos Status</option>
            <option value="OPEN">Aberto</option>
            <option value="PARTIAL">Parcial</option>
            <option value="PAID">Pago</option>
            <option value="OVERDUE">Atrasado</option>
          </select>

          <select
            value={selectedPaymentMethod}
            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
            className="h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="all">Todas Formas</option>
            <option value="DINHEIRO">Dinheiro</option>
            <option value="PIX">PIX</option>
            <option value="CARTAO_DEBITO">Cartão Débito</option>
            <option value="CARTAO_CREDITO">Cartão Crédito</option>
            <option value="BOLETO">Boleto</option>
            <option value="TRANSFERENCIA">Transferência</option>
          </select>

          <button
            onClick={() => setShowOverdueOnly(!showOverdueOnly)}
            className={`h-9 px-4 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              showOverdueOnly
                ? "bg-red-500 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            Atrasados
          </button>

          <button
            onClick={() => setShowCurrentMonthOnly(!showCurrentMonthOnly)}
            className={`h-9 px-4 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              showCurrentMonthOnly
                ? "bg-blue-500 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Este Mês
          </button>
        </div>
        <div className="mt-3 text-sm text-slate-500">
          {filteredAccounts.length} contas encontradas
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">
                Vencimento
              </th>
              <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">
                Cliente
              </th>
              <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">
                OS / Parcela
              </th>
              <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">
                Descrição
              </th>
              <th className="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">
                Valor Original
              </th>
              <th className="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">
                Valor Pago
              </th>
              <th className="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">
                Saldo
              </th>
              <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">
                Forma Pagto
              </th>
              <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">
                Status
              </th>
              <th className="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredAccounts.map((account) => (
              <tr key={account.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span
                      className={`text-sm font-medium ${
                        account.status === "OVERDUE"
                          ? "text-red-600"
                          : "text-slate-900"
                      }`}
                    >
                      {formatDate(account.due_date)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-slate-900">{account.client_name}</div>
                    <div className="text-sm text-slate-500">{account.client_phone}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    {account.work_order_number && (
                      <div className="text-sm font-medium text-slate-900">
                        OS {account.work_order_number}
                      </div>
                    )}
                    {account.total_installments > 1 && (
                      <div className="text-xs text-slate-500">
                        Parcela {account.installment_number}/{account.total_installments}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-600">{account.description}</div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-medium text-slate-900">
                    {formatCurrency(account.original_amount)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm text-green-600 font-medium">
                    {formatCurrency(account.amount_paid)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span
                    className={`text-sm font-bold ${
                      account.balance > 0 ? "text-orange-600" : "text-green-600"
                    }`}
                  >
                    {formatCurrency(account.balance)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-600">
                    {account.payment_method || "-"}
                  </span>
                </td>
                <td className="px-6 py-4">{getStatusBadge(account.status)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {account.status !== "PAID" && (
                      <button
                        onClick={() => openPaymentModal(account)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Registrar Pagamento"
                      >
                        <DollarSign className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleViewDetail(account)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Ver Detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {account.amount_paid === 0 && (
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAccounts.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Nenhuma conta encontrada</p>
            <p className="text-slate-400 text-sm mt-1">
              Ajuste os filtros ou cadastre uma nova conta
            </p>
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
                      Cliente *
                    </label>
                    <select
                      required
                      value={newAccountForm.client_id}
                      onChange={(e) =>
                        setNewAccountForm({ ...newAccountForm, client_id: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <option value="">Selecione um cliente</option>
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
    </div>
  );
}
