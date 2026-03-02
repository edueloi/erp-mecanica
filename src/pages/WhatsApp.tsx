/**
 * WhatsApp Module - Inbox estilo WhatsApp Web
 * 
 * Layout 3 colunas:
 * 1. Conversas (Inbox) - Lista de conversas com filtros
 * 2. Chat (Central) - Mensagens da conversa ativa  
 * 3. Contexto (Direita) - Dados do cliente/OS/ações rápidas
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Send,
  Search,
  Phone,
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  User,
  Car,
  Wrench,
  DollarSign,
  Calendar,
  Paperclip,
  Smile,
  FileText,
  Bot,
  UserCircle,
  QrCode,
  Wifi,
  WifiOff,
  X,
  Filter,
  Tag,
  Mail,
  MapPin,
} from "lucide-react";
import api from "../services/api";

interface Conversation {
  id: string;
  phone: string;
  contact_name: string | null;
  last_message_at: string;
  last_message_preview: string | null;
  unread_count: number;
  assigned_to_user_id: string | null;
  bot_enabled: boolean;
  bot_topic: string | null;
  status: "open" | "waiting_approval" | "in_progress" | "resolved" | "closed";
  tags: string | null;
  vehicle_plate: string | null;
  work_order_id: string | null;
  client_name: string | null;
  work_order_status: string | null;
}

interface Message {
  id: string;
  conversation_id: string;
  direction: "in" | "out";
  type: "text" | "image" | "pdf" | "audio" | "video" | "document";
  body: string | null;
  media_url: string | null;
  sent_status: "sending" | "sent" | "delivered" | "read" | "error";
  origin: "human" | "bot" | "system" | "automation";
  created_at: string;
  sender_name: string | null;
}

interface Template {
  id: string;
  name: string;
  category: string;
  body: string;
  variables_json: string;
}

interface SessionStatus {
  status: "disconnected" | "connecting" | "connected" | "qr_ready";
  phoneNumber: string | null;
  qrCode: string | null;
  isActive: boolean;
  qrGeneratedAt?: string;
}

interface ClientContext {
  hasClient: boolean;
  client?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    cpfCnpj?: string;
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    complement?: string;
  };
  vehicles?: any[];
  workOrders?: any[];
  receivables?: {
    totalOpen: number;
    totalOverdue: number;
    countPending: number;
  };
  appointments?: any[];
}

export default function WhatsApp() {
  // Session
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrTimeRemaining, setQrTimeRemaining] = useState<number>(300); // 5 minutos em segundos

  // Conversations
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  // Emoji & Attachments
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  // Context Panel
  const [showContext, setShowContext] = useState(true);
  const [contextTab, setContextTab] = useState<"summary" | "actions" | "automation">("summary");
  const [clientContext, setClientContext] = useState<ClientContext | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);

  // Linking Modals
  const [showLinkClientModal, setShowLinkClientModal] = useState(false);
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [searchClientsQuery, setSearchClientsQuery] = useState("");
  const [searchClientsResults, setSearchClientsResults] = useState<any[]>([]);
  const [linkingClient, setLinkingClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientCpf, setNewClientCpf] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load session status
  useEffect(() => {
    loadSessionStatus();
    const interval = setInterval(loadSessionStatus, 10000); // Poll cada 10s
    return () => clearInterval(interval);
  }, []);

  // Contagem regressiva do QR Code
  useEffect(() => {
    if (sessionStatus?.status === "qr_ready" && sessionStatus.qrCode) {
      // Calcular tempo restante baseado no timestamp de geração
      const calculateTimeRemaining = () => {
        if (!sessionStatus.qrGeneratedAt) {
          return 300; // Fallback: 5 minutos
        }
        
        const generatedAt = new Date(sessionStatus.qrGeneratedAt).getTime();
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - generatedAt) / 1000);
        const remaining = Math.max(0, 300 - elapsedSeconds); // 300s = 5 minutos
        
        return remaining;
      };

      // Atualizar imediatamente
      setQrTimeRemaining(calculateTimeRemaining());

      // Atualizar a cada segundo
      const interval = setInterval(() => {
        const remaining = calculateTimeRemaining();
        setQrTimeRemaining(remaining);
        
        if (remaining === 0) {
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [sessionStatus?.qrCode, sessionStatus?.status, sessionStatus?.qrGeneratedAt]);

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, [searchQuery, filterStatus]);

  // Load messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      markAsRead(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load templates
  useEffect(() => {
    loadTemplates();
  }, []);

  // ========================================
  // DATA LOADING
  // ========================================

  const loadSessionStatus = async () => {
    try {
      const response = await api.get("/whatsapp/session/status");
      setSessionStatus(response.data);
    } catch (error) {
      console.error("Error loading session status:", error);
    }
  };

  const loadConversations = async () => {
    try {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (filterStatus !== "all") params.status = filterStatus;

      const response = await api.get("/whatsapp/conversations", { params });
      setConversations(response.data);
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await api.get(`/whatsapp/conversations/${conversationId}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await api.get("/whatsapp/templates", { params: { enabled: 'true' } });
      setTemplates(response.data);
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  };

  // ========================================
  // ACTIONS
  // ========================================

  const startSession = async () => {
    try {
      await api.post("/whatsapp/session/start");
      setShowQRModal(true);
      loadSessionStatus();
    } catch (error: any) {
      alert(error.response?.data?.error || "Erro ao iniciar sessão");
    }
  };

  const disconnectSession = async () => {
    try {
      await api.post("/whatsapp/session/disconnect");
      loadSessionStatus();
    } catch (error: any) {
      alert(error.response?.data?.error || "Erro ao desconectar");
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      await api.patch(`/whatsapp/conversations/${conversationId}`, { unread_count: 0 });
      loadConversations();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!messageInput.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const response = await api.post(
        `/whatsapp/conversations/${selectedConversation.id}/messages`,
        { body: messageInput }
      );

      setMessages([...messages, response.data]);
      setMessageInput("");
      messageInputRef.current?.focus();
    } catch (error: any) {
      alert(error.response?.data?.error || "Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  const useTemplate = (template: Template) => {
    let templateBody = template.body;

    // Substituir variáveis com dados do cliente/contexto
    if (clientContext?.client) {
      const client = clientContext.client;
      
      // Substituições básicas
      templateBody = templateBody.replace(/\{\{nome\}\}/gi, client.name || '');
      templateBody = templateBody.replace(/\{\{telefone\}\}/gi, client.phone || '');
      templateBody = templateBody.replace(/\{\{email\}\}/gi, client.email || '');
      templateBody = templateBody.replace(/\{\{cpf_cnpj\}\}/gi, client.cpfCnpj || '');
      
      // Data/hora atual (para agendamentos)
      const now = new Date();
      const dataHoje = now.toLocaleDateString('pt-BR');
      const horaAtual = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      templateBody = templateBody.replace(/\{\{data\}\}/gi, dataHoje);
      templateBody = templateBody.replace(/\{\{hora\}\}/gi, horaAtual);
      
      // Próximo agendamento (se houver)
      if (clientContext.appointments && clientContext.appointments.length > 0) {
        const nextAppt = clientContext.appointments[0];
        const apptDate = new Date(nextAppt.scheduled_date);
        templateBody = templateBody.replace(/\{\{data_agendamento\}\}/gi, apptDate.toLocaleDateString('pt-BR'));
        templateBody = templateBody.replace(/\{\{hora_agendamento\}\}/gi, apptDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      }
      
      // Veículo (se houver)
      if (clientContext.vehicles && clientContext.vehicles.length > 0) {
        const vehicle = clientContext.vehicles[0];
        templateBody = templateBody.replace(/\{\{veiculo\}\}/gi, `${vehicle.brand} ${vehicle.model}` || '');
        templateBody = templateBody.replace(/\{\{placa\}\}/gi, vehicle.plate || '');
      }
      
      // Endereço do cliente
      const addressParts = [];
      if (client.street) addressParts.push(client.street);
      if (client.complement) addressParts.push(client.complement);
      if (client.city) addressParts.push(client.city);
      if (client.state) addressParts.push(client.state);
      const fullAddress = addressParts.join(', ') || '';
      templateBody = templateBody.replace(/\{\{endereco\}\}/gi, fullAddress);
    }

    setMessageInput(templateBody);
    setShowTemplates(false);
    messageInputRef.current?.focus();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ========================================
  // CLIENT LINKING (CRM Integration)
  // ========================================

  const loadClientContext = async (conversationId: string) => {
    if (!conversationId) return;
    
    setLoadingContext(true);
    try {
      const response = await api.get(`/whatsapp/conversations/${conversationId}/client-context`);
      setClientContext(response.data);
    } catch (error) {
      console.error("Error loading client context:", error);
    } finally {
      setLoadingContext(false);
    }
  };

  const searchClients = async (query: string) => {
    if (query.length < 2) {
      setSearchClientsResults([]);
      return;
    }

    try {
      const response = await api.get("/whatsapp/search-clients", { params: { query } });
      setSearchClientsResults(response.data);
    } catch (error) {
      console.error("Error searching clients:", error);
    }
  };

  const closeLinkClientModal = () => {
    setShowLinkClientModal(false);
    setSearchClientsQuery("");
    setSearchClientsResults([]);
  };

  const linkClient = async (clientId: string) => {
    if (!selectedConversation || linkingClient) return;

    try {
      setLinkingClient(true);
      await api.post(`/whatsapp/conversations/${selectedConversation.id}/link-client`, {
        clientId,
        updateClientPhone: true,
      });

      // Fechar modal e limpar busca
      closeLinkClientModal();
      
      // Recarregar dados
      loadConversations();
      loadClientContext(selectedConversation.id);
      
      // Feedback de sucesso
      console.log("✅ Cliente vinculado com sucesso!");
    } catch (error: any) {
      alert(error.response?.data?.error || "Erro ao vincular cliente");
    } finally {
      setLinkingClient(false);
    }
  };

  const createAndLinkClient = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedConversation || !newClientName.trim()) {
      alert("Nome é obrigatório");
      return;
    }

    try {
      const response = await api.post(
        `/whatsapp/conversations/${selectedConversation.id}/create-and-link-client`,
        {
          name: newClientName,
          cpfCnpj: newClientCpf,
          email: newClientEmail,
        }
      );

      alert("Cliente criado e vinculado com sucesso!");
      setShowCreateClientModal(false);
      setNewClientName("");
      setNewClientCpf("");
      setNewClientEmail("");
      loadConversations();
      loadClientContext(selectedConversation.id);
    } catch (error: any) {
      alert(error.response?.data?.error || "Erro ao criar cliente");
    }
  };

  const unlinkClient = async () => {
    if (!selectedConversation) return;

    if (!confirm("Deseja realmente desvincular este cliente?")) return;

    try {
      await api.delete(`/whatsapp/conversations/${selectedConversation.id}/unlink-client`);
      alert("Cliente desvinculado");
      loadConversations();
      loadClientContext(selectedConversation.id);
    } catch (error: any) {
      alert(error.response?.data?.error || "Erro ao desvincular");
    }
  };

  // Carregar contexto quando conversa mudar
  useEffect(() => {
    if (selectedConversation) {
      loadClientContext(selectedConversation.id);
    } else {
      setClientContext(null);
    }
  }, [selectedConversation?.id]);

  // ========================================
  // RENDER
  // ========================================

  if (!sessionStatus) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Session not connected
  if (sessionStatus.status !== "connected") {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          {sessionStatus.status === "qr_ready" ? (
            <>
              <QrCode className="w-16 h-16 mx-auto text-green-600 mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Escaneie o QR Code</h2>
              <p className="text-slate-500 mb-4">
                Abra o WhatsApp no seu celular e escaneie o código abaixo
              </p>
              
              {/* Contagem regressiva */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-600">Tempo restante</span>
                  <span className={`font-mono font-bold ${
                    qrTimeRemaining <= 30 ? "text-red-600" : "text-green-600"
                  }`}>
                    {Math.floor(qrTimeRemaining / 60)}:{String(qrTimeRemaining % 60).padStart(2, '0')}
                  </span>
                </div>
                {/* Barra de progresso */}
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      qrTimeRemaining <= 30 ? "bg-red-600" : "bg-green-600"
                    }`}
                    style={{ width: `${(qrTimeRemaining / 300) * 100}%` }}
                  />
                </div>
                {qrTimeRemaining <= 30 && qrTimeRemaining > 0 && (
                  <p className="text-xs text-red-600 mt-2 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Código expirando em breve!
                  </p>
                )}
                {qrTimeRemaining === 0 && (
                  <p className="text-xs text-red-600 mt-2 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Código expirado. Clique em "Gerar novo código".
                  </p>
                )}
              </div>

              {sessionStatus.qrCode && qrTimeRemaining > 0 && (
                <div className="bg-white p-4 rounded-xl border-2 border-slate-200 mb-4">
                  <img src={sessionStatus.qrCode} alt="QR Code" className="mx-auto" />
                </div>
              )}
              
              {qrTimeRemaining === 0 ? (
                <button
                  onClick={startSession}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <QrCode className="w-5 h-5" />
                  Gerar novo código
                </button>
              ) : (
                <button
                  onClick={() => window.location.reload()}
                  className="text-sm text-primary hover:underline"
                >
                  Atualizar status
                </button>
              )}
            </>
          ) : (
            <>
              <WifiOff className="w-16 h-16 mx-auto text-slate-400 mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">WhatsApp Desconectado</h2>
              <p className="text-slate-500 mb-6">
                Conecte sua conta do WhatsApp para começar a receber e enviar mensagens pelo ERP
              </p>
              <button
                onClick={startSession}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Wifi className="w-5 h-5" />
                Conectar WhatsApp
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-slate-100 -m-6">
      {/* ========================================
          COLUNA 1: CONVERSAS (INBOX)
      ======================================== */}
      <div className="w-96 bg-white border-r border-slate-200 flex flex-col">
        {/* Header Inbox */}
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              WhatsApp
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                title="Filtros"
              >
                <Filter className="w-4 h-4 text-slate-600" />
              </button>
              <button
                onClick={disconnectSession}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                title="Desconectar"
              >
                <WifiOff className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome, placa, telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 flex flex-wrap gap-2"
            >
              {["all", "open", "waiting_approval", "in_progress", "resolved"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                    filterStatus === status
                      ? "bg-green-600 text-white"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                >
                  {status === "all" ? "Todos" : status.replace("_", " ")}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors text-left ${
                  selectedConversation?.id === conv.id ? "bg-slate-100" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0 w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-slate-500" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {conv.contact_name || conv.phone}
                      </h3>
                      <span className="text-xs text-slate-500">
                        {new Date(conv.last_message_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Last message */}
                    <p className="text-sm text-slate-600 truncate mb-2">
                      {conv.last_message_preview || "Sem mensagens"}
                    </p>

                    {/* Tags */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {conv.unread_count > 0 && (
                        <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-bold rounded-full">
                          {conv.unread_count}
                        </span>
                      )}
                      {conv.vehicle_plate && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                          <Car className="w-3 h-3" />
                          {conv.vehicle_plate}
                        </span>
                      )}
                      {conv.work_order_id && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full flex items-center gap-1">
                          <Wrench className="w-3 h-3" />
                          OS
                        </span>
                      )}
                      {conv.bot_enabled && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full flex items-center gap-1">
                          <Bot className="w-3 h-3" />
                          Bot
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ========================================
          COLUNA 2: CHAT (MENSAGENS)
      ======================================== */}
      <div className="flex-1 flex flex-col">
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center bg-slate-50">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">Selecione uma conversa para começar</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">
                    {selectedConversation.contact_name || selectedConversation.phone}
                  </h2>
                  <p className="text-xs text-slate-500">{selectedConversation.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <Phone className="w-4 h-4 text-slate-600" />
                </button>
                <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <MoreVertical className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
              {messages.length === 0 ? (
                <div className="text-center text-slate-500 mt-8">
                  <p className="text-sm">Nenhuma mensagem ainda</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isOut = msg.direction === "out";
                  const showDate =
                    index === 0 ||
                    new Date(messages[index - 1].created_at).toDateString() !==
                      new Date(msg.created_at).toDateString();

                  return (
                    <div key={msg.id}>
                      {/* Date Separator */}
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <span className="px-3 py-1 bg-slate-200 text-slate-600 text-xs rounded-full">
                            {new Date(msg.created_at).toLocaleDateString("pt-BR", {
                              day: "numeric",
                              month: "long",
                            })}
                          </span>
                        </div>
                      )}

                      {/* Message Bubble */}
                      <div className={`flex mb-2 ${isOut ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-md px-4 py-2 rounded-2xl ${
                            isOut
                              ? "bg-green-600 text-white"
                              : "bg-white text-slate-900 border border-slate-200"
                          }`}
                        >
                          {/* Origin Badge */}
                          {msg.origin !== "human" && (
                            <div className="flex items-center gap-1 mb-1">
                              <Bot className="w-3 h-3" />
                              <span className="text-xs opacity-75">
                                {msg.origin === "bot"
                                  ? "Bot"
                                  : msg.origin === "automation"
                                  ? "Automação"
                                  : "Sistema"}
                              </span>
                            </div>
                          )}

                          {/* Body */}
                          <p className="text-sm whitespace-pre-wrap">{msg.body}</p>

                          {/* Footer */}
                          <div
                            className={`flex items-center gap-1 mt-1 text-xs ${
                              isOut ? "opacity-75 justify-end" : "text-slate-500"
                            }`}
                          >
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {isOut && (
                              <>
                                {msg.sent_status === "sending" && <Clock className="w-3 h-3" />}
                                {msg.sent_status === "sent" && <Check className="w-3 h-3" />}
                                {msg.sent_status === "delivered" && <CheckCheck className="w-3 h-3" />}
                                {msg.sent_status === "read" && (
                                  <CheckCheck className="w-3 h-3 text-blue-300" />
                                )}
                                {msg.sent_status === "error" && <AlertCircle className="w-3 h-3 text-red-300" />}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-slate-200">
              <form onSubmit={sendMessage} className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEmojiPicker(!showEmojiPicker);
                    setShowTemplates(false);
                    setShowAttachMenu(false);
                  }}
                  className={`p-2 hover:bg-slate-100 rounded-full transition-colors ${
                    showEmojiPicker ? "bg-slate-100" : ""
                  }`}
                  title="Emoji"
                >
                  <Smile className="w-5 h-5 text-slate-600" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowAttachMenu(!showAttachMenu);
                    setShowTemplates(false);
                    setShowEmojiPicker(false);
                  }}
                  className={`p-2 hover:bg-slate-100 rounded-full transition-colors ${
                    showAttachMenu ? "bg-slate-100" : ""
                  }`}
                  title="Anexar"
                >
                  <Paperclip className="w-5 h-5 text-slate-600" />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // TODO: Implementar upload de arquivo
                      console.log('Arquivo selecionado:', file.name);
                      alert('Upload de arquivos será implementado em breve');
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={() => {
                    setShowTemplates(!showTemplates);
                    setShowEmojiPicker(false);
                    setShowAttachMenu(false);
                  }}
                  className={`p-2 hover:bg-slate-100 rounded-full transition-colors ${
                    showTemplates ? "bg-slate-100" : ""
                  }`}
                  title="Templates"
                >
                  <FileText className="w-5 h-5 text-slate-600" />
                </button>

                <textarea
                  ref={messageInputRef}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Digite uma mensagem..."
                  rows={1}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                />

                <button
                  type="submit"
                  disabled={!messageInput.trim() || sending}
                  className="p-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white rounded-full transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>

              {/* Emoji Picker */}
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200"
                >
                  <div className="grid grid-cols-8 gap-2">
                    {['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊',
                      '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘',
                      '😗', '😙', '😚', '☺️', '😋', '😛', '😝', '😜',
                      '🤪', '🤨', '🧐', '🤓', '😎', '👍', '👎', '👏',
                      '🙌', '👌', '✌️', '🤞', '🤝', '🙏', '❤️', '💙',
                      '💚', '💛', '🧡', '💜', '🖤', '🤍', '🤎', '💔',
                      '⚡', '💥', '✨', '💫', '🔥', '❌', '⭐', '✅'
                    ].map((emoji, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setMessageInput(messageInput + emoji);
                          messageInputRef.current?.focus();
                        }}
                        className="text-2xl hover:bg-white p-2 rounded-lg transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Attach Menu */}
              {showAttachMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200"
                >
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        fileInputRef.current?.click();
                        setShowAttachMenu(false);
                      }}
                      className="w-full text-left p-3 hover:bg-white rounded-lg transition-colors flex items-center gap-3"
                    >
                      <Paperclip className="w-5 h-5 text-slate-600" />
                      <div>
                        <div className="font-medium text-sm text-slate-900">Documento</div>
                        <div className="text-xs text-slate-500">PDF, DOC, XLS, etc.</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        alert('Câmera/Galeria será implementado em breve');
                        setShowAttachMenu(false);
                      }}
                      className="w-full text-left p-3 hover:bg-white rounded-lg transition-colors flex items-center gap-3"
                    >
                      <Paperclip className="w-5 h-5 text-slate-600" />
                      <div>
                        <div className="font-medium text-sm text-slate-900">Foto ou Vídeo</div>
                        <div className="text-xs text-slate-500">Enviar mídia</div>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Templates Dropdown */}
              {showTemplates && templates.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-96 overflow-y-auto space-y-3"
                >
                  {/* Variáveis Disponíveis */}
                  {clientContext?.client && (
                    <div className="pb-3 border-b border-slate-200">
                      <h4 className="text-xs font-semibold text-slate-600 uppercase mb-2">
                        Variáveis Disponíveis
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white px-2 py-1 rounded border border-slate-200">
                          <span className="font-mono text-slate-500">{'{{nome}}'}</span>
                          <span className="ml-1 text-slate-700">→ {clientContext.client.name}</span>
                        </div>
                        <div className="bg-white px-2 py-1 rounded border border-slate-200">
                          <span className="font-mono text-slate-500">{'{{telefone}}'}</span>
                          <span className="ml-1 text-slate-700">→ {clientContext.client.phone}</span>
                        </div>
                        <div className="bg-white px-2 py-1 rounded border border-slate-200">
                          <span className="font-mono text-slate-500">{'{{data}}'}</span>
                          <span className="ml-1 text-slate-700">→ {new Date().toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="bg-white px-2 py-1 rounded border border-slate-200">
                          <span className="font-mono text-slate-500">{'{{hora}}'}</span>
                          <span className="ml-1 text-slate-700">→ {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {clientContext.vehicles && clientContext.vehicles.length > 0 && (
                          <>
                            <div className="bg-white px-2 py-1 rounded border border-slate-200">
                              <span className="font-mono text-slate-500">{'{{veiculo}}'}</span>
                              <span className="ml-1 text-slate-700">→ {clientContext.vehicles[0].brand} {clientContext.vehicles[0].model}</span>
                            </div>
                            <div className="bg-white px-2 py-1 rounded border border-slate-200">
                              <span className="font-mono text-slate-500">{'{{placa}}'}</span>
                              <span className="ml-1 text-slate-700">→ {clientContext.vehicles[0].plate}</span>
                            </div>
                          </>
                        )}
                        {(clientContext.client.street || clientContext.client.city) && (
                          <div className="bg-white px-2 py-1 rounded border border-slate-200 col-span-2">
                            <span className="font-mono text-slate-500">{'{{endereco}}'}</span>
                            <span className="ml-1 text-slate-700">→ {[
                              clientContext.client.street,
                              clientContext.client.complement,
                              clientContext.client.city,
                              clientContext.client.state
                            ].filter(Boolean).join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <h4 className="text-xs font-semibold text-slate-600 uppercase mb-2">
                    Templates
                  </h4>
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => useTemplate(template)}
                        className="w-full text-left p-2 hover:bg-white rounded-lg transition-colors"
                      >
                        <div className="font-medium text-sm text-slate-900">{template.name}</div>
                        <div className="text-xs text-slate-500 truncate">{template.body}</div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ========================================
          COLUNA 3: CONTEXTO (PAINEL DIREITO)
      ======================================== */}
      {showContext && selectedConversation && (
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Contexto</h3>
              <button
                onClick={() => setShowContext(false)}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              {["summary", "actions", "automation"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setContextTab(tab as any)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                    contextTab === tab
                      ? "bg-green-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab === "summary" ? "Resumo" : tab === "actions" ? "Ações" : "Automação"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {contextTab === "summary" && (
              <div className="space-y-4">
                {loadingContext ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : clientContext?.hasClient ? (
                  <>
                    {/* Cliente Vinculado */}
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-green-600" />
                          <span className="text-xs font-semibold text-green-600 uppercase">
                            Cliente Cadastrado
                          </span>
                        </div>
                        <button
                          onClick={unlinkClient}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Desvincular
                        </button>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mb-1">
                        {clientContext.client?.name}
                      </h3>
                      <p className="text-xs text-slate-600">{clientContext.client?.phone}</p>
                      {clientContext.client?.cpfCnpj && (
                        <p className="text-xs text-slate-600">CPF/CNPJ: {clientContext.client.cpfCnpj}</p>
                      )}
                    </div>

                    {/* Veículos */}
                    {clientContext.vehicles && clientContext.vehicles.length > 0 && (
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <h4 className="text-xs font-semibold text-slate-600 uppercase mb-2 flex items-center gap-2">
                          <Car className="w-4 h-4" />
                          Veículos ({clientContext.vehicles.length})
                        </h4>
                        <div className="space-y-2">
                          {clientContext.vehicles.map((vehicle: any) => (
                            <div
                              key={vehicle.id}
                              className="p-2 bg-white rounded-lg border border-slate-200"
                            >
                              <p className="text-sm font-medium text-slate-900">
                                {vehicle.plate}
                              </p>
                              <p className="text-xs text-slate-600">
                                {vehicle.model} - {vehicle.year}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Últimas OS */}
                    {clientContext.workOrders && clientContext.workOrders.length > 0 && (
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <h4 className="text-xs font-semibold text-slate-600 uppercase mb-2 flex items-center gap-2">
                          <Wrench className="w-4 h-4" />
                          Últimas OS ({clientContext.workOrders.length})
                        </h4>
                        <div className="space-y-2">
                          {clientContext.workOrders.slice(0, 3).map((wo: any) => (
                            <div
                              key={wo.id}
                              className="p-2 bg-white rounded-lg border border-slate-200"
                            >
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-slate-900">#{wo.id.substring(0, 8)}</p>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  wo.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  wo.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {wo.status}
                                </span>
                              </div>
                              {wo.vehicle_plate && (
                                <p className="text-xs text-slate-600">Veículo: {wo.vehicle_plate}</p>
                              )}
                              {wo.total_amount && (
                                <p className="text-xs text-slate-900 mt-1">
                                  R$ {parseFloat(wo.total_amount).toFixed(2)}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Financeiro */}
                    {clientContext.receivables && clientContext.receivables.countPending > 0 && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <h4 className="text-xs font-semibold text-amber-700 uppercase mb-2 flex items-center gap-2">
                          <DollarSign className="w-h h-4" />
                          Pendências Financeiras
                        </h4>
                        <div className="space-y-1">
                          <p className="text-sm text-slate-900">
                            Em aberto: <span className="font-bold">
                              R$ {clientContext.receivables.totalOpen.toFixed(2)}
                            </span>
                          </p>
                          {clientContext.receivables.totalOverdue > 0 && (
                            <p className="text-sm text-red-600">
                              Atrasado: <span className="font-bold">
                                R$ {clientContext.receivables.totalOverdue.toFixed(2)}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Cliente NÃO Vinculado */}
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                        <span className="text-xs font-semibold text-amber-700 uppercase">
                          Não Vinculado
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 mb-4">
                        Este número ainda não está cadastrado no sistema.
                      </p>
                      
                      <div className="space-y-2">
                        <button
                          onClick={() => setShowCreateClientModal(true)}
                          className="w-full p-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          Criar Cliente
                        </button>
                        
                        <button
                          onClick={() => setShowLinkClientModal(true)}
                          className="w-full p-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                          <Search className="w-4 h-4" />
                          Vincular Existente
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl">
                      <h4 className="text-xs font-semibold text-slate-600 uppercase mb-2">
                        Informações da Conversa
                      </h4>
                      <p className="text-xs text-slate-600 mb-1">
                        <span className="font-medium">Telefone:</span> {selectedConversation.phone}
                      </p>
                      <p className="text-xs text-slate-600">
                        <span className="font-medium">Nome (WhatsApp):</span>{" "}
                        {selectedConversation.contact_name || "Não disponível"}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {contextTab === "actions" && (
              <div className="space-y-2">
                {clientContext?.hasClient ? (
                  <>
                    {/* Ações disponíveis quando tem cliente vinculado */}
                    <button 
                      onClick={() => {
                        if (clientContext.client?.id) {
                          window.location.href = `/clients/${clientContext.client.id}`;
                        }
                      }}
                      className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-left flex items-center gap-3 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-600" />
                      <span className="text-sm text-slate-900">Abrir cliente</span>
                    </button>
                    <button className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-left flex items-center gap-3 transition-colors">
                      <Car className="w-4 h-4 text-slate-600" />
                      <span className="text-sm text-slate-900">Abrir veículo</span>
                    </button>
                    <button className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-left flex items-center gap-3 transition-colors">
                      <Wrench className="w-4 h-4 text-slate-600" />
                      <span className="text-sm text-slate-900">Criar OS</span>
                    </button>
                    <button className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-left flex items-center gap-3 transition-colors">
                      <Calendar className="w-4 h-4 text-slate-600" />
                      <span className="text-sm text-slate-900">Agendar</span>
                    </button>
                    <button className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-left flex items-center gap-3 transition-colors">
                      <DollarSign className="w-4 h-4 text-slate-600" />
                      <span className="text-sm text-slate-900">Cobrar</span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* Quando não tem cliente vinculado */}
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                      <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                      <p className="text-sm text-slate-700 mb-3">
                        Vincule um cliente para acessar as ações rápidas
                      </p>
                      <div className="space-y-2">
                        <button
                          onClick={() => setShowCreateClientModal(true)}
                          className="w-full p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Criar e Vincular
                        </button>
                        <button
                          onClick={() => setShowLinkClientModal(true)}
                          className="w-full p-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                        >
                          Vincular Existente
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {contextTab === "automation" && (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-600 uppercase">
                      Bot Status
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        selectedConversation.bot_enabled
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {selectedConversation.bot_enabled ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  {selectedConversation.bot_topic && (
                    <p className="text-sm text-slate-900">Tópico: {selectedConversation.bot_topic}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toggle Context Button (when hidden) */}
      {!showContext && (
        <button
          onClick={() => setShowContext(true)}
          className="fixed right-4 top-24 p-3 bg-white shadow-lg rounded-full hover:bg-slate-50 transition-colors"
        >
          <UserCircle className="w-5 h-5 text-slate-600" />
        </button>
      )}

      {/* Modal: Criar Cliente */}
      <AnimatePresence>
        {showCreateClientModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateClientModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">Criar Cliente</h2>
                <button
                  onClick={() => setShowCreateClientModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <form onSubmit={createAndLinkClient} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Nome completo"
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={selectedConversation?.phone || ""}
                    disabled
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl bg-slate-100 text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    CPF/CNPJ
                  </label>
                  <input
                    type="text"
                    value={newClientCpf}
                    onChange={(e) => setNewClientCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateClientModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
                  >
                    Criar e Vincular
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Vincular Cliente Existente */}
      <AnimatePresence>
        {showLinkClientModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                <h2 className="text-sm font-bold text-slate-900">Vincular Cliente</h2>
                <button
                  onClick={() => closeLinkClientModal()}
                  className="text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto p-4 flex-1">
                {/* Search Input */}
                <div className="mb-4">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Buscar Cliente
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchClientsQuery}
                      onChange={(e) => {
                        setSearchClientsQuery(e.target.value);
                        searchClients(e.target.value);
                      }}
                      placeholder="Digite nome, telefone, CPF/CNPJ ou email..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 outline-none"
                      autoFocus
                    />
                  </div>
                  {searchClientsQuery.length > 0 && searchClientsQuery.length < 2 && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      Digite pelo menos 2 caracteres
                    </p>
                  )}
                </div>

                {/* Results */}
                <div className="space-y-2">
                  {/* Empty State - Não digitado */}
                  {searchClientsQuery.length === 0 && (
                    <div className="text-center py-8">
                      <Search className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-600">Busque um cliente para vincular</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Digite nome, telefone, CPF/CNPJ ou email
                      </p>
                    </div>
                  )}

                  {/* Empty State - Não encontrado */}
                  {searchClientsResults.length === 0 && searchClientsQuery.length >= 2 && (
                    <div className="text-center py-8">
                      <UserCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-600">Nenhum cliente encontrado</p>
                      <p className="text-[10px] text-slate-400 mt-1 mb-3">
                        Nenhum resultado para "{searchClientsQuery}"
                      </p>
                      <button
                        onClick={() => {
                          closeLinkClientModal();
                          setShowCreateClientModal(true);
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold inline-flex items-center gap-1.5 transition-colors"
                      >
                        <User className="w-3 h-3" />
                        Criar Novo Cliente
                      </button>
                    </div>
                  )}

                  {/* Cliente Results */}
                  {searchClientsResults.map((client) => (
                    <div
                      key={client.id}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:bg-white hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Nome + Badges */}
                          <div className="flex items-center gap-2 mb-1.5">
                            <h3 className="text-xs font-bold text-slate-900 truncate">
                              {client.name}
                            </h3>
                            {client.vehicle_count > 0 && (
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded flex items-center gap-1">
                                <Car className="w-2.5 h-2.5" />
                                {client.vehicle_count}
                              </span>
                            )}
                            {client.work_order_count > 0 && (
                              <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[9px] font-bold rounded flex items-center gap-1">
                                <Wrench className="w-2.5 h-2.5" />
                                {client.work_order_count}
                              </span>
                            )}
                          </div>

                          {/* Informações */}
                          <div className="space-y-0.5">
                            {(client.phone || client.phone_e164) && (
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                                <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                <span className="truncate">{client.phone || client.phone_e164}</span>
                              </div>
                            )}
                            
                            {client.document && (
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                                <FileText className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                <span className="truncate">
                                  {client.document.length === 11 
                                    ? client.document.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                                    : client.document.length === 14
                                    ? client.document.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
                                    : client.document
                                  }
                                </span>
                              </div>
                            )}

                            {client.email && (
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                                <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                <span className="truncate">{client.email}</span>
                              </div>
                            )}

                            {client.city && (
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                                <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                <span className="truncate">{client.city}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Botão Vincular */}
                        <button
                          onClick={() => linkClient(client.id)}
                          disabled={linkingClient}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1.5 flex-shrink-0"
                        >
                          {linkingClient ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Vinculando
                            </>
                          ) : (
                            <>
                              <UserCircle className="w-3 h-3" />
                              Vincular
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
