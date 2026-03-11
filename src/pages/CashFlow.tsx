import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  ArrowLeftRight,
  CheckCircle,
  Download,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Check,
  X,
  Calendar,
  Search,
} from "lucide-react";
import api from "../services/api";

interface Account {
  id: string;
  name: string;
  type: string;
  active: boolean;
  balance: number;
}

interface Transaction {
  id: string;
  date: string;
  type: "in" | "out" | "transfer";
  amount: number;
  category: string;
  description: string;
  account_id: string;
  account_name: string;
  related_account_name?: string;
  payment_method: string;
  status: "confirmed" | "pending";
  source_type: string;
  created_by_name: string;
}

interface Summary {
  total_in: number;
  total_out: number;
  result: number;
  pending_in: number;
  pending_out: number;
  forecast: number;
  total_balance: number;
  account_balances: { id: string; name: string; type: string; balance: number }[];
}

export default function CashFlow() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [categories, setCategories] = useState<{ in: string[]; out: string[] }>({
    in: [],
    out: [],
  });

  // Filters
  const [filters, setFilters] = useState({
    period: "month",
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
    account_id: "all",
    type: "all",
    category: "all",
    status: "all",
    source_type: "all",
    search: "",
  });

  // Modals
  const [showNewTransaction, setShowNewTransaction] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Form states
  const [transactionForm, setTransactionForm] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "in",
    amount: "",
    category: "",
    description: "",
    account_id: "",
    payment_method: "Dinheiro",
    status: "confirmed",
  });

  const [transferForm, setTransferForm] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    from_account_id: "",
    to_account_id: "",
    description: "",
  });

  const [closeForm, setCloseForm] = useState({
    account_id: "",
    date: new Date().toISOString().split("T")[0],
    counted_balance: "",
    notes: "",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadAccounts(),
        loadTransactions(),
        loadSummary(),
        loadCategories(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const response = await api.get("/cashflow/accounts");
      setAccounts(response.data);
    } catch (error) {
      console.error("Error loading accounts:", error);
    }
  };

  const loadTransactions = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);
      if (filters.account_id !== "all") params.append("account_id", filters.account_id);
      if (filters.type !== "all") params.append("type", filters.type);
      if (filters.category !== "all") params.append("category", filters.category);
      if (filters.status !== "all") params.append("status", filters.status);
      if (filters.source_type !== "all") params.append("source_type", filters.source_type);
      if (filters.search) params.append("search", filters.search);

      const response = await api.get(`/cashflow/transactions?${params}`);
      setTransactions(response.data);
    } catch (error) {
      console.error("Error loading transactions:", error);
    }
  };

  const loadSummary = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);
      if (filters.account_id !== "all") params.append("account_id", filters.account_id);

      const response = await api.get(`/cashflow/summary?${params}`);
      setSummary(response.data);
    } catch (error) {
      console.error("Error loading summary:", error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get("/cashflow/categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const handlePeriodChange = (period: string) => {
    const today = new Date();
    let start_date = "";
    let end_date = today.toISOString().split("T")[0];

    switch (period) {
      case "today":
        start_date = end_date;
        break;
      case "week":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        start_date = weekStart.toISOString().split("T")[0];
        break;
      case "month":
        start_date = new Date(today.getFullYear(), today.getMonth(), 1)
          .toISOString()
          .split("T")[0];
        break;
      case "year":
        start_date = new Date(today.getFullYear(), 0, 1).toISOString().split("T")[0];
        break;
    }

    setFilters({ ...filters, period, start_date, end_date });
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/cashflow/transactions", {
        ...transactionForm,
        amount: parseFloat(transactionForm.amount),
      });

      setShowNewTransaction(false);
      resetTransactionForm();
      loadData();
      alert("Lançamento criado com sucesso!");
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao criar lançamento");
    }
  };

  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    try {
      await api.patch(`/cashflow/transactions/${editingTransaction.id}`, {
        ...transactionForm,
        amount: parseFloat(transactionForm.amount),
      });

      setEditingTransaction(null);
      setShowNewTransaction(false);
      resetTransactionForm();
      loadData();
      alert("Lançamento atualizado com sucesso!");
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao atualizar lançamento");
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/cashflow/transactions/transfer", {
        ...transferForm,
        amount: parseFloat(transferForm.amount),
      });

      setShowTransfer(false);
      resetTransferForm();
      loadData();
      alert("Transferência realizada com sucesso!");
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao criar transferência");
    }
  };

  const handleCloseCash = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/cashflow/close", {
        ...closeForm,
        counted_balance: parseFloat(closeForm.counted_balance),
      });

      setShowClose(false);
      resetCloseForm();
      loadData();
      alert("Caixa fechado com sucesso!");
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao fechar caixa");
    }
  };

  const handleConfirmTransaction = async (id: string) => {
    try {
      await api.patch(`/cashflow/transactions/${id}/confirm`);
      loadData();
      alert("Lançamento confirmado!");
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao confirmar lançamento");
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Confirma exclusão/estorno deste lançamento?")) return;

    try {
      await api.delete(`/cashflow/transactions/${id}`);
      loadData();
      alert("Operação realizada com sucesso!");
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao excluir lançamento");
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setTransactionForm({
      date: transaction.date.split("T")[0],
      type: transaction.type,
      amount: transaction.amount.toString(),
      category: transaction.category,
      description: transaction.description,
      account_id: transaction.account_id,
      payment_method: transaction.payment_method,
      status: transaction.status,
    });
    setShowNewTransaction(true);
  };

  const resetTransactionForm = () => {
    setTransactionForm({
      date: new Date().toISOString().split("T")[0],
      type: "in",
      amount: "",
      category: "",
      description: "",
      account_id: "",
      payment_method: "Dinheiro",
      status: "confirmed",
    });
    setEditingTransaction(null);
  };

  const resetTransferForm = () => {
    setTransferForm({
      date: new Date().toISOString().split("T")[0],
      amount: "",
      from_account_id: "",
      to_account_id: "",
      description: "",
    });
  };

  const resetCloseForm = () => {
    setCloseForm({
      account_id: "",
      date: new Date().toISOString().split("T")[0],
      counted_balance: "",
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
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? "-" : date.toLocaleDateString("pt-BR");
    } catch {
      return "-";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "in":
        return "text-green-600 bg-green-50";
      case "out":
        return "text-red-600 bg-red-50";
      case "transfer":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-slate-600 bg-slate-50";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "in":
        return "Entrada";
      case "out":
        return "Saída";
      case "transfer":
        return "Transferência";
      default:
        return type;
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Fluxo de Caixa</h1>
          <p className="text-sm text-slate-500 mt-1">
            Controle de entradas, saídas e saldo das contas
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowNewTransaction(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-medium shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Novo Lançamento
          </button>
          <button
            onClick={() => setShowTransfer(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium shadow-lg"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Transferência
          </button>
          <button
            onClick={() => setShowClose(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-medium shadow-lg"
          >
            <CheckCircle className="w-4 h-4" />
            Fechar Caixa
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
      {summary && (
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
            <div className="text-sm opacity-90 mb-1">Saldo Atual</div>
            <div className="text-3xl font-bold">{formatCurrency(summary.total_balance)}</div>
            <div className="text-xs opacity-75 mt-2">
              {summary.account_balances.length} conta(s) ativa(s)
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => setFilters({ ...filters, type: "in" })}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1">
              Entradas no Período
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(summary.total_in)}
            </div>
            {summary.pending_in > 0 && (
              <div className="text-xs text-slate-500 mt-2">
                + {formatCurrency(summary.pending_in)} pendente
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => setFilters({ ...filters, type: "out" })}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1">
              Saídas no Período
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(summary.total_out)}
            </div>
            {summary.pending_out > 0 && (
              <div className="text-xs text-slate-500 mt-2">
                + {formatCurrency(summary.pending_out)} pendente
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`rounded-2xl border p-6 shadow-lg ${
              summary.result >= 0
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  summary.result >= 0 ? "bg-green-100" : "bg-red-100"
                }`}
              >
                <DollarSign
                  className={`w-6 h-6 ${summary.result >= 0 ? "text-green-600" : "text-red-600"}`}
                />
              </div>
            </div>
            <div className="text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1">
              Resultado
            </div>
            <div
              className={`text-2xl font-bold ${
                summary.result >= 0 ? "text-green-700" : "text-red-700"
              }`}
            >
              {formatCurrency(summary.result)}
            </div>
            <div className="text-xs text-slate-600 mt-2">
              Previsão: {formatCurrency(summary.forecast)}
            </div>
          </motion.div>
        </div>
      )}

      {/* Accounts Balance */}
      {summary && summary.account_balances.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
            Saldo por Conta
          </h3>
          <div className="grid grid-cols-4 gap-4">
            {summary.account_balances.map((account) => (
              <div
                key={account.id}
                className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => setFilters({ ...filters, account_id: account.id })}
              >
                <div className="text-xs text-slate-600 mb-1">{account.name}</div>
                <div className="text-xl font-bold text-slate-900">
                  {formatCurrency(account.balance)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex gap-2">
            {["today", "week", "month", "year"].map((period) => (
              <button
                key={period}
                onClick={() => handlePeriodChange(period)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  filters.period === period
                    ? "bg-slate-700 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {period === "today" && "Hoje"}
                {period === "week" && "Semana"}
                {period === "month" && "Mês"}
                {period === "year" && "Ano"}
              </button>
            ))}
          </div>

          <div className="flex gap-2 items-center">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) =>
                setFilters({ ...filters, start_date: e.target.value, period: "custom" })
              }
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm"
            />
            <span className="text-slate-400">até</span>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) =>
                setFilters({ ...filters, end_date: e.target.value, period: "custom" })
              }
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <select
            value={filters.account_id}
            onChange={(e) => setFilters({ ...filters, account_id: e.target.value })}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="all">Todas as contas</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>

          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="all">Todos os tipos</option>
            <option value="in">Entradas</option>
            <option value="out">Saídas</option>
            <option value="transfer">Transferências</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="all">Todos os status</option>
            <option value="confirmed">Confirmados</option>
            <option value="pending">Pendentes</option>
          </select>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-4 text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                  Data
                </th>
                <th className="text-left p-4 text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                  Tipo
                </th>
                <th className="text-left p-4 text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                  Descrição
                </th>
                <th className="text-left p-4 text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                  Categoria
                </th>
                <th className="text-left p-4 text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                  Conta
                </th>
                <th className="text-left p-4 text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                  Forma
                </th>
                <th className="text-right p-4 text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                  Valor
                </th>
                <th className="text-center p-4 text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-center p-4 text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    Carregando...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    Nenhum lançamento encontrado
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4 text-sm text-slate-900 whitespace-nowrap">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${getTypeColor(
                          transaction.type
                        )}`}
                      >
                        {getTypeLabel(transaction.type)}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-900 min-w-[300px] whitespace-nowrap">
                      {transaction.description}
                      {transaction.related_account_name && (
                        <div className="text-xs text-slate-500">
                          → {transaction.related_account_name}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-sm text-slate-600 whitespace-nowrap">{transaction.category}</td>
                    <td className="p-4 text-sm text-slate-600 whitespace-nowrap">
                      {transaction.account_name}
                    </td>
                    <td className="p-4 text-sm text-slate-600 whitespace-nowrap">
                      {transaction.payment_method || "-"}
                    </td>
                    <td
                      className={`p-4 text-sm font-semibold text-right whitespace-nowrap ${
                        transaction.type === "in" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {transaction.type === "in" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="p-4 text-center">
                      {transaction.status === "confirmed" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          Confirmado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-yellow-600">
                          <Calendar className="w-3 h-3" />
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {transaction.status === "pending" && (
                          <button
                            onClick={() => handleConfirmTransaction(transaction.id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Confirmar"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {transaction.source_type === "manual" && (
                          <button
                            onClick={() => handleEditTransaction(transaction)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={
                            transaction.source_type === "manual"
                              ? "Excluir"
                              : "Estornar"
                          }
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* New Transaction Modal */}
      <AnimatePresence>
        {showNewTransaction && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  {editingTransaction ? "Editar Lançamento" : "Novo Lançamento"}
                </h2>
                <button
                  onClick={() => {
                    setShowNewTransaction(false);
                    resetTransactionForm();
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={editingTransaction ? handleUpdateTransaction : handleCreateTransaction}
                className="p-6 space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                      Tipo
                    </label>
                    <select
                      value={transactionForm.type}
                      onChange={(e) =>
                        setTransactionForm({ ...transactionForm, type: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <option value="in">Entrada</option>
                      <option value="out">Saída</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                      Data
                    </label>
                    <input
                      type="date"
                      value={transactionForm.date}
                      onChange={(e) =>
                        setTransactionForm({ ...transactionForm, date: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                      Valor
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={transactionForm.amount}
                      onChange={(e) =>
                        setTransactionForm({ ...transactionForm, amount: e.target.value })
                      }
                      required
                      placeholder="0,00"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                      Conta
                    </label>
                    <select
                      value={transactionForm.account_id}
                      onChange={(e) =>
                        setTransactionForm({ ...transactionForm, account_id: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <option value="">Selecione</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                      Categoria
                    </label>
                    <select
                      value={transactionForm.category}
                      onChange={(e) =>
                        setTransactionForm({ ...transactionForm, category: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <option value="">Selecione</option>
                      {transactionForm.type === "in"
                        ? categories.in.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))
                        : categories.out.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                      Forma de Pagamento
                    </label>
                    <select
                      value={transactionForm.payment_method}
                      onChange={(e) =>
                        setTransactionForm({
                          ...transactionForm,
                          payment_method: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="PIX">PIX</option>
                      <option value="Débito">Débito</option>
                      <option value="Crédito">Crédito</option>
                      <option value="Boleto">Boleto</option>
                      <option value="Transferência">Transferência</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                      Descrição
                    </label>
                    <textarea
                      value={transactionForm.description}
                      onChange={(e) =>
                        setTransactionForm({ ...transactionForm, description: e.target.value })
                      }
                      required
                      rows={3}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                      Status
                    </label>
                    <select
                      value={transactionForm.status}
                      onChange={(e) =>
                        setTransactionForm({ ...transactionForm, status: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <option value="confirmed">Confirmado</option>
                      <option value="pending">Pendente</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewTransaction(false);
                      resetTransactionForm();
                    }}
                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-medium shadow-lg"
                  >
                    {editingTransaction ? "Atualizar" : "Criar Lançamento"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transfer Modal */}
      <AnimatePresence>
        {showTransfer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl"
            >
              <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Transferência entre Contas</h2>
                <button
                  onClick={() => {
                    setShowTransfer(false);
                    resetTransferForm();
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTransfer} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                      Data
                    </label>
                    <input
                      type="date"
                      value={transferForm.date}
                      onChange={(e) =>
                        setTransferForm({ ...transferForm, date: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                      Valor
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={transferForm.amount}
                      onChange={(e) =>
                        setTransferForm({ ...transferForm, amount: e.target.value })
                      }
                      required
                      placeholder="0,00"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                      Conta Origem
                    </label>
                    <select
                      value={transferForm.from_account_id}
                      onChange={(e) =>
                        setTransferForm({ ...transferForm, from_account_id: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <option value="">Selecione</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} - {formatCurrency(account.balance)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                      Conta Destino
                    </label>
                    <select
                      value={transferForm.to_account_id}
                      onChange={(e) =>
                        setTransferForm({ ...transferForm, to_account_id: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <option value="">Selecione</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} - {formatCurrency(account.balance)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                      Observação
                    </label>
                    <input
                      type="text"
                      value={transferForm.description}
                      onChange={(e) =>
                        setTransferForm({ ...transferForm, description: e.target.value })
                      }
                      placeholder="Opcional"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTransfer(false);
                      resetTransferForm();
                    }}
                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium shadow-lg"
                  >
                    Realizar Transferência
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Close Cash Modal */}
      <AnimatePresence>
        {showClose && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl"
            >
              <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Fechar Caixa</h2>
                <button
                  onClick={() => {
                    setShowClose(false);
                    resetCloseForm();
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCloseCash} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                      Conta
                    </label>
                    <select
                      value={closeForm.account_id}
                      onChange={(e) =>
                        setCloseForm({ ...closeForm, account_id: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <option value="">Selecione</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                      Data
                    </label>
                    <input
                      type="date"
                      value={closeForm.date}
                      onChange={(e) => setCloseForm({ ...closeForm, date: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                      Saldo Contado
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={closeForm.counted_balance}
                      onChange={(e) =>
                        setCloseForm({ ...closeForm, counted_balance: e.target.value })
                      }
                      required
                      placeholder="0,00"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                      Observações
                    </label>
                    <textarea
                      value={closeForm.notes}
                      onChange={(e) => setCloseForm({ ...closeForm, notes: e.target.value })}
                      rows={3}
                      placeholder="Opcional"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Atenção:</strong> O fechamento calculará automaticamente o saldo
                    esperado com base nos lançamentos do dia e comparará com o valor contado.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowClose(false);
                      resetCloseForm();
                    }}
                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-medium shadow-lg"
                  >
                    Confirmar Fechamento
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
