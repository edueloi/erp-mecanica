import React, { useState, useEffect } from 'react';
import { 
  Shield, Plus, FileText, Search, Filter, 
  Download, Send, Trash2, Edit, ChevronRight,
  Printer, CheckCircle2, AlertCircle, Clock,
  Car, User, ClipboardList, ArrowRight,
  PlusCircle, Copy, Share2, History, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../services/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
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
  
  // Editor content state
  const [editorContent, setEditorContent] = useState('');
  
  // Vehicle Search
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');

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
      // Ensure state is always array even on error to prevent crashes
      setIssuedTerms([]);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
    const primaryColor = [30, 41, 59]; // slate-800

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

  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      {!showEditor && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <Shield className="text-slate-900" size={32} />
                Termos de Garantia
            </h1>
            <p className="text-slate-500 font-medium mt-1">Gerencie modelos e emita garantias técnicas para seus clientes.</p>
            </div>
            
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => { setEditingTemplate(null); setShowEditor(true); }}
                    className="h-11 px-6 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
                >
                    <PlusCircle size={18} /> Novo Modelo
                </button>
                <button 
                    onClick={() => setShowIssueModal(true)}
                    className="h-11 px-8 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                >
                    <Plus size={18} /> Emitir Garantia
                </button>
            </div>
        </div>
      )}

      {!showEditor && (
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 w-fit shadow-sm">
            <button
            onClick={() => setActiveTab('ISSUED')}
            className={cn(
                "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                activeTab === 'ISSUED' ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            )}
            >
            <History size={16} /> Emitidos
            </button>
            <button
            onClick={() => setActiveTab('TEMPLATES')}
            className={cn(
                "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                activeTab === 'TEMPLATES' ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            )}
            >
            <Copy size={16} /> Modelos / Templates
            </button>
        </div>
      )}

      {showEditor ? (
        <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[40px] border border-slate-200 shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[85vh]"
        >
            {/* Editor Sidebar/Fields */}
            <div className="w-full md:w-80 bg-slate-50 border-r border-slate-100 p-8 flex flex-col gap-8 shrink-0">
                <div className="flex items-center justify-between">
                   <div>
                    <h2 className="text-xl font-black text-slate-900 leading-tight">Painel de Cadastro</h2>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mt-1">Configure o modelo</p>
                   </div>
                   <button onClick={() => setShowEditor(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900">
                      <Plus className="rotate-45" size={24} />
                   </button>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 px-1 italic">Data de Registro</label>
                        <div className="h-12 px-4 bg-white border border-slate-200 rounded-xl flex items-center gap-3 text-slate-900 font-bold text-sm shadow-sm">
                           <Clock size={16} className="text-indigo-500" />
                           {format(new Date(), 'dd/MM/yyyy')}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 px-1 italic">Responsável Técnico</label>
                        <div className="h-12 px-4 bg-white border border-slate-200 rounded-xl flex items-center gap-3 text-slate-900 font-bold text-sm shadow-sm">
                           <User size={16} className="text-emerald-500" />
                           {user?.name || 'Admin MecaERP'}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 px-1 italic">Ref. Garantia (Título)*</label>
                        <input 
                            id="tpl_title"
                            defaultValue={editingTemplate?.title}
                            type="text"
                            placeholder="Motor, Notebook..."
                            className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl focus:border-slate-900 focus:ring-0 text-sm font-bold shadow-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 px-1 italic">Duração (Dias)</label>
                        <input 
                           id="tpl_duration"
                           type="number"
                           defaultValue={editingTemplate?.days_duration || 90}
                           className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl focus:border-slate-900 text-sm font-bold shadow-sm"
                        />
                    </div>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-200 flex flex-col gap-3">
                   <button 
                     onClick={() => {
                        const title = (document.getElementById('tpl_title') as HTMLInputElement).value;
                        const duration = parseInt((document.getElementById('tpl_duration') as HTMLInputElement).value) || 90;
                        const content = document.getElementById('rich-editor')?.innerHTML || '';
                        handleSaveTemplate({ title, days_duration: duration, content });
                     }}
                     className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-2"
                   >
                     🚀 Salvar Documento
                   </button>
                   <button onClick={() => setShowEditor(false)} className="h-10 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900">
                     Cancelar
                   </button>
                </div>
            </div>

            {/* Main Editor */}
            <div className="flex-1 bg-slate-100/30 p-4 md:p-10 flex flex-col">
                <div className="max-w-4xl mx-auto w-full flex flex-col h-full gap-6">
                    {/* Toolbar */}
                    <div className="bg-white border border-slate-200 p-2 rounded-2xl shadow-sm flex items-center flex-wrap gap-1 sticky top-0 z-10">
                        <button onClick={() => document.execCommand('bold')} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl text-slate-700" title="Negrito">
                            <Plus size={18} className="rotate-[135deg]" /> {/* Simulation of Bold if needed, or use specific icon if available */}
                            <b>B</b>
                        </button>
                        <button onClick={() => document.execCommand('italic')} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl text-slate-700" title="Itálico">
                            <i>I</i>
                        </button>
                        <button onClick={() => document.execCommand('underline')} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl text-slate-700" title="Sublinhado">
                            <u>U</u>
                        </button>
                        <div className="w-px h-6 bg-slate-200 mx-2" />
                        <button onClick={() => document.execCommand('justifyLeft')} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl text-slate-700" title="Esquerda"><Edit size={16} /></button>
                        <button onClick={() => document.execCommand('justifyCenter')} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl text-slate-700" title="Centro"><ChevronRight size={16} /></button>
                        <button onClick={() => document.execCommand('justifyRight')} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl text-slate-700" title="Direita"><ArrowRight size={16} /></button>
                        <div className="w-px h-6 bg-slate-200 mx-2" />
                        <button onClick={() => document.execCommand('insertUnorderedList')} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl text-slate-700" title="Lista"><ClipboardList size={18} /></button>
                    </div>

                    {/* Paper */}
                    <div className="flex-1 bg-white shadow-2xl rounded-sm p-[2cm] border border-slate-200 min-h-[1000px] outline-none overflow-y-auto">
                        <div className="border-b-4 border-slate-900 pb-6 mb-12 flex justify-between items-end">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Termo de Garantia</h1>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">MecaERP Professional Warranty Cloud</p>
                            </div>
                            <Shield size={50} className="text-slate-900 opacity-10" />
                        </div>

                        <div 
                          id="rich-editor"
                          contentEditable 
                          className="prose prose-slate max-w-none focus:outline-none min-h-[500px] font-serif text-slate-800 text-xl leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: editingTemplate?.content || '<p>Descreva aqui todas as condições e coberturas da sua garantia...</p>' }}
                        />

                        <div className="mt-20 pt-16 border-t border-slate-200 flex justify-between">
                            <div className="text-center w-64">
                                <div className="h-px bg-slate-300 w-full mb-2" />
                                <p className="text-[10px] font-black uppercase text-slate-400">Assinatura do Técnico Responsável</p>
                            </div>
                            <div className="text-center w-64">
                                <div className="h-px bg-slate-300 w-full mb-2" />
                                <p className="text-[10px] font-black uppercase text-slate-400">Assinatura do Cliente / Proprietário</p>
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
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {issuedTerms.map(term => (
                             <div key={term.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                                <div className="flex items-start justify-between mb-4">
                                   <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                      <Shield size={24} />
                                   </div>
                                   <span className={cn(
                                       "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase shadow-sm",
                                       term.status === 'ACTIVE' ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                                   )}>
                                      {term.status === 'ACTIVE' ? 'Ativo' : 'Espirado'}
                                   </span>
                                </div>
                                <h3 className="text-lg font-black text-slate-900 mb-1 truncate">{term.title}</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mb-4">Emitido: {format(new Date(term.issued_at), 'dd/MM/yyyy')}</p>
                                <div className="space-y-4 mb-6 pt-4 border-t border-slate-50">
                                   <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                      <User size={16} className="text-slate-300" /> {term.client_name || 'Diversos'}
                                   </div>
                                   <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                      <Car size={16} className="text-slate-300" /> <span className="uppercase bg-slate-100 px-2 py-0.5 rounded text-xs">{term.plate || 'V-000'}</span>
                                   </div>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 italic">
                                   <button onClick={() => generatePDF(term)} className="text-xs font-black uppercase text-slate-400 hover:text-slate-900 flex items-center gap-2">
                                      <Download size={14} /> Baixar PDF
                                   </button>
                                   <button className="text-xs font-black uppercase text-slate-400 hover:text-emerald-600 flex items-center gap-2">
                                      <Send size={14} /> Enviar
                                   </button>
                                </div>
                             </div>
                          ))}
                       </div>
                    ) : (
                       <div className="bg-white rounded-[40px] border-2 border-dashed border-slate-100 p-20 text-center">
                          <Shield className="mx-auto text-slate-100 mb-6" size={60} />
                          <h2 className="text-xl font-black text-slate-900">Nenhuma Garantia Emitida</h2>
                          <p className="text-sm text-slate-400 font-medium mt-2">Os certificados gerados aparecerão aqui para gestão.</p>
                       </div>
                    )}
                 </motion.div>
               ) : (
                 <motion.div key="templates" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {Array.isArray(templates) && templates.map(tpl => (
                          <div key={tpl.id} className="bg-white p-7 rounded-[32px] border border-slate-200 hover:border-slate-400 transition-all hover:shadow-2xl group flex flex-col h-full">
                             <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                                   <FileText size={24} />
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button onClick={() => { setEditingTemplate(tpl); setShowEditor(true); }} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
                                      <Edit size={18} />
                                   </button>
                                   <button onClick={() => handleDeleteTemplate(tpl.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                                      <Trash2 size={18} />
                                   </button>
                                </div>
                             </div>
                             <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight">{tpl.title}</h3>
                             <div className="text-xs text-slate-500 line-clamp-3 mb-8 font-medium leading-relaxed opacity-70" dangerouslySetInnerHTML={{ __html: tpl.content }} />
                             <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-50">
                                <span className="text-[10px] font-black uppercase text-slate-400">{tpl.days_duration} dias úteis</span>
                                <button 
                                   onClick={() => setShowIssueModal(true)} 
                                   className="h-10 px-5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg active:scale-95 flex items-center gap-2"
                                >
                                   Emitir Agora <ArrowRight size={14} />
                                </button>
                             </div>
                          </div>
                       ))}
                       <button 
                         onClick={() => { setEditingTemplate(null); setShowEditor(true); }}
                         className="border-2 border-dashed border-slate-200 rounded-[32px] p-8 flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-slate-900 hover:text-slate-900 transition-all group min-h-[250px]"
                       >
                          <div className="w-14 h-14 rounded-full border-2 border-current flex items-center justify-center group-hover:scale-110 transition-transform">
                             <PlusCircle size={32} />
                          </div>
                          <span className="text-sm font-black uppercase tracking-[0.2em]">Novo Modelo Blindado</span>
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
              <div className="p-10 border-b border-slate-100 flex items-start justify-between shrink-0">
                 <div>
                    <h2 className="text-2xl font-black text-slate-900 leading-tight">Emitir Novo Certificado</h2>
                    <p className="text-sm text-slate-500 font-medium mt-1">Vincule uma garantia a um cliente e veículo</p>
                 </div>
                 <button onClick={() => setShowIssueModal(false)} className="w-12 h-12 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl flex items-center justify-center transition-all">
                    <Plus size={32} className="rotate-45" />
                 </button>
              </div>

              <div className="p-10 space-y-8 overflow-y-auto max-h-[65vh] custom-scrollbar">
                 {/* Template Picker */}
                 <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-1">1. Selecione um Modelo Base</label>
                    <div className="grid grid-cols-2 gap-3">
                       {Array.isArray(templates) && templates.map(tpl => (
                         <label key={tpl.id} className="relative cursor-pointer group">
                             <input type="radio" name="term_tpl" className="peer hidden" value={tpl.id} onChange={() => {
                                 (document.getElementById('issue_title') as HTMLInputElement).value = tpl.title;
                                 (document.getElementById('issue_content') as HTMLTextAreaElement).value = tpl.content;
                                 (document.getElementById('issue_days') as HTMLInputElement).value = tpl.days_duration;
                             }} />
                             <div className="p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 peer-checked:border-slate-900 peer-checked:bg-white peer-checked:shadow-md transition-all group-hover:border-slate-200">
                                <p className="text-xs font-black text-slate-900 truncate">{tpl.title}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{tpl.days_duration} dias</p>
                             </div>
                         </label>
                       ))}
                       {templates.length === 0 && (
                         <div className="col-span-2 p-6 text-center text-slate-400 text-sm font-medium border-2 border-dashed border-slate-100 rounded-2xl">
                             Nenhum modelo cadastrado.
                         </div>
                       )}
                    </div>
                 </div>

                  {/* Issue Details */}
                 <div className="space-y-6 pt-6 border-t border-slate-100">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-1">2. Detalhes da Emissão</label>
                    
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 px-1">Buscar Veículo</label>
                        {!selectedVehicle ? (
                           <div className="relative group">
                              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                              <input 
                                value={vehicleSearchQuery}
                                onChange={(e) => handleVehicleSearch(e.target.value)}
                                type="text" 
                                placeholder="Digite a placa ou modelo do veículo..." 
                                className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 focus:border-slate-900 text-sm font-bold bg-slate-50 transition-all focus:bg-white"
                              />
                              {vehicles.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-10 animate-in fade-in slide-in-from-top-2">
                                  {vehicles.map(v => (
                                    <button 
                                      key={v.id}
                                      onClick={() => {
                                          setSelectedVehicle(v);
                                          setVehicles([]);
                                          setVehicleSearchQuery('');
                                      }}
                                      className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between group transition-colors"
                                    >
                                      <div>
                                        <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{v.plate} - {v.model}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{v.client_name || 'Diversos'}</p>
                                      </div>
                                      <ChevronRight size={16} className="text-slate-200 group-hover:text-emerald-500" />
                                    </button>
                                  ))}
                                </div>
                              )}
                           </div>
                        ) : (
                           <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between shadow-sm animate-in zoom-in-95">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm">
                                    <Car size={20} />
                                 </div>
                                 <div>
                                    <p className="text-sm font-black text-slate-900">{selectedVehicle.plate} - {selectedVehicle.model}</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">{selectedVehicle.client_name || 'Sem Cliente'}</p>
                                 </div>
                              </div>
                              <button 
                                onClick={() => setSelectedVehicle(null)}
                                className="text-[10px] font-black uppercase text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all"
                              >
                                Alternar
                              </button>
                           </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 px-1">Dias de Garantia</label>
                        <input id="issue_days" type="number" defaultValue={90} className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-slate-900 text-sm font-bold bg-slate-50" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 px-1">Título do Certificado</label>
                        <input id="issue_title" type="text" placeholder="Título que aparecerá no arquivo" className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-slate-900 text-sm font-bold bg-slate-50" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 px-1">Observações Personalizadas</label>
                        <textarea id="issue_content" rows={4} className="w-full p-4 rounded-2xl border border-slate-200 focus:border-slate-900 text-sm font-bold bg-slate-50 resize-none custom-scrollbar" />
                    </div>
                 </div>
              </div>

              <div className="p-10 shrink-0 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                 <button onClick={() => { setShowIssueModal(false); setSelectedVehicle(null); }} className="h-14 px-8 text-slate-500 font-bold hover:text-slate-900 transition-colors">Cancelar</button>
                 <button 
                   onClick={async () => {
                       const title = (document.getElementById('issue_title') as HTMLInputElement).value;
                       const days_duration = parseInt((document.getElementById('issue_days') as HTMLInputElement).value) || 90;
                       const content = (document.getElementById('issue_content') as HTMLTextAreaElement).value;
                       
                       try {
                           await api.post('/warranty/issued', { 
                              title, 
                              days_duration, 
                              content, 
                              vehicle_id: selectedVehicle?.id,
                              client_id: selectedVehicle?.client_id
                           });
                           setShowIssueModal(false);
                           setSelectedVehicle(null);
                           setVehicleSearchQuery('');
                           fetchData();
                       } catch (err) {
                           console.error(err);
                           alert("Erro ao emitir garantia. Verifique os campos.");
                       }
                   }}
                   className="h-14 px-10 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl active:scale-[0.98] flex items-center gap-2"
                 >
                    <CheckCircle2 size={18} /> Confirmar Emissão
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Seed Templates Helper (One-time) */}
      {templates.length === 0 && !loading && activeTab === 'TEMPLATES' && (
        <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex items-center justify-between animate-in slide-in-from-bottom-4">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm">
                 <Shield size={24} />
              </div>
              <div>
                 <p className="text-sm font-black text-slate-900">Precisa de modelos prontos?</p>
                 <p className="text-xs text-slate-500 font-medium tracking-tight">Comece agora com nossos modelos padrões de Motor, Suspensão e Elétrica.</p>
              </div>
           </div>
           <button 
             onClick={async () => {
                const defaults = [
                   { title: 'Garantia de Revisão Geral', days_duration: 90, content: 'Este certificado cobre serviços de revisão preventiva, incluindo verificação de fluídos e filtros. Não cobre desgaste natural de peças ou mau uso.' },
                   { title: 'Garantia de Motor e Câmbio', days_duration: 180, content: 'Cobertura total para componentes internos do motor e caixa de câmbio contra defeitos de montagem ou fadiga prematura de material.' },
                   { title: 'Garantia de Suspensão', days_duration: 120, content: 'Garantia de serviços realizados em amortecedores, buchas e braços oscilantes. Exclui danos causados por impactos severos ou sinistros.' }
                ];
                for (const d of defaults) await api.post('/warranty/templates', d);
                fetchData();
             }}
             className="h-10 px-6 bg-amber-600 text-white rounded-xl text-xs font-black shadow-lg hover:bg-amber-700 transition-all active:scale-95"
           >
              Carregar Modelos Padrões
           </button>
        </div>
      )}
    </div>
  );
}
