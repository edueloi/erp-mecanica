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

type TabType = 'INFORMATION' | 'DIAGNOSIS' | 'SERVICES' | 'PARTS' | 'PHOTOS' | 'HISTORY';

export default function WorkOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [wo, setWo] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('DIAGNOSIS');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [statusChangeModalOpen, setStatusChangeModalOpen] = useState(false);

  const fetchWO = async () => {
    try {
      const [woRes, usersRes] = await Promise.all([
        api.get(`/work-orders/${id}`),
        api.get('/users')
      ]);
      // Ensure items and history are always arrays
      const woData = woRes.data;
      if (!woData.items) woData.items = [];
      if (!woData.history) woData.history = [];
      setWo(woData);
      setUsers(usersRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert('Erro ao carregar OS. Redirecionando...');
      navigate('/work-orders');
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

  const handleStatusChange = async (newStatus: string) => {
    try {
      const updatedWo = { ...wo, status: newStatus };
      // Add to history
      const historyEntry = {
        timestamp: new Date().toISOString(),
        action: `Status alterado para ${statusMap[newStatus]?.label}`,
        user: 'Sistema'
      };
      updatedWo.history = [...(wo.history || []), historyEntry];
      setWo(updatedWo);
      await api.patch(`/work-orders/${id}`, updatedWo);
      alert(`Status alterado para ${statusMap[newStatus]?.label}`);
      fetchWO();
    } catch (err) {
      alert('Erro ao alterar status');
    }
  };

  const handlePayment = async (paymentData: any) => {
    try {
      const updatedWo = { 
        ...wo, 
        payment_data: paymentData,
        status: paymentData.status === 'PAID' ? 'FINISHED' : wo.status
      };
      // Add to history
      const historyEntry = {
        timestamp: new Date().toISOString(),
        action: `Pagamento registrado: ${paymentData.method} - R$ ${paymentData.amount}`,
        user: 'Sistema'
      };
      updatedWo.history = [...(wo.history || []), historyEntry];
      setWo(updatedWo);
      await api.patch(`/work-orders/${id}`, updatedWo);

      // Se não for pago à vista, criar contas a receber
      if (paymentData.status !== 'PAID') {
        const firstDueDate = new Date();
        firstDueDate.setDate(firstDueDate.getDate() + 30); // 30 dias para primeira parcela

        const methodMap: { [key: string]: string } = {
          CASH: 'DINHEIRO',
          DEBIT: 'CARTAO_DEBITO',
          CREDIT: 'CARTAO_CREDITO',
          PIX: 'PIX',
          TRANSFER: 'TRANSFERENCIA'
        };

        await api.post('/accounts-receivable/from-work-order', {
          work_order_id: wo.id,
          client_id: wo.client_id,
          total_amount: paymentData.amount,
          payment_method: methodMap[paymentData.method] || paymentData.method,
          installments: paymentData.installments || 1,
          first_due_date: firstDueDate.toISOString().split('T')[0],
          description: `OS ${wo.number} - ${wo.client_name}`
        });
      }

      setPaymentModalOpen(false);
      alert('Pagamento registrado com sucesso!');
      fetchWO();
    } catch (err) {
      console.error('Error registering payment:', err);
      alert('Erro ao registrar pagamento');
    }
  };

  const handleSendQuote = async (method: 'whatsapp' | 'email') => {
    try {
      const total = wo.items.reduce((sum: number, i: any) => sum + (i.quantity * i.unit_price), 0) + (wo.taxes || 0) - (wo.discount || 0);
      const message = `📋 *Orçamento ${wo.number}*\n\n` +
        `Cliente: ${wo.client_name}\n` +
        `Veículo: ${wo.brand} ${wo.model} - ${wo.plate}\n\n` +
        `*Total: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*`;
      
      if (method === 'whatsapp') {
        // Open WhatsApp with message
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
      } else {
        // Generate PDF and prepare email
        generatePDF();
        alert('PDF gerado! Configure seu cliente de email para enviar.');
      }
      
      // Add to history
      const historyEntry = {
        timestamp: new Date().toISOString(),
        action: `Orçamento enviado via ${method}`,
        user: 'Sistema'
      };
      const updatedWo = { ...wo, history: [...(wo.history || []), historyEntry] };
      await api.patch(`/work-orders/${id}`, updatedWo);
      setSendModalOpen(false);
      fetchWO();
    } catch (err) {
      alert('Erro ao enviar orçamento');
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
    setWo({ ...wo, items: [...(wo.items || []), newItem] });
  };

  const removeItem = (itemId: string) => {
    setWo({ ...wo, items: (wo.items || []).filter((i: any) => i.id !== itemId) });
  };

  const updateItem = (itemId: string, field: string, value: any) => {
    setWo({
      ...wo,
      items: (wo.items || []).map((i: any) => i.id === itemId ? { ...i, [field]: value } : i)
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
  if (!wo) return <div className="flex items-center justify-center h-full">Ordem de Serviço não encontrada.</div>;

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

      {/* Tab Navigation */}
      <div className="bg-white border-b border-slate-200 px-6 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0 mt-[25px]">
        {[
          { id: 'INFORMATION', label: 'Informações', icon: Info },
          { id: 'DIAGNOSIS', label: 'Diagnóstico', icon: Search },
          { id: 'SERVICES', label: 'Serviços', icon: Wrench },
          { id: 'PARTS', label: 'Peças', icon: Package },
          { id: 'PHOTOS', label: 'Fotos', icon: Camera },
          { id: 'HISTORY', label: 'Histórico', icon: History }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
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

      {/* Main Content - 2 Columns: Left (tabs) + Right (Financial Summary) */}
      <main className="flex-1 overflow-hidden flex">
        {/* Left Column - Tabs Content */}
        <div className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
            {/* Tab: INFORMATION */}
            {activeTab === 'INFORMATION' && (
              <div className="max-w-4xl space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Informações da OS</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Cliente</label>
                      <p className="text-sm font-semibold text-slate-900">{wo.client_name}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Veículo</label>
                      <p className="text-sm font-semibold text-slate-900">{wo.brand} {wo.model}</p>
                      <p className="text-xs text-slate-500">{wo.plate?.toUpperCase()} • {wo.km} KM</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Data de Abertura</label>
                      <p className="text-sm text-slate-900">{format(parseISO(wo.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Previsão</label>
                      <input 
                        type="datetime-local"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                        value={wo.estimated_delivery || ''}
                        onChange={e => setWo({...wo, estimated_delivery: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: DIAGNOSIS */}
            {activeTab === 'DIAGNOSIS' && (
              <div className="max-w-4xl space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <FileText size={16} /> Queixa & Observações
                    </h2>
                    <button 
                      onClick={() => { fetchVehicleHistory(); setIsCopyModalOpen(true); }}
                      className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <ClipboardList size={14} /> Copiar de OS Anterior
                    </button>
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Relato do Cliente</label>
                      <textarea 
                        rows={4}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                        placeholder="O que o cliente relatou..."
                        value={wo.complaint || ''}
                        onChange={e => setWo({...wo, complaint: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Notas Internas</label>
                      <textarea 
                        rows={4}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                        placeholder="Observações internas..."
                        value={wo.internal_notes || ''}
                        onChange={e => setWo({...wo, internal_notes: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <Search size={16} /> Diagnóstico Técnico
                    </h2>
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Sintomas Observados</label>
                      <textarea 
                        rows={4}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                        placeholder="Descreva os sintomas observados..."
                        value={wo.symptoms?.observed || ''}
                        onChange={e => setWo({...wo, symptoms: { ...wo.symptoms, observed: e.target.value }})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Causa Provável</label>
                      <textarea 
                        rows={4}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                        placeholder="Qual a provável causa do problema..."
                        value={wo.diagnosis || ''}
                        onChange={e => setWo({...wo, diagnosis: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: SERVICES */}
            {activeTab === 'SERVICES' && (
              <div className="max-w-6xl">
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <Wrench size={16} /> Serviços
                    </h2>
                    <button onClick={() => addItem('SERVICE')} className="h-9 px-4 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm">
                      <Plus size={16} /> Adicionar Serviço
                    </button>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase">Descrição</th>
                        <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase">Responsável</th>
                        <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase text-right">Valor</th>
                        <th className="px-6 py-3 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {wo.items.filter((i: any) => i.type === 'SERVICE').length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center">
                            <Wrench size={48} className="text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-medium">Nenhum serviço adicionado</p>
                            <p className="text-xs text-slate-400 mt-1">Clique em "Adicionar Serviço" para começar</p>
                          </td>
                        </tr>
                      ) : (
                        wo.items.filter((i: any) => i.type === 'SERVICE').map((item: any) => (
                          <tr key={item.id} className="group hover:bg-slate-50">
                            <td className="px-6 py-4">
                              <input 
                                type="text" 
                                className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium p-0"
                                value={item.description}
                                onChange={e => updateItem(item.id, 'description', e.target.value)}
                                placeholder="Nome do serviço..."
                              />
                            </td>
                            <td className="px-6 py-4">
                              <select 
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-slate-900"
                                value={item.mechanic_id || ''}
                                onChange={e => updateItem(item.id, 'mechanic_id', e.target.value)}
                              >
                                <option value="">Selecione...</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                              </select>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-xs text-slate-400">R$</span>
                                <input 
                                  type="number" 
                                  className="w-32 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-right focus:ring-2 focus:ring-slate-900"
                                  value={item.unit_price}
                                  onChange={e => updateItem(item.id, 'unit_price', parseFloat(e.target.value))}
                                />
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button onClick={() => removeItem(item.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab: PARTS */}
            {activeTab === 'PARTS' && (
              <div className="max-w-6xl">
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <Package size={16} /> Peças
                    </h2>
                    <button onClick={() => addItem('PART')} className="h-9 px-4 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm">
                      <Plus size={16} /> Adicionar Peça
                    </button>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase">Peça</th>
                        <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase text-center">Qtd</th>
                        <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase text-right">Preço Unit.</th>
                        <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase text-right">Total</th>
                        <th className="px-6 py-3 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {wo.items.filter((i: any) => i.type === 'PART').length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center">
                            <Package size={48} className="text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-medium">Nenhuma peça adicionada</p>
                            <p className="text-xs text-slate-400 mt-1">Clique em "Adicionar Peça" para começar</p>
                          </td>
                        </tr>
                      ) : (
                        wo.items.filter((i: any) => i.type === 'PART').map((item: any) => (
                          <tr key={item.id} className="group hover:bg-slate-50">
                            <td className="px-6 py-4">
                              <input 
                                type="text" 
                                className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium p-0"
                                value={item.description}
                                onChange={e => updateItem(item.id, 'description', e.target.value)}
                                placeholder="Nome da peça..."
                              />
                            </td>
                            <td className="px-6 py-4 text-center">
                              <input 
                                type="number" 
                                className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-center focus:ring-2 focus:ring-slate-900"
                                value={item.quantity}
                                onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value))}
                              />
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-xs text-slate-400">R$</span>
                                <input 
                                  type="number" 
                                  className="w-32 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-right focus:ring-2 focus:ring-slate-900"
                                  value={item.unit_price}
                                  onChange={e => updateItem(item.id, 'unit_price', parseFloat(e.target.value))}
                                />
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-base text-emerald-600">
                              R$ {(item.quantity * item.unit_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button onClick={() => removeItem(item.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab: PHOTOS */}
            {activeTab === 'PHOTOS' && (
              <div className="max-w-4xl">
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-900">Fotos</h3>
                    <label className="h-9 px-4 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm cursor-pointer">
                      <Camera size={16} /> Adicionar Foto
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {wo.photos && wo.photos.length > 0 ? (
                      wo.photos.map((photo: any, idx: number) => (
                        <div key={idx} className="relative group">
                          <img src={photo.url} alt={photo.legend} className="w-full h-48 object-cover rounded-lg" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <button className="p-2 bg-white rounded-full text-red-500 hover:bg-red-50">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 py-12 text-center">
                        <Camera size={48} className="text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-medium">Nenhuma foto adicionada</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: HISTORY */}
            {activeTab === 'HISTORY' && (
              <div className="max-w-4xl">
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <History size={20} />
                    Linha do Tempo
                  </h3>
                  <div className="space-y-4">
                    {/* OS Created */}
                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Plus size={20} className="text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">OS Criada</p>
                        <p className="text-xs text-slate-500">{format(parseISO(wo.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                      </div>
                    </div>
                    {/* History entries */}
                    {wo.history && wo.history.length > 0 && wo.history.map((entry: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle size={20} className="text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-900">{entry.action}</p>
                          <p className="text-xs text-slate-500">{format(parseISO(entry.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Right Column - Financial Summary (Fixed) */}
      <aside className="w-96 border-l border-slate-200 bg-white overflow-auto p-6 flex-shrink-0">
        <div className="sticky top-0 space-y-6">
          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-700 rounded-2xl p-6 text-white">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 opacity-80">Ações Rápidas</h3>
            <div className="space-y-2">
              {wo.status === 'OPEN' && (
                <button 
                  onClick={() => handleStatusChange('DIAGNOSIS')}
                  className="w-full h-10 bg-white/10 hover:bg-white/20 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Search size={16} /> Iniciar Diagnóstico
                </button>
              )}
              {wo.status === 'DIAGNOSIS' && (
                <button 
                  onClick={() => handleStatusChange('WAITING_APPROVAL')}
                  className="w-full h-10 bg-white/10 hover:bg-white/20 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <FileText size={16} /> Enviar Orçamento
                </button>
              )}
              {wo.status === 'WAITING_APPROVAL' && (
                <button 
                  onClick={() => handleStatusChange('APPROVED')}
                  className="w-full h-10 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} /> Aprovar Orçamento
                </button>
              )}
              {wo.status === 'APPROVED' && (
                <button 
                  onClick={() => handleStatusChange('EXECUTING')}
                  className="w-full h-10 bg-indigo-500 hover:bg-indigo-600 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Wrench size={16} /> Iniciar Execução
                </button>
              )}
              {wo.status === 'EXECUTING' && (
                <button 
                  onClick={() => handleStatusChange('FINISHED')}
                  className="w-full h-10 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} /> Finalizar Serviço
                </button>
              )}
              {(wo.status === 'FINISHED' || wo.status === 'APPROVED') && (
                <button 
                  onClick={() => setPaymentModalOpen(true)}
                  className="w-full h-10 bg-yellow-500 hover:bg-yellow-600 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard size={16} /> Registrar Pagamento
                </button>
              )}
              <button 
                onClick={() => setSendModalOpen(true)}
                className="w-full h-10 bg-white/10 hover:bg-white/20 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <Send size={16} /> Enviar Orçamento
              </button>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Resumo Financeiro</h3>
            </div>
            <div className="p-4 space-y-3">
              {/* Services */}
              <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-2">
                  <Wrench size={14} className="text-slate-400" />
                  <span className="text-sm text-slate-600">Serviços</span>
                  <span className="text-xs font-bold text-slate-400">
                    ({wo.items.filter((i: any) => i.type === 'SERVICE').length})
                  </span>
                </div>
                <span className="text-sm font-bold text-slate-900">
                  R$ {wo.items.filter((i: any) => i.type === 'SERVICE').reduce((sum: number, i: any) => sum + (i.quantity * i.unit_price), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Parts */}
              <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-slate-400" />
                  <span className="text-sm text-slate-600">Peças</span>
                  <span className="text-xs font-bold text-slate-400">
                    ({wo.items.filter((i: any) => i.type === 'PART').length})
                  </span>
                </div>
                <span className="text-sm font-bold text-slate-900">
                  R$ {wo.items.filter((i: any) => i.type === 'PART').reduce((sum: number, i: any) => sum + (i.quantity * i.unit_price), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="h-px bg-slate-200 my-2" />

              {/* Taxes */}
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-600">Impostos</span>
                <input 
                  type="number" 
                  className="w-28 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-right font-bold text-sm focus:ring-2 focus:ring-slate-900"
                  value={wo.taxes || 0}
                  onChange={e => setWo({...wo, taxes: parseFloat(e.target.value) || 0})}
                />
              </div>

              {/* Discount */}
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-600">Desconto</span>
                <input 
                  type="number" 
                  className="w-28 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-right font-bold text-sm focus:ring-2 focus:ring-slate-900"
                  value={wo.discount || 0}
                  onChange={e => setWo({...wo, discount: parseFloat(e.target.value) || 0})}
                />
              </div>

              <div className="h-px bg-slate-200 my-2" />

              {/* Total */}
              <div className="flex justify-between items-center py-4 bg-emerald-50 -mx-4 px-4 rounded-b-2xl">
                <span className="text-base font-bold text-slate-900">Total Geral</span>
                <span className="text-2xl font-black text-emerald-600">
                  R$ {(wo.items.reduce((sum: number, i: any) => sum + (i.quantity * i.unit_price), 0) + (wo.taxes || 0) - (wo.discount || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Payment Status */}
              <div className="pt-3 border-t border-slate-200 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase">Status Pagamento</span>
                  <span className={cn(
                    "px-2 py-1 rounded text-xs font-bold",
                    wo.payment_data?.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                    wo.payment_data?.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-slate-100 text-slate-700'
                  )}>
                    {wo.payment_data?.status === 'PAID' ? 'Pago' : 
                     wo.payment_data?.status === 'PARTIAL' ? 'Parcial' : 
                     'Pendente'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts & Warnings */}
          <div className="space-y-2">
            {wo.items.some((i: any) => i.type === 'PART' && i.stock < i.quantity) && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-900">Estoque Insuficiente</p>
                  <p className="text-xs text-amber-700">Algumas peças estão com estoque baixo</p>
                </div>
              </div>
            )}
            {wo.estimated_delivery && new Date(wo.estimated_delivery) < new Date() && wo.status !== 'DELIVERED' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <Clock size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-red-900">Prazo Vencido</p>
                  <p className="text-xs text-red-700">A previsão de entrega passou</p>
                </div>
              </div>
            )}
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
          <button onClick={() => navigate('/work-orders')} className="h-8 px-3 text-slate-600 font-bold text-xs hover:bg-slate-100 rounded transition-all">
            Voltar
          </button>
          <button onClick={handleSave} className="h-8 px-4 bg-slate-900 text-white rounded font-bold text-xs hover:bg-slate-800 transition-all">
            Salvar OS
          </button>
        </div>
      </footer>

      {/* Payment Modal */}
      <AnimatePresence>
        {paymentModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-500 to-emerald-600">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Registrar Pagamento</h2>
                    <p className="text-xs text-emerald-100">OS #{wo.number}</p>
                  </div>
                </div>
                <button onClick={() => setPaymentModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                handlePayment({
                  method: formData.get('method'),
                  amount: parseFloat(formData.get('amount') as string),
                  status: formData.get('status'),
                  installments: parseInt(formData.get('installments') as string) || 1,
                  notes: formData.get('notes')
                });
              }} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Valor Total</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                    <input 
                      type="number"
                      name="amount"
                      step="0.01"
                      required
                      defaultValue={(wo.items.reduce((sum: number, i: any) => sum + (i.quantity * i.unit_price), 0) + (wo.taxes || 0) - (wo.discount || 0)).toFixed(2)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-2xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Forma de Pagamento</label>
                    <select 
                      name="method"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Selecione...</option>
                      <option value="CASH">💵 Dinheiro</option>
                      <option value="DEBIT">💳 Débito</option>
                      <option value="CREDIT">💳 Crédito</option>
                      <option value="PIX">📱 PIX</option>
                      <option value="TRANSFER">🏦 Transferência</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Status</label>
                    <select 
                      name="status"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="PENDING">Pendente</option>
                      <option value="PARTIAL">Parcial</option>
                      <option value="PAID">Pago</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Parcelas</label>
                  <input 
                    type="number"
                    name="installments"
                    min="1"
                    max="12"
                    defaultValue="1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Observações</label>
                  <textarea 
                    name="notes"
                    rows={3}
                    placeholder="Notas adicionais sobre o pagamento..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setPaymentModalOpen(false)}
                    className="flex-1 h-11 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 h-11 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold text-sm hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/30"
                  >
                    Confirmar Pagamento
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Send Quote Modal */}
      <AnimatePresence>
        {sendModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-500 to-blue-600">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center">
                    <Send size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Enviar Orçamento</h2>
                    <p className="text-xs text-blue-100">Escolha como enviar</p>
                  </div>
                </div>
                <button onClick={() => setSendModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-3">
                <button 
                  onClick={() => handleSendQuote('whatsapp')}
                  className="w-full h-14 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold text-base hover:from-green-600 hover:to-green-700 transition-all shadow-lg shadow-green-500/30 flex items-center justify-center gap-3"
                >
                  <Send size={20} />
                  Enviar via WhatsApp
                </button>
                <button 
                  onClick={() => handleSendQuote('email')}
                  className="w-full h-14 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold text-base hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-3"
                >
                  <FileText size={20} />
                  Gerar PDF e Email
                </button>
                <button 
                  onClick={() => setSendModalOpen(false)}
                  className="w-full h-11 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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


