/**
 * WPPConnect Service - WhatsApp Integration
 * 
 * Microserviço responsável por:
 * - Gerenciar sessões do WhatsApp (QR Code)
 * - Enviar e receber mensagens
 * - Gerenciar status de conexão
 * 
 * IMPORTANTE: WPPConnect é uma solução não-oficial. 
 * Use com cautela e esteja preparado para migrar para API oficial se necessário.
 */

// @ts-ignore - Instalação em andamento (npm install @wppconnect-team/wppconnect)
import * as wppconnect from '@wppconnect-team/wppconnect';
import db from '../db';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

interface SessionData {
  client: any;
  status: 'disconnected' | 'connecting' | 'connected' | 'qr_ready';
  qrCode?: string;
  phoneNumber?: string;
}

class WPPConnectService extends EventEmitter {
  private sessions: Map<string, SessionData> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;

  constructor() {
    super();
    this.initExistingSessions();
  }

  /**
   * Inicializa sessões ativas ao startar o serviço
   */
  private async initExistingSessions() {
    try {
      const activeSessions = db
        .prepare(`SELECT * FROM whatsapp_sessions WHERE is_active = 1`)
        .all() as any[];

      console.log(`📱 Initializing ${activeSessions.length} WhatsApp sessions...`);

      for (const session of activeSessions) {
        await this.startSession(session.tenant_id, session.session_name);
      }
    } catch (error: any) {
      console.error('❌ Error initializing WhatsApp sessions:', error.message);
    }
  }

  /**
   * Inicia uma nova sessão WhatsApp
   */
  async startSession(tenantId: string, sessionName: string = 'default'): Promise<{ success: boolean; qrCode?: string; error?: string }> {
    const sessionKey = `${tenantId}_${sessionName}`;

    try {
      // Verificar se sessão já existe
      if (this.sessions.has(sessionKey)) {
        const session = this.sessions.get(sessionKey)!;
        if (session.status === 'connected') {
          return { success: true };
        }
      }

      // Atualizar status no banco
      this.updateSessionStatus(tenantId, sessionName, 'connecting');

      // Criar cliente WPPConnect
      const client = await wppconnect.create({
        session: sessionKey,
        puppeteerOptions: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
        autoClose: 300000, // 5 minutos (300 segundos)
        logQR: false,
        disableWelcome: true,
        updatesLog: false,

        // QR Code Callback
        catchQR: (base64Qr: string, asciiQR: string, attempts: number) => {
          console.log(`📱 QR Code gerado para sessão ${sessionKey} (tentativa ${attempts})`);
          
          // Salvar QR no banco
          this.updateSessionQR(tenantId, sessionName, base64Qr);

          // Emitir evento
          this.emit('qr', { tenantId, sessionName, qrCode: base64Qr, attempts });
        },

        // Status Callback
        statusFind: (statusSession: string, session: string) => {
          console.log(`📊 Status da sessão ${session}: ${statusSession}`);

          if (statusSession === 'isLogged') {
            this.updateSessionStatus(tenantId, sessionName, 'connected');
            this.reconnectAttempts.set(sessionKey, 0);
          } else if (statusSession === 'qrReadSuccess') {
            this.updateSessionStatus(tenantId, sessionName, 'connecting');
          } else if (statusSession === 'notLogged') {
            this.updateSessionStatus(tenantId, sessionName, 'qr_ready');
          } else if (statusSession === 'disconnectedMobile' || statusSession === 'browserClose') {
            console.warn(`⚠️ Desconexão detectada: ${statusSession}`);
            this.updateSessionStatus(tenantId, sessionName, 'disconnected');
          }

          this.emit('status', { tenantId, sessionName, status: statusSession });
        },
      });

      // Configurar handlers de mensagens
      this.setupMessageHandlers(client, tenantId, sessionName);

      // Obter número do WhatsApp conectado
      const hostDevice = await client.getHostDevice();
      const phoneNumber = (hostDevice?.id as any)?.user || hostDevice?.id || null;

      if (phoneNumber) {
        db.prepare(
          `UPDATE whatsapp_sessions 
           SET phone_number = ?, last_connected_at = CURRENT_TIMESTAMP 
           WHERE tenant_id = ? AND session_name = ?`
        ).run(phoneNumber, tenantId, sessionName);
      }

      // Armazenar sessão
      this.sessions.set(sessionKey, {
        client,
        status: 'connected',
        phoneNumber,
      });

      this.updateSessionStatus(tenantId, sessionName, 'connected');

      console.log(`✅ Sessão ${sessionKey} conectada com sucesso!`);
      return { success: true };

    } catch (error: any) {
      console.error(`❌ Erro ao iniciar sessão ${sessionKey}:`, error.message);
      this.updateSessionStatus(tenantId, sessionName, 'disconnected');

      // Não reconectar automaticamente se for timeout do QR code (usuário não escaneou)
      if (error.message !== 'Auto Close Called') {
        await this.handleReconnect(tenantId, sessionName);
      } else {
        console.log(`⏱️ Timeout do QR Code para sessão ${sessionKey}. Aguardando nova tentativa manual.`);
        this.reconnectAttempts.delete(sessionKey);
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * Reconexão automática
   */
  private async handleReconnect(tenantId: string, sessionName: string) {
    const sessionKey = `${tenantId}_${sessionName}`;
    const attempts = this.reconnectAttempts.get(sessionKey) || 0;

    if (attempts < this.maxReconnectAttempts) {
      this.reconnectAttempts.set(sessionKey, attempts + 1);
      console.log(`🔄 Tentando reconectar sessão ${sessionKey} (${attempts + 1}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        this.startSession(tenantId, sessionName);
      }, 10000 * (attempts + 1)); // Backoff exponencial
    } else {
      console.error(`❌ Máximo de tentativas de reconexão atingido para ${sessionKey}`);
      this.updateSessionStatus(tenantId, sessionName, 'disconnected');
    }
  }

  /**
   * Configura handlers para receber mensagens
   */
  private setupMessageHandlers(client: any, tenantId: string, sessionName: string) {
    const sessionKey = `${tenantId}_${sessionName}`;

    // Monitorar mudanças de estado da conexão
    client.onStateChange((state: any) => {
      console.log(`🔄 Estado da sessão ${sessionKey}: ${state}`);
      
      if (state === 'CONFLICT' || state === 'UNPAIRED' || state === 'UNLAUNCHED') {
        console.warn(`⚠️ Sessão ${sessionKey} desconectada: ${state}`);
        this.updateSessionStatus(tenantId, sessionName, 'disconnected');
        
        // Remover da memória
        this.sessions.delete(sessionKey);
        
        // Tentar reconectar após 15 segundos
        setTimeout(() => {
          console.log(`🔄 Tentando reconectar ${sessionKey} após desconexão...`);
          this.startSession(tenantId, sessionName);
        }, 15000);
      }
    });

    client.onMessage(async (message: any) => {
      try {
        console.log(`📩 Mensagem recebida:`, message.from, message.body);

        // Processar mensagem recebida
        await this.handleIncomingMessage(tenantId, message);

      } catch (error: any) {
        console.error('❌ Erro ao processar mensagem recebida:', error.message);
      }
    });

    client.onAck(async (ack: any) => {
      // Atualizar status de entrega/leitura
      this.handleAck(tenantId, ack);
    });
  }

  /**
   * Processa mensagem recebida (IN)
   */
  private async handleIncomingMessage(tenantId: string, message: any) {
    try {
      // Extrair dados da mensagem
      const phone = message.from.replace('@c.us', '');
      const contactName = message.sender?.pushname || message.notifyName || phone;
      const body = message.body || '';
      const type = this.getMessageType(message);
      const mediaUrl = message.downloadMedia ? await this.downloadMedia(message) : null;

      // Buscar ou criar conversa
      let conversation = db
        .prepare(`SELECT * FROM whatsapp_conversations WHERE tenant_id = ? AND phone = ?`)
        .get(tenantId, phone) as any;

      if (!conversation) {
        // Criar nova conversa
        const conversationId = uuidv4();
        db.prepare(
          `INSERT INTO whatsapp_conversations 
           (id, tenant_id, phone, contact_name, last_message_at, last_message_preview, unread_count, status)
           VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, 1, 'open')`
        ).run(conversationId, tenantId, phone, contactName, body.substring(0, 100));

        conversation = { id: conversationId };
      } else {
        // Atualizar conversa existente
        db.prepare(
          `UPDATE whatsapp_conversations 
           SET last_message_at = CURRENT_TIMESTAMP,
               last_message_preview = ?,
               unread_count = unread_count + 1,
               contact_name = COALESCE(contact_name, ?)
           WHERE id = ?`
        ).run(body.substring(0, 100), contactName, conversation.id);
      }

      // Salvar mensagem
      const messageId = uuidv4();
      db.prepare(
        `INSERT INTO whatsapp_messages 
         (id, tenant_id, conversation_id, direction, type, body, media_url, sent_status, wpp_message_id, created_at)
         VALUES (?, ?, ?, 'in', ?, ?, ?, 'delivered', ?, CURRENT_TIMESTAMP)`
      ).run(messageId, tenantId, conversation.id, type, body, mediaUrl, message.id);

      // Emitir evento para notificar frontend
      this.emit('message', {
        tenantId,
        conversationId: conversation.id,
        messageId,
        phone,
        contactName,
        body,
        type,
      });

      // Verificar se bot está ativo para esta conversa
      if (conversation.bot_enabled) {
        // Processar com bot (implementar depois)
        this.emit('bot_process', { tenantId, conversationId: conversation.id, message: body });
      }

    } catch (error: any) {
      console.error('❌ Erro ao processar mensagem recebida:', error.message);
    }
  }

  /**
   * Envia mensagem (OUT)
   */
  async sendMessage(
    tenantId: string,
    phone: string,
    message: string,
    options: {
      sessionName?: string;
      conversationId?: string;
      origin?: 'human' | 'bot' | 'system' | 'automation';
      relatedType?: string;
      relatedId?: string;
      templateId?: string;
    } = {}
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const sessionName = options.sessionName || 'default';
    const sessionKey = `${tenantId}_${sessionName}`;

    try {
      const session = this.sessions.get(sessionKey);

      if (!session || session.status !== 'connected') {
        throw new Error('Sessão WhatsApp não conectada');
      }

      // Formatar número (adicionar @c.us se necessário)
      const formattedPhone = phone.includes('@') ? phone : `${phone}@c.us`;

      // Enviar mensagem via WPPConnect
      const result = await session.client.sendText(formattedPhone, message);

      // Buscar ou criar conversa
      let conversation = db
        .prepare(`SELECT * FROM whatsapp_conversations WHERE tenant_id = ? AND phone = ?`)
        .get(tenantId, phone.replace('@c.us', '')) as any;

      if (!conversation) {
        const conversationId = uuidv4();
        db.prepare(
          `INSERT INTO whatsapp_conversations 
           (id, tenant_id, phone, last_message_at, last_message_preview, status)
           VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, 'open')`
        ).run(conversationId, tenantId, phone.replace('@c.us', ''), message.substring(0, 100));

        conversation = { id: conversationId };
      } else {
        db.prepare(
          `UPDATE whatsapp_conversations 
           SET last_message_at = CURRENT_TIMESTAMP,
               last_message_preview = ?
           WHERE id = ?`
        ).run(message.substring(0, 100), conversation.id);
      }

      // Salvar mensagem no banco
      const messageId = uuidv4();
      db.prepare(
        `INSERT INTO whatsapp_messages 
         (id, tenant_id, conversation_id, direction, type, body, sent_status, origin, 
          related_type, related_id, template_id, wpp_message_id, created_at)
         VALUES (?, ?, ?, 'out', 'text', ?, 'sent', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
      ).run(
        messageId,
        tenantId,
        options.conversationId || conversation.id,
        message,
        options.origin || 'human',
        options.relatedType || null,
        options.relatedId || null,
        options.templateId || null,
        result.id || null
      );

      console.log(`✅ Mensagem enviada para ${phone}`);

      // Emitir evento
      this.emit('message_sent', { tenantId, messageId, phone, body: message });

      return { success: true, messageId };

    } catch (error: any) {
      console.error(`❌ Erro ao enviar mensagem:`, error.message);

      // Registrar erro
      if (options.conversationId) {
        const messageId = uuidv4();
        db.prepare(
          `INSERT INTO whatsapp_messages 
           (id, tenant_id, conversation_id, direction, type, body, sent_status, origin, error_message, created_at)
           VALUES (?, ?, ?, 'out', 'text', ?, 'error', ?, ?, CURRENT_TIMESTAMP)`
        ).run(
          messageId,
          tenantId,
          options.conversationId,
          message,
          options.origin || 'human',
          error.message
        );
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * Obtém status da sessão
   */
  getSessionStatus(tenantId: string, sessionName: string = 'default') {
    const sessionKey = `${tenantId}_${sessionName}`;
    const session = this.sessions.get(sessionKey);

    const dbSession = db
      .prepare(`SELECT * FROM whatsapp_sessions WHERE tenant_id = ? AND session_name = ?`)
      .get(tenantId, sessionName) as any;

    return {
      status: session?.status || dbSession?.status || 'disconnected',
      phoneNumber: session?.phoneNumber || dbSession?.phone_number,
      qrCode: dbSession?.qr_code,
      isActive: dbSession?.is_active === 1,
      lastConnectedAt: dbSession?.last_connected_at,
    };
  }

  /**
   * Desconecta sessão
   */
  async disconnectSession(tenantId: string, sessionName: string = 'default') {
    const sessionKey = `${tenantId}_${sessionName}`;

    try {
      const session = this.sessions.get(sessionKey);

      if (session?.client) {
        await session.client.close();
      }

      this.sessions.delete(sessionKey);
      this.updateSessionStatus(tenantId, sessionName, 'disconnected');

      console.log(`✅ Sessão ${sessionKey} desconectada`);
      return { success: true };

    } catch (error: any) {
      console.error(`❌ Erro ao desconectar sessão:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // ========================================
  // HELPERS
  // ========================================

  private updateSessionStatus(
    tenantId: string,
    sessionName: string,
    status: 'disconnected' | 'connecting' | 'connected' | 'qr_ready'
  ) {
    try {
      const existing = db
        .prepare(`SELECT id FROM whatsapp_sessions WHERE tenant_id = ? AND session_name = ?`)
        .get(tenantId, sessionName) as any;

      if (existing) {
        db.prepare(
          `UPDATE whatsapp_sessions 
           SET status = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE tenant_id = ? AND session_name = ?`
        ).run(status, tenantId, sessionName);
      } else {
        db.prepare(
          `INSERT INTO whatsapp_sessions (id, tenant_id, session_name, status)
           VALUES (?, ?, ?, ?)`
        ).run(uuidv4(), tenantId, sessionName, status);
      }
    } catch (error: any) {
      console.error('❌ Erro ao atualizar status da sessão:', error.message);
    }
  }

  private updateSessionQR(tenantId: string, sessionName: string, qrCode: string) {
    try {
      db.prepare(
        `UPDATE whatsapp_sessions 
         SET qr_code = ?, status = 'qr_ready', updated_at = CURRENT_TIMESTAMP 
         WHERE tenant_id = ? AND session_name = ?`
      ).run(qrCode, tenantId, sessionName);
    } catch (error: any) {
      console.error('❌ Erro ao atualizar QR Code:', error.message);
    }
  }

  private getMessageType(message: any): 'text' | 'image' | 'pdf' | 'audio' | 'video' | 'document' {
    if (message.isMedia) {
      if (message.mimetype?.includes('image')) return 'image';
      if (message.mimetype?.includes('pdf')) return 'pdf';
      if (message.mimetype?.includes('audio')) return 'audio';
      if (message.mimetype?.includes('video')) return 'video';
      return 'document';
    }
    return 'text';
  }

  private async downloadMedia(message: any): Promise<string | null> {
    try {
      // Implementar download de mídia se necessário
      // Por enquanto, retornar null
      return null;
    } catch (error) {
      return null;
    }
  }

  private handleAck(tenantId: string, ack: any) {
    try {
      // Atualizar status da mensagem baseado no ACK
      // 1 = sent, 2 = delivered, 3 = read
      const statusMap: any = {
        1: 'sent',
        2: 'delivered',
        3: 'read',
      };

      const status = statusMap[ack.ack] || 'sent';

      db.prepare(
        `UPDATE whatsapp_messages 
         SET sent_status = ? 
         WHERE wpp_message_id = ? AND tenant_id = ?`
      ).run(status, ack.id, tenantId);

    } catch (error: any) {
      console.error('❌ Erro ao processar ACK:', error.message);
    }
  }
}

// Singleton instance
export const wppConnectService = new WPPConnectService();
export default wppConnectService;
