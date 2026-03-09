import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Camera, CheckCircle2, ShieldCheck, Info, Loader, Smartphone, 
  User, Car, AlertCircle, Send, ChevronRight, ChevronLeft,
  Calendar, Clock, CheckCircle, MapPin, Search
} from 'lucide-react';
import api from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import FuelLevel from '../components/FuelLevel';

export default function EntryPublicForm() {
  const { token } = useParams();
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  
  // Cliente autocomplete
  const [clientSuggestions, setClientSuggestions] = useState<any[]>([]);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [clientSearchTimeout, setClientSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const clientInputRef = useRef<HTMLDivElement>(null);

  // FIPE / veículo lookup
  const [fipeLoading, setFipeLoading] = useState(false);

  useEffect(() => {
    fetchEntry();
  }, [token]);

  // Fechar dropdown de clientes ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (clientInputRef.current && !clientInputRef.current.contains(e.target as Node)) {
        setShowClientSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchEntry = async () => {
    try {
      const res = await api.get(`/entries/public/${token}`);
      setEntry(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: any) => {
    try {
      setEntry((prev: any) => ({ ...prev, ...data }));
      await api.patch(`/entries/public/${token}`, data);
    } catch (err) {
      console.error(err);
    }
  };

  // Buscar clientes por nome
  const searchClients = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setClientSuggestions([]);
      setShowClientSuggestions(false);
      return;
    }

    try {
      const res = await api.get(`/clients?q=${encodeURIComponent(searchTerm)}`);
      setClientSuggestions(res.data.slice(0, 5));
      setShowClientSuggestions(res.data.length > 0);
    } catch (err) {
      console.error('Erro ao buscar clientes:', err);
      setClientSuggestions([]);
      setShowClientSuggestions(false);
    }
  };

  // Selecionar cliente da lista
  const selectClient = (client: any) => {
    const updateData = {
      customer_name: client.name,
      customer_document: client.document,
      customer_phone: client.phone,
      customer_zip_code: client.zip_code,
      customer_state: client.state,
      customer_city: client.city,
      customer_neighborhood: client.neighborhood,
      customer_street: client.street,
      customer_number: client.number,
    };
    
    setEntry((prev: any) => ({ ...prev, ...updateData }));
    handleUpdate(updateData);
    setShowClientSuggestions(false);
    setClientSuggestions([]);
  };

  // Handler para mudança no nome do cliente
  const handleClientNameChange = (value: string) => {
    handleUpdate({ customer_name: value });
    
    // Limpar timeout anterior
    if (clientSearchTimeout) {
      clearTimeout(clientSearchTimeout);
    }
    
    // Criar novo timeout para buscar após 500ms
    const timeout = setTimeout(() => {
      searchClients(value);
    }, 500);
    
    setClientSearchTimeout(timeout);
  };

  // Buscar endereço pelo CEP (ViaCEP)
  const handleCepLookup = async (cep: string) => {
    const cleaned = cep.replace(/\D/g, '');
    if (cleaned.length !== 8) return;
    setFipeLoading(true); // reuse as cep loading indicator
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
      const data = await res.json();
      if (!data.erro) {
        const updateData = {
          customer_zip_code: cep,
          customer_state: data.uf,
          customer_city: data.localidade,
          customer_neighborhood: data.bairro,
          customer_street: data.logradouro,
        };
        setEntry((prev: any) => ({ ...prev, ...updateData }));
        handleUpdate(updateData);
      }
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
    } finally {
      setFipeLoading(false);
    }
  };

  const handleFileSelect = (itemId: string) => {
    setActiveItemId(itemId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeItemId) return;

    try {
      setUploading(activeItemId);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;
        await api.patch(`/entries/public/${token}/items/${activeItemId}`, { image_url: base64 });
        
        // Update local state
        setEntry((prev: any) => ({
          ...prev,
          items: prev.items.map((it: any) => it.id === activeItemId ? { ...it, image_url: base64 } : it)
        }));
        setUploading(null);
      };
    } catch (err) {
      console.error(err);
      setUploading(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-6 p-10">
       <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
       <div className="text-center space-y-2">
         <h2 className="text-xl font-black text-white italic tracking-tight">MECA<span className="text-indigo-500">ERP</span></h2>
         <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Sincronizando inspeção...</p>
       </div>
    </div>
  );

  if (!entry) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10 text-center space-y-6">
       <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center">
          <AlertCircle size={40} />
       </div>
       <div className="space-y-2">
         <h1 className="text-2xl font-black text-slate-900 tracking-tight italic">LINK <span className="text-rose-500">EXPIRADO</span></h1>
         <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xs mx-auto">
            Este link de acesso seguro expirou. Peça ao consultor para gerar um novo QR Code.
         </p>
       </div>
    </div>
  );

  const totalSteps = 5;

  return (
    <div className="min-h-screen bg-slate-50 relative font-sans pb-32">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />
      
      <header className="sticky top-0 z-50 bg-slate-900 text-white px-6 py-8 rounded-b-[40px] shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative flex items-center justify-between">
           <div className="flex flex-col">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">MecaERP ENTRY</span>
              <h1 className="text-2xl font-black tracking-tighter italic">CHECKLIST <span className="text-indigo-400">INICIAL</span></h1>
           </div>
           <div className="flex flex-col items-end">
              <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Passo</div>
              <div className="text-xl font-black text-indigo-400">{step}<span className="text-white/20 text-sm ml-1">/ {totalSteps}</span></div>
           </div>
        </div>
      </header>

      <div className="px-6 -mt-4">
        <div className="w-full h-1.5 bg-slate-200 rounded-full mb-8 overflow-hidden shadow-inner">
           <motion.div 
             animate={{ width: `${(step / totalSteps) * 100}%` }}
             className="h-full bg-indigo-500"
           />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
                    <User size={20} />
                 </div>
                 <h2 className="text-xl font-black text-slate-800 tracking-tight italic">QUEM <span className="text-indigo-600">REGISTRA?</span></h2>
              </div>
              <div className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100 space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Seu Nome</label>
                  <input type="text" value={entry.responsible_name || ''} onChange={(e) => handleUpdate({ responsible_name: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[24px]" />
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <input type="checkbox" id="towmob" checked={entry.arrived_by_tow_truck} onChange={(e) => handleUpdate({ arrived_by_tow_truck: e.target.checked })} className="w-5 h-5" />
                  <label htmlFor="towmob" className="text-sm font-bold">Chegou de Guincho?</label>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
                    <User size={20} />
                 </div>
                 <h2 className="text-xl font-black text-slate-800 tracking-tight italic">DADOS DO <span className="text-indigo-600">CLIENTE</span></h2>
              </div>
              <div className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100 space-y-5">
                <div className="relative" ref={clientInputRef}>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nome Completo</label>
                  <input 
                    type="text" 
                    value={entry.customer_name || ''} 
                    onChange={(e) => handleClientNameChange(e.target.value)}
                    placeholder="Digite seu nome..."
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl" 
                  />
                  {showClientSuggestions && clientSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                      {clientSuggestions.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => selectClient(client)}
                          className="w-full px-5 py-3 text-left hover:bg-indigo-50 border-b border-slate-100 last:border-b-0 transition-colors"
                        >
                          <div className="text-sm font-bold text-slate-900">{client.name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                            {client.document && <span>{client.document}</span>}
                            {client.phone && <span>{client.phone}</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Telefone</label>
                  <input type="text" value={entry.customer_phone || ''} onChange={(e) => handleUpdate({ customer_phone: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl" />
                </div>

                {/* ── ENDEREÇO ── */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin size={14} className="text-indigo-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Endereço</span>
                  </div>
                  <div className="space-y-4">
                    {/* CEP com lookup automático */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">CEP</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={entry.customer_zip_code || ''}
                          onChange={(e) => setEntry((prev: any) => ({ ...prev, customer_zip_code: e.target.value }))}
                          onBlur={(e) => handleCepLookup(e.target.value)}
                          placeholder="00000-000"
                          maxLength={9}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl pr-14"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          {fipeLoading ? <Loader size={16} className="animate-spin text-indigo-400" /> : <Search size={16} className="text-slate-300" />}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">UF</label>
                        <input type="text" value={entry.customer_state || ''} onChange={(e) => handleUpdate({ customer_state: e.target.value.toUpperCase() })} maxLength={2} placeholder="SP" className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-center font-bold uppercase" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cidade</label>
                        <input type="text" value={entry.customer_city || ''} onChange={(e) => handleUpdate({ customer_city: e.target.value })} placeholder="Sua cidade" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Bairro</label>
                      <input type="text" value={entry.customer_neighborhood || ''} onChange={(e) => handleUpdate({ customer_neighborhood: e.target.value })} placeholder="Seu bairro" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Rua / Avenida</label>
                        <input type="text" value={entry.customer_street || ''} onChange={(e) => handleUpdate({ customer_street: e.target.value })} placeholder="Nome da rua" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nº</label>
                        <input type="text" value={entry.customer_number || ''} onChange={(e) => handleUpdate({ customer_number: e.target.value })} placeholder="000" className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-center font-bold" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
                    <Car size={20} />
                 </div>
                 <h2 className="text-xl font-black text-slate-800 tracking-tight italic">DADOS DO <span className="text-indigo-600">VEÍCULO</span></h2>
              </div>
              <div className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100 space-y-6">
                {/* Placa com busca automática */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Placa</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={entry.vehicle_plate || ''}
                      onChange={(e) => setEntry((prev: any) => ({ ...prev, vehicle_plate: e.target.value.toUpperCase() }))}
                      onBlur={(e) => {
                        handleUpdate({ vehicle_plate: e.target.value.toUpperCase() });
                      }}
                      placeholder="ABC-1234"
                      maxLength={8}
                      className="w-full px-5 py-5 bg-slate-900 text-white rounded-2xl text-center text-2xl font-black tracking-widest uppercase pr-16"
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2">
                      {fipeLoading
                        ? <Loader size={18} className="animate-spin text-indigo-400" />
                        : <Search size={18} className="text-white/30" />}
                    </div>
                  </div>
                  {fipeLoading && (
                    <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-2 text-center animate-pulse">Buscando dados do veículo...</p>
                  )}
                </div>

                {/* Dados vindos do sistema (editáveis) */}
                {(entry.vehicle_brand || entry.vehicle_model) && (
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle size={14} className="text-indigo-500" />
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Dados encontrados — você pode editar</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Marca</label>
                        <input type="text" value={entry.vehicle_brand || ''} onChange={(e) => handleUpdate({ vehicle_brand: e.target.value })} className="w-full px-4 py-3 bg-white border border-indigo-100 rounded-xl text-sm font-bold" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Modelo</label>
                        <input type="text" value={entry.vehicle_model || ''} onChange={(e) => handleUpdate({ vehicle_model: e.target.value })} className="w-full px-4 py-3 bg-white border border-indigo-100 rounded-xl text-sm font-bold" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ano</label>
                        <input type="text" value={entry.vehicle_year || ''} onChange={(e) => handleUpdate({ vehicle_year: e.target.value })} className="w-full px-4 py-3 bg-white border border-indigo-100 rounded-xl text-sm font-bold" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cor</label>
                        <input type="text" value={entry.vehicle_color || ''} onChange={(e) => handleUpdate({ vehicle_color: e.target.value })} className="w-full px-4 py-3 bg-white border border-indigo-100 rounded-xl text-sm font-bold" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Combustível</h3>
                   <FuelLevel value={entry.fuel_level || 'EMPTY'} onChange={(v) => handleUpdate({ fuel_level: v })} />
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
                    <Camera size={20} />
                 </div>
                 <h2 className="text-xl font-black text-slate-800 tracking-tight italic">FOTOS <span className="text-indigo-600">VEÍCULO</span></h2>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {entry.items?.map((item: any) => (
                  <button key={item.id} onClick={() => handleFileSelect(item.id)} className={`p-6 rounded-[32px] border-2 border-dashed flex items-center gap-4 ${item.image_url ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                    {item.image_url ? <img src={item.image_url} className="w-16 h-16 rounded-xl object-cover" /> : <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center">{uploading === item.id ? <Loader className="animate-spin" /> : <Camera />}</div>}
                    <div className="text-left"><p className="text-xs font-black uppercase">{item.item}</p><p className="text-[10px] text-slate-400">{item.image_url ? 'OK' : 'Pendente'}</p></div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div 
              key="step5"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
                    <ShieldCheck size={20} />
                 </div>
                 <h2 className="text-xl font-black text-slate-800 tracking-tight italic">FINALIZAR <span className="text-indigo-600">ENTRADA</span></h2>
              </div>
              <div className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100 space-y-6">
                 <textarea value={entry.requested_service || ''} onChange={(e) => handleUpdate({ requested_service: e.target.value })} placeholder="O que o cliente relatou?" className="w-full p-4 bg-slate-50 rounded-2xl min-h-[150px]" />
                 <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <input type="checkbox" checked={entry.photos_confirmed} onChange={(e) => handleUpdate({ photos_confirmed: e.target.checked })} className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase text-amber-900">Confirmo que as fotos estão ok</span>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-slate-50/80 backdrop-blur-xl p-6 border-t border-slate-200 flex items-center gap-4 z-50">
         {step > 1 && <button onClick={() => setStep(s => s - 1)} className="w-16 h-16 bg-white border border-slate-200 rounded-[24px] flex items-center justify-center text-slate-600"><ChevronLeft size={24} /></button>}
         {step < totalSteps ? (
           <button onClick={() => setStep(s => s + 1)} className="flex-1 h-16 bg-indigo-600 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-2">Continuar <ChevronRight size={20} /></button>
         ) : (
           <button onClick={() => { handleUpdate({ status: 'COMPLETED' }); alert('Finalizado!'); }} className="flex-1 h-16 bg-emerald-600 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-xl shadow-emerald-200">Finalizar <Send size={20} /></button>
         )}
      </div>
    </div>
  );
}
