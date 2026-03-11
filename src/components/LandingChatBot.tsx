import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Brain, MessageCircle, ChevronRight, Zap, BarChart3, BadgeCheck, HelpCircle, Rocket, Car, ClipboardList, DollarSign, Wrench } from 'lucide-react';
import { knowledgeBase } from './mecaai-knowledge';

// Algoritmo de Distância de Levenshtein
const getLevenshteinDistance = (s1: string, s2: string) => {
  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0) return len2;
  if (len2 === 0) return len1;
  const matrix = Array.from({ length: len1 + 1 }, () => Array(len2 + 1).fill(0));
  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[len1][len2];
};

const LandingChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([
    { text: "Olá! Sou o **MecaAI**, consultor neural do MecaERP. \n\nPosso te ajudar com dúvidas sobre **OS**, **clientes**, **veículos**, **financeiro**, **WhatsApp automático**, **planos** e muito mais. Como posso ser útil?", isBot: true }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [lastIntent, setLastIntent] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const WHATSAPP_NUMBER = "5515998118548";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const processResponse = (input: string) => {
    const textOriginal = input.trim();
    const textClean = textOriginal.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (!textClean) return { text: "" };

    const textWithBoundaries = ` ${textClean} `;

    // 1. Saudações
    const directGreetings = ['oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'eai', 'opa', 'blz', 'tudo bem', 'fala', 'e ai', 'hello'];
    if (directGreetings.includes(textClean)) {
      setLastIntent(null);
      return { text: "Olá! Sou o **MecaAI**, inteligência neural da Develoi. 🧠\n\nComo posso acelerar o sucesso da sua oficina hoje? Pergunte sobre OS, clientes, veículos, financeiro, WhatsApp ou qualquer módulo do sistema!" };
    }

    // 2. Confirmações Contextuais
    const confirmationKeywords = ['sim', 'quero', 'manda', 'bora', 'confirmar', 'ok', 'claro', 'faz isso', 'ela faz', 'o sistema faz', 'tem isso', 'funciona assim', 'isso mesmo'];
    if (confirmationKeywords.some(k => textClean.includes(k))) {
      if (lastIntent) {
        return { text: "Sim! O MecaERP faz isso com perfeição e de forma totalmente automatizada. Deseja ver como funciona na prática ou falar com um consultor?" };
      }
      return { text: "Ótimo! Escolha um desses tópicos para começarmos agora ou me conte seu desafio:", showTopics: true };
    }

    // 3. Motor Neural de Scoring
    let winner: any = null;
    let highestScore = 0;

    knowledgeBase.forEach(item => {
      let score = 0;
      item.keywords.forEach(keyword => {
        const k = keyword.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const kWithBoundaries = k.includes(' ') ? k : ` ${k} `;

        if (textClean === k || textWithBoundaries.includes(kWithBoundaries)) {
          score += 40;
        } else if (k.length > 4 && textClean.includes(k)) {
          score += 15;
        } else {
          const inputWords = textClean.split(' ');
          inputWords.forEach(word => {
            if (word.length >= 4 && k.length >= 4) {
              const dist = getLevenshteinDistance(word, k);
              const tolerance = word.length > 6 ? 2 : 1;
              if (dist <= tolerance) {
                score += (dist === 1 ? 25 : 10);
              }
            }
          });
        }
      });

      if (score > highestScore) {
        highestScore = score;
        winner = item;
      }
    });

    if (highestScore >= 20 && winner) {
      setLastIntent(winner.id);
      return {
        text: winner.response,
        hasAction: winner.hasAction,
        actionLabel: winner.actionLabel,
        onAction: () => {
          if (winner.actionType === 'link') window.location.href = winner.url;
          else window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(winner.actionMsg)}`, '_blank');
        },
        showTopics: winner.showTopics
      };
    }

    // 4. Fallback
    setLastIntent(null);
    return {
      text: "Entendi! Sou especialista no ecossistema **MecaERP**. Posso te ajudar com:\n\n• 📋 Ordens de Serviço\n• 👤 Clientes e CRM\n• 🚗 Veículos e Histórico\n• 💰 Financeiro e DRE\n• 📦 Estoque de Peças\n• 📱 WhatsApp Automático\n• 📅 Agenda e Agendamentos\n• 💼 Planos e Preços\n\nO que você quer saber?",
      showTopics: true
    };
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { text, isBot: false }]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const result = processResponse(text);
      if (result.text) {
        setMessages(prev => [...prev, {
          text: result.text,
          isBot: true,
          hasAction: result.hasAction,
          actionLabel: result.actionLabel,
          onAction: result.onAction,
          showTopics: result.showTopics
        }]);
      }
      setIsTyping(false);
    }, 850);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[2000] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="mb-4 w-[calc(100vw-3rem)] sm:w-[400px] bg-white rounded-[2.5rem] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.3)] border border-slate-200 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-[#0f172a] p-6 text-white relative flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Brain size={28} className="text-white" />
                </div>
                <div>
                  <h4 className="text-[15px] font-black tracking-tighter uppercase leading-none mb-1.5">MecaAI Neural</h4>
                  <div className="flex items-center gap-1.5 leading-none">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_12px_#34d399]" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Core V6.0 Online · 50+ Módulos</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Chat Stream */}
            <div
              ref={scrollRef}
              className="h-[420px] overflow-y-auto p-6 space-y-7 bg-[#F9FBFF] scroll-smooth scrollbar-thin scrollbar-thumb-slate-200"
            >
              {messages.map((msg: any, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.isBot ? 'justify-start text-left' : 'justify-end text-right'}`}
                >
                  <div className={`p-4 rounded-2xl text-[14px] font-medium leading-relaxed shadow-[0_8px_30px_rgba(0,0,0,0.03)] ${
                    msg.isBot
                    ? 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                    : 'bg-blue-600 text-white rounded-tr-none shadow-blue-600/20'
                  } max-w-[92%] whitespace-pre-wrap`}>
                    {msg.text.split('**').map((part: string, index: number) => (
                      index % 2 === 1 ? <strong key={index} className={msg.isBot ? "text-blue-700 font-bold" : "font-black"}>{part}</strong> : part
                    ))}

                    {msg.hasAction && (
                      <button
                        onClick={msg.onAction}
                        className="mt-5 w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl transition-all shadow-xl active:scale-[0.97]"
                      >
                        <MessageCircle size={18} />
                        {msg.actionLabel}
                      </button>
                    )}

                    {msg.showTopics && (
                      <div className="mt-5 space-y-2">
                        {['Qual o melhor plano?', 'Como criar uma OS?', 'Historico veiculo', 'Financeiro e lucro', 'Whatsapp automatico', 'Falar com Equipe'].map((topic, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSend(topic)}
                            className="w-full text-left py-3.5 px-4 bg-white border border-slate-100 rounded-xl text-blue-600 font-extrabold hover:bg-blue-50 transition-all flex items-center justify-between group shadow-sm"
                          >
                            {topic}
                            <ChevronRight size={14} className="opacity-30 group-hover:translate-x-1 transition-transform" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white px-5 py-3 rounded-2xl flex gap-1.5 border border-slate-100 shadow-sm transition-all animate-pulse">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Chips */}
            <div className="px-5 py-4 bg-white border-t border-slate-100">
              <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { label: 'Planos e Precos', icon: <Rocket size={12} /> },
                  { label: 'Como criar OS', icon: <ClipboardList size={12} /> },
                  { label: 'Financeiro', icon: <DollarSign size={12} /> },
                  { label: 'Historico veiculo', icon: <Car size={12} /> },
                  { label: 'Whatsapp', icon: <MessageCircle size={12} /> },
                  { label: 'Comissao mecanico', icon: <Wrench size={12} /> },
                  { label: 'Lucratividade', icon: <BarChart3 size={12} /> },
                  { label: 'Suporte VIP', icon: <HelpCircle size={12} /> },
                ].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q.label)}
                    className="whitespace-nowrap px-4 py-2.5 bg-slate-50 hover:bg-blue-600 text-slate-700 hover:text-white text-[10px] font-black rounded-xl transition-all border border-slate-200/50 flex items-center gap-2"
                  >
                    {q.icon}
                    {q.label.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="p-5 bg-white border-t border-slate-200">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend(inputValue)}
                  placeholder="Pergunte sobre qualquer módulo do sistema..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-[14px] font-semibold focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400 shadow-inner"
                />
                <button
                  onClick={() => handleSend(inputValue)}
                  disabled={!inputValue.trim() || isTyping}
                  className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-20 transition-all shadow-2xl shrink-0 shadow-blue-600/40 active:scale-90"
                >
                  <Send size={26} />
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between px-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-60">
                <div className="flex items-center gap-2">
                  <BadgeCheck size={12} className="text-emerald-500" /> Neural System 6.0
                </div>
                <div className="flex items-center gap-2 text-right">
                  <Zap size={12} className="text-blue-500" /> DEVELOI ENGINEERING
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotate: 20 }}
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 bg-[#0f172a] rounded-2xl flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-95 transition-all group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-100 transition-all duration-300" />
            <div className="relative">
              <Brain size={28} className="relative z-10 group-hover:rotate-12 transition-transform" />
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-[3px] border-[#0f172a] shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingChatBot;
