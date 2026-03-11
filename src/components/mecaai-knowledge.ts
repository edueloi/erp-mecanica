export interface KnowledgeItem {
  id: string;
  keywords: string[];
  response: string;
  hasAction?: boolean;
  actionLabel?: string;
  actionMsg?: string;
  actionType?: string;
  url?: string;
  showTopics?: boolean;
}

export const knowledgeBase: KnowledgeItem[] = [
  // ==========================================
  // 1. IDENTIDADE E CRIADORES
  // ==========================================
  {
    id: 'who_am_i',
    keywords: ['quem e voce', 'quem e vc', 'seu nome', 'o que voce e', 'quem fala', 'identidade', 'voce e humano', 'ia', 'bot', 'inteligencia', 'chatbot', 'mecaai', 'neural'],
    response: "Eu sou o **MecaAI**, a Inteligência Especializada em Gestão Automotiva do MecaERP. 🧠\n\nFui treinado para conhecer cada detalhe do sistema e ajudar donos de oficinas a dominarem seus negócios. Pergunte sobre clientes, OS, financeiro, estoque, WhatsApp — estou aqui 24/7!",
  },
  {
    id: 'develoi_eduardo',
    keywords: ['quem criou', 'quem desenvolveu', 'dono', 'develoi', 'eduardo eloi', 'criador', 'equipe develoi', 'empresa', 'fundador', 'quem fez', 'quem e o dono'],
    response: "O MecaERP é a maior inovação da **Develoi Soluções Digitais**, liderada pelo **Eng. Eduardo Eloi**. Nossa equipe criou este ecossistema para elevar o nível das oficinas mecânicas e centros automotivos no Brasil. Quer saber mais sobre a nossa tecnologia?",
  },
  {
    id: 'what_is_mecaerp',
    keywords: ['o que e mecaerp', 'o que e o sistema', 'sistema automotivo', 'erp mecanica', 'gestor de oficina', 'software oficina', 'programa oficina', 'sistema para oficina', 'gestao automotiva'],
    response: "O **MecaERP** é o sistema de gestão mais completo para oficinas mecânicas do Brasil. 🚗\n\nUne em um só lugar:\n• Ordens de Serviço e Orçamentos\n• Controle de Clientes e Veículos\n• Financeiro (Caixa, DRE, Contas)\n• Estoque de Peças\n• WhatsApp Automático\n• Checklist Digital HD\n• Agenda de Atendimentos\n• Relatórios de Lucratividade\n\nTudo na nuvem, acessível do celular ou computador!",
  },

  // ==========================================
  // 2. PLANOS E PREÇOS
  // ==========================================
  {
    id: 'pricing_general',
    keywords: ['preco', 'valor', 'quanto custa', 'mensalidade', 'plano', 'assinatura', 'pagar', 'comprar', 'custo', 'tabela', 'valores', 'cobrança', 'precos', 'mensal', 'anual', 'planos', 'contratar'],
    response: "Nossos planos são transparentes, sem taxa de adesão e sem fidelidade:\n\n• **Start:** R$ 197/mês — Gestão básica\n• **Pro:** R$ 297/mês — O mais vendido! 🏆\n• **Elite:** R$ 497/mês — Redes e grandes centros\n\nTodos possuem **14 dias de teste grátis**, sem precisar de cartão. Gostaria de saber os detalhes de algum?",
    showTopics: true,
  },
  {
    id: 'plan_comparison',
    keywords: ['diferenca entre planos', 'qual melhor para mim', 'comparar planos', 'versus', 'pro ou elite', 'start ou pro', 'qual a diferenca', 'entender planos'],
    response: "A diferença principal está na **Automação**:\n\n• O **Start** foca na gestão básica (OS e Financeiro).\n• O **Pro** adiciona o **WhatsApp Automático** e o **Checklist HD** (fotos na entrada) — onde você ganha escala real.\n• O **Elite** é para redes de oficinas e grandes centros automotivos.\n\nPara a maioria das oficinas, o **PRO** traz o melhor custo-benefício. Vamos testar?",
  },
  {
    id: 'upgrade_plan',
    keywords: ['quero aumentar', 'subir plano', 'mudar para pro', 'mudar para elite', 'quero o melhor', 'fazer upgrade', 'mais recursos', 'liberar whatsapp'],
    response: "Excelente escolha! Você pode fazer o upgrade direto no seu painel de **Configurações** ou falar com nosso **Suporte Premium** que fazemos a migração de recursos na hora. Deseja falar com o suporte?",
    hasAction: true,
    actionLabel: "Falar sobre Upgrade",
    actionMsg: "Olá! Gostaria de fazer o upgrade do meu plano no MecaERP. Pode me ajudar?",
  },
  {
    id: 'plan_start',
    keywords: ['plano start', 'plano de 197', 'o que tem no start', 'funcionalidades start', 'mais barato', 'basico', 'essencial'],
    response: "O **Plano Start (R$ 197/mês)** é perfeito para organizar sua oficina:\n\n• Gestão Completa de Ordem de Serviço\n• Controle Financeiro Básico\n• Gestão de Clientes e Veículos\n• Dashboard de Vendas\n• Relatórios Essenciais\n\nQuer o **teste grátis de 14 dias** agora?",
    hasAction: true,
    actionLabel: "Testar Start Grátis",
    actionType: 'link',
    url: '/register',
  },
  {
    id: 'plan_pro',
    keywords: ['plano pro', 'plano de 297', 'o que tem no pro', 'melhor plano', 'recomendado', 'completo', 'mais vendido', 'plano profissional'],
    response: "O **Plano Pro (R$ 297/mês)** é o nosso campeão! Inclui tudo do Start mais:\n\n• **WhatsApp Automático integrado**\n• **Checklist Digital HD com Fotos**\n• Relatórios de Lucratividade Avançados\n• Controle de Estoque de Precisão\n• Agenda Inteligente\n• Comissões Automáticas por Mecânico\n\nO plano ideal para quem quer escala. Vamos testar?",
  },
  {
    id: 'plan_elite',
    keywords: ['plano elite', 'plano de 497', 'o que tem no elite', 'multi-oficinas', 'corporativo', 'grande porte', 'rede', 'top de linha'],
    response: "O **Plano Elite (R$ 497/mês)** para alto nível. Além de tudo do Pro:\n\n• Múltiplos usuários com permissões por cargo\n• Suporte prioritário VIP\n• Gestão de múltiplas unidades/filiais\n• Relatórios corporativos avançados\n• API para integrações externas\n\nO modelo perfeito para redes automotivas!",
  },
  {
    id: 'free_trial',
    keywords: ['teste gratis', 'gratis', 'gratuito', 'trial', 'experimentar', 'testar sem pagar', 'sem compromisso', 'cartao de credito', '14 dias'],
    response: "Sim! Temos **14 dias de teste 100% grátis** — sem precisar de cartão, sem compromisso e sem cobrança automática. 🎉\n\nVocê ativa sua conta agora, usa o sistema completo e só assina se adorar!",
    hasAction: true,
    actionLabel: "Criar Conta Grátis",
    actionType: 'link',
    url: '/register',
  },
  {
    id: 'price_objection',
    keywords: ['caro', 'muito caro', 'sem grana', 'apertado', 'desconto', 'promocao', 'oferta', 'negociar', 'parcelado'],
    response: "Entendo a preocupação! Mas pensa assim: 💡\n\n**Se o sistema te ajudar a fechar apenas 1 OS a mais por semana** que você perderia sem controle, o custo já está pago.\n\nNossos clientes relatam +30% no faturamento nos primeiros 3 meses. Quer falar com um consultor para ver o ROI do seu caso?",
    hasAction: true,
    actionLabel: "Calcular ROI da minha oficina",
    actionMsg: "Olá! Gostaria de entender como o MecaERP pode aumentar meu faturamento e se compensa o investimento.",
  },

  // ==========================================
  // 3. ORDENS DE SERVIÇO (OS)
  // ==========================================
  {
    id: 'work_orders_os',
    keywords: ['os', 'ordem de servico', 'abrir os', 'orcamento', 'pdf', 'imprimir os', 'aprovar', 'status os', 'enviar orcamento', 'kanban', 'nova os', 'criar ordem'],
    response: "A gestão de **Ordem de Serviço** do MecaERP é a mais rápida do mercado! ⚡\n\nVocê cria uma OS em segundos, adiciona peças e serviços, define o mecânico responsável e envia o orçamento em **PDF** direto pro celular do cliente pelo WhatsApp. Ele aprova de onde estiver. Você acompanha tudo no **Painel Kanban** em tempo real!",
  },
  {
    id: 'os_status',
    keywords: ['status da os', 'andamento da os', 'aberta', 'em progresso', 'finalizada', 'aguardando aprovacao', 'aprovada', 'reprovada', 'cancelada', 'em andamento'],
    response: "O MecaERP rastreia sua OS em **6 status**:\n\n• 🟡 **Aberta** — Criada, aguardando início\n• 🔵 **Em Andamento** — Mecânico trabalhando\n• ⏳ **Aguardando Aprovação** — Orçamento enviado ao cliente\n• ✅ **Aprovada** — Cliente aceitou\n• ✔️ **Finalizada** — Serviço concluído e entregue\n• ❌ **Cancelada** — Serviço não realizado\n\nTudo atualizado em tempo real no Kanban!",
  },
  {
    id: 'os_pdf',
    keywords: ['pdf da os', 'imprimir ordem', 'gerar pdf', 'logo na os', 'personalizar os', 'modelo os', 'recibo', 'comprovante'],
    response: "O MecaERP gera um **PDF profissional** com a sua logo, dados do cliente, veículo, serviços detalhados e valores. 📄\n\nPersonalizável com sua identidade visual. Envie pelo WhatsApp ou imprima. O cliente recebe um documento digno de uma grande concessionária!",
  },
  {
    id: 'os_items',
    keywords: ['adicionar peca', 'servico na os', 'item na os', 'mao de obra', 'adicionar servico', 'desconto na os', 'valor da os', 'total da os'],
    response: "Na OS, você pode adicionar:\n\n• **Peças** do seu estoque (com baixa automática)\n• **Serviços** com valor de mão de obra\n• **Descontos** por item ou no total\n• Definir **mecânico** responsável por cada item\n\nO sistema calcula o total e a margem de lucro automaticamente!",
  },
  {
    id: 'how_create_os',
    keywords: ['como criar os', 'como abrir ordem', 'passo a passo os', 'criar nova os', 'nova ordem de servico'],
    response: "Criar uma OS é simples:\n\n1. Vá em **Ordens de Serviço → Nova OS**\n2. Selecione o **Cliente** (ou cadastre um novo)\n3. Selecione o **Veículo** (ou cadastre um novo)\n4. Adicione os **serviços e peças**\n5. Atribua ao **mecânico** responsável\n6. Salve e **envie o orçamento pelo WhatsApp**\n\nMenos de 2 minutos para uma OS completa! ⚡",
  },
  {
    id: 'how_close_os',
    keywords: ['finalizar os', 'fechar ordem', 'concluir os', 'dar baixa os', 'entregar carro', 'ordem finalizada'],
    response: "Para finalizar uma OS:\n\n1. Verifique que todos os itens foram concluídos\n2. Registre o **pagamento** (forma e valor)\n3. Clique em **'Finalizar OS'**\n4. O sistema pergunta se quer enviar **aviso de carro pronto** pelo WhatsApp\n5. Emita a **Nota Fiscal** se necessário\n6. O estoque é baixado automaticamente! 📦",
  },

  // ==========================================
  // 4. CLIENTES E CRM
  // ==========================================
  {
    id: 'client_crm',
    keywords: ['cliente', 'cadastro', 'crm', 'historico do cliente', 'fidelizacao', 'aniversario', 'marketing', 'vender mais', 'lembrar cliente', 'pos venda', 'cadastrar cliente'],
    response: "O MecaERP é também um **CRM Automotivo** completo! 👤\n\nVocê tem o cadastro completo do cliente (PF ou PJ), histórico de todas as OS e veículos, contas a receber e filtragem por status. O sistema permite enviar mensagens de aniversário e promoções pelo WhatsApp — fidelização automática!",
  },
  {
    id: 'client_history',
    keywords: ['historico do cliente', 'o que o cliente fez', 'todo historico', 'passagens na oficina', 'quanto cliente gastou', 'frequencia cliente', 'ultima visita'],
    response: "No **Histórico do Cliente** você vê tudo:\n\n• Todas as OS com datas e valores\n• Veículos cadastrados\n• Total gasto na oficina\n• Pendências e contas em aberto\n• Última visita\n\nClique na bolinha de Veículos ou OS no grid de Clientes para ver rapidamente tudo que o cliente tem registrado!",
  },
  {
    id: 'client_tags',
    keywords: ['tag cliente', 'vip', 'inadimplente', 'frotista', 'sem veiculo', 'marcar cliente', 'classificar cliente', 'filtro cliente', 'etiqueta'],
    response: "Classifique seus clientes com **Tags**:\n\n• 🟣 **VIP** — Clientes especiais e frequentes\n• 🔴 **Inadimplente** — Com contas em atraso\n• 🔵 **Frotista** — Empresas com múltiplos veículos\n• ⚪ **Sem Veículo** — Sem carro cadastrado\n\nFiltre por tag no topo da tela de Clientes. Segmentação que turbina seu marketing!",
  },
  {
    id: 'client_import',
    keywords: ['importar clientes', 'subir planilha clientes', 'excel clientes', 'planilha csv', 'base de clientes', 'migrar clientes'],
    response: "Sim! Você pode **importar sua base de clientes** em massa via Excel ou CSV! 📊\n\nAcesse Clientes → botão **Importar** → baixe o modelo → preencha e faça o upload. O sistema processa tudo automaticamente. Em minutos toda sua base está cadastrada!",
  },

  // ==========================================
  // 5. VEÍCULOS
  // ==========================================
  {
    id: 'vehicle_history',
    keywords: ['historico veiculo', 'placa', 'o que foi feito', 'veiculo', 'carro', 'busca placa', 'manutencao anterior', 'frota', 'ficha do carro', 'buscar veiculo'],
    response: "Temos **Busca Inteligente por Placa**! 🔍\n\nDigite a placa e puxa os dados na hora. O histórico do veículo é eterno: saiba qual óleo foi colocado há 2 anos, quais peças foram trocadas, qual mecânico fez. Tudo em um clique!",
  },
  {
    id: 'vehicle_register',
    keywords: ['cadastrar veiculo', 'novo veiculo', 'adicionar carro', 'vincular veiculo', 'carro do cliente', 'registrar carro', 'marca modelo'],
    response: "Cadastrar um veículo leva 30 segundos:\n\n• **Placa** (busca automática de dados)\n• Marca, Modelo e Ano\n• Cor e Combustível\n• KM atual\n• Vincular ao Cliente\n\nO sistema preenche marca, modelo e ano pela placa automaticamente em muitos casos!",
  },
  {
    id: 'vehicle_km',
    keywords: ['quilometragem', 'km', 'kilometragem', 'hodometro', 'controle km', 'proxima revisao km', 'alerta km'],
    response: "O MecaERP registra a **KM atual** a cada OS! 📏\n\nAssim você sabe exatamente quando trocar óleo, filtros, correia dentada e pode configurar alertas de retorno por KM. O WhatsApp manda o lembrete pro cliente automaticamente quando chega na KM programada!",
  },
  {
    id: 'vehicle_multiple',
    keywords: ['varios veiculos', 'mais de um carro', 'frota de veiculos', 'cliente com varios carros', 'familia', 'frota empresa'],
    response: "Um cliente pode ter **quantos veículos quiser** cadastrados! 🚗🚗\n\nPerfeito para famílias com vários carros ou empresas com frotas. No grid de Clientes, a **bolinha azul de Veículos** mostra a contagem — clique nela para ver todos os veículos dele e navegar direto para cada um!",
  },

  // ==========================================
  // 6. FINANCEIRO
  // ==========================================
  {
    id: 'finance_cashflow',
    keywords: ['financeiro', 'lucro', 'caixa', 'pagamento', 'contas', 'dfc', 'margem', 'quanto ganhei', 'fluxo', 'lucratividade', 'faturamento', 'dre', 'resultado', 'balanco'],
    response: "Com o **Financeiro Master**, você para de 'achar' que tem lucro e passa a ter certeza. 💰\n\nO sistema gera:\n• **DRE** automático\n• **Fluxo de Caixa** por período\n• Margem de lucro por serviço e peça\n• Ticket médio por cliente\n• Comparativo mês a mês\n\nVocê sabe exatamente onde está perdendo e onde pode ganhar mais!",
  },
  {
    id: 'accounts_payable_receivable',
    keywords: ['contas a pagar', 'contas a receber', 'inadimplencia', 'fiado', 'recebimentos', 'pendencias', 'calote', 'devedores', 'cobrar cliente'],
    response: "Temos controle rigoroso de **Contas a Pagar e Receber**. 📋\n\nO sistema avisa quem está devendo com alertas de vencimento. Você registra pagamentos parciais, diferentes formas de pagamento (PIX, cartão, dinheiro) e o sistema dá baixa automaticamente nas OS finalizadas!",
  },
  {
    id: 'payment_methods',
    keywords: ['forma de pagamento', 'pix', 'cartao', 'dinheiro', 'credito', 'debito', 'boleto', 'cheque', 'parcelado', 'a prazo'],
    response: "O MecaERP aceita registro de **qualquer forma de pagamento**:\n\n• 💵 Dinheiro\n• 📱 PIX\n• 💳 Cartão de Crédito (à vista ou parcelado)\n• 💳 Cartão de Débito\n• 🏦 Transferência\n• ✏️ Cheque\n\nVocê registra o pagamento e o sistema baixa a conta automaticamente!",
  },
  {
    id: 'mechanic_commissions',
    keywords: ['comissao', 'mecanico', 'pagar funcionario', 'produtividade', 'porcentagem', 'funcionario', 'rateio', 'pagamento mecanico', 'salario'],
    response: "O cálculo de **Comissões** é 100% automático! 🔧\n\nVocê configura a % de cada mecânico por serviço ou peça. No fim do período, o sistema gera um relatório exato de quanto pagar para cada um. Você também vê o **ranking de produtividade** da equipe. Acabou a briga no acerto!",
  },
  {
    id: 'dashboard_reports',
    keywords: ['dashboard', 'relatorio', 'painel', 'grafico', 'kpi', 'metricas', 'resumo', 'visao geral', 'indicadores', 'analise', 'vendas hoje'],
    response: "O **Dashboard** é o cockpit da sua oficina! 📊\n\nVocê vê em tempo real:\n• OS abertas, em progresso e finalizadas\n• Faturamento do dia, semana e mês\n• Melhores clientes e veículos mais atendidos\n• Mecânicos mais produtivos\n• Alertas de estoque baixo\n\nTomada de decisão com dados — não com achismo!",
  },

  // ==========================================
  // 7. ESTOQUE E FORNECEDORES
  // ==========================================
  {
    id: 'stock_management',
    keywords: ['estoque', 'pecas', 'inventario', 'faltando', 'compra', 'produto', 'codigo de barras', 'quantidade minima', 'curva abc', 'controle de pecas', 'baixa estoque'],
    response: "O controle de **Estoque** avisa quando uma peça atingiu o mínimo! ⚠️\n\nVocê gerencia:\n• Custo médio ponderado\n• Leitor de código de barras\n• Baixa automática quando peça entra em OS\n• Curva ABC (itens mais e menos movimentados)\n• Histórico de movimentações\n\nNunca mais perca venda por falta de filtro ou óleo!",
  },
  {
    id: 'suppliers_purchases',
    keywords: ['fornecedor', 'comprar peca', 'pedido de compra', 'autopecas', 'distribuidor', 'entrada de nota', 'xml entrada', 'importar xml'],
    response: "Cadastre todos os seus **Fornecedores** e registre Pedidos de Compra direto no sistema. 🏭\n\nQuando a peça chega, dê entrada importando o **XML da nota fiscal** — o sistema já atualiza o estoque e as contas a pagar simultaneamente. Zero retrabalho!",
  },

  // ==========================================
  // 8. CHECKLIST DIGITAL HD
  // ==========================================
  {
    id: 'checklist_hd',
    keywords: ['checklist', 'vistoria', 'fotos', 'avaria', 'risco', 'danos', 'entrada', 'laudo', 'vistoriar', 'fotos entrada', 'estado do carro', 'checklist digital'],
    response: "Com o **Checklist HD**, você blinda sua oficina contra clientes mal-intencionados! 📸\n\nFotografe riscos, painel e avarias na entrada. O cliente **assina digitalmente** no celular dele. É um laudo profissional e inalterável — protege você de qualquer disputa futura!",
  },
  {
    id: 'checklist_how',
    keywords: ['como funciona checklist', 'como fazer vistoria', 'preencher checklist', 'link checklist', 'vistoria digital', 'formulario vistoria'],
    response: "O Checklist funciona assim:\n\n1. Crie uma OS para o veículo\n2. Acesse o **Checklist Digital** da OS\n3. Fotografe o veículo (painel, laterais, avarias)\n4. Marque os itens conferidos\n5. O cliente recebe um **link pelo WhatsApp**\n6. Ele **assina digitalmente** no celular\n7. O laudo fica arquivado na OS para sempre ✅",
  },
  {
    id: 'checklist_signature',
    keywords: ['assinatura digital', 'assinar laudo', 'assinar checklist', 'cliente assina', 'assinatura cliente'],
    response: "O cliente assina pelo **próprio celular** sem instalar nada! 📱\n\nEle recebe o link, vê as fotos tiradas, confere os itens e assina com o dedo na tela. A assinatura tem validade jurídica e fica vinculada permanentemente à OS. **Fim das disputas sobre riscos e danos!**",
  },

  // ==========================================
  // 9. WHATSAPP E AUTOMAÇÃO
  // ==========================================
  {
    id: 'whatsapp_automation',
    keywords: ['whatsapp', 'zap', 'notificacao', 'automacao', 'mensagem', 'enviar', 'aviso', 'status', 'bot', 'integracao zap', 'avisar cliente', 'mensagem automatica', 'aprovar zap'],
    response: "O MecaERP tem um **Motor de WhatsApp Integrado**! 📲\n\nEle envia automações como:\n• Link da OS para aprovação de orçamento\n• Aviso de 'Veículo Pronto para Retirada'\n• Lembretes de revisão futura (ex: correia daqui 6 meses)\n• Confirmação de agendamento\n• PDF da OS e Nota Fiscal\n\nEle vende por você enquanto você trabalha!",
  },
  {
    id: 'whatsapp_budget',
    keywords: ['enviar orcamento whatsapp', 'aprovar pelo zap', 'cliente aprova pelo celular', 'link de aprovacao', 'orcamento online'],
    response: "Você cria a OS, clica em **'Enviar para Aprovação'** e o cliente recebe no WhatsApp um link com o orçamento detalhado. 📲\n\nNesse link o cliente vê serviços, peças, valores e pode **Aprovar ou Reprovar** com um clique. O status da OS atualiza automaticamente no seu painel quando ele responde!",
  },
  {
    id: 'whatsapp_ready',
    keywords: ['aviso carro pronto', 'carro pronto', 'notificar retirada', 'cliente buscar carro', 'veiculo pronto', 'comunicar pronto'],
    response: "Quando você marca a OS como **'Finalizada'**, com um clique o cliente recebe no WhatsApp:\n\n*'Olá [Nome], seu [Veículo] está pronto para retirada! Estamos aguardando você. — [Sua Oficina]'*\n\nMensagem personalizável com sua identidade. O cliente chega satisfeito e pontual!",
  },
  {
    id: 'whatsapp_reminder',
    keywords: ['lembrete revisao', 'revisao preventiva', 'aviso retorno', 'lembrar cliente', 'preventiva futura', 'contato automatico'],
    response: "Programe **Lembretes Automáticos de Revisão**! ⏰\n\nNa OS você define: 'avisar esse cliente daqui 3 meses para troca de óleo'. Na data certa, o sistema dispara a mensagem de WhatsApp pro cliente automaticamente. Cliente fidelizado sem você precisar lembrar de nada!",
  },

  // ==========================================
  // 10. AGENDA
  // ==========================================
  {
    id: 'scheduling_agenda',
    keywords: ['agendamento', 'calendario', 'marcar', 'reserva', 'horario', 'agenda', 'box', 'elevador', 'planejamento', 'ocupacao', 'fila', 'atendimento'],
    response: "A **Agenda Inteligente** organiza sua oficina! 📅\n\nVocê marca horários, define em qual elevador/box o carro vai ficar e aloca o mecânico. Dá para ver a ocupação de toda a semana de um olhar. Acabou a fila de espera e a desorganização no pátio!",
  },

  // ==========================================
  // 11. GARANTIA E TERMOS
  // ==========================================
  {
    id: 'warranty_terms',
    keywords: ['garantia', 'termo', 'retorno', 'defeito', 'peca com defeito', 'rm', 'garantia servico', 'vencimento garantia', 'certificado'],
    response: "Gerencie as **Garantias** sem dor de cabeça! 🛡️\n\nO sistema emite o Termo de Garantia para o cliente assinar e te avisa se um veículo voltar dentro do prazo estipulado. Se o mesmo veículo voltar para o mesmo problema dentro da garantia, o sistema alerta imediatamente!",
  },

  // ==========================================
  // 12. RELATÓRIOS
  // ==========================================
  {
    id: 'reports_general',
    keywords: ['relatorio', 'relatorios', 'grafico', 'analise', 'bi', 'exportar dados', 'dados do mes', 'resumo mensal'],
    response: "O MecaERP possui dezenas de **Relatórios** para decisões baseadas em dados! 📈\n\n• Relatório de OS por período\n• Faturamento vs Custos\n• Performance por mecânico\n• Análise de Estoque (Curva ABC)\n• Relatório de Inadimplência\n• Clientes mais frequentes\n• Serviços mais realizados\n\nTodos exportáveis em PDF ou Excel!",
  },

  // ==========================================
  // 13. FISCAL E NFE
  // ==========================================
  {
    id: 'nfe_taxes',
    keywords: ['nota fiscal', 'nfe', 'nfse', 'imposto', 'fiscal', 'emitir nota', 'xml', 'contador', 'contabilidade', 'cupom', 'sat', 'tributo', 'sefaz'],
    response: "Emitimos **Notas Fiscais de Serviço (NFSe)** e de **Produtos (NFe/NFCe)**! 🗒️\n\nCom um clique dentro da OS, a nota é gerada, autorizada pela SEFAZ e os XMLs ficam disponíveis para o seu contador. Sem retrabalho e 100% em conformidade fiscal!",
  },

  // ==========================================
  // 14. USUÁRIOS E ACESSO
  // ==========================================
  {
    id: 'users_permissions',
    keywords: ['usuario', 'funcionario acesso', 'permissao', 'cargo', 'acesso restrito', 'gerente', 'admin', 'recepcionista', 'nivel acesso', 'criar usuario', 'senha'],
    response: "Crie quantos **usuários** precisar com **permissões por cargo**! 👥\n\n• **Admin** — Acesso total\n• **Gerente** — Vê relatórios financeiros\n• **Mecânico** — Só vê e atualiza as OS dele\n• **Recepcionista** — Cria OS e contata clientes\n\nCada funcionário vê apenas o que precisa. Segurança e privacidade garantidas!",
  },
  {
    id: 'how_add_mechanic',
    keywords: ['adicionar mecanico', 'cadastrar funcionario', 'novo usuario', 'criar login mecanico', 'acesso para mecanico', 'criar conta funcionario'],
    response: "Para adicionar um mecânico:\n\n1. Vá em **Configurações → Usuários**\n2. Clique em **'Novo Usuário'**\n3. Informe: nome, e-mail e cargo\n4. Defina as **permissões** (o que ele pode ver/fazer)\n5. O mecânico recebe um e-mail de acesso\n\nEle já pode entrar e ver as OS atribuídas a ele!",
  },
  {
    id: 'mobile_access',
    keywords: ['celular', 'mobile', 'app', 'aplicativo', 'smartphone', 'tablet', 'acessar pelo celular', 'funciona no celular', 'ios', 'android', 'responsivo'],
    response: "O MecaERP é **100% responsivo e funciona no celular**! 📱\n\nNão precisa instalar app — abre direto pelo navegador do smartphone ou tablet. Você gerencia OS, aprova orçamentos e vê o dashboard de qualquer lugar. Perfeito para quando você está no pátio!",
  },
  {
    id: 'multi_branch',
    keywords: ['mais de uma oficina', 'filial', 'segunda unidade', 'rede de oficinas', 'franquia', 'multi empresa', 'varias unidades'],
    response: "Com o **Plano Elite**, você gerencia **múltiplas oficinas** em um único painel! 🏢🏢\n\nVeja o faturamento consolidado de todas as unidades, compare desempenho entre filiais e gerencie o estoque centralizadamente. O modelo perfeito para redes automotivas.",
  },

  // ==========================================
  // 15. DADOS, SUPORTE E SEGURANÇA
  // ==========================================
  {
    id: 'data_migration',
    keywords: ['migrar', 'outro sistema', 'importar', 'trazer dados', 'excel', 'planilha', 'mudar de sistema', 'cadastro antigo', 'backup antigo', 'vindo de outro sistema'],
    response: "Se você usa outro sistema ou planilhas, não se preocupe! 📂\n\nTemos **Ferramentas de Importação** em lote para Clientes, Veículos, Peças e Fornecedores. Você sobe as planilhas e o MecaERP cadastra tudo em segundos. Nossa equipe também oferece **migração assistida** gratuitamente na ativação!",
  },
  {
    id: 'support_onboarding',
    keywords: ['suporte', 'ajuda', 'treinamento', 'implantacao', 'como usar', 'duvida', 'video aula', 'aprender', 'facil', 'ensinar', 'atendimento', 'tutorial'],
    response: "Temos um **Onboarding Especializado** completo! 🎓\n\n• Tutoriais em vídeo passo a passo\n• Manual digital interativo\n• Suporte humano via WhatsApp\n• Consultoria de implantação incluída\n\nSua equipe estará usando o sistema com confiança em menos de 1 semana!",
  },
  {
    id: 'security_cloud',
    keywords: ['seguranca', 'protecao', 'hack', 'perder dados', 'nuvem', 'backup', 'lgpd', 'criptografia', 'estabilidade', 'confiavel', 'onde ficam dados', 'aws', 'amazon', 'internet', 'offline', 'seguro'],
    response: "O sistema roda 100% na nuvem, hospedado em servidores **AWS (Amazon)** — a mesma estrutura dos grandes bancos! 🔒\n\nBackups automatizados de hora em hora e tudo criptografado seguindo as normas da **LGPD**. Mesmo que seu computador quebre, seus dados estão seguros. Nunca perca um cliente ou OS!",
  },

  // ==========================================
  // 16. PRIMEIROS PASSOS
  // ==========================================
  {
    id: 'how_to_start',
    keywords: ['como comecar', 'comecar a usar', 'primeiros passos', 'por onde comecar', 'configurar sistema', 'primeiro acesso', 'setup'],
    response: "Para começar no MecaERP em minutos:\n\n1. **Crie sua conta** (14 dias grátis)\n2. Configure o **perfil da oficina** (nome, logo, endereço)\n3. Cadastre seus **mecânicos** como usuários\n4. **Importe ou cadastre** seus clientes e peças\n5. **Abra sua primeira OS!** 🚀\n\nA equipe de onboarding está disponível para te guiar!",
    hasAction: true,
    actionLabel: "Criar Minha Conta Agora",
    actionType: 'link',
    url: '/register',
  },
  {
    id: 'problem_disorganized',
    keywords: ['desorganizado', 'bagunca', 'perco controle', 'nao sei o que faco', 'papelada', 'caderno', 'papel', 'planilha ruim', 'caos na oficina'],
    response: "Isso é mais comum do que imagina — e tem solução! 🛠️\n\nO MecaERP foi criado exatamente para oficinas que querem sair do caos do caderno para um **sistema profissional e automatizado**.\n\nNossos clientes dizem: *'Em 2 semanas de sistema, eu finalmente enxerguei meu negócio pela primeira vez.'* Quer experimentar?",
    hasAction: true,
    actionLabel: "Sair do Caos Agora",
    actionType: 'link',
    url: '/register',
  },

  // ==========================================
  // 17. VALOR DE NEGÓCIO E ROI
  // ==========================================
  {
    id: 'business_value_roi',
    keywords: ['vale a pena', 'por que contratar', 'lucratividade', 'resultado', 'retorno', 'ganhar dinheiro', 'economizar tempo', 'crescer oficina', 'roi', 'retorno investimento'],
    response: "O MecaERP não é um gasto — é um **investimento com ROI rápido**! 💹\n\nNossos clientes relatam:\n• **Economia de 12h semanais** em burocracia\n• **+30% no faturamento** nos primeiros 3 meses\n• **Redução de 40% na inadimplência**\n• **Zero perda de orçamento** (tudo rastreado)\n\nSe você fatura R$ 20k/mês e crescer 30%, são R$ 6k a mais. O sistema custa R$ 297. A conta fecha fácil!",
  },

  // ==========================================
  // 18. NOTIFICAÇÕES E ALERTAS
  // ==========================================
  {
    id: 'notifications',
    keywords: ['notificacao', 'alerta', 'aviso', 'lembrete sistema', 'push', 'alerta estoque', 'alerta os', 'lembrete revisao', 'notificar funcionario'],
    response: "O MecaERP tem **Alertas Inteligentes** que te avisam sobre:\n\n• ⚠️ Peças com estoque abaixo do mínimo\n• 📅 OS abertas há muito tempo\n• 💰 Contas a vencer nos próximos dias\n• 🔧 Veículos agendados para hoje\n• ✅ Orçamentos aprovados pelo cliente\n\nTudo visível no Dashboard em tempo real!",
  },

  // ==========================================
  // 19. COMPARAÇÃO E OBJEÇÕES
  // ==========================================
  {
    id: 'competitor_comparison',
    keywords: ['comparar com', 'melhor que', 'vs concorrente', 'shopflow', 'cargest', 'autosystem', 'mecanizou', 'troco de sistema', 'por que mecaerp', 'diferencial', 'vantagem'],
    response: "O MecaERP se diferencia por:\n\n• **WhatsApp nativo** integrado (não é add-on pago)\n• **Checklist com foto HD** e assinatura digital\n• Interface moderna — fácil de usar no celular\n• Suporte em **português com especialistas automotivos**\n• Preço justo sem taxas escondidas\n• Base de usuários crescendo 300% ao ano 📈\n\nQuer uma comparação personalizada com seu sistema atual?",
    hasAction: true,
    actionLabel: "Comparar com meu sistema atual",
    actionMsg: "Olá! Quero comparar o MecaERP com o sistema que uso atualmente. Podem me ajudar?",
  },

  // ==========================================
  // 20. ELOGIOS
  // ==========================================
  {
    id: 'praises',
    keywords: ['gostei', 'muito bom', 'parabens', 'sensacional', 'incrivel', 'melhor sistema', 'top', 'amando', 'foda', 'show', 'legal', 'massa', 'perfeito', 'excelente', 'otimo'],
    response: "Ficamos extremamente felizes com seu feedback! 🚀\n\nO MecaERP nasceu para transformar o mercado automotivo brasileiro. Que tal começar hoje mesmo a triplicar seus resultados com a gente?",
    hasAction: true,
    actionLabel: "Começar Agora!",
    actionType: 'link',
    url: '/register',
  },

  // ==========================================
  // 21. CHINGAMENTOS
  // ==========================================
  {
    id: 'insults_confrontation',
    keywords: ['burro', 'idiota', 'lixo', 'merda', 'pessimo', 'nao serve', 'ruim demais', 'horrivel', 'estupido', 'incompetente', 'fraco', 'fraude'],
    response: "Lamento profundamente por essa impressão. 🧠\n\nComo sou uma inteligência neural focada em automação, às vezes posso parecer limitada em certas situações. Posso te transferir agora para um **Consultor Estratégico Humano** para resolver qualquer insatisfação. Pode ser?",
    hasAction: true,
    actionLabel: "Falar com Consultor Humano",
    actionMsg: "Olá, não estou satisfeito com o atendimento da IA e gostaria de falar com uma pessoa real.",
  },

  // ==========================================
  // 22. CONTATO
  // ==========================================
  {
    id: 'contact',
    keywords: ['contato', 'falar com humano', 'atendimento', 'vendedor', 'comercial', 'numero', 'falar com alguem', 'pessoa real', 'consultor', 'telefone', 'chamar no zap', 'falar com equipe'],
    response: "Nada substitui uma boa conversa com um especialista! 🙋\n\nChame nossa equipe comercial agora pelo WhatsApp **(15) 99811-8548**. Quer que eu abra a conversa no seu celular agora?",
    hasAction: true,
    actionLabel: "Falar com Consultor no WhatsApp",
    actionMsg: "Olá! O MecaAI me atendeu no site e eu gostaria de falar com um especialista sobre o MecaERP.",
  },

  // ==========================================
  // 23. FALLBACK
  // ==========================================
  {
    id: 'frustration_recovery',
    keywords: ['viajando', 'nao entende', 'errado', 'nao faz sentido', 'nao responde', 'nada a ver', 'que isso', 'nao sei', 'nao entendi'],
    response: "Peço sinceras desculpas! 🧠\n\nComo sou uma inteligência focada no **ecossistema MecaERP**, posso não ter compreendido bem. Para não tomar seu tempo, posso te conectar com nossa equipe humana agora. Pode ser?",
    hasAction: true,
    actionLabel: "Falar com Humano",
    actionMsg: "Olá, o robô do site não conseguiu me entender direito. Quero tirar uma dúvida.",
  },
];
