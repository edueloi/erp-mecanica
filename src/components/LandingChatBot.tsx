import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, ChevronRight } from 'lucide-react';

const LandingChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Olá! Sou o assistente inteligente do MecaERP. Como posso ajudar sua oficina hoje?", isBot: true }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const faq = [
    { 
      q: "O que é o MecaERP?", 
      a: "O MecaERP é o sistema de gestão mais completo para oficinas. Automatizamos tudo: OS, Agenda, WhatsApp, Checklist Digital e Financeiro Master." 
    },
    { 
      q: "Tem teste grátis?", 
      a: "Sim! Você pode testar todas as funcionalidades por 14 dias sem compromisso. Não pedimos cartão de crédito para iniciar." 
    },
    { 
      q: "Como funciona o WhatsApp?", 
      a: "O sistema envia status, orçamentos e avisos de revisão automaticamente. Seus clientes recebem tudo no celular e podem aprovar orçamentos com um clique." 
    },
    { 
      q: "É difícil de usar?", 
      a: "Pelo contrário! Criamos o sistema focado na agilidade do pátio. Em menos de 15 minutos sua oficina já está rodando 100% digital." 
    },
    { 
      q: "Tem suporte técnico?", 
      a: "Temos um suporte humano especializado via chat e WhatsApp dedicado a ajudar você a lucrar mais com a ferramenta." 
    }
  ];

  const handleQuestion = (question: string, answer: string) => {
    setMessages(prev => [...prev, { text: question, isBot: false }]);
    setIsTyping(true);
    
    setTimeout(() => {
      setMessages(prev => [...prev, { text: answer, isBot: true }]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[1000] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-[350px] sm:w-[400px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot size={22} className="text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-bold leading-none mb-1">MecaBot</h4>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Online Agora</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1.5 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="h-[350px] overflow-y-auto p-6 space-y-4 bg-slate-50/50">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.isBot ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs font-medium leading-relaxed ${
                    msg.isBot 
                    ? 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-none' 
                    : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 rounded-tr-none'
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl border border-slate-100 flex gap-1 items-center">
                    <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce" />
                    <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Replies */}
            <div className="p-4 border-t border-slate-100 bg-white">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Dúvidas Frequentes</p>
              <div className="flex flex-wrap gap-2">
                {faq.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuestion(item.q, item.a)}
                    className="text-[10px] font-bold text-slate-600 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 px-3 py-2 rounded-lg border border-slate-100 hover:border-blue-100 transition-all text-left flex items-center gap-2 group"
                  >
                    {item.q}
                    <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Inteligência Artificial MecaERP</span>
              <button 
                onClick={() => window.location.href = '/login'}
                className="text-[10px] font-bold text-blue-600 hover:underline"
              >
                Testar Grátis
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-[0_10px_30px_rgba(37,99,235,0.4)] hover:scale-110 active:scale-95 transition-all group relative"
      >
        <div className="absolute inset-0 bg-blue-600 rounded-full animate-ping opacity-20 group-hover:block" />
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
};

export default LandingChatBot;
