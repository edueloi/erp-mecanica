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
}

export default function WhatsApp() {
  // Session
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);

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

  // Context Panel
  const [showContext, setShowContext] = useState(true);
  const [contextTab, setContextTab] = useState<"summary" | "actions" | "automation">("summary");

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // Load session status
  useEffect(() => {
    loadSessionStatus();
    const interval = setInterval(loadSessionStatus, 10000); // Poll cada 10s
    return () => clearInterval(interval);
  }, []);

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
    setMessageInput(template.body);
    setShowTemplates(false);
    messageInputRef.current?.focus();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
              <p className="text-slate-500 mb-6">
                Abra o WhatsApp no seu celular e escaneie o código abaixo
              </p>
              {sessionStatus.qrCode && (
                <div className="bg-white p-4 rounded-xl border-2 border-slate-200 mb-6">
                  <img src={sessionStatus.qrCode} alt="QR Code" className="mx-auto" />
                </div>
              )}
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-primary hover:underline"
              >
                Atualizar status
              </button>
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
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  title="Emoji"
                >
                  <Smile className="w-5 h-5 text-slate-600" />
                </button>

                <button
                  type="button"
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  title="Anexar"
                >
                  <Paperclip className="w-5 h-5 text-slate-600" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowTemplates(!showTemplates)}
                  className={`p-2 hover:bg-slate-100 rounded-full transition-colors ${
                    showTemplates ? "bg-green-100" : ""
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

              {/* Templates Dropdown */}
              {showTemplates && templates.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-64 overflow-y-auto"
                >
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
                <div className="p-3 bg-slate-50 rounded-xl">
                  <h4 className="text-xs font-semibold text-slate-600 uppercase mb-2">Cliente</h4>
                  <p className="text-sm text-slate-900 font-medium">
                    {selectedConversation.client_name || "Não identificado"}
                  </p>
                </div>

                {selectedConversation.vehicle_plate && (
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <h4 className="text-xs font-semibold text-slate-600 uppercase mb-2">
                      Veículo
                    </h4>
                    <p className="text-sm text-slate-900 font-medium">
                      {selectedConversation.vehicle_plate}
                    </p>
                  </div>
                )}

                {selectedConversation.work_order_id && (
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <h4 className="text-xs font-semibold text-slate-600 uppercase mb-2">
                      Ordem de Serviço
                    </h4>
                    <p className="text-sm text-slate-900 font-medium">
                      #{selectedConversation.work_order_id}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Status: {selectedConversation.work_order_status}
                    </p>
                  </div>
                )}
              </div>
            )}

            {contextTab === "actions" && (
              <div className="space-y-2">
                <button className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-left flex items-center gap-3 transition-colors">
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
    </div>
  );
}
