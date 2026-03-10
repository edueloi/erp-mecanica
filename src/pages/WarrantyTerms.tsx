import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import api from '../services/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  Shield, Plus, FileText, Search, Filter, 
  Download, Send, Trash2, Edit, ChevronRight,
  Printer, CheckCircle2, AlertCircle, Clock,
  Car, User, ClipboardList, ArrowRight,
  PlusCircle, Copy, Share2, History, ExternalLink,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  List, Type, Palette, Maximize2, Trash, Save, X, Calendar, UserCheck, Highlighter
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuthStore } from '../services/authStore';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type TabType = 'ISSUED' | 'TEMPLATES';

export default function WarrantyTerms() {
  const [activeTab, setActiveTab] = useState<TabType>('ISSUED');
  const [loading, setLoading] = useState(true);
  const [issuedTerms, setIssuedTerms] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [showEditor, setShowEditor] = useState<boolean>(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Editor states
  const editorRef = useRef<HTMLDivElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  
  // Toolbar Active States
  const [toolbarStates, setToolbarStates] = useState({
    bold: false,
    italic: false,
    underline: false,
    list: false,
    alignLeft: false,
    alignCenter: false,
    alignRight: false
  });

  const updateToolbarStates = () => {
    setToolbarStates({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      list: document.queryCommandState('insertUnorderedList'),
      alignLeft: document.queryCommandState('justifyLeft'),
      alignCenter: document.queryCommandState('justifyCenter'),
      alignRight: document.queryCommandState('justifyRight')
    });
  };
  
  // Vehicle Search
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');

  // Issue Modal Form State
  const [issueForm, setIssueForm] = useState({
    title: '',
    content: '',
    days_duration: 90,
    template_id: ''
  });

  const { user } = useAuthStore();

  const handleVehicleSearch = async (q: string) => {
    setVehicleSearchQuery(q);
    if (q.length < 2) {
      setVehicles([]);
      return;
    }
    try {
      const res = await api.get(`/vehicles?q=${q}`);
      setVehicles(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [issuedRes, templatesRes] = await Promise.all([
        api.get('/warranty/issued'),
        api.get('/warranty/templates')
      ]);
      setIssuedTerms(Array.isArray(issuedRes.data) ? issuedRes.data : []);
      setTemplates(Array.isArray(templatesRes.data) ? templatesRes.data : []);
    } catch (err) {
      console.error('Error fetching warranty data:', err);
      setIssuedTerms([]);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Popula o editor apenas quando ele é aberto (evita o reset do React ao digitar)
  useEffect(() => {
    if (showEditor && editorRef.current) {
        editorRef.current.innerHTML = editingTemplate?.content || `
            <h3>Condições de Garantia Técnica</h3>
            <p>Este documento estabelece as cláusulas de garantia para os serviços executados em nossa unidade.</p>
            <p><b>1. Validade:</b> O prazo de cobertura é contado em dias corridos a partir da data de entrega do veículo.</p>
            <p><b>2. Itens Cobertos:</b> Falhas decorrentes de montagem ou defeitos em componentes novos instalados.</p>
            <hr/>
            <p>Qualquer intervenção de terceiros invalidará este termo permanentemente.</p>
        `;
    }
  }, [showEditor, editingTemplate]);

  const handleSaveTemplate = async (templateData: any) => {
    try {
      if (editingTemplate) {
        await api.patch(`/warranty/templates/${editingTemplate.id}`, templateData);
      } else {
        await api.post('/warranty/templates', templateData);
      }
      setShowEditor(false);
      setEditingTemplate(null);
      fetchData();
    } catch (err) {
      console.error('Error saving template:', err);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!window.confirm('Excluir este modelo permanentemente?')) return;
    try {
      await api.delete(`/warranty/templates/${id}`);
      fetchData();
    } catch (err) {
      console.error('Error deleting template:', err);
    }
  };

  const generatePDF = (term: any) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('TERMO DE GARANTIA', 105, 25, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Emitido em: ${format(new Date(term.issued_at || term.created_at), 'dd/MM/yyyy HH:mm')}`, 105, 32, { align: 'center' });

    // Details Grid
    const details = [
      ['Cliente', term.client_name || '---'],
      ['Veículo', term.plate ? `${term.plate} - ${term.vehicle_model || ''}` : '---'],
      ['Ordem de Serviço', term.work_order_number || '---'],
      ['Vencimento', format(new Date(term.expires_at), 'dd/MM/yyyy')],
      ['Responsável', term.responsible_name || '---']
    ];

    autoTable(doc, {
      startY: 45,
      body: details,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
    });

    // Content
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(term.title, 14, (doc as any).lastAutoTable.finalY + 15);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const splitText = doc.splitTextToSize(term.content, 180);
    doc.text(splitText, 14, (doc as any).lastAutoTable.finalY + 25);

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(226, 232, 240);
        doc.line(14, 280, 196, 280);
        
        doc.setFontSize(10);
        doc.text('Assinatura da Oficina', 40, 290);
        doc.text('Assinatura do Cliente', 140, 290);
    }
    
    doc.save(`Garantia_${term.plate || 'Documento'}.pdf`);
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      {!showEditor && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <Shield className="text-slate-900" size={24} />
                Termos de Garantia
            </h1>
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mt-0.5">Gestão de modelos e certificados técnicos</p>
            </div>
            
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => { setEditingTemplate(null); setShowEditor(true); }}
                    className="h-9 px-4 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
                >
                    <PlusCircle size={16} /> Novo Modelo
                </button>
                <button 
                    onClick={() => setShowIssueModal(true)}
                    className="h-9 px-5 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-md active:scale-95"
                >
                    <Plus size={16} /> Emitir Garantia
                </button>
            </div>
        </div>
      )}

      {!showEditor && (
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 w-fit shadow-sm">
            <button
            onClick={() => setActiveTab('ISSUED')}
            className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                activeTab === 'ISSUED' ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            )}
            >
            <History size={14} /> Emitidos
            </button>
            <button
            onClick={() => setActiveTab('TEMPLATES')}
            className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                activeTab === 'TEMPLATES' ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            )}
            >
            <Copy size={14} /> Modelos
            </button>
        </div>
      )}

      {showEditor ? (
        <motion.div 
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-[100] bg-slate-50 flex flex-col items-center overflow-hidden"
        >
            {/* Header / Top Bar */}
            <div className="w-full h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm z-20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                        <Shield size={20} />
                    </div>
                    <div>
                        <h2 className="text-base font-black text-slate-900 leading-tight">Editor de Garantia</h2>
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Documentação Técnica</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                         onClick={() => setShowEditor(false)}
                         className="h-10 px-4 text-slate-500 font-bold hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all flex items-center gap-2 text-xs"
                    >
                        <X size={16} /> Cancelar
                    </button>
                    <button 
                         onClick={() => {
                            const title = (document.getElementById('tpl_title') as HTMLInputElement).value;
                            const duration = parseInt((document.getElementById('tpl_duration') as HTMLInputElement).value) || 90;
                            const content = editorRef.current?.innerHTML || '';
                            handleSaveTemplate({ title, days_duration: duration, content });
                         }}
                         className="h-10 px-6 bg-slate-900 text-white rounded-lg font-black text-xs hover:bg-slate-800 transition-all shadow-md flex items-center gap-2 active:scale-95"
                    >
                        <Save size={16} /> Salvar Modelo
                    </button>
                </div>
            </div>

            <div className="flex-1 w-full flex overflow-hidden">
                {/* Sidebar Configuration */}
                <div className="w-72 bg-white border-r border-slate-100 p-6 flex flex-col gap-6 shrink-0 overflow-y-auto custom-scrollbar">
                    <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase text-indigo-500 tracking-widest italic">Configuração</span>
                        <h3 className="text-base font-black text-slate-900">Estatuto Jurídico</h3>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-1.5 font-bold">
                            <label className="text-[9px] font-black uppercase text-slate-400 px-1">Título do Modelo*</label>
                            <input 
                                id="tpl_title"
                                defaultValue={editingTemplate?.title}
                                type="text"
                                placeholder="Garantia de Revisão"
                                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-slate-900 text-xs font-bold transition-all"
                            />
                        </div>

                        <div className="space-y-1.5 font-bold">
                            <label className="text-[9px] font-black uppercase text-slate-400 px-1">Validade (Dias)</label>
                            <div className="relative">
                                <Clock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    id="tpl_duration"
                                    type="number"
                                    defaultValue={editingTemplate?.days_duration || 90}
                                    className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-slate-900 text-xs font-bold transition-all"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-50 space-y-3">
                            <div className="flex gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                                <Calendar size={16} className="text-blue-500 shrink-0" />
                                <div>
                                    <p className="text-[9px] font-black text-blue-900 uppercase">Data</p>
                                    <p className="text-xs font-bold text-blue-700">{format(new Date(), 'dd/MM/yyyy')}</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                                <UserCheck size={16} className="text-emerald-500 shrink-0" />
                                <div>
                                    <p className="text-[9px] font-black text-emerald-900 uppercase">Responsável</p>
                                    <p className="text-xs font-bold text-emerald-700 truncate w-40">{user?.name || 'Admin'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Workspace */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Toolbar - onMouseDown evita que o editor perca o foco */}
                    <div className="bg-white border-b border-slate-200 p-2 shadow-sm flex items-center justify-center shrink-0 z-10 gap-2 flex-wrap">
                        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
                             <button 
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { document.execCommand('formatBlock', false, 'p'); updateToolbarStates(); }} 
                                className="h-8 px-2.5 hover:bg-white hover:shadow-sm rounded text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer" title="Texto"
                             >
                                 <Type size={12} /> TEXTO
                             </button>
                             <button 
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { document.execCommand('formatBlock', false, 'h2'); updateToolbarStates(); }} 
                                className="h-8 w-8 hover:bg-white hover:shadow-sm rounded text-[10px] font-black transition-all cursor-pointer" title="Título"
                             >
                                H
                             </button>
                        </div>

                        <div className="w-px h-5 bg-slate-200 mx-1" />

                        <div className="flex items-center gap-1">
                             <button 
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { document.execCommand('bold'); updateToolbarStates(); }} 
                                className={cn("w-8 h-8 flex items-center justify-center rounded transition-all cursor-pointer", toolbarStates.bold ? "bg-slate-900 text-white shadow-md" : "hover:bg-slate-100 text-slate-700")} 
                                title="Negrito"
                             >
                                <Bold size={16} />
                             </button>
                             <button 
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { document.execCommand('italic'); updateToolbarStates(); }} 
                                className={cn("w-8 h-8 flex items-center justify-center rounded transition-all cursor-pointer", toolbarStates.italic ? "bg-slate-900 text-white shadow-md" : "hover:bg-slate-100 text-slate-700")} 
                                title="Itálico"
                             >
                                <Italic size={16} />
                             </button>
                             <button 
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { document.execCommand('underline'); updateToolbarStates(); }} 
                                className={cn("w-8 h-8 flex items-center justify-center rounded transition-all cursor-pointer", toolbarStates.underline ? "bg-slate-900 text-white shadow-md" : "hover:bg-slate-100 text-slate-700")} 
                                title="Sublinhado"
                             >
                                <Underline size={16} />
                             </button>
                        </div>

                        <div className="w-px h-5 bg-slate-200 mx-1" />

                        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
                             <button 
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { document.execCommand('justifyLeft'); updateToolbarStates(); }} 
                                className={cn("w-8 h-8 flex items-center justify-center rounded transition-all cursor-pointer", toolbarStates.alignLeft ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600")} 
                             >
                                <AlignLeft size={16} />
                             </button>
                             <button 
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { document.execCommand('justifyCenter'); updateToolbarStates(); }} 
                                className={cn("w-8 h-8 flex items-center justify-center rounded transition-all cursor-pointer", toolbarStates.alignCenter ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600")} 
                             >
                                <AlignCenter size={16} />
                             </button>
                             <button 
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { document.execCommand('justifyRight'); updateToolbarStates(); }} 
                                className={cn("w-8 h-8 flex items-center justify-center rounded transition-all cursor-pointer", toolbarStates.alignRight ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600")} 
                             >
                                <AlignRight size={16} />
                             </button>
                        </div>

                        <div className="w-px h-5 bg-slate-200 mx-1" />

                        <div className="flex items-center gap-1 relative">
                             <button 
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { document.execCommand('insertUnorderedList'); updateToolbarStates(); }} 
                                className={cn("w-8 h-8 flex items-center justify-center rounded transition-all cursor-pointer", toolbarStates.list ? "bg-slate-900 text-white shadow-md" : "hover:bg-slate-100 text-slate-600")} 
                             >
                                <List size={16} />
                             </button>
                             
                             <div className="flex items-center gap-0.5 bg-slate-50 p-0.5 rounded-lg">
                                {/* Text Color Picker */}
                                <div className="relative">
                                    <button 
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => { setShowColorPicker(!showColorPicker); setShowHighlightPicker(false); }} 
                                        className={cn("w-9 h-9 flex flex-col items-center justify-center hover:bg-white rounded transition-all cursor-pointer", showColorPicker && "bg-white shadow-sm")} 
                                    >
                                        <Palette size={16} />
                                        <div className="w-5 h-1 bg-slate-900 rounded-full mt-0.5" />
                                    </button>
                                    
                                    {showColorPicker && (
                                        <div className="absolute top-11 right-0 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 z-[150] grid grid-cols-5 gap-2 animate-in fade-in zoom-in-95 w-48">
                                            {['#000000', '#ef4444', '#f87171', '#10b981', '#34d399', '#3b82f6', '#60a5fa', '#f59e0b', '#fbbf24', '#6366f1', '#818cf8', '#8b5cf6', '#a78bfa', '#ec4899', '#f472b6', '#64748b', '#94a3b8', '#1e293b', '#334155', '#ffffff'].map(c => (
                                                <button 
                                                    key={c} 
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => { document.execCommand('foreColor', false, c); setShowColorPicker(false); }}
                                                    className="w-7 h-7 rounded-lg border border-slate-100 hover:scale-110 transition-transform cursor-pointer shadow-sm" 
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Highlight Picker */}
                                <div className="relative">
                                    <button 
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => { setShowHighlightPicker(!showHighlightPicker); setShowColorPicker(false); }} 
                                        className={cn("w-9 h-9 flex flex-col items-center justify-center hover:bg-white rounded transition-all cursor-pointer", showHighlightPicker && "bg-white shadow-sm")} 
                                    >
                                        <Highlighter size={16} />
                                        <div className="w-5 h-1 bg-yellow-400 rounded-full mt-0.5" />
                                    </button>
                                    
                                    {showHighlightPicker && (
                                        <div className="absolute top-11 right-0 bg-white border border-slate-200 rounded-xl shadow-2xl p-3 z-[150] grid grid-cols-4 gap-2 animate-in fade-in zoom-in-95 w-40">
                                            {['#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#ddd6fe', '#fed7aa', '#f3f4f6', 'transparent'].map(c => (
                                                <button 
                                                    key={c} 
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => { 
                                                        if (c === 'transparent') {
                                                            document.execCommand('removeFormat', false, 'backColor');
                                                        } else {
                                                            document.execCommand('hiliteColor', false, c); 
                                                        }
                                                        setShowHighlightPicker(false); 
                                                    }}
                                                    className="w-7 h-7 rounded-lg border border-slate-100 hover:scale-110 transition-transform cursor-pointer shadow-sm flex items-center justify-center" 
                                                    style={{ backgroundColor: c === 'transparent' ? '#fff' : c }}
                                                >
                                                    {c === 'transparent' && <X size={12} className="text-slate-400" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* Editor Background */}
                    <div className="flex-1 bg-slate-200/50 p-6 overflow-y-auto custom-scrollbar flex justify-center">
                        <div className="w-[180mm] min-h-[250mm] bg-white shadow-xl rounded-sm p-[1.5cm] flex flex-col relative animate-in zoom-in-95 duration-500">
                             <div className="border-b-[4px] border-slate-900 pb-5 mb-10 flex justify-between items-start">
                                 <div>
                                     <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-1.5">Termo de Garantia</h1>
                                     <div className="flex items-center gap-2">
                                         <span className="w-8 h-[1.5px] bg-indigo-500" />
                                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Certificação Técnica Especializada</p>
                                     </div>
                                 </div>
                                 <Shield size={40} className="text-slate-900 opacity-5" />
                             </div>

                             {/* Editor React-Safe */}
                             <div 
                                id="rich-editor"
                                ref={editorRef}
                                contentEditable 
                                suppressContentEditableWarning
                                onKeyUp={updateToolbarStates}
                                onMouseUp={updateToolbarStates}
                                className="prose prose-slate max-w-none focus:outline-none flex-1 font-serif text-slate-800 text-[14px] leading-[1.6] text-justify"
                                spellCheck={false}
                             />

                             {/* Signature Footer */}
                             <div className="mt-16 pt-10 border-t border-slate-100 flex justify-between items-center px-8">
                                 <div className="text-center">
                                     <div className="w-48 h-px bg-slate-300 mb-1.5" />
                                     <p className="text-[8px] font-black text-slate-400 uppercase">Assinatura Oficina</p>
                                 </div>
                                 <div className="text-center">
                                     <div className="w-48 h-px bg-slate-300 mb-1.5" />
                                     <p className="text-[8px] font-black text-slate-400 uppercase">Assinatura Cliente</p>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
      ) : (
        <div className="min-h-[400px]">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <div className="w-10 h-10 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sincronizando Módulo...</p>
             </div>
          ) : (
             <AnimatePresence mode="wait">
               {activeTab === 'ISSUED' ? (
                 <motion.div key="issued" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {Array.isArray(issuedTerms) && issuedTerms.length > 0 ? (
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                          {issuedTerms.map(term => (
                             <div key={term.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all group">
                                <div className="flex items-start justify-between mb-3">
                                   <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                      <Shield size={20} />
                                   </div>
                                   <span className={cn(
                                       "px-2 py-0.5 rounded-md text-[9px] font-black uppercase",
                                       term.status === 'ACTIVE' ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                                   )}>
                                      {term.status === 'ACTIVE' ? 'Ativo' : 'Expirado'}
                                   </span>
                                </div>
                                <h3 className="text-sm font-black text-slate-900 mb-0.5 truncate">{term.title}</h3>
                                <p className="text-[9px] text-slate-400 font-bold uppercase mb-3">Emissão: {format(new Date(term.issued_at), 'dd/MM/yyyy')}</p>
                                <div className="space-y-3 mb-4 pt-3 border-t border-slate-50">
                                   <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                      <User size={14} className="text-slate-300" /> {term.client_name || 'Diversos'}
                                   </div>
                                   <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                      <Car size={14} className="text-slate-300" /> <span className="uppercase text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono">{term.plate || '---'}</span>
                                    </div>
                                 </div>
                                 <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                    <button onClick={() => generatePDF(term)} className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 flex items-center gap-1.5 transition-colors">
                                       <Download size={12} /> PDF
                                    </button>
                                 </div>
                              </div>
                           ))}
                        </div>
                    ) : (
                       <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                           <Shield className="mx-auto text-slate-100 mb-4" size={48} />
                           <h2 className="text-lg font-black text-slate-900">Sem Garantias</h2>
                           <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Os certificados aparecerão aqui.</p>
                        </div>
                    )}
                 </motion.div>
               ) : (
                 <motion.div key="templates" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {Array.isArray(templates) && templates.map(tpl => (
                           <div key={tpl.id} className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-slate-400 transition-all group flex flex-col h-full shadow-sm">
                              <div className="flex items-start justify-between mb-3">
                                 <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center">
                                    <FileText size={20} />
                                 </div>
                                 <div className="flex items-center gap-1">
                                    <button onClick={() => { setEditingTemplate(tpl); setShowEditor(true); }} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all">
                                       <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDeleteTemplate(tpl.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                       <Trash2 size={16} />
                                    </button>
                                 </div>
                              </div>
                              <h3 className="text-base font-black text-slate-900 mb-1 leading-tight">{tpl.title}</h3>
                              <div className="text-[10px] text-slate-400 line-clamp-2 mb-4 font-bold uppercase" dangerouslySetInnerHTML={{ __html: tpl.content.replace(/<[^>]*>/g, '') }} />
                              <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
                                 <span className="text-[9px] font-black uppercase text-slate-400">{tpl.days_duration} DIAS</span>
                                 <button 
                                    onClick={() => setShowIssueModal(true)} 
                                    className="h-8 px-3 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center gap-1.5"
                                 >
                                    Emitir <ArrowRight size={12} />
                                 </button>
                              </div>
                           </div>
                        ))}
                        <button 
                          onClick={() => { setEditingTemplate(null); setShowEditor(true); }}
                          className="border-2 border-dashed border-slate-100 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-slate-300 hover:border-slate-300 hover:text-slate-900 transition-all group min-h-[180px]"
                        >
                           <div className="w-10 h-10 rounded-full border-2 border-current flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Plus size={20} />
                           </div>
                           <span className="text-[10px] font-black uppercase tracking-widest">Novo Modelo</span>
                        </button>
                     </div>
                 </motion.div>
               )}
             </AnimatePresence>
          )}
        </div>
      )}

      {/* Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-sm animate-in fade-in duration-300">
           <motion.div 
             initial={{ opacity: 0, scale: 0.98, y: 10 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             className="bg-white rounded-[32px] w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200"
           >
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                        <Plus size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900 leading-tight">Emitir Garantia</h2>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Vínculo de certificado ao veículo</p>
                    </div>
                 </div>
                 <button onClick={() => setShowIssueModal(false)} className="w-8 h-8 text-slate-400 hover:text-slate-900 flex items-center justify-center transition-all bg-slate-50 rounded-lg">
                    <X size={16} />
                 </button>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                  {/* Step 1: Search & Template */}
                  <div className="flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar border-r border-slate-50">
                     <div className="space-y-3">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">1. Selecione o Modelo Base</label>
                        <div className="grid grid-cols-1 gap-2">
                           {Array.isArray(templates) && templates.map(tpl => (
                             <label key={tpl.id} className="relative cursor-pointer">
                                 <input 
                                    type="radio" 
                                    name="term_tpl" 
                                    className="peer hidden" 
                                    value={tpl.id} 
                                    checked={issueForm.template_id === tpl.id}
                                    onChange={() => {
                                      setIssueForm({
                                        template_id: tpl.id,
                                        title: tpl.title,
                                        content: tpl.content.replace(/<[^>]*>/g, ''),
                                        days_duration: tpl.days_duration
                                      });
                                    }} 
                                 />
                                 <div className="p-3.5 rounded-xl border-2 border-slate-100 peer-checked:border-slate-900 peer-checked:bg-slate-50 transition-all flex items-center justify-between hover:border-slate-300 shadow-sm">
                                    <div className="flex-1">
                                        <p className="text-xs font-black text-slate-900 leading-tight mb-0.5">{tpl.title}</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase">{tpl.days_duration} dias de cobertura</p>
                                    </div>
                                    <div className={cn(
                                        "w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center shrink-0 ml-4",
                                        issueForm.template_id === tpl.id ? "border-slate-900 bg-slate-900" : "border-slate-300"
                                    )}>
                                        {issueForm.template_id === tpl.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                 </div>
                             </label>
                           ))}
                        </div>
                     </div>

                     <div className="space-y-3 pt-6 border-t border-slate-50 font-bold">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">2. Veículo & Cliente</label>
                        
                        {!selectedVehicle ? (
                           <div className="relative">
                              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                              <input 
                                value={vehicleSearchQuery}
                                onChange={(e) => handleVehicleSearch(e.target.value)}
                                type="text" 
                                placeholder="Placa ou Chassi..." 
                                className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 bg-white focus:border-slate-900 text-xs font-bold transition-all shadow-sm"
                              />
                              {vehicles.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-20 p-1 overflow-hidden">
                                  {vehicles.map(v => (
                                    <button 
                                      key={v.id}
                                      onClick={() => { setSelectedVehicle(v); setVehicles([]); }}
                                      className="w-full px-4 py-3 text-left hover:bg-slate-50 rounded-lg flex items-center justify-between group transition-colors"
                                    >
                                      <div>
                                        <p className="text-xs font-black text-slate-900 uppercase">{v.plate} — {v.model}</p>
                                        <p className="text-[9px] text-slate-400 uppercase font-black">{v.client_name || 'Particular'}</p>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                           </div>
                        ) : (
                           <div className="p-4 bg-slate-900 rounded-2xl text-white flex items-center justify-between shadow-lg">
                              <div className="flex items-center gap-3">
                                 <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
                                    <Car size={18} />
                                 </div>
                                 <div>
                                    <p className="text-xs font-black uppercase text-white/90 leading-tight">{selectedVehicle.plate} | {selectedVehicle.model}</p>
                                    <p className="text-[9px] text-white/40 uppercase font-bold tracking-wider">{selectedVehicle.client_name || 'Particular'}</p>
                                 </div>
                              </div>
                              <button onClick={() => setSelectedVehicle(null)} className="text-white/40 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"><Trash size={14} /></button>
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Step 2: Content Details */}
                  <div className="w-full md:w-[350px] bg-slate-50/50 p-8 flex flex-col gap-6 shrink-0 border-l border-slate-100 shadow-inner">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">3. Personalização</label>

                     <div className="space-y-4 flex-1">
                        <div className="space-y-1.5 font-bold">
                            <label className="text-[9px] font-black uppercase text-slate-500 px-1">Título Final</label>
                            <input 
                                value={issueForm.title}
                                onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
                                type="text" 
                                placeholder="Nome no documento" 
                                className="w-full h-11 px-4 rounded-xl border border-slate-200 text-xs font-bold bg-white transition-all focus:border-slate-900 shadow-sm" 
                            />
                        </div>

                        <div className="space-y-1.5 font-bold">
                            <label className="text-[9px] font-black uppercase text-slate-500 px-1">Prazo (Dias)</label>
                            <input 
                                value={issueForm.days_duration}
                                onChange={(e) => setIssueForm({ ...issueForm, days_duration: parseInt(e.target.value) || 0 })}
                                type="number" 
                                className="w-full h-11 px-4 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:border-slate-900 shadow-sm" 
                            />
                        </div>

                        <div className="space-y-1.5 font-bold flex-1">
                            <label className="text-[9px] font-black uppercase text-slate-500 px-1">Cláusulas Específicas</label>
                            <textarea 
                                value={issueForm.content}
                                onChange={(e) => setIssueForm({ ...issueForm, content: e.target.value })}
                                rows={6} 
                                className="w-full p-4 rounded-xl border border-slate-200 text-xs font-bold bg-white resize-none focus:border-slate-900 scroll-smooth shadow-sm flex-1 mb-4" 
                                placeholder="Observações..." 
                            />
                        </div>
                     </div>

                     <button 
                         onClick={async () => {
                             if(!issueForm.title || !selectedVehicle) return alert("Preencha o título e selecione o veículo.");
                             try {
                                 await api.post('/warranty/issued', { 
                                     title: issueForm.title, 
                                     days_duration: issueForm.days_duration, 
                                     content: issueForm.content, 
                                     template_id: issueForm.template_id,
                                     vehicle_id: selectedVehicle?.id,
                                     client_id: selectedVehicle?.client_id
                                 });
                                 setShowIssueModal(false); 
                                 setSelectedVehicle(null); 
                                 setIssueForm({ title: '', content: '', days_duration: 90, template_id: '' });
                                 fetchData();
                             } catch (err) { console.error('Erro ao emitir garantia:', err); }
                         }}
                         className="w-full h-12 bg-slate-900 text-white rounded-xl font-black text-xs hover:bg-slate-800 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-auto"
                     >
                         <CheckCircle2 size={16} /> Emitir Documento
                     </button>
                  </div>
              </div>
           </motion.div>
        </div>
      )}

      {/* Seed Templates - Standard Alert */}
      {templates.length === 0 && !loading && activeTab === 'TEMPLATES' && (
        <motion.div 
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl border border-white/5"
            style={{ backgroundColor: 'var(--sidebar-color, #0f172a)' }}
        >
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h2 className="text-lg font-black mb-1 leading-tight">Deseja cadastrar modelos sugeridos?</h2>
                    <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest leading-none">
                        Comece com nossos modelos técnicos validados para sua oficina.
                    </p>
                </div>
                
                <button 
                  onClick={async () => {
                     const defaults = [
                        { title: 'Garantia: Motor e Câmbio', days_duration: 180, content: '<h3>Garantia de Motor e Câmbio</h3><p>Este termo cobre componentes internos lubrificados do motor e sistema de transmissão.</p>' },
                        { title: 'Garantia: Revisão Geral', days_duration: 90, content: '<h3>Garantia de Revisão</h3><p>Garantia técnica para serviços de manutenção preventiva e periódica.</p>' }
                     ];
                     try {
                        for (const d of defaults) {
                           await api.post('/warranty/templates', d);
                        }
                        await fetchData();
                     } catch (err) {
                        console.error('Erro ao semear modelos:', err);
                     }
                  }}
                  className="h-9 px-6 bg-white text-slate-900 rounded-lg font-black text-xs shadow-md hover:bg-slate-100 transition-all active:scale-95 shrink-0"
                >
                   Carregar Modelos
                </button>
            </div>
            {/* Background Accent */}
            <div className="absolute -right-4 -bottom-4 opacity-5 text-white">
                <Shield size={120} />
            </div>
        </motion.div>
      )}
    </div>
  );
}