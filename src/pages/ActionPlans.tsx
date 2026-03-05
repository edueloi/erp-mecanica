import React, { useState, useEffect } from 'react';
import { Plus, MoreVertical, Edit, Edit2, Trash2, Grid, List, ArrowLeft, X, Calendar, User, Tag, Link as LinkIcon, AlertCircle, Clock, Search, Filter, Target } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { useAuthStore } from '../services/authStore';

interface Board {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  category_id?: string;
  category_name?: string;
  category_color?: string;
  created_at: string;
  creator_name: string;
}

interface Column {
  id: string;
  board_id: string;
  name: string;
  color: string;
  position: number;
  cards: Card[];
}

interface Card {
  id: string;
  column_id: string;
  board_id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  due_date?: string;
  assigned_to?: string;
  assigned_name?: string;
  position: number;
  tags: string[];
  links: CardLink[];
  created_at: string;
  client_id?: string;
  client_name?: string;
  work_order_id?: string;
  work_order_number?: string;
}

interface CardLink {
  id: string;
  card_id: string;
  entity_type: 'CLIENT' | 'VEHICLE' | 'WORK_ORDER' | 'SERVICE' | 'PART' | 'APPOINTMENT';
  entity_id: string;
  entity_name?: string;
}

interface EntityData {
  id: string;
  name?: string;
  plate?: string;
  number?: string;
  description?: string;
}

interface BoardWithColumns extends Board {
  columns: Column[];
}

const priorityColors = {
  LOW: 'bg-slate-100 text-slate-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700'
};

const priorityLabels = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  URGENT: 'Urgente'
};

export default function ActionPlans() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore(state => state.token);
  const [boards, setBoards] = useState<Board[]>([]);
  const [currentBoard, setCurrentBoard] = useState<BoardWithColumns | null>(null);
  const [showNewBoardModal, setShowNewBoardModal] = useState(false);
  const [showEditBoardModal, setShowEditBoardModal] = useState(false);
  const [showDeleteBoardModal, setShowDeleteBoardModal] = useState(false);
  const [showNewCardModal, setShowNewCardModal] = useState(false);
  const [showNewColumnModal, setShowNewColumnModal] = useState(false);
  const [showCardDetailModal, setShowCardDetailModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [selectedColumnForCard, setSelectedColumnForCard] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [draggedCard, setDraggedCard] = useState<Card | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDateRange, setFilterDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Statistics
  const [statistics, setStatistics] = useState<any>(null);
  const [boardStatistics, setBoardStatistics] = useState<Record<string, any>>({});

  // Data for selects
  const [clients, setClients] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const api = axios.create({
    baseURL: '/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  useEffect(() => {
    loadBoards();
    loadClients();
    loadWorkOrders();
    loadUsers();
    loadCategories();
    loadStatistics();
  }, []);

  useEffect(() => {
    if (boardId) {
      loadBoard(boardId);
    }
  }, [boardId]);

  const loadClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadWorkOrders = async () => {
    try {
      const response = await api.get('/work-orders');
      setWorkOrders(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading work orders:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('/action-plans/categories');
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await api.get('/action-plans/statistics');
      setStatistics(response.data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const loadBoards = async () => {
    try {
      const response = await api.get('/action-plans/boards');
      const boardsData = Array.isArray(response.data) ? response.data : [];
      setBoards(boardsData);
      
      // Load statistics for each board
      for (const board of boardsData) {
        loadBoardStatistics(board.id);
      }
    } catch (error) {
      console.error('Error loading boards:', error);
      setBoards([]);
    }
  };

  const loadBoardStatistics = async (boardId: string) => {
    try {
      const response = await api.get(`/action-plans/boards/${boardId}/statistics`);
      setBoardStatistics(prev => ({ ...prev, [boardId]: response.data }));
    } catch (error) {
      console.error('Error loading board statistics:', error);
    }
  };

  const loadBoard = async (id: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/action-plans/boards/${id}`);
      setCurrentBoard(response.data);
    } catch (error) {
      console.error('Error loading board:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBoard = async (data: { name: string; description: string; color: string }) => {
    try {
      const response = await api.post('/action-plans/boards', data);
      await loadBoards();
      navigate(`/action-plans/${response.data.id}`);
      setShowNewBoardModal(false);
    } catch (error) {
      console.error('Error creating board:', error);
    }
  };

  const updateBoard = async (id: string, data: { name: string; description: string; color: string }) => {
    try {
      await api.put(`/action-plans/boards/${id}`, data);
      await loadBoards();
      if (boardId === id) {
        await loadBoard(id);
      }
      setShowEditBoardModal(false);
      setSelectedBoard(null);
    } catch (error) {
      console.error('Error updating board:', error);
    }
  };

  const deleteBoard = async () => {
    if (!selectedBoard) return;
    try {
      await api.delete(`/action-plans/boards/${selectedBoard.id}`);
      await loadBoards();
      if (boardId === selectedBoard.id) {
        navigate('/action-plans');
      }
      setShowDeleteBoardModal(false);
      setSelectedBoard(null);
    } catch (error) {
      console.error('Error deleting board:', error);
    }
  };

  const createColumn = async (data: { name: string; color: string }) => {
    if (!currentBoard) return;
    try {
      await api.post('/action-plans/columns', {
        board_id: currentBoard.id,
        ...data
      });
      await loadBoard(currentBoard.id);
      setShowNewColumnModal(false);
    } catch (error) {
      console.error('Error creating column:', error);
    }
  };

  const deleteColumn = async (columnId: string) => {
    if (!confirm('Deseja realmente excluir esta coluna? Todos os cards serão excluídos.')) return;
    try {
      await api.delete(`/action-plans/columns/${columnId}`);
      if (currentBoard) await loadBoard(currentBoard.id);
    } catch (error) {
      console.error('Error deleting column:', error);
    }
  };

  const createCard = async (data: any) => {
    if (!currentBoard || !selectedColumnForCard) return;
    try {
      await api.post('/action-plans/cards', {
        board_id: currentBoard.id,
        column_id: selectedColumnForCard,
        ...data
      });
      await loadBoard(currentBoard.id);
      setShowNewCardModal(false);
      setSelectedColumnForCard('');
    } catch (error) {
      console.error('Error creating card:', error);
    }
  };

  const deleteCard = async (cardId: string) => {
    if (!confirm('Deseja realmente excluir este card?')) return;
    try {
      await api.delete(`/action-plans/cards/${cardId}`);
      if (currentBoard) await loadBoard(currentBoard.id);
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  const isCardOverdue = (due_date?: string) => {
    if (!due_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const getDaysUntilDue = (due_date?: string) => {
    if (!due_date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(due_date);
    dueDate.setHours(0, 0, 0, 0);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleDragStart = (e: React.DragEvent, card: Card) => {
    setDraggedCard(card);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDraggedOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    if (!draggedCard || !currentBoard) return;

    if (draggedCard.column_id !== targetColumnId) {
      try {
        // Get target column cards to determine position
        const targetColumn = currentBoard.columns.find(c => c.id === targetColumnId);
        const newPosition = targetColumn?.cards.length || 0;

        await api.put(`/action-plans/cards/${draggedCard.id}/move`, {
          column_id: targetColumnId,
          position: newPosition
        });

        await loadBoard(currentBoard.id);
      } catch (error) {
        console.error('Error moving card:', error);
      }
    }

    setDraggedCard(null);
    setDraggedOverColumn(null);
  };

  // Board List View
  if (!boardId) {
    // Filtrar boards
    const filteredBoards = boards.filter(board => {
      const matchesSearch = !searchQuery || 
        board.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (board.description && board.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = !filterCategory || board.category_id === filterCategory;
      
      let matchesDate = true;
      if (filterDateRange !== 'all' && board.created_at) {
        const boardDate = new Date(board.created_at);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (filterDateRange === 'today') {
          const boardDay = new Date(boardDate);
          boardDay.setHours(0, 0, 0, 0);
          matchesDate = boardDay.getTime() === today.getTime();
        } else if (filterDateRange === 'week') {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          matchesDate = boardDate >= weekAgo;
        } else if (filterDateRange === 'month') {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          matchesDate = boardDate >= monthAgo;
        }
      }

      return matchesSearch && matchesCategory && matchesDate;
    });

    return (
      <div className="flex flex-col h-full -m-6">
        {/* Header - Compact */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-lg font-bold text-slate-900">Plano de Ação</h1>
            <div className="h-6 w-px bg-slate-200 hidden md:block" />
            <p className="text-slate-600 text-sm hidden md:block">Organize tarefas e projetos</p>
          </div>

          <button
            onClick={() => setShowNewBoardModal(true)}
            className="h-9 px-4 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm whitespace-nowrap"
          >
            <Plus size={16} /> Novo Quadro
          </button>
        </header>

        {/* Filters */}
        {boards.length > 0 && (
          <div className="bg-white border-b border-slate-200 px-6 py-3" style={{ marginTop: '20px' }}>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Buscar quadros por nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 min-w-[180px]"
                >
                  <option value="">Todas as categorias</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <select
                  value={filterDateRange}
                  onChange={(e) => setFilterDateRange(e.target.value as any)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                >
                  <option value="all">Todas as datas</option>
                  <option value="today">Hoje</option>
                  <option value="week">Última semana</option>
                  <option value="month">Último mês</option>
                </select>
                {(searchQuery || filterCategory || filterDateRange !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterCategory('');
                      setFilterDateRange('all');
                    }}
                    className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-all"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        {statistics && (
          <div className="bg-gradient-to-br from-slate-50 to-white border-b border-slate-200 px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Boards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
                    <Grid size={20} className="text-white" />
                  </div>
                  <span className="text-2xl font-bold text-slate-900">{statistics.totalBoards}</span>
                </div>
                <p className="text-sm font-medium text-slate-600">Total de Quadros</p>
              </motion.div>

              {/* Total Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                    <Target size={20} className="text-white" />
                  </div>
                  <span className="text-2xl font-bold text-slate-900">{statistics.totalCards}</span>
                </div>
                <p className="text-sm font-medium text-slate-600">Total de Cards</p>
                {statistics.cardsByStatus && statistics.cardsByStatus.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                    {statistics.cardsByStatus.slice(0, 3).map((status: any) => (
                      <div key={status.status} className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">{status.status}</span>
                        <span className="font-semibold text-slate-900">{status.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Cards by Category */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                    <Tag size={20} className="text-white" />
                  </div>
                  <span className="text-2xl font-bold text-slate-900">
                    {statistics.cardsByCategory?.length || 0}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-600">Categorias Ativas</p>
                {statistics.cardsByCategory && statistics.cardsByCategory.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                    {statistics.cardsByCategory.slice(0, 3).map((cat: any) => (
                      <div key={cat.category} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="text-slate-600 truncate">{cat.category}</span>
                        </div>
                        <span className="font-semibold text-slate-900">{cat.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Overdue Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    statistics.overdueCards > 0 ? 'bg-red-500' : 'bg-emerald-500'
                  }`}>
                    <Clock size={20} className="text-white" />
                  </div>
                  <span className={`text-2xl font-bold ${
                    statistics.overdueCards > 0 ? 'text-red-600' : 'text-emerald-600'
                  }`}>
                    {statistics.overdueCards}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-600">Cards Atrasados</p>
                {statistics.cardsByPriority && statistics.cardsByPriority.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                    {statistics.cardsByPriority.map((priority: any) => (
                      <div key={priority.priority} className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">{priorityLabels[priority.priority as keyof typeof priorityLabels]}</span>
                        <span className="font-semibold text-slate-900">{priority.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto bg-slate-50 p-6">
          {Array.isArray(boards) && boards.length > 0 ? (
            <>
              {filteredBoards.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Target size={32} className="text-slate-400" />
                    </div>
                    <p className="text-slate-900 font-bold text-lg mb-1">Nenhum quadro encontrado</p>
                    <p className="text-slate-600 text-sm mb-4">Tente ajustar os filtros</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredBoards.map(board => (
                    <motion.div
                      key={board.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg transition-all group"
                    >
                      {/* Card Header */}
                      <div 
                        className="p-5 cursor-pointer"
                        onClick={() => navigate(`/action-plans/${board.id}`)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm"
                            style={{ backgroundColor: board.category_color || board.color }}
                          >
                            {board.icon || board.name.charAt(0).toUpperCase()}
                          </div>
                          <div 
                            className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBoard(board);
                                setShowEditBoardModal(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                              title="Editar"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBoard(board);
                                setShowDeleteBoardModal(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                              title="Excluir"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <h3 className="font-bold text-slate-900 mb-1.5 text-base">{board.name}</h3>
                        <p className="text-slate-600 text-xs mb-3 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                          {board.description || 'Sem descrição'}
                        </p>
                      </div>

                      {/* Card Footer com Stats */}
                      <div className="bg-slate-50 px-5 py-3 border-t border-slate-100">
                        {boardStatistics[board.id] && boardStatistics[board.id].cardsByColumn?.length > 0 ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] mb-2">
                              <span className="font-semibold text-slate-700">Cards por Status</span>
                              <span className="text-slate-500">
                                Total: {boardStatistics[board.id].totalCards}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {boardStatistics[board.id].cardsByColumn.slice(0, 3).map((col: any) => (
                                <div
                                  key={col.id}
                                  className="flex flex-col items-center p-2 rounded-lg bg-white border border-slate-200"
                                >
                                  <span
                                    className="text-xs font-bold mb-1"
                                    style={{ color: col.color }}
                                  >
                                    {col.count}
                                  </span>
                                  <span className="text-[10px] text-slate-600 text-center leading-tight">
                                    {col.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <User size={12} />
                              <span className="font-medium">{board.creator_name}</span>
                            </div>
                            <div className="text-slate-400">
                              {new Date(board.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Target size={32} className="text-slate-400" />
                </div>
                <p className="text-slate-900 font-bold text-lg mb-1">Nenhum quadro criado</p>
                <p className="text-slate-600 text-sm mb-4">Crie seu primeiro quadro para começar</p>
                <button
                  onClick={() => setShowNewBoardModal(true)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-all"
                >
                  Criar Quadro
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        <AnimatePresence>
          {showNewBoardModal && <NewBoardModal categories={categories} onClose={() => setShowNewBoardModal(false)} onSave={createBoard} />}
          {showEditBoardModal && selectedBoard && (
            <EditBoardModal 
              board={selectedBoard}
              categories={categories}
              onClose={() => {
                setShowEditBoardModal(false);
                setSelectedBoard(null);
              }} 
              onSave={(data) => updateBoard(selectedBoard.id, data)} 
            />
          )}
          {showDeleteBoardModal && selectedBoard && (
            <DeleteBoardModal
              boardName={selectedBoard.name}
              onClose={() => {
                setShowDeleteBoardModal(false);
                setSelectedBoard(null);
              }}
              onConfirm={deleteBoard}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Board Detail View
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-600">Carregando...</div>
      </div>
    );
  }

  if (!currentBoard) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-600">Quadro não encontrado</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Header - Compact */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={() => navigate('/action-plans')}
            className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: currentBoard.color }}
          >
            {currentBoard.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">{currentBoard.name}</h1>
            {currentBoard.description && (
              <p className="text-slate-600 text-xs hidden md:block">{currentBoard.description}</p>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowNewColumnModal(true)}
          className="h-9 px-4 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm"
        >
          <Plus size={16} /> Nova Coluna
        </button>
      </header>

      {/* Columns Container */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden bg-slate-50">
        <div className="flex gap-4 p-6 h-full min-w-full">
          {currentBoard.columns.map(column => (
            <div
              key={column.id}
              className={`flex-shrink-0 w-80 bg-white rounded-lg border flex flex-col max-h-full shadow-sm ${
                draggedOverColumn === column.id ? 'border-slate-900 shadow-md' : 'border-slate-200'
              }`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: column.color }}></div>
                  <h3 className="font-bold text-slate-900 text-sm">{column.name}</h3>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    {column.cards.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setSelectedColumnForCard(column.id);
                      setShowNewCardModal(true);
                    }}
                    className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-all"
                    title="Adicionar card"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    onClick={() => deleteColumn(column.id)}
                    className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                    title="Deletar coluna"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-3 pt-[15px] space-y-2.5">
                {column.cards.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    <p>Nenhum card ainda</p>
                    <p className="text-[10px] mt-1">Arraste cards ou crie um novo</p>
                  </div>
                ) : (
                  column.cards.map(card => {
                    const isOverdue = isCardOverdue(card.due_date);
                    const daysUntil = getDaysUntilDue(card.due_date);
                    
                    return (
                      <div
                        key={card.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, card)}
                        onClick={() => {
                          setSelectedCard(card);
                          setShowCardDetailModal(true);
                        }}
                        className={`bg-white p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all group ${
                          isOverdue ? 'border-red-300 bg-red-50/30' : 'border-slate-200'
                        }`}
                      >
                        {/* Overdue Alert */}
                        {isOverdue && (
                          <div className="flex items-center gap-1 text-[10px] text-red-600 bg-red-100 px-2 py-1 rounded mb-2 font-bold">
                            <AlertCircle size={11} />
                            Atrasado {daysUntil ? `há ${Math.abs(daysUntil)} dia${Math.abs(daysUntil) > 1 ? 's' : ''}` : ''}
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-semibold text-slate-900 text-sm flex-1 leading-snug">{card.title}</h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCard(card.id);
                            }}
                            className="p-1 -mr-1 -mt-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        
                        {card.description && (
                          <p className="text-slate-600 text-xs mb-2.5 line-clamp-2 leading-relaxed">{card.description}</p>
                        )}

                        {/* Cliente e OS */}
                        {(card.client_name || card.work_order_number) && (
                          <div className="space-y-1 mb-2.5">
                            {card.client_name && (
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-700">
                                <User size={10} className="text-slate-500" />
                                <span className="font-medium">{card.client_name}</span>
                              </div>
                            )}
                            {card.work_order_number && (
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-700">
                                <Tag size={10} className="text-slate-500" />
                                <span className="font-medium">OS #{card.work_order_number}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 flex-wrap mb-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${priorityColors[card.priority]}`}>
                            {priorityLabels[card.priority]}
                          </span>
                          
                          {card.due_date && !isOverdue && (
                            <div className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-medium ${
                              daysUntil !== null && daysUntil <= 3 
                                ? 'bg-yellow-100 text-yellow-700' 
                                : 'bg-slate-50 text-slate-600'
                            }`}>
                              <Clock size={10} />
                              {new Date(card.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                              {daysUntil !== null && daysUntil >= 0 && daysUntil <= 7 && (
                                <span className="ml-0.5">({daysUntil}d)</span>
                              )}
                            </div>
                          )}

                          {card.links && card.links.length > 0 && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md">
                              <LinkIcon size={10} />
                              {card.links.length}
                            </div>
                          )}
                        </div>

                        {card.tags && card.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {card.tags.slice(0, 3).map((tag, idx) => (
                              <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                            {card.tags.length > 3 && (
                              <span className="text-[10px] text-slate-500">+{card.tags.length - 3}</span>
                            )}
                          </div>
                        )}

                        {card.assigned_name && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-600 pt-2 border-t border-slate-100">
                            <User size={11} />
                            <span className="font-medium">{card.assigned_name}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}

          {currentBoard.columns.length === 0 && (
            <div className="flex items-center justify-center w-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-300">
                  <List size={32} className="text-slate-400" />
                </div>
                <p className="text-slate-900 font-bold mb-1">Nenhuma coluna criada</p>
                <p className="text-slate-600 text-sm mb-4">Crie colunas para organizar seus cards</p>
                <button
                  onClick={() => setShowNewColumnModal(true)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-all"
                >
                  Criar Coluna
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showNewColumnModal && (
          <NewColumnModal
            onClose={() => setShowNewColumnModal(false)}
            onSave={createColumn}
          />
        )}
        {showNewCardModal && (
          <NewCardModal
            onClose={() => {
              setShowNewCardModal(false);
              setSelectedColumnForCard('');
            }}
            onSave={createCard}
            clients={clients}
            workOrders={workOrders}
            users={users}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// New Board Modal Component
function NewBoardModal({ categories, onClose, onSave }: { 
  categories: any[];
  onClose: () => void; 
  onSave: (data: any) => void 
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const selectedCategory = categories.find(c => c.id === categoryId);
    onSave({ 
      name, 
      description, 
      category_id: categoryId || null,
      color: selectedCategory?.color || '#64748b'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">Novo Quadro</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nome do Quadro *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              placeholder="Ex: Projeto 2024, Sprint 1"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              placeholder="Descreva o propósito deste quadro..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Categoria *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              required
            >
              <option value="">Selecione uma categoria</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.type === 'MECANICA' ? 'Mecânica' : cat.type === 'ELETRICA' ? 'Elétrica' : cat.type === 'SERVICOS_GERAIS' ? 'Serviços Gerais' : 'Outros'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2.5 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-all"
            >
              Criar Quadro
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Edit Board Modal Component
function EditBoardModal({ board, categories, onClose, onSave }: { 
  board: Board; 
  categories: any[];
  onClose: () => void; 
  onSave: (data: any) => void 
}) {
  const [name, setName] = useState(board.name);
  const [description, setDescription] = useState(board.description || '');
  const [categoryId, setCategoryId] = useState((board as any).category_id || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const selectedCategory = categories.find(c => c.id === categoryId);
    onSave({ 
      name, 
      description, 
      category_id: categoryId || null,
      color: selectedCategory?.color || board.color
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">Editar Quadro</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nome do Quadro *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              placeholder="Ex: Projeto 2024, Sprint 1"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              placeholder="Descreva o propósito deste quadro..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Categoria *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              required
            >
              <option value="">Selecione uma categoria</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.type === 'MECANICA' ? 'Mecânica' : cat.type === 'ELETRICA' ? 'Elétrica' : cat.type === 'SERVICOS_GERAIS' ? 'Serviços Gerais' : 'Outros'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2.5 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-all"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Delete Board Confirmation Modal
function DeleteBoardModal({ boardName, onClose, onConfirm }: { 
  boardName: string; 
  onClose: () => void; 
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">Excluir Quadro</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <div>
                <p className="text-sm font-semibold text-red-900 mb-1">Atenção: Ação irreversível</p>
                <p className="text-sm text-red-700">
                  Todas as colunas e cards deste quadro serão excluídos permanentemente.
                </p>
              </div>
            </div>
          </div>
          
          <p className="text-slate-700 text-sm">
            Deseja realmente excluir o quadro <span className="font-bold">"{boardName}"</span>?
          </p>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-all"
          >
            Sim, Excluir
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// New Column Modal Component
function NewColumnModal({ onClose, onSave }: { onClose: () => void; onSave: (data: any) => void }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#64748b');

  const colors = [
    '#64748b', // slate
    '#3b82f6', // blue
    '#10b981', // emerald
    '#14b8a6', // teal
    '#06b6d4', // cyan
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#a855f7', // purple
    '#ec4899', // pink
    '#f43f5e', // rose
    '#f97316', // orange
    '#f59e0b'  // amber
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name, color });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">Nova Coluna</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nome da Coluna *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              placeholder="Ex: Pendente, Em Progresso, Finalizado"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Cor da Coluna</label>
            <div className="grid grid-cols-6 gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-full aspect-square rounded-lg transition-all hover:scale-105 ${
                    color === c ? 'ring-2 ring-offset-2 ring-slate-900' : 'ring-1 ring-slate-200'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2.5 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-all"
            >
              Criar Coluna
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// New Card Modal Component
function NewCardModal({ onClose, onSave, clients, workOrders, users }: { 
  onClose: () => void; 
  onSave: (data: any) => void;
  clients: any[];
  workOrders: any[];
  users: any[];
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [clientId, setClientId] = useState('');
  const [workOrderId, setWorkOrderId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [tags, setTags] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);
    
    onSave({ 
      title, 
      description, 
      priority,
      due_date: dueDate || null,
      client_id: clientId || null,
      work_order_id: workOrderId || null,
      assigned_to: assignedTo || null,
      tags: tagArray
    });
  };

  // Quando seleciona uma OS, preenche automaticamente o cliente
  const handleWorkOrderChange = (woId: string) => {
    setWorkOrderId(woId);
    if (woId) {
      const wo = workOrders.find(w => w.id === woId);
      if (wo && wo.client_id) {
        setClientId(wo.client_id);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">Novo Card</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Título *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              placeholder="Ex: Aguardando aprovação do cliente"
              autoFocus
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              >
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Data de Vencimento</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Ordem de Serviço</label>
              <select
                value={workOrderId}
                onChange={(e) => handleWorkOrderChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              >
                <option value="">Nenhuma</option>
                {workOrders.map(wo => (
                  <option key={wo.id} value={wo.id}>OS #{wo.number} - {wo.client_name || 'Cliente'}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Cliente</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              >
                <option value="">Nenhum</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Responsável</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
            >
              <option value="">Nenhum</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              placeholder="Adicione detalhes sobre este card..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tags (separadas por vírgula)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              placeholder="Ex: urgente, aprovação, pagamento"
            />
          </div>

          <div className="flex gap-2.5 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-all"
            >
              Criar Card
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
