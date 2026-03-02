import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  Building2,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  Package,
  AlertCircle,
  X,
  Edit,
  Trash2,
  ShoppingCart,
  FileText,
  Star,
  Calendar,
  DollarSign,
  Truck,
  Clock,
} from "lucide-react";
import api from "../services/api";

interface Supplier {
  id: string;
  name: string;
  trade_name: string;
  cnpj: string;
  phone: string;
  whatsapp: string;
  email: string;
  category: string;
  status: string;
  city: string;
  state: string;
  payment_terms: string;
  is_preferred: boolean;
  avg_delivery_days: number;
  open_orders?: number;
  last_order_date?: string;
  created_at: string;
}

interface Stats {
  total: number;
  active: number;
  preferred: number;
  open_orders: number;
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, preferred: 0, open_orders: 0 });
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");
  const [showPreferredOnly, setShowPreferredOnly] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    trade_name: "",
    cnpj: "",
    ie: "",
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    category: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    payment_terms: "",
    credit_limit: "",
    avg_delivery_days: "",
    preferred_supplier: false,
    contact_name: "",
    contact_role: "",
    contact_phone: "",
    notes: "",
  });

  useEffect(() => {
    fetchSuppliers();
    fetchStats();
    fetchCategories();
    fetchCities();
  }, []);

  useEffect(() => {
    filterSuppliers();
  }, [searchTerm, selectedCategory, selectedStatus, selectedCity, showPreferredOnly, suppliers]);

  const fetchSuppliers = async () => {
    try {
      const response = await api.get("/suppliers");
      setSuppliers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get("/suppliers/stats");
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get("/suppliers/categories");
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  const fetchCities = async () => {
    try {
      const response = await api.get("/suppliers/cities");
      setCities(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching cities:", error);
      setCities([]);
    }
  };

  const filterSuppliers = () => {
    let filtered = suppliers;

    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.cnpj.includes(searchTerm) ||
          s.phone.includes(searchTerm) ||
          s.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((s) => s.category === selectedCategory);
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((s) => s.status === selectedStatus);
    }

    if (selectedCity !== "all") {
      filtered = filtered.filter((s) => s.city === selectedCity);
    }

    if (showPreferredOnly) {
      filtered = filtered.filter((s) => s.is_preferred);
    }

    setFilteredSuppliers(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (showEditModal && selectedSupplier) {
        await api.patch(`/suppliers/${selectedSupplier.id}`, {
          ...formData,
          is_preferred: formData.preferred_supplier,
        });
      } else {
        await api.post("/suppliers", {
          ...formData,
          is_preferred: formData.preferred_supplier,
        });
      }
      fetchSuppliers();
      fetchStats();
      closeModals();
    } catch (error) {
      console.error("Error saving supplier:", error);
      alert("Erro ao salvar fornecedor");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este fornecedor?")) return;

    try {
      await api.delete(`/suppliers/${id}`);
      fetchSuppliers();
      fetchStats();
    } catch (error: any) {
      alert(error.response?.data?.error || "Erro ao excluir fornecedor");
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name || "",
      trade_name: supplier.trade_name || "",
      cnpj: supplier.cnpj || "",
      ie: "",
      phone: supplier.phone || "",
      whatsapp: supplier.whatsapp || "",
      email: supplier.email || "",
      website: "",
      category: supplier.category || "",
      address: "",
      city: supplier.city || "",
      state: supplier.state || "",
      zip_code: "",
      payment_terms: supplier.payment_terms || "",
      credit_limit: "",
      avg_delivery_days: supplier.avg_delivery_days?.toString() || "",
      preferred_supplier: supplier.is_preferred || false,
      contact_name: "",
      contact_role: "",
      contact_phone: "",
      notes: "",
    });
    setShowEditModal(true);
  };

  const handleCreateOrder = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowOrderModal(true);
  };

  const closeModals = () => {
    setShowNewModal(false);
    setShowEditModal(false);
    setShowOrderModal(false);
    setSelectedSupplier(null);
    setFormData({
      name: "",
      trade_name: "",
      cnpj: "",
      ie: "",
      phone: "",
      whatsapp: "",
      email: "",
      website: "",
      category: "",
      address: "",
      city: "",
      state: "",
      zip_code: "",
      payment_terms: "",
      credit_limit: "",
      avg_delivery_days: "",
      preferred_supplier: false,
      contact_name: "",
      contact_role: "",
      contact_phone: "",
      notes: "",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
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
            <h1 className="text-2xl font-bold text-white mb-1">Fornecedores</h1>
            <p className="text-slate-300 text-sm">Gestão completa de fornecedores e compras</p>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="h-9 px-4 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Fornecedor
          </button>
        </div>

        {/* Stats */}
        <div className="hidden lg:grid grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <p className="text-slate-300 text-xs font-medium">Total</p>
                <p className="text-white text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-300" />
              </div>
              <div>
                <p className="text-slate-300 text-xs font-medium">Ativos</p>
                <p className="text-white text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-300" />
              </div>
              <div>
                <p className="text-slate-300 text-xs font-medium">Preferenciais</p>
                <p className="text-white text-2xl font-bold">{stats.preferred}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-orange-300" />
              </div>
              <div>
                <p className="text-slate-300 text-xs font-medium">Pedidos Abertos</p>
                <p className="text-white text-2xl font-bold">{stats.open_orders}</p>
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
              placeholder="Buscar por nome, CNPJ, telefone ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 h-9 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="all">Todas Categorias</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="all">Todos Status</option>
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
          </select>

          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="all">Todas Cidades</option>
            {cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          <button
            onClick={() => setShowPreferredOnly(!showPreferredOnly)}
            className={`h-9 px-4 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              showPreferredOnly
                ? "bg-yellow-500 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Star className="w-4 h-4" />
            Preferenciais
          </button>
        </div>
        <div className="mt-3 text-sm text-slate-500">
          {filteredSuppliers.length} fornecedores encontrados
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">
                Fornecedor
              </th>
              <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">
                Contato
              </th>
              <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">
                Localização
              </th>
              <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">
                Categoria
              </th>
              <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">
                Pagamento
              </th>
              <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">
                Prazo Entrega
              </th>
              <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">
                Último Pedido
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
            {filteredSuppliers.map((supplier) => (
              <tr key={supplier.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {supplier.is_preferred && (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    )}
                    <div>
                      <div className="font-medium text-slate-900">{supplier.name}</div>
                      <div className="text-sm text-slate-500">{supplier.cnpj}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="w-3 h-3" />
                      {supplier.phone}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="w-3 h-3" />
                      {supplier.email}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-3 h-3" />
                    {supplier.city} - {supplier.state}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {supplier.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {supplier.payment_terms || "-"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Truck className="w-3 h-3" />
                    {supplier.avg_delivery_days} dias
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-600">
                    {supplier.last_order_date ? formatDate(supplier.last_order_date) : "Nunca"}
                  </div>
                  {supplier.open_orders ? (
                    <div className="text-xs text-orange-600 font-medium">
                      {supplier.open_orders} pedidos abertos
                    </div>
                  ) : null}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      supplier.status === "ACTIVE"
                        ? "bg-green-100 text-green-800"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {supplier.status === "ACTIVE" ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleCreateOrder(supplier)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Criar Pedido"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(supplier)}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(supplier.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredSuppliers.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Nenhum fornecedor encontrado</p>
            <p className="text-slate-400 text-sm mt-1">
              Ajuste os filtros ou cadastre um novo fornecedor
            </p>
          </div>
        )}
      </div>

      {/* New/Edit Modal */}
      <AnimatePresence>
        {(showNewModal || showEditModal) && (
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
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden pointer-events-auto"
              >
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">
                    {showEditModal ? "Editar Fornecedor" : "Novo Fornecedor"}
                  </h2>
                  <button
                    onClick={closeModals}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                  {/* Basic Info */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
                      Dados Básicos
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                          Razão Social *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                          Nome Fantasia
                        </label>
                        <input
                          type="text"
                          value={formData.trade_name}
                          onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                          CNPJ *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.cnpj}
                          onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                          Inscrição Estadual
                        </label>
                        <input
                          type="text"
                          value={formData.ie}
                          onChange={(e) => setFormData({ ...formData, ie: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                          Categoria *
                        </label>
                        <input
                          type="text"
                          required
                          list="categories-list"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                        <datalist id="categories-list">
                          {categories.map((cat) => (
                            <option key={cat} value={cat} />
                          ))}
                        </datalist>
                      </div>

                      <div className="flex items-center gap-2 pt-6">
                        <input
                          type="checkbox"
                          id="preferred"
                          checked={formData.preferred_supplier}
                          onChange={(e) =>
                            setFormData({ ...formData, preferred_supplier: e.target.checked })
                          }
                          className="w-4 h-4 text-slate-600 border-slate-300 rounded focus:ring-slate-500"
                        />
                        <label htmlFor="preferred" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          Fornecedor Preferencial
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
                      Contato
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                          Telefone *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                          WhatsApp
                        </label>
                        <input
                          type="text"
                          value={formData.whatsapp}
                          onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                          E-mail *
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                          Website
                        </label>
                        <input
                          type="text"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
                      Endereço
                    </h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="col-span-4">
                        <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                          Endereço
                        </label>
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                          Cidade *
                        </label>
                        <input
                          type="text"
                          required
                          list="cities-list"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                        <datalist id="cities-list">
                          {cities.map((city) => (
                            <option key={city} value={city} />
                          ))}
                        </datalist>
                      </div>

                      <div>
                        <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                          UF *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={2}
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                          CEP
                        </label>
                        <input
                          type="text"
                          value={formData.zip_code}
                          onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Commercial */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
                      Informações Comerciais
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                          Condições de Pagamento
                        </label>
                        <input
                          type="text"
                          value={formData.payment_terms}
                          onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                          placeholder="Ex: 30/60 dias"
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                          Limite de Crédito (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.credit_limit}
                          onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                          Prazo Médio de Entrega (dias)
                        </label>
                        <input
                          type="number"
                          value={formData.avg_delivery_days}
                          onChange={(e) => setFormData({ ...formData, avg_delivery_days: e.target.value })}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mb-6">
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                      Observações
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3">
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
                      {showEditModal ? "Salvar Alterações" : "Cadastrar Fornecedor"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
