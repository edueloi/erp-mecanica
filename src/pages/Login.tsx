import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../services/authStore';
import api from '../services/api';
import { motion } from 'motion/react';
import { 
  LogIn, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  Zap, 
  BarChart3, 
  Clock, 
  AlertCircle, 
  CreditCard, 
  Cloud,
  ShieldCheck
} from 'lucide-react';

// Importando as imagens
import logoMecaerp from '../image/logo-system/logo-mecaerp.png';
import mecaerpSystem from '../image/logo-system/mecaerp-system.png';

// Utility for cleaner class names
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.user, res.data.token);
      if (res.data.user.role === 'SUPER_ADMIN') {
        navigate('/superadmin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'E-mail ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex bg-white font-sans antialiased text-slate-900 overflow-hidden">
      {/* Lado Esquerdo - Formulário */}
      <div className="w-full lg:w-[400px] xl:w-[480px] bg-white flex flex-col justify-center relative z-20 shadow-[20px_0_50px_rgba(0,0,0,0.03)] shrink-0 overflow-y-auto px-6 sm:px-10 py-8 custom-scrollbar">
        <div className="w-full max-w-sm mx-auto my-auto">
          {/* Logo e Título - Espaçamento Reduzido */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8 xl:mb-12"
          >
            <div className="inline-block p-2 group hover:scale-105 transition-transform duration-300">
              <img src={logoMecaerp} alt="MecaERP" className="h-16 sm:h-20 xl:h-28 w-auto object-contain" />
            </div>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 xl:space-y-5">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 rounded-xl text-[10px] sm:text-xs font-bold flex items-center gap-2 border bg-red-50 text-red-700 border-red-100"
              >
                <AlertCircle size={14} />
                {error}
              </motion.div>
            )}

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                E-mail Profissional
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={16} />
                <input 
                  type="email" 
                  required 
                  placeholder="exemplo@mecaerp.com"
                  className="w-full h-10 sm:h-11 xl:h-12 bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 text-xs sm:text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between px-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Senha de Acesso
                </label>
                <button type="button" className="text-[9px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider transition-colors">
                  Esqueceu?
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={16} />
                <input 
                  type={showPassword ? "text" : "password"}
                  required 
                  placeholder="••••••••"
                  className="w-full h-10 sm:h-11 xl:h-12 bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-12 text-xs sm:text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-11 sm:h-12 xl:h-14 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-emerald-600/20 text-[10px] sm:text-[11px] xl:text-xs uppercase tracking-widest mt-4 xl:mt-8"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn size={18} />
                  Acessar Painel
                </>
              )}
            </button>
          </form>

          {/* Rodapé fixo - Removido o toggle de registro */}
          <div className="mt-8 pt-8 border-t border-slate-50 text-center">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
              MecaERP © 2026 • Premium Auto Management
            </p>
          </div>
        </div>
      </div>

      {/* Lado Direito - Arte (Verde Esmeralda) */}
      <div className="hidden lg:flex flex-1 bg-emerald-950 items-center justify-center p-6 xl:p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(16,185,129,0.25),_transparent_50%),radial-gradient(circle_at_70%_80%,_rgba(5,150,105,0.2),_transparent_50%)]"></div>
        
        <div className="relative z-10 w-full max-w-4xl flex flex-col h-full max-h-[85vh] justify-between">
          {/* Header Tag */}
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-[8px] xl:text-[10px] font-black text-emerald-100 uppercase tracking-[0.2em]">Enterprise System v4.0</span>
            </div>
          </div>

          {/* Screenshot Container */}
          <div className="relative flex-1 flex items-center justify-center py-4 xl:py-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="relative w-full max-w-[650px] aspect-[16/10] bg-white/10 rounded-[2rem] xl:rounded-[3rem] p-2 xl:p-4 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/20 backdrop-blur-sm"
            >
              <div className="w-full h-full bg-slate-900 rounded-[1.5rem] xl:rounded-[2rem] overflow-hidden border border-white/10 relative shadow-inner">
                <img 
                  src={mecaerpSystem} 
                  alt="Preview" 
                  className="w-full h-full object-contain p-2 xl:p-4" 
                />
              </div>
              
              {/* Widgets Flutuantes */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-4 xl:-left-8 top-1/4 p-3 xl:p-5 bg-white rounded-[1.5rem] xl:rounded-[2rem] shadow-2xl flex items-center gap-3 border border-slate-100 hidden xl:flex"
              >
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg"><Zap size={20} /></div>
                <div className="pr-4">
                  <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Status</p>
                  <p className="text-xs font-black text-slate-900 leading-none">Agilidade</p>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -right-4 xl:-right-10 bottom-1/4 p-3 xl:p-5 bg-white rounded-[1.5rem] xl:rounded-[2rem] shadow-2xl flex items-center gap-3 border border-slate-100 hidden xl:flex"
              >
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg"><BarChart3 size={20} /></div>
                <div className="pr-4">
                  <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Lucro</p>
                  <p className="text-xs font-black text-slate-900 leading-none">Crescente</p>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Feature Highlight */}
          <div className="grid grid-cols-3 gap-2 xl:gap-8 pt-4 border-t border-white/10">
            {[
              { label: 'Gestão', desc: 'OS Ágil', icon: Clock },
              { label: 'Finanças', desc: 'Fluxo Real', icon: CreditCard },
              { label: 'Cloud', desc: 'Acesso 24/7', icon: Cloud }
            ].map((f, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-400">
                  <f.icon size={14} />
                  <span className="text-[8px] xl:text-[9px] font-black uppercase tracking-widest">{f.label}</span>
                </div>
                <p className="text-[10px] xl:text-xs font-bold text-emerald-50/70 leading-tight">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
