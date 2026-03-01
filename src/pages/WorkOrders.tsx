import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, ClipboardList, Filter, ChevronRight, X, User, Car, 
  FileText, AlertTriangle, Clock, Download, Calendar, Eye, Edit, 
  CheckCircle, DollarSign, Truck, Ban, MoreVertical, Send, Check,
  Upload, Printer, ArrowUpDown, FilterX
} from 'lucide-react';
import api from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const statusConfig: any = {
  OPEN: { label: 'Aberta', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: ClipboardList },
  DIAGNOSIS: { label: 'Diagnóstico', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: Search },
  WAITING_APPROVAL: { label: 'Aguard. Aprovação', color: 'bg-orange-50 text-orange-600 border-orange-100', icon: Clock },
  EXECUTING: { label: 'Em Execução', color: 'bg-purple-50 text-purple-600 border-purple-100', icon: PlayIcon },
  FINISHED: { label: 'Finalizada', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle },
  DELIVERED: { label: 'Entregue', color: 'bg-slate-900 text-white border-slate-900', icon: Truck },
  CANCELLED: { label: 'Cancelada', color: 'bg-red-50 text-red-600 border-red-100', icon: Ban },
};

function PlayIcon({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>;
}

export default function WorkOrders() {
  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ open: 0, diagnosis: 0, waiting_approval: 0, executing: 0, finished_today: 0, cancelled: 0 });
  const [clients, setClients] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [pendingAppointments, setPendingAppointments] = useState<any[]>([]);
  
  const [newWO, setNewWO] = useState({
    client_id: '',
    vehicle_id: '',
    complaint: '',
    priority: 'MEDIUM',
    responsible_id: '',
    delivery_forecast: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [woRes, statsRes, cRes, vRes, uRes, appRes] = await Promise.all([
        api.get(`/work-orders?q=${search}&status=${statusFilter}`),
        api.get('/work-orders/stats'),
        api.get('/clients'),
        api.get('/vehicles'),
        api.get('/users'),
        api.get('/appointments?status=PENDING,CONFIRMED,ARRIVED')
      ]);
      setWorkOrders(woRes.data);
      setStats(statsRes.data);
      setClients(cRes.data);
      setVehicles(vRes.data);
      setUsers(uRes.data);
      setPendingAppointments(appRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/work-orders', newWO);
      setIsModalOpen(false);
      navigate(`/work-orders/${res.data.id}`);
    } catch (err) {
      alert('Erro ao criar OS');
    }
  };

  const handleCreateFromAppointment = async (appointment: any) => {
    try {
      const res = await api.post('/work-orders', {
        client_id: appointment.client_id,
        vehicle_id: appointment.vehicle_id,
        complaint: appointment.service_description,
        status: 'OPEN',
        priority: 'MEDIUM'
      });
      
      await api.patch(`/appointments/${appointment.id}/status`, { status: 'IN_SERVICE' });
      
      setIsAppointmentModalOpen(false);
      navigate(`/work-orders/${res.data.id}`);
    } catch (err) {
      alert('Erro ao criar OS a partir do agendamento');
    }
  };

  return (
    <div className="flex flex-col h-full -m-6 bg-[#F6F8FB]">
      {/* Header - Compact */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-900 leading-tight">Ordens de Serviço</h1>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Gestão operacional da oficina</p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsAppointmentModalOpen(true)}
            className="h-9 px-3 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
          >
            <Calendar size={14} /> Agendamentos
          </button>
          <button className="h-9 px-3 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-2 transition-all">
            <Download size={14} /> Exportar
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="h-9 px-4 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm"
          >
            <Plus size={16} /> Nova OS
          </button>
        </div>
      </header>

      {/* Stats Bar - Compact */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
        {[
          { label: 'Abertas', value: stats.open || 0, status: 'OPEN', color: 'bg-amber-500' },
          { label: 'Diagnóstico', value: stats.diagnosis || 0, status: 'DIAGNOSIS', color: 'bg-blue-500' },
          { label: 'Aguard. Aprovação', value: stats.waiting_approval || 0, status: 'WAITING_APPROVAL', color: 'bg-orange-500' },
          { label: 'Em Execução', value: stats.executing || 0, status: 'EXECUTING', color: 'bg-purple-500' },
          { label: 'Finalizadas', value: stats.finished_today || 0, status: 'FINISHED', color: 'bg-emerald-500' },
        ].map((stat, i) => (
          <button 
            key={i} 
            onClick={() => setStatusFilter(statusFilter === stat.status ? '' : stat.status)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap",
              statusFilter === stat.status 
                ? "bg-slate-900 border-slate-900 text-white" 
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
            )}
          >
            <div className={cn("w-1.5 h-1.5 rounded-full", stat.color)} />
            <span className="text-[10px] font-bold uppercase tracking-tight">{stat.label}</span>
            <span className={cn(
              "text-xs font-black",
              statusFilter === stat.status ? "text-white/80" : "text-slate-400"
            )}>{stat.value}</span>
          </button>
        ))}
        {statusFilter && (
          <button 
            onClick={() => setStatusFilter('')}
            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
            title="Limpar Filtro"
          >
            <FilterX size={14} />
          </button>
        )}
      </div>

      {/* Search & Filters - Compact */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center gap-4 shrink-0">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Buscar por OS, cliente, placa, modelo..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-slate-900 outline-none transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <select 
            className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none focus:ring-1 focus:ring-slate-900"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">Todos Status</option>
            {Object.entries(statusConfig).map(([key, value]: any) => (
              <option key={key} value={key}>{value.label}</option>
            ))}
          </select>
          <button className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-100 transition-all">
            <Filter size={14} /> Mais Filtros
          </button>
        </div>
      </div>

      {/* Table - Data Heavy */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead className="sticky top-0 z-10">
            <tr className="bg-white">
              <th className="px-6 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">OS #</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">Cliente / Veículo</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">Status</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">Entrada</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">Responsável</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 text-right">Total</th>
              <th className="px-6 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm italic">Carregando ordens de serviço...</td></tr>
            ) : workOrders.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm italic">Nenhuma OS encontrada.</td></tr>
            ) : workOrders.map((wo) => (
              <tr 
                key={wo.id} 
                className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                onClick={() => navigate(`/work-orders/${wo.id}`)}
              >
                <td className="px-6 py-3">
                  <span className="text-sm font-bold text-slate-900">#{wo.number}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{wo.client_name}</span>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">
                      {wo.plate} • {wo.brand} {wo.model}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-tight",
                    statusConfig[wo.status]?.color
                  )}>
                    {statusConfig[wo.status]?.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-600">{format(parseISO(wo.created_at), 'dd/MM/yy')}</span>
                    <span className="text-[10px] text-slate-400">{format(parseISO(wo.created_at), 'HH:mm')}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-[8px] font-bold text-slate-500">
                      {wo.responsible_name?.charAt(0)}
                    </div>
                    <span className="text-xs text-slate-600">{wo.responsible_name || '---'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-black text-slate-900">
                    R$ {wo.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </td>
                <td className="px-6 py-3 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={() => navigate(`/work-orders/${wo.id}`)}
                      className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded transition-all"
                      title="Ver Detalhes"
                    >
                      <Eye size={14} />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded transition-all" title="Imprimir">
                      <Printer size={14} />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded transition-all" title="Enviar WhatsApp">
                      <Send size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New OS Modal - Compact */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                <h2 className="text-sm font-bold text-slate-900">Nova Ordem de Serviço</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="p-4 overflow-y-auto space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cliente</label>
                    <select 
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-900"
                      value={newWO.client_id}
                      onChange={e => setNewWO({...newWO, client_id: e.target.value, vehicle_id: ''})}
                    >
                      <option value="">Selecione...</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Veículo</label>
                    <select 
                      required
                      disabled={!newWO.client_id}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-50"
                      value={newWO.vehicle_id}
                      onChange={e => setNewWO({...newWO, vehicle_id: e.target.value})}
                    >
                      <option value="">Selecione...</option>
                      {vehicles.filter(v => v.client_id === newWO.client_id).map(v => (
                        <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Queixa do Cliente</label>
                  <textarea 
                    rows={3}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-900 resize-none"
                    placeholder="Relato detalhado..."
                    value={newWO.complaint}
                    onChange={e => setNewWO({...newWO, complaint: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Prioridade</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-900"
                      value={newWO.priority}
                      onChange={e => setNewWO({...newWO, priority: e.target.value})}
                    >
                      <option value="LOW">Baixa</option>
                      <option value="MEDIUM">Média</option>
                      <option value="HIGH">Alta</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Responsável</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-900"
                      value={newWO.responsible_id}
                      onChange={e => setNewWO({...newWO, responsible_id: e.target.value})}
                    >
                      <option value="">Selecione...</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Prev. Entrega</label>
                    <input 
                      type="date" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-900"
                      value={newWO.delivery_forecast}
                      onChange={e => setNewWO({...newWO, delivery_forecast: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-2 shrink-0">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
                  <button type="submit" className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800">Abrir OS</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Appointments Modal - Compact */}
      <AnimatePresence>
        {isAppointmentModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-xl shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                <h2 className="text-sm font-bold text-slate-900">Agendamentos Pendentes</h2>
                <button onClick={() => setIsAppointmentModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto space-y-2">
                {pendingAppointments.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm italic">Nenhum agendamento pendente.</div>
                ) : (
                  pendingAppointments.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => handleCreateFromAppointment(app)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all text-left group"
                    >
                      <div className="text-center min-w-[50px] border-r border-slate-100 pr-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase">{format(parseISO(app.date), 'dd/MM')}</p>
                        <p className="text-xs font-bold text-slate-900">{app.time}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{app.client_name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{app.plate} • {app.service_description}</p>
                      </div>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-900" />
                    </button>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50 text-center shrink-0">
                <button 
                  onClick={() => navigate('/appointments')}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-900 uppercase tracking-wider"
                >
                  Ver todos no calendário
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
