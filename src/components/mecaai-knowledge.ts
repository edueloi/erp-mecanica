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
    keywords: ['diferenca entre planos', 'qual melhor para mim', 'comparar planos', 'versus', 'pro ou elite', 'start ou pro', 'qual a diferenca', 'entender planos', 'qual melhor plano', 'melhor opcao', 'qual me indica'],
    response: "Para eu te indicar o melhor plano com precisão, preciso conhecer um pouco do seu negócio! 🏢\n\nQual o tamanho da sua oficina: **Pequena**, **Média** ou **Grande**?\n\n*(Se não souber classificar, me diga a quantidade de funcionários que você tem ou o seu faturamento médio mensal, e eu avalio para você!)*",
  },
  {
    id: 'size_small',
    keywords: ['pequena', 'pequeno porte', 'pequenas', 'sou pequeno', '1 funcionario', '2 funcionarios', '3 funcionarios', 'sozinho', 'fatura pouco', 'pouco movimento', 'comecando', 'iniciante', 'ate 30 mil', 'ate 50 mil'],
    response: "Entendi! Para oficinas de **pequeno porte** (ou até 3 colaboradores), recomendo começar pelo **Plano Start (R$ 197/mês)**.\n\nEle te dá toda a base para organizar a casa: criar OS rapidamente, enviar orçamentos em PDF, e ter um controle de caixa e estoque afiado. Quando o volume aumentar, você pode mudar para o Pro e liberar automações. Que tal iniciarmos os 14 dias grátis?",
  },
  {
    id: 'size_medium',
    keywords: ['media', 'medio porte', 'medias', 'sou medio', '4 funcionarios', '5 funcionarios', '6 funcionarios', '7 funcionarios', '10 funcionarios', 'bastante movimento', 'faturamento medio', 'de 50 a 100 mil', 'mais de 50 mil', '100 mil'],
    response: "Legal! Para oficinas de **médio porte** (ou acima de 4 funcionários), o ideal e mais recomendado é o **Plano Pro (R$ 297/mês)**! 🏆\n\nNesse nível você precisa de **escala**. O Plano Pro libera o **WhatsApp Automático** e o **Checklist HD com fotos** na entrada do veículo, passando muito mais credibilidade e evitando dor de cabeça. Além de liberar cálculo automático de comissão para os mecânicos. Faz sentido testarmos o Pro?",
  },
  {
    id: 'size_large',
    keywords: ['grande', 'grande porte', 'grandes', 'sou grande', 'rede', 'filiais', 'mais de 10 funcionarios', '15 funcionarios', '20 funcionarios', 'faturamento alto', 'mais de 200 mil', 'centro automotivo grande', 'mais de uma loja'],
    response: "Perfeito! Para **grandes centros automotivos** ou **redes**, a indicação certeira é o **Plano Elite (R$ 497/mês)**.\n\nCom ele você tem controle total corporativo: gestão de múltiplas unidades 🏢, níveis de permissão super rigorosos para os usuários (gerentes, vendedores, caixa) e acesso à nossa API para integrações externas. Sem contar o suporte VIP prioritário. Bora agendar uma demonstração desse plano?",
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

  // ==========================================
  // 24. PLANOS — BIBLIOTECA DEVASTADORA
  // ==========================================

  // --- O que cada plano oferece (detalhado) ---
  {
    id: 'start_full_detail',
    keywords: ['tudo do start', 'detalhe start', 'funcoes start', 'recursos start', 'o que inclui start', 'start completo', 'modulos start', 'limite start', 'start serve para mim'],
    response: "O **Plano Start — R$ 197/mês** é o ponto de entrada perfeito. Veja tudo que está incluído:\n\n📋 **Gestão de OS**\n• Criação ilimitada de Ordens de Serviço\n• Status Kanban (Aberta, Em andamento, Finalizada)\n• PDF da OS com logo da oficina\n• Orçamentos para clientes\n• Histórico de OS por cliente e veículo\n\n👤 **Clientes e Veículos**\n• Cadastro ilimitado de clientes (PF e PJ)\n• Cadastro ilimitado de veículos\n• Histórico completo por cliente\n• Busca por placa\n\n💰 **Financeiro**\n• Registro de pagamentos\n• Contas a Receber básico\n• Fluxo de Caixa simples\n• Dashboard de faturamento\n\n📦 **Estoque**\n• Cadastro de peças\n• Baixa automática na OS\n\n👥 **Usuários**\n• Até 3 usuários simultâneos\n\nIdeal para oficinas que estão saindo do caderno e da planilha. 14 dias grátis — sem cartão!",
    hasAction: true,
    actionLabel: "Testar Start Grátis",
    actionType: 'link',
    url: '/register',
  },
  {
    id: 'pro_full_detail',
    keywords: ['tudo do pro', 'detalhe pro', 'funcoes pro', 'recursos pro', 'o que inclui pro', 'pro completo', 'modulos pro', 'limite pro', 'pro serve para mim', 'pro vale'],
    response: "O **Plano Pro — R$ 297/mês** é o mais vendido e por bom motivo. Inclui TUDO do Start mais:\n\n📱 **WhatsApp Integrado**\n• Envio de orçamentos para aprovação\n• Aviso automático de carro pronto\n• Lembretes de revisão agendados\n• Confirmação de agendamentos\n\n📸 **Checklist Digital HD**\n• Fotos de entrada do veículo\n• Assinatura digital pelo cliente\n• Laudo com validade jurídica\n\n📈 **Relatórios Avançados**\n• DRE completo\n• Lucratividade por serviço e peça\n• Performance por mecânico\n• Ranking de clientes\n\n🔧 **Comissões Automáticas**\n• % por mecânico por serviço/peça\n• Relatório de acerto mensal\n\n📅 **Agenda Inteligente**\n• Controle de box/elevador\n• Alocação de mecânicos\n\n📦 **Estoque Avançado**\n• Alertas de estoque mínimo\n• Curva ABC\n• Pedidos de compra\n\n👥 **Usuários**\n• Até 10 usuários com permissões por cargo\n\n**Este é o plano que muda o jogo da sua oficina!**",
    hasAction: true,
    actionLabel: "Testar Pro Grátis",
    actionType: 'link',
    url: '/register',
  },
  {
    id: 'elite_full_detail',
    keywords: ['tudo do elite', 'detalhe elite', 'funcoes elite', 'recursos elite', 'o que inclui elite', 'elite completo', 'modulos elite', 'limite elite', 'elite serve para mim', 'elite vale'],
    response: "O **Plano Elite — R$ 497/mês** é para quem quer dominar o mercado. Inclui TUDO do Pro mais:\n\n🏢 **Multi-Unidades**\n• Gestão de múltiplas filiais em um painel\n• Faturamento consolidado de todas as unidades\n• Comparativo de performance entre filiais\n• Estoque centralizado\n\n👑 **Suporte VIP**\n• Canal prioritário com tempo de resposta reduzido\n• Gerente de conta dedicado\n• Onboarding personalizado para toda sua equipe\n\n🔗 **API e Integrações**\n• Acesso completo à API do MecaERP\n• Webhooks para sistemas externos\n• Integração com sistemas de contabilidade\n• Exportações customizadas\n\n📊 **Relatórios Corporativos**\n• BI avançado com gráficos executivos\n• Relatórios comparativos multi-unidade\n• Exportação para Power BI / Google Analytics\n\n👥 **Usuários**\n• Usuários ilimitados\n• Permissões granulares por cargo\n\nO **Elite** é para redes automotivas, grandes centros e franqueadores.",
    hasAction: true,
    actionLabel: "Falar sobre o Plano Elite",
    actionMsg: "Olá! Tenho interesse no Plano Elite do MecaERP. Quero saber mais.",
  },

  // --- Perguntas de qual plano escolher ---
  {
    id: 'which_plan_small_shop',
    keywords: ['plano para oficina pequena', 'oficina pequena', 'comeando agora', 'so eu trabalho', 'trabalho sozinho', 'um mecanico', 'pequena oficina', 'inicio do negocio', 'abri agora'],
    response: "Para uma oficina pequena ou quem está começando, o **Plano Start (R$ 197/mês)** é o ideal! 🏁\n\nEle já te dá:\n• OS ilimitadas e profissionais\n• Controle de clientes e veículos\n• Financeiro básico para saber seu lucro\n• Dashboard de vendas\n\nAssim que crescer e quiser automatização (WhatsApp, Checklist HD, Comissões), você migra pro **Pro** com um clique — sem perder nenhum dado!\n\nComece com o teste grátis de 14 dias hoje mesmo.",
    hasAction: true,
    actionLabel: "Começar com o Start Grátis",
    actionType: 'link',
    url: '/register',
  },
  {
    id: 'which_plan_medium_shop',
    keywords: ['plano para oficina media', 'oficina media', 'tenho funcionarios', 'equipe mecanicos', 'varios mecanicos', ' 2 mecanicos', '3 mecanicos', 'crescendo', 'quero crescer', 'expandindo'],
    response: "Para uma oficina em crescimento com equipe, o **Plano Pro (R$ 297/mês)** é a escolha certa! 🚀\n\nAlém de organizar tudo, o Pro vai:\n• Enviar orçamentos pelo **WhatsApp** — o cliente aprova no celular\n• **Fotografar o carro na entrada** — sem mais briga sobre riscos\n• Calcular **comissões automáticas** — sem briga no acerto\n• Programar **lembretes de revisão** — cliente volta sem você ligar\n\nO Pro transforma sua oficina em uma **máquina de fidelização**. Teste 14 dias grátis!",
    hasAction: true,
    actionLabel: "Testar Pro Grátis Agora",
    actionType: 'link',
    url: '/register',
  },
  {
    id: 'which_plan_large_shop',
    keywords: ['plano para grande oficina', 'grande oficina', 'centro automotivo', 'mais de uma unidade', 'varias filiais', 'rede de oficinas', 'franquia mecanica', 'muitos funcionarios', 'grande empresa'],
    response: "Para grandes centros automotivos ou redes com múltiplas unidades, o **Plano Elite (R$ 497/mês)** foi feito para você! 🏆\n\nSe você tem:\n• 2 ou mais filiais/oficinas\n• Equipe grande com diferentes cargos\n• Necessidade de relatórios corporativos\n• Integração com outros sistemas\n\nO Elite consolida tudo em um único painel de controle. Fale com nossa equipe para uma demonstração personalizada da sua realidade!",
    hasAction: true,
    actionLabel: "Agendar Demo do Elite",
    actionMsg: "Olá! Tenho uma rede/grande centro automotivo e quero conhecer o Plano Elite. Podem me ajudar?",
  },
  {
    id: 'plan_whats_difference_cost',
    keywords: ['diferenca de preco', 'por que pro e mais caro', 'por que vale mais', 'custo beneficio planos', 'compensar pagar mais', 'vale a diferenca', 'diferenca de 100 reais', 'diferenca 200 reais'],
    response: "A diferença de preço entre os planos é justificada pelos **recursos que multiplicam seu faturamento**:\n\n• **Start → Pro (+R$100/mês):** Você ganha WhatsApp automático + Checklist HD. Só o WhatsApp recupera orçamentos que seriam perdidos. **1 OS a mais por semana** já paga os R$100 extras com sobra.\n\n• **Pro → Elite (+R$200/mês):** Você ganha gestão multi-filiais + API + suporte VIP. Para quem tem 2+ unidades, economiza horas de gestão manual por mês.\n\nA pergunta não é 'quanto custa a mais' — é 'quanto vou ganhar a mais com esses recursos'?",
  },
  {
    id: 'plan_annual',
    keywords: ['plano anual', 'pagar anual', 'desconto anual', 'assinar por ano', 'cobranca anual', 'fidelidade anual', 'pagamento anual'],
    response: "Temos planos com **pagamento anual** que oferecem desconto equivalente a **2 meses grátis**! 🎁\n\nAo invés de pagar mês a mês, você faz um único pagamento anual e economiza:\n• Start Anual: economize R$ 394\n• Pro Anual: economize R$ 594\n• Elite Anual: economize R$ 994\n\nFale com nossa equipe para ativar o plano anual e garantir o desconto!",
    hasAction: true,
    actionLabel: "Quero o Plano Anual com Desconto",
    actionMsg: "Olá! Tenho interesse no plano anual do MecaERP para aproveitar o desconto. Podem me ajudar?",
  },
  {
    id: 'plan_cancel',
    keywords: ['cancelar plano', 'desistir', 'sair do sistema', 'cancelamento', 'posso cancelar', 'como cancelo', 'sem fidelidade', 'contrato minimo', 'preso', 'fidelidade'],
    response: "**Não há fidelidade nem contrato mínimo** no MecaERP! 🤝\n\nVocê pode cancelar quando quiser, sem multa e sem burocracia. Basta acessar Configurações → Plano → Cancelar Assinatura.\n\nMas aviso: 97% dos nossos clientes que testam ficam — porque os resultados falam por si. Use os 14 dias grátis sem compromisso e veja com seus próprios olhos!",
    hasAction: true,
    actionLabel: "Testar Sem Compromisso",
    actionType: 'link',
    url: '/register',
  },
  {
    id: 'plan_change',
    keywords: ['trocar plano', 'mudar de plano', 'downgrade', 'baixar plano', 'mudar do pro para start', 'reduzir plano', 'upgrade downgrade', 'flexibilidade plano'],
    response: "Você pode **trocar de plano a qualquer momento** — para cima ou para baixo! 🔄\n\n• **Upgrade:** Ativação imediata, sem burocracia. Seus dados e histórico são preservados 100%.\n• **Downgrade:** Entra em vigor no próximo ciclo de cobrança. Você continua usando os recursos do plano atual até o fim do período.\n\nTudo feito diretamente no Painel → Configurações → Meu Plano. Simples assim!",
  },
  {
    id: 'plan_users_limit',
    keywords: ['limite de usuarios', 'quantos usuarios', 'usuarios por plano', 'funcionarios no sistema', 'acesso para equipe', 'quantos acessos'],
    response: "O limite de usuários por plano:\n\n• **Start:** Até **3 usuários** simultâneos\n• **Pro:** Até **10 usuários** com permissões por cargo\n• **Elite:** **Usuários ilimitados**\n\nCada usuário pode ter perfil de Admin, Gerente, Mecânico ou Recepcionista — com acesso restrito apenas ao que precisa. Segurança total para seu negócio!",
  },
  {
    id: 'plan_os_limit',
    keywords: ['limite de os', 'quantas os posso fazer', 'os ilimitada', 'limite de ordens', 'posso criar muitas os'],
    response: "**Nenhum plano tem limite de OS!** 🎉\n\nVocê pode criar quantas Ordens de Serviço precisar — 10, 100, 1.000 por mês. Não há cobrança extra por volume de OS, por número de clientes ou por quantidade de veículos cadastrados.\n\nO preço é fixo e previsível. Você cresce sem surpresas na fatura!",
  },
  {
    id: 'plan_storage',
    keywords: ['espaco de armazenamento', 'limite de fotos', 'armazenamento', 'guardar fotos', 'espaco em disco', 'limite de dados'],
    response: "Não se preocupe com armazenamento! ☁️\n\n• **Start e Pro:** Armazenamento generoso para documentos, OS e relatórios\n• **Pro e Elite:** Inclui armazenamento de fotos do **Checklist HD** (ilimitadas no Elite)\n\nTodos os dados ficam na nuvem AWS — sem limite que atrapalhe seu dia a dia. E backups automáticos de hora em hora garantem que nada se perde!",
  },

  // --- Para que serve o sistema? ---
  {
    id: 'system_purpose',
    keywords: ['para que serve', 'qual o objetivo', 'qual o intuito', 'finalidade do sistema', 'o que resolve', 'qual o proposito', 'por que usar', 'utilidade do sistema', 'motivo usar'],
    response: "O MecaERP existe para resolver os **3 maiores problemas das oficinas mecânicas**:\n\n**1. Desorganização** → Transforma caderno e planilha em um painel digital profissional com tudo em um lugar\n\n**2. Perda de dinheiro** → Rastreia cada OS, cada peça, cada pagamento — você para de perder receita sem saber por quê\n\n**3. Falta de tempo** → Automatiza WhatsApp, lembretes, comissões e checklist — você foca no que importa: a mecânica\n\nResultado: oficinas que usam o MecaERP faturam em média **30% mais** em 3 meses. Quer fazer parte desse grupo?",
    hasAction: true,
    actionLabel: "Quero Fazer Parte",
    actionType: 'link',
    url: '/register',
  },
  {
    id: 'system_who_for',
    keywords: ['para quem e', 'quem usa', 'meu tipo de negocio', 'funciona para mim', 'serve para todo tipo de oficina', 'auto eletrica', 'funilaria', 'estetica automotiva', 'alinhamento', 'borracharia'],
    response: "O MecaERP atende **qualquer tipo de negócio automotivo**! 🚗🔧\n\n✅ Oficinas mecânicas gerais\n✅ Auto elétricas\n✅ Funilaria e pintura\n✅ Estética automotiva\n✅ Centros de alinhamento/balanceamento\n✅ Borracharias\n✅ Troca de óleo e revisões rápidas\n✅ Centros automotivos multisserviços\n✅ Frotas e empresas com veículos\n\nO sistema se adapta ao seu fluxo de trabalho — não o contrário!",
  },
  {
    id: 'system_vs_paper',
    keywords: ['e melhor que caderno', 'substituir caderno', 'abandonar planilha', 'parar de usar papel', 'papel vs sistema', 'planilha vs sistema', 'excel vs sistema', 'digital vs papel'],
    response: "A comparação é direta:\n\n| | Caderno/Planilha | MecaERP |\n|---|---|---|\n| Perder OS | Frequente | Impossível |\n| Saber o lucro real | Nunca | Tempo real |\n| Enviar orçamento | Lento (papel/WhatsApp manual) | 1 clique |\n| Controlar estoque | Trabalhoso | Automático |\n| Calcular comissões | Briga mensal | Relatório pronto |\n| Lembretes de revisão | Você precisa lembrar | Sistema faz |\n| Acessar de qualquer lugar | Não | Celular e PC |\n\nA pergunta é: quanto dinheiro você está perdendo por mês usando métodos antigos?",
    hasAction: true,
    actionLabel: "Modernizar Minha Oficina",
    actionType: 'link',
    url: '/register',
  },
  {
    id: 'system_results',
    keywords: ['resultado real', 'prova', 'funciona mesmo', 'cliente que usou', 'depoimento', 'case de sucesso', 'historia de cliente', 'resultado cliente', 'quanto aumentou', 'comprovado'],
    response: "Resultados reais dos nossos clientes:\n\n📈 **+30% no faturamento** nos primeiros 3 meses (média)\n⏰ **Economia de 12h semanais** em burocracia\n💰 **Redução de 40% na inadimplência** (contas controladas)\n🔁 **+25% de retorno de clientes** (lembretes automáticos)\n✅ **100% dos orçamentos rastreados** (zero OS perdida)\n\nUma oficina que faturava R$ 15k/mês passou para R$ 22k em 4 meses — só organizando e usando o WhatsApp automático para recuperar orçamentos. Quer ser o próximo case?",
    hasAction: true,
    actionLabel: "Quero Esses Resultados",
    actionType: 'link',
    url: '/register',
  },
  {
    id: 'system_learning_curve',
    keywords: ['difícil de aprender', 'complicado usar', 'curva de aprendizado', 'quanto tempo aprender', 'minha equipe aprende', 'e simples usar', 'facil de usar', 'intuitivo'],
    response: "O MecaERP foi desenhado para ser **extremamente fácil de usar**! 😊\n\n• Interface moderna e intuitiva (como usar um aplicativo do celular)\n• Sua equipe aprende o básico em **1 dia**\n• Tutoriais em vídeo curtos para cada função\n• Suporte humano via WhatsApp para tirar dúvidas\n• Onboarding guiado passo a passo na ativação\n\nNão exige conhecimento técnico. Se você usa WhatsApp, você consegue usar o MecaERP!",
  },
  {
    id: 'system_internet',
    keywords: ['precisa internet', 'funciona offline', 'sem wifi', 'internet fraca', 'funciona no 4g', 'conexao necessaria'],
    response: "O MecaERP roda na nuvem, então precisa de **conexão com internet**. ☁️\n\nMas não precisa de fibra de alta velocidade — uma conexão **4G do celular** já é suficiente para todas as funções. O sistema é otimizado para funcionar bem mesmo em conexões mais lentas.\n\nE seus dados estão seguros na nuvem AWS, com backup automático a cada hora. Mesmo que a internet cair, quando voltar está tudo lá!",
  },
  {
    id: 'system_contract',
    keywords: ['tem contrato', 'assinar contrato', 'contrato longo', 'fidelidade minima', 'preso por contrato', 'sem contrato', 'mes a mes'],
    response: "**Zero contratos e zero fidelidade!** 🤝\n\nO MecaERP funciona em assinatura **mês a mês**. Você:\n• Paga apenas o mês vigente\n• Cancela quando quiser, sem multa\n• Faz upgrade ou downgrade a qualquer tempo\n• Não precisa assinar nada além da ativação da conta\n\nNossa filosofia é simples: se você não estiver tendo resultados, não deveria pagar. É por isso que confiamos tanto no nosso produto!",
  },
  {
    id: 'plan_what_is_included',
    keywords: ['o que esta incluido', 'o que vem no plano', 'tem suporte incluido', 'treinamento incluido', 'implantacao incluida', 'onboarding incluido', 'incluido no preco'],
    response: "Em **todos os planos** estão incluídos:\n\n✅ Suporte via chat e e-mail\n✅ Tutoriais em vídeo\n✅ Atualizações automáticas do sistema\n✅ Backup automático na nuvem\n✅ Certificado SSL (conexão segura)\n✅ Onboarding guiado na ativação\n\nNo **Pro e Elite** adicionalmente:\n✅ Suporte via WhatsApp\n✅ Consultoria de implantação\n✅ Treinamento da equipe\n\nNo **Elite** adicionalmente:\n✅ Gerente de conta dedicado\n✅ Suporte prioritário VIP\n✅ Onboarding presencial (mediante agenda)",
  },
  {
    id: 'plan_payment_how',
    keywords: ['como pagar', 'forma de pagar assinatura', 'pagar com cartao', 'pagar com pix plano', 'cobrado em cartao', 'debit cartao assinatura', 'fatura assinatura', 'cobrança mensal'],
    response: "Você pode assinar o MecaERP pagando por:\n\n• 💳 **Cartão de crédito** (parcelado em até 12x — plano anual)\n• 💳 **Débito automático** no cartão (mensal)\n• 📱 **PIX** (plano anual à vista)\n• 🏦 **Boleto bancário** (mensal ou anual)\n\nA cobrança é automática todo mês (ou anualmente se optar pelo plano anual). Você recebe um e-mail de confirmação a cada renovação.",
  },
  {
    id: 'plan_first_charge',
    keywords: ['quando começa cobrar', 'primeira cobrança', 'quando vou ser cobrado', 'cobrado imediatamente', 'começa a pagar quando', 'trial quando cobra'],
    response: "Durante os **14 dias de teste grátis**, não há nenhuma cobrança! ✅\n\nSó após o período de teste, se você optar por continuar:\n1. Você escolhe o plano desejado\n2. Informa a forma de pagamento\n3. A primeira cobrança ocorre neste momento\n\n**Não há cobrança automática ao fim do trial** — você precisa confirmar ativamente que quer continuar. Sem surpresas na fatura!",
  },
  {
    id: 'plan_compare_table',
    keywords: ['tabela comparativa', 'tabela de planos', 'ver todos planos', 'comparar todos', 'quadro comparativo', 'resumo planos', 'resumo dos planos', 'todos os planos'],
    response: "Comparativo completo dos planos:\n\n| Recurso | Start | Pro | Elite |\n|---|:---:|:---:|:---:|\n| Preço/mês | R$ 197 | R$ 297 | R$ 497 |\n| OS Ilimitadas | ✅ | ✅ | ✅ |\n| Clientes/Veículos | ✅ | ✅ | ✅ |\n| Dashboard | ✅ | ✅ | ✅ |\n| Financeiro Básico | ✅ | ✅ | ✅ |\n| WhatsApp Automático | ❌ | ✅ | ✅ |\n| Checklist HD / Fotos | ❌ | ✅ | ✅ |\n| Comissões Automáticas | ❌ | ✅ | ✅ |\n| Agenda Avançada | ❌ | ✅ | ✅ |\n| Multi-Filiais | ❌ | ❌ | ✅ |\n| API / Integrações | ❌ | ❌ | ✅ |\n| Suporte VIP | ❌ | ❌ | ✅ |\n| Usuários | 3 | 10 | Ilimitado |\n\nQual deles faz mais sentido para a sua realidade?",
    showTopics: true,
  },

  // --- Perguntas de custo benefício e ROI ---
  {
    id: 'plan_roi_start',
    keywords: ['roi start', 'retorno start', 'start compensa', 'compensar start', 'lucro com start', 'start vale a pena'],
    response: "O **Plano Start (R$ 197/mês)** tem ROI quase imediato:\n\n📊 **Em 1 semana do sistema:**\n• Você para de perder OS não registradas\n• Sabe exatamente o que cada cliente deve\n• Tem um PDF profissional para enviar ao cliente\n\n💡 **Cálculo simples:**\nSe você perdia apenas 1 OS de R$ 200 por mês por falta de controle → O sistema paga a própria mensalidade.\n\nNa prática, nossos clientes Start encontram em média **3-5 OS 'esquecidas'** nas primeiras 2 semanas. São R$ 600-1.500 de receita recuperada só na primeira quinzena!",
    hasAction: true,
    actionLabel: "Recuperar Minha Receita Perdida",
    actionType: 'link',
    url: '/register',
  },
  {
    id: 'plan_roi_pro',
    keywords: ['roi pro', 'retorno pro', 'pro compensa', 'compensar pro', 'lucro com pro', 'pro vale a pena', 'vale pagar 297'],
    response: "O **Plano Pro (R$ 297/mês)** tem o ROI mais fácil de visualizar:\n\n📱 **WhatsApp Automático recupera orçamentos:**\nSe você envia 20 orçamentos/mês e converte 60%, são 12 OS. Com WhatsApp automático, estudos mostram aumento de 25-30% na conversão → 15-16 OS. São 3 OS extras de R$ 300 cada = **R$ 900 extras/mês**.\n\n📸 **Checklist HD evita prejuízos:**\nUm único desentendimento sobre dano de carro pode custar R$ 1.000-5.000. O Checklist te protege legalmente indefinidamente.\n\n🔧 **Comissões automáticas:**\nEconomia de 4-8h mensais que você ou sua gerente gastam calculando. Em tempo de gestão, isso vale muito.\n\n**Resumo:** R$ 297 investidos → R$ 900+ em OS recuperadas + proteção jurídica + horas economizadas.",
    hasAction: true,
    actionLabel: "Quero Esses R$ 900 Extras",
    actionType: 'link',
    url: '/register',
  },
  {
    id: 'plan_roi_elite',
    keywords: ['roi elite', 'retorno elite', 'elite compensa', 'compensar elite', 'lucro com elite', 'elite vale a pena', 'vale pagar 497'],
    response: "O **Plano Elite (R$ 497/mês)** é um investimento para quem já fatura mais de R$ 30k/mês ou tem múltiplas unidades:\n\n🏢 **Multi-filiais:**\nA visibilidade consolidada de 2+ oficinas economiza dias de trabalho manual. Detectar que uma filial tem custo alto em peças ou baixa produtividade pode economizar R$ 3-5k/mês.\n\n📊 **Relatórios corporativos:**\nIdentificar que seu ticket médio por serviço está abaixo do mercado e ajustar a precificação pode aumentar o faturamento em 15-20% sem atender mais clientes.\n\n🔗 **API e integrações:**\nAutomação com sistema de contabilidade elimina horas de retrabalho. Em equipes maiores, são 8-15h/mês economizadas.\n\n**Conclusão:** Para redes e grandes centros, R$ 497/mês é o custo de 1 hora de gestão ineficiente por dia. O sistema paga muito mais do que custa.",
    hasAction: true,
    actionLabel: "Demonstração do Elite",
    actionMsg: "Olá! Quero entender o ROI do Plano Elite para minha rede/grande oficina.",
  },
  {
    id: 'plan_too_small',
    keywords: ['sou pequeno demais', 'sistema para mim', 'oficina familiar', 'so eu e meu filho', 'mecanico autonomo', 'freelancer', 'trabalho em casa', 'pequeno demais para sistema'],
    response: "Você **nunca é pequeno demais** para o MecaERP! 💪\n\nMesmo trabalhando sozinho ou com família, você vai se beneficiar de:\n\n• **PDF profissional** da OS — impressiona o cliente e justifica preços premium\n• **Histórico de veículos** — saben exatamente o que foi feito em cada carro\n• **Controle financeiro** — saber o que entrou, saiu e o que lucrou\n• **WhatsApp automático** (Pro) — você atende mais com menos esforço\n\nNosso cliente mais pequeno é um mecânico autônomo que opera da própria garagem. O sistema ajudou ele a **triplicar o ticket médio** porque os clientes passaram a enxergá-lo como profissional.",
    hasAction: true,
    actionLabel: "Começar Minha Evolução",
    actionType: 'link',
    url: '/register',
  },
  {
    id: 'plan_not_sure',
    keywords: ['nao sei qual escolher', 'tenho duvida qual plano', 'me indica um plano', 'qual voce recomenda', 'qual devo pegar', 'me ajuda escolher'],
    response: "Deixa eu te ajudar a escolher! Responda mentalmente:\n\n**1. Você já tem equipe de mecânicos?**\n→ Sim → Pro (comissões automáticas vale muito)\n→ Não/Trabalho sozinho → Start\n\n**2. Você manda orçamentos por WhatsApp manualmente hoje?**\n→ Sim → Pro (automatiza e aumenta conversão)\n→ Não envio → Start\n\n**3. Você tem mais de 1 oficina?**\n→ Sim → Elite\n→ Não → Start ou Pro\n\n**Minha recomendação geral:** Começa com o **Pro**. A maioria das oficinas que testa o Pro nunca volta para o Start depois de ver o WhatsApp automático funcionando. E você tem 14 dias grátis para confirmar!",
    hasAction: true,
    actionLabel: "Testar o Pro Grátis",
    actionType: 'link',
    url: '/register',
  },

  // --- Perguntas sobre o sistema em geral ---
  {
    id: 'system_complete_overview',
    keywords: ['me explica tudo', 'tudo sobre o sistema', 'visao geral completa', 'explicar tudo', 'como funciona tudo', 'o sistema completo', 'todos os modulos'],
    response: "O MecaERP tem **9 módulos integrados** que trabalham juntos:\n\n🔑 **1. Ordens de Serviço** — Crie, acompanhe e finalize OS com PDF profissional\n👤 **2. Clientes & CRM** — Histórico completo, tags, importação em massa\n🚗 **3. Veículos** — Busca por placa, histórico eterno, controle de KM\n💰 **4. Financeiro** — DRE, Fluxo de Caixa, Contas a Pagar/Receber\n📦 **5. Estoque** — Peças, fornecedores, alertas de mínimo, Curva ABC\n📱 **6. WhatsApp Automático** — Orçamentos, avisos, lembretes de revisão\n📸 **7. Checklist HD** — Fotos de entrada + assinatura digital do cliente\n📅 **8. Agenda** — Horários, boxes, mecânicos por atendimento\n📊 **9. Dashboard & Relatórios** — BI, KPIs, performance por mecânico\n\nTodos os módulos se integram — uma OS atualiza o estoque, o financeiro e o histórico do cliente simultaneamente!",
  },
  {
    id: 'system_why_choose',
    keywords: ['por que escolher mecaerp', 'por que voces', 'motivo escolher', 'diferenciais reais', 'o que voces fazem diferente', 'vantagem real', 'ponto forte'],
    response: "**5 razões reais para escolher o MecaERP:**\n\n🇧🇷 **1. Feito para o Brasil** — Não é tradução de sistema estrangeiro. Foi criado entendendo as necessidades reais da mecânica brasileira.\n\n📱 **2. WhatsApp como você conhece** — Integração nativa com WhatsApp (não API cara), funcionando desde o dia 1.\n\n⚡ **3. O mais fácil do mercado** — Interface que qualquer mecânico aprende em 1 dia, sem cursos caros.\n\n🔒 **4. Seus dados são seus** — Nunca vendemos ou compartilhamos dados dos clientes das oficinas.\n\n🤝 **5. Suporte real em português** — Pessoas que conhecem mecânica e sabem do que estão falando, não robôs ou call centers no exterior.",
  },
  {
    id: 'system_updates',
    keywords: ['atualização do sistema', 'versao nova', 'melhorias', 'novidades', 'o sistema melhora', 'voces atualizam', 'frequencia atualizacao'],
    response: "O MecaERP é **atualizado continuamente**! 🔄\n\n• Lançamos melhorias toda semana\n• Atualizações são automáticas (você não faz nada)\n• Novos recursos sugeridos pelos clientes são priorizados\n• Nenhuma atualização causa instabilidade no sistema\n\nVocê recebe um e-mail com as novidades de cada atualização importante. Quanto mais você usa e sugere, melhor o sistema fica para todos!",
  },
];
