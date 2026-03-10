import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, ChevronRight, Sparkles, User, Brain, ExternalLink, ShieldCheck, Zap, BarChart3, MessageCircle } from 'lucide-react';

const LandingChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([
    { text: "Olá! Sou o **MecaAI Ultra**, sua inteligência especializada em alta performance automotiva. Fui treinado para transformar oficinas comuns em máquinas de lucro. Como posso acelerar o seu negócio hoje?", isBot: true }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [context, setContext] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const knowledgeBase = [
    { 
      id: 'whatsapp',
      keywords: ['whatsapp', 'zap', 'mensagem', 'enviar', 'comunicação', 'contato'], 
      response: "Nossa **Integração Automática com WhatsApp** é o coração da comunicação. O sistema envia sozinho: \n\n• **Lembretes de revisão**\n• **Orçamentos para aprovação** (com botão 'Aprovar' direto no link)\n• **Avisos de 'Carro Pronto'**\n\nIsso aumenta sua taxa de aprovação em até **40%**. Quer ver como funciona na prática?",
      followUp: "Quer saber sobre os preços dessa integração?"
    },
    { 
      id: 'pricing',
      keywords: ['preço', 'valor', 'custo', 'pagar', 'plano', 'mensalidade', 'quanto', 'assinatura'], 
      response: "Temos 3 níveis de aceleração:\n\n1. **Start (R$ 197/mês):** Essencial para quem está começando.\n2. **Pro (R$ 297/mês):** O favorito, inclui WhatsApp e Checklist Digital.\n3. **Elite (R$ 497/mês):** Consultoria por IA e Multi-oficinas.\n\nTodos os planos têm **zero taxa de adesão**. Qual deles parece ideal para sua oficina hoje?",
      followUp: "Posso te explicar sobre o período de teste grátis?"
    },
    { 
      id: 'checklist',
      keywords: ['checklist', 'vistoria', 'fotos', 'entrada', 'avaria', 'risco'], 
      response: "O **Checklist HD** é seu 'seguro' contra problemas. Você tira fotos de cada detalhe na entrada do veículo. O cliente assina digitalmente e recebe uma cópia na hora. Isso acaba com a frase: 'Esse risco não estava aqui antes'.",
      followUp: "Deseja saber como a IA ajuda no checklist?"
    },
    { 
      id: 'finance',
      keywords: ['financeiro', 'lucro', 'caixa', 'contas', 'dfc', 'margem', 'quanto ganhei', 'estoque'], 
      response: "Nosso sistema financeiro faz o serviço pesado por você. \n\nCalculamos a **margem real de lucro** por OS, controlamos o estoque de peças e geramos relatórios de fluxo de caixa automáticos. Você para de 'achar' e passa a **saber** quanto está ganhando.",
      followUp: "Quer que eu fale sobre os relatórios de lucratividade?"
    },
    { 
      id: 'security',
      keywords: ['seguro', 'segurança', 'nuvem', 'perder dados', 'backup', 'lgpd', 'privacidade'], 
      response: "Seus dados estão em um cofre digital. Usamos criptografia de nível bancário e backups de hora em hora. Estamos **100% adequados à LGPD**. Se a sua oficina pegar fogo, seus dados estarão intactos na nuvem.",
      followUp: "Posso falar sobre a estabilidade do nosso servidor?"
    },
    { 
      id: 'app',
      keywords: ['celular', 'app', 'android', 'iphone', 'ios', 'tablet', 'computador'], 
      response: "O MecaERP é **multiplataforma**. Funciona no computador da recepção, no celular do mecânico e no tablet do dono. Você gerencia sua oficina de qualquer lugar do mundo, na palma da mão.",
      followUp: "Funciona offline? (Spoiler: Sim, sincronizamos tudo depois!)"
    }
  ];

  const genericPatterns = [
    { 
      keywords: ['quem é você', 'quem e vc', 'quem é vc', 'o que voce e', 'o que você é', 'identidade', 'seu nome'], 
      response: "Eu sou o **MecaAI Ultra**, a inteligência artificial definitiva do ecossistema MecaERP. Fui projetado para ser o braço direito do dono de oficina, analisando dados e automatizando processos complexos em segundos." 
    },
    { 
      keywords: ['quem te criou', 'quem te fez', 'quem te desenvolveu', 'quem e o dono', 'criador', 'desenvolvedor', 'educardo', 'eloi', 'develoi'], 
      response: "Fui desenvolvido pela **Develoi Soluções Digitais**, sob a mentoria e engenharia do **Engenheiro Eduardo Eloi**. Minha missão é aplicar o que há de mais moderno em tecnologia para revolucionar o mercado automotivo brasileiro." 
    },
    { 
      keywords: ['oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'eai', 'opa', 'salve'], 
      response: [
        "Olá! É um prazer ter você aqui. Como posso ajudar você a profissionalizar sua oficina hoje?",
        "Opa! Tudo certo? Pronto para transformar sua oficina em uma máquina de lucro?",
        "Olá! Sou o MecaAI. Em que posso ser útil para o seu negócio agora?",
        "Salve! Como está a produtividade na sua oficina hoje? Quer turbinar os resultados?"
      ]
    },
    { 
      keywords: ['ajuda', 'socorro', 'como funciona', 'tutorial', 'explicar'], 
      response: "Estou aqui para ser seu consultor! Posso te explicar sobre **WhatsApp Automático**, **Financeiro Master**, **Checklist HD** ou **Termos de Garantia**. O que faz mais sentido para você agora?" 
    },
    { 
      keywords: ['obrigado', 'vlw', 'valeu', 'show', 'legal', 'top', 'obrigada'], 
      response: [
        "Por nada! Estou aqui para transformar sua oficina em referência. Manda a próxima!",
        "Tmj! Se precisar de mais qualquer detalhe sobre o MecaERP, estou no aguardo.",
        "É um prazer ajudar! Vamos acelerar esse negócio?",
        "Show de bola! Qualquer dúvida técnica ou comercial, conte comigo."
      ]
    }
  ];

  const getAIResponse = (input: string) => {
    const lowInput = input.toLowerCase();
    
    // 1. Check Personal/Greeting/Identity Patterns
    for (const pattern of genericPatterns) {
      if (pattern.keywords.some(k => lowInput.includes(k))) {
        if (Array.isArray(pattern.response)) {
          return pattern.response[Math.floor(Math.random() * pattern.response.length)];
        }
        return pattern.response;
      }
    }

    // 2. Check Context (if following up)
    if (context && (lowInput.includes('sim') || lowInput.includes('quero') || lowInput.includes('pode'))) {
      const lastContext = knowledgeBase.find(k => k.id === context);
      if (lastContext) {
        setContext(null);
        return `Ótima escolha! No MecaERP, ${lastContext.id === 'pricing' ? 'nossos 14 dias de teste grátis permitem que você use TUDO' : 'essa função é otimizada para economizar até 2 horas do seu tempo por dia'}. Quer iniciar o teste grátis agora?`;
      }
    }

    // 3. Search Knowledge Base
    let bestMatch = null;
    let maxMatches = 0;

    for (const item of knowledgeBase) {
      const matchCount = item.keywords.filter(k => lowInput.includes(k)).length;
      if (matchCount > maxMatches) {
        maxMatches = matchCount;
        bestMatch = item;
      }
    }

    if (bestMatch) {
      setContext(bestMatch.id);
      return bestMatch.response;
    }

    // 4. Off-Topic Guardrail (The "Intelligence" part)
    if (lowInput.length > 3) {
      return "Hmm, entendo o seu ponto! Como sou uma Inteligência Especializada em Gestão Automotiva, meu foco é ajudar você a dominar o MecaERP. \n\nPosso te explicar como nosso sistema resolve problemas de **Financeiro**, **Fila de Oficina** ou **Fidelização de Clientes**. Qual desses tópicos faz mais sentido para você agora?";
    }

    return "Pode me perguntar algo mais específico sobre o sistema? Estou pronto para te mostrar como o MecaERP é o melhor investimento para sua oficina.";
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    
    setMessages(prev => [...prev, { text, isBot: false }]);
    setInputValue('');
    setIsTyping(true);
    
    // Variable delay for "Human-like" thinking
    const delay = Math.min(1000 + text.length * 20, 2500);
    
    setTimeout(() => {
      const response = getAIResponse(text);
      setMessages(prev => [...prev, { text: response, isBot: true }]);
      setIsTyping(false);
    }, delay);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[1000] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="mb-4 w-[360px] sm:w-[450px] bg-white rounded-[2.5rem] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.3)] border border-slate-100 overflow-hidden flex flex-col"
          >
            {/* Ultra Header */}
            <div className="bg-[#0A0A1F] p-7 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/20 blur-[60px] -z-0" />
              <div className="flex items-center gap-5 relative z-10 text-left">
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-tr from-blue-700 to-emerald-500 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20 animate-pulse">
                    <Brain size={28} className="text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-[#0A0A1F] rounded-full" />
                </div>
                <div>
                  <h4 className="text-base font-black leading-none mb-1.5 flex items-center gap-2">
                    MecaAI <span className="text-[10px] bg-blue-500 px-2 py-0.5 rounded-full uppercase tracking-tighter">ULTRA Edition</span>
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                    <Sparkles size={10} className="text-emerald-400" /> Consultoria Automotiva 24/7
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="absolute top-7 right-7 hover:bg-white/10 p-2 rounded-xl transition-colors text-white/50 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* AI Visualizer Bar */}
            <div className="h-1 bg-slate-100 relative">
              <motion.div 
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-blue-500 to-transparent" 
              />
            </div>

            {/* Rich Messages Area */}
            <div 
              ref={scrollRef}
              className="h-[420px] overflow-y-auto p-7 space-y-7 bg-[#FBFBFF] scroll-smooth"
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`flex gap-4 max-w-[92%] ${msg.isBot ? 'flex-row' : 'flex-row-reverse text-right'}`}>
                    <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center mt-1 shadow-sm ${
                      msg.isBot ? 'bg-white text-blue-600 border border-slate-100' : 'bg-slate-900 text-white'
                    }`}>
                      {msg.isBot ? <Bot size={18} /> : <User size={18} />}
                    </div>
                    <div>
                      <div className={`p-4 rounded-2xl text-[13px] font-medium leading-relaxed whitespace-pre-wrap ${
                        msg.isBot 
                        ? 'bg-white text-slate-700 shadow-xl shadow-slate-200/50 border border-slate-100 rounded-tl-none' 
                        : 'bg-slate-900 text-white rounded-tr-none shadow-lg'
                      }`}>
                        {msg.text.split('**').map((part, index) => (
                          index % 2 === 1 ? <strong key={index} className="font-black text-blue-600">{part}</strong> : part
                        ))}
                      </div>
                      {msg.isBot && i === messages.length - 1 && (
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 ml-1 tracking-widest">Resposta Gerada por MecaAI-v4.0</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start pl-13">
                  <div className="bg-white px-5 py-4 rounded-3xl border border-slate-100 flex gap-2 items-center shadow-lg shadow-slate-200/50">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic Context Suggestions */}
            <div className="px-7 py-5 bg-white border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none items-center">
                <span className="shrink-0 text-[9px] font-black text-blue-600/50 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-md">Sugestões AI:</span>
                {['Como triplicar meu lucro?', 'É seguro levar meus dados pra nuvem?', 'Planos e Preços', 'Apps para mecânicos'].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="whitespace-nowrap px-4 py-2.5 bg-slate-50 hover:bg-blue-600 text-slate-700 hover:text-white text-[11px] font-bold rounded-2xl border border-slate-100 hover:border-blue-600 transition-all active:scale-95 shadow-sm"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Station */}
            <div className="p-5 bg-white border-t border-slate-100">
              <div className="relative flex items-center group">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend(inputValue)}
                  placeholder="Escreva sua dúvida aqui..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] px-6 py-4 pr-16 text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-[6px] focus:ring-blue-500/5 transition-all"
                />
                <button
                  onClick={() => handleSend(inputValue)}
                  disabled={!inputValue.trim() || isTyping}
                  className="absolute right-2.5 w-11 h-11 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-30 transition-all active:scale-90 shadow-lg shadow-blue-500/30"
                >
                  <Send size={20} />
                </button>
              </div>
              <div className="mt-5 flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <ShieldCheck size={12} className="text-emerald-500" /> LGPD Safe
                   </div>
                   <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <Zap size={12} className="text-blue-500" /> Turbo Core
                   </div>
                </div>
                <button 
                  onClick={() => window.location.href = '/login'}
                  className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
                >
                  Criar Conta Grátis
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Sparkle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-18 h-18 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white shadow-[0_20px_60px_rgba(0,0,0,0.4)] hover:scale-110 active:scale-95 transition-all group relative overflow-hidden ${isOpen ? 'rotate-90' : ''}`}
        style={{ width: '4.5rem', height: '4.5rem' }}
      >
        <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
        {isOpen ? <X size={32} /> : (
          <div className="relative">
            <Bot size={32} className="relative z-10" />
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-2 -right-2 text-emerald-400"
            >
              <Sparkles size={16} />
            </motion.div>
          </div>
        )}
      </button>
    </div>
  );
};

export default LandingChatBot;
