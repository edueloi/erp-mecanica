import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Download, Upload, MoreVertical, 
  Edit, Trash2, Eye, Package, History, TrendingUp, 
  Clock, CheckCircle2, AlertCircle, X, ChevronRight,
  Settings, Info, DollarSign, Percent, Wrench
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../services/api';

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
  warranty_days: number;
  allow_discount: boolean;
  requires_diagnosis: boolean;
  compatible_vehicles?: string;
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
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const fetchServices = async () => {
    setLoading(true);
    try {
      // Mocking for now as we don't have the backend endpoint yet
      // In a real scenario: const res = await api.get('/services');
      const mockServices: Service[] = [
        {
          id: '1',
          name: 'Troca de Óleo e Filtro',
          code: 'SRV-001',
          category: 'REVISAO',
          description: 'Troca de óleo do motor e filtro de óleo.',
          estimated_time: '00:45',
          default_price: 150.00,
          estimated_cost: 80.00,
          status: 'ACTIVE',
          type: 'WITH_PART',
          warranty_days: 90,
          allow_discount: true,
          requires_diagnosis: false,
          compatible_vehicles: 'Universal'
        },
        {
          id: '2',
          name: 'Alinhamento e Balanceamento',
          code: 'SRV-002',
          category: 'SUSPENSAO',
          description: 'Alinhamento 3D e balanceamento das 4 rodas.',
          estimated_time: '01:00',
          default_price: 120.00,
          estimated_cost: 30.00,
          status: 'ACTIVE',
          type: 'LABOR',
          warranty_days: 30,
          allow_discount: true,
          requires_diagnosis: false,
          compatible_vehicles: 'Universal'
        },
        {
          id: '3',
          name: 'Revisão 10.000km',
          code: 'REV-010',
          category: 'REVISAO',
          description: 'Revisão completa de 10 mil km.',
          estimated_time: '03:00',
          default_price: 450.00,
          estimated_cost: 200.00,
          status: 'ACTIVE',
          type: 'COMPOSITE',
          warranty_days: 180,
          allow_discount: false,
          requires_diagnosis: true,
          compatible_vehicles: 'Universal'
        }
      ];
      setServices(mockServices);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

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
    (s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase())) &&
    (categoryFilter === '' || s.category === categoryFilter)
  );

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4 flex-1">
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Catálogo de Serviços</h1>
            <p className="text-[10px] text-slate-500 font-medium">Gerencie preços, tempos e margens dos serviços.</p>
          </div>
          <div className="h-6 w-px bg-slate-200 hidden md:block mx-2" />
          <div className="relative flex-1 max-w-md hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por nome, código ou categoria..."
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border-transparent rounded-lg text-sm focus:ring-slate-900 focus:bg-white transition-all outline-none"
              value={search}
              onChange={e => setSearch(e.target.value)}
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
            onClick={() => setIsNewModalOpen(true)}
            className="h-9 px-4 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm whitespace-nowrap"
          >
            <Plus size={16} /> Novo Serviço
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center gap-4 overflow-x-auto no-scrollbar mt-[25px]">
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
              <th className="px-6 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
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
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
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
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-tight ${categoryMap[service.category].color}`}>
                      {categoryMap[service.category].label}
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
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                      <button className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded transition-all" title="Ver Detalhes">
                        <Eye size={14} />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded transition-all" title="Editar">
                        <Edit size={14} />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all" title="Peças Vinculadas">
                        <Package size={14} />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all" title="Inativar">
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
              
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Nome do Serviço</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none"
                      placeholder="Ex: Troca de Pastilhas de Freio"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Código Interno</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none"
                      placeholder="Ex: SRV-001"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Categoria</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none cursor-pointer">
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
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Valor Padrão</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
                      <input 
                        type="number" 
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none font-bold"
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Custo Estimado</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
                      <input 
                        type="number" 
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none"
                        placeholder="0,00"
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
                      <input type="checkbox" id="allow_discount" className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                      <label htmlFor="allow_discount" className="text-xs font-medium text-slate-700">Permite desconto na OS</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="requires_diag" className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                      <label htmlFor="requires_diag" className="text-xs font-medium text-slate-700">Requer diagnóstico prévio</label>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Garantia Padrão (Dias)</label>
                      <input 
                        type="number" 
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
                        defaultValue={90}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Tipo de Serviço</label>
                      <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10">
                        <option value="LABOR">Mão de Obra</option>
                        <option value="WITH_PART">Serviço com Peça</option>
                        <option value="COMPOSITE">Serviço Composto (Pacote)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Descrição do Serviço</label>
                  <textarea 
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none resize-none"
                    placeholder="Descreva detalhadamente o que é realizado neste serviço..."
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 flex gap-3 shrink-0 bg-slate-50/50 rounded-b-2xl">
                <button 
                  onClick={() => setIsNewModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Cancelar
                </button>
                <button className="flex-2 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">
                  Salvar Serviço
                </button>
              </div>
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
                  <button className="px-4 py-3 text-xs font-bold text-slate-900 border-b-2 border-slate-900">Resumo</button>
                  <button className="px-4 py-3 text-xs font-bold text-slate-400 hover:text-slate-600">Peças</button>
                  <button className="px-4 py-3 text-xs font-bold text-slate-400 hover:text-slate-600">Histórico</button>
                  <button className="px-4 py-3 text-xs font-bold text-slate-400 hover:text-slate-600">Compatibilidade</button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Summary Section */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Valor de Venda</p>
                      <p className="text-lg font-black text-slate-900">R$ {selectedService.default_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Custo Estimado</p>
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
                          {selectedService.estimated_time}h
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Garantia</p>
                        <p className="text-sm font-bold text-slate-700 mt-1">{selectedService.warranty_days} dias</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Categoria</p>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-tight mt-1 ${categoryMap[selectedService.category].color}`}>
                          {categoryMap[selectedService.category].label}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Tipo</p>
                        <p className="text-sm font-bold text-slate-700 mt-1">
                          {selectedService.type === 'LABOR' ? 'Mão de Obra' : selectedService.type === 'WITH_PART' ? 'Serviço com Peça' : 'Serviço Composto'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Descrição</p>
                    <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
                      "{selectedService.description}"
                    </p>
                  </div>

                  <div className="pt-4 space-y-3">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Package size={12} /> Peças Vinculadas (Padrão)
                    </h3>
                    {selectedService.type === 'WITH_PART' ? (
                      <div className="border border-slate-100 rounded-xl overflow-hidden">
                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 grid grid-cols-4 text-[10px] font-bold text-slate-400 uppercase">
                          <div className="col-span-2">Peça</div>
                          <div className="text-center">Qtd</div>
                          <div className="text-right">Custo</div>
                        </div>
                        <div className="px-4 py-3 grid grid-cols-4 items-center text-xs">
                          <div className="col-span-2 font-bold text-slate-700">Óleo 5W30 Sintético</div>
                          <div className="text-center font-mono text-slate-500">4.5L</div>
                          <div className="text-right font-bold text-slate-900">R$ 180,00</div>
                        </div>
                        <div className="px-4 py-3 grid grid-cols-4 items-center text-xs bg-slate-50/50">
                          <div className="col-span-2 font-bold text-slate-700">Filtro de Óleo</div>
                          <div className="text-center font-mono text-slate-500">1un</div>
                          <div className="text-right font-bold text-slate-900">R$ 45,00</div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Nenhuma peça vinculada a este serviço.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 flex gap-3 shrink-0 bg-slate-50/50">
                <button className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                  <Edit size={14} /> Editar Serviço
                </button>
                <button className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2">
                  <History size={14} /> Ver Histórico
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
