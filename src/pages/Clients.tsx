import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Phone, Mail, MapPin, ChevronRight, X, 
  User, Building2, Tag, Calendar, MessageSquare, 
  History, Car, ClipboardList, MoreVertical, Trash2,
  Edit, Ban, CheckCircle, Info, Clock, Send,
  Download, Upload, Filter, ArrowUpDown, ExternalLink,
  MessageCircle, DollarSign, AlertTriangle
} from 'lucide-react';
import api from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ImportExportModal from '../components/ImportExportModal';

import { cepService } from '../services/cepService';

type ClientStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [historyTab, setHistoryTab] = useState<'vehicles' | 'os'>('os');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [isEditCepLoading, setIsEditCepLoading] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [newClient, setNewClient] = useState({
    name: '',
    type: 'PF',
    document: '',
    phone: '',
    email: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  });

  const handleCepChange = async (cep: string) => {
    setNewClient(prev => ({ ...prev, cep }));
    if (cep.replace(/\D/g, '').length === 8) {
      setIsCepLoading(true);
      const address = await cepService.getAddress(cep);
      if (address) {
        setNewClient(prev => ({
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

  // Template data for import
  const templateData = [{
    name: 'Nome do Cliente',
    type: 'PF ou PJ',
    document: 'CPF ou CNPJ',
    phone: '(11) 98765-4321',
    email: 'cliente@email.com',
    cep: '01234-567',
    street: 'Rua Exemplo',
    number: '123',
    complement: 'Apto 45',
    neighborhood: 'Bairro',
    city: 'Cidade',
    state: 'SP'
  }];

  // Columns for export
  const exportColumns = [
    { header: 'Nome', dataKey: 'name' },
    { header: 'Tipo', dataKey: 'type' },
    { header: 'Documento', dataKey: 'document' },
    { header: 'Telefone', dataKey: 'phone' },
    { header: 'Email', dataKey: 'email' },
    { header: 'Cidade', dataKey: 'city' },
    { header: 'Estado', dataKey: 'state' },
    { header: 'Status', dataKey: 'status' }
  ];

  // Handle import
  const handleImport = async (data: any[]) => {
    try {
      // Validate and transform data
      const validData = data.map(item => ({
        name: item.name || item.Nome || '',
        type: (item.type || item.Tipo || 'PF').toUpperCase(),
        document: item.document || item.Documento || item.CPF || item.CNPJ || '',
        phone: item.phone || item.Telefone || item.telefone || '',
        email: item.email || item.Email || '',
        cep: item.cep || item.CEP || '',
        street: item.street || item.Rua || item.Logradouro || '',
        number: item.number || item.Numero || item.Número || '',
        complement: item.complement || item.Complemento || '',
        neighborhood: item.neighborhood || item.Bairro || '',
        city: item.city || item.Cidade || '',
        state: item.state || item.Estado || item.UF || ''
      }));

      // Send to backend bulk endpoint
      const response = await api.post('/clients/bulk', validData);
      
      if (response.data.errors && response.data.errors.length > 0) {
        console.warn('Alguns registros falharam:', response.data.errors);
      }

      if (response.data.success === 0) {
        throw new Error('Nenhum registro foi importado com sucesso');
      }

      fetchClients();
      return response.data;
    } catch (error: any) {
      console.error('Erro ao importar clientes:', error);
      throw new Error(error.response?.data?.error || 'Erro ao importar clientes. Verifique os dados e tente novamente.');
    }
  };

  const [editClient, setEditClient] = useState<any>(null);

  useEffect(() => {
    if (selectedClient) {
      setEditClient({ ...selectedClient });
    }
  }, [selectedClient]);

  const handleEditCepChange = async (cep: string) => {
    setEditClient((prev: any) => ({ ...prev, cep }));
    if (cep.replace(/\D/g, '').length === 8) {
      setIsEditCepLoading(true);
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
      setIsEditCepLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/clients/${editClient.id}`, editClient);
      setIsEditDrawerOpen(false);
      fetchClients();
    } catch (err) {
      alert('Erro ao atualizar cliente');
    }
  };
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/clients', newClient);
      setIsNewModalOpen(false);
      setNewClient({
        name: '', type: 'PF', document: '', phone: '', email: '',
        cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: ''
      });
      fetchClients();
    } catch (err) {
      alert('Erro ao cadastrar cliente');
    }
  };

  const handleViewHistory = async (client: any, tab: 'vehicles' | 'os' = 'os') => {
    try {
      setLoading(true);
      const res = await api.get(`/clients/${client.id}`);
      setSelectedClient(res.data);
      setHistoryTab(tab);
      setIsHistoryDrawerOpen(true);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/clients?q=${search}&status=${statusFilter}&type=${typeFilter}`);
      setClients(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [search, statusFilter, typeFilter]);

  const statusMap: Record<ClientStatus, any> = {
    ACTIVE: { label: 'Ativo', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle },
    INACTIVE: { label: 'Inativo', color: 'bg-slate-50 text-slate-600 border-slate-200', icon: Info },
    BLOCKED: { label: 'Bloqueado', color: 'bg-red-50 text-red-600 border-red-100', icon: Ban },
  };

  const quickFilters = [
    { id: 'VIP', label: 'VIP', color: 'bg-purple-50 text-purple-600' },
    { id: 'INADIMPLENTE', label: 'Inadimplente', color: 'bg-red-50 text-red-600' },
    { id: 'FROTISTA', label: 'Frotista', color: 'bg-blue-50 text-blue-600' },
    { id: 'SEM_VEICULO', label: 'Sem Veículo', color: 'bg-slate-50 text-slate-600' },
  ];

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Header - Compact */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4 flex-1">
          <h1 className="text-lg font-bold text-slate-900">Clientes</h1>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="h-9 px-3 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
          >
            <Upload size={14} /> <span className="hidden sm:inline">Importar</span>
          </button>
          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="h-9 px-3 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
          >
            <Download size={14} /> <span className="hidden sm:inline">Exportar</span>
          </button>
          <button 
            onClick={() => setIsNewModalOpen(true)}
            className="h-9 px-4 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm whitespace-nowrap"
          >
            <Plus size={16} /> Novo Cliente
          </button>
        </div>
      </header>

      {/* Filters & Chips */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center gap-4 overflow-x-auto no-scrollbar">
        <div className="relative flex-1 min-w-[200px] max-w-xs shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input 
            type="text" 
            placeholder="Buscar clientes..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="h-4 w-px bg-slate-200 shrink-0" />
        <div className="flex items-center gap-2 shrink-0">
          <Filter size={14} className="text-slate-400" />
          <select 
            className="bg-transparent border-none focus:ring-0 text-xs font-bold text-slate-600 p-0 pr-6"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">Status: Todos</option>
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
            <option value="BLOCKED">Bloqueado</option>
          </select>
          <select 
            className="bg-transparent border-none focus:ring-0 text-xs font-bold text-slate-600 p-0 pr-6"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="">Tipo: Todos</option>
            <option value="PF">Pessoa Física</option>
            <option value="PJ">Pessoa Jurídica</option>
          </select>
        </div>

        <div className="h-4 w-px bg-slate-200 shrink-0" />

        <div className="flex items-center gap-2 shrink-0">
          {quickFilters.map(filter => (
            <button 
              key={filter.id}
              onClick={() => setTagFilter(tagFilter === filter.id ? '' : filter.id)}
              className={cn(
                "px-2 py-1 rounded-md text-[10px] font-bold transition-all border",
                tagFilter === filter.id 
                  ? "bg-slate-900 text-white border-slate-900" 
                  : `${filter.color} border-transparent hover:border-current`
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead className="sticky top-0 bg-slate-50 z-20 shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]">
            <tr>
              <th className="px-6 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cliente</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Documento</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contato</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Veículos</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">O.S.</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pendências</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky right-0 bg-slate-50 z-20 text-right shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)]">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-sm italic">Carregando clientes...</td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-sm italic">Nenhum cliente encontrado.</td>
              </tr>
            ) : clients.map((client) => (
              <tr 
                key={client.id} 
                className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                <td className="px-6 py-2">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0",
                      client.type === 'PJ' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                    )}>
                      {client.type === 'PJ' ? <Building2 size={14} /> : client.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 truncate">{client.name}</span>
                        {client.tags?.map((tag: string) => (
                          <span key={tag} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[8px] font-black uppercase">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium truncate">
                        {client.city || 'Cidade não inf.'} • {client.state || 'UF'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <span className="text-xs font-medium text-slate-600 font-mono tracking-tight">
                    {client.document || '---'}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <MessageCircle size={10} className="text-emerald-500" /> {client.phone || '---'}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">{client.email || '---'}</span>
                  </div>
                </td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); if ((client.vehicles_count || 0) > 0) handleViewHistory(client, 'vehicles'); }}
                    className={cn(
                      "inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-[10px] font-bold transition-all",
                      (client.vehicles_count || 0) > 0
                        ? "bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-110 cursor-pointer"
                        : "bg-slate-100 text-slate-400 cursor-default"
                    )}
                    title={(client.vehicles_count || 0) > 0 ? "Ver veículos" : "Sem veículos"}
                  >
                    {client.vehicles_count || 0}
                  </button>
                </td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); if ((client.os_count || 0) > 0) handleViewHistory(client, 'os'); }}
                    className={cn(
                      "inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-[10px] font-bold transition-all",
                      (client.os_count || 0) > 0
                        ? "bg-orange-50 text-orange-600 hover:bg-orange-100 hover:scale-110 cursor-pointer"
                        : "bg-slate-100 text-slate-400 cursor-default"
                    )}
                    title={(client.os_count || 0) > 0 ? "Ver ordens de serviço" : "Sem O.S."}
                  >
                    {client.os_count || 0}
                  </button>
                </td>
                <td className="px-4 py-2">
                  {client.pendencies_count > 0 ? (
                    <div className="flex items-center gap-1 text-red-600 font-bold text-xs bg-red-50 w-fit px-2 py-1 rounded-md">
                      <AlertTriangle size={12} /> {client.pendencies_count} pendente(s)
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md flex items-center gap-1 w-fit">
                      <CheckCircle size={12} /> OK
                    </span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-tight",
                    statusMap[client.status as ClientStatus]?.color
                  )}>
                    {statusMap[client.status as ClientStatus]?.label}
                  </span>
                </td>
                <td className="px-6 py-2 text-right sticky right-0 bg-white group-hover:bg-slate-50/80 transition-colors shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.02)] z-10">
                  <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={() => handleViewHistory(client)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all" 
                      title="Ver Histórico"
                    >
                      <History size={14} />
                    </button>
                    <button 
                      onClick={() => navigate(`/clients/${client.id}`)}
                      className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded transition-all" 
                      title="Ver Detalhes"
                    >
                      <ExternalLink size={14} />
                    </button>
                    <button 
                      onClick={() => { setSelectedClient(client); setIsEditDrawerOpen(true); }}
                      className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded transition-all" 
                      title="Editar"
                    >
                      <Edit size={14} />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all" title="WhatsApp">
                      <MessageCircle size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Client Modal - Compact */}
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
                <h2 className="text-sm font-bold text-slate-900">Novo Cliente</h2>
                <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="overflow-y-auto p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => setNewClient({ ...newClient, type: 'PF' })}
                    className={cn(
                      "py-2 rounded-lg text-xs font-bold transition-all",
                      newClient.type === 'PF' ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    )}
                  >Pessoa Física</button>
                  <button 
                    type="button"
                    onClick={() => setNewClient({ ...newClient, type: 'PJ' })}
                    className={cn(
                      "py-2 rounded-lg text-xs font-bold transition-all",
                      newClient.type === 'PJ' ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    )}
                  >Pessoa Jurídica</button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome Completo</label>
                    <input 
                      type="text" required
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 outline-none" 
                      value={newClient.name}
                      onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{newClient.type === 'PF' ? 'CPF' : 'CNPJ'}</label>
                      <input 
                        type="text" required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 outline-none" 
                        value={newClient.document}
                        onChange={e => setNewClient({ ...newClient, document: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">WhatsApp</label>
                      <input 
                        type="text" required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 outline-none" 
                        value={newClient.phone}
                        onChange={e => setNewClient({ ...newClient, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">E-mail</label>
                    <input 
                      type="email" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 outline-none" 
                      value={newClient.email}
                      onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                    />
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
                        value={newClient.cep}
                        onChange={e => handleCepChange(e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rua</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 outline-none" 
                        value={newClient.street}
                        onChange={e => setNewClient({ ...newClient, street: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Número</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 outline-none" 
                        value={newClient.number}
                        onChange={e => setNewClient({ ...newClient, number: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Complemento</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 outline-none" 
                        value={newClient.complement}
                        onChange={e => setNewClient({ ...newClient, complement: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Bairro</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 outline-none" 
                        value={newClient.neighborhood}
                        onChange={e => setNewClient({ ...newClient, neighborhood: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cidade</label>
                        <input 
                          type="text" 
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 outline-none" 
                          value={newClient.city}
                          onChange={e => setNewClient({ ...newClient, city: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">UF</label>
                        <input 
                          type="text" 
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 outline-none uppercase" 
                          maxLength={2}
                          value={newClient.state}
                          onChange={e => setNewClient({ ...newClient, state: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-slate-100 flex gap-2 shrink-0">
                  <button type="button" onClick={() => setIsNewModalOpen(false)} className="flex-1 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
                  <button type="submit" className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800">Salvar Cliente</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Drawer - Compact */}
      <AnimatePresence>
        {isEditDrawerOpen && editClient && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex justify-end">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="bg-white w-full max-w-sm h-full shadow-2xl flex flex-col"
            >
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                <h2 className="text-sm font-bold text-slate-900">Editar Cliente</h2>
                <button onClick={() => setIsEditDrawerOpen(false)} className="text-slate-400 hover:text-slate-900">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleUpdate} className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome Completo</label>
                    <input 
                      type="text" required
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-900" 
                      value={editClient.name}
                      onChange={e => setEditClient({ ...editClient, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">WhatsApp</label>
                      <input 
                        type="text" required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-900" 
                        value={editClient.phone}
                        onChange={e => setEditClient({ ...editClient, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-900"
                        value={editClient.status}
                        onChange={e => setEditClient({ ...editClient, status: e.target.value })}
                      >
                        <option value="ACTIVE">Ativo</option>
                        <option value="INACTIVE">Inativo</option>
                        <option value="BLOCKED">Bloqueado</option>
                      </select>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 my-2" />
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Endereço</h3>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center justify-between">
                        CEP {isEditCepLoading && <div className="w-2 h-2 border border-slate-900 border-t-transparent rounded-full animate-spin" />}
                      </label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 outline-none" 
                        placeholder="00000-000"
                        value={editClient.cep || ''}
                        onChange={e => handleEditCepChange(e.target.value)}
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
                <div className="p-4 border-t border-slate-100 flex gap-2 shrink-0 mt-auto">
                  <button type="button" onClick={() => setIsEditDrawerOpen(false)} className="flex-1 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
                  <button type="submit" className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800">Salvar Alterações</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Drawer - Premium */}
      <AnimatePresence>
        {isHistoryDrawerOpen && selectedClient && (
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
              className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col relative z-10"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 shrink-0">
                <div className="flex items-center gap-3 text-white">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <History size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-black italic uppercase tracking-tight">Histórico do Cliente</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Passagens na oficina</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsHistoryDrawerOpen(false)} 
                  className="w-10 h-10 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all flex items-center justify-center active:scale-90 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Client Info */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200 font-bold text-lg text-slate-500 uppercase">
                    {selectedClient.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base leading-tight uppercase italic">{selectedClient.name}</h3>
                    <p className="text-[10px] font-black text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded mt-0.5 inline-block tracking-wider uppercase font-mono">
                      {selectedClient.document || 'Sem documento'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-100 shrink-0 bg-white">
                <button
                  onClick={() => setHistoryTab('vehicles')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 text-[11px] font-black uppercase tracking-wider transition-all border-b-2",
                    historyTab === 'vehicles'
                      ? "border-blue-600 text-blue-600 bg-blue-50/50"
                      : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <Car size={14} />
                  Veículos
                  {selectedClient.vehicles && selectedClient.vehicles.length > 0 && (
                    <span className="bg-blue-100 text-blue-600 rounded-full px-1.5 text-[9px] font-black">{selectedClient.vehicles.length}</span>
                  )}
                </button>
                <button
                  onClick={() => setHistoryTab('os')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 text-[11px] font-black uppercase tracking-wider transition-all border-b-2",
                    historyTab === 'os'
                      ? "border-orange-500 text-orange-600 bg-orange-50/50"
                      : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <ClipboardList size={14} />
                  O.S.
                  {selectedClient.workOrders && selectedClient.workOrders.length > 0 && (
                    <span className="bg-orange-100 text-orange-600 rounded-full px-1.5 text-[9px] font-black">{selectedClient.workOrders.length}</span>
                  )}
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Vehicles Tab */}
                {historyTab === 'vehicles' && (
                  <div className="p-6">
                    {(!selectedClient.vehicles || selectedClient.vehicles.length === 0) ? (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Car size={32} className="text-slate-200" />
                        </div>
                        <h3 className="text-slate-700 font-bold mb-1 italic uppercase text-sm">Sem veículos</h3>
                        <p className="text-xs text-slate-400">Este cliente não possui veículos cadastrados.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedClient.vehicles.map((vehicle: any) => (
                          <div
                            key={vehicle.id}
                            onClick={() => { setIsHistoryDrawerOpen(false); navigate(`/vehicles/${vehicle.id}`); }}
                            className="group bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                                <Car size={22} className="text-blue-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-black text-slate-900 text-sm uppercase italic leading-tight">
                                  {vehicle.brand} {vehicle.model}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono tracking-wider uppercase">
                                    {vehicle.plate}
                                  </span>
                                  {vehicle.year && (
                                    <span className="text-[10px] text-slate-400 font-bold">{vehicle.year}</span>
                                  )}
                                  {vehicle.color && (
                                    <span className="text-[10px] text-slate-400">{vehicle.color}</span>
                                  )}
                                </div>
                              </div>
                              <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-400 shrink-0 transition-colors" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Work Orders Tab */}
                {historyTab === 'os' && (
                  <div className="p-6">
                    {(!selectedClient.workOrders || selectedClient.workOrders.length === 0) ? (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <ClipboardList size={32} className="text-slate-200" />
                        </div>
                        <h3 className="text-slate-700 font-bold mb-1 italic uppercase text-sm">Sem registros</h3>
                        <p className="text-xs text-slate-400">Este cliente não possui ordens de serviço.</p>
                      </div>
                    ) : (
                      <div className="relative border-l-2 border-slate-100 ml-3 pl-8 space-y-6 py-2">
                        {selectedClient.workOrders.map((wo: any) => (
                          <div key={wo.id} className="relative group">
                            <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-white bg-orange-400 shadow-sm z-10 transition-transform group-hover:scale-125" />
                            <div 
                              className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm group-hover:shadow-lg group-hover:border-orange-100 transition-all cursor-pointer"
                              onClick={() => { setIsHistoryDrawerOpen(false); navigate(`/work-orders/${wo.id}`); }}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.15em] mb-0.5 block">{wo.number}</span>
                                  <h4 className="font-black text-slate-900 text-xs leading-tight uppercase italic">
                                    {wo.brand} {wo.model} {wo.plate ? `— ${wo.plate}` : ''}
                                  </h4>
                                </div>
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[9px] font-black uppercase border shrink-0 ml-2",
                                  wo.status === 'FINISHED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                  wo.status === 'IN_PROGRESS' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                  "bg-slate-50 text-slate-500 border-slate-200"
                                )}>
                                  {wo.status === 'FINISHED' ? 'Finalizada' : wo.status === 'IN_PROGRESS' ? 'Em andamento' : wo.status}
                                </span>
                              </div>

                              {wo.items && wo.items.length > 0 && (
                                <div className="space-y-1 mb-3">
                                  {wo.items.slice(0, 2).map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between text-[10px] font-medium">
                                      <span className="text-slate-600 uppercase truncate pr-2">{item.description}</span>
                                      <span className="text-slate-400 font-bold shrink-0">x{item.quantity}</span>
                                    </div>
                                  ))}
                                  {wo.items.length > 2 && (
                                    <p className="text-[9px] text-slate-400 italic">+{wo.items.length - 2} itens</p>
                                  )}
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">
                                  {format(new Date(wo.created_at), "dd/MM/yyyy")}
                                </span>
                                <span className="text-xs font-black text-emerald-600">
                                  R$ {wo.total_amount?.toLocaleString('pt-BR') || '0'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0">
                <button 
                  onClick={() => { setIsHistoryDrawerOpen(false); navigate(`/clients/${selectedClient.id}`); }}
                  className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Ver Perfil Completo
                </button>
                <button 
                  onClick={() => setIsHistoryDrawerOpen(false)} 
                  className="px-4 py-3 border-2 border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-white hover:text-slate-600 transition-all cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <ImportExportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        mode="import"
        title="Importar Clientes"
        templateData={templateData}
        onImport={handleImport}
        entityName="clientes"
      />

      {/* Export Modal */}
      <ImportExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        mode="export"
        title="Exportar Clientes"
        data={clients}
        columns={exportColumns}
        entityName="clientes"
      />
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
