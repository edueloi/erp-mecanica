import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Camera, CheckCircle2, ShieldCheck, Info, Loader, Smartphone, 
  User, Car, AlertCircle, Send, ChevronRight, ChevronLeft,
  Calendar, Clock, CheckCircle
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

  useEffect(() => {
    fetchEntry();
  }, [token]);

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
              <div className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100 space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nome Completo</label>
                  <input type="text" value={entry.customer_name || ''} onChange={(e) => handleUpdate({ customer_name: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Telefone</label>
                  <input type="text" value={entry.customer_phone || ''} onChange={(e) => handleUpdate({ customer_phone: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl" />
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
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Placa</label>
                  <input type="text" value={entry.vehicle_plate || ''} onChange={(e) => handleUpdate({ vehicle_plate: e.target.value.toUpperCase() })} className="w-full px-5 py-4 bg-slate-900 text-white rounded-2xl text-center text-2xl font-black tracking-widest uppercase" />
                </div>
                <div className="pt-4 border-t">
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
