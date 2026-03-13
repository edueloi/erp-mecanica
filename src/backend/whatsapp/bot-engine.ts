/**
 * Bot Engine - WhatsApp Chatbot para MecaERP
 *
 * Processa mensagens automaticamente quando:
 * 1. O tenant tem `whatsapp_bot_enabled = true` nas configurações
 * 2. A conversa específica tem `bot_enabled = true`
 *
 * Fluxos implementados:
 * - Saudação/Menu principal
 * - Agendamento de serviço (state machine)
 * - Consulta de status de OS
 * - Fallback para atendente humano
 */

import db from '../db';
import wppConnectService from './wppconnect-service';

// ========================================
// TYPES
// ========================================

interface BotState {
  topic: 'menu' | 'agendamento' | 'status_os' | 'orcamento' | 'falar_atendente';
  step: number;
  data: {
    service?: string;
    plate?: string;
    date?: string;
    time?: string;
    name?: string;
  };
  lastInteraction: string; // ISO date
}

interface ConversationData {
  id: string;
  tenant_id: string;
  phone: string;
  phone_e164: string;
  contact_name: string;
  display_name: string;
  bot_enabled: number;
  bot_topic: string | null;
  bot_state: string | null;
  client_id: string | null;
}

// ========================================
// BOT ENGINE CLASS
// ========================================

class BotEngine {
  private initialized = false;

  /**
   * Inicializa o bot engine - registra listeners nos eventos do WPPConnect
   */
  init() {
    if (this.initialized) return;

    console.log('🤖 Bot Engine inicializado');

    // Escutar evento bot_process emitido pelo wppconnect-service
    wppConnectService.on('bot_process', async (data: { tenantId: string; conversationId: string; message: string }) => {
      try {
        await this.processMessage(data.tenantId, data.conversationId, data.message);
      } catch (error: any) {
        console.error('❌ [Bot] Erro ao processar mensagem:', error.message);
      }
    });

    this.initialized = true;
  }

  /**
   * Processa uma mensagem recebida e decide a resposta
   */
  private async processMessage(tenantId: string, conversationId: string, message: string) {
    try {
      // 1. Verificar se o tenant tem bot habilitado nas configurações
      const tenantSettings = await db.queryOne(
        `SELECT value FROM tenant_settings WHERE tenant_id = ? AND \`key\` = 'whatsapp_bot_enabled'`,
        [tenantId]
      );

      if (!tenantSettings || tenantSettings.value !== '1' && tenantSettings.value !== 'true') {
        console.log(`🤖 [Bot] Bot desabilitado para tenant ${tenantId}`);
        return;
      }

      // 2. Buscar dados da conversa
      const conversation = await db.queryOne(
        `SELECT * FROM whatsapp_conversations WHERE id = ? AND tenant_id = ?`,
        [conversationId, tenantId]
      ) as ConversationData;

      if (!conversation) {
        console.error(`❌ [Bot] Conversa não encontrada: ${conversationId}`);
        return;
      }

      // 3. Recuperar estado do bot para esta conversa
      let botState: BotState;
      try {
        botState = conversation.bot_state ? JSON.parse(conversation.bot_state) : this.getInitialState();
      } catch (e) {
        botState = this.getInitialState();
      }

      // 4. Normalizar mensagem do usuário
      const normalizedMsg = message.trim().toLowerCase();

      // 5. Verificar comandos globais (sempre disponíveis)
      if (this.isHumanRequest(normalizedMsg)) {
        await this.transferToHuman(tenantId, conversationId, conversation);
        return;
      }

      // 6. Processar baseado no tópico/estado atual
      let response: string;

      switch (botState.topic) {
        case 'menu':
          response = await this.handleMenu(normalizedMsg, botState, tenantId, conversationId);
          break;
        case 'agendamento':
          response = await this.handleAgendamento(normalizedMsg, botState, tenantId, conversationId);
          break;
        case 'status_os':
          response = await this.handleStatusOS(normalizedMsg, botState, tenantId, conversationId);
          break;
        default:
          response = this.getGreeting(conversation);
          botState = this.getInitialState();
          break;
      }

      // 7. Salvar estado atualizado
      botState.lastInteraction = new Date().toISOString();
      await this.saveBotState(conversationId, botState);

      // 8. Enviar resposta
      if (response) {
        await this.sendBotMessage(tenantId, conversationId, conversation.phone_e164 || conversation.phone, response);
      }

    } catch (error: any) {
      console.error('❌ [Bot] Erro no processamento:', error.message);

      // Enviar mensagem de erro genérica
      try {
        const conv = await db.queryOne(
          `SELECT phone, phone_e164 FROM whatsapp_conversations WHERE id = ?`,
          [conversationId]
        );
        if (conv) {
          await this.sendBotMessage(
            tenantId, conversationId,
            conv.phone_e164 || conv.phone,
            '⚠️ Desculpe, ocorreu um erro no meu processamento. Um atendente será notificado. Por favor, aguarde.'
          );
        }
      } catch (e) {}
    }
  }

  // ========================================
  // FLUXO: MENU PRINCIPAL
  // ========================================

  private async handleMenu(msg: string, state: BotState, tenantId: string, conversationId: string): Promise<string> {
    // Detectar intenção do usuário
    if (this.matchesIntent(msg, ['agendar', 'agendamento', 'marcar', 'horário', 'horario', 'reservar', 'disponível', 'disponivel', '1'])) {
      state.topic = 'agendamento';
      state.step = 1;
      return this.getAgendamentoStep1();
    }

    if (this.matchesIntent(msg, ['status', 'andamento', 'como está', 'como esta', 'minha os', 'meu carro', 'pronto', 'previsão', 'previsao', '2'])) {
      state.topic = 'status_os';
      state.step = 1;
      return '🔍 *Consultar Status da OS*\n\nPor favor, informe o *número da OS* ou a *placa do veículo*:';
    }

    if (this.matchesIntent(msg, ['orçamento', 'orcamento', 'preço', 'preco', 'valor', 'quanto', '3'])) {
      return '💰 Para solicitar um orçamento, por favor nos envie:\n\n' +
             '• Modelo/ano do veículo\n' +
             '• Serviço desejado\n' +
             '• Fotos/vídeos do problema (se houver)\n\n' +
             'Um de nossos técnicos irá responder em breve! 🔧\n\n' +
             '_Digite *menu* para voltar ao menu principal_';
    }

    if (this.matchesIntent(msg, ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'hi', 'hello', 'ei', 'eai', 'e aí', 'menu'])) {
      return await this.getMenuMessage(tenantId);
    }

    // Mensagem não reconhecida - mostrar menu
    return '🤔 Não entendi sua mensagem.\n\n' + await this.getMenuMessage(tenantId);
  }

  // ========================================
  // FLUXO: AGENDAMENTO (State Machine)
  // ========================================

  private async handleAgendamento(msg: string, state: BotState, tenantId: string, conversationId: string): Promise<string> {
    // Permitir cancelar agendamento
    if (this.matchesIntent(msg, ['cancelar', 'voltar', 'menu', 'sair'])) {
      state.topic = 'menu';
      state.step = 0;
      state.data = {};
      return '↩️ Agendamento cancelado.\n\n' + await this.getMenuMessage(tenantId);
    }

    switch (state.step) {
      case 1: // Perguntar serviço
        return this.handleAgendamentoStep1(msg, state);

      case 2: // Perguntar placa
        return this.handleAgendamentoStep2(msg, state);

      case 3: // Perguntar data/horário
        return this.handleAgendamentoStep3(msg, state, tenantId);

      case 4: // Confirmar
        return await this.handleAgendamentoStep4(msg, state, tenantId, conversationId);

      default:
        state.step = 1;
        return this.getAgendamentoStep1();
    }
  }

  private getAgendamentoStep1(): string {
    return '📅 *Agendamento de Serviço*\n\n' +
           'Qual serviço você precisa?\n\n' +
           '1️⃣ Troca de óleo\n' +
           '2️⃣ Revisão completa\n' +
           '3️⃣ Freios\n' +
           '4️⃣ Suspensão\n' +
           '5️⃣ Elétrica\n' +
           '6️⃣ Outro\n\n' +
           '_Responda com o número ou descreva o serviço_\n' +
           '_Digite *cancelar* para voltar_';
  }

  private handleAgendamentoStep1(msg: string, state: BotState): string {
    const serviceMap: Record<string, string> = {
      '1': 'Troca de óleo',
      '2': 'Revisão completa',
      '3': 'Freios',
      '4': 'Suspensão',
      '5': 'Elétrica',
      '6': 'Outro',
      'oleo': 'Troca de óleo',
      'óleo': 'Troca de óleo',
      'troca de oleo': 'Troca de óleo',
      'troca de óleo': 'Troca de óleo',
      'revisao': 'Revisão completa',
      'revisão': 'Revisão completa',
      'freio': 'Freios',
      'freios': 'Freios',
      'suspensao': 'Suspensão',
      'suspensão': 'Suspensão',
      'eletrica': 'Elétrica',
      'elétrica': 'Elétrica',
    };

    const service = serviceMap[msg] || msg.substring(0, 50);
    state.data.service = service;
    state.step = 2;

    return `✅ Serviço: *${service}*\n\n🚗 Agora informe a *placa do veículo*:\n_(Formato: ABC-1234 ou ABC1D23)_`;
  }

  private handleAgendamentoStep2(msg: string, state: BotState): string {
    // Validar formato da placa (brasileira)
    const plate = msg.toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (plate.length < 6 || plate.length > 7) {
      return '⚠️ Placa inválida. Informe no formato:\n• *ABC-1234* (antigo)\n• *ABC1D23* (Mercosul)\n\nTente novamente:';
    }

    state.data.plate = plate;
    state.step = 3;

    return `✅ Placa: *${plate}*\n\n📅 Qual *data e horário* você prefere?\n\n` +
           'Exemplos:\n' +
           '• _amanhã de manhã_\n' +
           '• _segunda-feira às 14h_\n' +
           '• _15/03 às 9h_\n\n' +
           '_Responderemos com horários disponíveis_';
  }

  private handleAgendamentoStep3(msg: string, state: BotState, tenantId: string): string {
    state.data.date = msg;
    state.step = 4;

    return '📋 *Confirme seu agendamento:*\n\n' +
           `🔧 Serviço: *${state.data.service}*\n` +
           `🚗 Placa: *${state.data.plate}*\n` +
           `📅 Horário: *${state.data.date}*\n\n` +
           'Confirma? Responda:\n' +
           '✅ *Sim* - Confirmar agendamento\n' +
           '❌ *Não* - Cancelar\n' +
           '✏️ *Alterar* - Recomeçar';
  }

  private async handleAgendamentoStep4(msg: string, state: BotState, tenantId: string, conversationId: string): Promise<string> {
    if (this.matchesIntent(msg, ['sim', 'confirmo', 'confirmar', 'ok', 'pode', 's', 'yes'])) {
      // Registrar agendamento no log/notificação
      try {
        // Marcar conversa com tag de agendamento pendente
        await db.execute(
          `UPDATE whatsapp_conversations
           SET tags = '["agendamento_pendente"]',
               bot_topic = 'agendamento_confirmado'
           WHERE id = ?`,
          [conversationId]
        );
      } catch (e) {}

      // Resetar estado do bot
      state.topic = 'menu';
      state.step = 0;
      const scheduleData = { ...state.data };
      state.data = {};

      return '✅ *Agendamento registrado!*\n\n' +
             `🔧 ${scheduleData.service}\n` +
             `🚗 ${scheduleData.plate}\n` +
             `📅 ${scheduleData.date}\n\n` +
             '📞 Um de nossos atendentes entrará em contato para *confirmar o horário exato*.\n\n' +
             'Obrigado por escolher nossos serviços! 🙏\n\n' +
             '_Digite *menu* para voltar ao menu principal_';
    }

    if (this.matchesIntent(msg, ['nao', 'não', 'cancelar', 'n', 'no'])) {
      state.topic = 'menu';
      state.step = 0;
      state.data = {};
      return '❌ Agendamento cancelado.\n\n' + await this.getMenuMessage(tenantId);
    }

    if (this.matchesIntent(msg, ['alterar', 'mudar', 'recomeçar', 'recomecar', 'editar'])) {
      state.step = 1;
      state.data = {};
      return '🔄 Ok, vamos recomeçar!\n\n' + this.getAgendamentoStep1();
    }

    return '🤔 Não entendi. Responda:\n✅ *Sim* - Confirmar\n❌ *Não* - Cancelar\n✏️ *Alterar* - Recomeçar';
  }

  // ========================================
  // FLUXO: STATUS DA OS
  // ========================================

  private async handleStatusOS(msg: string, state: BotState, tenantId: string, conversationId: string): Promise<string> {
    if (this.matchesIntent(msg, ['cancelar', 'voltar', 'menu', 'sair'])) {
      state.topic = 'menu';
      state.step = 0;
      return '↩️ Consulta cancelada.\n\n' + await this.getMenuMessage(tenantId);
    }

    // Tentar buscar OS pelo número ou placa
    const searchTerm = msg.toUpperCase().replace(/[^A-Z0-9-]/g, '');

    try {
      // Buscar por número da OS
      let workOrder = await db.queryOne(
        `SELECT wo.*, v.plate, v.model as vehicle_model, c.name as client_name
         FROM work_orders wo
         LEFT JOIN vehicles v ON wo.vehicle_id = v.id
         LEFT JOIN clients c ON wo.client_id = c.id
         WHERE wo.tenant_id = ? AND (wo.order_number LIKE ? OR wo.id LIKE ?)
         ORDER BY wo.created_at DESC LIMIT 1`,
        [tenantId, `%${searchTerm}%`, `%${searchTerm}%`]
      );

      // Se não encontrou por número, buscar por placa
      if (!workOrder) {
        workOrder = await db.queryOne(
          `SELECT wo.*, v.plate, v.model as vehicle_model, c.name as client_name
           FROM work_orders wo
           LEFT JOIN vehicles v ON wo.vehicle_id = v.id
           LEFT JOIN clients c ON wo.client_id = c.id
           WHERE wo.tenant_id = ? AND v.plate LIKE ?
           ORDER BY wo.created_at DESC LIMIT 1`,
          [tenantId, `%${searchTerm}%`]
        );
      }

      if (workOrder) {
        const statusEmoji: Record<string, string> = {
          'open': '🟡 Aberta',
          'in_progress': '🔵 Em Andamento',
          'waiting_approval': '🟠 Aguardando Aprovação',
          'approved': '🟢 Aprovada',
          'completed': '✅ Concluída',
          'delivered': '✅ Entregue',
          'cancelled': '❌ Cancelada',
        };

        const statusText = statusEmoji[workOrder.status] || workOrder.status;

        // Resetar estado
        state.topic = 'menu';
        state.step = 0;

        return `📋 *OS Encontrada!*\n\n` +
               `📝 OS: *${workOrder.order_number || workOrder.id.substring(0, 8)}*\n` +
               `🚗 Veículo: *${workOrder.vehicle_model || 'N/A'}* (${workOrder.plate || 'N/A'})\n` +
               `📊 Status: ${statusText}\n` +
               (workOrder.total_amount ? `💰 Valor: *R$ ${Number(workOrder.total_amount).toFixed(2)}*\n` : '') +
               `\n_Digite *menu* para voltar ao menu principal_`;
      } else {
        return '❌ Não encontrei nenhuma OS com esse número/placa.\n\n' +
               'Verifique os dados e tente novamente, ou digite *menu* para voltar.\n\n' +
               '_Dica: informe o número completo da OS ou a placa do veículo_';
      }
    } catch (error: any) {
      console.error('❌ [Bot] Erro ao consultar OS:', error.message);
      return '⚠️ Ocorreu um erro ao buscar a OS. Tente novamente ou procure um atendente.\n\n_Digite *atendente* para falar com alguém_';
    }
  }

  // ========================================
  // HELPERS
  // ========================================

  private getInitialState(): BotState {
    return {
      topic: 'menu',
      step: 0,
      data: {},
      lastInteraction: new Date().toISOString(),
    };
  }

  private async getMenuMessage(tenantId?: string): Promise<string> {
    let shopName = 'nossa oficina';

    if (tenantId) {
      try {
        const tenant = await db.queryOne(
          `SELECT value FROM tenant_settings WHERE tenant_id = ? AND \`key\` = 'shop_name'`,
          [tenantId]
        );
        if (tenant?.value) shopName = tenant.value;
      } catch (e) {}
    }

    return `👋 Olá! Bem-vindo(a) à *${shopName}*!\n\n` +
           'Como posso ajudar?\n\n' +
           '1️⃣ 📅 *Agendar* um serviço\n' +
           '2️⃣ 🔍 *Consultar* status da minha OS\n' +
           '3️⃣ 💰 *Solicitar* orçamento\n' +
           '4️⃣ 👤 *Falar* com um atendente\n\n' +
           '_Responda com o número da opção ou descreva o que precisa_';
  }

  private getGreeting(conversation: ConversationData): string {
    const name = conversation.display_name || conversation.contact_name || '';
    const greeting = name ? `Olá *${name}*! ` : 'Olá! ';
    return greeting + 'Bem-vindo(a)! 😊\n\n' + '(menu será exibido em seguida)';
  }

  private matchesIntent(msg: string, keywords: string[]): boolean {
    return keywords.some(kw => msg.includes(kw) || msg === kw);
  }

  private isHumanRequest(msg: string): boolean {
    const keywords = ['atendente', 'humano', 'pessoa', 'falar com alguem', 'falar com alguém',
                      'operador', 'ajuda humana', 'suporte', '4'];
    return keywords.some(kw => msg.includes(kw) || msg === kw);
  }

  private async transferToHuman(tenantId: string, conversationId: string, conversation: ConversationData) {
    try {
      // Desativar bot para esta conversa
      await db.execute(
        `UPDATE whatsapp_conversations
         SET bot_enabled = 0, bot_topic = 'transferred_to_human'
         WHERE id = ?`,
        [conversationId]
      );

      // Enviar mensagem de transferência
      await this.sendBotMessage(
        tenantId, conversationId,
        conversation.phone_e164 || conversation.phone,
        '👤 *Transferindo para atendente...*\n\n' +
        'Um de nossos atendentes irá continuar o atendimento.\n' +
        'Por favor, aguarde um momento. ⏳\n\n' +
        '_Horário de atendimento: Seg-Sex 8h às 18h_'
      );

      console.log(`🤖 [Bot] Conversa ${conversationId} transferida para humano`);
    } catch (error: any) {
      console.error('❌ [Bot] Erro ao transferir para humano:', error.message);
    }
  }

  private async saveBotState(conversationId: string, state: BotState) {
    try {
      await db.execute(
        `UPDATE whatsapp_conversations SET bot_state = ?, bot_topic = ? WHERE id = ?`,
        [JSON.stringify(state), state.topic, conversationId]
      );
    } catch (error: any) {
      console.error('❌ [Bot] Erro ao salvar estado:', error.message);
    }
  }

  private async sendBotMessage(tenantId: string, conversationId: string, phone: string, message: string) {
    try {
      await wppConnectService.sendMessage(tenantId, phone, message, {
        conversationId,
        origin: 'bot',
      });
      console.log(`🤖 [Bot] Mensagem enviada para conversa ${conversationId}`);
    } catch (error: any) {
      console.error('❌ [Bot] Erro ao enviar mensagem:', error.message);
    }
  }
}

// Singleton
export const botEngine = new BotEngine();
export default botEngine;
