import React from 'react';
import { motion } from 'motion/react';
import { 
  ClipboardList, 
  Calendar, 
  BarChart3, 
  ShieldCheck, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  MessageSquare,
  Zap,
  TrendingUp,
  LayoutDashboard,
  Check,
  Star,
  ArrowRight,
  Globe,
  Lock,
  MousePointer2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import heroImg from '../image/hero-landing.png';
import logoMecaerp from '../image/logo-system/logo-mecaerp.png';

const LandingPage = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  const features = [
    {
      title: "Ordens de Serviço",
      desc: "Digitalização total. Fotos, laudos e orçamentos aprovados em segundos via link.",
      icon: ClipboardList,
      gradient: "from-blue-600 to-indigo-700"
    },
    {
      title: "Agenda Inteligente",
      desc: "Gestão de pátio visual. Controle cada box e técnico com precisão cirúrgica.",
      icon: Calendar,
      gradient: "from-emerald-600 to-teal-700"
    },
    {
      title: "Financeiro Master",
      desc: "Controle de margem real. Saiba exatamente quanto sobrou após cada parafuso.",
      icon: BarChart3,
      gradient: "from-purple-600 to-pink-700"
    },
    {
      title: "Zap Automático",
      desc: "O sistema fala pelo seu negócio. Status e cobranças direto no bolso do cliente.",
      icon: MessageSquare,
      gradient: "from-green-600 to-emerald-700"
    },
    {
      title: "Vistoria HD",
      desc: "Checklist fotográfico de entrada. Proteja sua reputação e evite contestações.",
      icon: LayoutDashboard,
      gradient: "from-orange-600 to-amber-700"
    },
    {
      title: "Módulo Jurídico",
      desc: "Garantias técnicas e termos de responsabilidade emitidos automaticamente.",
      icon: ShieldCheck,
      gradient: "from-red-600 to-rose-700"
    }
  ];

  return (
    <div className="min-h-screen bg-[#050510] text-[#E2E8F0] selection:bg-emerald-500/30 font-sans overflow-x-hidden">
      <style>{`
        @keyframes floating {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
        .perspective-1000 { perspective: 1000px; }
      `}</style>

      {/* Cinematic Background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full animate-pulse opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-600/10 blur-[150px] rounded-full animate-pulse opacity-50" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      {/* Floating Navbar */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-[1000] px-6 py-4 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex justify-between items-center"
      >
        <Link to="/" className="flex items-center gap-3 group">
          <img src={logoMecaerp} alt="MecaERP" className="h-10 w-auto" />
        </Link>
        
        <div className="hidden lg:flex items-center gap-10">
          {['Funcionalidades', 'Vantagens', 'Preço', 'Depoimentos'].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase()}`} 
              className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 hover:text-emerald-400 transition-all"
            >
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-6">
          <Link to="/login" className="hidden sm:block text-[10px] font-black uppercase tracking-[0.2em] text-white/70 hover:text-white">
            Login
          </Link>
          <Link 
            to="/login"
            className="group relative px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl overflow-hidden transition-all active:scale-95"
          >
            <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.2em]">DEMO GRÁTIS</span>
          </Link>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-4">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-3 px-5 py-2 mb-10 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <Zap className="text-emerald-400 w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">EVOLUÇÃO DIGITAL AUTOMOTIVA</span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-6xl md:text-9xl font-black mb-10 tracking-tighter leading-[0.85] text-white">
              Sua oficina em <br />
              <span className="text-emerald-500">Alta Performance</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="max-w-3xl mx-auto text-lg md:text-2xl text-white/50 mb-14 font-medium leading-[1.4] px-4">
              O MecaERP é o acelerador de lucro para oficinas que cansaram da desorganização e querem dominar o mercado local.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link 
                to="/login"
                className="group w-full sm:w-auto px-12 py-6 bg-white text-slate-900 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-500 hover:text-white transition-all shadow-[0_0_50px_rgba(16,185,129,0.3)] flex items-center justify-center gap-4"
              >
                Começar Agora
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </Link>
              <button 
                className="w-full sm:w-auto px-12 py-6 bg-white/5 border border-white/10 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-4 backdrop-blur-md"
              >
                Conhecer Mais
                <Globe className="w-5 h-5 opacity-50" />
              </button>
            </motion.div>
          </motion.div>

          {/* Epic UI Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="mt-24 relative perspective-1000"
          >
            <div className="p-1 md:p-3 bg-gradient-to-b from-white/20 to-transparent rounded-[3rem] border border-white/20 shadow-[0_100px_150px_-50px_rgba(0,0,0,0.8)]">
              <img 
                src={heroImg} 
                alt="Dashboard MecaERP Elite" 
                className="rounded-[2.4rem] w-full border border-white/5"
              />
            </div>
            
            {/* Floating Badges (simplified for stability) */}
            <div className="absolute -left-10 top-[20%] p-6 bg-[#0A0A1F]/80 backdrop-blur-xl rounded-[2.5rem] border border-white/10 hidden xl:flex items-center gap-5 shadow-2xl animate-[floating_5s_ease-in-out_infinite]">
              <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400">
                <TrendingUp size={28} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase text-white/30 tracking-widest leading-none mb-1.5">CRESCIMENTO MÉD.</p>
                <p className="text-2xl font-black text-white">+350%</p>
              </div>
            </div>

            <div className="absolute -right-10 bottom-[30%] p-6 bg-emerald-600 rounded-[2.5rem] border border-white/20 hidden xl:flex items-center gap-5 shadow-2xl animate-[floating_6s_ease-in-out_infinite]">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white">
                <Lock size={28} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase text-white/60 tracking-widest leading-none mb-1.5">SEGURANÇA</p>
                <p className="text-2xl font-black text-white italic">ElitePass</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section id="vantagens" className="py-40 bg-white text-slate-900 rounded-[5rem] z-20 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-32">
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-600 block mb-6">PRODUTIVIDADE REAL</span>
            <h2 className="text-4xl md:text-7xl font-black tracking-tighter">Sua oficina em <br />outro patamar.</h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-12 bg-slate-50 rounded-[4rem] border border-slate-100"
            >
              <h3 className="text-3xl font-black mb-10 text-slate-800">Cenário Comum</h3>
              <div className="space-y-6">
                {[
                  "Perda de orçamentos por demora",
                  "Garantias dadas 'No Grito'",
                  "Mecânicos ociosos",
                  "Prejuízo com peças não cobradas"
                ].map((item, i) => (
                  <div key={i} className="flex gap-5 items-start">
                    <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center text-red-500 shrink-0"><AlertCircle size={20} /></div>
                    <p className="font-bold text-slate-600 leading-tight pt-2">{item}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-12 bg-emerald-950 text-white rounded-[4rem]"
            >
              <h3 className="text-3xl font-black mb-10 text-emerald-400">Com MecaERP</h3>
              <div className="space-y-6">
                {[
                  "Aprovação via Link em minutos",
                  "Garantia blindada com fotos",
                  "Box inteligente e organizado",
                  "Lucro Real em tempo real"
                ].map((item, i) => (
                  <div key={i} className="flex gap-5 items-start">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0"><CheckCircle2 size={20} /></div>
                    <p className="font-bold text-emerald-50/80 leading-tight pt-2">{item}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section id="funcionalidades" className="py-48 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-32">
            <h2 className="text-4xl md:text-8xl font-black text-white tracking-tighter">Diferenciais Elite.</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white/[0.03] backdrop-blur-3xl p-12 rounded-[3.5rem] border border-white/10 hover:border-emerald-500/40 transition-all cursor-default"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${f.gradient} rounded-[1.5rem] flex items-center justify-center mb-10`}>
                  <f.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black mb-6 text-white">{f.title}</h3>
                <p className="text-white/40 font-medium leading-[1.6]">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="preço" className="py-40 bg-white text-slate-900 rounded-[5rem] z-20 relative">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="mb-32">
            <h2 className="text-5xl md:text-8xl font-black tracking-tighter">Planos.</h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-10 items-stretch">
            {[
              { name: "START", price: "197", features: ["OS Digitais", "Financeiro", "Suporte"] },
              { name: "PERFORMANCE", price: "297", favorite: true, features: ["WhatsApp", "Checklist HD", "Dashboards"] },
              { name: "ELITE", price: "497", features: ["IA Consultora", "Multi-Empresas", "Priority VIP"] }
            ].map((plan, i) => (
              <div 
                key={i}
                className={`p-16 rounded-[4.5rem] text-left flex flex-col transition-all ${
                  plan.favorite ? "bg-slate-900 text-white scale-105" : "bg-slate-50 border border-slate-100"
                }`}
              >
                <h3 className="text-xl font-black mb-4 uppercase italic">{plan.name}</h3>
                <div className="flex items-baseline gap-2 mb-12">
                  <span className="text-6xl font-black tracking-tighter">{plan.price}</span>
                  <span className="text-sm font-bold opacity-40">/mês</span>
                </div>
                <div className="space-y-6 mb-16 flex-1">
                  {plan.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-5">
                      <div className={`p-1 rounded-full ${plan.favorite ? 'bg-emerald-500' : 'bg-slate-900 text-white'}`}><Check size={12} /></div>
                      <span className="text-sm font-bold opacity-60">{f}</span>
                    </div>
                  ))}
                </div>
                <Link 
                  to="/login"
                  className={`w-full py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] text-center ${
                    plan.favorite ? 'bg-emerald-500 text-slate-900' : 'bg-slate-900 text-white'
                  }`}
                >
                  ASSINAR AGORA
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Conversion */}
      <section className="py-40 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             className="relative bg-emerald-600 rounded-[5rem] p-16 md:p-32 text-center overflow-hidden"
          >
            <div className="relative z-10 text-white">
              <h2 className="text-5xl md:text-9xl font-black mb-12 tracking-tighter italic uppercase leading-none">
                VAMOS ACELERAR?
              </h2>
              <Link 
                to="/login"
                className="inline-block px-16 py-7 bg-white text-emerald-600 rounded-[3rem] font-black text-sm uppercase tracking-[0.3em] active:scale-95"
              >
                CRIAR CONTA GRÁTIS
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-32 border-t border-white/5 bg-[#020208]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
          <img src={logoMecaerp} alt="MecaERP" className="h-10 w-auto opacity-50" />
          <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.5em]">© 2026 MECAERP SYTEMS ELITE.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
