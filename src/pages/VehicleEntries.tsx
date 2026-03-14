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
  Trash2,
  FileText,
  Smartphone,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default function VehicleEntries() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [creating, setCreating] = useState(false);
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
    setCreating(true);
    try {
      const res = await api.post('/entries', {});
      navigate(`/vehicle-entries/${res.data.id}`);
    } catch (err: any) {
      console.error(err);
      alert('Erro ao criar entrada: ' + (err?.response?.data?.error || err.message));
    } finally {
      setCreating(false);
    }
  };

  const filteredEntries = entries.filter(e => {
    const matchSearch =
      e.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.vehicle_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.responsible_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === '' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Header - Compact */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-4 flex-1">
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Checklist de Entrada</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider whitespace-nowrap">Inspeção e recepção de veículos</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCreate}
            disabled={creating}
            className="h-9 px-4 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm whitespace-nowrap disabled:opacity-60"
          >
            {creating ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={16} />}
            Nova Entrada
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center gap-4 overflow-x-auto no-scrollbar shrink-0">
        <div className="relative flex-1 min-w-[200px] max-w-xs shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input 
            type="text" 
            placeholder="Buscar por placa, cliente ou responsável..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="h-4 w-px bg-slate-200 shrink-0" />
        <div className="flex items-center gap-2 shrink-0">
          <Filter size={14} className="text-slate-400" />
          <select
            className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">Todos Status</option>
            <option value="COMPLETED">Finalizado</option>
            <option value="DRAFT">Rascunho</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="sticky top-0 bg-slate-50 z-20 shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]">
            <tr>
              <th className="px-6 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data / Hora</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Veículo</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cliente</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Responsável</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fotos</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right sticky right-0 bg-slate-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)] z-20">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                  Carregando entradas...
                </td>
              </tr>
            ) : filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                  Nenhuma entrada encontrada.
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry) => (
                <tr
                  key={entry.id}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  onClick={() => navigate(`/vehicle-entries/${entry.id}`)}
                >
                  {/* Data / Hora */}
                  <td className="px-6 py-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900">
                        {entry.entry_date
                          ? format(new Date(entry.entry_date), 'dd/MM/yyyy')
                          : format(new Date(entry.created_at), 'dd/MM/yyyy')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {entry.entry_time || format(new Date(entry.created_at), 'HH:mm')}
                      </span>
                    </div>
                  </td>

                  {/* Veículo */}
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-1 rounded font-mono tracking-wider">
                        {entry.vehicle_plate?.toUpperCase() || '---'}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-900 truncate">{entry.vehicle_brand || '---'}</span>
                        <span className="text-[10px] text-slate-400 truncate">{entry.vehicle_model || '---'}</span>
                      </div>
                    </div>
                  </td>

                  {/* Cliente */}
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1.5">
                      <User size={12} className="text-slate-300 shrink-0" />
                      <span className="text-xs font-bold text-slate-700 truncate">
                        {entry.customer_name || '---'}
                      </span>
                    </div>
                  </td>

                  {/* Responsável */}
                  <td className="px-4 py-2">
                    <span className="text-xs text-slate-600">{entry.responsible_name || '---'}</span>
                  </td>

                  {/* Fotos */}
                  <td className="px-4 py-2">
                    {entry.items && entry.items.length > 0 ? (
                      <span className="text-xs font-bold text-slate-600">
                        {entry.items.filter((i: any) => i.image_url).length}
                        <span className="text-slate-400 font-normal">/{entry.items.length}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">---</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-2">
                    <span className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-tight',
                      entry.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        : 'bg-amber-50 text-amber-600 border-amber-100'
                    )}>
                      {entry.status === 'COMPLETED' ? 'Finalizado' : 'Rascunho'}
                    </span>
                  </td>

                  {/* Ações */}
                  <td className="px-6 py-2 text-right sticky right-0 bg-white group-hover:bg-slate-50 transition-colors shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.02)] z-10">
                    <div
                      className="flex items-center justify-end gap-1"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        onClick={() => navigate(`/vehicle-entries/${entry.id}`)}
                        className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded transition-all"
                        title="Ver Detalhes"
                      >
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
