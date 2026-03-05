import React, { useState, useEffect } from 'react';
import { Plus, MoreVertical, Edit2, Trash2, Grid, List, ArrowLeft, X, Calendar, User, Tag, Link as LinkIcon, AlertCircle, Clock, Search, Filter, Target } from 'lucide-react';
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
}

interface CardLink {
  id: string;
  card_id: string;
  entity_type: 'CLIENT' | 'VEHICLE' | 'WORK_ORDER' | 'SERVICE' | 'PART' | 'APPOINTMENT';
  entity_id: string;
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
  const [showNewCardModal, setShowNewCardModal] = useState(false);
  const [showNewColumnModal, setShowNewColumnModal] = useState(false);
  const [selectedColumnForCard, setSelectedColumnForCard] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [draggedCard, setDraggedCard] = useState<Card | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);

  const api = axios.create({
    baseURL: '/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  useEffect(() => {
    loadBoards();
  }, []);

  useEffect(() => {
    if (boardId) {
      loadBoard(boardId);
    }
  }, [boardId]);

  const loadBoards = async () => {
    try {
      const response = await api.get('/action-plans/boards');
      setBoards(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading boards:', error);
      setBoards([]);
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

  const deleteBoard = async (id: string) => {
    if (!confirm('Deseja realmente excluir este quadro?')) return;
    try {
      await api.delete(`/action-plans/boards/${id}`);
      await loadBoards();
      if (boardId === id) {
        navigate('/action-plans');
      }
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

  const createCard = async (data: { title: string; description: string; priority: string }) => {
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

        {/* Content */}
        <div className="flex-1 overflow-auto bg-slate-50 p-6">
          {Array.isArray(boards) && boards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {boards.map(board => (
                <motion.div
                  key={board.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => navigate(`/action-plans/${board.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-11 h-11 rounded-lg flex items-center justify-center text-white font-bold text-base"
                      style={{ backgroundColor: board.color }}
                    >
                      {board.icon || board.name.charAt(0).toUpperCase()}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteBoard(board.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1.5">{board.name}</h3>
                  <p className="text-slate-600 text-xs mb-3 line-clamp-2 leading-relaxed">
                    {board.description || 'Sem descrição'}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-2 border-t border-slate-100">
                    <User size={12} />
                    <span>{board.creator_name}</span>
                  </div>
                </motion.div>
              ))}
            </div>
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

        {/* New Board Modal */}
        {showNewBoardModal && <NewBoardModal onClose={() => setShowNewBoardModal(false)} onSave={createBoard} />}
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
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {column.cards.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    <p>Nenhum card ainda</p>
                    <p className="text-[10px] mt-1">Arraste cards ou crie um novo</p>
                  </div>
                ) : (
                  column.cards.map(card => (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, card)}
                      className="bg-white p-3 rounded-lg border border-slate-200 cursor-move hover:border-slate-300 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-slate-900 text-sm flex-1 leading-snug">{card.title}</h4>
                        <button
                          onClick={() => deleteCard(card.id)}
                          className="p-1 -mr-1 -mt-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      
                      {card.description && (
                        <p className="text-slate-600 text-xs mb-2.5 line-clamp-2 leading-relaxed">{card.description}</p>
                      )}

                      <div className="flex items-center gap-1.5 flex-wrap mb-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${priorityColors[card.priority]}`}>
                          {priorityLabels[card.priority]}
                        </span>
                        
                        {card.due_date && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md">
                            <Clock size={10} />
                            {new Date(card.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
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
                  ))
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
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// New Board Modal Component
function NewBoardModal({ onClose, onSave }: { onClose: () => void; onSave: (data: any) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#10b981');

  const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name, description, color });
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
            <label className="block text-sm font-medium text-slate-700 mb-2">Nome do Quadro</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Ex: Projecto 2024, Sprint 1, etc."
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Descrição (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Descreva o propósito deste quadro..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Cor</label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-xl transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
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
              Criar Quadro
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// New Column Modal Component
function NewColumnModal({ onClose, onSave }: { onClose: () => void; onSave: (data: any) => void }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6b7280');

  const colors = ['#6b7280', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

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
            <label className="block text-sm font-medium text-slate-700 mb-2">Nome da Coluna</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Ex: Pendente, Em Progresso, Finalizado"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Cor</label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-xl transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
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
function NewCardModal({ onClose, onSave }: { onClose: () => void; onSave: (data: any) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title, description, priority });
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
          <h2 className="text-lg font-bold text-slate-900">Novo Card</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Digite o título do card..."
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Descrição (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Adicione detalhes..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Prioridade</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
              <option value="URGENT">Urgente</option>
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
              Criar Card
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
