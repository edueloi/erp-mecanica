import React, { useState } from 'react';
import { X, Download, Upload, FileSpreadsheet, FileType, FileJson, FileCode } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { exportToExcel, exportToPDF, exportToCSV, downloadTemplate, parseImportFile } from '../utils/exportUtils';
import { useSettings } from '../contexts/SettingsContext';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'import' | 'export';
  title: string;
  data?: any[];
  columns?: { header: string; dataKey: string }[];
  templateData?: any[];
  onImport?: (data: any[]) => Promise<void>;
  entityName: string;
}

export default function ImportExportModal({
  isOpen,
  onClose,
  mode,
  title,
  data = [],
  columns = [],
  templateData = [],
  onImport,
  entityName,
}: ImportExportModalProps) {
  const { tenantSettings, preferences } = useSettings();
  const [selectedFormat, setSelectedFormat] = useState<'excel' | 'pdf' | 'csv'>('excel');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  const display = preferences.sidebar_display || 'name_and_logo';
  const tenantName = display !== 'logo_only' ? (tenantSettings?.trade_name || tenantSettings?.company_name || '') : '';
  const tenantLogo = display !== 'name_only' ? (tenantSettings?.logo_url || '') : '';

  const handleExport = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${entityName}_${timestamp}`;

    try {
      if (selectedFormat === 'excel') {
        exportToExcel(data, filename, title);
      } else if (selectedFormat === 'pdf') {
        exportToPDF(data, columns, filename, title, { tenantName, tenantLogo });
      } else if (selectedFormat === 'csv') {
        exportToCSV(data, filename);
      }
      onClose();
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar dados');
    }
  };

  const handleDownloadTemplate = (format: 'excel' | 'csv') => {
    try {
      downloadTemplate(templateData, entityName, format);
    } catch (error) {
      console.error('Erro ao baixar template:', error);
      alert('Erro ao baixar template');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportError('');
    setImportSuccess('');

    try {
      const data = await parseImportFile(file);
      
      if (!data || data.length === 0) {
        setImportError('Arquivo vazio ou formato inválido');
        setImporting(false);
        return;
      }

      if (onImport) {
        await onImport(data);
        setImportSuccess(`${data.length} registro(s) importado(s) com sucesso!`);
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Erro ao importar:', error);
      setImportError(error.message || 'Erro ao processar arquivo');
    } finally {
      setImporting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  {mode === 'export' ? (
                    <Download className="text-white" size={20} />
                  ) : (
                    <Upload className="text-white" size={20} />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{title}</h2>
                  <p className="text-xs text-white/70">
                    {mode === 'export' ? 'Escolha o formato de exportação' : 'Envie seu arquivo de dados'}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {mode === 'export' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-900 mb-3">
                      Selecione o formato:
                    </label>
                    
                    <button
                      onClick={() => setSelectedFormat('excel')}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                        selectedFormat === 'excel'
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        selectedFormat === 'excel' ? 'bg-emerald-100' : 'bg-slate-100'
                      }`}>
                        <FileSpreadsheet className={selectedFormat === 'excel' ? 'text-emerald-600' : 'text-slate-600'} size={24} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-bold text-slate-900">Excel (.xlsx)</p>
                        <p className="text-xs text-slate-500">Planilha Excel com formatação</p>
                      </div>
                      {selectedFormat === 'excel' && (
                        <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>

                    <button
                      onClick={() => setSelectedFormat('pdf')}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                        selectedFormat === 'pdf'
                          ? 'border-red-500 bg-red-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        selectedFormat === 'pdf' ? 'bg-red-100' : 'bg-slate-100'
                      }`}>
                        <FileType className={selectedFormat === 'pdf' ? 'text-red-600' : 'text-slate-600'} size={24} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-bold text-slate-900">PDF (.pdf)</p>
                        <p className="text-xs text-slate-500">Documento PDF para impressão</p>
                      </div>
                      {selectedFormat === 'pdf' && (
                        <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>

                    <button
                      onClick={() => setSelectedFormat('csv')}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                        selectedFormat === 'csv'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        selectedFormat === 'csv' ? 'bg-blue-100' : 'bg-slate-100'
                      }`}>
                        <FileCode className={selectedFormat === 'csv' ? 'text-blue-600' : 'text-slate-600'} size={24} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-bold text-slate-900">CSV (.csv)</p>
                        <p className="text-xs text-slate-500">Arquivo de texto separado por vírgulas</p>
                      </div>
                      {selectedFormat === 'csv' && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  </div>

                  <div className="pt-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                    📊 Total de registros: <strong className="text-slate-900">{data.length}</strong>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Download Templates */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                      <Download size={16} />
                      Baixar Modelo de Importação
                    </h3>
                    <p className="text-xs text-blue-700 mb-3">
                      Use nossos modelos para garantir que seus dados estejam no formato correto
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownloadTemplate('excel')}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all"
                      >
                        <FileSpreadsheet size={14} />
                        Excel
                      </button>
                      <button
                        onClick={() => handleDownloadTemplate('csv')}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all"
                      >
                        <FileCode size={14} />
                        CSV
                      </button>
                    </div>
                  </div>

                  {/* Upload Area */}
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">
                      Enviar Arquivo:
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv,.json,.xml"
                        onChange={handleFileSelect}
                        disabled={importing}
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 file:cursor-pointer cursor-pointer disabled:opacity-50"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Formatos aceitos: Excel (.xlsx, .xls), CSV (.csv), JSON (.json), XML (.xml)
                    </p>
                  </div>

                  {/* Status Messages */}
                  {importing && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                      Processando arquivo...
                    </div>
                  )}

                  {importError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                      ❌ {importError}
                    </div>
                  )}

                  {importSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700">
                      ✅ {importSuccess}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {mode === 'export' && (
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                <button
                  onClick={onClose}
                  className="px-5 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleExport}
                  className="px-5 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
                >
                  <Download size={16} />
                  Exportar
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
