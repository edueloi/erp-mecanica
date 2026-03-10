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
    // ==========================================
    // 1. IDENTIDADE, APRESENTAÇÃO E CRIADORES
    // ==========================================
    {
      id: 'who_am_i',
      keywords: ['quem e voce', 'quem e vc', 'seu nome', 'o que voce e', 'quem fala', 'identidade', 'voce e humano', 'ia', 'bot', 'robô', 'inteligencia', 'chatbot'],
      response: "Eu sou o **MecaAI**, a Inteligência Especializada em Gestão Automotiva do MecaERP. \n\nFui treinado para conhecer cada detalhe do sistema e ajudar donos de oficinas a dominarem seus negócios. Como posso te ajudar a triplicar seus resultados hoje?",
    },
    {
      id: 'develoi_eduardo',
      keywords: ['quem criou', 'quem desenvolveu', 'dono', 'develoi', 'quem e eduardo', 'eduardo eloi', 'criador', 'equipe develoi', 'empresa', 'fundador', 'quem fez', 'quem é o dono'],
      response: "O MecaERP é a maior inovação da **Develoi Soluções Digitais**, liderada pelo **Eng. Eduardo Eloi**. Nossa equipe criou este ecossistema para elevar o nível das oficinas mecânicas e centros automotivos no Brasil. Quer saber mais sobre a nossa tecnologia?",
    },

    // ==========================================
    // 2. PLANOS, PREÇOS E UPGRADES
    // ==========================================
    {
      id: 'pricing_general',
      keywords: ['preco', 'valor', 'quanto custa', 'mensalidade', 'plano', 'assinatura', 'pagar', 'comprar', 'custo', 'tabela', 'valores', 'cobrança', 'preços', 'mensal', 'anual', 'planos', 'contratar'],
      response: "Nossos planos são transparentes, sem taxa de adesão e sem fidelidade:\n\n• **Start:** R$ 197/mês\n• **Pro:** R$ 297/mês (O mais vendido!)\n• **Elite:** R$ 497/mês\n\nTodos possuem **14 dias de teste grátis**. Gostaria de saber os detalhes de algum deles?",
      showTopics: true
    },
    {
      id: 'plan_comparison',
      keywords: ['diferenca entre planos', 'qual melhor para mim', 'comparar planos', 'versus', 'pro ou elite', 'start ou pro', 'qual a diferença', 'entender planos'],
      response: "A principal diferença está na **Automação**:\n\n• O **Start** foca na gestão básica (OS e Financeiro).\n• O **Pro** adiciona o **WhatsApp Automático** e o **Checklist HD** (fotos), que é onde você ganha escala.\n• O **Elite** é para redes de oficinas e centros de grande porte.\n\nPara a maioria das oficinas, o **PRO** é o que traz o melhor custo-benefício. Vamos testar o Pro?",
    },
    {
      id: 'upgrade_plan',
      keywords: ['quero aumentar', 'subir plano', 'mudar para pro', 'mudar para elite', 'quero o melhor', 'quero subir', 'fazer upgrade', 'mais recursos', 'liberar whatsapp'],
      response: "Excelente escolha! Subir de plano é o primeiro passo para escalar seu pátio. \n\nVocê pode fazer o upgrade direto no seu painel de configurações ou falar com nosso **Suporte Premium** que fazemos a migração de recursos na hora para você. Deseja falar com o suporte sobre o upgrade?",
      hasAction: true,
      actionLabel: "Falar sobre Upgrade",
      actionMsg: "Olá! Gostaria de fazer o upgrade do meu plano no MecaERP. Pode me ajudar?"
    },
    {
      id: 'plan_start',
      keywords: ['plano start', 'plano de 197', 'o que tem no start', 'funcionalidades start', 'inicio', 'basico', 'essencial', 'pobre', 'mais barato'],
      response: "O **Plano Start (R$ 197/mês)** é perfeito para quem quer organizar a casa. \n\nInclui:\n• Gestão Completa de Ordem de Serviço (OS)\n• Controle Financeiro Básico\n• Gestão de Clientes e Veículos\n• Dashboard de Vendas\n\nQuer começar seu **teste grátis de 14 dias** agora?",
      hasAction: true,
      actionLabel: "Testar Start Grátis",
      actionType: 'link',
      url: '/register'
    },
    {
      id: 'plan_pro',
      keywords: ['plano pro', 'plano de 297', 'o que tem no pro', 'melhor plano', 'recomendado', 'completo', 'favorito', 'mais vendido', 'plano profissional'],
      response: "O **Plano Pro (R$ 297/mês)** é o nosso campeão! Ele pega tudo do Start e adiciona os motores de crescimento:\n\n• **Integração total com WhatsApp**\n• **Checklist Digital HD (Fotos)**\n• Relatórios de Lucratividade Avançados\n• Controle de Estoque de Precisão\n\nÉ o plano ideal para quem quer escala e automação. Vamos testar?",
    },
    {
      id: 'plan_elite',
      keywords: ['plano elite', 'plano de 497', 'o que tem no elite', 'multi-oficinas', 'corporativo', 'grande porte', 'rede', 'top de linha'],
      response: "O **Plano Elite (R$ 497/mês)** é gestão de alto nível. \n\nAlém de todas as funções do Pro, ele é otimizado para **grandes centros automotivos** ou **redes de oficinas**, com suporte prioritário e recursos corporativos.",
    },

    // ==========================================
    // 3. ORDENS DE SERVIÇO (OS) E ORÇAMENTOS
    // ==========================================
    {
      id: 'work_orders_os',
      keywords: ['os', 'ordem de servico', 'abrir os', 'orcamento', 'orçamento', 'pdf', 'imprimir os', 'aprovar', 'reprovado', 'status os', 'enviar orcamento', 'kanban'],
      response: "A gestão de **Ordem de Serviço (OS)** do MecaERP é a mais rápida do mercado. Você cria orçamentos detalhados com peças e mão de obra, envia em PDF com a sua logo direto pro WhatsApp do cliente, e ele pode aprovar pelo celular! Você acompanha tudo por um painel Kanban (status visual).",
    },

    // ==========================================
    // 4. FINANCEIRO E LUCRATIVIDADE
    // ==========================================
    {
      id: 'finance_cashflow',
      keywords: ['financeiro', 'lucro', 'caixa', 'pagamento', 'contas', 'dfc', 'margem', 'quanto ganhei', 'dinheiro', 'finance', 'fluxo', 'lucratividade', 'faturamento', 'dre', 'resultado', 'balanço'],
      response: "Com o **Financeiro Master**, você para de 'achar' que tem lucro e passa a ter certeza. O sistema gera seu DRE e Fluxo de Caixa automaticamente. Você sabe exatamente qual a sua margem de lucro por peça, por serviço e por mecânico.",
    },
    {
      id: 'accounts_payable_receivable',
      keywords: ['contas a pagar', 'contas a receber', 'inadimplencia', 'fiado', 'boleto', 'recebimentos', 'pendencias', 'calote', 'devedores', 'cobrar cliente'],
      response: "Temos um controle rigoroso de **Contas a Pagar e Receber**. O sistema te avisa quem está devendo (fiado/pendente) e avisa os dias de pagar seus fornecedores. Chega de esquecer cobranças e tomar prejuízo por desorganização!",
    },
    {
      id: 'mechanic_commissions',
      keywords: ['comissao', 'mecanico', 'pagar funcionario', 'produtividade', 'porcentagem', 'funcionario', 'equipe', 'rateio', 'pagamento mecanico', 'holerite', 'produção'],
      response: "O cálculo de **Comissões** é 100% automático. Você configura a porcentagem de cada mecânico por serviço ou peça. No fim do período, o sistema cospe um relatório exato de quanto pagar para cada um. Acabou a briga na hora do acerto!",
    },

    // ==========================================
    // 5. ESTOQUE E FORNECEDORES
    // ==========================================
    {
      id: 'stock_management',
      keywords: ['estoque', 'pecas', 'inventario', 'faltando', 'compra', 'produto', 'codigo de barras', 'prateleira', 'quantidade mínima', 'curva abc', 'controle de pecas', 'entrada de mercadoria'],
      response: "O controle de **Estoque** avisa quando uma peça atingiu a quantidade mínima. Você gerencia o custo médio, usa leitor de código de barras e sabe exatamente onde está o seu dinheiro parado. Nunca mais perca venda por falta de filtro ou óleo!",
    },
    {
      id: 'suppliers_purchases',
      keywords: ['fornecedor', 'comprar peça', 'pedido de compra', 'autopeças', 'distribuidor', 'compras', 'entrada de nota', 'xml entrada', 'importar xml'],
      response: "Você pode cadastrar todos os seus **Fornecedores** e registrar Pedidos de Compra direto no sistema. Quando a peça chega, você dá entrada no estoque rapidamente importando o XML da nota, já atualizando as contas a pagar.",
    },

    // ==========================================
    // 6. CLIENTES, CRM E MARKETING
    // ==========================================
    {
      id: 'client_crm',
      keywords: ['cliente', 'cadastro', 'crm', 'historico do cliente', 'fidelização', 'aniversario', 'marketing', 'vender mais', 'lembrar cliente', 'pós venda'],
      response: "O MecaERP é também um **CRM Automotivo**. Você tem o cadastro completo do cliente, sabe quantas vezes ele veio e quanto já gastou. O sistema pode enviar mensagens de aniversário e promoções, fidelizando seu cliente para sempre.",
    },

    // ==========================================
    // 7. VEÍCULOS, CHECKLIST E GARANTIA
    // ==========================================
    {
      id: 'vehicle_history',
      keywords: ['historico', 'placa', 'o que foi feito', 'fipe', 'veiculo', 'carro', 'busca placa', 'manutencao anterior', 'frota', 'ficha do carro'],
      response: "Nós temos **Busca Inteligente por Placa**! Você digita a placa e puxa os dados na hora. Além disso, o histórico do veículo é eterno: saiba exatamente qual óleo foi colocado no carro do cliente há 2 anos atrás com um clique.",
    },
    {
      id: 'checklist_hd',
      keywords: ['checklist', 'vistoria', 'fotos', 'avaria', 'risco', 'danos', 'carro', 'entrada', 'laudo', 'vistoriar', 'blindagem', 'fotos entrada', 'estado do carro', 'conferência'],
      response: "Com o **Checklist HD**, você blinda sua oficina contra clientes mal-intencionados. Fotografe riscos, painel e avarias na entrada. O cliente assina digitalmente no celular dele. É um laudo profissional e inalterável.",
    },
    {
      id: 'warranty_terms',
      keywords: ['garantia', 'termo', 'retorno', 'defeito', 'peca com defeito', 'rm', 'rma', 'tempo de garantia', 'vencimento', 'certificado'],
      response: "Gerencie as **Garantias** sem dor de cabeça. O sistema emite o Termo de Garantia para o cliente assinar e te avisa se um veículo voltar dentro do prazo estipulado. Controle rigoroso de retornos de oficina.",
    },

    // ==========================================
    // 8. WHATSAPP E AUTOMAÇÃO
    // ==========================================
    {
      id: 'whatsapp_automation',
      keywords: ['whatsapp', 'zap', 'notificacao', 'automacao', 'mensagem', 'enviar', 'aviso', 'revisao', 'status', 'bot', 'integracao zap', 'avisar cliente', 'mensagem automatica', 'aprovar zap'],
      response: "O MecaERP tem um **Motor de WhatsApp Integrado**! Ele envia automações como:\n• Link da OS para aprovação\n• Aviso de 'Veículo Pronto para Retirada'\n• Lembretes de revisão futura (ex: troca de correia daqui 6 meses).\n\nEle vende por você!",
    },

    // ==========================================
    // 9. AGENDA E PRODUTIVIDADE
    // ==========================================
    {
      id: 'scheduling_agenda',
      keywords: ['agendamento', 'calendario', 'marcar', 'reserva', 'horario', 'agenda', 'box', 'elevador', 'planejamento', 'tempo', 'ocupação'],
      response: "A **Agenda Inteligente** organiza sua oficina. Você marca horários, define em qual elevador/box o carro vai ficar e aloca o mecânico. Acabou a fila de espera e a desorganização no pátio!",
    },

    // ==========================================
    // 10. FISCAL E NFE/NFSE
    // ==========================================
    {
      id: 'nfe_taxes',
      keywords: ['nota fiscal', 'nfe', 'nfse', 'imposto', 'fiscal', 'emitir nota', 'xml', 'contador', 'contabilidade', 'cupom', 'sat', 'tributo', 'nf', 'sefaz'],
      response: "Emitimos **Notas Fiscais de Serviço (NFSe)** e de **Produtos (NFe/NFCe)**! Com um clique dentro da OS, a nota é gerada, autorizada pela SEFAZ e os XMLs já ficam disponíveis para você enviar para o seu contador. Sem retrabalho.",
    },

    // ==========================================
    // 11. DADOS, SUPORTE E SEGURANÇA
    // ==========================================
    {
      id: 'data_migration',
      keywords: ['migrar', 'outro sistema', 'importar', 'trazer dados', 'excel', 'planilha', 'mudar de sistema', 'cadastro antigo', 'backup antigo'],
      response: "Se você usa outro sistema ou planilhas, não se preocupe! Nós temos **Ferramentas de Importação** em lote. Você sobe suas planilhas de Clientes, Peças e Fornecedores e o MecaERP cadastra tudo em segundos.",
    },
    {
      id: 'support_onboarding',
      keywords: ['suporte', 'ajuda', 'treinamento', 'implantacao', 'como usar', 'duvida', 'video aula', 'aprender', 'dificil', 'facil', 'ensinar', 'atendimento'],
      response: "Temos um **Onboarding Especializado**. Nossa equipe pega na sua mão para implantar o sistema. Você terá tutoriais em vídeo, manuais e um suporte humano rápido via WhatsApp. O MecaERP foi feito para ser fácil!",
    },
    {
      id: 'security_cloud',
      keywords: ['segurança', 'protecao', 'hack', 'perder dados', 'nuvem', 'backup', 'lgpd', 'criptografia', 'estabilidade', 'confiavel', 'onde ficam dados', 'aws', 'amazon', 'internet', 'offline', 'seguro'],
      response: "O sistema roda 100% na nuvem, hospedado em servidores **AWS (Amazon)** — a mesma estrutura dos grandes bancos. Fazemos backups automatizados de hora em hora e tudo é criptografado seguindo as normas da **LGPD**. Você nunca vai perder seus dados.",
    },

    // ==========================================
    // 12. ELOGIOS E INTERAÇÕES POSITIVAS
    // ==========================================
    {
      id: 'praises',
      keywords: ['gostei', 'muito bom', 'parabens', 'parabéns', 'sensacional', 'incrível', 'incrivel', 'melhor sistema', 'top', 'amando', 'foda', 'show', 'legal', 'massa', 'perfeito'],
      response: "Ficamos extremamente felizes com seu feedback! 🚀 O MecaERP nasceu para transformar o mercado automotivo. \n\nQue tal levar esse entusiasmo para o seu pátio e começar hoje mesmo a triplicar seus resultados com a gente?",
      hasAction: true,
      actionLabel: "Começar Agora!",
      actionType: 'link',
      url: '/register'
    },

    // ==========================================
    // 13. CHINGAMENTOS E TRATAMENTO DE CONFLITO
    // ==========================================
    {
      id: 'insults_confrontation',
      keywords: ['burro', 'idiota', 'lixo', 'merda', 'caro', 'pessimo', 'pessimo', 'nao serve', 'ruim demais', 'horrivel', 'estupido', 'incompetente', 'fraco', 'caro demais'],
      response: "Poxa, lamento profundamente por essa impressão. 🧠 Como sou uma inteligência neural focada em **lucratividade e automação**, às vezes posso parecer limitada. \n\nPosso te transferir agora para um **Consultor Estratégico Humano** para resolvermos qualquer insatisfação que você tenha com o sistema ou valores. Pode ser?",
      hasAction: true,
      actionLabel: "Falar com Consultor Humano",
      actionMsg: "Olá, não estou satisfeito com o atendimento da IA e gostaria de falar com uma pessoa real."
    },

    // ==========================================
    // 14. VALOR DE NEGÓCIO E ROI
    // ==========================================
    {
      id: 'business_value_roi',
      keywords: ['vale a pena', 'por que contratar', 'lucratividade', 'venda', 'resultado', 'retorno', 'ganhar dinheiro', 'economizar tempo', 'oficina de elite', 'crescer oficina'],
      response: "O MecaERP não é um gasto, é um investimento com ROI rápido. \n\nNossos clientes relatam economia de **12 horas semanais** em burocracia e aumento de **30% no faturamento bruto** nos primeiros 3 meses devido à recuperação de orçamentos pelo WhatsApp e controle de estoque.",
    },

    // ==========================================
    // 15. DÚVIDAS TÉCNICAS RÁPIDAS
    // ==========================================
    {
      id: 'technical_stack_short',
      keywords: ['como foi feito', 'linguagem', 'programação', 'banco de dados', 'stack', 'tecnologia', 'react', 'node', 'prisma', 'postgres'],
      response: "Engenharia de elite: Usamos **Next.js/React** no front, **Node.js** no back e **PostgreSQL**. Tudo rodando em containers de alta performance. Tecnologia de ponta para sua oficina não parar nunca.",
    },

    // ==========================================
    // 16. CONTATO HUMANO E AÇÕES DE VENDA
    // ==========================================
    {
      id: 'contact',
      keywords: ['contato', 'falar com humano', 'atendimento', 'vendedor', 'comercial', 'numero', 'socorro', 'pessoal', 'gente', 'falar com alguem', 'pessoa real', 'consultor', 'telefone', 'chamar no zap', 'falar com equipe'],
      response: "A tecnologia é ótima, mas nada substitui uma boa conversa com um especialista. Chame nossa equipe comercial agora mesmo pelo WhatsApp (**15 99811-8548**). \n\nQuer que eu abra a conversa no seu celular ou computador agora?",
      hasAction: true,
      actionLabel: "Falar com Consultor no WhatsApp",
      actionMsg: "Olá! O MecaAI me atendeu no site e eu gostaria de falar com um especialista sobre o MecaERP."
    },

    // ==========================================
    // 17. FALLBACKS E TRATAMENTO DE ERROS
    // ==========================================
    {
      id: 'frustration_recovery',
      keywords: ['viajando', 'nao entende', 'errado', 'nao faz sentido', 'nao responde', 'nada a ver', 'que isso', 'o que voce disse'],
      response: "Peço sinceras desculpas. 🧠 Como sou uma inteligência artificial focada puramente em **MecaERP**, posso não ter compreendido o contexto.\n\nPara não tomar seu tempo, vou te transferir para a nossa equipe humana. Pode ser?",
      hasAction: true,
      actionLabel: "Falar com Humano",
      actionMsg: "Olá, o robô do site não conseguiu me entender direito. Quero tirar uma dúvida."
    }
  ];

  const processResponse = (input: string) => {
    const textOriginal = input.trim();
    const text = textOriginal.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (!text) return { text: "" };

    // 1. Saudações e Comandos Curtos
    const directGreetings = ['oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'eai', 'opa', 'blz', 'tudo bem', 'fala', 'e ai', 'hello'];
    if (directGreetings.includes(text)) {
      setLastIntent(null);
      return { text: "Olá! Sou o **MecaAI**, inteligência neural da Develoi. Como posso acelerar o sucesso da sua oficina hoje?" };
    }

    // 2. Confirmações Contextuais (Sim/Não)
    if (['sim', 'quero', 'quero sim', 'pode ser', 'manda', 'bora', 'falar', 'confirmar', 'ok', 'certeza', 'sim por favor', 'claro'].includes(text)) {
      if (lastIntent === 'contact' || lastIntent === 'upgrade_plan' || lastIntent === 'insults_confrontation') {
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
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Core V5.7 Online</span>
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
                    { label: 'Diferença Planos', icon: <Zap size={12} /> },
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
                    <BadgeCheck size={12} className="text-emerald-500" /> Neural System 5.7
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
