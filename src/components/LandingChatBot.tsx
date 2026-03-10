import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Bot, Sparkles, User, Brain, Cpu, MessageCircle, ExternalLink, ChevronRight, ShieldCheck, Zap, BarChart3, Clock, BadgeCheck, HelpCircle, HardDrive, Share2, Rocket } from 'lucide-react';

// Algoritmo de Distância de Levenshtein (Para detectar erros de digitação com precisão)
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
      id: 'who_am_i',
      keywords: ['quem e voce', 'quem e vc', 'seu nome', 'o que voce e', 'quem fala', 'identidade', 'voce e humano', 'ia', 'bot', 'robô'],
      response: "Eu sou o **MecaAI**, a Inteligência Especializada em Gestão Automotiva do MecaERP. \n\nFui treinado para conhecer cada detalhe do sistema e ajudar donos de oficinas a dominarem seus negócios. Fui desenvolvido pela **Develoi**, sob a engenharia do **Eng. Eduardo Eloi**. Como posso te ajudar agora?",
    },
    {
      id: 'develoi_eduardo',
      keywords: ['quem criou', 'quem desenvolveu', 'dono', 'develoi', 'quem e eduardo', 'eduardo eloi', 'criador', 'equipe develoi', 'empresa', 'fundador', 'quem fez'],
      response: "O MecaERP é a maior inovação da **Develoi Soluções Digitais**, liderada pelo **Eng. Eduardo Eloi**. Nossa equipe criou este ecossistema para elevar o nível das oficinas mecânicas no Brasil. Quer saber mais sobre nossa tecnologia?",
    },
    {
      id: 'plan_start',
      keywords: ['plano start', 'plano de 197', 'o que tem no start', 'funcionalidades start', 'inicio', 'basico', 'essencial'],
      response: "O **Plano Start (R$ 197/mês)** é perfeito para quem está começando a digitalizar a oficina. \n\nEle inclui:\n• Gestão Completa de OS\n• Controle Financeiro Essencial\n• Gestão de Clientes e Veículos\n• Dashboard de Vendas\n\nDeseja testar o Start agora por **14 dias grátis**?",
      hasAction: true,
      actionLabel: "Testar Start Grátis",
      actionType: 'link',
      url: '/register'
    },
    {
      id: 'plan_pro',
      keywords: ['plano pro', 'plano de 297', 'o que tem no pro', 'melhor plano', 'recomendado', 'completo', 'favorito', 'mais vendido'],
      response: "O **Plano Pro (R$ 297/mês)** é o nosso campeão de vendas! \n\nAlém de tudo do Start, ele libera:\n• **Integração total com WhatsApp**\n• **Checklist Digital HD (Fotos)**\n• Relatórios de Lucratividade Avançados\n• Controle de Estoque de Precisão\n\nÉ o plano ideal para quem quer escala. Quer ver o Pro em ação?",
    },
    {
      id: 'plan_elite',
      keywords: ['plano elite', 'plano de 497', 'o que tem no elite', 'multi-oficinas', 'corporativo', 'grande porte'],
      response: "O **Plano Elite (R$ 497/mês)** é para quem domina o mercado. \n\nEle inclui todas as funções e suporte prioritário, sendo otimizado para **grandes centros automotivos** ou **redes de oficinas**. Gestão de elite para resultados de elite.",
    },
    {
      id: 'pricing',
      keywords: ['preco', 'valor', 'quanto custa', 'mensalidade', 'plano', 'assinatura', 'pagar', 'comprar', 'custo', 'tabela', 'valores', 'cobrança', 'preços'],
      response: "Nossos planos são transparentes e sem fidelidade:\n\n• **Start:** R$ 197\n• **Pro:** R$ 297 (Recomendado)\n• **Elite:** R$ 497\n\nTodos com **14 dias grátis**. Qual desses faz mais sentido para o seu pátio hoje?",
    },
    {
      id: 'contact',
      keywords: ['contato', 'whatsapp', 'zap', 'telefone', 'falar com humano', 'suporte', 'atendimento', 'vendedor', 'comercial', 'numero', 'ajuda', 'socorro', 'equipe', 'pessoal', 'gente', 'falar com alguem', 'pessoa real'],
      response: "Nada supera o olho no olho. Chame nossa equipe de especialistas agora mesmo pelo WhatsApp (**15 99811-8548**). \n\nQuer que eu abra a conversa no seu celular agora?",
      hasAction: true,
      actionLabel: "Falar com Humano Agora",
      actionMsg: "Olá! O MecaAI me recomendou falar com vocês. Gostaria de uma consultoria personalizada."
    },
    {
      id: 'whatsapp_automation',
      keywords: ['whatsapp', 'zap', 'notificacao', 'automacao', 'mensagem', 'enviar', 'agendamento', 'aviso', 'revisao', 'status', 'comando', 'aprovar', 'chatbot', 'integracao zap'],
      response: "A automação de WhatsApp do MecaERP envia **Orçamentos**, avisos de **veículo pronto** e **lembretes de manutenção** automaticamente. É o sistema trabalhando enquanto você foca no pátio. Isso aumenta sua conversão em até 35%!",
    },
    {
      id: 'checklist_hd',
      keywords: ['checklist', 'vistoria', 'fotos', 'avaria', 'risco', 'danos', 'carro', 'entrada', 'laudo', 'vistoriar', 'blindagem', 'fotos entrada'],
      response: "Com o **Checklist HD**, você blinda sua oficina. Tire fotos das avarias na entrada e o cliente assina digitalmente no celular. Laudo oficial inalterável com carimbo MecaERP. Segurança jurídica total para você e seu cliente.",
    },
    {
      id: 'finance_master',
      keywords: ['financeiro', 'lucro', 'caixa', 'pagamento', 'contas', 'dfc', 'margem', 'quanto ganhei', 'dinheiro', 'finance', 'estoque', 'fluxo', 'lucratividade', 'contas a pagar'],
      response: "O **Financeiro Master** é focado em lucro real. Você tem DFC (Fluxo de Caixa) automático e sabe a margem de contribuição de cada OS. Gestão financeira de nível profissional para sua oficina parar de queimar dinheiro.",
    },
    {
      id: 'security_cloud',
      keywords: ['segurança', 'protecao', 'hack', 'perder dados', 'nuvem', 'backup', 'lgpd', 'criptografia', 'estabilidade', 'confiavel', 'onde ficam dados', 'aws', 'amazon'],
      response: "Segurança de banco: Seus dados estão na **AWS (Amazon)** com criptografia **AES-256** e backups de hora em hora. Total conformidade com a **LGPD**. Estabilidade de 99.9% para você nunca ficar na mão.",
    },
    {
      id: 'tech_info',
      keywords: ['tecnologia', 'stack', 'react', 'node', 'banco de dados', 'backend', 'frontend', 'prisma', 'postgres', 'como foi feito', 'linguagem', 'arquitetura'],
      response: "Somos tecnologia de ponta: **React 18** no frontend, **Node.js** com **Prisma** no back e banco **PostgreSQL**. A mesma stack usada pelas maiores techs do mundo, agora na sua oficina.",
    },
    {
      id: 'frustration_recovery',
      keywords: ['viajando', 'burra', 'nao entende', 'errado', 'ruim', 'nao faz sentido', 'horrivel', 'lixo', 'pessimo', 'fraco', 'fraca', 'ta ruim', 'mal feita'],
      response: "Desculpe pelo transtorno! 🧠 Estou em treinamento neural constante. \n\nComo sou uma inteligência focada exclusivamente no **universo MecaERP**, posso ter falhado na interpretação. Que tal falarmos sobre **Checklist HD** ou **WhatsApp Automático**? Ou se preferir, te chamo um humano agora!",
    }
  ];

  const processResponse = (input: string) => {
    const textOriginal = input.trim();
    const text = textOriginal.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (!text) return { text: "" };

    // 1. Saudações e Comandos Curtos
    const directGreetings = ['oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'eai', 'opa', 'blz', 'tudo bem', 'fala', 'e ai'];
    if (directGreetings.includes(text)) {
      setLastIntent(null);
      return { text: "Olá! Sou o **MecaAI**, inteligência neural da Develoi. Como posso acelerar o sucesso da sua oficina hoje?" };
    }

    // 2. Confirmações Contextuais (Sim/Não)
    if (['sim', 'quero', 'quero sim', 'pode ser', 'manda', 'bora', 'falar', 'confirmar', 'ok', 'certeza'].includes(text)) {
      if (lastIntent === 'contact') {
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá! O MecaAI me recomendou falar com vocês. Gostaria de uma consultoria personalizada.")}`, '_blank');
        return { text: "Perfeito! Estou te encaminhando para o WhatsApp da nossa equipe. Verifique a nova aba que abriu!" };
      }
      return { text: "Ótimo! Escolha um desses tópicos para começarmos agora ou me conte seu desafio:", showTopics: true };
    }

    // 3. Motor Neural de Scoring (Poder Superior)
    let winner: any = null;
    let highestScore = 0;

    knowledgeBase.forEach(item => {
      let score = 0;
      item.keywords.forEach(keyword => {
        const k = keyword.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        // Peso 1: Match Exato
        if (text === k) score += 30;
        
        // Peso 2: Contém a palavra chave exata
        else if (text.includes(k)) score += 15;
        
        // Peso 3: Fuzzy Match (Levenshtein) para cada palavra do input
        else {
          const inputWords = text.split(' ');
          inputWords.forEach(word => {
            if (word.length > 3 && k.length > 3) {
              const dist = getLevenshteinDistance(word, k);
              // Se a distância for pequena em relação ao tamanho da palavra
              if (dist <= 1 || (word.length > 6 && dist <= 2)) {
                score += 10;
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

    // Se o score for alto o suficiente, retorna a resposta
    if (highestScore > 10 && winner) {
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

    // 4. Fallback com Sugestões Inteligentes
    setLastIntent(null);
    return { 
      text: "Entendi o ponto! Mas lembre-se: sou uma inteligência focada exclusivamente no ecossistema **MecaERP**. \n\nPosso te falar sobre **Planos**, **WhatsAppAutomático** ou **Dashboard de Lucro**. O que você deseja descobrir?",
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
            {/* Elite Deep Header */}
            <div className="bg-[#0f172a] p-6 text-white relative flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Brain size={28} className="text-white" />
                </div>
                <div>
                  <h4 className="text-[15px] font-black tracking-tighter uppercase leading-none mb-1.5 font-primary">MecaAI Neural</h4>
                  <div className="flex items-center gap-1.5 leading-none">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_12px_#34d399]" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Core V5.6 Online</span>
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
                        {['Qual o melhor plano?', 'Módulo de WhatsApp', 'Lucratividade Real', 'Falar com Equipe'].map((topic, idx) => (
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

            {/* AI Capability Chips */}
            <div className="px-5 py-4 bg-white border-t border-slate-100">
               <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { label: 'O Melhor Plano', icon: <Rocket size={12} /> },
                    { label: 'Plano Start', icon: <Zap size={12} /> },
                    { label: 'Lucratividade', icon: <BarChart3 size={12} /> },
                    { label: 'Suporte VIP', icon: <HelpCircle size={12} /> }
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

            {/* Neural Command Interface */}
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
                  <Send size={26} />
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between px-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-60">
                 <div className="flex items-center gap-2">
                    <BadgeCheck size={12} className="text-emerald-500" /> Neural System 5.6
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
