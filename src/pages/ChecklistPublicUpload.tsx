import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Camera, CheckCircle2, Loader, AlertCircle, Image as ImageIcon, ArrowLeft, Send, CheckCircle, ShieldCheck, Smartphone, Info } from 'lucide-react';
import api from '../services/api';
import { motion, AnimatePresence } from 'motion/react';

interface ChecklistItem {
  id: string;
  category: string;
  item: string;
  status: string;
  image_url: string | null;
}

interface Checklist {
  id: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_plate?: string;
  items: ChecklistItem[];
}

export default function ChecklistPublicUpload() {
  const { token } = useParams<{ token: string }>();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedItemIdRef = useRef<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get(`/checklists/public/${token}`);
      setChecklist(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFileSelect = (itemId: string) => {
    selectedItemIdRef.current = itemId;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const itemId = selectedItemIdRef.current;
    if (!file || !itemId || !checklist) return;

    setUploading(itemId);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        await api.patch(`/checklists/public/${token}/items/${itemId}`, { image_url: base64 });
        setChecklist(prev => prev ? {
          ...prev,
          items: prev.items.map(i => i.id === itemId ? { ...i, image_url: base64 } : i)
        } : null);
      } catch (err) {
        alert('Erro ao enviar foto. Tente novamente.');
      } finally {
        setUploading(null);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <Loader className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Aguarde um momento</p>
        <p className="text-slate-900 font-black text-xl mt-1">Carregando Inspeção...</p>
      </motion.div>
    </div>
  );

  if (!checklist) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-6">
        <AlertCircle size={40} />
      </div>
      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Opa! Link Expirado</h2>
      <p className="text-slate-500 mt-3 leading-relaxed">Não conseguimos encontrar este checklist. Peça ao consultor para gerar um novo QR Code.</p>
    </div>
  );

  if (success) return (
    <div className="min-h-screen bg-emerald-600 flex flex-col items-center justify-center p-8 text-center text-white">
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-8 backdrop-blur-md">
          <CheckCircle size={48} className="text-white" />
        </div>
        <h2 className="text-3xl font-black tracking-tighter">Fotos Enviadas!</h2>
        <p className="text-emerald-100 mt-4 text-lg font-medium opacity-90">O checklist foi atualizado no sistema da oficina com sucesso.</p>
        <button 
          onClick={() => setSuccess(false)}
          className="mt-12 bg-white text-emerald-700 h-14 px-8 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-black/10"
        >
          Voltar para fotos
        </button>
      </motion.div>
    </div>
  );

  const categories = [...new Set(checklist.items.map(i => i.category))];

  return (
    <div className="min-h-screen bg-slate-50 relative font-sans">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />
      
      <header className="sticky top-0 z-50 bg-slate-900 text-white px-6 py-6 rounded-b-[40px] shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
        <div className="relative flex items-center justify-between">
           <div className="flex flex-col">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">MecaERP INSPECTION</span>
              <h1 className="text-2xl font-black tracking-tighter italic">REGISTRO <span className="text-emerald-400">FOTOGRÁFICO</span></h1>
           </div>
           <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
              <ShieldCheck size={24} className="text-emerald-400" />
           </div>
        </div>
      </header>

      <div className="px-5 -mt-4 pb-32">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100 mb-8">
           <div className="flex items-center gap-5">
              <div className="flex flex-col items-center">
                <div className="w-16 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-mono font-black text-lg border-2 border-slate-800 shadow-lg">
                   {checklist.vehicle_plate?.toUpperCase() || '---'}
                </div>
              </div>
              <div className="flex-1 border-l border-slate-100 pl-5">
                <h3 className="text-xl font-black text-slate-900 leading-tight">{checklist.vehicle_brand}</h3>
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-0.5">{checklist.vehicle_model}</p>
              </div>
           </div>
        </motion.div>

        {categories.map((cat, catIdx) => (
          <section key={cat} className="mb-10">
            <div className="flex items-center gap-2 px-2 mb-4">
               {cat === 'Fotos do Veículo' ? <Camera className="text-emerald-500" size={16} /> : <ImageIcon className="text-slate-400" size={16} />}
               <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{cat}</h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {checklist.items.filter(i => i.category === cat).map((item) => (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleFileSelect(item.id)}
                  className={`relative h-44 rounded-[40px] border-2 border-dashed transition-all overflow-hidden flex flex-col items-center justify-center gap-3 ${
                    item.image_url 
                      ? 'border-emerald-500 bg-white shadow-lg shadow-emerald-50' 
                      : 'border-slate-200 bg-white text-slate-400 shadow-sm active:border-indigo-400'
                  }`}
                >
                  {item.image_url ? (
                    <>
                      <img src={item.image_url} alt={item.item} className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-emerald-900/40 backdrop-blur-[1px] flex items-center justify-center">
                         <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-2xl">
                            <CheckCircle2 size={24} className="text-emerald-500" />
                         </div>
                      </div>
                      <div className="absolute bottom-4 left-0 right-0 px-4">
                         <span className="bg-white/90 backdrop-blur-md text-slate-900 text-[9px] font-black uppercase px-3 py-1.5 rounded-full shadow-sm block w-fit mx-auto truncate max-w-full">
                           {item.item}
                         </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-1">
                        {uploading === item.id ? <Loader className="animate-spin text-indigo-500" size={24} /> : <Camera size={24} />}
                      </div>
                      <span className="text-[10px] font-black uppercase text-center px-4 leading-tight text-slate-500 italic tracking-wider">
                        {item.item}
                      </span>
                    </>
                  )}
                </motion.button>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Bottom Floating Action */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent z-40">
         <motion.button 
          whileTap={{ scale: 0.97 }}
          onClick={() => setSuccess(true)}
          className="w-full h-18 bg-emerald-600 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl shadow-emerald-200 border-b-4 border-emerald-800"
         >
           <Send size={20} />
           FINALIZAR ENVIO
         </motion.button>
      </div>

      {/* Background Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-screen pointer-events-none -z-10 opacity-30 overflow-hidden">
         <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-200 rounded-full blur-[100px]" />
         <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-emerald-100 rounded-full blur-[100px]" />
      </div>
    </div>
  );
}
