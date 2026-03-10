import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Car, User, Calendar, Hash, ChevronRight, X, 
  Fuel, Gauge, Palette, Shield, History, ClipboardList, 
  MoreVertical, Edit, Trash2, Info, AlertCircle, Filter,
  ArrowUpDown, Download, Upload, ExternalLink, MessageCircle,
  AlertTriangle, CheckCircle2, Clock, Printer,
  Package
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
      return matchStatus && matchBrand;
    });
  }, [vehicles, statusFilter, brandFilter]);

  return (
    <div className="flex flex-col h-full -m-6 bg-[#F6F8FB]">
      {/* Header - Compact */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-4 flex-1">
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Veículos</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider whitespace-nowrap">Gestão da frota</p>
          </div>
          <div className="h-6 w-px bg-slate-200 hidden md:block" />
          <div className="relative flex-1 max-w-md hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por placa, modelo, cliente, chassi..."
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
            <Plus size={16} /> Novo Veículo
          </button>
        </div>
      </header>

      {/* Mobile Search - Only visible on small screens */}
      <div className="md:hidden bg-white border-b border-slate-200 px-6 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Buscar veículos..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border-transparent rounded-lg text-sm outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Filters & Chips - Combined Row */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center gap-4 overflow-x-auto no-scrollbar shrink-0 mt-[25px]">
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
      <div className="flex-1 overflow-auto px-6 pb-6">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead className="sticky top-0 z-10">
            <tr className="bg-white">
              <th className="px-6 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">Veículo</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">Placa</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">Proprietário</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 text-center">KM Atual</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">Última OS</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">Próxima Revisão</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">Status</th>
              <th className="px-6 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
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
                className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
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
                <td className="px-6 py-2 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                      className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded transition-all" 
                      title="Ver Detalhes"
                    >
                      <ExternalLink size={14} />
                    </button>
                    <button 
                      onClick={() => { setSelectedVehicle(vehicle); setIsEditDrawerOpen(true); }}
                      className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded transition-all" 
                      title="Editar"
                    >
                      <Edit size={14} />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-all" title="Nova OS">
                      <Plus size={14} />
                    </button>
                    <button 
                      onClick={() => openHistory(vehicle)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all" 
                      title="Histórico"
                    >
                      <History size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Vehicle Modal - Compact */}
      <AnimatePresence>
        {isNewModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-xl shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                <h2 className="text-sm font-bold text-slate-900">Novo Veículo</h2>
                <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="overflow-y-auto p-4 space-y-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Busca Rápida FIPE</h3>
                    {isFipeLoading && <div className="w-3 h-3 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      type="button"
                      onClick={() => setVehicleType('carros')}
                      className={cn(
                        "py-1.5 rounded text-[10px] font-bold border transition-all",
                        vehicleType === 'carros' ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      )}
                    >Carros</button>
                    <button 
                      type="button"
                      onClick={() => setVehicleType('motos')}
                      className={cn(
                        "py-1.5 rounded text-[10px] font-bold border transition-all",
                        vehicleType === 'motos' ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      )}
                    >Motos</button>
                    <button 
                      type="button"
                      onClick={() => setVehicleType('caminhoes')}
                      className={cn(
                        "py-1.5 rounded text-[10px] font-bold border transition-all",
                        vehicleType === 'caminhoes' ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      )}
                    >Caminhões</button>
                  </div>

                  <div className="space-y-2">
                    <select 
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-slate-900"
                      value={selectedFipeBrand}
                      onChange={e => handleFipeBrandChange(e.target.value)}
                    >
                      <option value="">Selecione a Marca...</option>
                      {fipeBrands.map(b => <option key={b.codigo} value={b.codigo}>{b.nome}</option>)}
                    </select>

                    <select 
                      disabled={!selectedFipeBrand}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-50"
                      value={selectedFipeModel}
                      onChange={e => handleFipeModelChange(e.target.value)}
                    >
                      <option value="">Selecione o Modelo...</option>
                      {fipeModels.map(m => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}
                    </select>

                    <select 
                      disabled={!selectedFipeModel}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-50"
                      value={selectedFipeYear}
                      onChange={e => handleFipeYearChange(e.target.value)}
                    >
                      <option value="">Selecione o Ano/Versão...</option>
                      {fipeYears.map(y => <option key={y.codigo} value={y.codigo}>{y.nome}</option>)}
                    </select>
                  </div>
                </div>

                <div className="h-px bg-slate-100 my-2" />

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Proprietário</label>
                  <select 
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-900"
                    value={newVehicle.client_id}
                    onChange={e => setNewVehicle({...newVehicle, client_id: e.target.value})}
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Placa</label>
                    <input 
                      type="text" required 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-900 font-mono uppercase"
                      value={newVehicle.plate}
                      onChange={e => setNewVehicle({...newVehicle, plate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Marca</label>
                    <input 
                      type="text" required 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-900"
                      value={newVehicle.brand}
                      onChange={e => setNewVehicle({...newVehicle, brand: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Modelo</label>
                    <input 
                      type="text" required 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-900"
                      value={newVehicle.model}
                      onChange={e => setNewVehicle({...newVehicle, model: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Ano</label>
                    <input 
                      type="number" required
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-900"
                      value={newVehicle.year}
                      onChange={e => setNewVehicle({...newVehicle, year: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">KM Atual</label>
                    <input 
                      type="number" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-900"
                      value={newVehicle.km}
                      onChange={e => setNewVehicle({...newVehicle, km: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Combustível</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-900"
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
                <div className="p-4 border-t border-slate-100 flex gap-2 shrink-0">
                  <button type="button" onClick={() => setIsNewModalOpen(false)} className="flex-1 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
                  <button type="submit" className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800">Salvar Veículo</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Drawer - Premium */}
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
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-[40%] h-full shadow-2xl flex flex-col relative z-10"
            >
              <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 shrink-0">
                <div className="flex items-center gap-3 text-white">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Edit size={20} className="text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black italic uppercase tracking-tight">Editar Veículo</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Atualizar informações da frota</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditDrawerOpen(false)} 
                  className="w-10 h-10 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all flex items-center justify-center active:scale-90 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Proprietário Atual</label>
                    <select 
                      defaultValue={selectedVehicle?.client_id}
                      className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all appearance-none cursor-pointer"
                    >
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Placa</label>
                    <input 
                      type="text" 
                      defaultValue={selectedVehicle?.plate} 
                      className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-mono uppercase" 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Status do Veículo</label>
                    <select 
                      defaultValue={selectedVehicle?.status}
                      className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="ACTIVE">Ativo na Oficina</option>
                      <option value="INACTIVE">Inativo / Vendido</option>
                    </select>
                  </div>

                  <div className="col-span-2 h-px bg-slate-100 my-2" />

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Marca</label>
                    <input type="text" defaultValue={selectedVehicle?.brand} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Modelo</label>
                    <input type="text" defaultValue={selectedVehicle?.model} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Ano</label>
                    <input type="number" defaultValue={selectedVehicle?.year} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">KM Atual</label>
                    <input type="number" defaultValue={selectedVehicle?.km} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold" />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 shrink-0 bg-slate-50 flex gap-4">
                <button 
                  onClick={() => setIsEditDrawerOpen(false)} 
                  className="flex-1 py-4 border-2 border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-white hover:text-slate-600 transition-all cursor-pointer"
                >
                  Descartar
                </button>
                <button className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95 cursor-pointer">
                  Salvar Alterações
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Drawer - Premium */}
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
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-[40%] h-full shadow-2xl flex flex-col relative z-10"
            >
              <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 shrink-0">
                <div className="flex items-center gap-3 text-white">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <History size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black italic uppercase tracking-tight">Linha do Tempo</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Histórico de Manutenções</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsHistoryDrawerOpen(false)} 
                  className="w-10 h-10 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all flex items-center justify-center active:scale-90 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200">
                        <Car size={28} className="text-slate-400" />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 text-lg leading-tight uppercase italic">{selectedVehicle?.brand} {selectedVehicle?.model}</h3>
                        <p className="text-[10px] font-black text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded mt-1 inline-block font-mono tracking-wider">
                            {selectedVehicle?.plate?.toUpperCase()}
                        </p>
                    </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                {(!selectedVehicle?.workOrders || selectedVehicle?.workOrders.length === 0) ? (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <ClipboardList size={40} className="text-slate-200" />
                    </div>
                    <h3 className="text-slate-900 font-bold mb-1 italic uppercase">Sem registros</h3>
                    <p className="text-xs text-slate-500 font-medium">Este veículo ainda não possui ordens de serviço finalizadas.</p>
                  </div>
                ) : (
                  <div className="relative border-l-2 border-slate-100 ml-3 pl-10 space-y-10 py-4">
                    {selectedVehicle.workOrders.map((wo: any) => (
                      <div key={wo.id} className="relative group">
                        {/* Timeline Dot */}
                        <div className="absolute -left-[49px] top-0 w-6 h-6 rounded-full border-4 border-white bg-blue-500 shadow-sm z-10 transition-transform group-hover:scale-125" />
                        
                        <div 
                            className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm group-hover:shadow-xl group-hover:border-blue-100 transition-all group-hover:-translate-y-1 cursor-pointer"
                            onClick={() => navigate(`/work-orders/${wo.id}`)}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1 block">#{wo.number}</span>
                              <h4 className="font-black text-slate-900 text-base leading-tight uppercase italic">
                                {wo.items?.find((i: any) => i.category === 'SERVICE')?.name || 'Manutenção Corretiva'}
                              </h4>
                            </div>
                            <span className={cn(
                                "px-3 py-1 rounded-full text-[9px] font-black uppercase border",
                                wo.status === 'FINISHED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-blue-50 text-blue-600 border-blue-100"
                            )}>
                                {wo.status === 'FINISHED' ? 'Finalizada' : wo.status}
                            </span>
                          </div>

                          {/* Items List (Services & Parts) */}
                          <div className="space-y-2 mb-4">
                            {wo.items?.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-50 last:border-0">
                                <div className="flex items-center gap-2">
                                  {item.category === 'PART' ? <Package size={12} className="text-orange-400" /> : <Shield size={12} className="text-blue-400" />}
                                  <span className="font-bold text-slate-700 uppercase">{item.name}</span>
                                </div>
                                <span className="text-slate-400 font-bold">x{item.quantity}</span>
                              </div>
                            ))}
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100/50">
                                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Quilometragem</p>
                                <p className="text-sm font-black text-slate-700">{wo.km?.toLocaleString() || '---'} KM</p>
                            </div>
                            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100/50">
                                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Valor Total</p>
                                <p className="text-sm font-black text-emerald-600">R$ {wo.total_amount?.toLocaleString('pt-BR')}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-4">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-slate-300" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{format(new Date(wo.created_at), 'dd MMM yyyy', { locale: ptBR })}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <User size={14} className="text-slate-300" />
                                <span className="text-[10px] font-black text-slate-600 uppercase">{wo.mechanic_name || 'Mecânico'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-100 shrink-0 bg-slate-50 flex gap-4">
                <button 
                    onClick={() => setIsHistoryDrawerOpen(false)} 
                    className="flex-1 py-4 border-2 border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-white hover:text-slate-600 transition-all cursor-pointer"
                >
                    Fechar
                </button>
                <button 
                    onClick={() => navigate(`/vehicles/${selectedVehicle?.id}`)}
                    className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
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
