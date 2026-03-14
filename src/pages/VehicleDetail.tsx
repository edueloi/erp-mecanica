import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Car, User, Gauge, Calendar, Clock, 
  ClipboardList, History, Camera, FileText, 
  Plus, Edit, Trash2, MessageSquare, ExternalLink,
  CheckCircle2, AlertCircle, Info, ChevronRight,
  Printer, Share2, Settings, Wrench, CheckSquare, LogIn, Package
} from 'lucide-react';
import api from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type VehicleTab = 'SUMMARY' | 'OS' | 'APPOINTMENTS' | 'TECH_HISTORY' | 'CHECKLIST' | 'PHOTOS' | 'DOCUMENTS';

export default function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<VehicleTab>('SUMMARY');

  const [checklists, setChecklists] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch main vehicle data first
      const vRes = await api.get(`/vehicles/${id}`);
      setVehicle(vRes.data);
      if (vRes.data.attachments) setAttachments(vRes.data.attachments);

      // Then fetch secondary data independently
      api.get(`/checklists/vehicle/${id}`)
        .then(res => setChecklists(Array.isArray(res.data) ? res.data : []))
        .catch(err => {
          console.error('Error fetching checklists:', err);
          setChecklists([]);
        });

      api.get(`/entries/vehicle/${id}`)
        .then(res => setEntries(Array.isArray(res.data) ? res.data : []))
        .catch(err => {
          console.error('Error fetching entries:', err);
          setEntries([]);
        });

    } catch (err: any) {
      console.error('Error fetching core vehicle data:', err);
      if (err.response?.status === 500) {
        alert("O servidor encontrou um erro ao processar o histórico deste veículo. " + 
              (err.response.data?.details || "Tente novamente mais tarde."));
      }
      if (!vehicle) navigate('/vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'PHOTO' | 'DOCUMENT') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Arquivo muito grande. Limite de 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;
        await api.post(`/vehicles/${id}/attachments`, {
          type,
          url: base64String,
          name: file.name,
          size: file.size,
          mime_type: file.type
        });
        fetchData(); // Refresh everything to update history too
      } catch (err) {
        console.error('Error uploading file:', err);
        alert("Erro ao enviar arquivo.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!window.confirm("Deseja excluir este anexo?")) return;
    try {
      await api.delete(`/vehicles/${id}/attachments/${attachmentId}`);
      fetchData();
    } catch (err) {
      console.error('Error deleting attachment:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-full">Carregando...</div>;
  if (!vehicle) return null;

  const tabs: { id: VehicleTab; label: string; icon: any }[] = [
    { id: 'SUMMARY', label: 'Resumo', icon: Info },
    { id: 'OS', label: 'Ordens de Serviço', icon: ClipboardList },
    { id: 'APPOINTMENTS', label: 'Agendamentos', icon: Clock },
    { id: 'TECH_HISTORY', label: 'Histórico Técnico', icon: Wrench },
    { id: 'CHECKLIST', label: 'Checklist', icon: CheckSquare },
    { id: 'PHOTOS', label: 'Fotos', icon: Camera },
    { id: 'DOCUMENTS', label: 'Documentos', icon: FileText },
  ];

  return (
    <div className="flex flex-col h-full -m-6 bg-[#F6F8FB]">
      {/* Header - Compact */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/vehicles')} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="h-10 px-3 bg-slate-900 rounded-lg flex items-center justify-center text-white font-mono font-black text-sm shadow-sm whitespace-nowrap min-w-max tracking-widest">
              {vehicle.plate?.toUpperCase() || '---'}
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">{vehicle.brand} {vehicle.model}</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{vehicle.client_name || 'Sem proprietário'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="h-9 px-3 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-2 transition-all">
            <Edit size={14} /> Editar
          </button>
          <button className="h-9 px-4 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm">
            <Plus size={16} /> Nova OS
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-slate-200 px-6 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0 mt-5">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all relative whitespace-nowrap",
              activeTab === tab.id ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <tab.icon size={14} />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="activeTabVehicle" className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <main className="flex-1 overflow-auto px-6 pb-6 pt-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="max-w-6xl mx-auto pt-6"
          >
            {activeTab === 'SUMMARY' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column - Main Info */}
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Especificações do Veículo</h3>
                    </div>
                    <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-8">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Marca / Modelo</p>
                        <p className="text-sm font-bold text-slate-900">{vehicle.brand} {vehicle.model}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Ano</p>
                        <p className="text-sm font-bold text-slate-900">{vehicle.year}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Cor</p>
                        <p className="text-sm font-bold text-slate-900">{vehicle.color || '---'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Combustível</p>
                        <p className="text-sm font-bold text-slate-900">{vehicle.fuel_type || '---'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Chassi (VIN)</p>
                        <p className="text-sm font-bold text-slate-900 font-mono tracking-wider">{vehicle.vin || 'Não informado'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Alertas e Pendências Técnicas</h3>
                    </div>
                    <div className="p-6 space-y-4">
                      {vehicle.km >= (vehicle.next_revision_km || 0) && vehicle.next_revision_km > 0 ? (
                        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                          <AlertCircle className="text-red-600" size={20} />
                          <div>
                            <p className="text-xs font-bold text-red-900">Revisão Atrasada</p>
                            <p className="text-[10px] text-red-700">A quilometragem atual ({vehicle.km.toLocaleString()} KM) ultrapassou a revisão prevista ({vehicle.next_revision_km.toLocaleString()} KM).</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                          <CheckCircle2 className="text-emerald-600" size={20} />
                          <div>
                            <p className="text-xs font-bold text-emerald-900">Saúde Técnica em Dia</p>
                            <p className="text-[10px] text-emerald-700">Nenhuma pendência crítica detectada para este veículo.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Stats & Quick Actions */}
                <div className="space-y-6">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Métricas do Veículo</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">KM Atual</p>
                        <p className="text-lg font-black text-slate-900">{vehicle.km?.toLocaleString() || 0}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total OS</p>
                        <p className="text-lg font-black text-slate-900">{vehicle.workOrders?.length || 0}</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Média Retorno</p>
                        <p className="text-lg font-black text-blue-700">120 <span className="text-[10px]">dias</span></p>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Total Gasto</p>
                        <p className="text-lg font-black text-emerald-700">R$ 4.2k</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 px-2">Ações Rápidas</h3>
                    <button className="w-full h-10 px-4 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-3 hover:bg-slate-800 transition-all">
                      <Plus size={16} /> Nova Ordem de Serviço
                    </button>
                    <button className="w-full h-10 px-4 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-3 hover:bg-slate-50 transition-all">
                      <Clock size={16} /> Novo Agendamento
                    </button>
                    <button
                      onClick={() => id && id !== 'undefined' && navigate(`/vehicles/${id}/checklist`)}
                      className="w-full h-10 px-4 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-3 hover:bg-indigo-100 transition-all"
                    >
                      <CheckSquare size={16} /> Novo Checklist de Inspeção
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const res = await api.post('/entries', { vehicle_id: id, client_id: vehicle.client_id });
                          navigate(`/vehicle-entries/${res.data.id}`);
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="w-full h-10 px-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-3 hover:bg-emerald-100 transition-all"
                    >
                      <Plus size={16} /> Nova Entrada / Checklist Inicial
                    </button>
                    <button className="w-full h-10 px-4 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-3 hover:bg-slate-50 transition-all">
                      <History size={16} /> Histórico Completo
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'OS' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <h3 className="text-sm font-bold text-slate-900">Histórico de Manutenções</h3>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">OS #</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">KM</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valor</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vehicle.workOrders?.map((wo: any) => (
                      <tr key={wo.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => navigate(`/work-orders/${wo.id}`)}>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{wo.number}</td>
                        <td className="px-6 py-4 text-xs text-slate-500">{format(new Date(wo.created_at), 'dd/MM/yyyy')}</td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-600">{wo.km?.toLocaleString()} KM</td>
                        <td className="px-6 py-4 text-sm font-black text-slate-900">R$ {wo.total_amount?.toLocaleString('pt-BR')}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase border border-slate-200">
                            {wo.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                            <button className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded transition-all">
                              <ExternalLink size={14} />
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded transition-all">
                              <Printer size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!vehicle.workOrders || vehicle.workOrders.length === 0) && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm italic">Nenhuma OS encontrada.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'TECH_HISTORY' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                <div className="relative border-l-2 border-slate-100 ml-4 pl-10 space-y-10 py-2">
                  {vehicle.history && vehicle.history.length > 0 ? (
                    vehicle.history.map((item: any) => {
                      const isMaintenance = item.event_type === 'MAINTENANCE';
                      const isOwnership = item.event_type === 'OWNERSHIP';
                      const isRegistration = item.event_type === 'REGISTRATION';
                      const isEntry = item.event_type === 'ENTRY';
                      
                      return (
                        <div key={item.id} className="relative group">
                          {/* Timeline Dot */}
                          <div className={cn(
                            "absolute -left-[51px] top-1.5 w-5 h-5 rounded-full border-[4px] border-white shadow-md z-10 transition-transform group-hover:scale-125",
                            isMaintenance ? "bg-blue-600" : 
                            isOwnership ? "bg-purple-500" :
                            isRegistration ? "bg-emerald-500" : "bg-slate-400"
                          )} />
                          
                          <div className="flex flex-col md:flex-row md:items-start gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className={cn(
                                        "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border",
                                        isMaintenance ? "text-blue-600 bg-blue-50 border-blue-100" : 
                                        isOwnership ? "text-purple-600 bg-purple-50 border-purple-100" :
                                        isRegistration ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-slate-500 bg-slate-50 border-slate-100"
                                    )}>
                                        {isMaintenance ? 'Manutenção' : 
                                         isOwnership ? 'Troca de Titular' :
                                         isRegistration ? 'Cadastro' : 'Workshop'}
                                    </span>
                                    <span className="text-xs font-bold text-slate-400">
                                        {format(new Date(item.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                                    </span>
                                </div>
                                <h4 className="text-base font-black text-slate-900 mb-2">{item.description}</h4>
                                
                                {isMaintenance && item.workOrderDetails?.items && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {item.workOrderDetails.items.map((it: any, itIdx: number) => (
                                            <span key={itIdx} className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg border border-slate-200/50 flex items-center gap-1.5">
                                                {it.item_category === 'PART' ? <Package size={10} /> : <Wrench size={10} />}
                                                {it.description}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {isOwnership && (
                                    <div className="bg-purple-50/50 rounded-xl p-4 border border-purple-100 flex items-center gap-6 max-w-lg mb-4">
                                        <div className="flex-1">
                                            <p className="text-[10px] font-bold text-purple-400 uppercase mb-1">Dono Anterior</p>
                                            <p className="text-sm font-bold text-slate-600 truncate">{item.old_value || 'Nenhum'}</p>
                                        </div>
                                        <ChevronRight size={16} className="text-purple-200" />
                                        <div className="flex-1">
                                            <p className="text-[10px] font-bold text-purple-400 uppercase mb-1">Novo Proprietário</p>
                                            <p className="text-sm font-bold text-purple-700 truncate">{item.new_value}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-row md:flex-col gap-3 shrink-0">
                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 min-w-[120px]">
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Quilometragem</p>
                                    <p className="text-sm font-black text-slate-900">{item.km?.toLocaleString() || '---'} KM</p>
                                </div>
                                {(item.value > 0 || item.workOrderDetails?.total_amount > 0) && (
                                    <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 min-w-[120px]">
                                        <p className="text-[8px] font-black text-emerald-400 uppercase mb-1">Investimento</p>
                                        <p className="text-sm font-black text-emerald-700">R$ {(item.value || item.workOrderDetails?.total_amount)?.toLocaleString('pt-BR')}</p>
                                    </div>
                                )}
                            </div>
                          </div>

                          {isMaintenance && item.workOrderDetails && (
                              <div className="mt-4 flex items-center gap-3">
                                  <button 
                                    onClick={() => navigate(`/work-orders/${item.workOrderDetails.id}`)}
                                    className="h-9 px-4 bg-slate-100 text-slate-600 rounded-xl text-[11px] font-bold hover:bg-slate-200 transition-all flex items-center gap-2"
                                  >
                                    Ver Ordem de Serviço <ExternalLink size={14} />
                                  </button>
                                  <button className="h-9 px-4 bg-white border border-slate-200 text-slate-500 rounded-xl text-[11px] font-bold hover:bg-slate-50 transition-all flex items-center gap-2">
                                    Imprimir Comprovante <Printer size={14} />
                                  </button>
                              </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-20">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <History size={40} className="text-slate-200" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">Sem Eventos Registrados</h3>
                      <p className="text-sm text-slate-500 max-w-sm mx-auto">Este veículo ainda não possui um histórico técnico ou de manutenção unificado.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'CHECKLIST' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-5 bg-gradient-to-r from-indigo-50 to-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <CheckSquare size={16} className="text-indigo-600" /> Checklists de Inspeção (Serviço)
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Inspeções técnicas para manutenção e revisão</p>
                    </div>
                    <button
                      onClick={() => id && id !== 'undefined' && navigate(`/vehicles/${id}/checklist`)}
                      className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
                    >
                      <Plus size={15} /> Novo Checklist
                    </button>
                  </div>
                  
                  <div className="divide-y divide-slate-100">
                    {Array.isArray(checklists) && checklists.map((cl) => (
                      <div 
                        key={cl.id} 
                        onClick={() => navigate(`/vehicles/${id}/checklist/${cl.id}`)}
                        className="px-6 py-4 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer group"
                      >
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-lg flex items-center justify-center">
                               <ClipboardList size={20} />
                            </div>
                            <div>
                               <p className="text-sm font-bold text-slate-900">Checklist Tecnico - {cl.km?.toLocaleString()} KM</p>
                               <p className="text-[10px] text-slate-500 uppercase font-bold">{format(new Date(cl.created_at), 'dd/MM/yyyy HH:mm')} • {cl.inspector_name || 'Técnico'}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${cl.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                               {cl.status === 'COMPLETED' ? 'Finalizado' : 'Rascunho'}
                            </span>
                            <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                         </div>
                      </div>
                    ))}
                    {checklists.length === 0 && (
                      <div className="p-8 text-center text-slate-400 text-sm italic">Nenhum checklist de serviço realizado.</div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-5 bg-gradient-to-r from-emerald-50 to-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <LogIn size={16} className="text-emerald-600" /> Checklists Iniciais (Entrada)
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Fotos e dados coletados na recepção do veículo</p>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const res = await api.post('/entries', { vehicle_id: id, client_id: vehicle.client_id });
                          navigate(`/vehicle-entries/${res.data.id}`);
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
                    >
                      <Plus size={15} /> Nova Entrada
                    </button>
                  </div>
                  
                  <div className="divide-y divide-slate-100">
                    {Array.isArray(entries) && entries.map((entry) => (
                      <div 
                        key={entry.id} 
                        onClick={() => navigate(`/vehicle-entries/${entry.id}`)}
                        className="px-6 py-4 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer group"
                      >
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center">
                               <Camera size={20} />
                            </div>
                            <div>
                               <p className="text-sm font-bold text-slate-900">Entrada / Vistoria Inicial</p>
                               <p className="text-[10px] text-slate-500 uppercase font-bold">{format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm')} • {entry.responsible_name || 'Recepção'}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${entry.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                               {entry.status === 'COMPLETED' ? 'Finalizado' : 'Rascunho'}
                            </span>
                            <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                         </div>
                      </div>
                    ))}
                    {entries.length === 0 && (
                      <div className="p-8 text-center text-slate-400 text-sm italic">Nenhum checklist de entrada realizado.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'PHOTOS' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 leading-tight">Fotos do Veículo</h3>
                      <p className="text-sm text-slate-500 font-medium">Histórico visual, danos e vistorias</p>
                    </div>
                    <div>
                        <label className="h-10 px-6 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm cursor-pointer">
                          <Plus size={16} /> Adicionar Foto
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'PHOTO')} />
                        </label>
                    </div>
                  </div>

                  {attachments.filter(a => a.type === 'PHOTO').length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {attachments.filter(a => a.type === 'PHOTO').map((img) => (
                          <div key={img.id} className="relative aspect-square group rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
                              <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                 <button onClick={() => window.open(img.url, '_blank')} className="p-2 bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-all">
                                    <ExternalLink size={16} />
                                 </button>
                                 <button onClick={() => handleDeleteAttachment(img.id)} className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all">
                                    <Trash2 size={16} />
                                 </button>
                              </div>
                              <div className="absolute bottom-2 left-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                 <p className="text-[10px] font-bold text-slate-700 truncate">{img.name}</p>
                                 <p className="text-[8px] text-slate-400 font-bold uppercase">{format(new Date(img.created_at), 'dd/MM/yyyy')}</p>
                              </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 px-10 border-2 border-dashed border-slate-100 rounded-3xl">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                           <Camera size={24} className="text-slate-200" />
                        </div>
                        <h3 className="text-slate-900 font-bold text-sm mb-1">Câmera pronta</h3>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">Nenhuma foto anexada a este veículo.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'DOCUMENTS' && (
              <div className="space-y-6">
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 leading-tight">Documentação</h3>
                      <p className="text-sm text-slate-500 font-medium">Certificados, notas fiscais e comprovantes</p>
                    </div>
                    <div>
                        <label className="h-10 px-6 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm cursor-pointer">
                          <Plus size={16} /> Novo Documento
                          <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'DOCUMENT')} />
                        </label>
                    </div>
                  </div>

                  {attachments.filter(a => a.type === 'DOCUMENT').length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {attachments.filter(a => a.type === 'DOCUMENT').map((doc) => (
                           <div key={doc.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:bg-white hover:border-blue-100 hover:shadow-md">
                              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                                 <FileText size={24} />
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className="text-sm font-bold text-slate-900 truncate">{doc.name}</p>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase">{format(new Date(doc.created_at), 'dd/MM/yyyy HH:mm')}</p>
                              </div>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => window.open(doc.url, '_blank')} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                   <ExternalLink size={16} />
                                </button>
                                <button onClick={() => handleDeleteAttachment(doc.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                   <Trash2 size={16} />
                                </button>
                              </div>
                           </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 px-10 border-2 border-dashed border-slate-100 rounded-3xl">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                           <FileText size={24} className="text-slate-200" />
                        </div>
                        <h3 className="text-slate-900 font-bold text-sm mb-1">Arquivos vazios</h3>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">Nenhum documento anexado a este veículo.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {['APPOINTMENTS'].includes(activeTab) && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                  <Clock size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Em Desenvolvimento</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">Esta aba está sendo preparada para trazer ainda mais controle sobre o histórico técnico do veículo.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
