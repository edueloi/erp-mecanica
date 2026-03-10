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
  ArrowUpRight,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3
} from 'lucide-react';
import api from '../services/api';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';
import { useSettings } from '../contexts/SettingsContext';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const navigate = useNavigate();
  const { preferences } = useSettings();

  useEffect(() => {
    setLoading(true);
    api.get('/dashboard/stats', { params: { period } })
      .then(res => setStats(res.data))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return <div className="flex items-center justify-center h-full">Carregando...</div>;

  const summary = stats?.summary || {
    clients: 0,
    vehicles: 0,
    openWorkOrders: 0,
    averageTicket: 0,
    monthlyRevenue: 0,
    todayAppointments: 0,
    vehiclesToDeliver: 0,
    newClientsThisMonth: 0,
    lowStockParts: 0
  };

  const cards = [
    { label: 'Clientes', value: summary.clients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Veículos', value: summary.vehicles, icon: Car, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'OS Abertas', value: summary.openWorkOrders, icon: ClipboardCheck, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Ticket Médio', value: `R$ ${(summary.averageTicket || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Faturamento Mensal', value: `R$ ${(summary.monthlyRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
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
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="15">Últimos 15 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
          <div className="flex items-center gap-3">
            {quickActions.map((action) => (
              <button 
                key={action.label}
                onClick={() => navigate(action.path)}
                className={`${action.color} text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-slate-200 cursor-pointer`}
              >
                <action.icon size={16} />
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {preferences.show_dashboard_cards && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
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
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 size={20} className="text-emerald-500" />
              Faturamento por Dia
            </h3>
          </div>
          <div className="h-[300px] w-full flex items-end justify-between gap-2 px-2 pb-8 pt-4 relative">
            {stats && (stats.revenueHistory || []).length > 0 ? (
              (stats.revenueHistory || []).map((day: any, i: number) => {
                const history = stats.revenueHistory || [];
                const maxRevenue = Math.max(...(history.map((d: any) => d.total || 0)), 1);
                const heightPercent = ((day.total || 0) / maxRevenue) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercent}%` }}
                      className="w-full bg-emerald-500 rounded-t-lg relative group-hover:bg-emerald-600 transition-colors"
                    >
                      <div className="hidden group-hover:block absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-lg whitespace-nowrap z-50">
                        R$ {(day.total || 0).toLocaleString('pt-BR')}
                      </div>
                    </motion.div>
                    <span className="absolute -bottom-6 text-[10px] font-bold text-slate-400 rotate-45 origin-left">
                      {new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">Sem dados no período</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <PieChartIcon size={20} className="text-blue-500" />
              Status das OS
            </h3>
          </div>
          <div className="h-[300px] w-full flex items-center justify-around">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                {(() => {
                  let currentOffset = 0;
                  const statusData = stats?.statusDistribution || [];
                  const total = statusData.reduce((acc: number, s: any) => acc + s.count, 0) || 1;
                  return statusData.map((s: any, i: number) => {
                    const percent = (s.count / total) * 100;
                    const strokeDash = `${percent} ${100 - percent}`;
                    const offset = currentOffset;
                    currentOffset += percent;
                    return (
                      <circle
                        key={i}
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        className={cn(
                          "transition-all duration-1000",
                          s.status === 'OPEN' ? 'stroke-blue-500' : 
                          s.status === 'FINISHED' ? 'stroke-emerald-500' :
                          s.status === 'CANCELLED' ? 'stroke-red-500' : 'stroke-slate-300'
                        )}
                        strokeWidth="3.8"
                        strokeDasharray={strokeDash}
                        strokeDashoffset={`-${offset}`}
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-900">
                  {(stats?.statusDistribution || []).reduce((acc: number, s: any) => acc + s.count, 0) || 0}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total OS</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {(stats?.statusDistribution || []).map((entry: any, index: number) => {
                const statusLabels: any = {
                  'OPEN': 'Aberta',
                  'FINISHED': 'Finalizada',
                  'CANCELLED': 'Cancelada',
                  'DRAFT': 'Rascunho',
                  'DIAGNOSIS': 'Diagnóstico',
                  'WAITING_APPROVAL': 'Aguard. Aprovação',
                  'EXECUTING': 'Em Execução',
                  'DELIVERED': 'Entregue'
                };
                return (
                  <div key={index} className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full",
                      entry.status === 'OPEN' ? 'bg-blue-500' : 
                      entry.status === 'FINISHED' ? 'bg-emerald-500' :
                      entry.status === 'CANCELLED' ? 'bg-red-500' : 'bg-slate-300'
                    )} />
                    <span className="text-xs font-medium text-slate-600 uppercase tracking-wider">{statusLabels[entry.status] || entry.status}</span>
                    <span className="text-xs font-bold text-slate-900">{entry.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <ClipboardCheck size={20} className="text-orange-500" />
              Top Serviços
            </h3>
          </div>
          <div className="space-y-4">
            {(stats?.topServices || []).length > 0 ? (
              (stats.topServices || []).map((service: any, i: number) => {
                const services = stats.topServices || [];
                const maxTotal = Math.max(...(services.map((s: any) => s.total || 0)), 1);
                const widthPercent = ((service.total || 0) / maxTotal) * 100;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
                      <span className="truncate max-w-[200px]">{service.description}</span>
                      <span>R$ {(service.total || 0).toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPercent}%` }}
                        className="h-full bg-orange-400 rounded-full"
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center text-slate-400 text-xs">Nenhum serviço registrado</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
            <TrendingUp size={40} className="text-emerald-500" />
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Performance Mensal</p>
          <p className="text-4xl font-black text-slate-900 mt-2">
            {summary.monthlyRevenue > 0 
              ? Math.round((summary.monthlyRevenue / (summary.monthlyRevenue + 15000)) * 100) 
              : 0}%
          </p>
          <div className="mt-4 flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            <ArrowUpRight size={16} />
            <span className="text-xs font-black">+12.5% em relação ao período anterior</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {stats?.todayAppointments?.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-blue-50/30">
                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                  <Calendar size={20} className="text-blue-500" />
                  Agendamentos de Hoje
                </h2>
                <Link to="/appointments" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 uppercase tracking-wider">
                  Ver agenda <ChevronRight size={14} />
                </Link>
              </div>
          <div className="divide-y divide-slate-100">
                {(stats?.todayAppointments || []).map((appt: any) => (
                  <div key={appt.id} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-12 bg-blue-100 rounded-xl flex flex-col items-center justify-center text-blue-700">
                        <span className="text-xs font-black leading-none">{appt.time}</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{appt.client_name}</p>
                        <p className="text-sm text-slate-500">
                          {appt.brand} {appt.model} • <span className="font-mono">{appt.plate}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
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
                        {wo.priority === 'HIGH' ? 'Alta' : wo.priority === 'MEDIUM' ? 'Média' : 'Baixa'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{wo.client_name} • <span className="font-mono">{wo.plate}</span></p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider",
                    wo.status === 'OPEN' ? 'bg-blue-50 text-blue-600' :
                    wo.status === 'FINISHED' ? 'bg-emerald-50 text-emerald-600' :
                    'bg-slate-50 text-slate-600'
                  )}>
                    {wo.status === 'OPEN' ? 'Aberta' : wo.status === 'FINISHED' ? 'Finalizada' : wo.status === 'DRAFT' ? 'Rascunho' : wo.status}
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    R$ {wo.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </Link>
            ))}
            {(stats?.recentWorkOrders || []).length === 0 && (
              <div className="p-12 text-center text-slate-400">
                Nenhuma ordem de serviço encontrada.
              </div>
            )}
          </div>
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
                  <span className="font-bold">{summary.todayAppointments}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl">
                  <span className="text-sm text-slate-400">Veículos para entrega</span>
                  <span className="font-bold">{summary.vehiclesToDeliver}</span>
                </div>
                {(summary.lowStockParts || 0) > 0 && (
                  <div className="flex items-center justify-between p-3 bg-red-500/20 rounded-2xl border border-red-500/30">
                    <span className="text-sm text-red-200">Alertas de estoque</span>
                    <span className="font-bold text-red-200">{summary.lowStockParts}</span>
                  </div>
                )}
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
              {(() => {
                const revenueGoal = 50000;
                const clientsGoal = 50;
                
                const currentRevenue = summary.monthlyRevenue || 0;
                const currentClients = summary.newClientsThisMonth || 0;
                
                const revenuePercent = Math.min(Math.round((currentRevenue / revenueGoal) * 100), 100);
                const clientsPercent = Math.min(Math.round((currentClients / clientsGoal) * 100), 100);

                return (
                  <>
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                        <span>Faturamento (R$ {currentRevenue.toLocaleString('pt-BR')} / R$ {revenueGoal.toLocaleString('pt-BR')})</span>
                        <span>{revenuePercent}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${revenuePercent}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                        <span>Novos Clientes ({currentClients} / {clientsGoal})</span>
                        <span>{clientsPercent}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${clientsPercent}%` }}></div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
