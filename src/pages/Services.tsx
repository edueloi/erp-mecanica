import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Download, Upload, MoreVertical, 
  Edit, Trash2, Eye, Package, History, TrendingUp, 
  Clock, CheckCircle2, AlertCircle, X, ChevronRight,
  Settings, Info, DollarSign, Percent, Wrench
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../services/api';
import ImportExportModal from '../components/ImportExportModal';

type ServiceCategory = 'MOTOR' | 'FREIO' | 'SUSPENSAO' | 'ELETRICA' | 'REVISAO' | 'OUTROS';
type ServiceStatus = 'ACTIVE' | 'INACTIVE';
type ServiceType = 'LABOR' | 'WITH_PART' | 'COMPOSITE';

interface Service {
  id: string;
  name: string;
  code: string;
  category: ServiceCategory;
  description: string;
  estimated_time: string; // e.g., "01:30"
  default_price: number;
  estimated_cost: number;
  status: ServiceStatus;
  type: ServiceType;
  charging_type: 'FIXED' | 'HOURLY';
  warranty_days: number;
  allow_discount: boolean;
  requires_diagnosis: boolean;
  compatible_vehicles?: string;
}

interface Part { 
  id: string; 
  name: string; 
  code: string; 
  sale_price: number; 
  stock_quantity: number; 
}

interface ServicePart {
  id: string;
  part_id: string;
  part_name: string;
  part_code: string;
  sale_price: number;
  quantity: number;
  current_stock: number;
}

const categoryMap: Record<ServiceCategory, { label: string; color: string }> = {
  MOTOR: { label: 'Motor', color: 'bg-red-50 text-red-600 border-red-100' },
  FREIO: { label: 'Freio', color: 'bg-orange-50 text-orange-600 border-orange-100' },
  SUSPENSAO: { label: 'Suspensão', color: 'bg-blue-50 text-blue-600 border-blue-100' },
  ELETRICA: { label: 'Elétrica', color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
  REVISAO: { label: 'Revisão', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  OUTROS: { label: 'Outros', color: 'bg-slate-50 text-slate-600 border-slate-100' },
};

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'SUMMARY' | 'PARTS' | 'HISTORY' | 'COMPATIBILITY'>('SUMMARY');
  
  const [availableParts, setAvailableParts] = useState<Part[]>([]);
  const [serviceParts, setServiceParts] = useState<ServicePart[]>([]);
  const [searchPartQuery, setSearchPartQuery] = useState('');
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [partQuantity, setPartQuantity] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'OUTROS' as ServiceCategory,
    description: '',
    estimated_time: '01:00',
    default_price: 0,
    estimated_cost: 0,
    status: 'ACTIVE' as ServiceStatus,
    type: 'LABOR' as ServiceType,
    charging_type: 'FIXED' as 'FIXED' | 'HOURLY',
    warranty_days: 90,
    allow_discount: true,
    requires_diagnosis: false,
    compatible_vehicles: ''
  });

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/services');
      setServices(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching services:', err);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableParts = async () => {
    try {
      const res = await api.get('/parts');
      setAvailableParts(Array.isArray(res.data) ? res.data : []);
    } catch (err) { }
  };

  const fetchServiceParts = async (id: string) => {
    try {
      const res = await api.get(`/services/${id}/parts`);
      setServiceParts(Array.isArray(res.data) ? res.data : []);
    } catch (err) { }
  };

  useEffect(() => {
    fetchServices();
    fetchAvailableParts();
  }, []);

  useEffect(() => {
    if (isDetailDrawerOpen && selectedService && (activeDetailTab === 'PARTS' || activeDetailTab === 'SUMMARY')) {
      fetchServiceParts(selectedService.id);
    }
  }, [isDetailDrawerOpen, selectedService, activeDetailTab]);

  const [modalParts, setModalParts] = useState<{part_id: string, part_name: string, sale_price: number, quantity: number}[]>([]);

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/services/${editingId}`, formData);
      } else {
        const res = await api.post('/services', formData);
        const newId = res.data.id;
        
        if (modalParts.length > 0) {
          for (const p of modalParts) {
            await api.post(`/services/${newId}/parts`, { part_id: p.part_id, quantity: p.quantity });
          }
        }
      }
      setIsNewModalOpen(false);
      setEditingId(null);
      setModalParts([]);
      setFormData({
        name: '', code: '', category: 'OUTROS', description: '',
        estimated_time: '01:00', default_price: 0, estimated_cost: 0,
        status: 'ACTIVE', type: 'LABOR', charging_type: 'FIXED', warranty_days: 90,
        allow_discount: true, requires_diagnosis: false, compatible_vehicles: ''
      });
      fetchServices();
      if (isDetailDrawerOpen) {
         fetchServices();
      }
    } catch (err) {
      console.error('Error creating/updating service:', err);
    }
  };

  const handleEditClick = (service: Service) => {
    setEditingId(service.id);
    setFormData({
      name: service.name || '',
      code: service.code || '',
      category: service.category || 'OUTROS',
      description: service.description || '',
      estimated_time: service.estimated_time || '01:00',
      default_price: service.default_price || 0,
      estimated_cost: service.estimated_cost || 0,
      status: service.status || 'ACTIVE',
      type: service.type || 'LABOR',
      charging_type: service.charging_type || 'FIXED',
      warranty_days: service.warranty_days || 90,
      allow_discount: service.allow_discount ?? true,
      requires_diagnosis: service.requires_diagnosis ?? false,
      compatible_vehicles: service.compatible_vehicles || ''
    });
    fetchServiceParts(service.id);
    setIsNewModalOpen(true);
  };


  const handleDeleteService = async (id: string) => {
    if (!window.confirm('Deseja realmente excluir este serviço?')) return;
    try {
      await api.delete(`/services/${id}`);
      fetchServices();
      if (selectedService?.id === id) {
        setIsDetailDrawerOpen(false);
      }
    } catch (err) {
      console.error('Error deleting service:', err);
      alert('Não foi possível excluir o serviço. Ele pode estar vinculado a ordens de serviço.');
    }
  };

  const handleLinkPart = async () => {
    if (!selectedPart || !selectedService) return;
    try {
      await api.post(`/services/${selectedService.id}/parts`, {
        part_id: selectedPart.id,
        quantity: partQuantity
      });
      setSelectedPart(null);
      setPartQuantity(1);
      setSearchPartQuery('');
      fetchServiceParts(selectedService.id);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao vincular peça');
    }
  };

  const handleRemovePart = async (part_id: string) => {
    if (!selectedService) return;
    try {
      await api.delete(`/services/${selectedService.id}/parts/${part_id}`);
      fetchServiceParts(selectedService.id);
    } catch (err) {
      console.error('Error removing part linked:', err);
    }
  };

  const calculateMargin = (price: number, cost: number) => {
    if (price === 0) return 0;
    return ((price - cost) / price) * 100;
  };

  const getMarginColor = (margin: number) => {
    if (margin >= 40) return 'text-emerald-600';
    if (margin >= 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredServices = services.filter(s => 
    (s.name?.toLowerCase().includes(search.toLowerCase()) || s.code?.toLowerCase().includes(search.toLowerCase())) &&
    (categoryFilter === '' || s.category === categoryFilter)
  );

  const serviceTemplateData = [
    { 'Nome': 'Troca de Óleo', 'Codigo': 'SRV001', 'Categoria': 'REVISAO', 'Descricao': 'Troca de óleo do motor', 'Tempo Estimado': '01:00', 'Preco Padrao': '150.00', 'Custo Estimado': '50.00', 'Tipo': 'LABOR', 'Cobrança': 'FIXED', 'Garantia (dias)': '30' }
  ];

  const serviceExportColumns = [
    { header: 'Nome', dataKey: 'name' },
    { header: 'Código', dataKey: 'code' },
    { header: 'Categoria', dataKey: 'category' },
    { header: 'Preço', dataKey: 'default_price' },
    { header: 'Custo', dataKey: 'estimated_cost' },
    { header: 'Tipo', dataKey: 'type' },
    { header: 'Cobrança', dataKey: 'charging_type' },
    { header: 'Status', dataKey: 'status' },
  ];

  const handleImportServices = async (data: any[]) => {
    try {
      const validData = data.map(row => ({
        name: row['Nome'] || row['name'] || '',
        code: row['Codigo'] || row['code'] || '',
        category: row['Categoria'] || row['category'] || 'OUTROS',
        description: row['Descricao'] || row['description'] || '',
        estimated_time: row['Tempo Estimado'] || row['estimated_time'] || '01:00',
        default_price: parseFloat(row['Preco Padrao'] || row['default_price'] || 0),
        estimated_cost: parseFloat(row['Custo Estimado'] || row['estimated_cost'] || 0),
        type: row['Tipo'] || row['type'] || 'LABOR',
        charging_type: row['Cobrança'] || row['charging_type'] || 'FIXED',
        warranty_days: parseInt(row['Garantia (dias)'] || row['warranty_days'] || 90),
      })).filter(s => s.name);
      await api.post('/services/bulk', validData);
      fetchServices();
    } catch (err: any) {
      throw new Error(err?.response?.data?.message || 'Erro ao importar serviços. Verifique os dados e tente novamente.');
    }
  };

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4 flex-1">
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Catálogo de Serviços</h1>
            <p className="text-[10px] text-slate-500 font-medium">Gerencie preços, tempos e margens dos serviços.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setIsImportModalOpen(true)} className="h-9 px-3 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-2 transition-all">
            <Upload size={14} /> <span className="hidden sm:inline">Importar</span>
          </button>
          <button onClick={() => setIsExportModalOpen(true)} className="h-9 px-3 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-2 transition-all">
            <Download size={14} /> <span className="hidden sm:inline">Exportar</span>
          </button>
          <button 
            onClick={() => setIsNewModalOpen(true)}
            className="h-9 px-4 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm whitespace-nowrap"
          >
            <Plus size={16} /> Novo Serviço
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center gap-4 overflow-x-auto no-scrollbar">
        <div className="relative flex-1 min-w-[200px] max-w-xs shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input 
            type="text" 
            placeholder="Buscar serviços..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="h-4 w-px bg-slate-200 shrink-0" />
        <div className="flex items-center gap-2 shrink-0">
          <Filter size={14} className="text-slate-400" />
          <select 
            className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="">Todas Categorias</option>
            {Object.entries(categoryMap).map(([key, value]) => (
              <option key={key} value={key}>{value.label}</option>
            ))}
          </select>
        </div>
        <div className="h-4 w-px bg-slate-200 shrink-0" />
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Status:</span>
          <select className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer">
            <option value="">Todos</option>
            <option value="ACTIVE">Ativos</option>
            <option value="INACTIVE">Inativos</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead className="sticky top-0 bg-slate-50 z-20 shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]">
            <tr>
              <th className="px-6 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Serviço</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categoria</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tempo Est.</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valor Padrão</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Custo Médio</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Margem %</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Veículos</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky right-0 bg-slate-50 z-20 text-right shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)]">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-slate-400 text-sm italic">Carregando catálogo...</td>
              </tr>
            ) : filteredServices.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-slate-400 text-sm italic">Nenhum serviço encontrado.</td>
              </tr>
            ) : filteredServices.map((service) => {
              const margin = calculateMargin(service.default_price, service.estimated_cost);
              return (
                <tr 
                  key={service.id} 
                  className="hover:bg-slate-50 transition-colors group cursor-pointer"
                  onClick={() => {
                    setSelectedService(service);
                    setIsDetailDrawerOpen(true);
                  }}
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                        <Wrench size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{service.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">{service.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-tight ${categoryMap[service.category]?.color || categoryMap.OUTROS.color}`}>
                      {categoryMap[service.category]?.label || 'Outros'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-full w-fit">
                      <Clock size={12} />
                      {service.estimated_time}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-black text-slate-900">
                      R$ {service.default_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-slate-500">
                      R$ {service.estimated_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold ${getMarginColor(margin)}`}>
                        {margin.toFixed(1)}%
                      </span>
                      <TrendingUp size={12} className={getMarginColor(margin)} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase">
                      {service.compatible_vehicles}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-tight ${service.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                      {service.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right sticky right-0 bg-white group-hover:bg-slate-50 transition-colors shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.02)] z-10">
                    <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={() => { setSelectedService(service); setIsDetailDrawerOpen(true); setActiveDetailTab('SUMMARY'); }} 
                        className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded transition-all" title="Ver Detalhes"
                      >
                        <Eye size={14} />
                      </button>
                      <button 
                        onClick={() => handleEditClick(service)}
                        className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded transition-all" title="Editar"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => { setSelectedService(service); setIsDetailDrawerOpen(true); setActiveDetailTab('PARTS'); }} 
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all" title="Peças Vinculadas"
                      >
                        <Package size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteService(service.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all" title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* New Service Modal */}
      <AnimatePresence>
        {isNewModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Novo Serviço</h2>
                  <p className="text-[10px] text-slate-500 font-medium">Cadastre um novo serviço no seu catálogo.</p>
                </div>
                <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-slate-900 p-2 hover:bg-slate-200 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleCreateService} className="p-6 overflow-y-auto space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Nome do Serviço</label>
                    <input 
                      type="text" 
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none"
                      placeholder="Ex: Troca de Pastilhas de Freio"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Código Interno</label>
                    <input 
                      type="text" 
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none"
                      placeholder="Ex: SRV-001"
                      value={formData.code}
                      onChange={e => setFormData({...formData, code: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Categoria</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none cursor-pointer"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value as ServiceCategory})}
                    >
                      <option value="">Selecione...</option>
                      {Object.entries(categoryMap).map(([key, value]) => (
                        <option key={key} value={key}>{value.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Tempo Estimado</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="time" 
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none"
                        value={formData.estimated_time}
                        onChange={e => setFormData({...formData, estimated_time: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Trabalho ou Cobrança</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none cursor-pointer"
                      value={formData.charging_type}
                      onChange={e => setFormData({...formData, charging_type: e.target.value as 'FIXED' | 'HOURLY'})}
                    >
                      <option value="FIXED">Valor Fixo</option>
                      <option value="HOURLY">Por Hora Técnica</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Valor Padrão {formData.charging_type === 'HOURLY' ? '(Hora)' : ''}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none font-bold"
                        placeholder="0,00"
                        value={formData.default_price}
                        onChange={e => setFormData({...formData, default_price: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Custo Estimado</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none"
                        placeholder="0,00"
                        value={formData.estimated_cost}
                        onChange={e => setFormData({...formData, estimated_cost: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Settings size={12} /> Configurações Técnicas
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        id="allow_discount" 
                        className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" 
                        checked={formData.allow_discount}
                        onChange={e => setFormData({...formData, allow_discount: e.target.checked})}
                      />
                      <label htmlFor="allow_discount" className="text-xs font-medium text-slate-700">Permite desconto na OS</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        id="requires_diag" 
                        className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" 
                        checked={formData.requires_diagnosis}
                        onChange={e => setFormData({...formData, requires_diagnosis: e.target.checked})}
                      />
                      <label htmlFor="requires_diag" className="text-xs font-medium text-slate-700">Requer diagnóstico prévio</label>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Garantia Padrão (Dias)</label>
                      <input 
                        type="number" 
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
                        value={formData.warranty_days}
                        onChange={e => setFormData({...formData, warranty_days: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Tipo de Serviço</label>
                      <select 
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value as ServiceType})}
                      >
                        <option value="LABOR">Mão de Obra</option>
                        <option value="WITH_PART">Serviço com Peça</option>
                        <option value="COMPOSITE">Serviço Composto (Pacote)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mt-4 space-y-4">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Package size={12} /> Produtos / Peças da Composição
                  </h3>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Produto</label>
                      <select 
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
                        value={selectedPart?.id || ''}
                        onChange={e => {
                          const p = availableParts.find(x => x.id === e.target.value);
                          setSelectedPart(p || null);
                        }}
                      >
                        <option value="">Selecione...</option>
                        {availableParts.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (R$ {p.sale_price})</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-20">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Qtd</label>
                      <input 
                        type="number" min="1"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10 text-center font-bold"
                        value={partQuantity}
                        onChange={e => setPartQuantity(parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        if (!selectedPart) return;
                        if (editingId) {
                          api.post(`/services/${editingId}/parts`, { part_id: selectedPart.id, quantity: partQuantity })
                             .then(() => fetchServiceParts(editingId))
                             .catch(err => alert(err.response?.data?.error || 'Erro ao vincular'));
                        } else {
                          if (!modalParts.find(mp => mp.part_id === selectedPart.id)) {
                            setModalParts(prev => [...prev, { 
                              part_id: selectedPart.id, 
                              part_name: selectedPart.name, 
                              sale_price: selectedPart.sale_price, 
                              quantity: partQuantity 
                            }]);
                          }
                        }
                        setSelectedPart(null);
                        setPartQuantity(1);
                      }}
                      className="h-[38px] px-4 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                  
                  <div className="space-y-2 mt-2">
                    {(editingId ? serviceParts : modalParts).length === 0 && (
                       <p className="text-[10px] text-slate-400 italic text-center py-2 relative pb-2 -mt-2">Sem produtos vinculados.</p>
                    )}
                    {(editingId ? serviceParts : modalParts).map((p: any, idx: number) => (
                      <div key={editingId ? p.part_id : idx} className="flex items-center justify-between text-xs bg-white border border-slate-100 p-2.5 rounded-lg shadow-sm">
                        <span className="font-bold text-slate-700 uppercase">{p.part_name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded">{p.quantity}x</span>
                          <button 
                            type="button"
                            onClick={() => {
                              if (editingId) {
                                api.delete(`/services/${editingId}/parts/${p.part_id}`)
                                   .then(() => fetchServiceParts(editingId))
                                   .catch(err => alert('Erro'));
                              } else {
                                setModalParts(prev => prev.filter((_, i) => i !== idx));
                              }
                            }}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Descrição do Serviço</label>
                  <textarea 
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none resize-none"
                    placeholder="Descreva detalhadamente o que é realizado neste serviço..."
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                
                <div className="p-6 border-t border-slate-100 flex gap-3 shrink-0 bg-slate-50/50 rounded-b-2xl">
                  <button 
                    type="button"
                    onClick={() => setIsNewModalOpen(false)}
                    className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="flex-2 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">
                    Salvar Serviço
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Service Detail Drawer */}
      <AnimatePresence>
        {isDetailDrawerOpen && selectedService && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex justify-end">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                    <Wrench size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 leading-tight">{selectedService.name}</h2>
                    <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">{selectedService.code}</p>
                  </div>
                </div>
                <button onClick={() => setIsDetailDrawerOpen(false)} className="text-slate-400 hover:text-slate-900 p-2 hover:bg-slate-200 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Tabs */}
                <div className="flex border-b border-slate-100 px-6 sticky top-0 bg-white z-10">
                  <button onClick={() => setActiveDetailTab('SUMMARY')} className={`px-4 py-3 text-xs font-bold transition-all ${activeDetailTab === 'SUMMARY' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>Resumo</button>
                  <button onClick={() => setActiveDetailTab('PARTS')} className={`px-4 py-3 text-xs font-bold transition-all ${activeDetailTab === 'PARTS' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>Peças</button>
                  <button onClick={() => setActiveDetailTab('HISTORY')} className={`px-4 py-3 text-xs font-bold transition-all ${activeDetailTab === 'HISTORY' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>Histórico</button>
                  <button onClick={() => setActiveDetailTab('COMPATIBILITY')} className={`px-4 py-3 text-xs font-bold transition-all ${activeDetailTab === 'COMPATIBILITY' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>Compatibilidade</button>
                </div>

                <div className="p-6 space-y-6">
                  {activeDetailTab === 'SUMMARY' && (
                    <>
                      {/* Summary Section */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                            Valor de Venda {selectedService.charging_type === 'HOURLY' ? '(Hora)' : '(Fixo)'}
                          </p>
                          <p className="text-lg font-black text-slate-900">R$ {selectedService.default_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                            Custo Estimado {selectedService.charging_type === 'HOURLY' ? '(Hora)' : ''}
                          </p>
                          <p className="text-lg font-black text-slate-500">R$ {selectedService.estimated_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>

                      <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Lucro Bruto</p>
                          <p className="text-xl font-black text-emerald-700">R$ {(selectedService.default_price - selectedService.estimated_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Margem</p>
                          <p className="text-xl font-black text-emerald-700">{calculateMargin(selectedService.default_price, selectedService.estimated_cost).toFixed(1)}%</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Informações Técnicas</h3>
                        <div className="grid grid-cols-2 gap-y-4">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Tempo Estimado</p>
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700 mt-1">
                              <Clock size={14} className="text-slate-400" />
                              {selectedService.estimated_time || '00:00'}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Garantia</p>
                            <p className="text-sm font-bold text-slate-700 mt-1">{selectedService.warranty_days} dias</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Categoria</p>
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-tight mt-1 ${categoryMap[selectedService.category]?.color || categoryMap.OUTROS.color}`}>
                              {categoryMap[selectedService.category]?.label || 'Outros'}
                            </span>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Tipo</p>
                            <p className="text-sm font-bold text-slate-700 mt-1">
                              {selectedService.type === 'LABOR' ? 'Mão de Obra' : selectedService.type === 'WITH_PART' ? 'Serviço com Peça' : 'Serviço Composto'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Cobrança</p>
                            <p className="text-sm font-bold text-slate-700 mt-1">
                              {selectedService.charging_type === 'HOURLY' ? 'Por Hora Técnica' : 'Valor Fixo'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Descrição</p>
                        <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
                          "{selectedService.description || 'Nenhuma descrição adicionada.'}"
                        </p>
                      </div>

                      <div className="pt-4 space-y-3 border-t border-slate-100">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <Package size={12} /> Peças Vinculadas (Padrão)
                        </h3>
                        {serviceParts.length > 0 ? (
                           <div className="space-y-2">
                             {serviceParts.map(sp => (
                               <div key={sp.id} className="flex justify-between items-center text-xs p-2 bg-slate-50 border border-slate-100 rounded">
                                 <div>
                                   <p className="font-bold text-slate-700">{sp.part_name}</p>
                                   <p className="text-slate-500 font-mono text-[10px]">{sp.part_code}</p>
                                 </div>
                                 <div className="text-right">
                                   <p className="font-bold text-slate-700">{sp.quantity}x</p>
                                   <p className="text-slate-500 text-[10px]">R$ {sp.sale_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                 </div>
                               </div>
                             ))}
                           </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">Nenhuma peça vinculada a este serviço.</p>
                        )}
                      </div>
                    </>
                  )}

                  {activeDetailTab === 'PARTS' && (
                    <div className="space-y-6">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                         <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                           <Plus size={14} /> Adicionar Peça ao Padrão
                         </h3>
                         <div className="space-y-3">
                           <div>
                             <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Buscar Peça</label>
                             <div className="relative">
                               <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                               <input 
                                 type="text"
                                 className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
                                 placeholder="Digite o nome ou código da peça..."
                                 value={searchPartQuery}
                                 onChange={e => {
                                   setSearchPartQuery(e.target.value);
                                   if (!e.target.value) setSelectedPart(null);
                                 }}
                               />
                               {searchPartQuery && !selectedPart && (
                                 <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-20">
                                   {availableParts
                                     .filter(p => p.name.toLowerCase().includes(searchPartQuery.toLowerCase()) || (p.code && p.code.toLowerCase().includes(searchPartQuery.toLowerCase())))
                                     .slice(0, 5)
                                     .map(p => (
                                       <div 
                                         key={p.id}
                                         className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                                         onClick={() => {
                                            setSelectedPart(p);
                                            setSearchPartQuery(p.name);
                                         }}
                                       >
                                          <p className="text-sm font-bold text-slate-900">{p.name}</p>
                                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                            <span className="font-mono bg-slate-100 px-1.5 rounded">{p.code}</span>
                                            <span>Estoque: {p.stock_quantity}</span>
                                            <span className="font-medium text-emerald-600">R$ {p.sale_price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                                          </div>
                                       </div>
                                     ))}
                                 </div>
                               )}
                             </div>
                           </div>

                           <div className="flex gap-3 items-end">
                             <div className="w-24">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Unidades</label>
                                <input 
                                  type="number"
                                  min="0.1"
                                  step="0.1"
                                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none"
                                  value={partQuantity}
                                  onChange={e => setPartQuantity(parseFloat(e.target.value) || 1)}
                                />
                             </div>
                             <button
                               onClick={handleLinkPart}
                               disabled={!selectedPart}
                               className="flex-1 px-4 py-2 bg-slate-900 text-white font-bold text-sm rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                             >
                               Vincular ao Serviço
                             </button>
                           </div>
                         </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <Package size={12} /> Kits e Peças Vinculadas ({serviceParts.length})
                        </h3>
                        
                        {serviceParts.length === 0 ? (
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 text-center">
                            <p className="text-sm text-slate-500">Nenhuma peça padrão definida para este serviço.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {serviceParts.map((sp) => (
                              <div key={sp.id} className="bg-white border text-left border-slate-200 rounded-xl p-3 flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                                  <Package size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-bold text-slate-900 truncate">{sp.part_name}</h4>
                                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                    <span className="font-mono bg-slate-100 px-1.5 rounded">{sp.part_code}</span>
                                    <span>R$ {sp.sale_price.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span>
                                  </div>
                                </div>
                                <div className="text-right px-3 border-r border-slate-100">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Qtd.</p>
                                  <p className="text-sm font-black text-slate-700">{sp.quantity}</p>
                                </div>
                                <button 
                                  onClick={() => handleRemovePart(sp.part_id)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0" 
                                  title="Remover vínculo"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeDetailTab === 'HISTORY' && (
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <History size={12} /> Últimas Realizações
                      </h3>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 text-center">
                        <p className="text-sm text-slate-500">O histórico de OS e veículos que realizaram este serviço ficará aqui.</p>
                      </div>
                    </div>
                  )}

                  {activeDetailTab === 'COMPATIBILITY' && (
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Wrench size={12} /> Veículos Compatíveis
                      </h3>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 text-center whitespace-pre-wrap">
                        <p className="text-sm text-slate-500">{selectedService.compatible_vehicles || 'Compatibilidade geral ou não informada detalhadamente.'}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-slate-100 flex gap-3 shrink-0 bg-slate-50/50">
                  <button 
                    onClick={() => { setIsDetailDrawerOpen(false); handleEditClick(selectedService); }} 
                    className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                  >
                    <Edit size={14} /> Editar Serviço
                  </button>
                  <button 
                    onClick={() => setActiveDetailTab('HISTORY')}
                    className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2"
                  >
                    <History size={14} /> Ver Histórico
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ImportExportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        mode="import"
        title="Importar Serviços"
        templateData={serviceTemplateData}
        onImport={handleImportServices}
        entityName="serviços"
      />

      <ImportExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        mode="export"
        title="Exportar Serviços"
        data={services}
        columns={serviceExportColumns}
        entityName="serviços"
      />
    </div>
  );
}
