import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  ClipboardCheck, 
  Car, 
  User, 
  Calendar, 
  Clock, 
  ChevronRight, 
  Filter,
  MoreVertical,
  Trash2,
  FileText,
  Smartphone
} from 'lucide-react';
import api from '../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

export default function VehicleEntries() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const res = await api.get('/entries');
      setEntries(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await api.post('/entries', {});
      navigate(`/vehicle-entries/${res.data.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredEntries = entries.filter(e => 
    e.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.vehicle_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.responsible_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">
            CHECKLIST <span className="text-indigo-600">INICIAL</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">Gestão de entradas e inspeção de chegada de veículos.</p>
        </div>
        <button 
          onClick={handleCreate}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95"
        >
          <Plus size={20} /> Nova Entrada
        </button>
      </header>

      <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por placa, cliente ou responsável..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
            <Filter size={18} /> Filtros
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Data / Hora</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Veículo</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cliente</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Responsável</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                       <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                       <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Carregando Entradas...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 grayscale opacity-40">
                       <ClipboardCheck size={64} />
                       <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Nenhuma entrada encontrada</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr 
                    key={entry.id} 
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/vehicle-entries/${entry.id}`)}
                  >
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{entry.entry_date ? format(new Date(entry.entry_date), 'dd/MM/yyyy') : format(new Date(entry.created_at), 'dd/MM/yyyy')}</span>
                        <span className="text-[10px] text-slate-400 font-black uppercase">{entry.entry_time || format(new Date(entry.created_at), 'HH:mm')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3 text-sm font-bold text-slate-900 capitalize">
                         <div className="w-12 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-mono text-xs shadow-sm">
                            {entry.vehicle_plate?.toUpperCase() || '---'}
                         </div>
                         <div className="flex flex-col">
                            <span>{entry.vehicle_brand || '---'}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">{entry.vehicle_model || '---'}</span>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-slate-700">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-slate-300" />
                        {entry.customer_name || '---'}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        entry.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {entry.status === 'COMPLETED' ? 'Finalizado' : 'Rascunho'}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-slate-600">
                      {entry.responsible_name || '---'}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right">
                      <button className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100 shadow-sm">
                        <ChevronRight size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
