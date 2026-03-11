import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../services/authStore';
import api from '../services/api';
import { motion } from 'motion/react';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  Zap, 
  BarChart3, 
  ShieldCheck, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';

// Importando as imagens
import logoMecaerp from '../image/logo-system/logo-mecaerp.png';
import mecaerpSystem from '../image/logo-system/mecaerp-system.png';

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
    <div className="h-screen w-full flex font-sans antialiased bg-slate-50 overflow-hidden">
      
      {/* LADO ESQUERDO - FORMULÁRIO */}
      <div className="w-full lg:w-[400px] xl:w-[460px] shrink-0 flex flex-col justify-center bg-white relative z-20 shadow-[20px_0_50px_rgba(0,0,0,0.05)] px-6 sm:px-10 h-full overflow-y-auto">
        
        {/* Formulário compacto para notebooks */}
        <div className="w-full max-w-[320px] mx-auto flex flex-col justify-center my-auto py-8">
          
          {/* Logo Centralizada */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10 flex justify-center"
          >
            <img 
              src={logoMecaerp} 
              alt="MecaERP" 
              className="h-12 sm:h-14 w-auto cursor-pointer hover:scale-105 transition-transform object-contain" 
              onClick={() => navigate('/')} 
            />
          </motion.div>

          {/* Formulário */}
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            onSubmit={handleSubmit} 
            className="space-y-5"
          >
            {/* Mensagem de Erro */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 rounded-xl text-sm font-bold flex items-center gap-2 border bg-red-50 text-red-600 border-red-100"
              >
                <AlertCircle size={18} className="shrink-0" />
                <span className="leading-tight">{error}</span>
              </motion.div>
            )}

            {/* Input E-mail */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-700">
                E-mail Profissional
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input 
                  type="email" 
                  required 
                  placeholder="exemplo@oficina.com.br"
                  className="w-full h-11 sm:h-12 bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all outline-none"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Input Senha */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-bold text-slate-700">
                  Senha
                </label>
                <button type="button" className="text-[12px] font-bold text-blue-600 hover:text-blue-700 transition-colors">
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input 
                  type={showPassword ? "text" : "password"}
                  required 
                  placeholder="••••••••"
                  className="w-full h-11 sm:h-12 bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-11 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all outline-none"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Botão de Login */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-11 sm:h-12 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30 text-[14px] group mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Entrar no Sistema
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </motion.form>

        </div>
      </div>

      {/* LADO DIREITO - ARTE / DASHBOARD */}
      <div className="hidden lg:flex flex-1 bg-[#0f172a] items-center justify-center relative p-6 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0f172a] to-blue-950"></div>
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 w-full max-w-3xl flex flex-col items-center justify-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-6"
          >
            <h2 className="text-2xl xl:text-3xl font-black text-white leading-tight mb-2 tracking-tight">
              Acelere seus resultados.
            </h2>
            <p className="text-[13px] xl:text-sm text-slate-400 font-medium max-w-md mx-auto">
              O ecossistema definitivo para donos de oficinas mecânicas.
            </p>
          </motion.div>

          {/* Mockup do Sistema ajustado para Notebooks (tamanho controlado) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, rotateX: 5 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            style={{ perspective: '1000px' }}
            className="relative w-full max-w-[500px] xl:max-w-[650px]"
          >
            <div className="rounded-xl xl:rounded-2xl p-1.5 xl:p-2.5 bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
              <div className="rounded-lg xl:rounded-xl overflow-hidden bg-slate-800 border border-white/10 relative shadow-inner">
                {/* Imitação da barra do navegador/app */}
                <div className="h-5 xl:h-6 bg-slate-900/80 flex items-center px-3 gap-1.5 border-b border-white/5">
                   <div className="w-2 h-2 rounded-full bg-red-500/80"></div>
                   <div className="w-2 h-2 rounded-full bg-amber-500/80"></div>
                   <div className="w-2 h-2 rounded-full bg-emerald-500/80"></div>
                </div>
                <img 
                  src={mecaerpSystem} 
                  alt="Preview do MecaERP" 
                  className="w-full max-h-[45vh] object-cover object-top opacity-90 hover:opacity-100 transition-opacity duration-500" 
                />
              </div>
            </div>

            {/* Float Badges Menores e Ajustados */}
            <motion.div 
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-3 xl:-right-6 top-8 bg-white/10 backdrop-blur-md border border-white/20 p-2.5 xl:p-3 rounded-xl shadow-xl flex items-center gap-2.5"
            >
              <div className="w-8 h-8 xl:w-9 xl:h-9 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                <ShieldCheck size={16} />
              </div>
              <div className="hidden sm:block">
                <p className="text-[9px] font-bold text-slate-300 uppercase leading-none mb-0.5">Segurança</p>
                <p className="text-[11px] font-black text-white leading-none">Nuvem AWS</p>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -left-3 xl:-left-6 bottom-8 bg-white/10 backdrop-blur-md border border-white/20 p-2.5 xl:p-3 rounded-xl shadow-xl flex items-center gap-2.5"
            >
              <div className="w-8 h-8 xl:w-9 xl:h-9 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
                <BarChart3 size={16} />
              </div>
              <div className="hidden sm:block">
                <p className="text-[9px] font-bold text-slate-300 uppercase leading-none mb-0.5">Resultados</p>
                <p className="text-[11px] font-black text-white leading-none">Lucro Real</p>
              </div>
            </motion.div>

          </motion.div>
        </div>
        
        {/* Rodapé Minimalista Direito */}
        <div className="absolute bottom-4 left-6 flex items-center gap-3 text-[11px] font-semibold text-slate-500">
           <span>MecaERP © 2026</span>
           <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
           <span className="flex items-center gap-1.5"><Zap size={10} className="text-amber-400" /> Alta Performance</span>
        </div>
      </div>
      
    </div>
  );
}