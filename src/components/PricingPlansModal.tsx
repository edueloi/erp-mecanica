import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Users, Calendar, Plus, Trash2, Edit2, CheckCircle, Package } from 'lucide-react';
import api from '../services/api';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(inputs.filter(Boolean).map(i => typeof i === 'object' ? Object.keys(i).filter(k => i[k]).join(' ') : i).join(' '));
}

interface PricingPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PricingPlansModal({ isOpen, onClose }: PricingPlansModalProps) {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowModalForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    user_limit: 5,
    monthly_value: 0,
    months_duration: 1
  });

  useEffect(() => {
    if (isOpen) loadPlans();
  }, [isOpen]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get("/superadmin/plans");
      // Ensure we always have an array
      setPlans(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error loading plans:", err);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingPlan) {
        await api.patch(`/superadmin/plans/${editingPlan.id}`, form);
      } else {
        await api.post("/superadmin/plans", form);
      }
      setShowModalForm(false);
      loadPlans();
    } catch (err) {
      console.error("Error saving plan:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Deseja excluir este plano?")) return;
    try {
      await api.delete(`/superadmin/plans/${id}`);
      loadPlans();
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro ao excluir plano");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Planos e Preços</h3>
                  <p className="text-xs text-slate-500 font-medium">Gerencie as tabelas de preços do sistema</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!showForm && (
                  <button
                    onClick={() => {
                      setEditingPlan(null);
                      setForm({ name: "", description: "", user_limit: 5, monthly_value: 0, months_duration: 1 });
                      setShowModalForm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                  >
                    <Plus size={14} /> Novo Plano
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {showForm ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                    <h4 className="text-sm font-bold text-slate-900">Configurações do Plano</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="col-span-full">
                        <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Nome do Plano</label>
                        <input
                          required
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm({...form, name: e.target.value})}
                          placeholder="Ex: Plano Trimestral - 10 Users"
                          className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Limite de Usuários</label>
                        <div className="relative">
                          <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input
                            required
                            type="number"
                            min="1"
                            value={form.user_limit}
                            onChange={(e) => setForm({...form, user_limit: parseInt(e.target.value)})}
                            className="w-full h-11 bg-white border border-slate-200 rounded-xl pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Valor Mensal (R$)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input
                            required
                            type="number"
                            step="0.01"
                            value={form.monthly_value}
                            onChange={(e) => setForm({...form, monthly_value: parseFloat(e.target.value)})}
                            className="w-full h-11 bg-white border border-slate-200 rounded-xl pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Duração (Meses)</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input
                            required
                            type="number"
                            min="1"
                            value={form.months_duration}
                            onChange={(e) => setForm({...form, months_duration: parseInt(e.target.value)})}
                            className="w-full h-11 bg-white border border-slate-200 rounded-xl pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowModalForm(false)}
                        className="flex-1 h-11 bg-white text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all border border-slate-200"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex-[2] h-11 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {saving ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <CheckCircle size={18} />
                            Salvar Plano
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {loading ? (
                    <div className="col-span-full py-20 text-center">
                      <div className="w-10 h-10 border-4 border-slate-100 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-slate-500 font-medium">Carregando planos...</p>
                    </div>
                  ) : Array.isArray(plans) && plans.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-slate-400 font-medium">
                      Nenhum plano cadastrado.
                    </div>
                  ) : (
                    Array.isArray(plans) && plans.map((p) => (
                      <div key={p.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-4 hover:bg-white hover:shadow-lg transition-all group border-l-4 border-l-emerald-500">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-slate-900">{p.name}</h4>
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-lg">
                              {p.months_duration === 1 ? 'Mensal' : `${p.months_duration} Meses`}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => {
                                setEditingPlan(p);
                                setForm({ ...p });
                                setShowModalForm(true);
                              }}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => handleDelete(p.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-slate-100">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Limite</span>
                            <span className="text-sm font-black text-slate-700 flex items-center gap-1">
                              <Users size={12} /> {p.user_limit}
                            </span>
                          </div>
                          <div className="flex flex-col items-end text-right">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Valor</span>
                            <span className="text-sm font-black text-emerald-600">
                              R$ {p.monthly_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={onClose}
                className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-md"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
