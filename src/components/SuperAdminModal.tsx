import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Users, Phone, FileText, Mail, Lock, Shield, User, Eye, EyeOff, DollarSign, Calendar, Package, MapPin, Edit2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { maskPhone, maskDocument } from '../utils/maskUtils';
import api from '../services/api';

function cn(...inputs: any[]) {
  return twMerge(inputs.filter(Boolean).map(i => typeof i === 'object' ? Object.keys(i).filter(k => i[k]).join(' ') : i).join(' '));
}

interface SuperAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTenant: any | null;
  form: any;
  setForm: (form: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
}

export default function SuperAdminModal({
  isOpen,
  onClose,
  editingTenant,
  form,
  setForm,
  onSubmit,
  saving
}: SuperAdminModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadPlans();
    }
  }, [isOpen]);

  const loadPlans = async () => {
    try {
      const res = await api.get("/superadmin/plans");
      // Ensure we always have an array
      setPlans(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error loading plans:", err);
      setPlans([]);
    }
  };

  const handlePlanChange = (planId: string) => {
    const selectedPlan = plans.find(p => p.id === planId);
    if (selectedPlan) {
      setForm({
        ...form,
        plan_id: planId,
        user_limit: selectedPlan.user_limit,
        subscription_value: selectedPlan.monthly_value
      });
    } else {
      setForm({ ...form, plan_id: "" });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
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
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  editingTenant ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                )}>
                  {editingTenant ? <Edit2 size={20} /> : <Building2 size={20} />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingTenant ? 'Editar Oficina' : 'Nova Oficina'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {editingTenant ? `Editando: ${editingTenant.name}` : 'Cadastre uma nova oficina no sistema'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={onSubmit} className="overflow-y-auto p-6 space-y-8">
              {/* Plan & Billing */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Package size={12} className="text-emerald-500" /> Plano e Faturamento
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Vincular a um Plano</label>
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <select
                        value={form.plan_id || ""}
                        onChange={(e) => handlePlanChange(e.target.value)}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all appearance-none"
                      >
                        <option value="">Personalizado (Sem plano fixo)</option>
                        {Array.isArray(plans) && plans.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} - R$ {p.monthly_value.toLocaleString('pt-BR')} ({p.user_limit} users)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Mensalidade (R$)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="number"
                        step="0.01"
                        value={form.subscription_value}
                        onChange={(e) => setForm({...form, subscription_value: parseFloat(e.target.value)})}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Dia do Vencimento</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={form.due_day}
                        onChange={(e) => setForm({...form, due_day: parseInt(e.target.value)})}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 ml-1">Limite de Usuários</label>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-black">
                      {form.user_limit} USUÁRIOS
                    </span>
                  </div>
                  <div className="px-2">
                    <input 
                      type="range"
                      min="1"
                      max="100"
                      value={form.user_limit}
                      onChange={(e) => setForm({...form, user_limit: parseInt(e.target.value)})}
                      className="w-full accent-emerald-600 h-2 bg-slate-100 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Workshop Data - Always editable */}
              <div className="space-y-4 pt-4 border-t border-slate-50">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Building2 size={12} className="text-blue-500" /> Dados da Oficina
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Nome Fantasia</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        required
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({...form, name: e.target.value})}
                        placeholder="Nome da Oficina"
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">CNPJ / CPF</label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          value={form.document}
                          onChange={(e) => setForm({...form, document: maskDocument(e.target.value)})}
                          placeholder="00.000.000/0000-00"
                          className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Telefone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          value={form.phone}
                          onChange={(e) => setForm({...form, phone: maskPhone(e.target.value)})}
                          placeholder="(00) 00000-0000"
                          className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Endereço Completo</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        value={form.address}
                        onChange={(e) => setForm({...form, address: e.target.value})}
                        placeholder="Rua, Número, Bairro, Cidade - UF"
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Initial Admin - Only for new registrations */}
              {!editingTenant && (
                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <User size={12} className="text-purple-500" /> Administrador Inicial
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Nome do Responsável</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          required
                          type="text"
                          value={form.admin_name}
                          onChange={(e) => setForm({...form, admin_name: e.target.value})}
                          placeholder="Nome do Admin"
                          className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">E-mail de Acesso</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input
                            required
                            type="email"
                            value={form.admin_email}
                            onChange={(e) => setForm({...form, admin_email: e.target.value})}
                            placeholder="admin@email.com"
                            className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Senha Provisória</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input
                            required
                            type={showPassword ? "text" : "password"}
                            value={form.admin_password}
                            onChange={(e) => setForm({...form, admin_password: e.target.value})}
                            placeholder="••••••••"
                            className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 text-sm font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 flex items-center gap-3 bg-white sticky bottom-0">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-12 bg-slate-50 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all border border-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={onSubmit}
                disabled={saving}
                className={cn(
                  "flex-[2] h-12 text-white rounded-xl font-bold text-sm shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2",
                  editingTenant 
                    ? "bg-amber-600 shadow-amber-600/20 hover:bg-amber-700" 
                    : "bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700"
                )}
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {editingTenant ? 'Salvar Alterações' : 'Finalizar Cadastro'}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
