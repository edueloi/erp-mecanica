import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, ChevronRight, Sparkles, User, Brain, ShieldCheck, Zap, Layout, Database, Cpu, BadgeCheck } from 'lucide-react';

// Motor de Inteligência Preditiva (Lógica Fuzzy Avançada & Semântica)
const simulateIntelligence = (text: string, patterns: string[]) => {
  const t = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return patterns.some(p => {
    const pattern = p.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (t.includes(pattern)) return true;
    
    // Detecção de erros de digitação (Levenshtein simplificado)
    const words = t.split(' ');
    return words.some(word => {
      if (word.length < 4) return false;
      let diff = 0;
      for (let i = 0; i < Math.min(word.length, pattern.length); i++) {
        if (word[i] !== pattern[i]) diff++;
      }
      return diff <= 2 && Math.abs(word.length - pattern.length) <= 1;
    });
  });
};

const LandingChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([
    { text: "**MecaAI Ultra V.5** em operação. \n\nDesenvolvido pela **Develoi** sob a engenharia do **Eng. Eduardo Eloi**. Como posso acelerar os resultados da sua oficina hoje?", isBot: true }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const brain = [
    {
      id: 'stack',
      keywords: ['tecnologia', 'stack', 'linguagem', 'frontend', 'backend', 'banco de dados', 'react', 'node', 'prisma', 'postgres', 'como foi feito', 'codigo'],
      response: "O MecaERP utiliza o que há de mais moderno: **React 18**, **Node.js** e **PostgreSQL**. Alta performance e estabilidade total para sua gestão."
    },
    {
      id: 'security',
      keywords: ['segurança', 'protecao', 'hack', 'perder dados', 'nuvem', 'backup', 'lgpd', 'criptografia'],
      response: "Dados blindados com **JWT**, backups por hora e conformidade total com a **LGPD**. Sua oficina segura na nuvem."
    },
    {
      id: 'who_made',
      keywords: ['quem e eduardo', 'eduardo eloi', 'quem criou', 'quem desenvolveu', 'dono', 'develoi', 'quem e voce'],
      response: "Somos a **Develoi Soluções Digitais**, liderada pelo **Eng. Eduardo Eloi**. Criamos tecnologia de ponta para o reparador brasileiro."
    },
    {
      id: 'finance',
      keywords: ['financeiro', 'lucro', 'caixa', 'pagamento', 'contas', 'dfc', 'margem', 'quanto ganhei'],
      response: "Nosso **Financeiro Master** entrega lucro real por serviço, controle de estoque e fluxo de caixa automático. Gestão de quem entende de lucro."
    },
    {
      id: 'whatsapp',
      keywords: ['whatsapp', 'zap', 'notificacao', 'automacao', 'mensagem', 'enviar', 'agendamento'],
      response: "O MecaERP automatiza seu **WhatsApp**: envia orçamentos, status da OS e lembretes de revisão sem você tocar no celular."
    },
    {
      id: 'checklist',
      keywords: ['checklist', 'vistoria', 'fotos', 'avaria', 'risco', 'danos', 'entrada'],
      response: "O **Checklist HD** protege sua oficina com fotos e laudos digitais assinados na entrada. Blindagem jurídica total."
    },
    {
      id: 'pricing',
      keywords: ['preco', 'valor', 'quanto custa', 'mensalidade', 'plano', 'gratis', 'teste'],
      response: "Planos a partir de **R$ 197/mês**. Comece agora com **14 dias GRATUITOS** e veja o lucro da sua oficina disparar."
    }
  ];

  const interactions = {
    greetings: ["Sistema online. Qual a missão de hoje?", "MecaAI pronto. Como posso ajudar?", "Pronto para otimizar sua oficina?"],
    thanks: ["Tamo junto! Foco no pátio e deixa a gestão com a gente.", "Valeu! Qualquer dúvida, basta chamar."],
    offTopic: "Sinto muito, meu núcleo de inteligência é focado 100% no **MecaERP**. \n\nDeseja falar sobre **Financeiro**, **Checklist** ou **WhatsApp**?"
  };

  const processAI = (input: string) => {
    const text = input.trim();
    if (!text) return "";
    if (simulateIntelligence(text, ['oi', 'ola', 'bom dia', 'boa tarde', 'boa noite'])) return interactions.greetings[Math.floor(Math.random() * interactions.greetings.length)];
    if (simulateIntelligence(text, ['valeu', 'obrigado', 'show'])) return interactions.thanks[Math.floor(Math.random() * interactions.thanks.length)];

    let bestMatch = brain[0];
    let maxMatches = 0;
    brain.forEach(item => {
      let count = 0;
      item.keywords.forEach(key => { if (simulateIntelligence(text, [key])) count++; });
      if (count > maxMatches) { maxMatches = count; bestMatch = item; }
    });
    return maxMatches > 0 ? bestMatch.response : interactions.offTopic;
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { text, isBot: false }]);
    setInputValue('');
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { text: processAI(text), isBot: true }]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[2000] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="mb-4 w-[calc(100vw-3rem)] sm:w-[380px] bg-white rounded-[2rem] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.3)] border border-slate-200 overflow-hidden flex flex-col"
          >
            {/* Minimalist Tech Header */}
            <div className="bg-[#1e293b] p-6 text-white relative">
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Brain size={24} className="text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-black tracking-tight mb-1 flex items-center gap-2 uppercase">
                    MecaAI <span className="text-[9px] bg-emerald-500 text-slate-900 px-2 py-0.5 rounded-md font-bold">V5 CORE</span>
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                    <Sparkles size={12} className="text-blue-400" /> Powered by Develoi
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors bg-white/10 p-2 rounded-xl z-50 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Micro Status */}
            <div className="bg-slate-50 px-6 py-2.5 flex gap-4 border-b border-slate-100">
               <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /><span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">System Health OK</span></div>
               <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" /><span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Neural Active</span></div>
            </div>

            {/* Sleek Chat Area */}
            <div 
              ref={scrollRef}
              className="h-[380px] overflow-y-auto p-6 space-y-7 bg-white scroll-smooth"
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`p-4 rounded-2xl text-[13px] font-medium leading-relaxed shadow-[0_10px_20px_-10px_rgba(0,0,0,0.05)] ${
                    msg.isBot 
                    ? 'bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100' 
                    : 'bg-blue-600 text-white rounded-tr-none shadow-blue-500/20'
                  } max-w-[88%] whitespace-pre-wrap`}>
                    {msg.text.split('**').map((part, index) => (
                       index % 2 === 1 ? <strong key={index} className={msg.isBot ? "text-blue-600 font-bold" : "font-black"}>{part}</strong> : part
                    ))}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-50 px-5 py-3 rounded-2xl flex gap-1.5 items-center border border-slate-100">
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="px-6 py-4 bg-white border-t border-slate-50">
               <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                  {['PREÇO', 'WHATSAPP', 'CHECKLIST', 'DEVELOI'].map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(q)}
                      className="whitespace-nowrap px-4 py-2 bg-slate-100 hover:bg-blue-600 text-slate-600 hover:text-white text-[10px] font-black rounded-xl transition-all uppercase tracking-widest border border-transparent hover:border-blue-700"
                    >
                      {q}
                    </button>
                  ))}
               </div>
            </div>

            {/* Compact Input */}
            <div className="p-5 bg-white border-t border-slate-200">
              <div className="relative group flex items-center gap-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend(inputValue)}
                  placeholder="Pergunte ao MecaAI..."
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-5 py-4 text-xs font-bold focus:outline-none focus:border-blue-600/50 focus:ring-4 focus:ring-blue-600/5 transition-all text-slate-800 placeholder:text-slate-400"
                />
                <button
                  onClick={() => handleSend(inputValue)}
                  disabled={!inputValue.trim() || isTyping}
                  className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-30 transition-all shadow-lg shadow-blue-600/20 shrink-0"
                >
                  <Send size={20} className="relative left-[1px]" />
                </button>
              </div>
              <p className="mt-4 text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] text-center opacity-60">
                 ENGINE V5.2 • EDUARDO ELOI EDITION
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 bg-[#010108] rounded-2xl flex items-center justify-center text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-110 active:scale-95 transition-all group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-100 transition-all duration-700" />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <Cpu size={24} className="relative z-10 group-hover:rotate-12 transition-transform" />
              <motion.div 
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute -top-2 -right-2"
              >
                <div className="w-3 h-3 bg-blue-500 rounded-full blur-[2px] opacity-50" />
              </motion.div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingChatBot;
