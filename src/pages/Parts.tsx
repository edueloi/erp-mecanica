import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  AlertTriangle,
  XCircle,
  DollarSign,
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  TrendingDown,
  Edit,
  Trash2,
  History,
  X,
  Info,
  Calendar,
  Building2,
  Phone
} from "lucide-react";
import api from "../services/api";

interface Part {
  id: string;
  name: string;
  code: string;
  supplier_code: string | null;
  category: string | null;
  brand: string | null;
  supplier_id: string | null;
  supplier_name?: string | null;
  cost_price: number;
  sale_price: number;
  stock_quantity: number;
  min_stock: number;
  location: string | null;
  compatibility: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Stats {
  total: number;
  low_stock: number;
  zero_stock: number;
  total_value: number;
}

interface StockMovement {
  id: string;
  part_id: string;
  part_name: string;
  type: 'ENTRY' | 'EXIT' | 'OS_USED' | 'ADJUSTMENT' | 'LOSS';
  quantity: number;
  unit_cost: number;
  invoice_number: string | null;
  reason: string | null;
  user_name: string | null;
  created_at: string;
}

export default function Parts() {
  const [parts, setParts] = useState<Part[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, low_stock: 0, zero_stock: 0, total_value: 0 });
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Modals
  const [showNewPartModal, setShowNewPartModal] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [partDetails, setPartDetails] = useState<any>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    supplier_code: "",
    category: "",
    brand: "",
    cost_price: "",
    sale_price: "",
    stock_quantity: "",
    min_stock: "",
    location: "",
    compatibility: "",
    notes: "",
    supplier_id: ""
  });

  const [entryData, setEntryData] = useState({
    quantity: "",
    unit_cost: "",
    invoice_number: "",
    reason: ""
  });

  const [exitData, setExitData] = useState({
    quantity: "",
    reason: ""
  });

  useEffect(() => {
    loadData();
  }, [searchTerm, selectedCategory, selectedBrand, selectedStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("q", searchTerm);
      if (selectedCategory) params.append("category", selectedCategory);
      if (selectedBrand) params.append("brand", selectedBrand);
      if (selectedSupplier) params.append("supplier_id", selectedSupplier);
      if (selectedStatus) params.append("status", selectedStatus);

      const [partsRes, statsRes, categoriesRes, brandsRes, suppliersRes] = await Promise.all([
        api.get(`/parts?${params.toString()}`),
        api.get("/parts/stats"),
        api.get("/parts/categories"),
        api.get("/parts/brands"),
        api.get("/suppliers?status=ACTIVE")
      ]);

      setParts(Array.isArray(partsRes.data) ? partsRes.data : []);
      setStats(statsRes.data || { total: 0, low_stock: 0, zero_stock: 0, total_value: 0 });
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
      setBrands(Array.isArray(brandsRes.data) ? brandsRes.data : []);
      setSuppliers(Array.isArray(suppliersRes.data) ? suppliersRes.data : []);
    } catch (error) {
      console.error("Error loading parts:", error);
      setParts([]);
      setCategories([]);
      setBrands([]);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePart = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/parts", {
        ...formData,
        cost_price: parseFloat(formData.cost_price) || 0,
        sale_price: parseFloat(formData.sale_price) || 0,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        min_stock: parseInt(formData.min_stock) || 0
      });
      setShowNewPartModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error("Error creating part:", error);
    }
  };

  const handleStockEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPart) return;
    try {
      await api.post(`/parts/${selectedPart.id}/entry`, {
        quantity: parseInt(entryData.quantity),
        unit_cost: parseFloat(entryData.unit_cost) || selectedPart.cost_price,
        invoice_number: entryData.invoice_number,
        reason: entryData.reason
      });
      setShowEntryModal(false);
      resetEntryForm();
      loadData();
    } catch (error) {
      console.error("Error registering entry:", error);
    }
  };

  const handleStockExit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPart) return;
    try {
      await api.post(`/parts/${selectedPart.id}/exit`, {
        quantity: parseInt(exitData.quantity),
        reason: exitData.reason
      });
      setShowExitModal(false);
      resetExitForm();
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || "Erro ao registrar saída");
      console.error("Error registering exit:", error);
    }
  };

  const handleDeletePart = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta peça?")) return;
    try {
      await api.delete(`/parts/${id}`);
      loadData();
    } catch (error) {
      console.error("Error deleting part:", error);
    }
  };

  const openHistory = async (part: Part) => {
    setSelectedPart(part);
    try {
      const res = await api.get(`/parts/${part.id}/movements`);
      setMovements(res.data);
      setShowHistoryModal(true);
    } catch (error) {
      console.error("Error loading movements:", error);
    }
  };

  const openDetails = async (part: Part) => {
    setSelectedPart(part);
    try {
      const [partRes, movRes] = await Promise.all([
        api.get(`/parts/${part.id}`),
        api.get(`/parts/${part.id}/movements`)
      ]);
      setPartDetails(partRes.data);
      setMovements(movRes.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Error loading details:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      supplier_code: "",
      category: "",
      brand: "",
      cost_price: "",
      sale_price: "",
      stock_quantity: "",
      min_stock: "",
      location: "",
      compatibility: "",
      notes: "",
      supplier_id: ""
    });
  };

  const resetEntryForm = () => {
    setEntryData({ quantity: "", unit_cost: "", invoice_number: "", reason: "" });
  };

  const resetExitForm = () => {
    setExitData({ quantity: "", reason: "" });
  };

  const getStockStatus = (part: Part) => {
    if (part.stock_quantity === 0) return { color: "text-red-600", bg: "bg-red-50", label: "ZERADO" };
    if (part.stock_quantity <= part.min_stock) return { color: "text-yellow-600", bg: "bg-yellow-50", label: "BAIXO" };
    return { color: "text-green-600", bg: "bg-green-50", label: "OK" };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const movementTypes: Record<string, { label: string; color: string }> = {
    ENTRY: { label: "Entrada", color: "text-green-600" },
    EXIT: { label: "Saída Manual", color: "text-red-600" },
    OS_USED: { label: "Usado em OS", color: "text-blue-600" },
    ADJUSTMENT: { label: "Ajuste", color: "text-yellow-600" },
    LOSS: { label: "Perda", color: "text-red-600" }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50 overflow-hidden lg:-mx-5 lg:mt-0 lg:mb-0 -mx-4 -mt-4 -mb-4 min-w-0">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4 flex-1">
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Peças & Estoque</h1>
            <p className="text-[10px] text-slate-500 font-medium">Controle de estoque e movimentações</p>
          </div>
          <div className="h-6 w-px bg-slate-200 hidden md:block mx-2" />
          
          {/* Stats Inline */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Package size={14} className="text-blue-600" />
              <span className="text-xs text-slate-600"><strong>{stats.total}</strong> peças</span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-yellow-600" />
              <span className="text-xs text-slate-600"><strong>{stats.low_stock}</strong> baixo</span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <XCircle size={14} className="text-red-600" />
              <span className="text-xs text-slate-600"><strong>{stats.zero_stock}</strong> zerado</span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <DollarSign size={14} className="text-green-600" />
              <span className="text-xs text-slate-600"><strong>{formatCurrency(stats.total_value || 0)}</strong></span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden lg:block mx-2" />
          <div className="relative flex-1 max-w-md hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por nome, código..."
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border-transparent rounded-lg text-sm focus:ring-slate-900 focus:bg-white transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="h-9 px-3 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-2 transition-all">
            <Upload size={14} /> <span className="hidden sm:inline">Importar</span>
          </button>
          <button className="h-9 px-3 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-2 transition-all">
            <Download size={14} /> <span className="hidden sm:inline">Exportar</span>
          </button>
          <button
            onClick={() => setShowNewPartModal(true)}
            className="h-9 px-4 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm whitespace-nowrap"
          >
            <Plus size={16} /> Nova Peça
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center gap-4 overflow-x-auto no-scrollbar mt-[25px]">
        <div className="flex items-center gap-2 shrink-0">
          <Filter size={14} className="text-slate-400" />
          <select
            className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Todas Categorias</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="h-4 w-px bg-slate-200 shrink-0" />
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Marca:</span>
          <select
            className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer"
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
          >
            <option value="">Todas</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>
        <div className="h-4 w-px bg-slate-200 shrink-0" />
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Fornecedor:</span>
          <select
            className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer"
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
          >
            <option value="">Todos</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="h-4 w-px bg-slate-200 shrink-0" />
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Status:</span>
          <select
            className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="low">Estoque Baixo</option>
            <option value="zero">Estoque Zerado</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto bg-white min-h-0 min-w-0 w-full relative pb-5">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead className="sticky top-0 bg-slate-50 z-20 shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]">
            <tr>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Código</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nome</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Categoria</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Marca</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fornecedor</th>
              <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Custo</th>
              <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Venda</th>
              <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Margem</th>
              <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estoque</th>
              <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center text-slate-500 text-sm">
                  Carregando...
                </td>
              </tr>
            ) : parts.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center text-slate-500 text-sm">
                  Nenhuma peça encontrada
                </td>
              </tr>
            ) : (
              parts.map((part) => {
                const status = getStockStatus(part);
                const margin = part.sale_price > 0 ? ((part.sale_price - part.cost_price) / part.sale_price * 100) : 0;
                return (
                  <tr key={part.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-slate-600">{part.code}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{part.name}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{part.category || "-"}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{part.brand || "-"}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {part.supplier_name ? (
                        <button 
                          onClick={() => setSelectedSupplier(part.supplier_id!)}
                          className="text-indigo-600 font-medium hover:underline text-left block"
                        >
                          {part.supplier_name}
                        </button>
                      ) : "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-900 text-right font-medium">{formatCurrency(part.cost_price)}</td>
                    <td className="px-4 py-3 text-xs text-slate-900 text-right font-medium">{formatCurrency(part.sale_price)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 text-right">{margin.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-xs text-slate-900 text-center font-medium">
                      {part.stock_quantity} / {part.min_stock}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openDetails(part)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="Detalhes da Peça"
                        >
                          <Info size={16} />
                        </button>
                        <button
                          onClick={() => { setSelectedPart(part); setShowEntryModal(true); }}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Entrada"
                        >
                          <Upload size={16} />
                        </button>
                        <button
                          onClick={() => { setSelectedPart(part); setShowExitModal(true); }}
                          className="p-1.5 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                          title="Saída"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => openHistory(part)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Histórico"
                        >
                          <History size={16} />
                        </button>
                        <button
                          onClick={() => handleDeletePart(part.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Part Detail Modal */}
      <AnimatePresence>
        {showDetailModal && partDetails && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Info size={18} className="text-indigo-600" />
                    Detalhes da Peça: {partDetails.name}
                  </h2>
                  <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">CÓD: {partDetails.code} {partDetails.supplier_code && `| FORN: ${partDetails.supplier_code}`}</p>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-900 p-2 hover:bg-slate-200 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto w-full space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Custo Médio</p>
                    <p className="text-lg font-black text-rose-600">{formatCurrency(partDetails.cost_price)}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Preço Venda</p>
                    <p className="text-lg font-black text-emerald-600">{formatCurrency(partDetails.sale_price)}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Margem</p>
                    <p className="text-lg font-black text-indigo-600">
                      {partDetails.sale_price > 0 ? ((partDetails.sale_price - partDetails.cost_price) / partDetails.sale_price * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Estoque</p>
                    <p className={`text-lg font-black ${partDetails.stock_quantity <= partDetails.min_stock ? 'text-rose-600' : 'text-slate-900'}`}>{partDetails.stock_quantity} un.</p>
                  </div>
                </div>

                {partDetails.supplier_name && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Building2 size={14} className="text-indigo-500" />
                      Dados do Fornecedor Preferencial
                    </h3>
                    <div className="border border-indigo-100 bg-indigo-50/30 rounded-xl p-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase">Fornecedor</p>
                        <p className="text-sm font-bold text-slate-900">{partDetails.supplier_name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase">Telefone / WhatsApp</p>
                        <p className="text-sm font-bold text-slate-900 flex items-center gap-1">
                          <Phone size={12} className="text-slate-400" />
                          {partDetails.supplier_phone || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase">Última Compra</p>
                        <p className="text-sm font-bold text-slate-900 flex items-center gap-1">
                          <Calendar size={12} className="text-slate-400" />
                          {partDetails.last_purchase_date ? new Date(partDetails.last_purchase_date).toLocaleDateString("pt-BR") : 'Nunca ou não registrado'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase">Custo na Última Compra</p>
                        <p className="text-sm font-bold text-slate-900">
                          {partDetails.last_cost ? formatCurrency(partDetails.last_cost) : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">Categoria</p>
                    <p className="text-sm font-bold text-slate-900">{partDetails.category || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">Marca</p>
                    <p className="text-sm font-bold text-slate-900">{partDetails.brand || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">Localização</p>
                    <p className="text-sm font-bold text-slate-900">{partDetails.location || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">Compatibilidade</p>
                    <p className="text-sm font-medium text-slate-700">{partDetails.compatibility || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">Observações</p>
                    <p className="text-sm font-medium text-slate-700 whitespace-pre-line">{partDetails.notes || '-'}</p>
                  </div>
                </div>

                <div>
                   <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2 mt-2">
                     <History size={14} className="text-slate-500" />
                     Últimas Movimentações Relacionadas
                   </h3>
                   {movements.length > 0 ? (
                     <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
                        <table className="w-full text-xs">
                           <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                              <tr>
                                <th className="px-3 py-2 text-left font-bold w-12">Data</th>
                                <th className="px-3 py-2 text-left font-bold">Tipo</th>
                                <th className="px-3 py-2 text-center font-bold">Qtd</th>
                                <th className="px-3 py-2 text-right font-bold hidden sm:table-cell">NF/OS</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                             {movements.slice(0, 5).map(m => (
                               <tr key={m.id} className="hover:bg-slate-50/50">
                                  <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{new Date(m.created_at).toLocaleDateString("pt-BR", {day:'2-digit', month:'2-digit', year:'2-digit'})}</td>
                                  <td className="px-3 py-2">
                                    <span className={`font-bold ${movementTypes[m.type].color}`}>{movementTypes[m.type].label}</span>
                                    <span className="block text-[9px] text-slate-400 mt-0.5">{m.reason || '-'}</span>
                                  </td>
                                  <td className={`px-3 py-2 text-center font-bold ${['ENTRY', 'ADJUSTMENT'].includes(m.type) ? 'text-green-600' : 'text-rose-600'}`}>
                                    {['ENTRY', 'ADJUSTMENT'].includes(m.type) ? '+' : '-'}{m.quantity}
                                  </td>
                                  <td className="px-3 py-2 text-right font-mono text-slate-500 hidden sm:table-cell">{m.invoice_number || '-'}</td>
                               </tr>
                             ))}
                           </tbody>
                        </table>
                     </div>
                   ) : (
                     <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-xl text-center">Nenhuma movimentação registrada.</p>
                   )}
                </div>

              </div>

              <div className="p-6 border-t border-slate-100 flex gap-3 shrink-0 bg-slate-50/50 rounded-b-2xl">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="w-full py-3 border border-slate-200 bg-white rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all shadow-sm"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        {/* New Part Modal */}
        <AnimatePresence>
          {showNewPartModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
              >
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Nova Peça</h2>
                    <p className="text-[10px] text-slate-500 font-medium">Cadastre uma nova peça no estoque</p>
                  </div>
                  <button onClick={() => setShowNewPartModal(false)} className="text-slate-400 hover:text-slate-900 p-2 hover:bg-slate-200 rounded-full transition-all">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreatePart} className="p-6 overflow-y-auto space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Nome da Peça</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none"
                        placeholder="Ex: Pastilha de Freio Dianteira"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Fornecedor Preferencial</label>
                      <select
                        value={formData.supplier_id}
                        onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none"
                      >
                        <option value="">Nenhum</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Código Interno</label>
                      <input
                        type="text"
                        required
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none"
                        placeholder="PÇ-001"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Código Fornecedor</label>
                      <input
                        type="text"
                        value={formData.supplier_code}
                        onChange={(e) => setFormData({ ...formData, supplier_code: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none"
                        placeholder="Código do fornecedor"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Categoria</label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none"
                        list="categories"
                        placeholder="Selecione ou digite"
                      />
                      <datalist id="categories">
                        {categories.map((cat) => <option key={cat} value={cat} />)}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Marca</label>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none"
                        list="brands"
                        placeholder="Selecione ou digite"
                      />
                      <datalist id="brands">
                        {brands.map((brand) => <option key={brand} value={brand} />)}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Localização</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none"
                        placeholder="Ex: Prateleira A1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Preço de Custo</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={formData.cost_price}
                          onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none"
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Preço de Venda</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={formData.sale_price}
                          onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none font-bold"
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Quantidade Inicial</label>
                      <input
                        type="number"
                        value={formData.stock_quantity}
                        onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Estoque Mínimo</label>
                      <input
                        type="number"
                        value={formData.min_stock}
                        onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Compatibilidade com Veículos</label>
                    <input
                      type="text"
                      value={formData.compatibility}
                      onChange={(e) => setFormData({ ...formData, compatibility: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none"
                      placeholder="Ex: Gol G5, Fox, Voyage, Up..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Observações</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none resize-none"
                      rows={3}
                      placeholder="Informações adicionais sobre a peça..."
                    />
                  </div>
                </form>

                <div className="p-6 border-t border-slate-100 flex gap-3 shrink-0 bg-slate-50/50 rounded-b-2xl">
                  <button
                    onClick={() => setShowNewPartModal(false)}
                    className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={(e: any) => { const form = e.target.closest('.flex').previousElementSibling as HTMLFormElement; form?.requestSubmit(); }}
                    className="flex-2 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
                  >
                    Salvar Peça
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Entry Modal */}
        <AnimatePresence>
          {showEntryModal && selectedPart && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col"
              >
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Upload size={18} className="text-green-600" />
                      Entrada de Estoque
                    </h2>
                    <p className="text-[10px] text-slate-500 font-medium">Adicionar peças ao estoque</p>
                  </div>
                  <button onClick={() => setShowEntryModal(false)} className="text-slate-400 hover:text-slate-900 p-2 hover:bg-slate-200 rounded-full transition-all">
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                    <p className="font-bold text-sm text-slate-900">{selectedPart.name}</p>
                    <p className="text-xs text-slate-600 mt-1">Código: {selectedPart.code}</p>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-blue-100">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Estoque Atual</p>
                        <p className="text-lg font-bold text-slate-900">{selectedPart.stock_quantity}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Custo Padrão</p>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(selectedPart.cost_price)}</p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleStockEntry} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Quantidade</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={entryData.quantity}
                        onChange={(e) => setEntryData({ ...entryData, quantity: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none font-bold"
                        placeholder="Quantidade a adicionar"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Custo Unitário</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={entryData.unit_cost}
                          onChange={(e) => setEntryData({ ...entryData, unit_cost: e.target.value })}
                          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none"
                          placeholder={selectedPart.cost_price.toFixed(2)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Nota Fiscal</label>
                      <input
                        type="text"
                        value={entryData.invoice_number}
                        onChange={(e) => setEntryData({ ...entryData, invoice_number: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none"
                        placeholder="Número da NF (opcional)"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Motivo</label>
                      <input
                        type="text"
                        value={entryData.reason}
                        onChange={(e) => setEntryData({ ...entryData, reason: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none"
                        placeholder="Compra, devolução, transferência..."
                      />
                    </div>
                  </form>
                </div>

                <div className="p-6 border-t border-slate-100 flex gap-3 shrink-0 bg-slate-50/50 rounded-b-2xl">
                  <button
                    onClick={() => setShowEntryModal(false)}
                    className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={(e: any) => { const form = e.target.closest('.flex').previousElementSibling.querySelector('form') as HTMLFormElement; form?.requestSubmit(); }}
                    className="flex-2 py-3 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-600/20"
                  >
                    Registrar Entrada
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Exit Modal */}
        <AnimatePresence>
          {showExitModal && selectedPart && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col"
              >
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Download size={18} className="text-orange-600" />
                      Saída de Estoque
                    </h2>
                    <p className="text-[10px] text-slate-500 font-medium">Remover peças do estoque</p>
                  </div>
                  <button onClick={() => setShowExitModal(false)} className="text-slate-400 hover:text-slate-900 p-2 hover:bg-slate-200 rounded-full transition-all">
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6">
                  <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-6">
                    <p className="font-bold text-sm text-slate-900">{selectedPart.name}</p>
                    <p className="text-xs text-slate-600 mt-1">Código: {selectedPart.code}</p>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-orange-100">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Estoque Disponível</p>
                        <p className="text-lg font-bold text-slate-900">{selectedPart.stock_quantity}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Estoque Mínimo</p>
                        <p className="text-lg font-bold text-orange-600">{selectedPart.min_stock}</p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleStockExit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Quantidade</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max={selectedPart.stock_quantity}
                        value={exitData.quantity}
                        onChange={(e) => setExitData({ ...exitData, quantity: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none font-bold"
                        placeholder="Quantidade a remover"
                      />
                      <p className="text-xs text-slate-500 mt-1.5">Máximo: {selectedPart.stock_quantity} unidades</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Motivo da Saída</label>
                      <input
                        type="text"
                        required
                        value={exitData.reason}
                        onChange={(e) => setExitData({ ...exitData, reason: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none"
                        placeholder="Perda, devolução, uso interno..."
                      />
                    </div>
                  </form>
                </div>

                <div className="p-6 border-t border-slate-100 flex gap-3 shrink-0 bg-slate-50/50 rounded-b-2xl">
                  <button
                    onClick={() => setShowExitModal(false)}
                    className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={(e: any) => { const form = e.target.closest('.flex').previousElementSibling.querySelector('form') as HTMLFormElement; form?.requestSubmit(); }}
                    className="flex-2 py-3 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20"
                  >
                    Registrar Saída
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* History Modal */}
        <AnimatePresence>
          {showHistoryModal && selectedPart && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
              >
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <History size={18} className="text-blue-600" />
                      Histórico de Movimentações
                    </h2>
                    <p className="text-[10px] text-slate-500 font-medium">Todas as movimentações desta peça</p>
                  </div>
                  <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-900 p-2 hover:bg-slate-200 rounded-full transition-all">
                    <X size={20} />
                  </button>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                  <p className="font-bold text-sm text-slate-900">{selectedPart.name}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-slate-600">Código: <strong>{selectedPart.code}</strong></span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-600">Estoque: <strong className="text-blue-600">{selectedPart.stock_quantity}</strong></span>
                  </div>
                </div>

                <div className="p-6 overflow-y-auto space-y-3">
                  {movements.length === 0 ? (
                    <div className="text-center py-12">
                      <History size={48} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-sm text-slate-500">Nenhuma movimentação registrada</p>
                    </div>
                  ) : (
                    movements.map((mov) => (
                      <div key={mov.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                mov.type === 'ENTRY' ? 'bg-green-100 text-green-700' :
                                mov.type === 'EXIT' ? 'bg-red-100 text-red-700' :
                                mov.type === 'OS_USED' ? 'bg-blue-100 text-blue-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {movementTypes[mov.type]?.label || mov.type}
                              </span>
                              <span className="text-sm font-bold text-slate-900">
                                {mov.type === 'ENTRY' ? '+' : '-'}{mov.quantity} un
                              </span>
                            </div>
                            {mov.reason && (
                              <p className="text-xs text-slate-600 mb-2">{mov.reason}</p>
                            )}
                            {mov.invoice_number && (
                              <p className="text-xs text-slate-500">NF: {mov.invoice_number}</p>
                            )}
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-200">
                              <span>{new Date(mov.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              <span>•</span>
                              <span>{mov.user_name || 'Sistema'}</span>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-sm font-bold text-slate-900">{formatCurrency(mov.unit_cost)}</p>
                            <p className="text-[10px] text-slate-500">unitário</p>
                            <p className="text-xs font-bold text-slate-600 mt-1">{formatCurrency(mov.unit_cost * mov.quantity)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-6 border-t border-slate-100 shrink-0 bg-slate-50/50 rounded-b-2xl">
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="w-full py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
                  >
                    Fechar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
    </div>
  );
}
