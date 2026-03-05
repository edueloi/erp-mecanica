import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Smartphone, Printer, CheckCircle2, 
  User, Car, MapPin, ClipboardList, Clock, 
  Calendar, Camera, LogIn, ShieldCheck, Info,
  Search, AlertCircle, Trash2, Share2, Loader, History
} from 'lucide-react';
import api from '../services/api';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import FuelLevel from '../components/FuelLevel';
import { fipeService, FipeItem } from '../services/fipeService';

export default function VehicleEntryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [publicToken, setPublicToken] = useState<string | null>(null);
  const [tokenCountdown, setTokenCountdown] = useState(0);

  // FIPE states
  const [fipeBrands, setFipeBrands] = useState<FipeItem[]>([]);
  const [fipeModels, setFipeModels] = useState<FipeItem[]>([]);
  const [isFipeLoading, setIsFipeLoading] = useState(false);

  useEffect(() => {
    fetchEntry();
    fipeService.getBrands('carros').then(setFipeBrands);
  }, [id]);

  const fetchEntry = async () => {
    try {
      const res = await api.get(`/entries/${id}`);
      setEntry(res.data);
      if (res.data.public_token) {
        setPublicToken(res.data.public_token);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: any) => {
    try {
      setSaving(true);
      await api.patch(`/entries/${id}`, data);
      setEntry((prev: any) => ({ ...prev, ...data }));
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateToken = async () => {
    try {
      const res = await api.post(`/entries/${id}/token`);
      setPublicToken(res.data.token);
      setTokenCountdown(3600);
      setShowQR(true);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center gap-4 grayscale opacity-40">
       <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
       <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Carregando Detalhes da Entrada...</p>
    </div>
  );

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 pb-32">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/vehicle-entries')} className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight italic">
              DETALHES DA <span className="text-indigo-600">ENTRADA</span>
            </h1>
            <p className="text-slate-500 font-medium">Preencha os dados e realize a inspeção inicial.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleGenerateToken}
            className="h-12 px-6 bg-white border border-indigo-200 text-indigo-600 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all shadow-sm"
          >
            <Smartphone size={18} /> Acesso p/ Celular
          </button>
          <button 
            className="h-12 px-8 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
            onClick={() => handleUpdate({ status: 'COMPLETED' })}
          >
            <CheckCircle2 size={18} /> Finalizar Entrada
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Responsável e Entrada */}
          <section className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <LogIn size={20} />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Responsável & Entrada</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Nome do Responsável</label>
                <input 
                  type="text" 
                  value={entry.responsible_name || ''} 
                  onChange={(e) => setEntry({...entry, responsible_name: e.target.value})}
                  onBlur={(e) => handleUpdate({ responsible_name: e.target.value })}
                  placeholder="Seu nome aqui..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Data</label>
                  <input 
                    type="date" 
                    value={entry.entry_date || ''}
                    onChange={(e) => setEntry({...entry, entry_date: e.target.value})}
                    onBlur={(e) => handleUpdate({ entry_date: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Horário</label>
                  <input 
                    type="time" 
                    value={entry.entry_time || ''}
                    onChange={(e) => setEntry({...entry, entry_time: e.target.value})}
                    onBlur={(e) => handleUpdate({ entry_time: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <input 
                type="checkbox" 
                id="tow_truck" 
                checked={entry.arrived_by_tow_truck}
                onChange={(e) => handleUpdate({ arrived_by_tow_truck: e.target.checked })}
                className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="tow_truck" className="text-sm font-bold text-slate-700">Chegou de Guincho?</label>
            </div>
          </section>

          {/* Dados do Cliente */}
          <section className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <User size={20} />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Dados do Cliente</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={entry.customer_name || ''}
                  onChange={(e) => setEntry({...entry, customer_name: e.target.value})}
                  onBlur={(e) => handleUpdate({ customer_name: e.target.value })}
                  placeholder="Nome do cliente..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">CPF / CNPJ</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={entry.customer_document || ''}
                    onChange={(e) => setEntry({...entry, customer_document: e.target.value})}
                    onBlur={async (e) => {
                       const doc = e.target.value;
                       handleUpdate({ customer_document: doc });
                       if (doc.length >= 11) {
                          try {
                             const res = await api.get(`/clients?search=${doc}`);
                             if (res.data.length > 0) {
                                const c = res.data[0];
                                handleUpdate({ 
                                   customer_name: c.name, 
                                   customer_phone: c.phone,
                                   customer_zip_code: c.zip_code,
                                   customer_state: c.state,
                                   customer_city: c.city,
                                   customer_neighborhood: c.neighborhood,
                                   customer_street: c.street,
                                   customer_number: c.number,
                                   client_id: c.id
                                });
                             }
                          } catch (err) {}
                       }
                    }}
                    placeholder="000.000.000-00"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                  />
                  <Search size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Telefone / WhatsApp</label>
                <input 
                  type="text" 
                  value={entry.customer_phone || ''}
                  onChange={(e) => setEntry({...entry, customer_phone: e.target.value})}
                  onBlur={(e) => handleUpdate({ customer_phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                />
              </div>
              <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">CEP</label>
                   <input 
                    type="text" 
                    value={entry.customer_zip_code || ''}
                    onChange={(e) => setEntry({...entry, customer_zip_code: e.target.value})}
                    onBlur={(e) => handleUpdate({ customer_zip_code: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                  />
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">UF</label>
                   <input 
                    type="text" 
                    value={entry.customer_state || ''}
                    onChange={(e) => setEntry({...entry, customer_state: e.target.value})}
                    onBlur={(e) => handleUpdate({ customer_state: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                  />
                </div>
                <div className="col-span-2">
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Cidade</label>
                   <input 
                    type="text" 
                    value={entry.customer_city || ''}
                    onChange={(e) => setEntry({...entry, customer_city: e.target.value})}
                    onBlur={(e) => handleUpdate({ customer_city: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                   />
                </div>
              </div>
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Bairro</label>
                    <input 
                     type="text" 
                     value={entry.customer_neighborhood || ''}
                     onChange={(e) => setEntry({...entry, customer_neighborhood: e.target.value})}
                     onBlur={(e) => handleUpdate({ customer_neighborhood: e.target.value })}
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                    />
                 </div>
                 <div className="md:col-span-2 flex gap-4">
                    <div className="flex-1">
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Endereço (Rua/Av)</label>
                       <input 
                        type="text" 
                        value={entry.customer_street || ''}
                        onChange={(e) => setEntry({...entry, customer_street: e.target.value})}
                        onBlur={(e) => handleUpdate({ customer_street: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                       />
                    </div>
                    <div className="w-24">
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Nº</label>
                       <input 
                        type="text" 
                        value={entry.customer_number || ''}
                        onChange={(e) => setEntry({...entry, customer_number: e.target.value})}
                        onBlur={(e) => handleUpdate({ customer_number: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                       />
                    </div>
                 </div>
              </div>
            </div>
          </section>

          {/* Dados do Veículo */}
          <section className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Car size={20} />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Dados do Veículo</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1 text-indigo-500 italic">PLACA</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={entry.vehicle_plate || ''}
                    onChange={(e) => setEntry({...entry, vehicle_plate: e.target.value.toUpperCase()})}
                    onBlur={async (e) => {
                       const plate = e.target.value.toUpperCase();
                       handleUpdate({ vehicle_plate: plate });
                       if (plate.length >= 7) {
                          try {
                             const res = await api.get(`/vehicles?search=${plate}`);
                             if (res.data.length > 0) {
                                const v = res.data[0];
                                handleUpdate({ 
                                   vehicle_brand: v.brand, 
                                   vehicle_model: v.model, 
                                   vehicle_year: String(v.year),
                                   vehicle_color: v.color,
                                   vehicle_chassis: v.vin,
                                   vehicle_fuel_type: v.fuel_type,
                                   vehicle_id: v.id
                                });
                             }
                          } catch (err) {}
                       }
                    }}
                    placeholder="ABC-1234"
                    className="w-full px-4 py-3 bg-slate-50 border border-indigo-100 rounded-2xl text-sm font-black tracking-widest focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all uppercase"
                  />
                  <Search size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-300" />
                </div>
              </div>
              <div className="md:col-span-2">
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Nº Chassi</label>
                 <input 
                  type="text" 
                  value={entry.vehicle_chassis || ''}
                  onChange={(e) => setEntry({...entry, vehicle_chassis: e.target.value})}
                  onBlur={(e) => handleUpdate({ vehicle_chassis: e.target.value })}
                  placeholder="DIGITE O CHASSI..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                />
              </div>
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Marca</label>
                 <input 
                  type="text" 
                  value={entry.vehicle_brand || ''}
                  onChange={(e) => setEntry({...entry, vehicle_brand: e.target.value})}
                  onBlur={(e) => handleUpdate({ vehicle_brand: e.target.value })}
                  placeholder="Ex: Volkswagen"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                />
              </div>
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Versão / Modelo</label>
                 <input 
                  type="text" 
                  value={entry.vehicle_model || ''}
                  onChange={(e) => setEntry({...entry, vehicle_model: e.target.value})}
                  onBlur={(e) => handleUpdate({ vehicle_model: e.target.value })}
                  placeholder="Ex: Fox 1.6 Highline"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                />
              </div>
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">KM Atual</label>
                 <input 
                  type="number" 
                  value={entry.vehicle_km || ''}
                  onChange={(e) => setEntry({...entry, vehicle_km: e.target.value})}
                  onBlur={(e) => handleUpdate({ vehicle_km: e.target.value })}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                />
              </div>
            </div>
          </section>

          {/* Checkout Adicional */}
          <section className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Itens de Conferência</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-sm font-bold text-slate-700">Documento está no veículo?</span>
                  <input 
                    type="checkbox" 
                    checked={entry.doc_in_vehicle} 
                    onChange={(e) => handleUpdate({ doc_in_vehicle: e.target.checked })}
                    className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600"
                  />
               </div>
               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-sm font-bold text-slate-700">Luz de painel acesa?</span>
                  <input 
                    type="checkbox" 
                    checked={entry.dashboard_light_on} 
                    onChange={(e) => handleUpdate({ dashboard_light_on: e.target.checked })}
                    className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600"
                  />
               </div>
               <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Quantidade de Portas</label>
                  <div className="flex gap-4">
                     {[2, 3, 4, 5].map(p => (
                       <button
                         key={p}
                         onClick={() => handleUpdate({ doors_count: p })}
                         className={`flex-1 py-3 rounded-2xl font-black text-sm transition-all ${entry.doors_count === p ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}
                       >
                         {p}
                       </button>
                     ))}
                  </div>
               </div>
            </div>
          </section>

          {/* Histórico e Serviço */}
          <section className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <History size={20} />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Serviço e Histórico</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Última Revisão KM</label>
                <input 
                  type="number" 
                  value={entry.last_revision_km || ''}
                  onChange={(e) => setEntry({...entry, last_revision_km: e.target.value})}
                  onBlur={(e) => handleUpdate({ last_revision_km: e.target.value })}
                  placeholder="KM"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Data da Última Revisão</label>
                <input 
                  type="date" 
                  value={entry.last_revision_date || ''}
                  onChange={(e) => setEntry({...entry, last_revision_date: e.target.value})}
                  onBlur={(e) => handleUpdate({ last_revision_date: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Serviço Solicitado pelo Cliente (Relato)</label>
                <textarea 
                  value={entry.requested_service || ''}
                  onChange={(e) => setEntry({...entry, requested_service: e.target.value})}
                  onBlur={(e) => handleUpdate({ requested_service: e.target.value })}
                  placeholder="Escreva como relatado pelo cliente..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all min-h-[100px]"
                />
              </div>
            </div>
            
            <div className="p-5 bg-indigo-50/50 rounded-3xl border border-indigo-100/50">
               <div className="flex items-center gap-2 mb-3">
                  <Info className="text-indigo-500" size={16} />
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Diagnóstico Técnico</span>
               </div>
               <p className="text-[10px] font-bold text-indigo-900/60 leading-relaxed uppercase">
                  O DIAGNÓSTICO TÉCNICO INCLUI ESCANEAMENTO ELETRÔNICO COMPLETO, TESTES DE ATUADORES E SENSORES, AVALIAÇÃO DE GRANDEZAS ELÉTRICAS, TESTES FUNCIONAIS E ANÁLISE TÉCNICA AVANÇADA PARA IDENTIFICAÇÃO DA CAUSA RAIZ DO PROBLEMA.
               </p>
            </div>
          </section>

          {/* Nível de Combustível */}
          <section className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <AlertCircle size={20} />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Nível de Combustível</h3>
            </div>
            
            <FuelLevel 
              value={entry.fuel_level || 'EMPTY'} 
              onChange={(val) => handleUpdate({ fuel_level: val })}
            />
          </section>
        </div>

        {/* Sidebar Space */}
        <div className="space-y-8">
           {/* Summary Card */}
           <div className="bg-slate-900 text-white p-8 rounded-[32px] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full -mr-16 -mt-16 blur-3xl" />
              <div className="relative space-y-6">
                 <div>
                   <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">Resumo da Entrada</p>
                   <h2 className="text-3xl font-black italic tracking-tight">{entry.vehicle_plate || '---'}</h2>
                   <p className="text-slate-400 font-bold uppercase text-xs mt-1">{entry.vehicle_brand || '---'} {entry.vehicle_model || ''}</p>
                 </div>

                 <div className="space-y-4 pt-4 border-t border-white/10">
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-slate-500 uppercase font-black tracking-widest">Status</span>
                       <span className={`px-3 py-1 rounded-full font-black uppercase ${entry.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          {entry.status === 'COMPLETED' ? 'Concluído' : 'Em Aberto'}
                       </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-slate-500 uppercase font-black tracking-widest">Fotos</span>
                       <span className="text-emerald-400 font-black">{entry.items?.filter((i: any) => i.image_url).length || 0} de 5</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Inspeção Checklist Fast Mode */}
           <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Camera size={20} />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Fotos Iniciais</h3>
                </div>
                {entry.photos_confirmed && <CheckCircle2 size={24} className="text-emerald-500" />}
              </div>

              <div className="grid grid-cols-1 gap-4">
                {entry.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                    <div className="min-w-0">
                       <p className="text-xs font-black text-slate-900 truncate">{item.item}</p>
                       <p className="text-[10px] text-slate-400 font-bold uppercase">{item.category}</p>
                    </div>
                    {item.image_url ? (
                      <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white shadow-md">
                        <img src={item.image_url} alt={item.item} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-300 border border-dashed border-slate-200">
                         <Camera size={16} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                 <input 
                    type="checkbox" 
                    id="photos_conf" 
                    checked={entry.photos_confirmed}
                    onChange={(e) => handleUpdate({ photos_confirmed: e.target.checked })}
                    className="w-5 h-5 rounded-lg border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="photos_conf" className="text-[10px] font-black text-indigo-900 uppercase leading-relaxed tracking-wide">
                     Confirmo que as fotos foram tiradas
                  </label>
              </div>
           </div>
        </div>
      </div>

      {/* QR Code / Share Modal */}
      <AnimatePresence>
        {showQR && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
              onClick={() => setShowQR(false)}
            />
            <div className="fixed inset-0 flex items-center justify-center z-[101] p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-sm pointer-events-auto overflow-hidden text-center"
              >
                <div className="p-8 space-y-6">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto">
                    <Smartphone size={32} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight italic">MODO <span className="text-indigo-600">SMARTPHONE</span></h3>
                    <p className="text-sm text-slate-500 px-4 leading-relaxed">
                      Escaneie para capturar as fotos e preencher os dados diretamente pelo celular.
                    </p>
                  </div>
                  
                  <div className="relative bg-white p-4 rounded-[40px] border-4 border-slate-50 inline-block shadow-2xl">
                    {publicToken ? (
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(window.location.origin + '/entry-upload/' + publicToken)}`} 
                        alt="QR Code" 
                        className="w-56 h-56 rounded-2xl"
                      />
                    ) : (
                      <div className="w-56 h-56 flex items-center justify-center">
                        <Loader className="animate-spin text-slate-300" size={32} />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 pt-2">
                    <button 
                      onClick={() => {
                        const url = window.location.origin + '/entry-upload/' + publicToken;
                        navigator.clipboard.writeText(url);
                        alert('Link de acesso copiado!');
                      }}
                      className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                    >
                      <Share2 size={18} /> Copiar Link de Acesso
                    </button>
                    <button onClick={() => setShowQR(false)} className="h-12 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] hover:text-slate-600 transition-colors">
                      Voltar para a página
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md p-4 lg:pl-72 border-t border-slate-100 z-40">
         <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className={`w-3 h-3 rounded-full ${saving ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
               <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{saving ? 'Salvando Alterações...' : 'Todas as alterações salvas'}</span>
            </div>
            <button className="h-12 px-8 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-wider flex items-center gap-2 hover:bg-slate-800 transition-all">
               <Printer size={18} /> Imprimir Comprovante
            </button>
         </div>
      </div>
    </div>
  );
}
