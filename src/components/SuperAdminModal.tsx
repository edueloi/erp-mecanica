
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Users, Phone, FileText, Mail, Lock, Shield, User, Eye, EyeOff, DollarSign, Calendar, Package, MapPin, Edit2, Upload, Trash2, Key, UserCircle } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadPlans();
    }
  }, [isOpen]);

  const loadPlans = async () => {
    try {
      const res = await api.get("/superadmin/plans");
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, logo_url: reader.result as string });
      };
      reader.readAsDataURL(file);
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
                    {editingTenant ? 'Configurar Oficina' : 'Nova Oficina'}
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
            <form onSubmit={onSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-8">
              {/* Logo Section */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Upload size={12} className="text-blue-500" /> Identidade Visual
                </h4>
                
                <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="relative group">
                    <div className="w-20 h-20 bg-white rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
                      {form.logo_url ? (
                        <img src={form.logo_url} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                      ) : (
                        <Building2 size={28} className="text-slate-300" />
                      )}
                    </div>
                    {form.logo_url && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, logo_url: "" })}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-bold text-slate-700 leading-none">Logo da Oficina</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 mt-2"
                    >
                      <Upload size={14} /> Selecionar Foto
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </div>
                </div>
              </div>

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
                        {plans.map(p => (
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
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
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

              {/* Admin Info */}
              <div className="space-y-4 pt-4 border-t border-slate-50">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <User size={12} className={editingTenant ? "text-amber-500" : "text-purple-500"} /> 
                  {editingTenant ? "Administrador da Oficina" : "Administrador Inicial"}
                </h4>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="relative group">
                      <div className="w-16 h-16 bg-white rounded-full border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
                        {form.admin_photo ? (
                          <img src={form.admin_photo} alt="Admin Preview" className="w-full h-full object-cover" />
                        ) : (
                          <UserCircle className="text-slate-300" size={32} />
                        )}
                      </div>
                      {form.admin_photo && (
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, admin_photo: "" })}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-700 mb-2">Foto do Administrador</p>
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e: any) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setForm({ ...form, admin_photo: reader.result as string });
                              };
                              reader.readAsDataURL(file);
                            }
                          };
                          input.click();
                        }}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10px] font-black hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 uppercase"
                      >
                        <Upload size={12} /> Alterar Foto
                      </button>
                    </div>
                  </div>

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
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
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
                          className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">
                        {editingTenant ? "Nova Senha (deixe em branco para manter)" : "Senha de Acesso"}
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          required={!editingTenant}
                          type={showPassword ? "text" : "password"}
                          value={form.admin_password}
                          onChange={(e) => setForm({...form, admin_password: e.target.value})}
                          placeholder={editingTenant ? "••••••••" : "Defina a senha"}
                          className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
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

              {/* Workshop Data */}
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
            </form>

            <div className="p-4 sm:p-6 border-t border-slate-100 flex flex-col sm:items-center sm:flex-row gap-2 sm:gap-3 bg-white sticky bottom-0">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:flex-1 h-12 bg-slate-50 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all border border-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={onSubmit}
                disabled={saving}
                className={cn(
                  "w-full sm:flex-[2] h-12 text-white rounded-xl font-bold text-sm shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2",
                  editingTenant 
                    ? "bg-amber-600 shadow-amber-600/20 hover:bg-amber-700" 
                    : "bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700"
                )}
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {editingTenant ? 'Salvar Configurações' : 'Finalizar Cadastro'}
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
