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
  FilePlus,
  FileText,
  Star,
  Calendar,
  DollarSign,
  Truck,
  Clock,
  CheckCircle,
  Info,
  ArrowRight,
  ChevronDown,
  ClipboardList,
} from "lucide-react";
import api from "../services/api";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  // New Part Inline
  const [showNewPartModal, setShowNewPartModal] = useState(false);
  const [partFormData, setPartFormData] = useState({ name: '', code: '', cost_price: 0, sale_price: 0 });
  const [categories, setCategories] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [parts, setParts] = useState<any[]>([]);
  const [orderData, setOrderData] = useState({
    expected_delivery: "",
    freight: 0,
    discount: 0,
    notes: "",
    items: [] as any[],
  });
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [showOrdersList, setShowOrdersList] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [showPODetail, setShowPODetail] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({ show: false, type: 'info', title: '', message: '' });

  const showNotification = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setNotification({ show: true, type, title, message });
  };

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

  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetchSuppliers();
    fetchStats();
    fetchCategories();
    fetchCities();
    fetchPurchaseOrders();
    fetchTenantSettings();
  }, []);

  const fetchTenantSettings = async () => {
    try {
      const res = await api.get('/settings/tenant');
      setSettings(res.data);
    } catch (err) {
      console.error('Error fetching tenant settings:', err);
    }
  };

  useEffect(() => {
    filterSuppliers();
  }, [searchTerm, selectedCategory, selectedStatus, selectedCity, showPreferredOnly, suppliers]);

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

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

  const fetchPurchaseOrders = async () => {
    try {
      const response = await api.get("/purchase-orders");
      setPurchaseOrders(response.data);
    } catch (error) {
      console.error("Error fetching POs:", error);
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
      showNotification('error', 'Erro', 'Não foi possível salvar o fornecedor.');
    }
  };

  const handleDeleteClick = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!supplierToDelete) return;

    try {
      await api.delete(`/suppliers/${supplierToDelete.id}`);
      fetchSuppliers();
      fetchStats();
      showNotification('success', 'Sucesso', 'Fornecedor excluído com sucesso.');
      setDeleteConfirmOpen(false);
      setSupplierToDelete(null);
    } catch (error: any) {
      showNotification('error', 'Erro', error.response?.data?.error || "Erro ao excluir fornecedor.");
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
    setOrderData({
      expected_delivery: "",
      freight: 0,
      discount: 0,
      notes: "",
      items: [],
    });
    setShowOrderModal(true);
    fetchParts();
  };

  const fetchParts = async () => {
    try {
      const res = await api.get('/parts');
      setParts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateNewPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    try {
      const res = await api.post('/parts', {
        ...partFormData,
        supplier_id: selectedSupplier.id,
        stock_quantity: 0,
        min_stock: 0
      });
      showNotification('success', 'Sucesso', 'Peça cadastrada e vinculada com sucesso!');
      setShowNewPartModal(false);
      setPartFormData({ name: '', code: '', cost_price: 0, sale_price: 0 });
      
      const newPartsListRes = await api.get('/parts');
      setParts(newPartsListRes.data);
      
      // Auto-add to order
      setOrderData({
        ...orderData,
        items: [...orderData.items, { part_id: res.data.id, quantity: 1, unit_cost: res.data.cost_price }]
      });
    } catch (err) {
      showNotification('error', 'Erro', 'Falha ao cadastrar a peça.');
    }
  };

  const handleAddOrderItem = () => {
    setOrderData({
      ...orderData,
      items: [...orderData.items, { part_id: "", quantity: 1, unit_cost: 0 }]
    });
  };

  const handleRemoveOrderItem = (index: number) => {
    const newItems = [...orderData.items];
    newItems.splice(index, 1);
    setOrderData({ ...orderData, items: newItems });
  };

  const handleUpdateOrderItem = (index: number, field: string, value: any) => {
    const newItems = [...orderData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // If part_id changed, try to auto-fill unit_cost if available in parts list
    if (field === 'part_id') {
      const part = parts.find(p => p.id === value);
      if (part) {
        newItems[index].unit_cost = part.cost_price || 0;
      }
    }
    
    setOrderData({ ...orderData, items: newItems });
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    if (orderData.items.length === 0) {
      showNotification('error', 'Erro', 'Adicione pelo menos um item ao pedido.');
      return;
    }

    try {
      await api.post('/purchase-orders', {
        supplier_id: selectedSupplier.id,
        ...orderData
      });
      showNotification('success', 'Sucesso', 'Pedido de compra criado com sucesso!');
      setShowOrderModal(false);
      setShowOrdersList(true);
      fetchStats();
      fetchPurchaseOrders();
    } catch (err) {
      showNotification('error', 'Erro', 'Falha ao criar pedido de compra.');
    }
  };

  const handleViewPODetail = async (poId: string) => {
    try {
      const res = await api.get(`/purchase-orders/${poId}`);
      setSelectedPO(res.data);
      setShowPODetail(true);
    } catch (err) {
      showNotification('error', 'Erro', 'Falha ao carregar detalhes do pedido.');
    }
  };

  const handleReceivePO = async (poId: string) => {
    if (!selectedPO) return;
    try {
      const itemsToReceive = selectedPO.items.map((item: any) => ({
        item_id: item.id,
        received_quantity: item.quantity // Receiving all for simplicity in this flow
      }));
      
      await api.post(`/purchase-orders/${poId}/receive`, {
        items: itemsToReceive,
        invoice_number: `REC-${Date.now()}`
      });
      
      showNotification('success', 'Pedido Recebido!', '📦 Estoque atualizado · 💰 Saída registrada no Fluxo de Caixa · 🔗 Fornecedor vinculado às peças');
      // Refresh PO detail to show received status
      const updated = await api.get(`/purchase-orders/${poId}`);
      setSelectedPO(updated.data);
      fetchStats();
      fetchPurchaseOrders();
    } catch (err) {
      showNotification('error', 'Erro', 'Falha ao registrar recebimento.');
    }
  };

  const handleUpdatePOStatus = async (poId: string, status: string) => {
    try {
      await api.patch(`/purchase-orders/${poId}/status`, { status });
      const msg = status === 'CONFIRMED' ? 'Pedido Confirmado! Agora ele aguarda recebimento.' : 'Status atualizado.';
      showNotification('success', 'Sucesso', msg);
      // Refresh
      const updated = await api.get(`/purchase-orders/${poId}`);
      setSelectedPO(updated.data);
      fetchStats();
      fetchPurchaseOrders();
    } catch (err) {
      showNotification('error', 'Erro', 'Falha ao atualizar status do pedido.');
    }
  };

  const handleDownloadPOPDF = async (po: any) => {
    try {
      // Fetch full PO details (list view doesn't include items)
      const res = await api.get(`/purchase-orders/${po.id}`);
      const fullPO = res.data;

      const doc = new jsPDF() as any;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      
      // --- COLORS ---
      const primaryColor = [30, 41, 59] as [number, number, number];
      const accentColor = [79, 70, 229] as [number, number, number];
      const lightGray = [248, 250, 252] as [number, number, number];
      const borderColor = [226, 232, 240] as [number, number, number];
      
      // --- HEADER ---
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      let logoLoaded = false;
      if (settings?.logo_url) {
        try {
          const format = settings.logo_url.includes('png') ? 'PNG' : 
                        settings.logo_url.includes('jpg') || settings.logo_url.includes('jpeg') ? 'JPEG' : 'PNG';
          doc.addImage(settings.logo_url, format, margin, 8, 24, 24);
          logoLoaded = true;
        } catch (e) {
          console.error('Error adding logo to PO PDF:', e);
        }
      }

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(settings?.trade_name || settings?.company_name || 'Workshop Name', logoLoaded ? margin + 28 : margin, 18);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const companySubtext = [
        settings?.cnpj ? `CNPJ: ${settings.cnpj}` : '',
        settings?.address ? settings.address : '',
        settings?.phone ? `Fone: ${settings.phone}` : ''
      ].filter(Boolean).join('  |  ');
      doc.text(companySubtext, logoLoaded ? margin + 28 : margin, 24);

      doc.setFontSize(12);
      doc.text(`PEDIDO DE COMPRA`, pageWidth - margin, 18, { align: 'right' });
      doc.setFontSize(22);
      doc.text(`#${fullPO.number}`, pageWidth - margin, 28, { align: 'right' });

      // Secondary Header
      doc.setTextColor(...primaryColor);
      doc.setFontSize(8);
      let currentY = 50;
      doc.text(`Data do Pedido: ${formatDate(fullPO.order_date)}`, margin, currentY);
      const statusText = fullPO.status === 'RECEIVED' ? 'RECEBIDO' : fullPO.status === 'DRAFT' ? 'RASCUNHO' : 'PENDENTE';
      doc.text(`Status: ${statusText}`, pageWidth / 2, currentY, { align: 'center' });
      
      currentY += 8;
      doc.setDrawColor(...borderColor);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 10;

      // --- SUPPLIER INFO BOX ---
      const boxWidth = pageWidth - (margin * 2);
      const boxHeight = 25;

      doc.setFillColor(...lightGray);
      doc.rect(margin, currentY, boxWidth, boxHeight, 'F');
      doc.setDrawColor(...borderColor);
      doc.rect(margin, currentY, boxWidth, boxHeight, 'S');
      
      doc.setTextColor(...accentColor);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('DADOS DO FORNECEDOR', margin + 5, currentY + 7);
      
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(fullPO.supplier_name, margin + 5, currentY + 13);
      doc.setFontSize(8);
      doc.text(`${fullPO.supplier?.email || 'Sem email'}  |  ${fullPO.supplier?.phone || 'Sem telefone'}`, margin + 5, currentY + 18);

      currentY += boxHeight + 10;

      // Items Table
      const items = fullPO.items || [];
      if (items.length > 0) {
        autoTable(doc, {
          startY: currentY,
          head: [[{ content: 'ITENS DO PEDIDO', colSpan: 4, styles: { halign: 'center', fillColor: primaryColor } }], ['Produto/Material', 'Qtd', 'Unitário', 'Subtotal']],
          body: items.map((i: any) => [
            i.product_name || i.description || '---', 
            i.quantity, 
            `R$ ${parseFloat(i.unit_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            `R$ ${(i.quantity * i.unit_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          ]),
          styles: { fontSize: 8, cellPadding: 3 },
          headStyles: { fillColor: [51, 65, 85], fontStyle: 'bold' },
          columnStyles: {
            1: { halign: 'center' },
            2: { halign: 'right' },
            3: { halign: 'right', fontStyle: 'bold' }
          },
          alternateRowStyles: { fillColor: [252, 252, 252] }
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 10;
        if (currentY > 230) { doc.addPage(); currentY = 20; }
        
        const totalsWidth = 60;
        const totalsX = pageWidth - margin - totalsWidth;
        
        doc.setFillColor(...lightGray);
        doc.rect(totalsX, currentY, totalsWidth, 15, 'F');
        doc.setDrawColor(...borderColor);
        doc.rect(totalsX, currentY, totalsWidth, 15, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...accentColor);
        doc.text(`TOTAL GERAL:`, totalsX + 5, currentY + 9);
        doc.text(`R$ ${fullPO.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - margin - 5, currentY + 9, { align: 'right' });
      }

      if (fullPO.notes) {
        currentY += 25;
        if (currentY > 240) { doc.addPage(); currentY = 20; }
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('OBSERVAÇÕES:', margin, currentY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(doc.splitTextToSize(fullPO.notes, pageWidth - margin * 2), margin, currentY + 5);
      }

      doc.save(`Pedido_${fullPO.number}.pdf`);
    } catch (err) {
      console.error(err);
      showNotification('error', 'Erro', 'Falha ao gerar PDF do pedido.');
    }
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
    setPartFormData({ name: '', code: '', cost_price: 0, sale_price: 0 });
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
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50 overflow-hidden lg:-mx-5 lg:mt-0 lg:mb-0 -mx-4 -mt-4 -mb-4 min-w-0">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-4 flex-1">
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Fornecedores</h1>
            <p className="text-[10px] text-slate-500 font-medium whitespace-nowrap">Gestão completa e compras</p>
          </div>
          <div className="h-6 w-px bg-slate-200 hidden md:block mx-2" />
          
          {/* Stats Inline */}
          <div className="hidden lg:flex items-center gap-4 cursor-pointer" onClick={() => setShowOrdersList(true)}>
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-blue-600" />
              <span className="text-xs text-slate-600"><strong>{stats.total}</strong> <span className="hidden xl:inline">fornecedores</span></span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <Star size={14} className="text-yellow-500" />
              <span className="text-xs text-slate-600"><strong>{stats.preferred}</strong> <span className="hidden xl:inline">preferenciais</span></span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-orange-500" />
              <span className="text-xs text-slate-600"><strong>{stats.open_orders}</strong> <span className="hidden xl:inline">pedidos abertos</span></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowOrdersList(!showOrdersList)}
            className="h-9 px-3 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <ClipboardList size={14} /> <span className="hidden sm:inline">{showOrdersList ? "Ver Fornecedores" : "Ver Pedidos"}</span>
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="h-9 px-4 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm whitespace-nowrap cursor-pointer"
          >
            <Plus size={16} /> Novo Fornecedor
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center gap-4 overflow-x-auto no-scrollbar shrink-0">
        <div className="relative flex-1 min-w-[200px] max-w-xs shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input 
            type="text" 
            placeholder="Buscar fornecedores..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="h-4 w-px bg-slate-200 shrink-0" />
        <div className="flex items-center gap-2 shrink-0">
          <Filter size={14} className="text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer"
          >
            <option value="all">Todas Categorias</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="h-4 w-px bg-slate-200 shrink-0" />
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer"
          >
            <option value="all">Todos Status</option>
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
          </select>
        </div>
        <div className="h-4 w-px bg-slate-200 shrink-0" />
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Cidade:</span>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer"
          >
            <option value="all">Todas Cidades</option>
            {cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
        <div className="h-4 w-px bg-slate-200 shrink-0" />
        <button
          onClick={() => setShowPreferredOnly(!showPreferredOnly)}
          className={`h-6 px-2 rounded text-[10px] font-bold transition-colors flex items-center gap-1 uppercase tracking-wider shrink-0 ${
            showPreferredOnly
              ? "bg-yellow-100 text-yellow-700"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          <Star className="w-3 h-3" />
          Preferenciais
        </button>
      </div>

        {showOrdersList ? (
          <div className="p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Lista de Pedidos de Compra</h2>
            <div className="border border-slate-200 rounded-2xl overflow-x-auto w-full pb-5">
              <table className="w-full text-sm min-w-[900px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left">Número</th>
                    <th className="px-6 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left">Fornecedor</th>
                    <th className="px-6 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left">Data</th>
                    <th className="px-6 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Total</th>
                    <th className="px-6 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
                    <th className="px-6 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right sticky right-0 bg-slate-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)] z-20">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {purchaseOrders.map(po => (
                    <tr key={po.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-indigo-600">{po.number}</td>
                      <td className="px-6 py-4 text-slate-700">{po.supplier_name}</td>
                      <td className="px-6 py-4 text-slate-500">{formatDate(po.order_date)}</td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900">
                        R$ {po.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                          po.status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-700' :
                          po.status === 'DRAFT' ? 'bg-slate-100 text-slate-600' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {po.status === 'RECEIVED' ? 'RECEBIDO' : 
                           po.status === 'DRAFT' ? 'RASCUNHO' : 'PENDENTE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right sticky right-0 bg-white group-hover:bg-slate-50 transition-colors shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.02)] z-10">
                        <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                          <button 
                            onClick={() => handleDownloadPOPDF(po)}
                            className="text-slate-400 hover:text-rose-600 p-2 rounded-lg transition-all"
                            title="Baixar PDF"
                          >
                            <FileText size={18} />
                          </button>
                          <button 
                            onClick={() => handleViewPODetail(po.id)}
                            className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-all"
                            title="Ver Detalhes"
                          >
                            <ArrowRight size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {purchaseOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                        Nenhum pedido de compra encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto bg-slate-50/30 min-h-0 min-w-0 w-full relative pb-5">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fornecedor</th>
                  <th className="px-6 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categoria</th>
                  <th className="px-6 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contato</th>
                  <th className="px-6 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Localização</th>
                  <th className="px-6 py-2.5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky right-0 bg-white shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)] z-20">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-white transition-colors border border-slate-100">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {supplier.name}
                            {supplier.is_preferred && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 inline ml-1" />}
                          </p>
                          <p className="text-xs text-slate-500 font-medium">{supplier.trade_name || supplier.cnpj}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 uppercase tracking-wider">
                        {supplier.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${
                        supplier.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {supplier.status === 'ACTIVE' ? 'ATIVO' : 'INATIVO'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {supplier.phone}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {supplier.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {supplier.city} - {supplier.state}
                      </div>
                    </td>
                    <td className="px-6 py-4 sticky right-0 bg-white group-hover:bg-indigo-50/30 transition-colors shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.02)] z-10">
                      <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleCreateOrder(supplier)}
                          className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-slate-200 rounded-xl transition-all"
                          title="Novo Pedido de Compra"
                        >
                          <FilePlus className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-200 rounded-xl transition-all"
                          title="Editar"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(supplier)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-200 rounded-xl transition-all"
                          title="Excluir"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredSuppliers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Search className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-lg font-medium">Nenhum fornecedor encontrado</p>
                        <p className="text-sm">Tente ajustar seus filtros de busca</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ... existing modal logic ... */}

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

      {/* Purchase Order Modal */}
      <AnimatePresence>
        {showOrderModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110]"
              onClick={closeModals}
            />
            <div className="fixed inset-0 flex items-center justify-center z-[120] p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden pointer-events-auto flex flex-col"
              >
                <div className="bg-gradient-to-r from-indigo-700 to-indigo-600 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Criar Pedido de Compra</h2>
                    <p className="text-indigo-100 text-xs">Fornecedor: {selectedSupplier?.name}</p>
                  </div>
                  <button onClick={closeModals} className="text-white/80 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmitOrder} className="p-6 overflow-y-auto flex-1 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Previsão de Entrega</label>
                      <input 
                        type="date" 
                        required
                        className="w-full h-10 px-4 border border-slate-200 rounded-xl text-sm"
                        value={orderData.expected_delivery}
                        onChange={e => setOrderData({...orderData, expected_delivery: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Itens do Pedido</h3>
                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={() => setShowNewPartModal(true)}
                          className="text-emerald-600 hover:text-emerald-700 text-xs font-bold flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg transition-all"
                        >
                          <Plus size={14} /> Nova Peça
                        </button>
                        <button 
                          type="button"
                          onClick={handleAddOrderItem}
                          className="text-indigo-600 hover:text-indigo-700 text-xs font-bold flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg transition-all"
                        >
                          <Plus size={14} /> Adicionar Existente
                        </button>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="text-left px-4 py-2 font-semibold text-slate-600">Peça / Produto</th>
                            <th className="text-center px-4 py-2 font-semibold text-slate-600 w-24">Qtd</th>
                            <th className="text-right px-4 py-2 font-semibold text-slate-600 w-32">Custo Unit.</th>
                            <th className="text-right px-4 py-2 font-semibold text-slate-600 w-32">Subtotal</th>
                            <th className="w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {orderData.items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3">
                                <select 
                                  required
                                  className="w-full h-9 bg-transparent border-none focus:ring-0 text-sm p-0"
                                  value={item.part_id}
                                  onChange={e => handleUpdateOrderItem(idx, 'part_id', e.target.value)}
                                >
                                  <option value="">Selecione a peça...</option>
                                  {parts.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input 
                                  type="number" 
                                  min="1"
                                  className="w-full h-8 text-center border border-slate-200 rounded bg-white text-sm"
                                  value={item.quantity}
                                  onChange={e => handleUpdateOrderItem(idx, 'quantity', parseInt(e.target.value))}
                                />
                              </td>
                              <td className="px-4 py-3 text-right">
                                <input 
                                  type="number" 
                                  step="0.01"
                                  className="w-full h-8 text-right border border-slate-200 rounded bg-white text-sm"
                                  value={item.unit_cost}
                                  onChange={e => handleUpdateOrderItem(idx, 'unit_cost', parseFloat(e.target.value))}
                                />
                              </td>
                              <td className="px-4 py-3 text-right font-medium text-slate-900">
                                R$ {(item.quantity * item.unit_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button type="button" onClick={() => handleRemoveOrderItem(idx)} className="text-slate-400 hover:text-rose-600 transition-colors">
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {orderData.items.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">Nenhum item adicionado</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Frete (R$)</label>
                      <input 
                        type="number" step="0.01"
                        className="w-full h-10 px-4 border border-slate-200 rounded-xl text-sm"
                        value={orderData.freight}
                        onChange={e => setOrderData({...orderData, freight: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Desconto (R$)</label>
                      <input 
                        type="number" step="0.01"
                        className="w-full h-10 px-4 border border-slate-200 rounded-xl text-sm"
                        value={orderData.discount}
                        onChange={e => setOrderData({...orderData, discount: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div className="flex flex-col justify-end items-end">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total do Pedido</span>
                      <span className="text-xl font-black text-slate-900">
                        R$ {(orderData.items.reduce((sum, i) => sum + (i.quantity * i.unit_cost), 0) + orderData.freight - orderData.discount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Observações Internas</label>
                    <textarea 
                      className="w-full p-4 border border-slate-200 rounded-xl text-sm min-h-[80px]"
                      placeholder="Alguma instrução especial para o fornecedor ou setor de compras..."
                      value={orderData.notes}
                      onChange={e => setOrderData({...orderData, notes: e.target.value})}
                    ></textarea>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onClick={closeModals} className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium">Cancelar</button>
                    <button type="submit" className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-bold shadow-lg shadow-indigo-100">Gerar Pedido de Compra</button>
                  </div>
                </form>
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
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Excluir Fornecedor</h3>
                  <p className="text-slate-600 text-sm mb-6">
                    Tem certeza que deseja excluir o fornecedor <span className="font-bold text-slate-900">{supplierToDelete?.name}</span>? Esta ação não pode ser desfeita.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteConfirmOpen(false)}
                      className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors text-sm font-medium shadow-lg shadow-rose-200"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Purchase Order Detail Modal */}
      <AnimatePresence>
        {showPODetail && selectedPO && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150]"
              onClick={() => setShowPODetail(false)}
            />
            <div className="fixed inset-0 flex items-center justify-center z-[160] p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden pointer-events-auto flex flex-col"
              >
                 <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
                   <div>
                     <h2 className="text-lg font-bold text-white">Pedido {selectedPO.number}</h2>
                     <div className="flex items-center gap-2 mt-1">
                       <span className="text-slate-400 text-xs">Fornecedor:</span>
                       <span className="text-white text-xs font-bold">{selectedPO.supplier_name}</span>
                       <span className={`ml-2 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider ${
                         selectedPO.status === 'RECEIVED' ? 'bg-emerald-500 text-white' :
                         selectedPO.status === 'PARTIAL' ? 'bg-blue-500 text-white' :
                         selectedPO.status === 'DRAFT' ? 'bg-slate-500 text-white' :
                         'bg-amber-500 text-white'
                       }`}>
                         {selectedPO.status === 'RECEIVED' ? 'RECEBIDO' :
                          selectedPO.status === 'PARTIAL' ? 'PARCIAL' :
                          selectedPO.status === 'DRAFT' ? 'RASCUNHO' : 'PENDENTE'}
                       </span>
                     </div>
                   </div>
                   <div className="flex items-center gap-3">
                     <button
                       onClick={() => handleDownloadPOPDF({ id: selectedPO.id, number: selectedPO.number })}
                       className="p-2 text-white/60 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                       title="Baixar PDF"
                     >
                       <FileText size={18} />
                     </button>
                     <button onClick={() => setShowPODetail(false)} className="text-white hover:text-slate-400 transition-colors">
                       <X size={20} />
                     </button>
                   </div>
                 </div>

                 <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
                   {/* Info Grid */}
                   <div className="grid grid-cols-2 gap-3 text-sm">
                     <div className="p-3 bg-slate-50 rounded-xl">
                       <p className="text-slate-500 text-xs font-bold uppercase mb-1">Data do Pedido</p>
                       <p className="font-bold text-slate-900">{formatDate(selectedPO.order_date)}</p>
                     </div>
                     <div className="p-3 bg-slate-50 rounded-xl">
                       <p className="text-slate-500 text-xs font-bold uppercase mb-1">Entrega Prevista</p>
                       <p className="font-bold text-slate-900">
                         {selectedPO.expected_delivery ? formatDate(selectedPO.expected_delivery) : '—'}
                       </p>
                     </div>
                   </div>

                   {/* Received Banner */}
                   {selectedPO.status === 'RECEIVED' && (
                     <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                       <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                       <div>
                         <p className="text-emerald-800 font-bold text-sm">Pedido recebido com sucesso</p>
                         <p className="text-emerald-700 text-xs mt-0.5">
                           ✅ Estoque atualizado &nbsp;·&nbsp; ✅ Fluxo de caixa registrado (saída) &nbsp;·&nbsp; ✅ Fornecedor vinculado às peças
                         </p>
                       </div>
                     </div>
                   )}

                   {/* Items Table */}
                   <div>
                     <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Itens do Pedido</h3>
                     <div className="border border-slate-100 rounded-xl overflow-hidden">
                       <table className="w-full text-xs">
                         <thead className="bg-slate-50 border-b border-slate-100">
                           <tr>
                             <th className="text-left px-4 py-2 text-slate-500">Produto / Peça</th>
                             <th className="text-center px-4 py-2 text-slate-500">Qtd</th>
                             <th className="text-right px-4 py-2 text-slate-500">Valor Unit.</th>
                             <th className="text-right px-4 py-2 text-slate-500">Subtotal</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50">
                           {selectedPO.items?.map((item: any) => (
                             <tr key={item.id} className="hover:bg-slate-50/50">
                               <td className="px-4 py-3">
                                 <p className="font-bold text-slate-900">{item.name}</p>
                                 {item.code && <p className="text-slate-400 text-[10px]">Cód: {item.code}</p>}
                               </td>
                               <td className="px-4 py-3 text-center font-black text-slate-800">{item.quantity}</td>
                               <td className="px-4 py-3 text-right text-slate-500">R$ {(item.unit_cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                               <td className="px-4 py-3 text-right font-bold text-slate-900">R$ {(item.subtotal || item.quantity * item.unit_cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                   </div>

                   {/* Totals */}
                   <div className="flex flex-col items-end gap-1 pt-4 border-t border-slate-100">
                     <div className="flex justify-between w-64 text-sm">
                       <span className="text-slate-500">Subtotal:</span>
                       <span className="font-bold text-slate-700">R$ {(selectedPO.total - (selectedPO.freight || 0) + (selectedPO.discount || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                     </div>
                     {(selectedPO.freight || 0) > 0 && (
                       <div className="flex justify-between w-64 text-sm">
                         <span className="text-slate-500">Frete:</span>
                         <span className="font-bold text-indigo-600">+ R$ {(selectedPO.freight || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                       </div>
                     )}
                     {(selectedPO.discount || 0) > 0 && (
                       <div className="flex justify-between w-64 text-sm">
                         <span className="text-slate-500">Desconto:</span>
                         <span className="font-bold text-rose-600">- R$ {(selectedPO.discount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                       </div>
                     )}
                     <div className="flex justify-between w-64 text-lg pt-2 border-t border-slate-200 mt-2">
                       <span className="font-black text-slate-800">Total:</span>
                       <span className="font-black text-emerald-600">R$ {(selectedPO.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                     </div>
                   </div>

                   {/* Receive Button */}
                   {selectedPO.status !== 'RECEIVED' && (
                     <div className="pt-2">
                       <button
                         onClick={() => handleReceivePO(selectedPO.id)}
                         className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-xl shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all"
                       >
                         <Package size={20} /> REGISTRAR RECEBIMENTO
                       </button>
                       <div className="mt-3 p-3 bg-slate-50 rounded-xl">
                         <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-1">O que acontece ao confirmar:</p>
                         <div className="space-y-1">
                           <p className="text-[10px] text-slate-600">📦 Adiciona as quantidades ao estoque de cada peça</p>
                           <p className="text-[10px] text-slate-600">💰 Registra saída automática no Fluxo de Caixa</p>
                           <p className="text-[10px] text-slate-600">🔗 Vincula o fornecedor e o preço de custo a cada peça</p>
                         </div>
                       </div>
                     </div>
                   )}
                 </div>
               </motion.div>
             </div>
           </>
         )}
       </AnimatePresence>

      {/* Mini New Part Modal */}
      <AnimatePresence>
        {showNewPartModal && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm shadow-2xl"
              onClick={() => setShowNewPartModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-lg z-10 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Cadastrar Nova Peça</h2>
                  <p className="text-emerald-100 text-xs">A peça será vinculada ao fornecedor {selectedSupplier?.name}</p>
                </div>
                <button onClick={() => setShowNewPartModal(false)} className="text-white/80 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateNewPart} className="p-6 space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome da Peça *</label>
                    <input 
                      type="text" required
                      className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      value={partFormData.name}
                      onChange={e => setPartFormData({...partFormData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Código Interno *</label>
                    <input 
                      type="text" required
                      className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      value={partFormData.code}
                      onChange={e => setPartFormData({...partFormData, code: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Preço Custo (R$) *</label>
                      <input 
                        type="number" step="0.01" required
                        className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        value={partFormData.cost_price || ''}
                        onChange={e => setPartFormData({...partFormData, cost_price: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Preço Venda (R$)</label>
                      <input 
                        type="number" step="0.01"
                        className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        value={partFormData.sale_price || ''}
                        onChange={e => setPartFormData({...partFormData, sale_price: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                  <button type="button" onClick={() => setShowNewPartModal(false)} className="px-5 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">Cancelar</button>
                  <button type="submit" className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200 rounded-lg">Salvar e Adicionar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border ${
              notification.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
              notification.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-800' :
              'bg-blue-50 border-blue-100 text-blue-800'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              notification.type === 'success' ? 'bg-emerald-100' :
              notification.type === 'error' ? 'bg-rose-100' :
              'bg-blue-100'
            }`}>
              {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
               notification.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
               <Info className="w-5 h-5" />}
            </div>
            <div className="min-w-[200px]">
              <p className="font-bold text-sm leading-tight">{notification.title}</p>
              <p className="text-xs opacity-80 leading-tight mt-1">{notification.message}</p>
            </div>
            <button 
              onClick={() => setNotification({ ...notification, show: false })}
              className="p-1 hover:bg-black/5 rounded-lg transition-colors ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
