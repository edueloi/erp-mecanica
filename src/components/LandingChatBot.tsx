import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, ChevronRight, Sparkles, User, Brain, ShieldCheck, Zap, BarChart3, Clock, HelpCircle, BadgeCheck } from 'lucide-react';

const LandingChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([
    { text: "Olá! Sou o **MecaAI Ultra**, a inteligência definitiva do MecaERP. Fui treinado pela Develoi para triplicar a eficiência da sua oficina. O que vamos otimizar hoje?", isBot: true }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Inteligência Baseada em Intenções (NLP Local Simulado)
  const intents = [
    {
      id: 'identity',
      keywords: ['quem é você', 'quem e vc', 'identidade', 'seu nome', 'mecaai', 'o que voce faz'],
      response: "Eu sou o **MecaAI Ultra**, a mente digital por trás do ecossistema MecaERP. Meu objetivo é transformar dados de oficinas em decisões lucrativas e automatizar todo o trabalho chato do seu dia a dia."
    },
    {
      id: 'creator',
      keywords: ['quem te criou', 'quem te fez', 'desenvolveu', 'criador', 'dono', 'autor', 'eduardo', 'eloi', 'develoi', 'quem é o engenheiro'],
      response: "Fui desenvolvido pela **Develoi Soluções Digitais**, sob a engenharia do **Engenheiro Eduardo Eloi**. Sou o resultado de anos de experiência unindo tecnologia de ponta com a realidade bruta das oficinas mecânicas brasileiras."
    },
    {
      id: 'whatsapp',
      keywords: ['whatsapp', 'zap', 'mensagem', 'notificação', 'enviar', 'automático', 'link'],
      response: "Nossa tecnologia de **WhatsApp Automático** funciona como um funcionário que nunca dorme. O sistema envia lembretes de revisão, orçamentos para aprovação via link e avisos de veículo pronto direto para o celular do seu cliente, sem você precisar digitar nada."
    },
    {
      id: 'pricing',
      keywords: ['preço', 'valor', 'custo', 'pagar', 'plano', 'mensalidade', 'investimento', 'grátis', 'teste'],
      response: "O MecaERP é um investimento que se paga sozinho. Temos planos a partir de **R$ 197/mês**. O mais incrível? Você pode testar todas as funcionalidades por **14 dias GRATUITAMENTE**, sem precisar colocar cartão de crédito. Quer começar seu teste agora?"
    },
    {
      id: 'checklist',
      keywords: ['checklist', 'vistoria', 'fotos', 'entrada', 'risco', 'avaria', 'segurança', 'laudo'],
      response: "Com o **Checklist HD**, você blinda sua oficina. Tire fotos de todos os ângulos no app, registre avarias e gere um laudo que o cliente assina digitalmente. Acabe de vez com discussões sobre riscos ou danos que já estavam no veículo."
    },
    {
      id: 'finance',
      keywords: ['financeiro', 'lucro', 'caixa', 'contas', 'dinheiro', 'margem', 'estoque', 'relatório'],
      response: "Nosso **Financeiro Master** foi desenhado para quem quer ser dono, não funcionário da oficina. Você terá controle total: margem de lucro por serviço, fluxo de caixa em tempo real e gestão de estoque inteligente. Você vai saber exatamente onde está o seu dinheiro."
    },
    {
      id: 'setup',
      keywords: ['instalar', 'configurar', 'difícil', 'ajuda', 'suporte', 'treinamento', 'começar'],
      response: "É extremamente simples! O sistema é 100% online (nuvem). Você começa a usar em menos de 5 minutos. Além disso, temos um **time de suporte humano** via WhatsApp pronto para te ajudar em cada passo do caminho."
    }
  ];

  const genericResponses = {
    greeting: [
      "Olá! Como posso acelerar sua oficina hoje?",
      "Opa! Tudo certo? Sou o MecaAI, em que posso ajudar?",
      "Salve! Pronto para deixar a concorrência para trás com o MecaERP?",
      "Oi! É um prazer conversar com você. Qual sua dúvida sobre o sistema?"
    ],
    thanks: [
      "Por nada! Estou aqui para o que precisar.",
      "Tamo junto! Vamos pra cima!",
      "É um prazer ajudar. Tem mais alguma dúvida sobre nossas ferramentas?",
      "Show de bola! O MecaERP é isso aí: agilidade e lucro."
    ],
    offTopic: "Hmm, entendi! Como sou o **Especialista Digital do MecaERP**, meu foco total é ajudar você a dominar a gestão da sua oficina. \n\nQue tal falarmos sobre **WhatsApp Automático**, **Lucratividade** ou **Checklist Digital**? Qual desses te interessa agora?"
  };

  const processAIResponse = (input: string) => {
    const text = input.toLowerCase();
    
    // 1. Check for Greetings
    if (['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'eai', 'opa'].some(g => text.startsWith(g) && text.length < 15)) {
      return genericResponses.greeting[Math.floor(Math.random() * genericResponses.greeting.length)];
    }

    // 2. Check for Thanks
    if (['valeu', 'vlw', 'obrigado', 'obrigada', 'obgd', 'show', 'top'].some(t => text.includes(t))) {
      return genericResponses.thanks[Math.floor(Math.random() * genericResponses.thanks.length)];
    }

    // 3. Intent Scoring System (Mini-NLP)
    let bestIntent = null;
    let highestScore = 0;

    intents.forEach(intent => {
      let score = 0;
      intent.keywords.forEach(key => {
        if (text.includes(key)) score += 1;
      });
      if (score > highestScore) {
        highestScore = score;
        bestIntent = intent;
      }
    });

    if (highestScore > 0 && bestIntent) {
      return (bestIntent as any).response;
    }

    // 4. Default Off-Topic Guardrail
    return genericResponses.offTopic;
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    
    setMessages(prev => [...prev, { text, isBot: false }]);
    setInputValue('');
    setIsTyping(true);
    
    // Simulação de processamento neural variável
    const processDelay = Math.min(800 + text.length * 15, 2000);
    
    setTimeout(() => {
      const response = processAIResponse(text);
      setMessages(prev => [...prev, { text: response, isBot: true }]);
      setIsTyping(false);
    }, processDelay);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[2000] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            className="mb-4 w-[350px] sm:w-[440px] bg-white rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.25)] border border-slate-100 overflow-hidden flex flex-col"
          >
            {/* Neural Header */}
            <div className="bg-[#050510] p-7 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 blur-[80px] -z-0" />
               <div className="flex items-center gap-5 relative z-10">
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-700 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <Brain size={28} className="text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-[#050510] rounded-full animate-pulse shadow-[0_0_10px_#34d399]" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-base font-black tracking-tight mb-1 flex items-center gap-2">
                       MecaAI <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-blue-400 uppercase tracking-widest border border-white/5">Neural Ultra</span>
                    </h4>
                    <div className="flex items-center gap-1.5 opacity-60">
                       <Zap size={10} className="text-blue-400" />
                       <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Engine v4.2 Online</span>
                    </div>
                  </div>
               </div>
               <button onClick={() => setIsOpen(false)} className="absolute top-7 right-7 text-white/30 hover:text-white transition-colors">
                  <X size={20} />
               </button>
            </div>

            {/* Neural Load Indicator */}
            <div className="h-0.5 bg-white/5 overflow-hidden">
               {isTyping && (
                 <motion.div 
                   initial={{ x: "-100%" }}
                   animate={{ x: "100%" }}
                   transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                   className="h-full w-1/3 bg-gradient-to-r from-transparent via-blue-500 to-transparent" 
                 />
               )}
            </div>

            {/* Chat Flow */}
            <div 
              ref={scrollRef}
              className="h-[430px] overflow-y-auto p-7 space-y-7 bg-[#F9FBFF] scrollbar-thin scrollbar-thumb-slate-200"
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={`flex ${msg.isBot ? 'justify-start text-left' : 'justify-end text-right'}`}
                >
                  <div className={`flex gap-4 max-w-[90%] ${msg.isBot ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center mt-1 shadow-sm border ${
                      msg.isBot ? 'bg-white border-slate-100 text-blue-600' : 'bg-slate-900 border-slate-800 text-white'
                    }`}>
                      {msg.isBot ? <Bot size={18} /> : <User size={18} />}
                    </div>
                    <div>
                      <div className={`p-4 rounded-2xl text-[13px] font-medium leading-[1.6] shadow-sm whitespace-pre-wrap ${
                        msg.isBot 
                        ? 'bg-white text-slate-700 border border-slate-100 rounded-tl-none' 
                        : 'bg-slate-900 text-white rounded-tr-none'
                      }`}>
                         {msg.text.split('**').map((part, index) => (
                           index % 2 === 1 ? <strong key={index} className="text-blue-600 font-black">{part}</strong> : part
                         ))}
                      </div>
                      {msg.isBot && <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-2 ml-1">Processado por Cluster-Develoi</div>}
                    </div>
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start pl-13">
                  <div className="bg-white px-5 py-4 rounded-2xl border border-slate-100 flex gap-2 items-center shadow-lg shadow-slate-200/50">
                    <span className="text-[10px] font-black text-blue-600/50 uppercase tracking-widest animate-pulse">Analisando intenção...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic Intelligence Chips */}
            <div className="p-5 border-t border-slate-100 bg-white">
               <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none items-center">
                  <Sparkles size={14} className="text-blue-500 shrink-0" />
                  {['Quem é o Eduardo Eloi?', 'WhatsApp Automático', 'Teste Grátis', 'Checklist HD'].map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(q)}
                      className="whitespace-nowrap px-4 py-2 bg-slate-50 hover:bg-blue-600 text-slate-600 hover:text-white text-[10px] font-black rounded-xl border border-slate-100 hover:border-blue-600 transition-all uppercase tracking-tighter"
                    >
                      {q}
                    </button>
                  ))}
               </div>
            </div>

            {/* Neural Input */}
            <div className="p-5 bg-white border-t border-slate-100">
              <div className="relative group">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend(inputValue)}
                  placeholder="Busque por funções, preços ou suporte..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 pr-16 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 transition-all text-slate-700"
                />
                <button
                  onClick={() => handleSend(inputValue)}
                  disabled={!inputValue.trim() || isTyping}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-11 h-11 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-20 transition-all shadow-lg shadow-blue-500/30"
                >
                  <Send size={20} />
                </button>
              </div>
              <p className="mt-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                 <ShieldCheck size={12} className="text-emerald-500" /> Powered by Develoi Soluções Digitais
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Sparkle Pulse Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-18 h-18 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white shadow-[0_30px_70px_rgba(0,0,0,0.5)] hover:scale-105 active:scale-95 transition-all group relative overflow-hidden"
        style={{ width: '4.5rem', height: '4.5rem' }}
      >
        <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        {isOpen ? <X size={32} /> : (
          <div className="relative">
            <Brain size={32} className="relative z-10" />
            <motion.div 
              animate={{ scale: [1, 1.4, 1], opacity: [0, 0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 bg-blue-500 rounded-full blur-xl"
            />
          </div>
        )}
      </button>
    </div>
  );
};

export default LandingChatBot;
