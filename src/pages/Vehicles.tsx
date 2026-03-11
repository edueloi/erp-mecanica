import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Car, User, Calendar, Hash, ChevronRight, X, 
  Fuel, Gauge, Palette, Shield, History, ClipboardList, 
  MoreVertical, Edit, Trash2, Info, AlertCircle, Filter,
  ArrowUpDown, Download, Upload, ExternalLink, MessageCircle,
  AlertTriangle, CheckCircle2, Clock, Printer,
  Package, Wrench, LogIn
} from 'lucide-react';
import api from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { fipeService, FipeItem } from '../services/fipeService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Vehicles() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  const [newVehicle, setNewVehicle] = useState({
    client_id: '',
    plate: '',
    brand: '',
    model: '',
    year: '',
    color: '',
    vin: '',
    fuel_type: 'FLEX',
    km: ''
  });

  // FIPE Integration State
  const [vehicleType, setVehicleType] = useState<'carros' | 'motos' | 'caminhoes'>('carros');
  const [fipeBrands, setFipeBrands] = useState<FipeItem[]>([]);
  const [fipeModels, setFipeModels] = useState<FipeItem[]>([]);
  const [fipeYears, setFipeYears] = useState<FipeItem[]>([]);
  const [selectedFipeBrand, setSelectedFipeBrand] = useState('');
  const [selectedFipeModel, setSelectedFipeModel] = useState('');
  const [selectedFipeYear, setSelectedFipeYear] = useState('');
  const [isFipeLoading, setIsFipeLoading] = useState(false);

  useEffect(() => {
    if (isNewModalOpen) {
      setIsFipeLoading(true);
      fipeService.getBrands(vehicleType)
        .then(setFipeBrands)
        .finally(() => setIsFipeLoading(false));
    }
  }, [isNewModalOpen, vehicleType]);

  const handleFipeBrandChange = async (brandId: string) => {
    setSelectedFipeBrand(brandId);
    setSelectedFipeModel('');
    setSelectedFipeYear('');
    setFipeModels([]);
    setFipeYears([]);
    if (brandId) {
      setIsFipeLoading(true);
      try {
        const models = await fipeService.getModels(brandId, vehicleType);
        setFipeModels(models);
        const brand = fipeBrands.find(b => b.codigo === brandId);
        if (brand) {
          setNewVehicle(prev => ({ ...prev, brand: brand.nome }));
        }
      } finally {
        setIsFipeLoading(false);
      }
    }
  };

  const handleFipeModelChange = async (modelId: string) => {
    setSelectedFipeModel(modelId);
    setSelectedFipeYear('');
    setFipeYears([]);
    if (modelId) {
      setIsFipeLoading(true);
      try {
        const years = await fipeService.getYears(selectedFipeBrand, modelId, vehicleType);
        setFipeYears(years);
        const model = fipeModels.find(m => m.codigo === modelId);
        if (model) {
          setNewVehicle(prev => ({ ...prev, model: model.nome }));
        }
      } finally {
        setIsFipeLoading(false);
      }
    }
  };

  const handleFipeYearChange = async (yearId: string) => {
    setSelectedFipeYear(yearId);
    if (yearId) {
      setIsFipeLoading(true);
      try {
        const details = await fipeService.getVehicleDetails(selectedFipeBrand, selectedFipeModel, yearId, vehicleType);
        setNewVehicle(prev => ({
          ...prev,
          brand: details.Marca,
          model: details.Modelo,
          year: details.AnoModelo.toString(),
          fuel_type: details.SiglaCombustivel === 'G' ? 'GASOLINE' : 
                     details.SiglaCombustivel === 'D' ? 'DIESEL' : 
                     details.SiglaCombustivel === 'A' ? 'ETHANOL' : 'FLEX'
        }));
      } finally {
        setIsFipeLoading(false);
      }
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vRes, cRes] = await Promise.all([
        api.get(`/vehicles?q=${search}`),
        api.get('/clients')
      ]);
      setVehicles(vRes.data);
      setClients(cRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/vehicles', newVehicle);
      setIsNewModalOpen(false);
      setNewVehicle({
        client_id: '', plate: '', brand: '', model: '', year: '', color: '', vin: '', fuel_type: 'FLEX', km: ''
      });
      fetchData();
    } catch (err) {
      alert('Erro ao cadastrar veículo');
    }
  };

  const openHistory = async (vehicle: any) => {
    try {
      setLoading(true);
      const res = await api.get(`/vehicles/${vehicle.id}`);
      setSelectedVehicle(res.data);
      setIsHistoryDrawerOpen(true);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusMap: any = {
    ACTIVE: { label: 'Ativo', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    INACTIVE: { label: 'Inativo', color: 'bg-slate-50 text-slate-400 border-slate-100' }
  };

  const fuelMap: any = {
    'FLEX': 'Flex',
    'GASOLINE': 'Gasolina',
    'ETHANOL': 'Etanol',
    'DIESEL': 'Diesel',
    'ELECTRIC': 'Elétrico',
    'HYBRID': 'Híbrido'
  };

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchStatus = !statusFilter || v.status === statusFilter;
      const matchBrand = !brandFilter || v.brand === brandFilter;
      const searchLower = search.toLowerCase();
      const matchSearch = !search || 
        v.plate?.toLowerCase().includes(searchLower) ||
        v.brand?.toLowerCase().includes(searchLower) ||
        v.model?.toLowerCase().includes(searchLower) ||
        v.vin?.toLowerCase().includes(searchLower) ||
        v.client_name?.toLowerCase().includes(searchLower);
      return matchStatus && matchBrand && matchSearch;
    });
  }, [vehicles, statusFilter, brandFilter, search]);

  return (
    <div className="flex flex-col h-full -m-6 bg-[#F6F8FB]">
      {/* Header - Compact */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-4 flex-1">
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Veículos</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider whitespace-nowrap">Gestão da frota</p>
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
            <Plus size={16} /> Novo Veículo
          </button>
        </div>
      </header>

      {/* Filters & Chips - Combined Row */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center gap-4 overflow-x-auto no-scrollbar shrink-0">
        <div className="relative flex-1 min-w-[200px] max-w-xs shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input 
            type="text" 
            placeholder="Buscar veículos..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="h-4 w-px bg-slate-200 shrink-0" />
        <div className="flex items-center gap-2 shrink-0">
          <Filter size={14} className="text-slate-400" />
          <select 
            className="bg-transparent border-none focus:ring-0 text-xs font-bold text-slate-600 p-0 pr-6 outline-none"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">Status: Todos</option>
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
          </select>
          <select 
            className="bg-transparent border-none focus:ring-0 text-xs font-bold text-slate-600 p-0 pr-6 outline-none"
            value={brandFilter}
            onChange={e => setBrandFilter(e.target.value)}
          >
            <option value="">Marca: Todas</option>
            {Array.from(new Set(vehicles.map(v => v.brand))).map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>

        <div className="h-4 w-px bg-slate-200 shrink-0" />

        <div className="flex items-center gap-2 shrink-0">
          {[
            { id: 'REVISAO_ATRASADA', label: 'Revisão Atrasada', color: 'bg-red-50 text-red-600 border-red-100' },
            { id: 'COM_OS_ABERTA', label: 'Com OS Aberta', color: 'bg-blue-50 text-blue-600 border-blue-100' },
            { id: 'INADIMPLENTES', label: 'Inadimplentes', color: 'bg-amber-50 text-amber-600 border-amber-100' },
          ].map(filter => (
            <button 
              key={filter.id}
              className={cn(
                "px-2 py-1 rounded-md text-[10px] font-bold transition-all border uppercase tracking-tight whitespace-nowrap",
                filter.color
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table - Data Heavy */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead className="sticky top-0 bg-slate-50 z-20 shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]">
            <tr>
              <th className="px-6 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Veículo</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Placa</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proprietário</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">KM Atual</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Última OS</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Próxima Revisão</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right sticky right-0 bg-slate-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)] z-20">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading && !vehicles.length ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-sm italic">Carregando veículos...</td>
              </tr>
            ) : filteredVehicles.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-sm italic">Nenhum veículo encontrado.</td>
              </tr>
            ) : filteredVehicles.map((vehicle) => (
              <tr 
                key={vehicle.id} 
                className="hover:bg-slate-50 transition-colors group cursor-pointer"
                onClick={() => navigate(`/vehicles/${vehicle.id}`)}
              >
                <td className="px-6 py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                      <Car size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 truncate">{vehicle.brand} {vehicle.model}</span>
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[8px] font-black uppercase">
                          {vehicle.year}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium truncate">
                        {fuelMap[vehicle.fuel_type]} • {vehicle.color || 'Cor não inf.'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <span className="text-xs font-bold bg-slate-900 text-white px-2 py-1 rounded font-mono tracking-wider">
                    {vehicle.plate?.toUpperCase() || '---'}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700 truncate">{vehicle.client_name || '---'}</span>
                    <span className="text-[10px] text-slate-400">Ver proprietário</span>
                  </div>
                </td>
                <td className="px-4 py-2 text-center">
                  <span className="text-xs font-medium text-slate-600">
                    {vehicle.km?.toLocaleString() || 0} KM
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span className="text-xs text-slate-600">
                    {vehicle.last_os_date ? format(new Date(vehicle.last_os_date), 'dd/MM/yy') : '---'}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <div className="flex flex-col">
                    <span className={cn(
                      "text-xs font-bold",
                      vehicle.km >= (vehicle.next_revision_km || 0) && vehicle.next_revision_km > 0 ? "text-red-600" : "text-slate-600"
                    )}>
                      {vehicle.next_revision_km ? `${vehicle.next_revision_km.toLocaleString()} KM` : '---'}
                    </span>
                    {vehicle.km >= (vehicle.next_revision_km || 0) && vehicle.next_revision_km > 0 && (
                      <span className="text-[8px] font-black text-red-500 uppercase tracking-tighter">Atrasada</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-tight",
                    statusMap[vehicle.status || 'ACTIVE']?.color
                  )}>
                    {statusMap[vehicle.status || 'ACTIVE']?.label}
                  </span>
                </td>
                <td className="px-6 py-2 text-right sticky right-0 bg-white group-hover:bg-slate-50 transition-colors shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.02)] z-10">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-200 rounded transition-all cursor-pointer" 
                      title="Ver Detalhes"
                    >
                      <Info size={16} />
                    </button>
                    <button 
                      onClick={() => { setSelectedVehicle(vehicle); setIsEditDrawerOpen(true); }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-200 rounded transition-all cursor-pointer" 
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-200 rounded transition-all cursor-pointer" title="Nova OS">
                      <Plus size={16} />
                    </button>
                    <button 
                      onClick={() => openHistory(vehicle)}
                      className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-slate-200 rounded transition-all cursor-pointer" 
                      title="Histórico"
                    >
                      <History size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Vehicle Modal - Premium */}
      <AnimatePresence>
        {isNewModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Novo Veículo</h2>
                  <p className="text-[10px] text-slate-500 font-medium">Preencha os dados técnicos</p>
                </div>
                <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-slate-900 p-1 hover:bg-slate-100 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="overflow-y-auto p-6 space-y-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Busca Rápida FIPE</h3>
                    {isFipeLoading && <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />}
                  </div>
                  
                  <div className="flex bg-white p-1 rounded-xl border border-slate-200 mb-4">
                    {(['carros', 'motos', 'caminhoes'] as const).map(type => (
                      <button 
                        key={type}
                        type="button"
                        onClick={() => setVehicleType(type)}
                        className={cn(
                          "flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all uppercase tracking-tight",
                          vehicleType === type ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
                        )}
                      >
                        {type === 'carros' ? 'Carros' : type === 'motos' ? 'Motos' : 'Caminhões'}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 px-1 uppercase">Marca</label>
                      <select 
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 shadow-sm transition-all"
                        value={selectedFipeBrand}
                        onChange={e => handleFipeBrandChange(e.target.value)}
                      >
                        <option value="">Selecione...</option>
                        {fipeBrands.map(b => <option key={b.codigo} value={b.codigo}>{b.nome}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 px-1 uppercase">Modelo</label>
                      <select 
                        disabled={!selectedFipeBrand}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 shadow-sm transition-all disabled:opacity-50"
                        value={selectedFipeModel}
                        onChange={e => handleFipeModelChange(e.target.value)}
                      >
                        <option value="">Selecione...</option>
                        {fipeModels.map(m => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 px-1 uppercase">Ano / Versão</label>
                      <select 
                        disabled={!selectedFipeModel}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 shadow-sm transition-all disabled:opacity-50"
                        value={selectedFipeYear}
                        onChange={e => handleFipeYearChange(e.target.value)}
                      >
                        <option value="">Selecione...</option>
                        {fipeYears.map(y => <option key={y.codigo} value={y.codigo}>{y.nome}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 px-1 tracking-widest">Proprietário</label>
                    <select 
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 shadow-sm transition-all"
                      value={newVehicle.client_id}
                      onChange={e => setNewVehicle({...newVehicle, client_id: e.target.value})}
                    >
                      <option value="">Selecione um cliente...</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 px-1 tracking-widest">Placa</label>
                      <input 
                        type="text" required 
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold font-mono outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 shadow-sm transition-all uppercase placeholder:font-sans placeholder:font-normal"
                        placeholder="AAA-0000"
                        value={newVehicle.plate}
                        onChange={e => setNewVehicle({...newVehicle, plate: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 px-1 tracking-widest">Cor</label>
                      <input 
                        type="text"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 shadow-sm transition-all"
                        placeholder="Ex: Prata"
                        value={newVehicle.color}
                        onChange={e => setNewVehicle({...newVehicle, color: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 px-1 tracking-widest">KM Atual</label>
                      <input 
                        type="number" 
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 shadow-sm transition-all"
                        placeholder="0"
                        value={newVehicle.km}
                        onChange={e => setNewVehicle({...newVehicle, km: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 px-1 tracking-widest">Combustível</label>
                      <select 
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 shadow-sm transition-all"
                        value={newVehicle.fuel_type}
                        onChange={e => setNewVehicle({...newVehicle, fuel_type: e.target.value})}
                      >
                        <option value="FLEX">Flex</option>
                        <option value="GASOLINE">Gasolina</option>
                        <option value="ETHANOL">Etanol</option>
                        <option value="DIESEL">Diesel</option>
                        <option value="ELECTRIC">Elétrico</option>
                        <option value="HYBRID">Híbrido</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsNewModalOpen(false)} 
                    className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Descartar
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all active:scale-95"
                  >
                    Cadastrar Veículo
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Drawer - Optimized & Compact */}
      <AnimatePresence>
        {isEditDrawerOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditDrawerOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col relative z-10"
            >
              <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/20">
                    <Edit size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Editar Veículo</h2>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">{selectedVehicle?.plate}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditDrawerOpen(false)} 
                  className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center justify-center active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-8 flex-1">
                <section className="space-y-4">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Informações de Posse</h3>
                  
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase px-1">Proprietário</label>
                    <select 
                      defaultValue={selectedVehicle?.client_id}
                      className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all appearance-none"
                    >
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase px-1">Placa</label>
                      <input 
                        type="text" 
                        defaultValue={selectedVehicle?.plate} 
                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 font-mono uppercase outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase px-1">Status</label>
                      <select 
                        defaultValue={selectedVehicle?.status || 'ACTIVE'}
                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                      >
                        <option value="ACTIVE">Ativo</option>
                        <option value="INACTIVE">Inativo</option>
                      </select>
                    </div>
                  </div>
                </section>

                <section className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Dados Técnicos</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase px-1">Marca</label>
                      <input type="text" defaultValue={selectedVehicle?.brand} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-medium" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase px-1">Modelo</label>
                      <input type="text" defaultValue={selectedVehicle?.model} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-medium" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase px-1">Ano</label>
                      <input type="number" defaultValue={selectedVehicle?.year} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-medium" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase px-1">Cor</label>
                      <input type="text" defaultValue={selectedVehicle?.color} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-medium" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase px-1">KM Atual</label>
                      <input type="number" defaultValue={selectedVehicle?.km} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-medium" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase px-1">Chassi (VIN)</label>
                      <input type="text" defaultValue={selectedVehicle?.vin} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-mono" />
                    </div>
                  </div>
                </section>
              </div>

              <div className="p-6 border-t border-slate-100 flex gap-3 bg-white shrink-0">
                <button 
                  onClick={() => setIsEditDrawerOpen(false)} 
                  className="flex-1 py-3.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button className="flex-[2] py-3.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 shadow-xl shadow-slate-900/20 transition-all active:scale-95">
                  Salvar Alterações
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Drawer - Optimized & Compact */}
      <AnimatePresence>
        {isHistoryDrawerOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryDrawerOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col relative z-10"
            >
              <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
                    <History size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Linha do Tempo</h2>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Histórico de Manutenções</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsHistoryDrawerOpen(false)} 
                  className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center justify-center active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="px-8 py-5 bg-slate-50 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-200">
                    <Car size={24} className="text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-tight">{selectedVehicle?.brand} {selectedVehicle?.model}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono">
                        {selectedVehicle?.plate?.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">• {selectedVehicle?.year}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {(!selectedVehicle?.history || selectedVehicle?.history.length === 0) ? (
                  <div className="text-center py-20 px-10">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 border-dashed">
                      <ClipboardList size={24} className="text-slate-200" />
                    </div>
                    <h3 className="text-slate-900 font-bold text-sm mb-1">Nenhum registro</h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">Este veículo ainda não possui histórico registrado.</p>
                  </div>
                ) : (
                  <div className="relative border-l-2 border-slate-100 ml-3 pl-8 space-y-8 py-4">
                    {selectedVehicle.history.map((item: any) => {
                      const isMaintenance = item.event_type === 'MAINTENANCE';
                      const isOwnership = item.event_type === 'OWNERSHIP';
                      const isRegistration = item.event_type === 'REGISTRATION';
                      
                      return (
                        <div key={item.id} className="relative group">
                          {/* Timeline Dot */}
                          <div className={cn(
                            "absolute -left-[41px] top-1 w-4 h-4 rounded-full border-[3px] border-white shadow-sm z-10 transition-transform group-hover:scale-125",
                            isMaintenance ? "bg-blue-600" : 
                            isOwnership ? "bg-purple-500" :
                            isRegistration ? "bg-emerald-500" : "bg-slate-400"
                          )} />
                          
                          <div 
                            className={cn(
                                "bg-white rounded-2xl border border-slate-100 p-5 shadow-sm transition-all",
                                isMaintenance ? "hover:shadow-md hover:border-blue-100 cursor-pointer" : ""
                            )}
                            onClick={() => isMaintenance && item.workOrderDetails && navigate(`/work-orders/${item.workOrderDetails.id}`)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="min-w-0">
                                <span className={cn(
                                    "text-[9px] font-bold uppercase tracking-widest mb-1 block",
                                    isMaintenance ? "text-blue-600" : 
                                    isOwnership ? "text-purple-600" :
                                    isRegistration ? "text-emerald-600" : "text-slate-500"
                                )}>
                                    {isMaintenance ? `OS: ${item.workOrderDetails?.number || '---'}` : 
                                     isOwnership ? 'Troca de Titular' :
                                     isRegistration ? 'Cadastro' : item.event_type}
                                </span>
                                <h4 className="font-bold text-slate-900 text-sm leading-tight truncate">
                                  {item.description}
                                </h4>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {isMaintenance && <Wrench size={14} className="text-blue-400" />}
                                {isOwnership && <User size={14} className="text-purple-400" />}
                                {isRegistration && <CheckCircle2 size={14} className="text-emerald-400" />}
                              </div>
                            </div>

                            {isMaintenance && item.workOrderDetails?.items && (
                              <div className="space-y-1.5 mb-4 mt-3">
                                {item.workOrderDetails.items.slice(0, 2).map((it: any, idx: number) => (
                                  <div key={idx} className="flex items-center gap-2 text-[10px] text-slate-500 font-medium font-mono">
                                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                                    <span className="truncate">{it.description}</span>
                                  </div>
                                ))}
                                {item.workOrderDetails.items.length > 2 && (
                                    <p className="text-[9px] text-slate-400 font-medium pl-3">+{item.workOrderDetails.items.length - 2} outros...</p>
                                )}
                              </div>
                            )}

                            {isOwnership && (
                                <div className="mt-3 bg-purple-50 rounded-xl p-3 border border-purple-100/50 flex items-center justify-between">
                                    <div className="text-center flex-1">
                                        <p className="text-[8px] font-bold text-purple-400 uppercase">Anterior</p>
                                        <p className="text-[10px] font-bold text-slate-600 truncate">{item.old_value || '---'}</p>
                                    </div>
                                    <ChevronRight size={14} className="text-purple-200 shrink-0" />
                                    <div className="text-center flex-1">
                                        <p className="text-[8px] font-bold text-purple-400 uppercase">Novo Dono</p>
                                        <p className="text-[10px] font-bold text-purple-700 truncate">{item.new_value}</p>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3 pb-3 mt-3 border-b border-slate-50">
                              <div className="bg-slate-50 rounded-xl p-2.5">
                                <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">KM</p>
                                <p className="text-xs font-bold text-slate-700">{item.km?.toLocaleString() || '---'}</p>
                              </div>
                              {(item.value > 0 || item.workOrderDetails?.total_amount > 0) && (
                                <div className="bg-slate-50 rounded-xl p-2.5">
                                  <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">Valor</p>
                                  <p className="text-xs font-bold text-emerald-600">R$ {(item.value || item.workOrderDetails?.total_amount)?.toLocaleString('pt-BR')}</p>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-3">
                              <div className="flex items-center gap-2">
                                <Calendar size={12} className="text-slate-300" />
                                <span className="text-[10px] font-medium text-slate-400">{format(new Date(item.created_at), 'dd/MM/yyyy')}</span>
                              </div>
                              <div className="flex items-center gap-1.5 overflow-hidden">
                                <LogIn size={12} className="text-slate-300" />
                                <span className="text-[10px] font-bold text-slate-600 truncate max-w-[80px]">{item.responsible_name || 'Sistema'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-100 shrink-0 bg-white flex gap-3">
                <button 
                  onClick={() => setIsHistoryDrawerOpen(false)} 
                  className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Fechar
                </button>
                <button 
                  onClick={() => navigate(`/vehicles/${selectedVehicle?.id}`)}
                  className="flex-[1.5] py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 shadow-xl shadow-slate-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  Prontuário Completo <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
