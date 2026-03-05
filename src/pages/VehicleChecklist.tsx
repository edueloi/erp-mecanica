import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, CheckCircle, AlertTriangle, XCircle,
  Minus, ChevronDown, ChevronRight, FileDown, Trash2,
  Car, Clock, User2, Gauge, Save, ClipboardCheck, History,
  MessageSquare, ChevronUp, Loader, Shield, Wrench, AlertCircle, CheckCircle2
} from 'lucide-react';
import api from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// --------------- Types ---------------
type ItemStatus = 'OK' | 'ATTENTION' | 'CRITICAL' | 'NA';

interface ChecklistItem {
  id: string;
  checklist_id: string;
  category: string;
  item: string;
  status: ItemStatus;
  notes: string | null;
  sort_order: number;
}

interface Checklist {
  id: string;
  vehicle_id: string;
  km: number;
  inspector_name: string | null;
  status: 'DRAFT' | 'COMPLETED';
  general_notes: string | null;
  created_at: string;
  updated_at: string;
  items: ChecklistItem[];
}

// --------------- Status config ---------------
const STATUS_CONFIG: Record<ItemStatus, { label: string; color: string; bg: string; border: string; icon: any }> = {
  OK:        { label: 'OK',       color: 'text-emerald-700', bg: 'bg-emerald-100',  border: 'border-emerald-200', icon: CheckCircle },
  ATTENTION: { label: 'Atenção',  color: 'text-amber-700',   bg: 'bg-amber-100',    border: 'border-amber-200',   icon: AlertTriangle },
  CRITICAL:  { label: 'Crítico',  color: 'text-rose-700',    bg: 'bg-rose-100',     border: 'border-rose-200',    icon: XCircle },
  NA:        { label: 'N/A',      color: 'text-slate-400',   bg: 'bg-slate-100',    border: 'border-slate-200',   icon: Minus },
};

// --------------- Main Component ---------------
export default function VehicleChecklist() {
  const { vehicleId, checklistId } = useParams<{ vehicleId: string; checklistId?: string }>();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState<any>(null);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [activeChecklist, setActiveChecklist] = useState<Checklist | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState({ km: '', inspector_name: '', general_notes: '' });
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState('');
  const [notification, setNotification] = useState<{ show: boolean; msg: string; type: 'success' | 'error' }>({ show: false, msg: '', type: 'success' });

  // Auto-hide notification
  useEffect(() => {
    if (notification.show) {
      const t = setTimeout(() => setNotification(n => ({ ...n, show: false })), 4000);
      return () => clearTimeout(t);
    }
  }, [notification.show]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, msg, type });
  };

  const fetchData = useCallback(async () => {
    if (!vehicleId || vehicleId === 'undefined') {
      showToast('Veículo não identificado', 'error');
      setLoading(false);
      return;
    }
    try {
      const [vRes, clRes] = await Promise.all([
        api.get(`/vehicles/${vehicleId}`),
        api.get(`/checklists/vehicle/${vehicleId}`)
      ]);
      setVehicle(vRes.data);
      const cls = Array.isArray(clRes.data) ? clRes.data : [];
      setChecklists(cls);

      // If checklistId param -> load it
      if (checklistId) {
        const clDetail = await api.get(`/checklists/${checklistId}`);
        if (clDetail.data && Array.isArray(clDetail.data.items)) {
          setActiveChecklist(clDetail.data);
          const cats = new Set<string>(clDetail.data.items.map((i: ChecklistItem) => i.category));
          setExpandedCategories(cats);
        }
      } else if (cls.length > 0) {
        // If no checklistId in URL, but we have checklists, open the most recent one
        openChecklist(cls[0].id);
      }
    } catch (err) {
      console.error('Checklist fetch error:', err);
      setChecklists([]);
    } finally {
      setLoading(false);
    }
  }, [vehicleId, checklistId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --------------- Actions ---------------
  const handleCreateChecklist = async () => {
    if (!vehicleId || vehicleId === 'undefined') {
      showToast('Veículo não identificado', 'error');
      return;
    }
    try {
      const res = await api.post('/checklists', {
        vehicle_id: vehicleId,
        km: parseInt(newForm.km) || vehicle?.km || 0,
        inspector_name: newForm.inspector_name || null,
        general_notes: newForm.general_notes || null,
      });
      const newCl = res.data;
      setChecklists(prev => [newCl, ...prev]);
      await openChecklist(newCl.id);
      setShowNewForm(false);
      setNewForm({ km: '', inspector_name: '', general_notes: '' });
      showToast('Checklist criado com sucesso!');
    } catch (err) {
      showToast('Erro ao criar checklist', 'error');
    }
  };

  const openChecklist = async (id: string) => {
    try {
      const res = await api.get(`/checklists/${id}`);
      setActiveChecklist(res.data);
      const cats = new Set<string>(res.data.items.map((i: ChecklistItem) => i.category));
      setExpandedCategories(cats);
      navigate(`/vehicles/${vehicleId}/checklist/${id}`, { replace: true });
    } catch (err) {
      showToast('Erro ao abrir checklist', 'error');
    }
  };

  const handleUpdateItem = async (itemId: string, status: ItemStatus) => {
    if (!activeChecklist) return;
    setSaving(itemId);
    try {
      // Optimistic update
      setActiveChecklist(prev => prev ? {
        ...prev,
        items: prev.items.map(i => i.id === itemId ? { ...i, status } : i)
      } : null);

      await api.patch(`/checklists/${activeChecklist.id}/items/${itemId}`, { status });
    } catch (err) {
      showToast('Erro ao salvar item', 'error');
    } finally {
      setSaving(null);
    }
  };

  const handleSaveNote = async (itemId: string) => {
    if (!activeChecklist) return;
    try {
      setActiveChecklist(prev => prev ? {
        ...prev,
        items: prev.items.map(i => i.id === itemId ? { ...i, notes: noteValue } : i)
      } : null);
      await api.patch(`/checklists/${activeChecklist.id}/items/${itemId}`, { notes: noteValue });
      setEditingNote(null);
      setNoteValue('');
    } catch (err) {
      showToast('Erro ao salvar observação', 'error');
    }
  };

  const handleFinishChecklist = async () => {
    if (!activeChecklist) return;
    try {
      await api.patch(`/checklists/${activeChecklist.id}`, { status: 'COMPLETED' });
      setActiveChecklist(prev => prev ? { ...prev, status: 'COMPLETED' } : null);
      setChecklists(prev => prev.map(cl => cl.id === activeChecklist.id ? { ...cl, status: 'COMPLETED' } : cl));
      showToast('Checklist finalizado!');
    } catch (err) {
      showToast('Erro ao finalizar', 'error');
    }
  };

  const handleDeleteChecklist = async (id: string) => {
    if (!confirm('Excluir este checklist?')) return;
    try {
      await api.delete(`/checklists/${id}`);
      setChecklists(prev => prev.filter(cl => cl.id !== id));
      if (activeChecklist?.id === id) {
        setActiveChecklist(null);
        navigate(`/vehicles/${vehicleId}`, { replace: true });
      }
      showToast('Checklist excluído');
    } catch (err) {
      showToast('Erro ao excluir', 'error');
    }
  };

  const handleGeneratePDF = () => {
    if (!activeChecklist || !vehicle) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 38, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('CHECKLIST DE INSPEÇÃO VEICULAR', margin, 18);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`${vehicle.brand} ${vehicle.model} — Placa ${vehicle.plate?.toUpperCase() || '---'}`, margin, 28);
    doc.text(`Data: ${format(new Date(activeChecklist.created_at), 'dd/MM/yyyy HH:mm')} | KM: ${activeChecklist.km?.toLocaleString()}`, pageWidth - margin, 28, { align: 'right' });

    // Summary bar
    const items = activeChecklist.items;
    const ok = items.filter(i => i.status === 'OK').length;
    const attention = items.filter(i => i.status === 'ATTENTION').length;
    const critical = items.filter(i => i.status === 'CRITICAL').length;
    const na = items.filter(i => i.status === 'NA').length;

    doc.setFillColor(248, 250, 252);
    doc.rect(margin, 44, pageWidth - margin * 2, 14, 'F');
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(8);
    doc.text(`✅ OK: ${ok}   ⚠️ Atenção: ${attention}   🔴 Crítico: ${critical}   — N/A: ${na}   |   Inspetor: ${activeChecklist.inspector_name || '—'}`, margin + 3, 53);

    // Group by category
    const categories = [...new Set(items.map(i => i.category))];
    let startY = 64;

    for (const cat of categories) {
      const catItems = items.filter(i => i.category === cat);

      autoTable(doc, {
        startY,
        head: [[{ content: cat, colSpan: 3, styles: { fillColor: [30, 41, 59], fontStyle: 'bold', fontSize: 9 } }]],
        body: catItems.map(item => {
          const cfg = STATUS_CONFIG[item.status];
          return [
            item.item,
            cfg.label,
            item.notes || '—'
          ];
        }),
        columnStyles: {
          0: { cellWidth: 90, fontSize: 8 },
          1: { cellWidth: 25, fontSize: 8, halign: 'center', fontStyle: 'bold' },
          2: { cellWidth: 60, fontSize: 7, textColor: [100, 116, 139] },
        },
        bodyStyles: { fontSize: 8 },
        margin: { horizontal: margin },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 1) {
            const status = catItems[data.row.index]?.status;
            if (status === 'OK') data.cell.styles.textColor = [5, 122, 85];
            if (status === 'ATTENTION') data.cell.styles.textColor = [146, 64, 14];
            if (status === 'CRITICAL') data.cell.styles.textColor = [190, 18, 60];
            if (status === 'NA') data.cell.styles.textColor = [148, 163, 184];
          }
        },
      });

      startY = (doc as any).lastAutoTable.finalY + 4;
    }

    // Notes
    if (activeChecklist.general_notes) {
      if (startY > 240) { doc.addPage(); startY = 20; }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('OBSERVAÇÕES GERAIS:', margin, startY + 8);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(doc.splitTextToSize(activeChecklist.general_notes, pageWidth - margin * 2), margin, startY + 15);
    }

    // Signature area
    const sigY = Math.min(startY + 40, 265);
    if (sigY < 270) {
      doc.setDrawColor(200);
      doc.line(margin, sigY, margin + 70, sigY);
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('Assinatura do Inspetor', margin, sigY + 5);
      doc.line(pageWidth - margin - 70, sigY, pageWidth - margin, sigY);
      doc.text('Assinatura do Cliente', pageWidth - margin - 70, sigY + 5);
    }

    doc.save(`Checklist_${vehicle.plate}_${format(new Date(activeChecklist.created_at), 'ddMMyyyy')}.pdf`);
    showToast('PDF gerado com sucesso!');
  };

  // --------------- Helpers ---------------
  const getCategories = (items: ChecklistItem[]) => {
    return [...new Set(items.map(i => i.category))];
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const getSummary = (items: ChecklistItem[]) => ({
    ok: items.filter(i => i.status === 'OK').length,
    attention: items.filter(i => i.status === 'ATTENTION').length,
    critical: items.filter(i => i.status === 'CRITICAL').length,
    na: items.filter(i => i.status === 'NA').length,
    total: items.length,
  });

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
    </div>
  );

  if (!vehicleId || vehicleId === 'undefined') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
        <AlertCircle size={48} className="mb-4 text-rose-500" />
        <h3 className="text-xl font-bold text-slate-700 mb-2">Veículo não identificado</h3>
        <p className="text-sm text-center max-w-xs mb-6">Não foi possível carregar as informações do veículo. Por favor, volte à lista de veículos e tente novamente.</p>
        <button onClick={() => navigate('/vehicles')} className="h-10 px-6 bg-slate-900 text-white rounded-xl text-sm font-bold transition-all shadow-sm">
          Voltar para Veículos
        </button>
      </div>
    );
  }

  // =================== RENDER ===================
  return (
    <div className="flex flex-col h-full -m-6 bg-slate-50">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/vehicles/${vehicleId}`)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-mono font-black text-xs shadow-sm">
              {vehicle?.plate?.toUpperCase() || '---'}
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">Checklists de Inspeção</h1>
              <p className="text-xs text-slate-500">{vehicle?.brand} {vehicle?.model}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeChecklist && (
            <>
              {activeChecklist.status !== 'COMPLETED' && (
                <button onClick={handleFinishChecklist} className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm">
                  <ClipboardCheck size={15} /> Finalizar
                </button>
              )}
              <button onClick={handleGeneratePDF} className="h-9 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all">
                <FileDown size={15} /> PDF
              </button>
            </>
          )}
          <button
            disabled={!vehicleId || vehicleId === 'undefined'}
            onClick={() => setShowNewForm(true)}
            className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={15} /> Novo Checklist
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden" style={{ marginTop: '20px' }}>

        {/* Sidebar - Checklist List */}
        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{checklists.length} Checklist{checklists.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {checklists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 px-4 text-center">
                <ClipboardCheck size={36} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">Nenhum checklist</p>
                <p className="text-xs mt-1">Clique em "Novo Checklist" para criar o primeiro</p>
              </div>
            ) : (
              checklists.map(cl => {
                const isActive = activeChecklist?.id === cl.id;
                return (
                  <div
                    key={cl.id}
                    onClick={() => openChecklist(cl.id)}
                    className={`w-full text-left px-4 py-3.5 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-start justify-between gap-2 group cursor-pointer ${isActive ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''}`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${cl.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {cl.status === 'COMPLETED' ? 'CONCLUÍDO' : 'RASCUNHO'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {format(new Date(cl.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{cl.km?.toLocaleString()} KM</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {cl.critical_count > 0 && <span className="text-[9px] font-bold text-rose-600">🔴 {cl.critical_count} crítico{cl.critical_count !== 1 ? 's' : ''}</span>}
                        {cl.attention_count > 0 && <span className="text-[9px] font-bold text-amber-600">⚠️ {cl.attention_count}</span>}
                        {cl.ok_count > 0 && <span className="text-[9px] font-bold text-emerald-600">✅ {cl.ok_count}</span>}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteChecklist(cl.id); }}
                      className="p-1 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0 mt-0.5"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {!activeChecklist ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm border border-slate-100 mb-6">
                  <ClipboardCheck size={40} className="opacity-20" />
                </div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">Selecione ou crie um checklist</h3>
                <p className="text-sm text-center max-w-xs">Use a lista à esquerda para abrir um checklist existente, ou clique em "Novo Checklist" para criar um.</p>
                <button
                  disabled={!vehicleId || vehicleId === 'undefined'}
                  onClick={() => setShowNewForm(true)}
                  className="mt-6 h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={16} /> Novo Checklist
                </button>
              </motion.div>
            ) : (
              <motion.div key={activeChecklist.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>

                {/* Checklist Header */}
                <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Car size={14} className="text-slate-400" />
                        <span className="font-bold">{vehicle?.brand} {vehicle?.model}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Gauge size={14} className="text-slate-400" />
                        <span>{activeChecklist.km?.toLocaleString()} KM</span>
                      </div>
                      {activeChecklist.inspector_name && (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <User2 size={14} className="text-slate-400" />
                          <span>{activeChecklist.inspector_name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Clock size={14} className="text-slate-400" />
                        <span>{format(new Date(activeChecklist.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-black rounded-full ${activeChecklist.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {activeChecklist.status === 'COMPLETED' ? '✅ CONCLUÍDO' : '✏️ RASCUNHO'}
                    </span>
                  </div>

                  {/* Summary */}
                  {(() => {
                    const s = getSummary(activeChecklist.items);
                    const ratedTotal = s.total - s.na || 1;
                    const pct = Math.round((s.ok / ratedTotal) * 100);
                    const attentionPct = Math.round((s.attention / ratedTotal) * 100);
                    const criticalPct = Math.round((s.critical / ratedTotal) * 100);
                    
                    return (
                      <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center justify-between mb-2 px-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Progresso da Inspeção</span>
                          <span className="text-sm font-black text-slate-900">{pct}% <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">em perfeitas condições</span></span>
                        </div>
                        <div className="flex h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${pct}%` }} 
                            className="bg-emerald-500 h-full border-r border-white/20" 
                          />
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${attentionPct}%` }} 
                            className="bg-amber-500 h-full border-r border-white/20" 
                          />
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${criticalPct}%` }} 
                            className="bg-rose-500 h-full" 
                          />
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-emerald-600 uppercase">Aprovados</span>
                              <span className="text-sm font-black text-slate-800">{s.ok}</span>
                            </div>
                            <div className="flex flex-col border-l border-slate-200 pl-4">
                              <span className="text-[10px] font-bold text-amber-600 uppercase">Atenção</span>
                              <span className="text-sm font-black text-slate-800">{s.attention}</span>
                            </div>
                            <div className="flex flex-col border-l border-slate-200 pl-4">
                              <span className="text-[10px] font-bold text-rose-600 uppercase">Críticos</span>
                              <span className="text-sm font-black text-slate-800">{s.critical}</span>
                            </div>
                          </div>
                          <div className="text-right">
                             <span className="text-[10px] font-bold text-slate-400 uppercase block">Total de Itens</span>
                             <span className="text-sm font-black text-slate-400">{s.total}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Items by category */}
                <div className="p-6 space-y-4 max-w-4xl mx-auto">
                  {getCategories(activeChecklist.items).map(cat => {
                    const catItems = activeChecklist.items.filter(i => i.category === cat);
                    const isExpanded = expandedCategories.has(cat);
                    const critCount = catItems.filter(i => i.status === 'CRITICAL').length;
                    const attCount = catItems.filter(i => i.status === 'ATTENTION').length;
                    const okCount = catItems.filter(i => i.status === 'OK').length;
                    const catSummary = getSummary(catItems);
                    const catPct = Math.round((catSummary.ok / (catSummary.total - catSummary.na || 1)) * 100);
                    
                    const CATEGORY_ICONS: Record<string, any> = {
                      'Documentação': History,
                      'Equipamentos': Shield,
                      'Motor e Fluidos': Gauge,
                      'Transmissão': Wrench,
                      'Freios': AlertCircle,
                      'Suspensão e Direção': Car,
                      'Pneus e Rodas': CheckCircle2,
                      'Elétrico': Clock,
                      'Ar-condicionado': Gauge,
                      'Carroceria': Car,
                      'Interior': User2,
                      'Teste de Rodagem': ClipboardCheck,
                    };
                    const Icon = CATEGORY_ICONS[cat] || ClipboardCheck;

                    return (
                      <div key={cat} className={`bg-white rounded-2xl border transition-all shadow-sm overflow-hidden ${isExpanded ? 'border-indigo-200 ring-2 ring-indigo-50 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                        <button
                          onClick={() => toggleCategory(cat)}
                          className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                              <Icon size={20} />
                            </div>
                            <div className="text-left">
                              <span className="font-bold text-slate-900 text-sm block">{cat}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500 transition-all" style={{ width: `${catPct}%` }} />
                                </div>
                                <span className="text-[10px] text-slate-400 font-bold">{catPct}% concluído</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {critCount > 0 && <span className="text-[10px] font-black px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full">🔴 {critCount}</span>}
                            {attCount > 0 && <span className="text-[10px] font-black px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">⚠️ {attCount}</span>}
                            {okCount > 0 && <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">✅ {okCount}</span>}
                            {isExpanded ? <ChevronUp size={16} className="text-indigo-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                          </div>
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden border-t border-slate-100"
                            >
                              <div className="divide-y divide-slate-50">
                                {catItems.map(item => {
                                  const cfg = STATUS_CONFIG[item.status];
                                  const StatusIcon = cfg.icon;
                                  const isEditingThisNote = editingNote === item.id;

                                  return (
                                    <div key={item.id} className={`px-5 py-3.5 transition-colors ${item.status === 'CRITICAL' ? 'bg-rose-50/30' : item.status === 'ATTENTION' ? 'bg-amber-50/30' : ''}`}>
                                      <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                          <StatusIcon size={16} className={cfg.color} />
                                          <span className="text-sm text-slate-800 font-medium truncate">{item.item}</span>
                                        </div>

                                        {/* Status Buttons */}
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          {(['OK', 'ATTENTION', 'CRITICAL', 'NA'] as ItemStatus[]).map(s => {
                                            const c = STATUS_CONFIG[s];
                                            const isSelected = item.status === s;
                                            return (
                                              <button
                                                key={s}
                                                onClick={() => handleUpdateItem(item.id, s)}
                                                disabled={saving === item.id}
                                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                                  isSelected
                                                    ? `${c.bg} ${c.color} ${c.border} shadow-sm scale-110 ring-2 ring-white`
                                                    : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                                                }`}
                                              >
                                                {c.label}
                                              </button>
                                            );
                                          })}

                                          <button
                                            onClick={() => {
                                              if (isEditingThisNote) { setEditingNote(null); }
                                              else { setEditingNote(item.id); setNoteValue(item.notes || ''); }
                                            }}
                                            className={`p-1.5 rounded-lg transition-colors ${item.notes ? 'text-indigo-500 bg-indigo-50 shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                            title="Adicionar observação"
                                          >
                                            <MessageSquare size={14} />
                                          </button>
                                        </div>
                                      </div>

                                      {/* Note Input */}
                                      <AnimatePresence>
                                        {isEditingThisNote && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="mt-3 overflow-hidden"
                                          >
                                            <div className="flex gap-2">
                                              <textarea
                                                autoFocus
                                                value={noteValue}
                                                onChange={e => setNoteValue(e.target.value)}
                                                placeholder="Observação detalhada..."
                                                className="flex-1 text-sm border border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                                                rows={3}
                                              />
                                              <div className="flex flex-col gap-2">
                                                <button onClick={() => handleSaveNote(item.id)} className="h-full px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center justify-center">
                                                  <Save size={16} />
                                                </button>
                                                <button onClick={() => setEditingNote(null)} className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200">
                                                  ✕
                                                </button>
                                              </div>
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>

                                      {/* Existing Note */}
                                      {item.notes && !isEditingThisNote && (
                                        <div className="mt-2 ml-6 p-2 bg-indigo-50/50 rounded-lg border border-indigo-100/50 flex items-start gap-2">
                                          <MessageSquare size={12} className="text-indigo-400 mt-1 shrink-0" />
                                          <p className="text-xs text-slate-600 leading-relaxed">{item.notes}</p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>

                {/* General Notes */}
                <div className="px-6 pb-20 max-w-4xl mx-auto space-y-6">
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <MessageSquare className="text-slate-400" size={18} />
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Observações Gerais da Inspeção</h3>
                    </div>
                    <textarea
                      defaultValue={activeChecklist.general_notes || ''}
                      onBlur={async (e) => {
                        await api.patch(`/checklists/${activeChecklist.id}`, { general_notes: e.target.value });
                        setActiveChecklist(prev => prev ? { ...prev, general_notes: e.target.value } : null);
                      }}
                      placeholder="Relate aqui o estado geral de conservação, recomendações ao cliente e outras informações relevantes..."
                      className="w-full text-sm border border-slate-200 rounded-2xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50 text-slate-700"
                      rows={5}
                    />
                  </div>

                  {/* Finalization Button */}
                  {activeChecklist.status !== 'COMPLETED' ? (
                    <button
                      onClick={handleFinishChecklist}
                      className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-emerald-200 text-sm tracking-wide"
                    >
                      <ClipboardCheck size={22} /> FINALIZAR INSPEÇÃO E GERAR LAUDO TÉCNICO
                    </button>
                  ) : (
                    <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-sm">
                        <CheckCircle size={24} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-emerald-900">Inspeção Concluída</p>
                        <p className="text-xs text-emerald-600">Este checklist foi finalizado e está disponível para consulta e geração de PDF.</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* New Checklist Modal */}
      <AnimatePresence>
        {showNewForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
              onClick={() => setShowNewForm(false)}
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden"
              >
                <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-white">Novo Checklist</h2>
                    <p className="text-slate-400 text-xs">{vehicle?.brand} {vehicle?.model} — {vehicle?.plate?.toUpperCase()}</p>
                  </div>
                  <button onClick={() => setShowNewForm(false)} className="text-slate-400 hover:text-white transition-colors">✕</button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Quilometragem Atual</label>
                    <input
                      type="number"
                      value={newForm.km}
                      onChange={e => setNewForm(p => ({ ...p, km: e.target.value }))}
                      placeholder={String(vehicle?.km || 0)}
                      className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Nome do Inspetor (opcional)</label>
                    <input
                      type="text"
                      value={newForm.inspector_name}
                      onChange={e => setNewForm(p => ({ ...p, inspector_name: e.target.value }))}
                      placeholder="Ex: João da Silva"
                      className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Observações iniciais</label>
                    <textarea
                      value={newForm.general_notes}
                      onChange={e => setNewForm(p => ({ ...p, general_notes: e.target.value }))}
                      placeholder="Motivo da inspeção, condições do veículo..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                      rows={3}
                    />
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-xl">
                    <p className="text-xs text-indigo-700 font-medium">📋 O checklist será criado com <strong>80+ itens</strong> pré-configurados em 9 categorias: Motor, Freios, Suspensão, Pneus, Elétrico, Transmissão, A/C, Carroceria e Interior.</p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowNewForm(false)} className="flex-1 h-10 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
                      Cancelar
                    </button>
                    <button onClick={handleCreateChecklist} className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm shadow-indigo-200">
                      Criar Checklist
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border ${
              notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <span className="text-sm font-bold">{notification.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
