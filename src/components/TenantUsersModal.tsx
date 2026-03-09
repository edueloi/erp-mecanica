import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Mail, Shield, Calendar, Search } from 'lucide-react';
import api from '../services/api';

interface TenantUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: any | null;
}

export default function TenantUsersModal({
  isOpen,
  onClose,
  tenant
}: TenantUsersModalProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && tenant) {
      loadUsers();
    }
  }, [isOpen, tenant]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/superadmin/tenants/${tenant.id}/users`);
      // Ensure we always have an array
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error loading users:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Safe check for filter
  const filteredUsers = Array.isArray(users) ? users.filter(u => 
    (u.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (u.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Usuários da Oficina</h3>
                  <p className="text-xs text-slate-500 font-medium">{tenant?.name}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-slate-50 bg-slate-50/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Buscar usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 bg-white border border-slate-200 rounded-xl pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 p-4">
              {loading ? (
                <div className="py-20 text-center">
                  <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-500 font-medium text-sm">Carregando usuários...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-20 text-center text-slate-400">
                  <p className="font-medium">Nenhum usuário encontrado.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map((u) => (
                    <div 
                      key={u.id}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 font-bold border border-slate-200 group-hover:border-blue-200 group-hover:text-blue-600 transition-colors overflow-hidden">
                          {u.photo_url ? (
                            <img src={u.photo_url} alt={u.name} className="w-full h-full object-cover" />
                          ) : tenant?.logo_url ? (
                            <img src={tenant.logo_url} alt={u.name} className="w-full h-full object-cover opacity-40" />
                          ) : (
                            u.name ? u.name.charAt(0).toUpperCase() : '?'
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 leading-none mb-1">{u.name}</h4>
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                              <Mail size={10} /> {u.email}
                            </span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                            <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                              <Shield size={10} /> {u.role}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                          <Calendar size={10} />
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-white">
              <button
                onClick={onClose}
                className="w-full h-11 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
