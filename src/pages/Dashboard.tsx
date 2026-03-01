import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Car, 
  ClipboardCheck, 
  TrendingUp,
  Clock,
  ChevronRight,
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';
import api from '../services/api';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(res => setStats(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full">Carregando...</div>;

  const cards = [
    { label: 'Clientes', value: stats?.summary.clients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Veículos', value: stats?.summary.vehicles, icon: Car, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'OS Abertas', value: stats?.summary.openWorkOrders, icon: ClipboardCheck, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Faturamento Mensal', value: `R$ ${stats?.summary.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  const quickActions = [
    { label: 'Nova OS', icon: Plus, path: '/work-orders', color: 'bg-emerald-600' },
    { label: 'Novo Agendamento', icon: Calendar, path: '/appointments', color: 'bg-blue-600' },
    { label: 'Novo Cliente', icon: Users, path: '/clients', color: 'bg-purple-600' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Bem-vindo ao seu painel de controle.</p>
        </div>
        <div className="flex items-center gap-3">
          {quickActions.map((action) => (
            <button 
              key={action.label}
              onClick={() => navigate(action.path)}
              className={`${action.color} text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-slate-200`}
            >
              <action.icon size={16} />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div 
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.bg} ${card.color} p-3 rounded-xl transition-transform group-hover:scale-110`}>
                <card.icon size={24} />
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-full uppercase tracking-wider">Este mês</span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{card.value}</p>
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <card.icon size={100} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Clock size={20} className="text-slate-400" />
              Ordens de Serviço Recentes
            </h2>
            <Link to="/work-orders" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 uppercase tracking-wider">
              Ver todas <ChevronRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {stats?.recentWorkOrders.map((wo: any) => (
              <Link 
                key={wo.id} 
                to={`/work-orders/${wo.id}`}
                className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-black text-sm group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                    {wo.number.split('-').pop().slice(-3)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900">{wo.number}</p>
                      <span className={cn("text-[8px] font-black uppercase px-1 rounded", 
                        wo.priority === 'HIGH' ? 'bg-red-100 text-red-600' : 
                        wo.priority === 'MEDIUM' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                      )}>
                        {wo.priority}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{wo.client_name} • <span className="font-mono">{wo.plate}</span></p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                    wo.status === 'OPEN' ? 'bg-blue-50 text-blue-600' :
                    wo.status === 'FINISHED' ? 'bg-emerald-50 text-emerald-600' :
                    'bg-slate-50 text-slate-600'
                  }`}>
                    {wo.status}
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    R$ {wo.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </Link>
            ))}
            {stats?.recentWorkOrders.length === 0 && (
              <div className="p-12 text-center text-slate-400">
                Nenhuma ordem de serviço encontrada.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
            <div className="relative z-10">
              <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                <AlertCircle size={24} className="text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Resumo de Hoje</h3>
              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl">
                  <span className="text-sm text-slate-400">Agendamentos</span>
                  <span className="font-bold">0</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl">
                  <span className="text-sm text-slate-400">Veículos para entrega</span>
                  <span className="font-bold">0</span>
                </div>
              </div>
            </div>
            <div className="absolute -right-12 -bottom-12 opacity-10">
              <Calendar size={200} />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-500" />
              Metas do Mês
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                  <span>Faturamento</span>
                  <span>45%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[45%] rounded-full"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                  <span>Novos Clientes</span>
                  <span>70%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[70%] rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
