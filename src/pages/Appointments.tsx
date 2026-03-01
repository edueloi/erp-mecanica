import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, Clock, Search, ChevronLeft, ChevronRight, 
  MoreVertical, Phone, MessageSquare, CheckCircle, X, 
  Car, User, Info, AlertCircle, Trash2, Edit, Send, 
  Check, Play, Ban, RefreshCw, ClipboardList, Filter,
  LayoutGrid, List as ListIcon
} from 'lucide-react';
import api from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { 
  format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, 
  isSameDay, parseISO, addMinutes, isPast, isBefore, addHours
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNavigate } from 'react-router-dom';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'ARRIVED' | 'IN_SERVICE' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'DELAYED';
type ViewMode = 'DAY' | 'WEEK' | 'MONTH' | 'LIST';

const statusConfig: Record<AppointmentStatus, { label: string, color: string, icon: any }> = {
  PENDING: { label: 'Pendente', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: Clock },
  CONFIRMED: { label: 'Confirmado', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: CheckCircle },
  ARRIVED: { label: 'Chegou', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle },
  IN_SERVICE: { label: 'Em Atendimento', color: 'bg-purple-50 text-purple-600 border-purple-100', icon: Play },
  COMPLETED: { label: 'Concluído', color: 'bg-emerald-600 text-white border-emerald-700', icon: Check },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-50 text-red-600 border-red-100', icon: Ban },
  NO_SHOW: { label: 'Não Compareceu', color: 'bg-orange-50 text-orange-600 border-orange-100', icon: AlertCircle },
  DELAYED: { label: 'Atrasado', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: AlertCircle },
};

export default function Appointments() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('WEEK');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, confirmed: 0, pending: 0, arrived: 0, delayed: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  
  const [newAppointment, setNewAppointment] = useState<any>({
    client_id: '',
    vehicle_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '08:00',
    service_description: '',
    estimated_duration: 60,
    notes: '',
    internal_notes: '',
    origin: '',
    send_confirmation: true
  });

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/appointments?q=${search}`);
      const now = new Date();
      
      // Auto-calculate delayed status
      const updatedAppointments = res.data.map((app: any) => {
        const appDateTime = parseISO(`${app.date}T${app.time}`);
        const isDelayed = isBefore(addMinutes(appDateTime, 15), now) && 
                         ['PENDING', 'CONFIRMED'].includes(app.status);
        
        return {
          ...app,
          status: isDelayed ? 'DELAYED' : app.status
        };
      });

      setAppointments(updatedAppointments);
      
      const statsRes = await api.get(`/appointments/stats?date=${format(currentDate, 'yyyy-MM-dd')}`);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await api.get('/clients');
      setClients(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchClients();
  }, [search, currentDate]);

  useEffect(() => {
    if (newAppointment.client_id) {
      api.get(`/clients/${newAppointment.client_id}`).then(res => {
        setVehicles(res.data.vehicles || []);
      });
    }
  }, [newAppointment.client_id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/appointments', newAppointment);
      setIsModalOpen(false);
      setNewAppointment({
        client_id: '',
        vehicle_id: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '08:00',
        service_description: '',
        estimated_duration: 60,
        notes: '',
        internal_notes: '',
        origin: '',
        send_confirmation: true
      });
      fetchAppointments();
    } catch (err) {
      alert('Erro ao criar agendamento');
    }
  };

  const handleUpdateStatus = async (id: string, status: AppointmentStatus) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      fetchAppointments();
      if (selectedAppointment?.id === id) {
        setSelectedAppointment({ ...selectedAppointment, status });
      }
    } catch (err) {
      alert('Erro ao atualizar status');
    }
  };

  const openDetails = (appointment: any) => {
    setSelectedAppointment(appointment);
    setIsDrawerOpen(true);
  };

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
    end: endOfWeek(currentDate, { weekStartsOn: 1 })
  });

  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i + 8; // Start at 8 AM
    if (hour > 20) return null;
    return `${hour.toString().padStart(2, '0')}:00`;
  }).filter(Boolean) as string[];

  const getAppointmentsForDayAndTime = (day: Date, time: string) => {
    return appointments.filter(a => isSameDay(parseISO(a.date), day) && a.time.startsWith(time.split(':')[0]));
  };

  const sendWhatsApp = (appointment: any, type: 'CONFIRM' | 'REMIND' | 'DELAY') => {
    const name = appointment.client_name;
    const date = format(parseISO(appointment.date), 'dd/MM');
    const time = appointment.time;
    const shopName = "MecaERP Oficina";
    
    let message = '';
    if (type === 'CONFIRM') {
      message = `Olá, ${name}! Seu agendamento na ${shopName} está confirmado para ${date} às ${time}. Qualquer dúvida, me chama aqui.`;
    } else if (type === 'REMIND') {
      message = `Oi, ${name}! Só lembrando do seu agendamento hoje às ${time}. Te aguardamos 🙂`;
    } else if (type === 'DELAY') {
      message = `Oi, ${name}! Você ainda consegue vir hoje? Se preferir, posso reagendar pra você.`;
    }

    const phone = appointment.client_phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCreateOS = async (appointment: any) => {
    try {
      const res = await api.post('/work-orders', {
        client_id: appointment.client_id,
        vehicle_id: appointment.vehicle_id,
        complaint: appointment.service_description,
        status: 'OPEN',
        priority: 'MEDIUM'
      });
      
      // Update appointment status to IN_SERVICE
      await api.patch(`/appointments/${appointment.id}/status`, { status: 'IN_SERVICE' });
      
      navigate(`/work-orders/${res.data.id}`);
    } catch (err) {
      alert('Erro ao criar OS a partir do agendamento');
    }
  };

  return (
    <div className="space-y-6">
      {/* Topbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agendamentos</h1>
          <p className="text-slate-500">Gerencie a agenda da oficina e confirme chegadas rapidamente</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar placa, cliente..." 
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
          >
            Hoje
          </button>
          <div className="flex bg-white border border-slate-200 rounded-xl p-1">
            {(['WEEK', 'DAY', 'LIST'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  viewMode === mode ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {mode === 'WEEK' ? 'Semana' : mode === 'DAY' ? 'Dia' : 'Lista'}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
          >
            <Plus size={18} /> Novo Agendamento
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Hoje', value: stats.total || 0, icon: Calendar, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'Confirmados', value: stats.confirmed || 0, icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pendentes', value: stats.pending || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Chegaram', value: stats.arrived || 0, icon: User, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Atrasados', value: stats.delayed || 0, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.bg)}>
              <stat.icon size={20} className={stat.color} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Calendar/Agenda */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-slate-900">
                {format(currentDate, "MMMM yyyy", { locale: ptBR })}
              </h2>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setCurrentDate(addDays(currentDate, viewMode === 'WEEK' ? -7 : -1))}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={() => setCurrentDate(addDays(currentDate, viewMode === 'WEEK' ? 7 : 1))}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto no-scrollbar">
            {viewMode === 'WEEK' && (
              <div className="min-w-[800px]">
                <div className="grid grid-cols-8 border-b border-slate-100">
                  <div className="p-4 border-r border-slate-100"></div>
                  {weekDays.map((day, i) => (
                    <div key={i} className={cn(
                      "p-4 text-center border-r border-slate-100 last:border-r-0",
                      isSameDay(day, new Date()) && "bg-emerald-50/30"
                    )}>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        {format(day, 'EEE', { locale: ptBR })}
                      </p>
                      <p className={cn(
                        "text-sm font-bold w-8 h-8 flex items-center justify-center mx-auto rounded-full",
                        isSameDay(day, new Date()) ? "bg-emerald-500 text-white" : "text-slate-900"
                      )}>
                        {format(day, 'd')}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="relative">
                  {timeSlots.map((time, i) => (
                    <div key={i} className="grid grid-cols-8 border-b border-slate-50 group">
                      <div className="p-4 border-r border-slate-100 text-[10px] font-bold text-slate-400 text-right">
                        {time}
                      </div>
                      {weekDays.map((day, j) => {
                        const dayApps = getAppointmentsForDayAndTime(day, time);
                        return (
                          <div key={j} className="p-1 border-r border-slate-100 last:border-r-0 min-h-[80px] relative">
                            {dayApps.map((app, k) => (
                              <button
                                key={k}
                                onClick={() => openDetails(app)}
                                className={cn(
                                  "w-full p-2 rounded-xl border text-left mb-1 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm",
                                  statusConfig[app.status as AppointmentStatus]?.color
                                )}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px] font-bold">{app.time}</span>
                                  <span className="text-[10px] font-black uppercase tracking-tighter">{app.plate}</span>
                                </div>
                                <p className="text-xs font-bold truncate">{app.client_name}</p>
                                <p className="text-[9px] opacity-70 truncate">{app.service_description}</p>
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewMode === 'LIST' && (
              <div className="p-6">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-slate-100">
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data/Hora</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Veículo</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Serviço</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="pb-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {appointments.map((app) => (
                      <tr key={app.id} className="group hover:bg-slate-50 transition-colors">
                        <td className="py-4">
                          <p className="text-sm font-bold text-slate-900">{format(parseISO(app.date), 'dd/MM/yyyy')}</p>
                          <p className="text-xs text-slate-500">{app.time}</p>
                        </td>
                        <td className="py-4">
                          <p className="text-sm font-bold text-slate-900">{app.client_name}</p>
                          <p className="text-xs text-slate-500">{app.client_phone}</p>
                        </td>
                        <td className="py-4">
                          <p className="text-sm font-bold text-slate-900">{app.plate}</p>
                          <p className="text-xs text-slate-500">{app.model}</p>
                        </td>
                        <td className="py-4">
                          <p className="text-sm text-slate-600">{app.service_description}</p>
                        </td>
                        <td className="py-4">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-bold border",
                            statusConfig[app.status as AppointmentStatus]?.color
                          )}>
                            {statusConfig[app.status as AppointmentStatus]?.label}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button 
                            onClick={() => openDetails(app)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: Today's List */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Próximos Hoje</h2>
              <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase">
                {format(new Date(), 'dd/MM')}
              </span>
            </div>
            
            <div className="space-y-4">
              {appointments
                .filter(a => isSameDay(parseISO(a.date), new Date()))
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((app) => (
                  <button
                    key={app.id}
                    onClick={() => openDetails(app)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all text-left group"
                  >
                    <div className="text-center min-w-[50px]">
                      <p className="text-sm font-bold text-slate-900">{app.time}</p>
                      <div className={cn(
                        "w-2 h-2 rounded-full mx-auto mt-1",
                        app.status === 'ARRIVED' ? "bg-emerald-500" : "bg-slate-300"
                      )}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{app.client_name}</p>
                      <p className="text-xs text-slate-500 truncate">{app.plate} • {app.service_description}</p>
                    </div>
                    <div className={cn(
                      "px-2 py-1 rounded-lg text-[9px] font-bold uppercase border",
                      statusConfig[app.status as AppointmentStatus]?.color
                    )}>
                      {statusConfig[app.status as AppointmentStatus]?.label}
                    </div>
                  </button>
                ))}
              
              {appointments.filter(a => isSameDay(parseISO(a.date), new Date())).length === 0 && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Calendar size={24} className="text-slate-300" />
                  </div>
                  <p className="text-sm text-slate-500 font-medium">Nenhum agendamento para hoje.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-emerald-600 rounded-3xl p-6 text-white shadow-lg shadow-emerald-600/20">
            <h3 className="font-bold mb-2">Dica de Produtividade</h3>
            <p className="text-emerald-100 text-xs leading-relaxed">
              Marque o agendamento como "Chegou" assim que o cliente entrar na oficina para agilizar a abertura da OS.
            </p>
          </div>
        </div>
      </div>

      {/* Appointment Details Drawer */}
      <AnimatePresence>
        {isDrawerOpen && selectedAppointment && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[70] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Detalhes do Agendamento</h2>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                {/* Bloco 1: Dados */}
                <section className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <Calendar className="text-emerald-500" size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {format(parseISO(selectedAppointment.date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock size={12} /> {selectedAppointment.time} ({selectedAppointment.estimated_duration} min)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 border border-slate-100 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cliente</p>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-bold">
                          {selectedAppointment.client_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{selectedAppointment.client_name}</p>
                          <p className="text-xs text-slate-500">{selectedAppointment.client_phone}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border border-slate-100 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Veículo</p>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                          <Car size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{selectedAppointment.plate}</p>
                          <p className="text-xs text-slate-500">{selectedAppointment.model}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-slate-100 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Serviço Solicitado</p>
                    <p className="text-sm text-slate-700 font-medium">{selectedAppointment.service_description}</p>
                  </div>

                  {selectedAppointment.notes && (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Observações</p>
                      <p className="text-xs text-amber-800">{selectedAppointment.notes}</p>
                    </div>
                  )}
                </section>

                {/* Bloco 2: Status */}
                <section className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Atual</p>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-4 py-2 rounded-xl text-sm font-bold border flex items-center gap-2",
                      statusConfig[selectedAppointment.status as AppointmentStatus]?.color
                    )}>
                      {React.createElement(statusConfig[selectedAppointment.status as AppointmentStatus]?.icon, { size: 16 })}
                      {statusConfig[selectedAppointment.status as AppointmentStatus]?.label}
                    </span>
                  </div>
                </section>

                {/* Bloco 3: Ações */}
                <section className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações Rápidas</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'CONFIRMED')}
                      className="flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all"
                    >
                      <CheckCircle size={16} /> Confirmar
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'ARRIVED')}
                      className="flex items-center justify-center gap-2 p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all"
                    >
                      <User size={16} /> Chegou
                    </button>
                    <button 
                      onClick={() => handleCreateOS(selectedAppointment)}
                      className="flex items-center justify-center gap-2 p-3 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all col-span-2 shadow-lg shadow-emerald-600/20"
                    >
                      <ClipboardList size={16} /> Criar OS a partir deste Agendamento
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'CANCELLED')}
                      className="flex items-center justify-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-all"
                    >
                      <Ban size={16} /> Cancelar
                    </button>
                    <button 
                      className="flex items-center justify-center gap-2 p-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all"
                    >
                      <RefreshCw size={16} /> Reagendar
                    </button>
                  </div>

                  <div className="pt-4 space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comunicação WhatsApp</p>
                    <div className="grid grid-cols-1 gap-2">
                      <button 
                        onClick={() => sendWhatsApp(selectedAppointment, 'CONFIRM')}
                        className="flex items-center justify-between p-3 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          <MessageSquare size={16} className="text-emerald-500" />
                          Enviar Confirmação
                        </div>
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500" />
                      </button>
                      <button 
                        onClick={() => sendWhatsApp(selectedAppointment, 'REMIND')}
                        className="flex items-center justify-between p-3 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-emerald-500" />
                          Enviar Lembrete (1h antes)
                        </div>
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500" />
                      </button>
                      <button 
                        onClick={() => sendWhatsApp(selectedAppointment, 'DELAY')}
                        className="flex items-center justify-between p-3 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          <AlertCircle size={16} className="text-amber-500" />
                          Notificar Atraso
                        </div>
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500" />
                      </button>
                    </div>
                  </div>
                </section>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 p-3 border border-slate-200 bg-white text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all">
                  <Edit size={18} /> Editar
                </button>
                <button className="p-3 border border-red-100 bg-white text-red-600 rounded-xl hover:bg-red-50 transition-all">
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* New Appointment Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Novo Agendamento</h2>
                    <p className="text-xs text-slate-500">Preencha os dados para reservar o horário</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-8 space-y-8 overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cliente</label>
                    <select 
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none"
                      value={newAppointment.client_id}
                      onChange={(e) => setNewAppointment({...newAppointment, client_id: e.target.value})}
                    >
                      <option value="">Selecionar Cliente...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Veículo</label>
                    <select 
                      required
                      disabled={!newAppointment.client_id}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none disabled:opacity-50"
                      value={newAppointment.vehicle_id}
                      onChange={(e) => setNewAppointment({...newAppointment, vehicle_id: e.target.value})}
                    >
                      <option value="">Selecionar Veículo...</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
                    <input 
                      type="date"
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      value={newAppointment.date}
                      onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Horário</label>
                    <input 
                      type="time"
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      value={newAppointment.time}
                      onChange={(e) => setNewAppointment({...newAppointment, time: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Serviço / Queixa</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex: Troca de óleo, Revisão 30k, Ruído no freio..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      value={newAppointment.service_description}
                      onChange={(e) => setNewAppointment({...newAppointment, service_description: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Duração Estimada (min)</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none"
                      value={newAppointment.estimated_duration}
                      onChange={(e) => setNewAppointment({...newAppointment, estimated_duration: parseInt(e.target.value)})}
                    >
                      <option value={30}>30 minutos</option>
                      <option value={60}>1 hora</option>
                      <option value={120}>2 horas</option>
                      <option value={180}>3 horas</option>
                      <option value={240}>4 horas</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Origem</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none"
                      value={newAppointment.origin}
                      onChange={(e) => setNewAppointment({...newAppointment, origin: e.target.value})}
                    >
                      <option value="">Selecione...</option>
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="PHONE">Telefone</option>
                      <option value="INSTAGRAM">Instagram</option>
                      <option value="GOOGLE">Google</option>
                      <option value="INDICATION">Indicação</option>
                      <option value="RETURN">Retorno</option>
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações do Cliente</label>
                    <textarea 
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                      placeholder="Algum detalhe importante?"
                      value={newAppointment.notes}
                      onChange={(e) => setNewAppointment({...newAppointment, notes: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <input 
                    type="checkbox" 
                    id="confirm"
                    className="w-5 h-5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                    checked={newAppointment.send_confirmation}
                    onChange={(e) => setNewAppointment({...newAppointment, send_confirmation: e.target.checked})}
                  />
                  <label htmlFor="confirm" className="text-sm font-bold text-emerald-800 cursor-pointer">
                    Enviar confirmação automática via WhatsApp após salvar
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-4 border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-2 px-6 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                  >
                    Salvar Agendamento
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
