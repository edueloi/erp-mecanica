import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../services/authStore';
import api from '../services/api';
import { motion } from 'motion/react';
import { LogIn, UserPlus } from 'lucide-react';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegister) {
        await api.post('/auth/register', { tenantName, userName: name, email, password });
        setIsRegister(false);
        setError('Conta criada com sucesso! Faça login.');
      } else {
        const res = await api.post('/auth/login', { email, password });
        login(res.data.user, res.data.token);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-8 bg-emerald-600 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center font-bold text-3xl mx-auto mb-4">M</div>
          <h1 className="text-2xl font-bold">MecaERP</h1>
          <p className="text-emerald-100 text-sm mt-1">Gestão inteligente para sua oficina</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className={`p-3 rounded-xl text-sm font-medium ${error.includes('sucesso') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {error}
              </div>
            )}

            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nome da Oficina</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 focus:ring-emerald-500 focus:border-emerald-500"
                    value={tenantName}
                    onChange={e => setTenantName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Seu Nome</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 focus:ring-emerald-500 focus:border-emerald-500"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">E-mail</label>
              <input 
                type="email" 
                required 
                className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 focus:ring-emerald-500 focus:border-emerald-500"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Senha</label>
              <input 
                type="password" 
                required 
                className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 focus:ring-emerald-500 focus:border-emerald-500"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Processando...' : isRegister ? <><UserPlus size={20} /> Criar Conta</> : <><LogIn size={20} /> Entrar</>}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors"
            >
              {isRegister ? 'Já tem uma conta? Entre aqui' : 'Não tem uma conta? Registre sua oficina'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
