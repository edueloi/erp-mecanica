import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Smartphone, Printer, CheckCircle2, 
  User, Car, LogIn, ShieldCheck,
  Search, AlertCircle, Share2, Loader, History,
  Camera, X, Download
} from 'lucide-react';
import api from '../services/api';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import FuelLevel from '../components/FuelLevel';

const fuelMap: Record<string, string> = {
  EMPTY: 'Vazio', RESERVE: 'Reserva', '1/4': '1/4', '1/2': '1/2', '3/4': '3/4', FULL: 'Cheio'
};

export default function VehicleEntryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [publicToken, setPublicToken] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeItemIdRef = useRef<string | null>(null);
  
  // Cliente autocomplete
  const [clientSuggestions, setClientSuggestions] = useState<any[]>([]);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [clientSearchTimeout, setClientSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const clientInputRef = useRef<HTMLDivElement>(null);

  // CEP lookup
  const [cepLoading, setCepLoading] = useState(false);
  // FIPE lookup
  const [fipeLoading, setFipeLoading] = useState(false);

  useEffect(() => {
    fetchEntry();
  }, [id]);

  // Fechar dropdown de clientes ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (clientInputRef.current && !clientInputRef.current.contains(e.target as Node)) {
        setShowClientSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchEntry = async () => {
    try {
      const res = await api.get(`/entries/${id}`);
      setEntry(res.data);
      if (res.data.public_token) setPublicToken(res.data.public_token);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: any) => {
    try {
      setSaving(true);
      await api.patch(`/entries/${id}`, data);
      setEntry((prev: any) => ({ ...prev, ...data }));
    } catch (err: any) {
      console.error('Erro ao salvar:', err.response?.data || err.message);
    } finally {
      setSaving(false);
    }
  };

  // Buscar clientes por nome
  const searchClients = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setClientSuggestions([]);
      setShowClientSuggestions(false);
      return;
    }

    try {
      const res = await api.get(`/clients?q=${encodeURIComponent(searchTerm)}`);
      setClientSuggestions(res.data.slice(0, 5)); // Limitar a 5 resultados
      setShowClientSuggestions(res.data.length > 0);
    } catch (err) {
      console.error('Erro ao buscar clientes:', err);
      setClientSuggestions([]);
      setShowClientSuggestions(false);
    }
  };

  // Selecionar cliente da lista
  const selectClient = (client: any) => {
    const updateData = {
      client_id: client.id,
      customer_name: client.name,
      customer_document: client.document,
      customer_phone: client.phone,
      customer_zip_code: client.zip_code,
      customer_state: client.state,
      customer_city: client.city,
      customer_neighborhood: client.neighborhood,
      customer_street: client.street,
      customer_number: client.number,
    };
    
    setEntry((prev: any) => ({ ...prev, ...updateData }));
    handleUpdate(updateData);
    setShowClientSuggestions(false);
    setClientSuggestions([]);
  };

  // Handler para mudança no nome do cliente
  const handleClientNameChange = (value: string) => {
    setEntry({...entry, customer_name: value});
    
    // Limpar timeout anterior
    if (clientSearchTimeout) {
      clearTimeout(clientSearchTimeout);
    }
    
    // Criar novo timeout para buscar após 500ms
    const timeout = setTimeout(() => {
      searchClients(value);
    }, 500);
    
    setClientSearchTimeout(timeout);
  };

  // Buscar endereço pelo CEP (ViaCEP)
  const handleCepLookup = async (cep: string) => {
    const cleaned = cep.replace(/\D/g, '');
    if (cleaned.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
      const data = await res.json();
      if (!data.erro) {
        const updateData = {
          customer_zip_code: cep,
          customer_state: data.uf,
          customer_city: data.localidade,
          customer_neighborhood: data.bairro,
          customer_street: data.logradouro,
        };
        setEntry((prev: any) => ({ ...prev, ...updateData }));
        handleUpdate(updateData);
      }
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
    } finally {
      setCepLoading(false);
    }
  };

  // Buscar dados do veículo via sistema interno (placa)
  const handleFipeLookupByPlate = async (plate: string) => {
    const cleaned = plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (cleaned.length < 7) return;
    setFipeLoading(true);
    try {
      const res = await api.get(`/vehicles?q=${encodeURIComponent(cleaned)}`);
      if (res.data && res.data.length > 0) {
        const v = res.data[0];
        const updateData = {
          vehicle_id: v.id,
          vehicle_plate: v.plate,
          vehicle_chassis: v.vin,
          vehicle_brand: v.brand,
          vehicle_model: v.model,
          vehicle_year: String(v.year),
          vehicle_color: v.color,
          vehicle_fuel_type: v.fuel_type,
          vehicle_gearbox: v.gearbox,
        };
        setEntry((prev: any) => ({ ...prev, ...updateData }));
        handleUpdate(updateData);
      }
    } catch (err) {
      console.error('Erro ao buscar veículo:', err);
    } finally {
      setFipeLoading(false);
    }
  };

  const handleGenerateToken = async () => {
    try {
      const res = await api.post(`/entries/${id}/token`);
      setPublicToken(res.data.token);
      setShowQR(true);
    } catch (err) {
      console.error(err);
    }
  };

  // ── Photo upload (admin) ──────────────────────────
  const handlePhotoClick = (itemId: string) => {
    activeItemIdRef.current = itemId;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const itemId = activeItemIdRef.current;
    if (!file || !itemId) return;

    setUploading(itemId);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        await api.patch(`/entries/${id}/items/${itemId}`, { image_url: base64 });
        setEntry((prev: any) => ({
          ...prev,
          items: prev.items.map((it: any) => it.id === itemId ? { ...it, image_url: base64 } : it)
        }));
      } catch (err) {
        alert('Erro ao enviar foto');
      } finally {
        setUploading(null);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ── ADD route for item photos ─────────────────────
  // (uses the public route format for simplicity — reuse same handler)
  const handleRemovePhoto = async (itemId: string) => {
    try {
      await api.patch(`/entries/${id}/items/${itemId}`, { image_url: null });
      setEntry((prev: any) => ({
        ...prev,
        items: prev.items.map((it: any) => it.id === itemId ? { ...it, image_url: null } : it)
      }));
    } catch (err) {
      console.error(err);
    }
  };

  // ── Print checklist ───────────────────────────────
  const handlePrint = () => {
    if (!entry) return;
    const fuelLabel = fuelMap[entry.fuel_level] || entry.fuel_level || '—';
    const isGuincho = entry.arrived_by_tow_truck;

    // Collect photos as <img> tags
    const photoItems = (entry.items || []).filter((i: any) => i.image_url);
    const photosHtml = photoItems.length > 0
      ? `<div class="section-title">Fotos do Veículo</div>
         <div class="photos-grid">
           ${photoItems.map((i: any) => `
             <div class="photo-item">
               <img src="${i.image_url}" alt="${i.item}" />
               <span>${i.item}</span>
             </div>
           `).join('')}
         </div>`
      : '';

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Checklist de Entrada</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; padding: 20px; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 14px; }
    .header .logo-name { font-size: 18px; font-weight: 900; letter-spacing: 1px; }
    .header .doc-title { font-size: 13px; font-weight: bold; margin-top: 4px; text-transform: uppercase; letter-spacing: 2px; }
    .header .meta { font-size: 10px; color: #555; margin-top: 4px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
    .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px; }
    .section { border: 1px solid #ddd; border-radius: 4px; padding: 10px; margin-bottom: 10px; }
    .section-title { font-weight: bold; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #555; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
    .field { margin-bottom: 6px; }
    .field label { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #888; display: block; }
    .field .value { font-size: 11px; font-weight: bold; border-bottom: 1px dotted #ccc; min-height: 16px; }
    .checks-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
    .check-item { display: flex; align-items: center; gap: 6px; font-size: 10px; }
    .check-box { width: 14px; height: 14px; border: 1.5px solid #555; display: inline-block; text-align: center; line-height: 14px; font-size: 10px; flex-shrink: 0; }
    .photos-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px; }
    .photo-item { text-align: center; }
    .photo-item img { width: 100%; height: 120px; object-fit: cover; border: 1px solid #ddd; border-radius: 4px; }
    .photo-item span { font-size: 9px; color: #555; display: block; margin-top: 2px; }
    .sig-area { border: 1px solid #ddd; border-radius: 4px; padding: 10px; margin-bottom: 10px; }
    .sig-line { border-bottom: 1px solid #555; height: 40px; margin-bottom: 4px; }
    .sig-label { font-size: 9px; color: #888; text-transform: uppercase; }
    .sig-grid { display: grid; gap: 16px; margin-bottom: 10px; }
    .sig-grid.two { grid-template-columns: 1fr 1fr; }
    .sig-grid.three { grid-template-columns: 1fr 1fr 1fr; }
    .auth-box { border: 1.5px solid #222; padding: 8px; margin-bottom: 10px; border-radius: 4px; font-size: 10px; }
    .auth-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .auth-row .check-box { flex-shrink: 0; }
    .obs-box { border: 1px solid #ddd; height: 50px; border-radius: 4px; margin-top: 4px; }
    .diag-box { background: #f1f5f9; padding: 8px; border-radius: 4px; font-size: 9px; line-height: 1.5; text-transform: uppercase; color: #475569; }
    @media print { body { padding: 10px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-name">AUTOCAR</div>
    <div class="doc-title">Checklist de Entrada</div>
    <div class="meta">
      DATA / HORA: ${entry.entry_date ? format(new Date(entry.entry_date + 'T12:00:00'), 'dd/MM/yyyy') : format(new Date(entry.created_at), 'dd/MM/yyyy')} 
      às ${entry.entry_time || format(new Date(entry.created_at), 'HH:mm')}
    </div>
  </div>

  <div class="two-col">
    <div class="field"><label>Mecânico Responsável</label><div class="value">${entry.responsible_name || ''}</div></div>
    <div class="field"><label>Status</label><div class="value">${entry.status === 'COMPLETED' ? 'FINALIZADO' : 'RASCUNHO'}</div></div>
  </div>

  <div class="section">
    <div class="section-title">Dados do Cliente</div>
    <div class="field"><label>Nome</label><div class="value">${entry.customer_name || ''}</div></div>
    <div class="two-col" style="margin-top:6px">
      <div class="field"><label>CPF / CNPJ</label><div class="value">${entry.customer_document || ''}</div></div>
      <div class="field"><label>Telefone</label><div class="value">${entry.customer_phone || ''}</div></div>
    </div>
    ${entry.customer_street ? `<div class="field" style="margin-top:6px"><label>Endereço</label><div class="value">${entry.customer_street || ''}${entry.customer_number ? ', ' + entry.customer_number : ''} — ${entry.customer_neighborhood || ''} — ${entry.customer_city || ''}/${entry.customer_state || ''}</div></div>` : ''}
  </div>

  <div class="section">
    <div class="section-title">Dados do Veículo</div>
    <div class="three-col">
      <div class="field"><label>Placa</label><div class="value" style="font-size:14px;font-weight:900;letter-spacing:2px">${entry.vehicle_plate || ''}</div></div>
      <div class="field"><label>Marca / Versão</label><div class="value">${entry.vehicle_brand || ''} ${entry.vehicle_model || ''}</div></div>
      <div class="field"><label>Cor</label><div class="value">${entry.vehicle_color || ''}</div></div>
    </div>
    <div class="three-col">
      <div class="field"><label>Ano</label><div class="value">${entry.vehicle_year || ''}</div></div>
      <div class="field"><label>Chassi</label><div class="value">${entry.vehicle_chassis || ''}</div></div>
      <div class="field"><label>KM Atual</label><div class="value">${entry.vehicle_km ? Number(entry.vehicle_km).toLocaleString('pt-BR') : ''}</div></div>
    </div>
    <div class="three-col">
      <div class="field"><label>Combustível</label><div class="value">${entry.vehicle_fuel_type || ''}</div></div>
      <div class="field"><label>Nível no Tanque</label><div class="value">${fuelLabel}</div></div>
      <div class="field"><label>Câmbio</label><div class="value">${entry.vehicle_gearbox || ''}</div></div>
    </div>
    <div class="field" style="margin-top:6px"><label>Portas</label><div class="value">${entry.doors_count ? entry.doors_count + ' PORTAS' : ''}</div></div>
  </div>

  <div class="section">
    <div class="section-title">Serviço Solicitado (Relato do Cliente)</div>
    <div class="obs-box" style="padding:6px;font-size:10px;height:auto;min-height:40px">${entry.requested_service || ''}</div>
  </div>

  <div class="section">
    <div class="section-title">Checklist / Avarias / Diagnóstico</div>
    <div class="checks-grid">
      <div class="check-item">
        <span class="check-box">${isGuincho ? 'X' : '&nbsp;'}</span> SIM &nbsp;&nbsp;
        <span class="check-box">${!isGuincho ? 'X' : '&nbsp;'}</span> NÃO
        &nbsp; GUINCHO?
      </div>
      <div class="check-item">
        <span class="check-box">${entry.dashboard_light_on ? 'X' : '&nbsp;'}</span> SIM &nbsp;&nbsp;
        <span class="check-box">${!entry.dashboard_light_on ? 'X' : '&nbsp;'}</span> NÃO
        &nbsp; LUZ DE PAINEL?
      </div>
      <div class="check-item">
        <span class="check-box">${entry.doc_in_vehicle ? 'X' : '&nbsp;'}</span> SIM &nbsp;&nbsp;
        <span class="check-box">${!entry.doc_in_vehicle ? 'X' : '&nbsp;'}</span> NÃO
        &nbsp; DOC. NO VEÍCULO?
      </div>
    </div>
  </div>

  ${photosHtml ? `<div class="section">${photosHtml}</div>` : ''}

  <div class="auth-box">
    <div class="two-col" style="font-size:11px;font-weight:bold;margin-bottom:6px">
      <div>
        <div class="auth-row">
          <span class="check-box">${entry.image_auth ? 'X' : '&nbsp;'}</span>
          SIM
          <span class="check-box">${!entry.image_auth ? 'X' : '&nbsp;'}</span>
          NÃO
        </div>
        Autoriza o uso de imagem (restrição de placa para divulgação)?
      </div>
      <div>
        Diagnóstico Técnico Solicitado: <strong>${entry.diagnostic_requested ? 'SIM' : 'NÃO SOLICITADO'}</strong>
      </div>
    </div>
  </div>

  ${isGuincho ? `
  <div class="sig-area">
    <div class="section-title">Autorização do Guincheiro</div>
    <div class="field"><label>Nome do Guincheiro / Empresa</label><div class="value">${entry.tow_truck_driver_name || ''}</div></div>
    <div class="two-col" style="margin-top: 16px">
      <div>
        <div class="sig-line"></div>
        <div class="sig-label">Assinatura do Guincheiro</div>
      </div>
      <div>
        <div class="sig-line"></div>
        <div class="sig-label">Recebido por (Oficina)</div>
      </div>
    </div>
  </div>` : ''}

  <div class="sig-area">
    <div class="section-title">Assinaturas</div>
    <div class="sig-grid ${isGuincho ? 'three' : 'two'}">
      <div>
        <div class="sig-line"></div>
        <div class="sig-label">Assinatura do Cliente</div>
      </div>
      <div>
        <div class="sig-line"></div>
        <div class="sig-label">Assinatura do Responsável Técnico</div>
      </div>
      ${isGuincho ? `<div>
        <div class="sig-line"></div>
        <div class="sig-label">Assinatura do Guincheiro</div>
      </div>` : ''}
    </div>
  </div>

  <div class="diag-box">
    O DIAGNÓSTICO TÉCNICO INCLUI ESCANEAMENTO ELETRÔNICO COMPLETO, TESTES DE ATUADORES E SENSORES, AVALIAÇÃO DE GRANDEZAS ELÉTRICAS, TESTES FUNCIONAIS E ANÁLISE TÉCNICA AVANÇADA PARA IDENTIFICAÇÃO DA CAUSA RAIZ DO PROBLEMA.
  </div>

  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  // ─────────────────────────────────────────────────
  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center gap-4 grayscale opacity-40">
       <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
       <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Carregando...</p>
    </div>
  );

  if (!entry) return (
    <div className="h-full flex items-center justify-center text-slate-400">Entrada não encontrada.</div>
  );

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 pb-32">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/vehicle-entries')} className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Detalhes da Entrada</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Inspeção e dados do veículo</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateToken}
            className="h-9 px-4 bg-white border border-slate-200 text-slate-600 rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
          >
            <Smartphone size={16} /> Acesso Celular
          </button>
          <button
            onClick={handlePrint}
            className="h-9 px-4 bg-white border border-slate-200 text-slate-600 rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
          >
            <Printer size={16} /> Imprimir
          </button>
          <button
            className="h-9 px-4 bg-slate-900 text-white rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-sm"
            onClick={() => handleUpdate({ status: 'COMPLETED' })}
          >
            <CheckCircle2 size={16} /> Finalizar Entrada
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main Column ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Responsável & Entrada */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center"><LogIn size={16} /></div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Responsável & Entrada</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nome do Responsável</label>
                <input type="text" value={entry.responsible_name || ''} onChange={e => setEntry({...entry, responsible_name: e.target.value})} onBlur={e => handleUpdate({ responsible_name: e.target.value })} placeholder="Seu nome..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-900/10 transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Data</label>
                <input type="date" value={entry.entry_date || ''} onChange={e => setEntry({...entry, entry_date: e.target.value})} onBlur={e => handleUpdate({ entry_date: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-900/10" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Horário</label>
                <input type="time" value={entry.entry_time || ''} onChange={e => setEntry({...entry, entry_time: e.target.value})} onBlur={e => handleUpdate({ entry_time: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-900/10" />
              </div>
            </div>

            {/* Guincho checkbox */}
            <div className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${entry.arrived_by_tow_truck ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
              <input
                type="checkbox"
                id="tow_truck"
                checked={!!entry.arrived_by_tow_truck}
                onChange={e => handleUpdate({ arrived_by_tow_truck: e.target.checked })}
                className="w-4 h-4 mt-0.5 rounded border-slate-300 text-amber-500"
              />
              <div className="flex-1">
                <label htmlFor="tow_truck" className="text-sm font-bold text-slate-700 cursor-pointer">Chegou de Guincho?</label>
                {/* Nome do guincheiro — aparece só se marcado */}
                <AnimatePresence>
                  {entry.arrived_by_tow_truck && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="mt-3">
                        <label className="block text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">Nome do Guincheiro / Empresa</label>
                        <input
                          type="text"
                          value={entry.tow_truck_driver_name || ''}
                          onChange={e => setEntry({...entry, tow_truck_driver_name: e.target.value})}
                          onBlur={e => handleUpdate({ tow_truck_driver_name: e.target.value })}
                          placeholder="Nome ou empresa do guincho..."
                          className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </section>

          {/* Dados do Cliente */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center"><User size={16} /></div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Dados do Cliente</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nome Completo</label>
                <div className="relative" ref={clientInputRef}>
                  <input 
                    type="text" 
                    value={entry.customer_name || ''} 
                    onChange={e => handleClientNameChange(e.target.value)}
                    onBlur={e => {
                      // Delay para permitir o clique no item da lista
                      setTimeout(() => handleUpdate({ customer_name: e.target.value }), 200);
                    }}
                    placeholder="Digite o nome do cliente..." 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-900/10" 
                  />
                  {showClientSuggestions && clientSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {clientSuggestions.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => selectClient(client)}
                          className="w-full px-3 py-2 text-left hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors"
                        >
                          <div className="text-sm font-semibold text-slate-900">{client.name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                            {client.document && <span>{client.document}</span>}
                            {client.phone && <span>{client.phone}</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">CPF / CNPJ</label>
                <div className="relative">
                  <input type="text" value={entry.customer_document || ''} onChange={e => setEntry({...entry, customer_document: e.target.value})} onBlur={async e => {
                    const doc = e.target.value;
                    handleUpdate({ customer_document: doc });
                    if (doc.replace(/\D/g,'').length >= 11) {
                      try {
                        const res = await api.get(`/clients?q=${encodeURIComponent(doc)}`);
                        if (res.data.length > 0) {
                          const c = res.data[0];
                          const updateData = {
                            client_id: c.id,
                            customer_name: c.name,
                            customer_document: c.document,
                            customer_phone: c.phone,
                            customer_zip_code: c.zip_code,
                            customer_state: c.state,
                            customer_city: c.city,
                            customer_neighborhood: c.neighborhood,
                            customer_street: c.street,
                            customer_number: c.number,
                          };
                          setEntry((prev: any) => ({ ...prev, ...updateData }));
                          handleUpdate(updateData);
                        }
                      } catch {}
                    }
                  }} placeholder="000.000.000-00" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-900/10" />
                  <Search size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Telefone / WhatsApp</label>
                <input type="text" value={entry.customer_phone || ''} onChange={e => setEntry({...entry, customer_phone: e.target.value})} onBlur={e => handleUpdate({ customer_phone: e.target.value })} placeholder="(00) 00000-0000" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-900/10" />
              </div>
              <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { key: 'customer_zip_code', label: 'CEP', placeholder: '00000-000' },
                  { key: 'customer_state', label: 'UF', placeholder: 'SP' },
                  { key: 'customer_city', label: 'Cidade', placeholder: 'Cidade', span: 2 },
                ].map(f => (
                  <div key={f.key} className={f.span === 2 ? 'col-span-2' : ''}>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{f.label}</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={entry[f.key] || ''}
                        onChange={e => setEntry({...entry, [f.key]: e.target.value})}
                        onBlur={e => {
                          handleUpdate({ [f.key]: e.target.value });
                          if (f.key === 'customer_zip_code') handleCepLookup(e.target.value);
                        }}
                        placeholder={f.placeholder}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
                      />
                      {f.key === 'customer_zip_code' && cepLoading && (
                        <Loader size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 animate-spin" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="md:col-span-2 grid grid-cols-4 gap-3">
                <div className="col-span-3">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Endereço (Rua/Av)</label>
                  <input type="text" value={entry.customer_street || ''} onChange={e => setEntry({...entry, customer_street: e.target.value})} onBlur={e => handleUpdate({ customer_street: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-900/10" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nº</label>
                  <input type="text" value={entry.customer_number || ''} onChange={e => setEntry({...entry, customer_number: e.target.value})} onBlur={e => handleUpdate({ customer_number: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-900/10" />
                </div>
              </div>
            </div>
          </section>

          {/* Dados do Veículo */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center"><Car size={16} /></div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Dados do Veículo</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1.5 italic">PLACA</label>
                <div className="relative">
                  <input type="text" value={entry.vehicle_plate || ''} onChange={e => setEntry({...entry, vehicle_plate: e.target.value.toUpperCase()})} onBlur={async e => {
                    const plate = e.target.value.toUpperCase();
                    handleUpdate({ vehicle_plate: plate });
                    await handleFipeLookupByPlate(plate);
                  }} placeholder="ABC-1234" className="w-full px-3 py-2 bg-slate-50 border border-indigo-100 rounded-lg text-sm font-black tracking-widest outline-none focus:ring-2 focus:ring-indigo-500/20 uppercase" />
                  {fipeLoading
                    ? <Loader size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 animate-spin" />
                    : <Search size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-300" />
                  }
                </div>
                {fipeLoading && (
                  <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-1 animate-pulse">Buscando dados do veículo...</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nº Chassi</label>
                <input type="text" value={entry.vehicle_chassis || ''} onChange={e => setEntry({...entry, vehicle_chassis: e.target.value})} onBlur={e => handleUpdate({ vehicle_chassis: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-900/10" />
              </div>
              {[
                { key: 'vehicle_brand', label: 'Marca', ph: 'Ex: Volkswagen' },
                { key: 'vehicle_model', label: 'Versão / Modelo', ph: 'Ex: Fox 1.6' },
                { key: 'vehicle_year', label: 'Ano', ph: '2020' },
                { key: 'vehicle_color', label: 'Cor', ph: 'Ex: Prata' },
                { key: 'vehicle_km', label: 'KM Atual', ph: '0', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{f.label}</label>
                  <input type={f.type || 'text'} value={entry[f.key] || ''} onChange={e => setEntry({...entry, [f.key]: e.target.value})} onBlur={e => handleUpdate({ [f.key]: e.target.value })} placeholder={f.ph} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-900/10" />
                </div>
              ))}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Câmbio</label>
                <select value={entry.vehicle_gearbox || ''} onChange={e => handleUpdate({ vehicle_gearbox: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-900/10">
                  <option value="">Selecione...</option>
                  <option value="MANUAL">Manual</option>
                  <option value="AUTOMATICO">Automático</option>
                  <option value="CVT">CVT</option>
                  <option value="SEMI-AUTOMATICO">Semi-automático</option>
                </select>
              </div>
            </div>

            {/* Combustível */}
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Nível de Combustível</label>
              <FuelLevel value={entry.fuel_level || 'EMPTY'} onChange={val => handleUpdate({ fuel_level: val })} />
            </div>
          </section>

          {/* Conferência */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center"><ShieldCheck size={16} /></div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Itens de Conferência</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: 'doc_in_vehicle', label: 'Documento está no veículo?' },
                { key: 'dashboard_light_on', label: 'Luz de painel acesa?' },
                { key: 'image_auth', label: 'Autoriza uso de imagem?' },
                { key: 'diagnostic_requested', label: 'Diagnóstico técnico solicitado?' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-sm font-bold text-slate-700">{item.label}</span>
                  <input type="checkbox" checked={!!entry[item.key]} onChange={e => handleUpdate({ [item.key]: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-slate-900" />
                </div>
              ))}
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Quantidade de Portas</label>
                <div className="flex gap-3">
                  {[2, 3, 4, 5].map(p => (
                    <button key={p} onClick={() => handleUpdate({ doors_count: p })} className={`flex-1 py-2 rounded-lg font-black text-sm transition-all border ${entry.doors_count === p ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300'}`}>{p}</button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Serviço Solicitado */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center"><History size={16} /></div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Serviço Solicitado</h3>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Relato do Cliente</label>
              <textarea value={entry.requested_service || ''} onChange={e => setEntry({...entry, requested_service: e.target.value})} onBlur={e => handleUpdate({ requested_service: e.target.value })} placeholder="Escreva como relatado pelo cliente..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-900/10 min-h-[100px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'last_revision_km', label: 'Última Revisão KM', type: 'number', ph: 'KM' },
                { key: 'last_revision_date', label: 'Data da Última Revisão', type: 'date', ph: '' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{f.label}</label>
                  <input type={f.type} value={entry[f.key] || ''} onChange={e => setEntry({...entry, [f.key]: e.target.value})} onBlur={e => handleUpdate({ [f.key]: e.target.value })} placeholder={f.ph} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-900/10" />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/20 rounded-full -mr-12 -mt-12 blur-2xl" />
            <div className="relative space-y-4">
              <div>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Resumo da Entrada</p>
                <h2 className="text-2xl font-black italic tracking-tight">{entry.vehicle_plate || '---'}</h2>
                <p className="text-slate-400 font-bold uppercase text-xs mt-0.5">{entry.vehicle_brand || '---'} {entry.vehicle_model || ''}</p>
              </div>
              <div className="space-y-3 pt-3 border-t border-white/10">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 uppercase font-bold tracking-widest">Status</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-black uppercase ${entry.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {entry.status === 'COMPLETED' ? 'Concluído' : 'Em Aberto'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 uppercase font-bold tracking-widest">Fotos</span>
                  <span className="text-emerald-400 font-black">{entry.items?.filter((i: any) => i.image_url).length || 0} de {entry.items?.length || 0}</span>
                </div>
                {entry.vehicle_km && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 uppercase font-bold tracking-widest">KM</span>
                    <span className="text-white font-black">{Number(entry.vehicle_km).toLocaleString('pt-BR')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fotos - Checklist de Inspeção */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center"><Camera size={16} /></div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Fotos Iniciais</h3>
              </div>
              {entry.photos_confirmed && <CheckCircle2 size={18} className="text-emerald-500" />}
            </div>

            <div className="grid grid-cols-1 gap-3">
              {entry.items?.map((item: any) => (
                <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all group ${item.image_url ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
                  {/* Thumbnail / câmera */}
                  <button
                    onClick={() => handlePhotoClick(item.id)}
                    className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 hover:scale-105 transition-transform relative"
                    title="Clique para trocar/adicionar foto"
                  >
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.item} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-white flex items-center justify-center text-slate-300">
                        {uploading === item.id ? <Loader className="animate-spin" size={18} /> : <Camera size={18} />}
                      </div>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.item}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">{item.image_url ? 'Foto OK' : 'Sem foto'}</p>
                  </div>
                  {item.image_url && (
                    <button onClick={() => handleRemovePhoto(item.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all opacity-0 group-hover:opacity-100">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
              <input
                type="checkbox"
                id="photos_conf"
                checked={!!entry.photos_confirmed}
                onChange={e => handleUpdate({ photos_confirmed: e.target.checked })}
                className="w-4 h-4 rounded border-indigo-300 text-indigo-600"
              />
              <label htmlFor="photos_conf" className="text-[10px] font-bold text-indigo-900 uppercase leading-relaxed tracking-wide cursor-pointer">
                Confirmo que as fotos foram tiradas
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
              onClick={() => setShowQR(false)}
            />
            <div className="fixed inset-0 flex items-center justify-center z-[101] p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto overflow-hidden text-center"
              >
                <div className="p-6 space-y-5">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
                    <Smartphone size={28} className="text-slate-600" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900">Acesso pelo Celular</h3>
                    <p className="text-sm text-slate-500">Escaneie para preencher os dados e tirar fotos pelo celular.</p>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm inline-block">
                    {publicToken ? (
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '/entry-upload/' + publicToken)}`}
                        alt="QR Code"
                        className="w-48 h-48 rounded-xl"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center">
                        <Loader className="animate-spin text-slate-300" size={28} />
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 pt-1">
                    <button
                      onClick={() => {
                        const url = window.location.origin + '/entry-upload/' + publicToken;
                        navigator.clipboard.writeText(url);
                        alert('Link copiado!');
                      }}
                      className="w-full h-11 bg-slate-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
                    >
                      <Share2 size={16} /> Copiar Link de Acesso
                    </button>
                    <button onClick={() => setShowQR(false)} className="text-slate-400 text-xs font-bold uppercase tracking-wider hover:text-slate-600 transition-colors">
                      Fechar
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md p-4 lg:pl-72 border-t border-slate-100 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${saving ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="text-xs font-medium text-slate-500">{saving ? 'Salvando...' : 'Alterações salvas'}</span>
          </div>
          <button onClick={handlePrint} className="h-9 px-4 bg-slate-900 text-white rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-slate-800 transition-all">
            <Printer size={16} /> Imprimir / Baixar
          </button>
        </div>
      </div>
    </div>
  );
}
