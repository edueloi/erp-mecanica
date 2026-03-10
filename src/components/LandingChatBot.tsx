import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Bot, Sparkles, User, Brain, Cpu, MessageCircle, ExternalLink, ChevronRight, ShieldCheck, Zap, BarChart3, Clock, BadgeCheck, HelpCircle, HardDrive, Share2, Rocket } from 'lucide-react';

// Algoritmo de Distância de Levenshtein (Para detectar erros de digitação com precisão)
const getLevenshteinDistance = (s1: string, s2: string) => {
  const len1 = s1.length;
  const len2 = s2.length;
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
    { text: "Olá! Sou o **MecaAI**, consultor neural do MecaERP. \n\nPosso te ajudar com dúvidas sobre **planos**, **integrações**, **segurança**, ou como o sistema pode **triplicar sua lucratividade**. Como posso ser útil?", isBot: true }
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

  const knowledgeBase = [
    {
      id: 'best_plan',
      keywords: ['melhor plano', 'qual escolher', 'recomenda', 'indicado', 'ideal', 'mais vendido', 'qual o melhor', 'indicação', 'qual voce prefere', 'qual o mais completo'],
      response: "Sem dúvida, o **Plano PRO** é a nossa recomendação! \n\nEle é o mais vendido porque já inclui a **Integração total com WhatsApp** e o **Checklist Digital HD**. É o motor ideal para quem quer profissionalizar a oficina e escalar o lucro. Deseja conhecer os valores dos nossos planos?",
    },
    {
      id: 'pricing',
      keywords: ['preco', 'valor', 'quanto custa', 'mensalidade', 'plano', 'assinatura', 'pagar', 'comprar', 'custo', 'tabela', 'valores', 'cobrança'],
      response: "Trabalhamos com transparência máxima:\n\n• **Start:** R$ 197/mês (Essencial para começar)\n• **Pro:** R$ 297/mês (O mais completo/RECOMENDADO)\n• **Elite:** R$ 497/mês (Para quem já é gigante)\n\nLembrando: Você tem **14 dias de teste grátis** sem precisar de cartão! Qual desses planos te atende agora?",
    },
    {
      id: 'contact',
      keywords: ['contato', 'whatsapp', 'zap', 'telefone', 'falar com humano', 'suporte', 'atendimento', 'vendedor', 'comercial', 'numero', 'ajuda', 'socorro', 'equipe', 'pessoal', 'gente', 'falar com alguem', 'pessoa real'],
      response: "Com certeza! Falar com a nossa equipe é muito fácil. Você pode chamar agora mesmo no WhatsApp oficial da Develoi: (**15 99811-8548**). \n\nQuer que eu abra o seu WhatsApp agora para você tirar suas dúvidas com um consultor humano?",
      hasAction: true,
      actionLabel: "Chamar no WhatsApp agora",
      actionMsg: "Olá! Vim do site MecaERP e gostaria de falar com um consultor humano!"
    },
    {
      id: 'whatsapp_automation',
      keywords: ['whatsapp', 'zap', 'notificacao', 'automacao', 'mensagem', 'enviar', 'agendamento', 'aviso', 'revisao', 'status', 'comando', 'aprovar', 'chatbot', 'integracao zap'],
      response: "A automação de WhatsApp do MecaERP é como ter um funcionário extra. Ela envia **Orçamentos**, avisos de **veículo pronto** e **lembretes de manutenção** automaticamente. O cliente aprova pelo celular e você ganha tempo. Quer ver como funciona?",
    },
    {
      id: 'checklist_hd',
      keywords: ['checklist', 'vistoria', 'fotos', 'avaria', 'risco', 'danos', 'carro', 'entrada', 'laudo', 'vistoriar', 'blindagem', 'fotos entrada'],
      response: "O **Checklist HD** é a sua blindagem jurídica. Com ele, você tira fotos das avarias na entrada e o cliente assina digitalmente no celular. Fica tudo registrado no sistema com fotos e laudos inalteráveis. Acabe com prejuízos injustos!",
    },
    {
      id: 'finance_master',
      keywords: ['financeiro', 'lucro', 'caixa', 'pagamento', 'contas', 'dfc', 'margem', 'quanto ganhei', 'dinheiro', 'finance', 'estoque', 'fluxo', 'lucratividade', 'contas a pagar'],
      response: "O **Financeiro Master** é o cérebro da lucratividade. Você tem fluxo de caixa (DFC), controle de estoque integrado e sabe exatamente o lucro real de cada centavo que entra na oficina. Gestão de precisão absoluta.",
    },
    {
      id: 'security_cloud',
      keywords: ['segurança', 'protecao', 'hack', 'perder dados', 'nuvem', 'backup', 'lgpd', 'criptografia', 'estabilidade', 'confiavel', 'onde ficam dados', 'aws'],
      response: "Segurança é prioridade total. Seus dados estão na **AWS (Amazon Web Services)** com criptografia de ponta e backups realizados a cada hora. Total conformidade com a **LGPD**. Você nunca mais perde um dado sequer.",
    },
    {
      id: 'tech_info',
      keywords: ['tecnologia', 'stack', 'react', 'node', 'banco de dados', 'backend', 'frontend', 'prisma', 'postgres', 'como foi feito', 'linguagem', 'arquitetura'],
      response: "O MecaERP foi construído com as tecnologias mais potentes do mercado: **React 18** no frontend, **Node.js** no backend e banco de dados **PostgreSQL**. Engenharia de software de elite para rodar na sua oficina.",
    },
    {
      id: 'develoi_eduardo',
      keywords: ['quem e eduardo', 'eduardo eloi', 'quem criou', 'quem desenvolveu', 'dono', 'develoi', 'criador', 'equipe develoi', 'empresa', 'fundador'],
      response: "O MecaERP é desenvolvido pela **Develoi Soluções Digitais**, sob a engenharia do **Eng. Eduardo Eloi**. Nossa missão é aplicar o máximo de inteligência tecnológica para transformar o seu negócio automotivo.",
    },
    {
      id: 'help_options',
      keywords: ['ajuda', 'ajda', 'help', 'como funciona', 'me ajuda', 'duvida', 'pergunta', 'opcoes'],
      response: "Estou aqui para te guiar! \n\nPosso te falar sobre nossos **Planos**, a **Integração com WhatsApp**, o **Checklist Digital** ou sobre o **Financeiro Master**. O que você deseja descobrir agora?",
      showTopics: true
    },
    {
      id: 'frustration_recovery',
      keywords: ['viajando', 'burra', 'nao entende', 'errado', 'ruim', 'nao faz sentido', 'horrivel', 'lixo', 'pessimo', 'fraco', 'fraca'],
      response: "Poxa, sinto muito! 🧠 Como sou uma inteligência neural focada 100% no **MecaERP**, às vezes posso me confundir com contextos informais. \n\nQue tal falarmos sobre como o MecaERP pode **aumentar seu faturamento em até 40%**? Ou prefere falar com um consultor humano?",
    }
  ];

  const processResponse = (input: string) => {
    const text = input.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (!text) return { text: "" };

    // 1. Respostas Diretas / Saudações
    const directGreetings = ['oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'eai', 'opa', 'blz', 'tudo bem', 'fala', 'e ai'];
    if (directGreetings.includes(text)) {
      setLastIntent(null);
      return { text: "Olá! MecaAI online. Como posso acelerar o sucesso da sua oficina mecânica hoje?" };
    }

    // 2. Confirmações Contextuais (Sim/Não)
    if (['sim', 'quero', 'quero sim', 'pode ser', 'manda', 'bora', 'falar', 'confirmar'].includes(text)) {
      if (lastIntent === 'contact') {
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá! Gostaria de falar com um consultor sobre o MecaERP.")}`, '_blank');
        return { text: "Perfeito! Estou te encaminhando para o WhatsApp da nossa equipe. Verifique a nova aba que abriu!" };
      }
      return { text: "Ótimo! Escolha um desses tópicos para começarmos agora:", showTopics: true };
    }

    // 3. Sistema Neural de Scoring (Busca a melhor intenção)
    let winner: any = null;
    let highestScore = 0;

    knowledgeBase.forEach(item => {
      let score = 0;
      item.keywords.forEach(keyword => {
        const k = keyword.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        // Match Exato (Peso Máximo)
        if (text === k) score += 20;
        else if (text.includes(k)) score += 10;
        else {
          // Busca Fuzzy (Levenshtein) para cada palavra
          text.split(' ').forEach(word => {
            if (word.length > 3 && k.length > 3) {
              const dist = getLevenshteinDistance(word, k);
              if (dist <= 1) score += 5;
            }
          });
        }
      });
      
      if (score > highestScore) {
        highestScore = score;
        winner = item;
      }
    });

    if (highestScore > 0 && winner) {
      setLastIntent(winner.id);
      return { 
        text: winner.response, 
        hasAction: winner.hasAction,
        actionLabel: winner.actionLabel,
        onAction: () => window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(winner.actionMsg)}`, '_blank'),
        showTopics: winner.showTopics
      };
    }

    // 4. Default: Encaminhamento Inteligente
    setLastIntent(null);
    return { 
      text: "Entendi o ponto! Mas lembre-se: sou uma IA focada no ecossistema **MecaERP**. \n\nDeseja falar sobre **Planos**, **WhatsAppAutomático** ou **Gestão Financeira**? Ou prefere um **Suporte Humano**?",
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
    }, 900);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[2000] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="mb-4 w-[calc(100vw-3rem)] sm:w-[380px] bg-white rounded-[2.5rem] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.3)] border border-slate-200 overflow-hidden flex flex-col"
          >
            {/* Dark Elite Header */}
            <div className="bg-[#0f172a] p-6 text-white relative flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Brain size={26} className="text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-black tracking-tighter uppercase leading-none mb-1.5 font-primary">MecaAI PRO</h4>
                  <div className="flex items-center gap-1.5 leading-none">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Neural Mode Active</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white"
              >
                <X size={22} />
              </button>
            </div>

            {/* Neural Chat Stream */}
            <div 
              ref={scrollRef}
              className="h-[400px] overflow-y-auto p-6 space-y-7 bg-[#F9FBFF] scroll-smooth scrollbar-thin scrollbar-thumb-slate-200"
            >
              {messages.map((msg: any, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.isBot ? 'justify-start text-left' : 'justify-end text-right'}`}
                >
                  <div className={`p-4 rounded-2xl text-[14px] font-medium leading-relaxed shadow-[0_8px_30px_rgba(0,0,0,0.02)] ${
                    msg.isBot 
                    ? 'bg-white text-slate-800 rounded-tl-none border border-slate-100' 
                    : 'bg-blue-600 text-white rounded-tr-none'
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
                        {['Qual o melhor plano?', 'Módulo de WhatsApp', 'Controle Financeiro', 'Falar com Equipe'].map((topic, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSend(topic)}
                            className="w-full text-left py-3 px-4 bg-white border border-slate-100 rounded-xl text-blue-600 font-bold hover:bg-blue-50 transition-all flex items-center justify-between group shadow-sm"
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

            {/* Smart Capability Bar */}
            <div className="px-5 py-4 bg-white border-t border-slate-100">
               <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { label: 'O Melhor Plano', icon: <Rocket size={12} /> },
                    { label: 'Lucratividade', icon: <BarChart3 size={12} /> },
                    { label: 'Suporte VIP', icon: <HelpCircle size={12} /> },
                    { label: 'Cloud Safe', icon: <ShieldCheck size={12} /> }
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

            {/* Elite Command Line */}
            <div className="p-5 bg-white border-t border-slate-200">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend(inputValue)}
                  placeholder="Olá! Sou o MecaAI, sua ajuda agora..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4.5 text-[14px] font-semibold focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400 shadow-inner"
                />
                <button
                  onClick={() => handleSend(inputValue)}
                  disabled={!inputValue.trim() || isTyping}
                  className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-20 transition-all shadow-2xl shrink-0 shadow-blue-600/40 active:scale-90"
                >
                  <Send size={24} />
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between px-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-60">
                 <div className="flex items-center gap-2">
                    <BadgeCheck size={12} className="text-emerald-500" /> Neural System 5.5
                 </div>
                 <div className="flex items-center gap-2">
                    <Zap size={12} className="text-blue-500" /> Powered by Develoi
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
