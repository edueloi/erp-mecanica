import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Car, User, Gauge, Calendar, Clock, 
  ClipboardList, History, Camera, FileText, 
  Plus, Edit, Trash2, MessageSquare, ExternalLink,
  CheckCircle2, AlertCircle, Info, ChevronRight,
  Printer, Share2, Settings, Wrench
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

type VehicleTab = 'SUMMARY' | 'OS' | 'APPOINTMENTS' | 'TECH_HISTORY' | 'PHOTOS' | 'DOCUMENTS';

export default function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<VehicleTab>('SUMMARY');

  const fetchVehicle = async () => {
    try {
      const res = await api.get(`/vehicles/${id}`);
      setVehicle(res.data);
    } catch (err) {
      console.error(err);
      navigate('/vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicle();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-full">Carregando...</div>;
  if (!vehicle) return null;

  const tabs: { id: VehicleTab; label: string; icon: any }[] = [
    { id: 'SUMMARY', label: 'Resumo', icon: Info },
    { id: 'OS', label: 'Ordens de Serviço', icon: ClipboardList },
    { id: 'APPOINTMENTS', label: 'Agendamentos', icon: Clock },
    { id: 'TECH_HISTORY', label: 'Histórico Técnico', icon: Wrench },
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
            <div className="w-12 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white font-mono font-black text-sm shadow-sm">
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
      <div className="bg-white border-b border-slate-200 px-6 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
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
      <main className="flex-1 overflow-auto p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="max-w-6xl mx-auto"
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
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">#{wo.number}</td>
                        <td className="px-6 py-4 text-xs text-slate-500">{format(new Date(wo.created_at), 'dd/MM/yyyy')}</td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-600">{wo.km?.toLocaleString()} KM</td>
                        <td className="px-6 py-4 text-sm font-black text-slate-900">R$ {wo.total_amount?.toLocaleString('pt-BR')}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase border border-slate-200">
                            {wo.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
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
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {[
                    { date: '01/03/2024', title: 'Troca de Óleo e Filtros', desc: 'Óleo 5W30 Sintético + Filtro de Óleo e Ar.', km: '120.450 KM', icon: Wrench },
                    { date: '15/12/2023', title: 'Sistema de Freios', desc: 'Troca de pastilhas dianteiras e retífica de discos.', km: '115.200 KM', icon: Wrench },
                    { date: '10/08/2023', title: 'Suspensão Dianteira', desc: 'Troca de buchas da bandeja e alinhamento.', km: '108.900 KM', icon: Wrench },
                  ].map((item, i) => (
                    <div key={i} className="relative flex items-start gap-6 group">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center shrink-0 z-10 shadow-sm border border-white transition-transform group-hover:scale-110">
                        <item.icon size={18} />
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{item.date} • {item.km}</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {['APPOINTMENTS', 'PHOTOS', 'DOCUMENTS'].includes(activeTab) && (
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
