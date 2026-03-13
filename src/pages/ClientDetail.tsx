import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Phone, Mail, MapPin, Car, ClipboardList, 
  History, Info, MessageSquare, Plus, DollarSign, 
  FileText, Paperclip, Clock, CheckCircle2, AlertCircle,
  MoreVertical, ExternalLink, Printer, Send, Trash2, Edit,
  X, Calendar, User, Building2, MessageCircle, AlertTriangle,
  Wrench, Package, Upload, Link, Search
} from 'lucide-react';
import api from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { fipeService, FipeItem } from '../services/fipeService';
import { cepService } from '../services/cepService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ClientTab = 'SUMMARY' | 'VEHICLES' | 'OS' | 'APPOINTMENTS' | 'FINANCIAL' | 'ATTACHMENTS' | 'TIMELINE';

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ClientTab>('SUMMARY');

  const fetchClient = async () => {
    try {
      const res = await api.get(`/clients/${id}`);
      setClient(res.data);
    } catch (err) {
      console.error(err);
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClient();
  }, [id]);

  const [isNewOSModalOpen, setIsNewOSModalOpen] = useState(false);
  const [isNewVehicleModalOpen, setIsNewVehicleModalOpen] = useState(false);
  const [isLinkVehicleModalOpen, setIsLinkVehicleModalOpen] = useState(false);
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [isWADropdownOpen, setIsWADropdownOpen] = useState(false);

  // Link vehicle states
  const [allVehicles, setAllVehicles] = useState<any[]>([]);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [selectedVehicleToLink, setSelectedVehicleToLink] = useState<any>(null);
  const [linkWarning, setLinkWarning] = useState('');
  const [isLinkingVehicle, setIsLinkingVehicle] = useState(false);
  const [isCepLoading, setIsCepLoading] = useState(false);

  const [editClient, setEditClient] = useState<any>(null);

  useEffect(() => {
    if (client) {
      setEditClient({ ...client });
    }
  }, [client]);

  const handleCepChange = async (cep: string) => {
    setEditClient((prev: any) => ({ ...prev, cep }));
    if (cep.replace(/\D/g, '').length === 8) {
      setIsCepLoading(true);
      const address = await cepService.getAddress(cep);
      if (address) {
        setEditClient((prev: any) => ({
          ...prev,
          street: address.logradouro,
          neighborhood: address.bairro,
          city: address.localidade,
          state: address.uf
        }));
      }
      setIsCepLoading(false);
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/clients/${id}`, editClient);
      setIsEditClientModalOpen(false);
      fetchClient();
    } catch (err) {
      alert('Erro ao atualizar cliente');
    }
  };

  const [newVehicle, setNewVehicle] = useState({
    plate: '', brand: '', model: '', year: '', color: '', vin: '', fuel_type: 'FLEX', km: ''
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
    if (isNewVehicleModalOpen) {
      setIsFipeLoading(true);
      fipeService.getBrands(vehicleType)
        .then(setFipeBrands)
        .finally(() => setIsFipeLoading(false));
    }
  }, [isNewVehicleModalOpen, vehicleType]);

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

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/vehicles', { ...newVehicle, client_id: id });
      setIsNewVehicleModalOpen(false);
      setNewVehicle({
        plate: '', brand: '', model: '', year: '', color: '', vin: '', fuel_type: 'FLEX', km: ''
      });
      fetchClient();
    } catch (err) {
      alert('Erro ao cadastrar veículo');
    }
  };

  const fetchAllVehicles = async () => {
    try {
      const res = await api.get('/vehicles');
      setAllVehicles(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenLinkVehicleModal = () => {
    setVehicleSearch('');
    setSelectedVehicleToLink(null);
    setLinkWarning('');
    fetchAllVehicles();
    setIsLinkVehicleModalOpen(true);
  };

  const handleSelectVehicleToLink = (vehicle: any) => {
    setSelectedVehicleToLink(vehicle);
    // Check if this vehicle is already linked to this client
    if (vehicle.client_id === id) {
      setLinkWarning(`Este veículo já está vinculado a ${client?.name}.`);
    } else if (vehicle.client_id && vehicle.client_name) {
      setLinkWarning(`Atenção: este veículo já pertence ao cliente "${vehicle.client_name}". Ao vincular, ele será transferido para ${client?.name}.`);
    } else {
      setLinkWarning('');
    }
  };

  const handleLinkVehicle = async () => {
    if (!selectedVehicleToLink) return;
    if (selectedVehicleToLink.client_id === id) {
      // Already linked, just close
      setIsLinkVehicleModalOpen(false);
      return;
    }
    setIsLinkingVehicle(true);
    try {
      await api.patch(`/vehicles/${selectedVehicleToLink.id}`, { client_id: id });
      setIsLinkVehicleModalOpen(false);
      setSelectedVehicleToLink(null);
      fetchClient();
    } catch (err) {
      alert('Erro ao vincular veículo');
    } finally {
      setIsLinkingVehicle(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full">Carregando...</div>;
  if (!client) return null;

  const waTemplates = [
    { label: 'Confirmação de Entrada', text: 'Olá! Seu veículo deu entrada na oficina.' },
    { label: 'Solicitar Aprovação', text: 'O orçamento está pronto. Podemos prosseguir?' },
    { label: 'Veículo Pronto', text: 'Seu veículo está pronto para retirada!' },
    { label: 'Lembrete de Revisão', text: 'Está na hora da sua revisão periódica.' },
  ];

  const tabs: { id: ClientTab; label: string; icon: any }[] = [
    { id: 'SUMMARY', label: 'Resumo', icon: Info },
    { id: 'VEHICLES', label: 'Veículos', icon: Car },
    { id: 'OS', label: 'Ordens de Serviço', icon: ClipboardList },
    { id: 'APPOINTMENTS', label: 'Agendamentos', icon: Clock },
    { id: 'FINANCIAL', label: 'Financeiro', icon: DollarSign },
    { id: 'ATTACHMENTS', label: 'Anexos', icon: Paperclip },
    { id: 'TIMELINE', label: 'Histórico', icon: History },
  ];

  return (
    <div className="flex flex-col h-full -m-6 bg-[#F6F8FB]">
      {/* Header - Compact */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/clients')} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-600">
              {client.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">{client.name}</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{client.document || 'Sem documento'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => setIsWADropdownOpen(!isWADropdownOpen)}
              className="h-9 px-3 text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
            >
              <MessageSquare size={14} /> WhatsApp
            </button>
            {isWADropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-50 py-2">
                <p className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Templates</p>
                {waTemplates.map((t, i) => (
                  <button key={i} className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-all">
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button 
            onClick={() => setIsEditClientModalOpen(true)}
            className="h-9 px-3 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
          >
            <Edit size={14} /> Editar
          </button>
          <button 
            onClick={() => setIsNewOSModalOpen(true)}
            className="h-9 px-4 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm"
          >
            <Plus size={16} /> Nova OS
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-slate-200 px-6 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0 mt-[25px]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all relative",
              activeTab === tab.id ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <tab.icon size={14} />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <main className="flex-1 overflow-auto p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="max-w-6xl mx-auto"
          >
            {activeTab === 'SUMMARY' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column - Main Info */}
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Informações de Contato</h3>
                    </div>
                    <div className="p-6 grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                            <Phone size={16} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">WhatsApp / Telefone</p>
                            <p className="text-sm font-bold text-slate-900">{client.phone || 'Não informado'}</p>
                          </div>
                          <button className="ml-auto p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                            <MessageSquare size={16} />
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                            <Mail size={16} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">E-mail</p>
                            <p className="text-sm font-bold text-slate-900">{client.email || 'Não informado'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
                            <MapPin size={16} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Endereço</p>
                            <p className="text-sm font-bold text-slate-900">{client.street || 'Endereço não cadastrado'}</p>
                            <p className="text-xs text-slate-500">{client.neighborhood} • {client.city}/{client.state}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Observações Internas</h3>
                    </div>
                    <div className="p-6">
                      <p className="text-sm text-slate-600 leading-relaxed italic">
                        {client.internal_notes || 'Nenhuma observação registrada para este cliente.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column - Stats & Quick Actions */}
                <div className="space-y-6">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Métricas do Cliente</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Veículos</p>
                        <p className="text-lg font-black text-slate-900">{client.vehicles?.length || 0}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total de OS</p>
                        <p className="text-lg font-black text-slate-900">{client.workOrders?.length || 0}</p>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Total Gasto</p>
                        <p className="text-lg font-black text-emerald-700">R$ {(client.total_spent || 0).toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                        <p className="text-[10px] font-bold text-red-600 uppercase mb-1">Pendências</p>
                        <p className="text-lg font-black text-red-700">R$ {(client.pending_amount || 0).toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Última Visita</p>
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <Calendar size={14} className="text-slate-400" />
                        {client.last_visit ? format(new Date(client.last_visit), 'dd/MM/yyyy') : 'Nunca visitou'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 px-2">Ações Rápidas</h3>
                    <button onClick={() => setIsNewOSModalOpen(true)} className="w-full h-10 px-4 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-3 hover:bg-slate-800 transition-all">
                      <Plus size={16} /> Nova Ordem de Serviço
                    </button>
                    <button className="w-full h-10 px-4 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-3 hover:bg-slate-50 transition-all">
                      <Clock size={16} /> Novo Agendamento
                    </button>
                    <button className="w-full h-10 px-4 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-3 hover:bg-slate-50 transition-all">
                      <Car size={16} /> Adicionar Veículo
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'VEHICLES' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <h3 className="text-sm font-bold text-slate-900">Veículos do Cliente</h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleOpenLinkVehicleModal}
                      className="h-8 px-3 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
                    >
                      <Link size={14} /> Vincular Existente
                    </button>
                    <button 
                      onClick={() => setIsNewVehicleModalOpen(true)}
                      className="h-8 px-3 bg-slate-900 text-white rounded-lg text-[10px] font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors"
                    >
                      <Plus size={14} /> Novo Veículo
                    </button>
                  </div>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Veículo</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Placa</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">KM Atual</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Última OS</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {client.vehicles?.map((v: any) => (
                      <tr key={v.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                              <Car size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{v.brand} {v.model}</p>
                              <p className="text-[10px] text-slate-500">{v.year} • {v.color}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold bg-slate-900 text-white px-2 py-1 rounded font-mono tracking-wider">
                            {v.plate?.toUpperCase() || '---'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-600">{v.km?.toLocaleString('pt-BR')} KM</td>
                        <td className="px-6 py-4 text-xs text-slate-500">{v.last_os_date || '---'}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded transition-all" title="Criar OS">
                              <Plus size={14} />
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded transition-all" title="Editar">
                              <Edit size={14} />
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded transition-all" title="Histórico">
                              <History size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!client.vehicles || client.vehicles.length === 0) && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm italic">Nenhum veículo cadastrado.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'OS' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <h3 className="text-sm font-bold text-slate-900">Histórico de Ordens de Serviço</h3>
                  <div className="flex gap-2">
                    <select className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold outline-none">
                      <option>Todos Status</option>
                      <option>Abertas</option>
                      <option>Finalizadas</option>
                    </select>
                  </div>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">OS #</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Veículo</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valor</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {client.workOrders?.map((wo: any) => (
                      <tr key={wo.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => navigate(`/work-orders/${wo.id}`)}>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{wo.number}</td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-slate-700">{wo.model}</p>
                          <p className="text-[10px] text-slate-400 font-mono tracking-wider">{wo.plate?.toUpperCase()}</p>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">{format(new Date(wo.created_at), 'dd/MM/yyyy')}</td>
                        <td className="px-6 py-4 text-sm font-black text-slate-900">R$ {wo.total_amount?.toLocaleString('pt-BR')}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase border border-slate-200">
                            {wo.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                            <button className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded transition-all" title="Ver OS">
                              <ExternalLink size={14} />
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded transition-all" title="PDF">
                              <Printer size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!client.workOrders || client.workOrders.length === 0) && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm italic">Nenhuma OS encontrada.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'TIMELINE' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {(() => {
                    const events: any[] = [];
                    if (client.workOrders) {
                      client.workOrders.forEach((wo: any) => {
                         events.push({
                           id: `wo-${wo.id}`, type: 'WORK_ORDER', title: `Ordem de Serviço #${wo.number} Iniciada`, 
                           date: wo.created_at, description: `Valor Total: R$ ${wo.total_amount?.toLocaleString('pt-BR')} • Veículo: ${wo.model} (${wo.plate?.toUpperCase()})`,
                           link: `/work-orders/${wo.id}`, icon: ClipboardList, colorClass: "bg-blue-50 text-blue-500"
                         });
                         if (wo.items) {
                           wo.items.forEach((item: any) => {
                             events.push({
                               id: `item-${item.id}`, type: item.type, title: item.type === 'SERVICE' ? `Serviço Realizado` : `Peça Adicionada`,
                               date: wo.created_at, description: item.description,
                               link: `/work-orders/${wo.id}`, icon: item.type === 'SERVICE' ? Wrench : Package, colorClass: item.type === 'SERVICE' ? "bg-cyan-50 text-cyan-500" : "bg-purple-50 text-purple-500"
                             });
                           });
                         }
                      });
                    }
                    if (client.appointments) {
                      client.appointments.forEach((apt: any) => {
                        events.push({
                           id: `apt-${apt.id}`, type: 'APPOINTMENT', title: `Visita Agendada`,
                           date: apt.created_at || apt.date, description: `${apt.title} ${apt.description ? '- '+apt.description : ''}`,
                           link: null, icon: Clock, colorClass: "bg-amber-50 text-amber-500"
                        });
                      });
                    }
                    if (client.financial_records) {
                       client.financial_records.forEach((fin: any) => {
                         if (fin.status === 'PAID') {
                           events.push({
                              id: `fin-${fin.id}`, type: 'FINANCIAL', title: `Pagamento Recebido`,
                              date: fin.updated_at || fin.due_date, description: `Referente a: ${fin.description} • Valor: R$ ${fin.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                              link: fin.work_order_id ? `/work-orders/${fin.work_order_id}` : null, icon: DollarSign, colorClass: "bg-emerald-50 text-emerald-500"
                           });
                         }
                       });
                    }

                    if (events.length === 0) {
                      return (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                            <History size={32} />
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 mb-2">Sem Histórico</h3>
                          <p className="text-sm text-slate-500 max-w-sm mx-auto">Este cliente ainda não possui registros no histórico de interações.</p>
                        </div>
                      );
                    }

                    return events.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(item => (
                      <div key={item.id} className="relative flex items-start gap-6 group">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 z-10 shadow-sm border border-white transition-transform group-hover:scale-110",
                          item.colorClass
                        )}>
                          <item.icon size={18} />
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="flex items-center justify-between mb-1">
                            <div>
                               <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              {format(new Date(item.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                           <div className="flex items-center justify-between">
                             <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                               {item.description}
                             </p>
                            {item.link && (
                              <button 
                                onClick={() => navigate(item.link)}
                                className="text-[10px] font-black text-slate-400 hover:text-slate-900 flex items-center gap-1 transition-colors bg-slate-50 px-2 py-1 rounded border border-slate-100"
                              >
                                Ver Referência <ExternalLink size={10} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {activeTab === 'APPOINTMENTS' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <h3 className="text-sm font-bold text-slate-900">Agendamentos do Cliente</h3>
                  <button className="h-8 px-3 bg-slate-900 text-white rounded-lg text-[10px] font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors">
                    <Plus size={14} /> Novo Agendamento
                  </button>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data / Hora</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Veículo</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Serviço/Motivo</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {client.appointments && client.appointments.length > 0 ? (
                      client.appointments.map((apt: any) => (
                        <tr key={apt.id} className="hover:bg-slate-50 transition-colors group">
                           <td className="px-6 py-4">
                             <div className="flex flex-col">
                               <span className="text-sm font-bold text-slate-900">{format(new Date(apt.date), 'dd/MM/yyyy')}</span>
                               <span className="text-xs text-slate-500">{apt.time} - {apt.end_time || '--:--'}</span>
                             </div>
                           </td>
                           <td className="px-6 py-4">
                             <p className="text-sm font-bold text-slate-900 max-w-[150px] truncate">{apt.vehicle_model || 'Não inf.'}</p>
                             <p className="text-[10px] text-slate-400 font-mono tracking-wider">{apt.vehicle_plate?.toUpperCase() || '---'}</p>
                           </td>
                           <td className="px-6 py-4">
                             <p className="text-sm text-slate-700 max-w-sm truncate">{apt.title}</p>
                             <p className="text-[10px] text-slate-400 font-medium max-w-sm truncate">{apt.description}</p>
                           </td>
                           <td className="px-6 py-4">
                             <span className={cn(
                               "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border",
                               apt.status === 'SCHEDULED' ? "bg-amber-50 text-amber-600 border-amber-100" :
                               apt.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                               apt.status === 'CANCELLED' ? "bg-red-50 text-red-600 border-red-100" :
                               "bg-slate-50 text-slate-600 border-slate-200"
                             )}>
                               {apt.status === 'SCHEDULED' ? 'Agendado' :
                                apt.status === 'COMPLETED' ? 'Concluído' :
                                apt.status === 'CANCELLED' ? 'Cancelado' : apt.status}
                             </span>
                           </td>
                           <td className="px-6 py-4 text-right">
                             <div className="flex items-center justify-end gap-1">
                               <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-200 rounded transition-all cursor-pointer" title="Ver Detalhes">
                                 <ExternalLink size={14} />
                               </button>
                               <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-200 rounded transition-all cursor-pointer" title="Editar">
                                 <Edit size={14} />
                               </button>
                             </div>
                           </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm italic">Nenhum agendamento encontrado para este cliente.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'FINANCIAL' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50">
                  <h3 className="text-sm font-bold text-slate-900">Histórico Financeiro</h3>
                  <div className="flex gap-2 shrink-0">
                     <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-100">
                        Pago: R$ {(client.total_spent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                     </span>
                     <span className="px-3 py-1 bg-red-50 text-red-700 font-bold text-xs rounded-lg border border-red-100">
                        Em Aberto: R$ {(client.pending_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                     </span>
                  </div>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vencimento</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descrição / Origem</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Valor</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {client.financial_records && client.financial_records.length > 0 ? (
                      client.financial_records.map((fin: any) => (
                        <tr key={fin.id} className="hover:bg-slate-50 transition-colors group">
                           <td className="px-6 py-4 text-xs font-bold text-slate-700">
                             {format(new Date(fin.due_date), 'dd/MM/yyyy')}
                           </td>
                           <td className="px-6 py-4">
                             <div className="flex items-center gap-2">
                               <span className="text-sm font-bold text-slate-900">{fin.description}</span>
                               {fin.work_order_id && (
                                 <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase cursor-pointer hover:bg-slate-200" onClick={() => navigate(`/work-orders/${fin.work_order_id}`)}>
                                   OS Associada
                                 </span>
                               )}
                             </div>
                           </td>
                           <td className="px-6 py-4 text-right">
                             <span className="text-sm font-black text-slate-900">R$ {fin.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                           </td>
                           <td className="px-6 py-4 text-center">
                             <span className={cn(
                               "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border",
                               fin.status === 'PAID' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                               fin.status === 'OVERDUE' ? "bg-red-50 text-red-600 border-red-100" :
                               "bg-amber-50 text-amber-600 border-amber-100"
                             )}>
                               {fin.status === 'PAID' ? 'Pago' :
                                fin.status === 'OVERDUE' ? 'Atrasado' : 'Aberto'}
                             </span>
                           </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm italic">Nenhuma movimentação financeira encontrada para este cliente.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'ATTACHMENTS' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Documentos e Anexos</h3>
                  <button className="h-8 px-3 bg-slate-900 text-white rounded-lg text-[10px] font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors">
                    <Upload size={14} /> Enviar Arquivo
                  </button>
                </div>
                {client.attachments && client.attachments.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {client.attachments.map((file: any) => (
                      <div key={file.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 hover:border-indigo-300 hover:shadow-sm transition-all group flex flex-col cursor-pointer shrink-0 min-w-0">
                         <div className="flex-1 flex items-center justify-center mb-3 text-slate-400 group-hover:text-indigo-500 transition-colors pt-4 pb-2">
                           <FileText size={32} />
                         </div>
                         <p className="text-xs font-bold text-slate-900 truncate" title={file.name}>{file.name}</p>
                         <div className="flex items-center justify-between mt-1">
                           <p className="text-[10px] text-slate-500 uppercase">{format(new Date(file.created_at), 'dd/MM/yyyy')}</p>
                           <p className="text-[10px] text-slate-400 font-medium">{file.size}</p>
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4 shadow-sm">
                      <Paperclip size={24} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">Nenhum anexo</h3>
                    <p className="text-xs text-slate-500">Faça o upload de documentos e arquivos do cliente aqui.</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* New OS Modal - Compact */}
      <AnimatePresence>
        {isNewOSModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-xl shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                <h2 className="text-sm font-bold text-slate-900">Nova Ordem de Serviço</h2>
                <button onClick={() => setIsNewOSModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Veículo</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-900">
                    <option value="">Selecione um veículo...</option>
                    {client.vehicles?.map((v: any) => (
                      <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate?.toUpperCase() || '---'})</option>
                    ))}
                    <option value="new">+ Novo Veículo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Queixa do Cliente</label>
                  <textarea rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-900" placeholder="Relato do cliente..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Responsável</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-900">
                      <option value="">Selecione...</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Previsão Entrega</label>
                    <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-900" />
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-slate-100 flex gap-2 shrink-0">
                <button onClick={() => setIsNewOSModalOpen(false)} className="flex-1 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
                <button className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800">Criar OS</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Client Modal */}
      <AnimatePresence>
        {isEditClientModalOpen && editClient && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-xl shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                <h2 className="text-sm font-bold text-slate-900">Editar Cliente</h2>
                <button onClick={() => setIsEditClientModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleUpdateClient} className="overflow-y-auto p-4 space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome Completo</label>
                    <input 
                      type="text" required
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 outline-none" 
                      value={editClient.name}
                      onChange={e => setEditClient({ ...editClient, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">WhatsApp</label>
                      <input 
                        type="text" required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 outline-none" 
                        value={editClient.phone}
                        onChange={e => setEditClient({ ...editClient, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">E-mail</label>
                      <input 
                        type="email" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 outline-none" 
                        value={editClient.email}
                        onChange={e => setEditClient({ ...editClient, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 my-2" />
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Endereço</h3>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center justify-between">
                        CEP {isCepLoading && <div className="w-2 h-2 border border-slate-900 border-t-transparent rounded-full animate-spin" />}
                      </label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 outline-none" 
                        placeholder="00000-000"
                        value={editClient.cep || ''}
                        onChange={e => handleCepChange(e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rua</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 outline-none" 
                        value={editClient.street || ''}
                        onChange={e => setEditClient({ ...editClient, street: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Número</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 outline-none" 
                        value={editClient.number || ''}
                        onChange={e => setEditClient({ ...editClient, number: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Complemento</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 outline-none" 
                        value={editClient.complement || ''}
                        onChange={e => setEditClient({ ...editClient, complement: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Bairro</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 outline-none" 
                        value={editClient.neighborhood || ''}
                        onChange={e => setEditClient({ ...editClient, neighborhood: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cidade</label>
                        <input 
                          type="text" 
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 outline-none" 
                          value={editClient.city || ''}
                          onChange={e => setEditClient({ ...editClient, city: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">UF</label>
                        <input 
                          type="text" 
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 outline-none uppercase" 
                          maxLength={2}
                          value={editClient.state || ''}
                          onChange={e => setEditClient({ ...editClient, state: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-slate-100 flex gap-2 shrink-0">
                  <button type="button" onClick={() => setIsEditClientModalOpen(false)} className="flex-1 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
                  <button type="submit" className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800">Salvar Alterações</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Link Vehicle Modal */}
      <AnimatePresence>
        {isLinkVehicleModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-slate-900 text-white rounded-lg flex items-center justify-center">
                    <Link size={14} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Vincular Veículo</h2>
                    <p className="text-[10px] text-slate-500">Selecione um veículo para vincular a {client?.name}</p>
                  </div>
                </div>
                <button onClick={() => setIsLinkVehicleModalOpen(false)} className="text-slate-400 hover:text-slate-900 p-1 hover:bg-slate-100 rounded-lg transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Search */}
              <div className="px-4 py-3 border-b border-slate-100 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Buscar por placa, marca, modelo..."
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all"
                    value={vehicleSearch}
                    onChange={e => setVehicleSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Vehicle List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {allVehicles
                  .filter(v => {
                    const q = vehicleSearch.toLowerCase();
                    return !q || 
                      v.plate?.toLowerCase().includes(q) ||
                      v.brand?.toLowerCase().includes(q) ||
                      v.model?.toLowerCase().includes(q);
                  })
                  .map(vehicle => {
                    const isAlreadyLinkedHere = vehicle.client_id === id;
                    const isLinkedElsewhere = vehicle.client_id && vehicle.client_id !== id;
                    const isSelected = selectedVehicleToLink?.id === vehicle.id;

                    return (
                      <button
                        key={vehicle.id}
                        type="button"
                        onClick={() => handleSelectVehicleToLink(vehicle)}
                        className={cn(
                          "w-full text-left p-3 rounded-xl border-2 transition-all flex items-center gap-3",
                          isSelected
                            ? "border-slate-900 bg-slate-50"
                            : isAlreadyLinkedHere
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-transparent bg-slate-50 hover:border-slate-200 hover:bg-white"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          isAlreadyLinkedHere ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-500"
                        )}>
                          <Car size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 truncate">{vehicle.brand} {vehicle.model}</span>
                            <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[9px] font-black uppercase shrink-0">{vehicle.year}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded font-mono">{vehicle.plate?.toUpperCase() || '---'}</span>
                            {vehicle.color && <span className="text-[10px] text-slate-400">{vehicle.color}</span>}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          {isAlreadyLinkedHere && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                              <CheckCircle2 size={12} /> Vinculado
                            </span>
                          )}
                          {isLinkedElsewhere && (
                            <span className="text-[10px] text-amber-600 font-bold">Outro cliente</span>
                          )}
                          {!vehicle.client_id && (
                            <span className="text-[10px] text-slate-400">Sem dono</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                {allVehicles.filter(v => {
                  const q = vehicleSearch.toLowerCase();
                  return !q || v.plate?.toLowerCase().includes(q) || v.brand?.toLowerCase().includes(q) || v.model?.toLowerCase().includes(q);
                }).length === 0 && (
                  <div className="text-center py-10 text-slate-400">
                    <Car size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Nenhum veículo encontrado.</p>
                  </div>
                )}
              </div>

              {/* Warning */}
              {linkWarning && selectedVehicleToLink && (
                <div className={cn(
                  "mx-4 mb-2 px-3 py-2.5 rounded-xl flex items-start gap-2 text-xs font-medium border shrink-0",
                  selectedVehicleToLink.client_id === id
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-amber-50 border-amber-200 text-amber-700"
                )}>
                  {selectedVehicleToLink.client_id === id
                    ? <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                    : <AlertTriangle size={14} className="shrink-0 mt-0.5" />}
                  <span>{linkWarning}</span>
                </div>
              )}

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 flex gap-2 shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsLinkVehicleModalOpen(false)} 
                  className="flex-1 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={handleLinkVehicle}
                  disabled={!selectedVehicleToLink || selectedVehicleToLink.client_id === id || isLinkingVehicle}
                  className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLinkingVehicle ? 'Vinculando...' : selectedVehicleToLink?.client_id === id ? 'Já vinculado' : 'Vincular Veículo'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Vehicle Modal - Compact */}
      <AnimatePresence>
        {isNewVehicleModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-xl shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                <h2 className="text-sm font-bold text-slate-900">Novo Veículo</h2>
                <button onClick={() => setIsNewVehicleModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreateVehicle} className="overflow-y-auto p-4 space-y-4">
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
                  <button type="button" onClick={() => setIsNewVehicleModalOpen(false)} className="flex-1 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
                  <button type="submit" className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800">Salvar Veículo</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

