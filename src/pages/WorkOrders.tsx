import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, ClipboardList, Filter, ChevronRight, X, User, Car, 
  FileText, AlertTriangle, Clock, Download, Calendar, Eye, Edit, 
  CheckCircle, DollarSign, Truck, Ban, MoreVertical, Send, Check,
  Upload, Printer, ArrowUpDown, FilterX, Info, Bell, Play
} from 'lucide-react';
import api from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { twMerge } from 'tailwind-merge';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ImportExportModal from '../components/ImportExportModal';

function cn(...inputs: any[]) {
  return twMerge(inputs.filter(Boolean).map(i => typeof i === 'object' ? Object.keys(i).filter(k => i[k]).join(' ') : i).join(' '));
}

const statusConfig: any = {
  OPEN: { label: 'Aberta', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: ClipboardList },
  DIAGNOSIS: { label: 'Diagnóstico', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: Search },
  WAITING_APPROVAL: { label: 'Aguard. Aprovação', color: 'bg-orange-50 text-orange-600 border-orange-100', icon: Clock },
  EXECUTING: { label: 'Em Execução', color: 'bg-purple-50 text-purple-600 border-purple-100', icon: Play },
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
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [pendingAppointments, setPendingAppointments] = useState<any[]>([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [workshopSettings, setWorkshopSettings] = useState<any>(null);
  const [downloadingPDF, setDownloadingPDF] = useState<string | null>(null);
  
  // Notification modal state
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({ show: false, type: 'info', title: '', message: '' });

  const showNotification = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setNotification({ show: true, type, title, message });
  };

  // Export columns for Work Orders
  const exportColumns = [
    { header: 'Número', dataKey: 'number' },
    { header: 'Status', dataKey: 'status' },
    { header: 'Cliente', dataKey: 'client_name' },
    { header: 'Veículo', dataKey: 'brand' },
    { header: 'Modelo', dataKey: 'model' },
    { header: 'Placa', dataKey: 'plate' },
    { header: 'Queixa', dataKey: 'complaint' },
    { header: 'Valor Total', dataKey: 'total_amount' },
    { header: 'Criada em', dataKey: 'created_at' }
  ];
  
  const [newWO, setNewWO] = useState({
    client_id: '',
    vehicle_id: '',
    complaint: '',
    priority: 'MEDIUM',
    responsible_id: '',
    delivery_forecast: '',
    status: 'OPEN',
    start_date: new Date().toISOString().split('T')[0],
    defect: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [woRes, statsRes, cRes, vRes, uRes, appRes, settingsRes] = await Promise.all([
        api.get(`/work-orders?q=${search}&status=${statusFilter}`),
        api.get('/work-orders/stats'),
        api.get('/clients'),
        api.get('/vehicles'),
        api.get('/users'),
        api.get('/appointments?status=PENDING,CONFIRMED,ARRIVED'),
        api.get('/settings/tenant')
      ]);
      setWorkOrders(woRes.data);
      setStats(statsRes.data);
      setClients(cRes.data);
      setVehicles(vRes.data);
      setUsers(uRes.data);
      setPendingAppointments(appRes.data);
      setWorkshopSettings(settingsRes.data);
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
      showNotification('error', 'Erro', 'Não foi possível criar a OS. Tente novamente.');
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
      showNotification('error', 'Erro', 'Não foi possível criar OS a partir do agendamento.');
    }
  };

  const handleDownloadPDF = async (woId: string) => {
    try {
      setDownloadingPDF(woId);
      const res = await api.get(`/work-orders/${woId}`);
      const fullWo = res.data;
      
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
      if (workshopSettings?.logo_url) {
        try {
          const format = workshopSettings.logo_url.includes('png') ? 'PNG' : 
                        workshopSettings.logo_url.includes('jpg') || workshopSettings.logo_url.includes('jpeg') ? 'JPEG' : 'PNG';
          doc.addImage(workshopSettings.logo_url, format, margin, 8, 24, 24);
          logoLoaded = true;
        } catch (e) {
          console.error('Error adding logo to PDF:', e);
        }
      }

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(workshopSettings?.trade_name || workshopSettings?.company_name || 'Workshop Name', logoLoaded ? margin + 28 : margin, 18);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const companySubtext = [
        workshopSettings?.cnpj ? `CNPJ: ${workshopSettings.cnpj}` : '',
        workshopSettings?.address ? workshopSettings.address : '',
        workshopSettings?.phone ? `Fone: ${workshopSettings.phone}` : ''
      ].filter(Boolean).join('  |  ');
      doc.text(companySubtext, logoLoaded ? margin + 28 : margin, 24);

      doc.setFontSize(12);
      doc.text(`ORDEM DE SERVIÇO`, pageWidth - margin, 18, { align: 'right' });
      doc.setFontSize(22);
      doc.text(`#${fullWo.number}`, pageWidth - margin, 28, { align: 'right' });

      // Secondary Header
      doc.setTextColor(...primaryColor);
      doc.setFontSize(8);
      let currentY = 50;
      doc.text(`Emissão: ${format(parseISO(fullWo.created_at), 'dd/MM/yyyy HH:mm')}`, margin, currentY);
      const statusLabel = statusConfig[fullWo.status]?.label || fullWo.status;
      doc.text(`Status: ${statusLabel}`, pageWidth / 2, currentY, { align: 'center' });
      
      currentY += 8;
      doc.setDrawColor(...borderColor);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 10;

      // --- CLIENT & VEHICLE SECTIONS ---
      const boxWidth = (pageWidth - (margin * 2) - 10) / 2;
      const boxHeight = 35;

      doc.setFillColor(...lightGray);
      doc.rect(margin, currentY, boxWidth, boxHeight, 'F');
      doc.setDrawColor(...borderColor);
      doc.rect(margin, currentY, boxWidth, boxHeight, 'S');
      
      doc.setTextColor(...accentColor);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('DADOS DO CLIENTE', margin + 5, currentY + 7);
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nome: ${fullWo.client_name}`, margin + 5, currentY + 13);
      doc.text(`Telefone: ${fullWo.client_phone || 'N/A'}`, margin + 5, currentY + 18);
      doc.text(`Email: ${fullWo.client_email || 'N/A'}`, margin + 5, currentY + 23);

      doc.setFillColor(...lightGray);
      doc.rect(margin + boxWidth + 10, currentY, boxWidth, boxHeight, 'F');
      doc.setDrawColor(...borderColor);
      doc.rect(margin + boxWidth + 10, currentY, boxWidth, boxHeight, 'S');
      
      doc.setTextColor(...accentColor);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('DADOS DO VEÍCULO', margin + boxWidth + 15, currentY + 7);
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Veículo: ${fullWo.brand} ${fullWo.model}`, margin + boxWidth + 15, currentY + 13);
      doc.text(`Placa: ${fullWo.plate || 'N/A'}`, margin + boxWidth + 15, currentY + 18);
      doc.text(`KM: ${fullWo.km?.toLocaleString() || 0}`, margin + boxWidth + 15, currentY + 23);

      currentY += boxHeight + 10;

      // Items Table
      const items = fullWo.items || [];
      if (items.length > 0) {
        autoTable(doc, {
          startY: currentY,
          head: [[{ content: 'ITENS DA ORDEM DE SERVIÇO', colSpan: 4, styles: { halign: 'center', fillColor: primaryColor } }], ['Descrição', 'Qtd', 'Unitário', 'Subtotal']],
          body: items.map((i: any) => [
            i.description, 
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
        const subtotal = items.reduce((sum: number, i: any) => sum + (i.unit_price * i.quantity), 0);
        
        doc.setFillColor(...lightGray);
        doc.rect(totalsX, currentY, totalsWidth, 15, 'F');
        doc.setDrawColor(...borderColor);
        doc.rect(totalsX, currentY, totalsWidth, 15, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...accentColor);
        doc.text(`TOTAL GERAL:`, totalsX + 5, currentY + 9);
        doc.text(`R$ ${subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - margin - 5, currentY + 9, { align: 'right' });
      }

      doc.save(`OS_${fullWo.number}.pdf`);
    } catch (err) {
      console.error(err);
      showNotification('error', 'Erro', 'Falha ao gerar o PDF.');
    } finally {
      setDownloadingPDF(null);
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
            onClick={() => setIsModalOpen(true)}
            className="h-9 px-4 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm"
          >
            <Plus size={16} /> Nova OS
          </button>
          <button 
            onClick={() => setIsAppointmentModalOpen(true)}
            className="h-9 px-3 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
          >
            <Calendar size={14} /> Agendamentos
          </button>
          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="h-9 px-3 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
          >
            <Download size={14} /> Exportar
          </button>
          <button 
            onClick={() => setIsAlertsModalOpen(true)}
            className="relative h-9 px-4 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm"
          >
            <Bell size={16} /> 
            Alertas
            {(pendingAppointments.length + stats.waiting_approval) > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                {pendingAppointments.length + stats.waiting_approval}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Stats Bar - Compact */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 mt-[25px]">
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
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDownloadPDF(wo.id); }}
                      disabled={downloadingPDF === wo.id}
                      className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded transition-all disabled:opacity-50" 
                      title="Imprimir PDF"
                    >
                      {downloadingPDF === wo.id ? <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Printer size={14} />}
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-900"
                      value={newWO.status || 'OPEN'}
                      onChange={e => setNewWO({...newWO, status: e.target.value})}
                    >
                      <option value="BUDGET">Orçamento</option>
                      <option value="OPEN">Aberto</option>
                      <option value="IN_PROGRESS">Em Andamento</option>
                      <option value="SCHEDULED">Agendado</option>
                      <option value="FINISHED">Finalizado</option>
                      <option value="INVOICED">Faturado</option>
                      <option value="CANCELLED">Cancelado</option>
                    </select>
                  </div>
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
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Responsável</label>
                    <select 
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-900"
                      value={newWO.responsible_id}
                      onChange={e => setNewWO({...newWO, responsible_id: e.target.value})}
                    >
                      <option value="">Selecione...</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Data Inicial</label>
                    <input 
                      type="date" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-900"
                      value={newWO.start_date || new Date().toISOString().split('T')[0]}
                      onChange={e => setNewWO({...newWO, start_date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Defeito Identificado</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-900"
                      placeholder="Defeito técnico..."
                      value={newWO.defect || ''}
                      onChange={e => setNewWO({...newWO, defect: e.target.value})}
                    />
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

      {/* Alerts Modal */}
      <AnimatePresence>
        {isAlertsModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-700 shrink-0 rounded-t-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                    <Bell className="text-white" size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Central de Alertas</h2>
                    <p className="text-xs text-white/70">Notificações e pendências do sistema</p>
                  </div>
                </div>
                <button onClick={() => setIsAlertsModalOpen(false)} className="text-white/70 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-4">
                {/* Agendamentos Pendentes */}
                {pendingAppointments.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="text-blue-600" size={18} />
                      <h3 className="font-bold text-slate-900">Agendamentos Pendentes</h3>
                      <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">
                        {pendingAppointments.length}
                      </span>
                    </div>
                    {pendingAppointments.slice(0, 5).map((app) => (
                      <button
                        key={app.id}
                        onClick={() => {
                          setIsAlertsModalOpen(false);
                          handleCreateFromAppointment(app);
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left group"
                      >
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex flex-col items-center justify-center shrink-0">
                          <p className="text-[10px] font-black text-blue-600 uppercase leading-none">
                            {format(parseISO(app.date), 'dd/MM')}
                          </p>
                          <p className="text-xs font-bold text-blue-900 leading-none mt-0.5">{app.time}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{app.client_name}</p>
                          <p className="text-xs text-slate-500 truncate">{app.plate} • {app.service_description}</p>
                        </div>
                        <div className="text-blue-600 group-hover:translate-x-1 transition-transform">
                          <ChevronRight size={18} />
                        </div>
                      </button>
                    ))}
                    {pendingAppointments.length > 5 && (
                      <button 
                        onClick={() => {
                          setIsAlertsModalOpen(false);
                          setIsAppointmentModalOpen(true);
                        }}
                        className="w-full py-2 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Ver todos os {pendingAppointments.length} agendamentos →
                      </button>
                    )}
                  </div>
                )}

                {/* OSs Aguardando Aprovação */}
                {stats.waiting_approval > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="text-orange-600" size={18} />
                      <h3 className="font-bold text-slate-900">Orçamentos Aguardando Aprovação</h3>
                      <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">
                        {stats.waiting_approval}
                      </span>
                    </div>
                    {workOrders.filter(wo => wo.status === 'WAITING_APPROVAL').slice(0, 3).map((wo) => (
                      <Link
                        key={wo.id}
                        to={`/work-orders/${wo.id}`}
                        onClick={() => setIsAlertsModalOpen(false)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all text-left group"
                      >
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                          <FileText className="text-orange-600" size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900">OS #{wo.number}</p>
                          <p className="text-xs text-slate-500 truncate">{wo.client_name} • {wo.brand} {wo.model}</p>
                        </div>
                        <div className="text-orange-600 group-hover:translate-x-1 transition-transform">
                          <ChevronRight size={18} />
                        </div>
                      </Link>
                    ))}
                    {stats.waiting_approval > 3 && (
                      <button 
                        onClick={() => {
                          setIsAlertsModalOpen(false);
                          setStatusFilter('WAITING_APPROVAL');
                        }}
                        className="w-full py-2 text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors"
                      >
                        Ver todas as {stats.waiting_approval} OSs →
                      </button>
                    )}
                  </div>
                )}

                {/* Sem alertas */}
                {pendingAppointments.length === 0 && stats.waiting_approval === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="text-emerald-600" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Tudo em Dia!</h3>
                    <p className="text-sm text-slate-500">Não há alertas pendentes no momento.</p>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 shrink-0 rounded-b-xl">
                <button 
                  onClick={() => setIsAlertsModalOpen(false)}
                  className="px-5 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notification Modal */}
      <AnimatePresence>
        {notification.show && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setNotification({ ...notification, show: false })}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className={cn(
                "px-6 py-4 flex items-center gap-4",
                notification.type === 'success' && "bg-emerald-50",
                notification.type === 'error' && "bg-red-50",
                notification.type === 'info' && "bg-blue-50"
              )}>
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                  notification.type === 'success' && "bg-emerald-100",
                  notification.type === 'error' && "bg-red-100",
                  notification.type === 'info' && "bg-blue-100"
                )}>
                  {notification.type === 'success' && <CheckCircle className="text-emerald-600" size={24} />}
                  {notification.type === 'error' && <AlertTriangle className="text-red-600" size={24} />}
                  {notification.type === 'info' && <Info className="text-blue-600" size={24} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    "font-bold text-base",
                    notification.type === 'success' && "text-emerald-900",
                    notification.type === 'error' && "text-red-900",
                    notification.type === 'info' && "text-blue-900"
                  )}>{notification.title}</h3>
                  <p className="text-sm text-slate-600 mt-0.5">{notification.message}</p>
                </div>
                <button 
                  onClick={() => setNotification({ ...notification, show: false })}
                  className="text-slate-400 hover:text-slate-900 transition-colors shrink-0"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="px-6 py-4 bg-slate-50 flex justify-end">
                <button 
                  onClick={() => setNotification({ ...notification, show: false })}
                  className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Export Modal */}
      <ImportExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        mode="export"
        title="Exportar Ordens de Serviço"
        data={workOrders}
        columns={exportColumns}
        entityName="ordens_servico"
      />
    </div>
  );
}
