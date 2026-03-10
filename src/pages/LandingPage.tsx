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
  MousePointer2,
  Settings,
  Shield,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import heroImg from '../image/hero-landing.png';
import logoMecaerp from '../image/logo-system/logo-mecaerp.png';
import LandingChatBot from '../components/LandingChatBot';

const LandingPage = () => {
  const fadeIn: any = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const navItems = [
    { name: 'Funcionalidades', href: '#features' },
    { name: 'Vantagens', href: '#benefits' },
    { name: 'Planos', href: '#pricing' },
    { name: 'Depoimentos', href: '#testimonials' },
  ];

  const features = [
    {
      title: "Ordens de Serviço",
      desc: "Digitalização total do fluxo de entrada ao fechamento. Gere PDFs profissionais com rapidez.",
      icon: ClipboardList,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "Agenda Inteligente",
      desc: "Gestão visual do pátio. Controle cada box e técnico de forma simples e intuitiva.",
      icon: Calendar,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      title: "Financeiro Master",
      desc: "Controle de margem real. Fluxo de caixa e lucratividade por serviço em tempo real.",
      icon: BarChart3,
      color: "text-indigo-600",
      bg: "bg-indigo-50"
    },
    {
      title: "WhatsApp Integrado",
      desc: "Envio automático de status, orçamentos e lembretes direto para o cliente.",
      icon: MessageSquare,
      color: "text-green-600",
      bg: "bg-green-50"
    },
    {
      title: "Vistoria Digital",
      desc: "Checklist fotográfico de entrada para evitar contestações e proteger sua oficina.",
      icon: LayoutDashboard,
      color: "text-orange-600",
      bg: "bg-orange-50"
    },
    {
      title: "Módulo de Garantia",
      desc: "Emissão automatizada de termos técnicos e certificados de garantia personalizados.",
      icon: ShieldCheck,
      color: "text-red-600",
      bg: "bg-red-50"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-blue-100 font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-[100] bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <img src={logoMecaerp} alt="MecaERP" className="h-8 w-auto" />
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <a key={item.name} href={item.href} className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-wider">
                  {item.name}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <Link to="/login" className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2">
                Entrar
              </Link>
              <Link 
                to="/login"
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-sm active:scale-95"
              >
                Demonstração Grátis
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 bg-blue-50 border border-blue-100 rounded-full">
                <Zap className="text-blue-600 w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">O ERP Automotivo Definitivo</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
                Transforme sua Oficina em uma <span className="text-blue-600">Empresa de Elite</span>
              </h1>

              <p className="text-lg text-slate-600 mb-8 max-w-lg leading-relaxed">
                Pare de lutar com papéis e planilhas. Automatize o pátio, controle o financeiro e encante seus clientes com o MecaERP.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link 
                  to="/login"
                  className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-blue-700 hover:translate-y-[-2px] transition-all shadow-lg flex items-center gap-2 group"
                >
                  Começar Agora
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <a 
                  href="#features" 
                  className="bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all text-center flex items-center justify-center"
                >
                  Ver Funcionalidades
                </a>
              </div>

              <div className="mt-10 flex items-center gap-6">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" />
                  ))}
                </div>
                <p className="text-xs font-semibold text-slate-500">
                  Join <span className="text-slate-900">+500 oficinas</span> que já evoluíram.
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-blue-500/5 blur-3xl rounded-full" />
              <img 
                src={heroImg} 
                alt="Dashboard MecaERP" 
                className="relative rounded-2xl shadow-2xl border border-slate-200 w-full"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Lucratividade", value: "+35%", icon: TrendingUp },
              { label: "Tempo de Setup", value: "24h", icon: Clock },
              { label: "Satisfação", value: "99.8%", icon: Star },
              { label: "Segurança", value: "100%", icon: Shield }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 mb-3">
                  <stat.icon size={20} className="text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us (Conflict Section) */}
      <section id="benefits" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">O Que Diferencia as Melhores Oficinas?</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">A diferença está na gestão. O MecaERP resolve os problemas crônicos que roubam seu lucro.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
              <h3 className="text-xl font-bold mb-8 text-red-600 flex items-center gap-2">
                <AlertCircle size={24} /> O Cenário Antigo
              </h3>
              <ul className="space-y-4">
                {[
                  "Esquecer de cobrar peças pequenas",
                  "Discussões com clientes por falta de laudo foto",
                  "Mecânicos ociosos e pátio bagunçado",
                  "Não saber se teve lucro ou prejuízo no mês"
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 items-start text-sm text-slate-600 font-medium leading-tight">
                    <span className="text-red-400 mt-1">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-600 p-8 rounded-3xl text-white shadow-xl">
              <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                <CheckCircle2 size={24} /> A Nova Realidade
              </h3>
              <ul className="space-y-4">
                {[
                  "Controle rigoroso de margem e estoque",
                  "Vistoria digital que blinda sua oficina",
                  "Agenda visual que maximiza a produtividade",
                  "Painel de bordo com lucro real em tempo real"
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 items-start text-sm text-blue-100 font-medium leading-tight">
                    <Check size={18} className="text-blue-300 mt-0.5 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Tudo que sua Oficina Precisa</h2>
            <p className="text-slate-500">Desenvolvido especificamente para o dia a dia do reparador.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-2xl border border-slate-200 transition-all hover:shadow-lg"
              >
                <div className={`w-12 h-12 ${f.bg} ${f.color} rounded-xl flex items-center justify-center mb-6`}>
                  <f.icon size={24} />
                </div>
                <h3 className="text-lg font-bold mb-3 text-slate-900">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Investimento Simples e Justo</h2>
            <p className="text-slate-500 mt-2">Escolha o plano que melhor se adapta ao tamanho do seu negócio.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Start", price: "197", features: ["Até 50 OS/mês", "Financeiro Básico", "Agenda Digital"] },
              { name: "Pro", price: "297", popular: true, features: ["OS Ilimitadas", "WhatsApp Integrado", "Checklist com Fotos", "Geração de PDFs"] },
              { name: "Elite", price: "497", features: ["IA Consultora", "Multi-unidades", "APP Customizado", "Suporte VIP"] }
            ].map((plan, i) => (
              <div 
                key={i}
                className={`p-10 rounded-3xl text-left border ${
                  plan.popular ? "border-blue-500 ring-4 ring-blue-500/10 shadow-xl relative" : "border-slate-200"
                }`}
              >
                {plan.popular && (
                  <span className="absolute top-0 right-8 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full">Recomendado</span>
                )}
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-10">
                  <span className="text-xs font-bold text-slate-400">R$</span>
                  <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                  <span className="text-xs font-medium text-slate-400">/mês</span>
                </div>
                <ul className="space-y-4 mb-10">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex gap-3 text-xs font-semibold text-slate-600">
                      <Check size={16} className="text-blue-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link 
                  to="/login"
                  className={`block w-full text-center py-3 rounded-xl text-xs font-bold transition-all ${
                    plan.popular ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  Assinar Agora
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-slate-900 rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] -z-0" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">Pronto para dar o próximo passo?</h2>
              <p className="text-slate-400 text-lg mb-10 mx-auto max-w-lg">Comece hoje mesmo a transformar seu pátio em uma máquina de lucro estável.</p>
              <Link 
                to="/login"
                className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-xl font-bold transition-all shadow-lg active:scale-95"
              >
                Criar Minha Conta Grátis
                <MousePointer2 size={18} />
              </Link>
              <p className="text-[10px] text-slate-500 mt-8 font-bold uppercase tracking-widest">Teste gratuito por 14 dias • Sem cartão necessário</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <img src={logoMecaerp} alt="MecaERP" className="h-8 w-auto mb-6" />
            <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
              O sistema de gestão automotiva para quem busca profissionalismo e lucratividade real.
            </p>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase text-slate-900 tracking-widest mb-6 font-primary">Empresa</h4>
            <ul className="space-y-4">
              <li><a href="#funcionalidades" className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors">Funcionalidades</a></li>
              <li><a href="#precos" className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors">Planos e Preços</a></li>
              <li><a href="https://wa.me/5515998118548" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors">Suporte & Contato</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase text-slate-900 tracking-widest mb-6 font-primary">Jurídico</h4>
            <ul className="space-y-4">
              <li><Link to="/termos" className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors">Termos de Uso</Link></li>
              <li><Link to="/privacidade" className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors">Privacidade</Link></li>
              <li><Link to="/lgpd" className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors">LGPD</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 pt-8 border-t border-slate-100 text-center">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">© 2026 MecaERP. Desenvolvido para o Sucesso Automotivo.</p>
        </div>
      </footer>
      <LandingChatBot />
    </div>
  );
};

export default LandingPage;
