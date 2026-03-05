import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, ArrowUpRight, ArrowDownLeft, Clock, History } from 'lucide-react';
import api from '../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function CommunicationHistory() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchHistory = async (reset = false) => {
    try {
      const currentOffset = reset ? 0 : page * 50;
      const response = await api.get('/whatsapp/messages-history', {
        params: {
          search: searchTerm,
          limit: 50,
          offset: currentOffset
        }
      });
      
      const newMessages = response.data;
      
      if (!Array.isArray(newMessages)) {
        console.error('API did not return an array:', newMessages);
        setLoading(false);
        return;
      }
      
      if (reset) {
        setMessages(newMessages);
      } else {
        setMessages(prev => [...prev, ...newMessages]);
      }
      
      setHasMore(newMessages.length === 50);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching message history:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setPage(0);
    
    const timeoutId = setTimeout(() => {
      fetchHistory(true);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  useEffect(() => {
    if (page > 0) {
      fetchHistory(false);
    }
  }, [page]);

  const formatMessageTime = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <History className="text-emerald-500" />
            Histórico de Mensagens
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Registro completo de todas as mensagens recebidas e enviadas
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por contato, telefone ou conteúdo da mensagem..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto bg-slate-50/50 p-4">
          {loading && page === 0 ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 space-y-4">
              <MessageSquare size={48} className="text-slate-300" />
              <p>Nenhuma mensagem encontrada.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={cn(
                    "bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 relative overflow-hidden transition-all hover:shadow-md",
                    message.direction === 'out' ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-blue-500"
                  )}
                >
                  {/* Icon Indicator */}
                  <div className="shrink-0 pt-1">
                    {message.direction === 'out' ? (
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <ArrowUpRight size={20} />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <ArrowDownLeft size={20} />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                      <span className="font-bold text-slate-900 truncate">
                        {message.contact_name || message.contact_phone || 'Desconhecido'}
                      </span>
                      {message.contact_phone && (
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {message.contact_phone}
                        </span>
                      )}
                      
                      <div className="flex items-center gap-1 text-xs text-slate-500 ml-auto whitespace-nowrap">
                        <Clock size={12} />
                        {formatMessageTime(message.created_at)}
                      </div>
                    </div>
                    
                    <div className="text-slate-700 text-sm break-words whitespace-pre-wrap mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {message.body || (message.type !== 'text' ? `[Mídia: ${message.type}]` : '')}
                    </div>

                    <div className="flex items-center gap-3 mt-3 text-xs">
                      {message.direction === 'out' && (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500 font-medium">Enviado por:</span>
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                            {message.origin === 'bot' ? 'Bot / Automação' : (message.sender_name || 'Sistema')}
                          </span>
                        </div>
                      )}
                      
                      {message.direction === 'out' && (
                        <div className="flex items-center gap-1 ml-auto">
                          <span className="text-slate-500">Status:</span>
                          <span className={cn(
                            "font-medium",
                            message.sent_status === 'read' ? 'text-blue-500' :
                            message.sent_status === 'delivered' ? 'text-slate-500' :
                            message.sent_status === 'error' ? 'text-red-500' :
                            'text-slate-400'
                          )}>
                            {message.sent_status === 'read' ? 'Lida' :
                             message.sent_status === 'delivered' ? 'Entregue' :
                             message.sent_status === 'sent' ? 'Enviada' :
                             message.sent_status === 'error' ? 'Erro' : 'Enviando'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {hasMore && (
                <div className="flex justify-center pt-4 pb-2">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Carregando...' : 'Carregar mais'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
