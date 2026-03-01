import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Printer, Save, Plus, Trash2, CheckCircle2, AlertCircle,
  FileText, Wrench, Package, User, Car, ChevronRight, Clock,
  ShieldCheck, Camera, CreditCard, History, Info, CheckCircle,
  AlertTriangle, XCircle, HelpCircle, MoreVertical, Send, Check,
  Search, ClipboardCheck, ClipboardList, X
} from 'lucide-react';
import api from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type TabType = 'INFORMATION' | 'DIAGNOSIS' | 'SERVICES' | 'PARTS' | 'PHOTOS' | 'QUOTE' | 'PAYMENT' | 'HISTORY';

export default function WorkOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [wo, setWo] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('INFORMATION');

  const fetchWO = async () => {
    try {
      const [woRes, usersRes] = await Promise.all([
        api.get(`/work-orders/${id}`),
        api.get('/users')
      ]);
      setWo(woRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error(err);
      navigate('/work-orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWO();
  }, [id]);

  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [vehicleHistory, setVehicleHistory] = useState<any[]>([]);

  const fetchVehicleHistory = async () => {
    if (!wo?.vehicle_id) return;
    try {
      const res = await api.get(`/work-orders?vehicle_id=${wo.vehicle_id}`);
      // Filter out current OS
      setVehicleHistory(res.data.filter((item: any) => item.id !== wo.id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyFrom = (oldWo: any) => {
    setWo({
      ...wo,
      items: oldWo.items.map((i: any) => ({ ...i, id: undefined })), // Copy items without IDs
      diagnosis: oldWo.diagnosis,
      checklist: oldWo.checklist
    });
    setIsCopyModalOpen(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const newPhoto = {
        url: base64String,
        type: 'ENTRY',
        legend: 'Nova foto'
      };
      setWo({
        ...wo,
        photos: [...(wo.photos || []), newPhoto]
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/work-orders/${id}`, wo);
      alert('OS salva com sucesso!');
      fetchWO();
    } catch (err) {
      alert('Erro ao salvar OS');
    } finally {
      setSaving(false);
    }
  };

  const addItem = (type: 'SERVICE' | 'PART') => {
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      description: '',
      quantity: 1,
      unit_price: 0,
      cost_price: 0,
      mechanic_id: '',
      warranty_days: type === 'SERVICE' ? 90 : 0,
      sku: '',
      status: 'PENDING'
    };
    setWo({ ...wo, items: [...wo.items, newItem] });
  };

  const removeItem = (itemId: string) => {
    setWo({ ...wo, items: wo.items.filter((i: any) => i.id !== itemId) });
  };

  const updateItem = (itemId: string, field: string, value: any) => {
    setWo({
      ...wo,
      items: wo.items.map((i: any) => i.id === itemId ? { ...i, [field]: value } : i)
    });
  };

  const statusMap: any = {
    OPEN: { label: 'Aberta', color: 'bg-blue-50 text-blue-600', icon: Info },
    DIAGNOSIS: { label: 'Diagnóstico', color: 'bg-purple-50 text-purple-600', icon: Search },
    WAITING_APPROVAL: { label: 'Aguard. Aprovação', color: 'bg-orange-50 text-orange-600', icon: Clock },
    APPROVED: { label: 'Aprovada', color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle },
    EXECUTING: { label: 'Em Execução', color: 'bg-indigo-50 text-indigo-600', icon: Wrench },
    WAITING_PARTS: { label: 'Aguard. Peça', color: 'bg-yellow-50 text-yellow-600', icon: Package },
    FINISHED: { label: 'Finalizada', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    DELIVERED: { label: 'Entregue', color: 'bg-slate-100 text-slate-700', icon: ShieldCheck },
    CANCELLED: { label: 'Cancelada', color: 'bg-red-50 text-red-600', icon: XCircle },
  };

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'INFORMATION', label: 'Informações', icon: Info },
    { id: 'DIAGNOSIS', label: 'Diagnóstico', icon: Search },
    { id: 'SERVICES', label: 'Serviços', icon: Wrench },
    { id: 'PARTS', label: 'Peças', icon: Package },
    { id: 'PHOTOS', label: 'Fotos', icon: Camera },
    { id: 'QUOTE', label: 'Orçamento', icon: FileText },
    { id: 'PAYMENT', label: 'Pagamento', icon: CreditCard },
    { id: 'HISTORY', label: 'Histórico', icon: History },
  ];

  const generatePDF = () => {
    const doc = new jsPDF() as any;
    doc.setFontSize(20);
    doc.text('MecaERP - Ordem de Serviço', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Número: ${wo.number}`, 20, 35);
    doc.text(`Status: ${statusMap[wo.status].label}`, 20, 40);
    doc.text(`Data: ${format(new Date(wo.created_at), 'dd/MM/yyyy HH:mm')}`, 120, 35);
    
    doc.autoTable({
      startY: 50,
      head: [['Cliente', 'Veículo', 'Placa', 'KM']],
      body: [[wo.client_name, `${wo.brand} ${wo.model}`, wo.plate, wo.km]],
    });

    doc.text('Diagnóstico:', 20, doc.lastAutoTable.finalY + 10);
    doc.text(wo.diagnosis || 'N/A', 20, doc.lastAutoTable.finalY + 15);

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 25,
      head: [['Item', 'Qtd', 'Unitário', 'Total']],
      body: wo.items.map((i: any) => [i.description, i.quantity, i.unit_price, i.total_price]),
    });

    doc.save(`${wo.number}.pdf`);
  };

  if (loading) return <div className="flex items-center justify-center h-full">Carregando...</div>;

  const CurrentStatus = statusMap[wo.status];

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex flex-col">
      {/* Fixed Header - Compact */}
      <header className="h-12 bg-white border-b border-slate-200 sticky top-0 z-40 flex items-center px-4 justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/work-orders')} className="p-1.5 hover:bg-slate-100 rounded transition-colors">
            <ArrowLeft size={16} className="text-slate-500" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-slate-900">OS #{wo.number}</h1>
            <span className={cn(
              "px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-tight",
              statusMap[wo.status]?.color
            )}>
              {statusMap[wo.status]?.label}
            </span>
            <div className="h-4 w-px bg-slate-200 mx-1" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">{wo.client_name}</span>
              <span className="text-xs font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded font-mono tracking-wider">
                {wo.plate?.toUpperCase() || '---'}
              </span>
              <span className="text-xs text-slate-500">{wo.brand} {wo.model} • {wo.km} KM</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={generatePDF} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-all" title="PDF">
            <Printer size={16} />
          </button>
          <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-all" title="Enviar">
            <Send size={16} />
          </button>
          <div className="h-4 w-px bg-slate-200 mx-1" />
          <button onClick={handleSave} disabled={saving} className="h-8 px-3 bg-slate-900 text-white rounded font-bold text-xs hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-2">
            <Save size={14} /> {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </header>

      {/* Main Content - 2 Columns */}
      <main className="flex-1 flex overflow-hidden pb-14">
        {/* Left Column - Operational (70%) */}
        <div className="w-[70%] overflow-y-auto p-3 space-y-3 no-scrollbar">
          {/* Section 1: Queixa & Notas */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <FileText size={14} /> Queixa & Observações
              </h2>
              <button 
                onClick={() => { fetchVehicleHistory(); setIsCopyModalOpen(true); }}
                className="text-[10px] font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1"
              >
                <ClipboardList size={12} /> Copiar Anterior
              </button>
            </div>
            <div className="p-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Relato do Cliente</label>
                <textarea 
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all"
                  placeholder="O que o cliente relatou..."
                  value={wo.complaint || ''}
                  onChange={e => setWo({...wo, complaint: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Notas Internas</label>
                <textarea 
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all"
                  placeholder="Observações internas..."
                  value={wo.internal_notes || ''}
                  onChange={e => setWo({...wo, internal_notes: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Diagnóstico */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Search size={14} /> Diagnóstico Técnico
              </h2>
            </div>
            <div className="p-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sintomas Observados</label>
                <textarea 
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all"
                  value={wo.symptoms?.observed || ''}
                  onChange={e => setWo({...wo, symptoms: { ...wo.symptoms, observed: e.target.value }})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Causa Provável</label>
                <textarea 
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all"
                  value={wo.diagnosis || ''}
                  onChange={e => setWo({...wo, diagnosis: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Serviços */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Wrench size={14} /> Serviços
              </h2>
              <button onClick={() => addItem('SERVICE')} className="h-6 px-2 bg-slate-900 text-white rounded text-[10px] font-bold hover:bg-slate-800 transition-all flex items-center gap-1">
                <Plus size={10} /> Add Serviço
              </button>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase">Descrição</th>
                  <th className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase">Responsável</th>
                  <th className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase text-right">Valor</th>
                  <th className="px-3 py-1.5 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {wo.items.filter((i: any) => i.type === 'SERVICE').map((item: any) => (
                  <tr key={item.id} className="group">
                    <td className="px-3 py-1.5">
                      <input 
                        type="text" 
                        className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium p-0"
                        value={item.description}
                        onChange={e => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Nome do serviço..."
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <select 
                        className="bg-transparent border-none focus:ring-0 text-xs p-0"
                        value={item.mechanic_id || ''}
                        onChange={e => updateItem(item.id, 'mechanic_id', e.target.value)}
                      >
                        <option value="">Selecione...</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-[10px] text-slate-400">R$</span>
                        <input 
                          type="number" 
                          className="w-20 bg-transparent border-none focus:ring-0 text-sm font-bold text-right p-0"
                          value={item.unit_price}
                          onChange={e => updateItem(item.id, 'unit_price', parseFloat(e.target.value))}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <button onClick={() => removeItem(item.id)} className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 4: Peças */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Package size={14} /> Peças
              </h2>
              <button onClick={() => addItem('PART')} className="h-6 px-2 bg-slate-900 text-white rounded text-[10px] font-bold hover:bg-slate-800 transition-all flex items-center gap-1">
                <Plus size={10} /> Add Peça
              </button>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase">Peça</th>
                  <th className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase text-center">Qtd</th>
                  <th className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase text-right">Preço</th>
                  <th className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase text-right">Total</th>
                  <th className="px-3 py-1.5 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {wo.items.filter((i: any) => i.type === 'PART').map((item: any) => (
                  <tr key={item.id} className="group">
                    <td className="px-3 py-1.5">
                      <input 
                        type="text" 
                        className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium p-0"
                        value={item.description}
                        onChange={e => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Nome da peça..."
                      />
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <input 
                        type="number" 
                        className="w-12 bg-transparent border-none focus:ring-0 text-sm font-bold text-center p-0"
                        value={item.quantity}
                        onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value))}
                      />
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-[10px] text-slate-400">R$</span>
                        <input 
                          type="number" 
                          className="w-20 bg-transparent border-none focus:ring-0 text-sm font-bold text-right p-0"
                          value={item.unit_price}
                          onChange={e => updateItem(item.id, 'unit_price', parseFloat(e.target.value))}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-right font-bold text-sm text-slate-900">
                      R$ {(item.quantity * item.unit_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <button onClick={() => removeItem(item.id)} className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column - Finance & Status (30%) */}
        <aside className="w-[30%] border-l border-slate-200 bg-white p-4 space-y-4 overflow-y-auto no-scrollbar">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resumo Financeiro</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Serviços</span>
                <span className="font-bold text-slate-900">R$ {wo.items.filter((i: any) => i.type === 'SERVICE').reduce((sum: number, i: any) => sum + (i.quantity * i.unit_price), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>Peças</span>
                <span className="font-bold text-slate-900">R$ {wo.items.filter((i: any) => i.type === 'PART').reduce((sum: number, i: any) => sum + (i.quantity * i.unit_price), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-slate-500">
                <span>Impostos</span>
                <input 
                  type="number" 
                  className="w-20 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-right font-bold text-xs"
                  value={wo.taxes || 0}
                  onChange={e => setWo({...wo, taxes: parseFloat(e.target.value)})}
                />
              </div>
              <div className="flex justify-between items-center text-sm text-slate-500">
                <span>Desconto</span>
                <input 
                  type="number" 
                  className="w-20 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-right font-bold text-xs"
                  value={wo.discount || 0}
                  onChange={e => setWo({...wo, discount: parseFloat(e.target.value)})}
                />
              </div>
              <div className="pt-3 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-900">Total Geral</span>
                  <span className="text-xl font-black text-emerald-600">
                    R$ {(wo.items.reduce((sum: number, i: any) => sum + (i.quantity * i.unit_price), 0) + (wo.taxes || 0) - (wo.discount || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status & Aprovação</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100">
                <span className="text-xs font-bold text-slate-600">Aprovado?</span>
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  checked={['APPROVED', 'EXECUTING', 'FINISHED', 'DELIVERED'].includes(wo.status)}
                  onChange={e => setWo({...wo, status: e.target.checked ? 'APPROVED' : 'WAITING_APPROVAL'})}
                />
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100">
                <span className="text-xs font-bold text-slate-600">Pago?</span>
                <select 
                  className="bg-transparent border-none focus:ring-0 text-[10px] font-bold text-slate-900 p-0"
                  value={wo.payment_data?.status || 'PENDING'}
                  onChange={e => setWo({...wo, payment_data: { ...wo.payment_data, status: e.target.value }})}
                >
                  <option value="PENDING">Pendente</option>
                  <option value="PAID">Pago</option>
                  <option value="PARTIAL">Parcial</option>
                </select>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Fixed Footer - Compact */}
      <footer className="h-12 bg-white border-t border-slate-200 fixed bottom-0 left-0 right-0 z-40 flex items-center px-4 justify-between shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { setWo({...wo, status: 'CANCELLED'}); handleSave(); }}
            className="h-8 px-3 text-red-600 font-bold text-xs hover:bg-red-50 rounded transition-all"
          >
            Cancelar OS
          </button>
        </div>
        <div className="flex items-center gap-2">
          {wo.status === 'WAITING_APPROVAL' && (
            <button 
              onClick={() => { setWo({...wo, status: 'APPROVED'}); handleSave(); }}
              className="h-8 px-3 bg-emerald-50 text-emerald-600 rounded font-bold text-xs hover:bg-emerald-100 transition-all"
            >
              Aprovar
            </button>
          )}
          {wo.status === 'APPROVED' && (
            <button 
              onClick={() => { setWo({...wo, status: 'EXECUTING'}); handleSave(); }}
              className="h-8 px-3 bg-indigo-50 text-indigo-600 rounded font-bold text-xs hover:bg-indigo-100 transition-all"
            >
              Iniciar
            </button>
          )}
          {wo.status === 'EXECUTING' && (
            <button 
              onClick={() => { setWo({...wo, status: 'FINISHED'}); handleSave(); }}
              className="h-8 px-3 bg-emerald-600 text-white rounded font-bold text-xs hover:bg-emerald-700 transition-all"
            >
              Finalizar
            </button>
          )}
          <button onClick={handleSave} className="h-8 px-4 bg-slate-900 text-white rounded font-bold text-xs hover:bg-slate-800 transition-all">
            Salvar OS
          </button>
        </div>
      </footer>
      {/* Copy OS Modal */}
      <AnimatePresence>
        {isCopyModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
                    <ClipboardList size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Copiar de OS Anterior</h2>
                    <p className="text-xs text-slate-500">Selecione uma OS para copiar itens e diagnóstico</p>
                  </div>
                </div>
                <button onClick={() => setIsCopyModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto no-scrollbar space-y-4">
                {vehicleHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <History size={48} className="text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Nenhuma OS anterior encontrada para este veículo.</p>
                  </div>
                ) : (
                  vehicleHistory.map((oldWo) => (
                    <button
                      key={oldWo.id}
                      onClick={() => handleCopyFrom(oldWo)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all text-left group"
                    >
                      <div className="text-center min-w-[80px]">
                        <p className="text-xs font-black text-slate-400 uppercase">{format(parseISO(oldWo.created_at), 'dd/MM/yy')}</p>
                        <p className="text-sm font-bold text-slate-900">#{oldWo.number}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{oldWo.complaint}</p>
                        <p className="text-xs text-slate-500 truncate">{oldWo.items?.length || 0} itens • R$ {oldWo.total_amount?.toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 group-hover:border-emerald-200 group-hover:text-emerald-600 transition-colors">
                        Copiar
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


