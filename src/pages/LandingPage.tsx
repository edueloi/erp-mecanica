import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { 
  ClipboardList, Calendar, BarChart3, ShieldCheck, CheckCircle2, 
  MessageSquare, Zap, TrendingUp, LayoutDashboard, Check, Star, 
  ArrowRight, MousePointer2, Shield, Clock, PlayCircle, Wrench, 
  CarFront, Users, ChevronDown, CheckCircle, Menu, X as CloseIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import heroImg from '../image/hero-landing.png';
import logoMecaerp from '../image/logo-system/logo-mecaerp.png';
import LandingChatBot from '../components/LandingChatBot';

// --- COMPONENTES AUXILIARES ---

const AccordionItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden transition-all hover:border-blue-300 shadow-sm">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex justify-between items-center p-6 text-left focus:outline-none"
      >
        <span className="font-bold text-slate-800 text-lg">{question}</span>
        <ChevronDown className={`text-blue-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} size={20} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            className="px-6 pb-6 text-slate-600 leading-relaxed"
          >
            {answer}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- PÁGINA PRINCIPAL ---

const LandingPage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: "easeOut" as const } 
    }
  };

  const navItems = [
    { name: 'Funcionalidades', href: '#features' },
    { name: 'Vantagens', href: '#benefits' },
    { name: 'Planos', href: '#pricing' },
    { name: 'Depoimentos', href: '#testimonials' },
    { name: 'FAQ', href: '#faq' },
  ];

  const features = [
    {
      title: "Ordem de Serviço Inteligente",
      desc: "Do orçamento em PDF à aprovação via WhatsApp. Tudo rápido, com sua logo e cálculo de peças.",
      icon: ClipboardList,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100"
    },
    {
      title: "Financeiro e Lucro Real",
      desc: "Saiba exatamente sua margem de contribuição. Fluxo de caixa, DRE e controle de inadimplência.",
      icon: BarChart3,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100"
    },
    {
      title: "Automação de WhatsApp",
      desc: "O sistema avisa sozinho quando o carro tá pronto ou se o orçamento foi aprovado. Venda no piloto automático.",
      icon: MessageSquare,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-100"
    },
    {
      title: "Checklist Digital HD",
      desc: "Fotografe avarias na entrada e blinde sua oficina contra processos. Cliente assina na tela do celular.",
      icon: ShieldCheck,
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-100"
    },
    {
      title: "Agenda de Pátio",
      desc: "Organize seus elevadores e mecânicos. Saiba quem está fazendo o quê e evite gargalos produtivos.",
      icon: Calendar,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-100"
    },
    {
      title: "Controle de Estoque",
      desc: "Aviso de peças acabando, curva ABC e integração com fornecedores. Pare de perder dinheiro com peças.",
      icon: LayoutDashboard,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-100"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 selection:bg-blue-200 selection:text-blue-900 font-sans overflow-x-hidden">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-200/50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center gap-2">
              <img src={logoMecaerp} alt="MecaERP" className="h-9 w-auto hover:scale-105 transition-transform" />
            </Link>
            
            <div className="hidden lg:flex items-center gap-8">
              {navItems.map((item) => (
                <a key={item.name} href={item.href} className="text-[13px] font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest">
                  {item.name}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Link to="/login" className="hidden md:block text-[14px] font-bold text-slate-600 hover:text-slate-900 px-4 py-2">
                Acessar Sistema
              </Link>
              <Link 
                to="/login"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[12px] sm:text-[14px] font-bold hover:shadow-[0_8px_30px_rgb(37,99,235,0.3)] transition-all active:scale-95 flex items-center gap-1 sm:gap-2"
              >
                <span className="hidden sm:inline">Testar Grátis</span>
                <span className="sm:hidden">Começar</span>
                <ArrowRight size={14} className="sm:w-4 sm:h-4" />
              </Link>
              
              {/* Mobile Menu Toggle */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {isMobileMenuOpen ? <CloseIcon size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Table */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-t border-slate-100 overflow-hidden"
            >
              <div className="px-4 py-6 space-y-4">
                {navItems.map((item) => (
                  <a 
                    key={item.name} 
                    href={item.href} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-sm font-bold text-slate-600 hover:text-blue-600 py-2 uppercase tracking-widest"
                  >
                    {item.name}
                  </a>
                ))}
                <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                  <Link to="/login" className="text-center font-bold text-slate-600 py-3">
                    Acessar Sistema
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white">
        {/* Abstract Background */}
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-blue-50 to-white pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-40 -left-40 w-[500px] h-[500px] bg-indigo-400/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center text-center lg:text-left">
            <motion.div initial="hidden" animate="visible" variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}>
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-white border border-slate-200 rounded-full shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-700">Sistema Atualizado 2026</span>
              </motion.div>
              
              <motion.h1 variants={fadeInUp} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 mb-6 tracking-tight leading-[1.1]">
                O fim da bagunça na sua <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Oficina.</span>
              </motion.h1>

              <motion.p variants={fadeInUp} className="text-lg md:text-xl text-slate-600 mb-10 max-w-xl leading-relaxed font-medium">
                Mais de 500 donos de oficinas já pararam de perder dinheiro com peças não cobradas e orçamentos esquecidos. Assuma o controle total em 24 horas.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link 
                  to="/login"
                  className="bg-blue-600 text-white px-8 py-4 sm:py-4.5 rounded-2xl font-bold text-[15px] hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-600/30 transition-all flex items-center justify-center gap-2 group"
                >
                  Criar Conta Gratuita
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <a 
                  href="#features" 
                  className="bg-white text-slate-700 border-2 border-slate-200 px-8 py-4.5 rounded-2xl font-bold text-[15px] hover:bg-slate-50 hover:border-slate-300 transition-all text-center flex items-center justify-center gap-2"
                >
                  <PlayCircle size={20} className="text-slate-400" />
                  Ver como funciona
                </a>
              </motion.div>

              <motion.div variants={fadeInUp} className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 text-sm font-semibold text-slate-500">
                <div className="flex items-center gap-1 text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 whitespace-nowrap">
                  <CheckCircle size={16} /> 14 dias grátis
                </div>
                <div className="flex items-center gap-1 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 whitespace-nowrap">
                  <CheckCircle size={16} /> Sem cartão de crédito
                </div>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, rotateY: 10 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative perspective-1000"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-[2.5rem] blur-xl opacity-30" />
              <img 
                src={heroImg} 
                alt="Dashboard MecaERP" 
                className="relative rounded-[2rem] shadow-2xl border border-slate-200/50 w-full object-cover transform transition-transform hover:scale-[1.02] duration-500"
              />
              
              {/* Floating Badge */}
              <div className="absolute -bottom-4 -left-4 md:-bottom-6 md:-left-6 bg-white p-3 md:p-4 rounded-xl md:rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 md:gap-4 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="text-emerald-600" size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Lucro Médio</p>
                  <p className="text-lg md:text-xl font-black text-slate-900">+35% no 1º mês</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof Strip */}
      <div className="border-y border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Integrações Nativas de Alta Performance</p>
          <div className="flex flex-wrap justify-center gap-6 md:gap-16 items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Exemplos de integrações (podem ser logos reais no futuro) */}
            <h3 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-2"><MessageSquare size={20} className="md:w-6 md:h-6"/> WhatsApp</h3>
            <h3 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-2"><CarFront size={20} className="md:w-6 md:h-6"/> Tabela FIPE</h3>
            <h3 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-2"><Shield size={20} className="md:w-6 md:h-6"/> AWS Cloud</h3>
            <h3 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-2"><BarChart3 size={20} className="md:w-6 md:h-6"/> SEFAZ / NFe</h3>
          </div>
        </div>
      </div>

      {/* Dor vs Solução (Benefits) */}
      <section id="benefits" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 tracking-tight">Por que oficinas fecham as portas?</h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">A falta de organização come o seu lucro silenciosamente. O MecaERP foi criado para tapar os buracos por onde seu dinheiro está vazando.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            {/* O Problema */}
            <div className="bg-white p-8 md:p-12 rounded-[2rem] border border-red-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full -z-0 transition-transform group-hover:scale-110" />
              <h3 className="text-2xl font-black mb-8 text-slate-900 relative z-10 flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xl">✕</span>
                A Oficina Comum
              </h3>
              <ul className="space-y-6 relative z-10">
                {[
                  "Esquece de adicionar peças pequenas na OS.",
                  "Não sabe quanto cada mecânico produziu no mês.",
                  "Paga prejuízos por não ter fotos da entrada do carro.",
                  "Cliente some porque ninguém lembrou ele da revisão."
                ].map((item, i) => (
                  <li key={i} className="flex gap-4 items-start text-slate-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* A Solução */}
            <div className="bg-slate-900 p-8 md:p-12 rounded-[2rem] shadow-2xl relative overflow-hidden group">
               <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-600/30 blur-3xl rounded-full -z-0 transition-transform group-hover:scale-110" />
              <h3 className="text-2xl font-black mb-8 text-white relative z-10 flex items-center gap-3">
                 <span className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl">✓</span>
                A Oficina MecaERP
              </h3>
              <ul className="space-y-6 relative z-10">
                {[
                  "Orçamentos blindados com cálculo automático de margem.",
                  "Comissionamento automático em 1 clique.",
                  "Checklist fotográfico HD com assinatura digital.",
                  "WhatsApp avisa o cliente sozinho sobre a próxima troca de óleo."
                ].map((item, i) => (
                  <li key={i} className="flex gap-4 items-start text-slate-300 font-medium">
                    <Check size={20} className="text-blue-400 shrink-0" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">O Ecossistema Completo</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Você não precisa de vários sistemas. Temos tudo que uma oficina de alto rendimento necessita em uma única tela.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -8 }}
                className={`bg-white p-8 rounded-[2rem] border ${f.border} transition-all hover:shadow-xl hover:shadow-slate-200/50 group`}
              >
                <div className={`w-14 h-14 ${f.bg} ${f.color} rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                  <f.icon size={28} />
                </div>
                <h3 className="text-xl font-bold mb-4 text-slate-900">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed font-medium">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 text-center">
           <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-16 tracking-tight">Quem usa, não troca.</h2>
           
           <div className="grid md:grid-cols-3 gap-8">
              {[
                { name: "Carlos Mendes", shop: "Mendes Auto Center", text: "Antes eu perdia horas no fim do mês para calcular as comissões. Hoje aperto um botão e tá tudo na tela. O MecaERP pagou a assinatura no primeiro dia de uso." },
                { name: "Roberto Silva", shop: "Beto Preparações", text: "A vistoria com fotos mudou o jogo. Um cliente tentou dizer que arranhamos o carro dele, abri o MecaERP, mostrei a foto da entrada com a assinatura dele. Assunto encerrado." },
                { name: "Amanda Costa", shop: "Oficina Costa Car", text: "Eu achava que tinha lucro, até começar a usar o fluxo de caixa deles. Descobri onde o dinheiro tava sumindo. Hoje, consigo ver a margem real de cada peça vendida." }
              ].map((dep, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-left flex flex-col justify-between">
                   <div>
                     <div className="flex gap-1 mb-6">
                        {[1,2,3,4,5].map(s => <Star key={s} size={18} className="fill-amber-400 text-amber-400" />)}
                     </div>
                     <p className="text-slate-600 font-medium italic mb-8">"{dep.text}"</p>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500">{dep.name.charAt(0)}</div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{dep.name}</p>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">{dep.shop}</p>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="mb-20">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-6">Planos Transparentes</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Sem taxas escondidas. Cancele quando quiser. Escolha o motor do seu negócio.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: "Start", desc: "Para oficinas em crescimento", price: "197", features: ["Até 50 OS/mês", "Financeiro Básico", "Agenda de Pátio", "Cadastro de Clientes"] },
              { name: "Pro", desc: "O campeão de vendas", price: "297", popular: true, features: ["OS Ilimitadas", "WhatsApp Automático", "Checklist com Fotos HD", "Cálculo de Comissões", "Controle de Estoque"] },
              { name: "Elite", desc: "Para grandes redes", price: "497", features: ["Tudo do Pro", "Múltiplas Lojas", "Suporte Prioritário VIP", "Migração de Dados Inclusa"] }
            ].map((plan, i) => (
              <div 
                key={i}
                className={`p-8 md:p-10 rounded-[2.5rem] text-left transition-all duration-300 ${
                  plan.popular 
                  ? "bg-slate-900 text-white shadow-2xl lg:scale-105 relative z-10 my-4 lg:my-0" 
                  : "bg-white border border-slate-200 text-slate-900 hover:border-blue-300"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                    Mais Escolhido
                  </div>
                )}
                <h3 className={`text-2xl font-black mb-2 ${plan.popular ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                <p className={`text-sm mb-8 font-medium ${plan.popular ? 'text-slate-400' : 'text-slate-500'}`}>{plan.desc}</p>
                
                <div className="flex items-baseline gap-1 mb-8">
                  <span className={`text-lg font-bold ${plan.popular ? 'text-slate-400' : 'text-slate-400'}`}>R$</span>
                  <span className="text-5xl font-extrabold tracking-tight">{plan.price}</span>
                  <span className={`text-sm font-medium ${plan.popular ? 'text-slate-400' : 'text-slate-500'}`}>/mês</span>
                </div>

                <Link 
                  to="/login"
                  className={`block w-full text-center py-4 rounded-xl text-[15px] font-bold transition-all mb-10 ${
                    plan.popular 
                    ? "bg-blue-600 text-white hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]" 
                    : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                  }`}
                >
                  Assinar {plan.name}
                </Link>

                <ul className="space-y-4">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex gap-3 text-sm font-semibold">
                      <Check size={18} className={plan.popular ? 'text-blue-400 shrink-0' : 'text-blue-600 shrink-0'} /> 
                      <span className={plan.popular ? 'text-slate-300' : 'text-slate-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-slate-50">
         <div className="max-w-3xl mx-auto px-4">
            <div className="text-center mb-16">
               <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">Perguntas Frequentes</h2>
            </div>
            <div className="space-y-4">
               <AccordionItem question="Preciso instalar alguma coisa no computador?" answer="Não! O MecaERP é 100% em nuvem. Você acessa de qualquer computador, tablet ou celular que tenha internet, exatamente como acessa seu e-mail." />
               <AccordionItem question="Posso usar pelo celular?" answer="Sim. O sistema é totalmente responsivo e funciona perfeitamente em telas menores. Os mecânicos podem usar no celular para ver as OS e o dono pode acompanhar os lucros de casa." />
               <AccordionItem question="E se eu tiver dificuldades para usar?" answer="Temos uma equipe de suporte por WhatsApp pronta para te ajudar, além de tutoriais em vídeo passo a passo. O sistema foi desenhado para ser tão fácil de usar quanto o WhatsApp." />
               <AccordionItem question="Vocês emitem Nota Fiscal?" answer="Sim. Nós integramos com a SEFAZ para emissão de Notas Fiscais de Produto (NFe) e Notas de Serviço (NFSe) dependendo da sua prefeitura." />
            </div>
         </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] md:rounded-[3rem] p-8 sm:p-12 md:p-20 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 blur-[120px] -z-0" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 blur-[120px] -z-0" />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight tracking-tight">Pronto para subir de nível?</h2>
              <p className="text-slate-300 text-lg md:text-xl mb-12 mx-auto max-w-2xl font-medium">Pare de perder horas com burocracia. Comece hoje mesmo a transformar seu pátio em uma máquina de lucro e produtividade.</p>
              
              <Link 
                to="/login"
                className="inline-flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 md:px-10 py-4 md:py-5 rounded-2xl text-base md:text-lg font-black transition-all shadow-[0_0_40px_rgba(37,99,235,0.4)] hover:shadow-[0_0_60px_rgba(37,99,235,0.6)] hover:-translate-y-1 active:scale-95 w-full sm:w-auto"
              >
                Teste Grátis 14 Dias
                <MousePointer2 size={24} />
              </Link>
              <p className="text-xs text-slate-400 mt-8 font-bold uppercase tracking-widest flex justify-center gap-4">
                 <span><Check size={14} className="inline mr-1 text-emerald-400"/> Cancelamento Fácil</span>
                 <span><Check size={14} className="inline mr-1 text-emerald-400"/> Suporte Humano</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <img src={logoMecaerp} alt="MecaERP" className="h-10 w-auto mb-6" />
            <p className="text-slate-500 text-sm max-w-sm leading-relaxed font-medium">
              O ecossistema definitivo de gestão automotiva. Feito por quem entende de mecânica, para quem quer dominar o mercado.
            </p>
          </div>
          <div>
            <h4 className="text-[11px] font-black uppercase text-slate-900 tracking-widest mb-6">Produto</h4>
            <ul className="space-y-4">
              <li><a href="#features" className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors">Funcionalidades</a></li>
              <li><a href="#pricing" className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors">Planos e Preços</a></li>
              <li><a href="https://wa.me/5515998118548" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors">Falar com Consultor</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] font-black uppercase text-slate-900 tracking-widest mb-6">Legal</h4>
            <ul className="space-y-4">
              <li><Link to="/termos" className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors">Termos de Uso</Link></li>
              <li><Link to="/privacidade" className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors">Privacidade</Link></li>
              <li><Link to="/lgpd" className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors">Conformidade LGPD</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">© 2026 Develoi. Todos os direitos reservados.</p>
          <div className="flex gap-4">
             {/* Redes Sociais placeholders */}
             <div className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 cursor-pointer transition-colors" />
             <div className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 cursor-pointer transition-colors" />
          </div>
        </div>
      </footer>
      <LandingChatBot />
    </div>
  );
};

export default LandingPage;