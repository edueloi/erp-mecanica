import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Camera, CheckCircle2, Loader, AlertCircle, Image as ImageIcon, ArrowLeft, Send } from 'lucide-react';
import axios from 'axios';
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
  const { id } = useParams<{ id: string }>();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedItemIdRef = useRef<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`/api/checklists/public/${id}`);
      setChecklist(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

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
        await axios.patch(`/api/checklists/public/${checklist.id}/items/${itemId}`, { image_url: base64 });
        setChecklist(prev => prev ? {
          ...prev,
          items: prev.items.map(i => i.id === itemId ? { ...i, image_url: base64 } : i)
        } : null);
      } catch (err) {
        alert('Erro ao enviar foto');
      } finally {
        setUploading(null);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <Loader className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
      <p className="text-slate-500 font-medium">Carregando checklist...</p>
    </div>
  );

  if (!checklist) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
      <h2 className="text-xl font-bold text-slate-900">Checklist não encontrado</h2>
      <p className="text-slate-500 mt-2">O link pode estar expirado ou incorreto.</p>
    </div>
  );

  // Group items with "Attention" or "Critical" status first
  const priorityItems = checklist.items.filter(i => (i.status === 'ATTENTION' || i.status === 'CRITICAL') && i.category !== 'Fotos do Veículo');
  const otherItems = checklist.items.filter(i => i.status !== 'ATTENTION' && i.status !== 'CRITICAL' && i.category !== 'Fotos do Veículo');

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />
      
      {/* Header */}
      <div className="bg-slate-900 text-white px-6 py-8 rounded-b-[40px] shadow-xl">
        <h1 className="text-2xl font-black italic tracking-tighter mb-2">Meca<span className="text-emerald-400">ERP</span></h1>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Anexar Fotos</h2>
            <p className="text-slate-400 text-xs">Checklist de inspeção técnica</p>
          </div>
          <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
            <span className="text-[10px] font-black text-emerald-400 block uppercase">Status</span>
            <span className="text-xs font-bold uppercase tracking-wider">Em Aberto</span>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-6">
        <div className="bg-white p-5 rounded-3xl shadow-lg border border-slate-100 mb-8">
           <div className="flex items-center gap-4">
              <div className="w-14 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-mono font-black text-sm uppercase">
                {checklist.vehicle_plate || '---'}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900">{checklist.vehicle_brand} {checklist.vehicle_model}</h3>
                <p className="text-xs text-slate-500">Inspeção técnica ativa</p>
              </div>
           </div>
        </div>

        <section className="space-y-4 mb-8">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2">Fotos do Veículo</h4>
          <div className="grid grid-cols-2 gap-3">
            {checklist.items.filter(i => i.category === 'Fotos do Veículo').map(item => (
              <button
                key={item.id}
                onClick={() => handleFileSelect(item.id)}
                className={`relative h-32 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${
                  item.image_url 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-600' 
                    : 'border-slate-200 bg-white text-slate-400 hover:border-indigo-300'
                }`}
              >
                {item.image_url ? (
                  <>
                    <img src={item.image_url} alt={item.item} className="absolute inset-0 w-full h-full object-cover rounded-3xl opacity-40" />
                    <CheckCircle2 size={24} className="relative z-10" />
                    <span className="relative z-10 text-[10px] font-bold uppercase">{item.item}</span>
                  </>
                ) : (
                  <>
                    {uploading === item.id ? <Loader className="animate-spin" size={24} /> : <Camera size={24} />}
                    <span className="text-[10px] font-bold uppercase text-center px-2 leading-tight">{item.item}</span>
                  </>
                )}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Itens com Alerta</h4>
            <span className="bg-rose-100 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{priorityItems.length} Alertas</span>
          </div>

          <div className="grid gap-4">
            {priorityItems.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-dashed border-slate-200 text-center">
                 <CheckCircle2 className="mx-auto text-emerald-500 mb-3" size={32} />
                 <p className="text-sm font-bold text-slate-900">Nenhum problema detectado</p>
                 <p className="text-xs text-slate-500 mt-1">Todos os itens estão em perfeitas condições.</p>
              </div>
            ) : (
              priorityItems.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${item.status === 'CRITICAL' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                    {item.image_url ? <CheckCircle2 size={24} /> : <Camera size={24} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{item.item}</p>
                    <p className={`text-[10px] font-black uppercase mt-0.5 ${item.status === 'CRITICAL' ? 'text-rose-500' : 'text-amber-500'}`}>
                       {item.status === 'CRITICAL' ? '● Crítico' : '● Atenção'}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleFileSelect(item.id)}
                    className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${
                      item.image_url ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                    }`}
                  >
                    {uploading === item.id ? <Loader className="animate-spin" size={20} /> : <Camera size={20} />}
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between px-2 pt-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Todos os Itens</h4>
          </div>

          <div className="grid gap-3">
             {otherItems.slice(0, 10).map(item => (
               <div key={item.id} className="bg-white p-3.5 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600 truncate mr-4">{item.item}</span>
                  <button 
                    onClick={() => handleFileSelect(item.id)}
                    className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${
                      item.image_url ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Camera size={14} />
                  </button>
               </div>
             ))}
             {otherItems.length > 10 && (
               <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-2">+ {otherItems.length - 10} outros itens</p>
             )}
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent">
         <button 
          onClick={() => window.location.reload()}
          className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-2xl"
         >
           CONCLUIR ENVIO
         </button>
      </div>
    </div>
  );
}
