import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, ChevronRight, Sparkles, User, Brain } from 'lucide-react';

const LandingChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([
    { text: "Olá! Sou o MecaAI, a inteligência avançada do MecaERP. Analisei os dados de milhares de oficinas e estou pronto para te mostrar como dobrar sua eficiência. O que você quer saber sobre o sistema?", isBot: true }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const knowledgeBase = [
    { 
      keywords: ['whatsapp', 'zap', 'mensagem', 'enviar'], 
      response: "Nossa integração com WhatsApp é total. O MecaERP envia automaticamente: 1. Confirmação de agendamento; 2. Link para aprovação de orçamento; 3. Aviso de veículo pronto; 4. Lembretes de manutenção após 6 meses. Tudo isso sem você apertar um botão!" 
    },
    { 
      keywords: ['preço', 'valor', 'custo', 'pagar', 'plano', 'mensalidade'], 
      response: "Temos planos que cabem no seu bolso: o Start (R$ 197), o Pro (R$ 297 - mais vendido) e o Elite (R$ 497). O melhor? O sistema se paga no primeiro mês apenas com as peças que você deixaria de cobrar por esquecimento!" 
    },
    { 
      keywords: ['os', 'ordem', 'serviço', 'pdf', 'papel'], 
      response: "Adeus blocos de papel! No MecaERP você cria uma OS em segundos, o técnico anexa fotos do problema direto pelo celular e você gera um PDF profissional com sua logo para o cliente." 
    },
    { 
      keywords: ['checklist', 'vistor', 'fotos', 'entrada'], 
      response: "O Checklist Digital é seu escudo jurídico. Tire fotos de todos os ângulos do veículo na entrada, marque avarias e evite que o cliente reclame de riscos que já estavam lá. Transparência total!" 
    },
    { 
      keywords: ['financeiro', 'lucro', 'caixa', 'pagar', 'receber'], 
      response: "Nosso financeiro é focado em lucro real. Você verá a margem de cada serviço, controle de estoque inteligente e fluxo de caixa automático. Você saberá exatamente para onde cada centavo está indo." 
    },
    { 
      keywords: ['teste', 'grátis', 'testar', 'experimentar'], 
      response: "Você pode testar o sistema completo por 14 dias GRATIS. Não pedimos cartão de crédito. É só cadastrar e começar a usar agora mesmo!" 
    },
    { 
      keywords: ['suporte', 'ajuda', 'ajuda', 'dificuldade'], 
      response: "Nosso suporte é reconhecido como o melhor do Brasil. Temos especialistas que entendem de oficina prontos para te atender via chat e WhatsApp em tempo real." 
    },
    { 
      keywords: ['ia', 'artificial', 'inteligência'], 
      response: "Eu sou o MecaAI! Dentro do sistema, analiso seus dados financeiros para te dar insights de onde você está perdendo dinheiro e quais serviços são mais lucrativos para sua oficina." 
    }
  ];

  const getAIResponse = (input: string) => {
    const lowInput = input.toLowerCase();
    
    // Check for keywords
    for (const item of knowledgeBase) {
      if (item.keywords.some(k => lowInput.includes(k))) {
        return item.response;
      }
    }

    // Default "Smart" generic responses
    if (lowInput.length < 5) return "Pode me dar mais detalhes? Quero entender exatamente como o MecaERP pode ajudar sua oficina.";
    
    return "Interessante sua pergunta! O MecaERP foi desenhado justamente para resolver esses desafios do dia a dia. Que tal fazer um teste grátis de 14 dias para ver isso na prática? Posso te ajudar com os planos ou alguma funcionalidade específica agora?";
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    
    setMessages(prev => [...prev, { text, isBot: false }]);
    setInputValue('');
    setIsTyping(true);
    
    setTimeout(() => {
      const response = getAIResponse(text);
      setMessages(prev => [...prev, { text: response, isBot: true }]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[1000] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-[350px] sm:w-[420px] bg-white rounded-[2rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-2xl -z-0" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <Brain size={24} className="text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-black leading-none mb-1 shadow-sm">MecaAI <span className="text-blue-400 text-[10px] ml-1 uppercase tracking-widest">Advanced</span></h4>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Processando em Tempo Real</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="hover:bg-white/10 p-2 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="h-[400px] overflow-y-auto p-6 space-y-6 bg-slate-50/30 scroll-smooth"
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`flex gap-3 max-w-[90%] ${msg.isBot ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center mt-1 ${
                      msg.isBot ? 'bg-blue-600/10 text-blue-600' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {msg.isBot ? <Bot size={16} /> : <User size={16} />}
                    </div>
                    <div className={`p-4 rounded-2xl text-[13px] font-medium leading-relaxed shadow-sm ${
                      msg.isBot 
                      ? 'bg-white text-slate-700 border border-slate-100 rounded-tl-none' 
                      : 'bg-slate-900 text-white rounded-tr-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start pl-11">
                  <div className="bg-white px-4 py-3 rounded-2xl border border-slate-100 flex gap-1.5 items-center shadow-sm">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-duration:0.6s]" />
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions / FAQ Quick Chips */}
            <div className="px-6 py-4 border-t border-slate-100 bg-white">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {['Como funciona o WhatsApp?', 'Quais os planos?', 'O que é Checklist Digital?', 'Financeiro'].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="whitespace-nowrap px-4 py-2 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 text-[11px] font-bold rounded-full border border-slate-100 hover:border-blue-100 transition-all active:scale-95"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Footer */}
            <div className="p-4 bg-white border-t border-slate-100">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend(inputValue)}
                  placeholder="Pergunte qualquer coisa sobre o sistema..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 pr-14 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all"
                />
                <button
                  onClick={() => handleSend(inputValue)}
                  disabled={!inputValue.trim()}
                  className="absolute right-2 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-30 disabled:hover:bg-blue-600 transition-all active:scale-90"
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                <Sparkles size={12} className="text-blue-500" />
                Dúvida técnica? MecaAI ajuda você
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-[0_15px_40px_rgba(37,99,235,0.4)] hover:scale-110 active:scale-95 transition-all group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        {isOpen ? <X size={28} /> : (
          <div className="relative">
            <MessageSquare size={28} />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full" />
          </div>
        )}
      </button>
    </div>
  );
};

export default LandingChatBot;
