# 📱 Módulo WhatsApp - MecaERP

## ✅ O que foi implementado (MVP)

### 1. **Banco de Dados** (6 tabelas)
- ✅ `whatsapp_sessions` - Gerencia sessões e QR Codes
- ✅ `whatsapp_conversations` - Inbox de conversas
- ✅ `whatsapp_messages` - Mensagens individuais
- ✅ `whatsapp_templates` - Templates reutilizáveis (6 padrões criados)
- ✅ `whatsapp_automation_rules` - Regras de automação
- ✅ `whatsapp_automation_logs` - Auditoria de mensagens automáticas

### 2. **Backend (API + Serviço)**

#### Serviço WPPConnect (`src/backend/whatsapp/wppconnect-service.ts`)
- ✅ Gerenciamento de sessões (iniciar, parar, reconectar)
- ✅ QR Code generation
- ✅ Receber mensagens (webhook interno)
- ✅ Enviar mensagens
- ✅ Status tracking (enviado, entregue, lido)
- ✅ Criação automática de conversas
- ✅ Event emitter para integração

#### API Routes (`src/backend/routes/whatsapp.ts`)
- ✅ **Session Management**
  - `GET /api/whatsapp/session/status` - Status da conexão
  - `POST /api/whatsapp/session/start` - Iniciar + QR
  - `POST /api/whatsapp/session/disconnect` - Desconectar

- ✅ **Conversations (Inbox)**
  - `GET /api/whatsapp/conversations` - Lista com filtros (status, unread, assigned_to, search, tags)
  - `GET /api/whatsapp/conversations/:id` - Detalhes + dados cliente/OS
  - `PATCH /api/whatsapp/conversations/:id` - Atualizar (marcar como lida, atribuir atendente, bot on/off)

- ✅ **Messages**
  - `GET /api/whatsapp/conversations/:id/messages` - Mensagens paginadas
  - `POST /api/whatsapp/conversations/:id/messages` - Enviar mensagem

- ✅ **Templates**
  - `GET /api/whatsapp/templates` - Listar (com filtros)
  - `POST /api/whatsapp/templates` - Criar
  - `PATCH /api/whatsapp/templates/:id` - Editar
  - `DELETE /api/whatsapp/templates/:id` - Remover
  - `POST /api/whatsapp/templates/:id/render` - Renderizar com variáveis

- ✅ **Automation Rules**
  - `GET /api/whatsapp/automation-rules` - Listar regras
  - `POST /api/whatsapp/automation-rules` - Criar regra
  - `PATCH /api/whatsapp/automation-rules/:id` - Editar
  - `DELETE /api/whatsapp/automation-rules/:id` - Remover
  - `GET /api/whatsapp/automation-logs` - Logs de auditoria

- ✅ **Quick Actions**
  - `POST /api/whatsapp/send-template` - Enviar template rapidamente

### 3. **Frontend (Interface estilo WhatsApp Web)**

#### Layout 3 Colunas (`src/pages/WhatsApp.tsx`)

**Coluna 1: Inbox (Conversas)**
- ✅ Lista de conversas com avatar, nome, última mensagem, hora
- ✅ Badge de mensagens não lidas
- ✅ Tags visuais (Veículo, OS, Bot)
- ✅ Busca por nome/placa/telefone
- ✅ Filtros por status (Aberto, Aguardando aprovação, etc)
- ✅ Scroll infinito

**Coluna 2: Chat (Mensagens)**
- ✅ Header com nome do contato e telefone
- ✅ Mensagens em bolhas (in/out) estilo WhatsApp
- ✅ Separadores de data
- ✅ Status de entrega (enviado ✓, entregue ✓✓, lido ✓✓ azul)
- ✅ Badge origem (Bot/Automação/Sistema)
- ✅ Input de mensagem com Enter para enviar
- ✅ Botões: Emoji, Anexo, Templates
- ✅ Dropdown de templates com preview

**Coluna 3: Contexto (Painel Lateral)**
- ✅ 3 abas: Resumo, Ações, Automação
- ✅ **Resumo**: Cliente, Veículo, OS
- ✅ **Ações**: Botões (Abrir cliente, Criar OS, Agendar, Cobrar)
- ✅ **Automação**: Status do bot, tópico atual
- ✅ Toggle para mostrar/ocultar painel

**Tela de Conexão**
- ✅ QR Code modal
- ✅ Status: Desconectado/Conectando/Conectado
- ✅ Botão "Conectar WhatsApp"

### 4. **Templates Padrão**
6 templates criados automaticamente para cada tenant:
1. ✅ **Confirmação de Agendamento** - Com data, hora, endereço
2. ✅ **OS Aberta** - Placa do veículo + número da OS
3. ✅ **Aguardando Aprovação** - Orçamento + serviços
4. ✅ **Veículo Pronto** - Placa, valor, horário de retirada
5. ✅ **Lembrete de Pagamento** - Parcela vencida com valor
6. ✅ **Lembrete de Agendamento** - 1 dia antes com hora e local

### 5. **Integração com Sistema**
- ✅ Registrado no `server.ts` (`/api/whatsapp`)
- ✅ Rota no `App.tsx` (`/communication/whatsapp`)
- ✅ Middleware de autenticação (JWT)
- ✅ Multi-tenant isolado por `tenant_id`

---

## 🚧 Próximos Passos (Não implementado ainda)

### 6. **Automação por Eventos**
Triggers que enviam mensagens automaticamente:
- 📌 OS criada → "OS Aberta"
- 📌 Status mudou para "Aguardando Aprovação" → "Orçamento"
- 📌 OS finalizada → "Veículo Pronto"
- 📌 Conta vencida → "Lembrete de Pagamento"
- 📌 Agendamento criado → "Confirmação"
- 📌 1 dia antes do agendamento → "Lembrete"

**Como implementar:**
1. Criar listeners nos endpoints de OS/Agendamentos/Contas
2. Quando evento ocorrer, buscar regras ativas
3. Renderizar template com dados
4. Enviar mensagem via `wppConnectService.sendMessage()`
5. Registrar em `whatsapp_automation_logs`

### 7. **Bot de Agendamento (Fluxo Simples)**
State machine para conversa automatizada:
- 📌 Etapa 1: Perguntar serviço (Troca de óleo, Freio, Revisão, Outro)
- 📌 Etapa 2: Perguntar placa
- 📌 Etapa 3: Sugerir horários disponíveis
- 📌 Etapa 4: Confirmar agendamento
- 📌 Criar registro no banco
- 📌 Fallback para humano: áudio/imagem ou palavra-chave "atendente"

**Estrutura:**
```typescript
interface BotState {
  topic: 'agendamento' | 'orcamento' | 'status_os' | ...;
  step: number;
  data: {
    service?: string;
    plate?: string;
    date?: string;
  };
}
```

Processar no event `bot_process` emitido pelo `wppConnectService`.

---

## 📦 instalação e Configuração

### 1. Instalar Dependências
```bash
npm install
```

A dependência `@wppconnect-team/wppconnect` já foi adicionada ao `package.json`.

### 2. Inicializar Banco de Dados
O banco será inicializado automaticamente ao startar o servidor:
```bash
npm run dev
```

Tabelas WhatsApp serão criadas + 6 templates padrão.

### 3. Conectar WhatsApp
1. Acesse o ERP: `http://localhost:3000`
2. Vá para **Comunicação → WhatsApp**
3. Clique em **"Conectar WhatsApp"**
4. Escaneie o QR Code com seu celular
5. Aguarde status "Conectado" (pode levar até 30s)

### 4. Testar
- Envie uma mensagem para o número conectado
- A conversa aparecerá automaticamente no Inbox
- Responda pela interface do ERP
- Mensagem será enviada via WhatsApp

---

## 🔥 Recursos Avançados

### WebSocket (Tempo Real)
Para mensagens em tempo real, adicione WebSocket no `server.ts`:
```typescript
import { Server } from 'socket.io';

const io = new Server(server, { cors: { origin: '*' } });

wppConnectService.on('message', (data) => {
  io.to(data.tenantId).emit('new_message', data);
});

wppConnectService.on('message_sent', (data) => {
  io.to(data.tenantId).emit('message_sent', data);
});
```

No frontend (`WhatsApp.tsx`):
```typescript
import io from 'socket.io-client';

useEffect(() => {
  const socket = io('http://localhost:3000');
  socket.on('new_message', (data) => {
    if (data.conversationId === selectedConversation?.id) {
      setMessages(prev => [...prev, data]);
    }
    loadConversations(); // Atualizar inbox
  });
  return () => socket.disconnect();
}, []);
```

### Mídia (Imagens/PDFs)
Para enviar arquivos:
```typescript
// Backend
router.post("/conversations/:id/send-media", async (req, res) => {
  const { phone, base64, mimetype, filename } = req.body;
  const session = wppConnectService.sessions.get(sessionKey);
  await session.client.sendFile(phone, base64, filename, '');
});

// Frontend
const sendImage = async (file: File) => {
  const reader = new FileReader();
  reader.onload = async () => {
    const base64 = reader.result.split(',')[1];
    await api.post(`/whatsapp/conversations/${id}/send-media`, {
      phone,
      base64,
      mimetype: file.type,
      filename: file.name,
    });
  };
  reader.readAsDataURL(file);
};
```

### Busca de Clientes por Telefone
Para vincular conversas a clientes existentes:
```typescript
// No handleIncomingMessage do wppconnect-service.ts
const client = db.prepare(
  'SELECT id FROM clients WHERE tenant_id = ? AND phone LIKE ?'
).get(tenantId, `%${phone}%`);

if (client) {
  db.prepare('UPDATE whatsapp_conversations SET client_id = ? WHERE id = ?')
    .run(client.id, conversation.id);
}
```

---

## ⚠️ Avisos Importantes

### 1. WPPConnect é não-oficial
O WhatsApp pode bloquear números que usam automação não-oficial. **Recomendações:**
- Use número exclusivo para o ERP (não misture com pessoal)
- Evite spam (respeite limites de mensagens/minuto)
- Monitore status da sessão
- Tenha plano B (API oficial WhatsApp Business)

### 2. Sessão pode cair
Reconexão automática está implementada (até 5 tentativas). Se cair:
- Página mostrará QR Code novamente
- Escaneie novamente

### 3. Horário Comercial
Regras de automação têm flag `business_hours_only`. Implemente validação:
```typescript
const isBusinessHours = () => {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  return day >= 1 && day <= 5 && hour >= 8 && hour < 18;
};
```

---

## 📊 Estrutura de Arquivos

```
src/
├── backend/
│   ├── db.ts                          # ✅ 6 tabelas WhatsApp + templates
│   ├── routes/
│   │   └── whatsapp.ts                # ✅ 20+ endpoints API
│   └── whatsapp/
│       └── wppconnect-service.ts      # ✅ Serviço WPPConnect
└── pages/
    └── WhatsApp.tsx                   # ✅ Interface 3 colunas

server.ts                               # ✅ Rotas registradas
App.tsx                                # ✅ Rota frontend
package.json                           # ✅ Dependência adicionada
```

---

## 🎯 Status Final

| Funcionalidade | Status |
|---|---|
| Banco de dados | ✅ Completo |
| Serviço WPPConnect | ✅ Completo |
| API REST | ✅ Completo (20+ endpoints) |
| Frontend Inbox | ✅ Completo (3 colunas) |
| Templates | ✅ 6 padrões + CRUD |
| Automação (triggers) | 🚧 Planejado |
| Bot (agendamento) | 🚧 Planejado |
| WebSocket | 🚧 Opcional |

---

## 🚀 Como Continuar

### Implementar Automação:
1. Adicione triggers nos endpoints de OS (`src/backend/routes/workOrders.ts`)
2. Quando status mudar, busque regras ativas
3. Envie template via `wppConnectService.sendMessage(..., { origin: 'automation' })`

### Implementar Bot:
1. Crie `src/backend/whatsapp/bot-engine.ts`
2. Processe mensagens no event `bot_process`
3. Use state machine para gerenciar fluxo
4. Salve estado em `whatsapp_conversations.bot_state`

### Adicionar WebSocket:
1. Instale `socket.io`
2. Configure no `server.ts`
3. Emita eventos no frontend

---

## 💡 Dica Final

O módulo WhatsApp está **100% funcional** para uso manual (atendentes respondem clientes). Automação e bot são **incrementos** que você adiciona gradualmente conforme necessidade.

**Teste agora:**
1. `npm run dev`
2. Conecte WhatsApp
3. Mande mensagem para o número
4. Responda pelo ERP 🎉

---

**Desenvolvedor:** MecaERP Team  
**Data:** 2026-03-01  
**Versão:** 1.0.0 (MVP)
