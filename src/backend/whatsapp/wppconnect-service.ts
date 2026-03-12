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
import { normalizePhoneE164, getPhoneVariations } from '../utils/phoneNormalizer';
import { execSync } from 'child_process';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

interface SessionData {
  client: any;
  status: 'disconnected' | 'connecting' | 'connected' | 'qr_ready';
  qrCode?: string;
  phoneNumber?: string;
}

/**
 * Extrai o número de telefone de um WhatsApp ID (WID)
 * Exemplo: "5521999999999@c.us" → "5521999999999"
 */
function getPhoneFromWid(wid: string | any): string {
  if (!wid) return '';
  
  // Se for objeto, tentar pegar _serialized primeiro
  if (typeof wid === 'object') {
    wid = wid._serialized || wid.user || wid.toString();
  }
  
  // Converter para string e remover sufixo (@c.us, @lid, etc)
  return wid.toString().split('@')[0];
}

/**
 * Valida se uma string é um telefone válido
 * - Deve ter 10-15 dígitos
 * - Deve começar com código de país válido (1, 55, 44, 351, etc)
 * - Não pode ser apenas ID interno tipo 28390019088557
 */
function isValidPhone(phone: string): boolean {
  // Deve ter apenas dígitos
  if (!/^\d{10,15}$/.test(phone)) return false;
  
  // Deve começar com código de país válido (1-999)
  // Números brasileiros: 55 + DDD (2 dígitos) + número (8-9 dígitos) = 12-13 dígitos
  // Rejeitar números que começam com 2 ou 3 seguidos de 8 (padrão de ID interno)
  if (/^2[0-9]3[0-9]/.test(phone)) {
    console.log(`⚠️ Número rejeitado (parece ID @lid): ${phone}`);
    return false;
  }
  
  // Aceitar números que começam com códigos de país conhecidos
  const validCountryCodes = [
    /^1[0-9]{10}/, // EUA/Canadá (1 + 10 dígitos)
    /^55[0-9]{10,11}/, // Brasil (55 + 10-11 dígitos)
    /^44[0-9]{10}/, // Reino Unido
    /^351[0-9]{9}/, // Portugal
    /^34[0-9]{9}/, // Espanha
    /^\d{10,15}/ // Fallback genérico
  ];
  
  // Se começar com 55 (Brasil), validar DDD
  if (phone.startsWith('55')) {
    const ddd = phone.substring(2, 4);
    const dddValidos = ['11','12','13','14','15','16','17','18','19','21','22','24','27','28','31','32','33','34','35','37','38','41','42','43','44','45','46','47','48','49','51','53','54','55','61','62','63','64','65','66','67','68','69','71','73','74','75','77','79','81','82','83','84','85','86','87','88','89','91','92','93','94','95','96','97','98','99'];
    if (!dddValidos.includes(ddd)) {
      console.log(`⚠️ Número brasileiro com DDD inválido: ${phone} (DDD: ${ddd})`);
      return false;
    }
  }
  
  return true;
}

/**
 * Verifica se o WID é @c.us (número real)
 */
function widIsCus(wid?: any): boolean {
  const s = String(wid?._serialized || wid || '');
  return s.includes('@c.us');
}

/**
 * Verifica se o WID é @lid (ID interno)
 */
function widIsLid(wid?: any): boolean {
  const s = String(wid?._serialized || wid || '');
  return s.includes('@lid');
}

/**
 * Resolve o número de telefone real de uma mensagem, convertendo @lid se necessário
 */
async function resolvePhoneFromMessage(client: any, message: any, tenantId: string): Promise<{ phone: string; source: string }> {
  const pick = (wid: any, source: string) => {
    const phone = getPhoneFromWid(wid);
    if (isValidPhone(phone)) return { phone, source };
    return null;
  };

  // ⚠️ NÃO usar message.to como candidato do "cliente" (é sempre o host)
  const candidates = [
    { v: message.chatId, label: 'message.chatId' },
    { v: message.from, label: 'message.from' },
    { v: message.author, label: 'message.author' },
    { v: message.sender?.id?._serialized || message.sender?.id, label: 'message.sender.id' },
    { v: message.chat?.id?._serialized || message.chat?.id, label: 'message.chat.id' },
    { v: message.contact?.id?._serialized || message.contact?.id, label: 'message.contact.id' },
  ];

  // 1) se tiver @c.us direto
  for (const c of candidates) {
    const wid = c.v;
    if (widIsCus(wid)) {
      const r = pick(wid, c.label);
      if (r) return r;
    }
  }

  // 2) se for @lid, tentar buscar no cache primeiro
  if (message.from && widIsLid(message.from)) {
    try {
      const mapped = db.prepare(`SELECT phone FROM wa_lid_map WHERE tenant_id = ? AND lid = ?`)
        .get(tenantId, String(message.from)) as any;
      if (mapped?.phone && isValidPhone(mapped.phone)) {
        return { phone: mapped.phone, source: 'db wa_lid_map (cached)' };
      }
    } catch (e) {
      // continua
    }

    // 2.1 getContact
    try {
      const contact = await client.getContact(String(message.from));

      const number = contact?.number || contact?.phoneNumber;
      if (number && isValidPhone(String(number))) {
        return { phone: String(number), source: 'client.getContact(message.from).number' };
      }

      const cid = contact?.id?._serialized || contact?.id;
      if (widIsCus(cid)) {
        const r = pick(cid, 'client.getContact(message.from).id');
        if (r) return r;
      }

      const user = contact?.id?.user;
      if (user && isValidPhone(String(user))) {
        return { phone: String(user), source: 'client.getContact(message.from).id.user' };
      }
    } catch (e) {}

    // 2.2 getChatById
    try {
      const chat = await client.getChatById(String(message.from));
      const chatId = chat?.id?._serialized || chat?.id;
      if (widIsCus(chatId)) {
        const r = pick(chatId, 'client.getChatById(message.from).id');
        if (r) return r;
      }

      const contactId = chat?.contact?.id?._serialized || chat?.contact?.id;
      if (widIsCus(contactId)) {
        const r = pick(contactId, 'client.getChatById(message.from).contact.id');
        if (r) return r;
      }
    } catch (e) {}
  }

  // 3) fallback (vai dar 283900...)
  return { phone: getPhoneFromWid(message.from || ''), source: 'fallback (not resolved)' };
}

class WPPConnectService extends EventEmitter {
  private sessions: Map<string, SessionData> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;
  private initializingSessions: Set<string> = new Set();
  private readonly qrTimeoutMs = 300000;

  constructor() {
    super();
    // Limpar processos antigos antes de inicializar
    this.cleanupOrphanedProcesses();
    // Limpar cache de números inválidos
    this.cleanupInvalidPhoneCache();
    this.initExistingSessions();
  }

  /**
   * Limpa processos órfãos do Chrome/Chromium que possam estar travando as sessões
   */
  private cleanupOrphanedProcesses() {
    try {
      console.log('🧹 Verificando processos órfãos do WhatsApp...');
      
      const tokensPath = path.join(process.cwd(), 'tokens');
      
      // 1. Matar processos Chrome/Chromium órfãos que usam a pasta tokens/
      if (os.platform() === 'win32') {
        try {
          // Matar processos Chrome que estejam usando a pasta tokens do projeto
          const normalizedPath = tokensPath.replace(/\\/g, '\\\\');
          try {
            execSync(`wmic process where "name='chrome.exe' and commandline like '%${normalizedPath}%'" call terminate`, { 
              stdio: 'pipe', timeout: 10000 
            });
            console.log('🔪 Processos Chrome órfãos terminados (via WMIC)');
          } catch (e) {
            // Tentar via taskkill como fallback - mas só Chromium da pasta WPPConnect
            try {
              execSync(`taskkill /F /FI "IMAGENAME eq chrome.exe" /FI "WINDOWTITLE eq *wppconnect*" 2>nul`, { 
                stdio: 'pipe', timeout: 10000 
              });
            } catch (e2) {
              // Ignorar erros se não encontrar processos
            }
          }
        } catch (e) {
          console.warn('⚠️ Não foi possível matar processos Chrome órfãos:', e);
        }
      } else {
        // Linux/Mac
        try {
          execSync(`pkill -f "chromium.*tokens" 2>/dev/null || true`, { stdio: 'pipe', timeout: 5000 });
          execSync(`pkill -f "chrome.*tokens" 2>/dev/null || true`, { stdio: 'pipe', timeout: 5000 });
        } catch (e) {
          // Ignorar
        }
      }

      // 2. Remover lockfiles e outros arquivos de bloqueio
      if (fs.existsSync(tokensPath)) {
        const sessions = fs.readdirSync(tokensPath);
        sessions.forEach((session: string) => {
          const sessionPath = path.join(tokensPath, session);
          
          // Lista de lockfiles possíveis
          const lockfiles = [
            'SingletonLock',
            'SingletonSocket',
            'SingletonCookie',
          ];
          
          lockfiles.forEach(lockfile => {
            const lockPath = path.join(sessionPath, lockfile);
            if (fs.existsSync(lockPath)) {
              try {
                fs.unlinkSync(lockPath);
                console.log(`🔓 ${lockfile} removido para sessão ${session}`);
              } catch (e) {
                // Se não conseguir deletar como arquivo, pode ser diretório
                try {
                  fs.rmdirSync(lockPath, { recursive: true } as any);
                  console.log(`🔓 ${lockfile} (dir) removido para sessão ${session}`);
                } catch (e2) {
                  console.warn(`⚠️ Não foi possível remover ${lockfile} de ${session}`);
                }
              }
            }
          });

          // Também remover o lockfile do Default profile
          const defaultPath = path.join(sessionPath, 'Default');
          if (fs.existsSync(defaultPath)) {
            lockfiles.forEach(lockfile => {
              const lockPath = path.join(defaultPath, lockfile);
              if (fs.existsSync(lockPath)) {
                try { fs.unlinkSync(lockPath); } catch (e) {}
              }
            });
          }
        });
      }
      
      // Dar tempo para processos terminarem
      console.log('⏳ Aguardando processos terminarem...');
      
      console.log('✅ Limpeza de processos concluída');
    } catch (error) {
      console.warn('⚠️ Não foi possível limpar processos órfãos:', error);
    }
  }

  /**
   * Limpa cache de números de telefone inválidos (IDs @lid salvos como números)
   */
  private cleanupInvalidPhoneCache() {
    try {
      console.log('🧹 Limpando cache de números inválidos...');
      
      // Buscar todos os registros no cache
      const allCached = db.prepare(`SELECT lid, phone FROM wa_lid_map`).all() as any[];
      
      let invalidCount = 0;
      for (const record of allCached) {
        if (!isValidPhone(record.phone)) {
          // Deletar registros com números inválidos
          db.prepare(`DELETE FROM wa_lid_map WHERE lid = ?`).run(record.lid);
          invalidCount++;
          console.log(`🗑️ Removido cache inválido: ${record.lid} → ${record.phone}`);
        }
      }
      
      if (invalidCount > 0) {
        console.log(`✅ ${invalidCount} registro(s) inválido(s) removido(s) do cache`);
      } else {
        console.log('✅ Nenhum registro inválido encontrado no cache');
      }
    } catch (error) {
      console.warn('⚠️ Não foi possível limpar cache de números inválidos:', error);
    }
  }
  /**
   * Inicializa sessões ativas ao startar o serviço
   */
  private async initExistingSessions() {
    try {
      const activeSessions = db
        .prepare(`SELECT * FROM whatsapp_sessions WHERE is_active = 1`)
        .all() as any[];

      if (activeSessions.length === 0) {
        console.log('📱 Nenhuma sessão WhatsApp ativa para inicializar');
        return;
      }

      console.log(`📱 Initializing ${activeSessions.length} WhatsApp sessions...`);

      // Inicializar todas as sessões em paralelo (não bloquear startup)
      const initPromises = activeSessions.map(async (session) => {
        try {
          await this.startSession(session.tenant_id, session.session_name);
        } catch (error: any) {
          console.error(`❌ Falha ao iniciar sessão ${session.tenant_id}_${session.session_name}:`, error.message);
        }
      });

      // Não aguardar todas finalizarem para não bloquear o servidor
      Promise.all(initPromises).catch(err => {
        console.error('❌ Erro ao inicializar sessões WhatsApp:', err);
      });

    } catch (error: any) {
      console.error('❌ Error initializing WhatsApp sessions:', error.message);
    }
  }

  /**
   * Inicia uma nova sessão WhatsApp
   */
  async startSession(tenantId: string, sessionName: string = 'default'): Promise<{ success: boolean; qrCode?: string; error?: string }> {
    const sessionKey = `${tenantId}_${sessionName}`;
    const currentStatus = this.getSessionStatus(tenantId, sessionName);

    if (
      currentStatus.status === 'connected' ||
      currentStatus.status === 'connecting' ||
      (currentStatus.status === 'qr_ready' && this.isQrStillValid(currentStatus.qrGeneratedAt))
    ) {
      console.log(`[whatsapp] Reusing session ${sessionKey} with status ${currentStatus.status}`);
      return {
        success: true,
        qrCode: currentStatus.status === 'qr_ready' ? currentStatus.qrCode || undefined : undefined,
      };
    }


    // Evitar iniciar a mesma sessão concorrentemente
    if (this.initializingSessions.has(sessionKey)) {
      console.log(`[whatsapp] Session ${sessionKey} is already initializing; reusing current state.`);
      return {
        success: true,
        qrCode: currentStatus.status === 'qr_ready' ? currentStatus.qrCode || undefined : undefined,
      };
    }
    
    this.initializingSessions.add(sessionKey);

    try {
      // Verificar se sessão já existe
      if (this.sessions.has(sessionKey)) {
        const session = this.sessions.get(sessionKey)!;
        if (session.status === 'connected') {
          return { success: true };
        }
        // Se existe mas não está conectada, fechar antes de recriar
        try {
          if (session.client) {
            await session.client.close();
          }
        } catch (closeError) {
          console.warn(`⚠️ Erro ao fechar sessão existente ${sessionKey}:`, closeError);
        }
        this.sessions.delete(sessionKey);
      }

      // Atualizar status no banco
      this.updateSessionStatus(tenantId, sessionName, 'connecting');

      // Criar cliente WPPConnect
      const client = await wppconnect.create({
        session: sessionKey,
        puppeteerOptions: {
          headless: true,
          args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--no-first-run',
            '--no-zygote'
          ],
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
      const phoneNumber = getPhoneFromWid(hostDevice?.id) || null;

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

      // Se for erro de browser já rodando, tentar limpar agressivamente e tentar de novo UMA VEZ
      if (error.message?.includes('browser is already running')) {
        console.error(`🚫 Browser já está rodando para ${sessionKey}. Tentando limpar agressivamente...`);
        
        // Registrar que estamos tentando recuperar desse erro para evitar loop infinito
        const retryKey = `${sessionKey}_browser_retry`;
        const retryCount = this.reconnectAttempts.get(retryKey) || 0;
        
        if (retryCount === 0) {
          this.reconnectAttempts.set(retryKey, 1);
          
          try {
            // Fechar cliente se existir
            if (this.sessions.has(sessionKey)) {
              const s = this.sessions.get(sessionKey);
              if (s && s.client) await s.client.close().catch(() => {});
            }
            
            // Remover lockfiles específicos desta sessão
            const tokensPath = path.join(process.cwd(), 'tokens');
            const sessionPath = path.join(tokensPath, sessionKey);
            
            if (fs.existsSync(sessionPath)) {
              ['SingletonLock', 'SingletonSocket', 'SingletonCookie'].forEach(lockfile => {
                const lockPath = path.join(sessionPath, lockfile);
                if (fs.existsSync(lockPath)) {
                  try { fs.unlinkSync(lockPath); } 
                  catch (e) { try { fs.rmdirSync(lockPath, { recursive: true } as any); } catch(ex) {} }
                }
                
                const defaultLockPath = path.join(sessionPath, 'Default', lockfile);
                if (fs.existsSync(defaultLockPath)) {
                  try { fs.unlinkSync(defaultLockPath); } catch (e) {}
                }
              });
            }
            
            // Matar processos gerais também como garantia
            this.cleanupOrphanedProcesses();
            
            console.log(`🔄 Limpeza concluída. Tentando iniciar sessão ${sessionKey} novamente em 3 segundos...`);
            
            return new Promise((resolve) => {
              setTimeout(async () => {
                const result = await this.startSession(tenantId, sessionName);
                resolve(result);
              }, 3000);
            });
            
          } catch (cleanupError) {
            console.error('❌ Erro durante limpeza agressiva:', cleanupError);
          }
        }
        
        // Se já tentou ou falhou na recuperação, reseta o contador e retorna erro
        this.reconnectAttempts.delete(retryKey);
        this.sessions.delete(sessionKey);
        this.reconnectAttempts.delete(sessionKey);
        return { success: false, error: 'Browser do WhatsApp travado. Por favor, reinicie o servidor ou apague a pasta tokens/' + sessionKey };
      }

      // Não reconectar automaticamente se for timeout do QR code (usuário não escaneou)
      if (error.message !== 'Auto Close Called') {
        await this.handleReconnect(tenantId, sessionName);
      } else {
        console.log(`?? Timeout do QR Code para sess?o ${sessionKey}. Aguardando nova tentativa manual.`);
        this.sessions.delete(sessionKey);
        this.reconnectAttempts.delete(sessionKey);
      }

      return { success: false, error: error.message };
    } finally {
      this.initializingSessions.delete(sessionKey);
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
        console.log(`📩 Mensagem recebida:`, message.from, message.body?.substring(0, 50));

        // Ignorar mensagens de grupos (@g.us)
        if (message.from?.includes('@g.us')) {
          console.log('⏭️ Mensagem de grupo ignorada');
          return;
        }

        // Ignorar mensagens de broadcast (@broadcast)
        if (message.from?.includes('@broadcast')) {
          console.log('⏭️ Mensagem de broadcast ignorada');
          return;
        }

        // Processar mensagem recebida
        await this.handleIncomingMessage(client, tenantId, message);

      } catch (error: any) {
        console.error('❌ Erro ao processar mensagem recebida:', error.message);
      }
    });

    client.onAck(async (ack: any) => {
      try {
        // Atualizar status de entrega/leitura
        this.handleAck(tenantId, ack);
      } catch (error: any) {
        console.error('❌ Erro no callback onAck:', error.message);
      }
    });
  }

  /**
   * Processa mensagem recebida (IN)
   */
  private async handleIncomingMessage(client: any, tenantId: string, message: any) {
    try {
      // Validação adicional: ignorar grupos
      if (message.from?.includes('@g.us') || message.from?.includes('@broadcast')) {
        return;
      }

      // 🔍 DEBUG COMPLETO - Logar TODOS os dados disponíveis da mensagem
      console.log('═══════════════════════════════════════════════════════');
      console.log('🔍 DEBUG COMPLETO - MENSAGEM RECEBIDA');
      console.log('═══════════════════════════════════════════════════════');
      console.log('📨 message.from:', message.from);
      console.log('📨 message.to:', message.to);
      console.log('📨 message.chatId:', message.chatId);
      console.log('📨 message.author:', message.author);
      console.log('📨 message.body:', message.body);
      console.log('📨 message.type:', message.type);
      console.log('📨 message.isGroupMsg:', message.isGroupMsg);
      console.log('---');
      console.log('👤 message.sender:', JSON.stringify(message.sender, null, 2));
      console.log('---');
      console.log('💬 message.chat:', JSON.stringify(message.chat, null, 2));
      console.log('---');
      console.log('📇 message.contact:', JSON.stringify(message.contact, null, 2));
      console.log('---');
      console.log('🆔 message.id:', JSON.stringify(message.id, null, 2));
      console.log('---');
      console.log('📦 OBJETO COMPLETO:', JSON.stringify(message, null, 2));
      console.log('═══════════════════════════════════════════════════════');

      // Resolver número real usando client (converte @lid → número)
      let { phone, source } = await resolvePhoneFromMessage(client, message, tenantId);
      
      console.log(`📞 RESOLVE PHONE => ${phone} [${source}] | from=${message.from}`);

      // Validar se conseguiu um número válido
      if (!isValidPhone(phone)) {
        console.warn('⚠️ Não resolveu para telefone real. Tentando resolver via WPPConnect...', { 
          phone, 
          source, 
          from: message.from 
        });
        
        // Última tentativa: buscar via getContact se for @lid
        if (String(message.from).includes('@lid')) {
          try {
            const contact = await client.getContact(String(message.from));
            const phoneNumber = contact?.number || contact?.phoneNumber;
            
            if (phoneNumber) {
              const cleanNum = String(phoneNumber).replace(/\D/g, '');
              if (isValidPhone(cleanNum)) {
                console.log(`✅ Número resolvido via getContact: ${message.from} → ${cleanNum}`);
                
                // Salvar mapeamento
                try {
                  db.prepare(`INSERT OR REPLACE INTO wa_lid_map (tenant_id, lid, phone) VALUES (?, ?, ?)`)
                    .run(tenantId, String(message.from), cleanNum);
                  console.log(`✅ Mapeamento @lid salvo: ${message.from} → ${cleanNum}`);
                } catch (e) {}
                
                // Substituir phone inválido pelo válido e continuar processamento
                phone = cleanNum;
                source = 'client.getContact().number (fallback)';
              }
            }
          } catch (resolveErr: any) {
            console.error('❌ Falha ao resolver via getContact:', resolveErr.message);
          }
        }
        
        // Verificar novamente - se ainda não é válido, ignorar
        if (!isValidPhone(phone)) {
          console.error(`❌ Mensagem ignorada - número inválido: ${phone} de ${message.from}`);
          return;
        }
      }

      // Se resolveu o telefone e message.from é @lid, salvar no mapa para cache
      const lid = String(message.from || '');
      if (lid.includes('@lid') && isValidPhone(phone)) {
        try {
          db.prepare(`INSERT OR REPLACE INTO wa_lid_map (tenant_id, lid, phone) VALUES (?, ?, ?)`)
            .run(tenantId, lid, phone);
          console.log(`✅ Mapeamento @lid salvo: ${lid} → ${phone}`);
        } catch (e) {
          console.warn('⚠️ Erro ao salvar mapeamento @lid:', e);
        }
      }

      const phoneE164 = normalizePhoneE164(phone);
      const contactName = message.chat?.name || message.sender?.pushname || message.notifyName || phone;
      const displayName = message.chat?.name || message.sender?.pushname || message.notifyName || null;
      const body = message.body || '';
      const type = this.getMessageType(message);
      const mediaUrl = message.downloadMedia ? await this.downloadMedia(message) : null;

      console.log(`👤 Processando mensagem de ${contactName} (${phone} → ${phoneE164}) [origem: ${source}]`);

      // Buscar ou criar conversa (agora usando phone_e164 para evitar duplicação)
      let conversation = db
        .prepare(`SELECT * FROM whatsapp_conversations WHERE tenant_id = ? AND phone_e164 = ?`)
        .get(tenantId, phoneE164) as any;

      if (!conversation) {
        // Tentar vincular cliente automaticamente por telefone
        let clientId = null;
        
        if (phoneE164) {
          const phoneVariations = getPhoneVariations(phoneE164);
          const placeholders = phoneVariations.map(() => '?').join(',');
          
          const client = db
            .prepare(`
              SELECT id FROM clients 
              WHERE tenant_id = ? 
                AND (phone_e164 IN (${placeholders}) OR phone LIKE ?)
              LIMIT 1
            `)
            .get(tenantId, ...phoneVariations, `%${phone}%`) as any;
          
          if (client) {
            clientId = client.id;
            console.log(`✅ Cliente auto-vinculado: ${clientId}`);
          } else {
            console.log(`⚠️ Cliente não encontrado para ${phoneE164}`);
          }
        }

        // Criar nova conversa
        const conversationId = uuidv4();
        
        // Verificar se o tenant tem bot habilitado para ativar nas novas conversas
        let botEnabledForNew = 0;
        try {
          const botSetting = db.prepare(
            `SELECT value FROM tenant_settings WHERE tenant_id = ? AND key = 'whatsapp_bot_enabled'`
          ).get(tenantId) as any;
          if (botSetting && (botSetting.value === '1' || botSetting.value === 'true')) {
            botEnabledForNew = 1;
            console.log(`🤖 Bot habilitado para tenant ${tenantId} - nova conversa terá bot ativo`);
          }
        } catch (e) {}

        db.prepare(
          `INSERT INTO whatsapp_conversations 
           (id, tenant_id, phone, phone_e164, display_name, contact_name, client_id, last_message_at, last_message_preview, unread_count, status, bot_enabled)
           VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, 1, 'open', ?)`
        ).run(conversationId, tenantId, phone, phoneE164, displayName, contactName, clientId, body.substring(0, 100), botEnabledForNew);

        conversation = { id: conversationId, client_id: clientId, bot_enabled: botEnabledForNew };
      } else {
        // Atualizar conversa existente
        db.prepare(
          `UPDATE whatsapp_conversations 
           SET last_message_at = CURRENT_TIMESTAMP,
               last_message_preview = ?,
               unread_count = unread_count + 1,
               contact_name = COALESCE(contact_name, ?),
               display_name = COALESCE(display_name, ?),
               phone_e164 = COALESCE(phone_e164, ?)
           WHERE id = ?`
        ).run(body.substring(0, 100), contactName, displayName, phoneE164, conversation.id);
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

      // 🔍 RESOLVER @lid → número real @c.us
      let formattedPhone: string;
      
      if (phone.includes('@lid')) {
        console.log(`🔄 Detectado @lid, tentando resolver: ${phone}`);
        
        // 1. Tentar buscar no cache do banco
        try {
          const mapped = db.prepare(`SELECT phone FROM wa_lid_map WHERE tenant_id = ? AND lid = ?`)
            .get(tenantId, phone) as any;
          
          if (mapped?.phone && isValidPhone(mapped.phone)) {
            formattedPhone = `${mapped.phone}@c.us`;
            console.log(`✅ @lid resolvido via cache: ${phone} → ${formattedPhone}`);
          } else {
            throw new Error('Não encontrado no cache');
          }
        } catch (cacheError) {
          // 2. Tentar resolver via client.getChatById
          console.log(`🔍 Cache miss, tentando resolver via WPPConnect...`);
          try {
            const chat = await session.client.getChatById(phone);
            const contactId = chat?.contact?.id?._serialized || chat?.contact?.id;
            
            if (contactId && widIsCus(contactId)) {
              const resolvedPhone = getPhoneFromWid(contactId);
              if (isValidPhone(resolvedPhone)) {
                formattedPhone = `${resolvedPhone}@c.us`;
                
                // Salvar no cache
                db.prepare(`INSERT OR REPLACE INTO wa_lid_map (tenant_id, lid, phone) VALUES (?, ?, ?)`)
                  .run(tenantId, phone, resolvedPhone);
                
                console.log(`✅ @lid resolvido via WPPConnect: ${phone} → ${formattedPhone}`);
              } else {
                throw new Error('Número inválido');
              }
            } else {
              throw new Error('Não conseguiu resolver contact ID');
            }
          } catch (resolveError: any) {
            console.error(`❌ Não foi possível resolver @lid: ${phone}`, resolveError.message);
            throw new Error('Não é possível enviar mensagem para este contato. Use o número de telefone com código do país (ex: 5528999999999)');
          }
        }
      } else if (phone.includes('@c.us')) {
        // Já é @c.us, usar direto
        formattedPhone = phone;
        console.log(`✅ Usando número @c.us direto: ${formattedPhone}`);
      } else {
        // Número normal, limpar e adicionar @c.us
        const cleanPhone = phone.replace(/\D/g, '');
        if (isValidPhone(cleanPhone)) {
          formattedPhone = `${cleanPhone}@c.us`;
          console.log(`✅ Número formatado: ${phone} → ${formattedPhone}`);
        } else {
          throw new Error(`Número de telefone inválido: ${phone}`);
        }
      }

      console.log(`📤 Enviando mensagem para: ${formattedPhone}`);

      // Enviar mensagem via WPPConnect
      const result = await session.client.sendText(formattedPhone, message);

      // Extrair ID da mensagem (pode ser objeto ou string)
      const wppMessageId = result.id?._serialized || result.id || null;
      console.log(`📤 Mensagem enviada - ID: ${wppMessageId?.substring(0, 30)}...`);

      // Normalizar telefone para busca (usando helper)
      const phoneNormalized = getPhoneFromWid(phone);
      const phoneE164 = normalizePhoneE164(phoneNormalized);

      // Buscar ou criar conversa (usando phone_e164)
      let conversation = db
        .prepare(`SELECT * FROM whatsapp_conversations WHERE tenant_id = ? AND phone_e164 = ?`)
        .get(tenantId, phoneE164) as any;

      if (!conversation) {
        const conversationId = uuidv4();
        db.prepare(
          `INSERT INTO whatsapp_conversations 
           (id, tenant_id, phone, phone_e164, last_message_at, last_message_preview, status)
           VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, 'open')`
        ).run(conversationId, tenantId, phoneNormalized, phoneE164, message.substring(0, 100));

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
        wppMessageId
      );

      console.log(`✅ Mensagem salva no banco: ${messageId}`);

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
      qrGeneratedAt: dbSession?.updated_at,
      isActive: dbSession?.is_active === 1,
      lastConnectedAt: dbSession?.last_connected_at,
    };
  }

  /**
   * Desconecta sessão
   */
  private isQrStillValid(qrGeneratedAt?: string | null) {
    if (!qrGeneratedAt) {
      return false;
    }

    const generatedAt = new Date(qrGeneratedAt).getTime();
    if (Number.isNaN(generatedAt)) {
      return false;
    }

    return Date.now() - generatedAt < this.qrTimeoutMs;
  }

  /**
   * Desconecta sess?o
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
           SET status = ? 
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
         SET qr_code = ?, status = 'qr_ready' 
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
      // Validação de dados
      if (!ack) {
        console.warn('⚠️ ACK é null ou undefined');
        return;
      }

      if (!tenantId) {
        console.warn('⚠️ tenantId ausente no ACK handler');
        return;
      }

      // ack pode ter estruturas diferentes: ack.id._serialized ou ack.id
      const messageId = ack.id?._serialized || ack.id || null;
      
      if (!messageId) {
        console.warn('⚠️ ACK sem ID de mensagem:', ack);
        return;
      }

      // Atualizar status da mensagem baseado no ACK
      // 1 = sent, 2 = delivered, 3 = read
      const statusMap: any = {
        1: 'sent',
        2: 'delivered',
        3: 'read',
      };

      const status = statusMap[ack.ack] || 'sent';

      // Tentar atualizar - mensagem pode não existir ainda
      const result = db.prepare(
        `UPDATE whatsapp_messages 
         SET sent_status = ? 
         WHERE wpp_message_id = ? AND tenant_id = ?`
      ).run(status, messageId, tenantId);

      if (result.changes > 0) {
        console.log(`✅ ACK processado: ${messageId.substring(0, 20)}... -> ${status}`);
      } else {
        // Não é erro - mensagem pode ser de antes de iniciar o sistema
        console.log(`ℹ️ ACK para mensagem não encontrada: ${messageId.substring(0, 20)}...`);
      }

    } catch (error: any) {
      console.error('❌ Erro ao processar ACK:', error.message);
      console.error('ACK completo:', ack);
    }
  }
}

// Singleton instance
export const wppConnectService = new WPPConnectService();
export default wppConnectService;
