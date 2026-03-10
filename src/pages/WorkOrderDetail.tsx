import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Printer, Save, Plus, Trash2, CheckCircle2, AlertCircle,
  FileText, Wrench, Package, User, Car, ChevronRight, Clock,
  ShieldCheck, Camera, CreditCard, History, Info, CheckCircle,
  AlertTriangle, XCircle, HelpCircle, MoreVertical, Send, Check,
  Search, ClipboardCheck, ClipboardList, X
} from 'lucide-react';
import api from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ');
}

type TabType = 'INFORMATION' | 'DIAGNOSIS' | 'SERVICES' | 'PARTS' | 'PHOTOS' | 'HISTORY';

export default function WorkOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [wo, setWo] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('DIAGNOSIS');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [statusChangeModalOpen, setStatusChangeModalOpen] = useState(false);
  const [itemForm, setItemForm] = useState({ description: '', quantity: 1, unit_price: 0, mechanic_id: '', part_id: '', type: 'SERVICE' as 'SERVICE' | 'PART' });
  const [showNewItemModal, setShowNewItemModal] = useState<{ active: boolean, type: 'SERVICE' | 'PART' }>({ active: false, type: 'SERVICE' });

  // Notification modal state
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({ show: false, type: 'info', title: '', message: '' });

  const showNotification = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setNotification({ show: true, type, title, message });
  };

  const fetchWO = async () => {
    try {
      const [woRes, usersRes, partsRes, settingsRes] = await Promise.all([
        api.get(`/work-orders/${id}`),
        api.get('/users'),
        api.get('/parts'),
        api.get('/settings/tenant')
      ]);
      // Ensure items and history are always arrays
      const woData = woRes.data;
      if (!woData.items) woData.items = [];
      if (!woData.history) woData.history = [];
      setWo(woData);
      setUsers(usersRes.data);
      setParts(partsRes.data);
      setSettings(settingsRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
      showNotification('error', 'Erro', 'Não foi possível carregar a OS. Redirecionando...');
      setTimeout(() => navigate('/work-orders'), 2000);
    }
  };

  useEffect(() => {
    fetchWO();
  }, [id]);

  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [vehicleHistory, setVehicleHistory] = useState<any[]>([]);

  const fetchVehicleHistory = async () => {
    if (!wo?.vehicle_id) return;
    try {
      const res = await api.get(`/work-orders?vehicle_id=${wo.vehicle_id}`);
      // Filter out current OS
      setVehicleHistory(res.data.filter((item: any) => item.id !== wo.id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyFrom = (oldWo: any) => {
    setWo({
      ...wo,
      items: oldWo.items.map((i: any) => ({ ...i, id: undefined })), // Copy items without IDs
      diagnosis: oldWo.diagnosis,
      checklist: oldWo.checklist
    });
    setIsCopyModalOpen(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const newPhoto = {
        url: base64String,
        type: 'ENTRY',
        legend: 'Nova foto'
      };
      setWo({
        ...wo,
        photos: [...(wo.photos || []), newPhoto]
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/work-orders/${id}`, wo);
      showNotification('success', 'Sucesso', 'OS salva com sucesso!');
      fetchWO();
    } catch (err) {
      showNotification('error', 'Erro', 'Não foi possível salvar a OS. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAdd = async (type: 'SERVICE' | 'PART') => {
    if (!itemForm.description && !itemForm.part_id) return;
    
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      description: itemForm.description,
      quantity: itemForm.quantity,
      unit_price: itemForm.unit_price,
      cost_price: 0,
      mechanic_id: itemForm.mechanic_id || null,
      part_id: itemForm.part_id || null,
      status: 'PENDING'
    };

    setWo({ ...wo, items: [...(wo.items || []), newItem] });
    setItemForm({ description: '', quantity: 1, unit_price: 0, mechanic_id: '', part_id: '', type: 'SERVICE' });
  };

  const registerNewItem = async () => {
    try {
      if (showNewItemModal.type === 'PART') {
        const resp = await api.post('/parts', {
          name: itemForm.description,
          sale_price: itemForm.unit_price,
          stock_quantity: 0
        });
        setParts([...parts, resp.data]);
        setItemForm({ ...itemForm, part_id: resp.data.id });
      } else {
        await api.post('/services', {
          name: itemForm.description,
          default_price: itemForm.unit_price
        });
      }
      setShowNewItemModal({ active: false, type: 'SERVICE' });
      showNotification('success', 'Sucesso', 'Item registrado no catálogo!');
    } catch (err) {
      showNotification('error', 'Erro', 'Não foi possível registrar o item.');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const updatedWo = { ...wo, status: newStatus };
      // Add to history
      const historyEntry = {
        timestamp: new Date().toISOString(),
        action: `Status alterado para ${statusMap[newStatus]?.label}`,
        user: 'Sistema'
      };
      updatedWo.history = [...(wo.history || []), historyEntry];
      setWo(updatedWo);
      await api.patch(`/work-orders/${id}`, updatedWo);
      showNotification('success', 'Status Alterado', `Status alterado para ${statusMap[newStatus]?.label}`);
      fetchWO();
    } catch (err) {
      showNotification('error', 'Erro', 'Não foi possível alterar o status. Tente novamente.');
    }
  };

  const handlePayment = async (paymentData: any) => {
    try {
      const updatedWo = { 
        ...wo, 
        payment_data: paymentData,
        status: paymentData.status === 'PAID' ? 'FINISHED' : wo.status
      };
      // Add to history
      const historyEntry = {
        timestamp: new Date().toISOString(),
        action: `Pagamento registrado: ${paymentData.method} - R$ ${paymentData.amount}`,
        user: 'Sistema'
      };
      updatedWo.history = [...(wo.history || []), historyEntry];
      setWo(updatedWo);
      await api.patch(`/work-orders/${id}`, updatedWo);

      // Se não for pago à vista, criar contas a receber
      if (paymentData.status !== 'PAID') {
        const firstDueDate = new Date();
        firstDueDate.setDate(firstDueDate.getDate() + 30); // 30 dias para primeira parcela

        const methodMap: { [key: string]: string } = {
          CASH: 'DINHEIRO',
          DEBIT: 'CARTAO_DEBITO',
          CREDIT: 'CARTAO_CREDITO',
          PIX: 'PIX',
          TRANSFER: 'TRANSFERENCIA'
        };

        await api.post('/accounts-receivable/from-work-order', {
          work_order_id: wo.id,
          client_id: wo.client_id,
          total_amount: paymentData.amount,
          payment_method: methodMap[paymentData.method] || paymentData.method,
          installments: paymentData.installments || 1,
          first_due_date: firstDueDate.toISOString().split('T')[0],
          description: `OS ${wo.number} - ${wo.client_name}`
        });
      }

      setPaymentModalOpen(false);
      showNotification('success', 'Pagamento Registrado', 'Pagamento registrado com sucesso!');
      fetchWO();
    } catch (err) {
      console.error('Error registering payment:', err);
      showNotification('error', 'Erro', 'Não foi possível registrar o pagamento. Tente novamente.');
    }
  };

  const handleSendQuote = async (method: 'whatsapp' | 'email') => {
    try {
      const total = wo.items.reduce((sum: number, i: any) => sum + (i.quantity * i.unit_price), 0) + (wo.taxes || 0) - (wo.discount || 0);
      const message = `📋 *Orçamento ${wo.number}*\n\n` +
        `Cliente: ${wo.client_name}\n` +
        `Veículo: ${wo.brand} ${wo.model} - ${wo.plate}\n\n` +
        `*Total: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*`;
      
      if (method === 'whatsapp') {
        // Open WhatsApp with message
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
      } else {
        // Generate PDF and prepare email
        generatePDF();
        showNotification('info', 'PDF Gerado', 'PDF gerado! Configure seu cliente de email para enviar.');
      }
      
      // Add to history
      const historyEntry = {
        timestamp: new Date().toISOString(),
        action: `Orçamento enviado via ${method}`,
        user: 'Sistema'
      };
      const updatedWo = { ...wo, history: [...(wo.history || []), historyEntry] };
      await api.patch(`/work-orders/${id}`, updatedWo);
      setSendModalOpen(false);
      fetchWO();
    } catch (err) {
      showNotification('error', 'Erro', 'Não foi possível enviar o orçamento. Tente novamente.');
    }
  };

  const addItem = (type: 'SERVICE' | 'PART') => {
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      description: '',
      quantity: 1,
      unit_price: 0,
      cost_price: 0,
      mechanic_id: '',
      warranty_days: type === 'SERVICE' ? 90 : 0,
      sku: '',
      status: 'PENDING'
    };
    setWo({ ...wo, items: [...(wo.items || []), newItem] });
  };

  const removeItem = (itemId: string) => {
    setWo({ ...wo, items: (wo.items || []).filter((i: any) => i.id !== itemId) });
  };

  const updateItem = (itemId: string, field: string, value: any) => {
    setWo({
      ...wo,
      items: (wo.items || []).map((i: any) => i.id === itemId ? { ...i, [field]: value } : i)
    });
  };

  const selectPart = (itemId: string, partId: string) => {
    const selectedPart = parts.find(p => p.id === partId);
    if (selectedPart) {
      setWo({
        ...wo,
        items: (wo.items || []).map((i: any) => 
          i.id === itemId ? {
            ...i,
            part_id: partId,
            description: selectedPart.name,
            unit_price: selectedPart.sale_price || 0,
            cost_price: selectedPart.cost_price || 0,
            sku: selectedPart.sku || ''
          } : i
        )
      });
    }
  };

  const statusMap: any = {
    BUDGET: { label: 'Orçamento', color: 'bg-amber-50 text-amber-600', icon: FileText },
    OPEN: { label: 'Aberto', color: 'bg-blue-50 text-blue-600', icon: Info },
    IN_PROGRESS: { label: 'Em Andamento', color: 'bg-indigo-50 text-indigo-600', icon: Wrench },
    FINISHED: { label: 'Finalizado', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    CANCELLED: { label: 'Cancelado', color: 'bg-red-50 text-red-600', icon: XCircle },
    SCHEDULED: { label: 'Agendado', color: 'bg-purple-50 text-purple-600', icon: Clock },
    INVOICED: { label: 'Faturado', color: 'bg-slate-900 text-white', icon: ShieldCheck },
  };

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'INFORMATION', label: 'Informações', icon: Info },
    { id: 'DIAGNOSIS', label: 'Diagnóstico', icon: Search },
    { id: 'SERVICES', label: 'Serviços', icon: Wrench },
    { id: 'PARTS', label: 'Peças', icon: Package },
    { id: 'PHOTOS', label: 'Fotos', icon: Camera },
    { id: 'HISTORY', label: 'Histórico', icon: History },
  ];

  const generatePDF = () => {
    const doc = new jsPDF() as any;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    
    // --- COLORS ---
    const primaryColor = [30, 41, 59] as [number, number, number]; // Slate-800
    const accentColor = [51, 65, 85] as [number, number, number];  // Slate-700 (replaced indigo)
    const lightGray = [248, 250, 252] as [number, number, number]; // Slate-50
    const borderColor = [226, 232, 240] as [number, number, number]; // Slate-200
    
    // --- HEADER ---
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    let logoLoaded = false;
    if (settings?.logo_url) {
      try {
        const format = settings.logo_url.includes('png') ? 'PNG' : 
                      settings.logo_url.includes('jpg') || settings.logo_url.includes('jpeg') ? 'JPEG' : 'PNG';
        doc.addImage(settings.logo_url, format, margin, 8, 25, 25);
        logoLoaded = true;
      } catch (e) {
        console.error('Error adding logo to PDF:', e);
      }
    }

    doc.setTextColor(...primaryColor);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(settings?.trade_name || settings?.company_name || 'Workshop Name', logoLoaded ? margin + 30 : margin, 18);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const headerCompanySubtext = [
      settings?.cnpj ? `CNPJ: ${settings.cnpj}` : '',
      settings?.address ? settings.address : '',
      settings?.phone ? `Fone: ${settings.phone}` : ''
    ].filter(Boolean).join('  |  ');
    doc.setTextColor(100, 116, 139);
    doc.text(headerCompanySubtext, logoLoaded ? margin + 30 : margin, 24);

    doc.setTextColor(...primaryColor);
    doc.setFontSize(12);
    doc.text(`ORDEM DE SERVIÇO`, pageWidth - margin, 18, { align: 'right' });
    doc.setFontSize(16);
    doc.setTextColor(...primaryColor);
    doc.text(`#${wo.number}`, pageWidth - margin, 28, { align: 'right' });

    // Secondary Header
    doc.setTextColor(...primaryColor);
    doc.setFontSize(8);
    let currentY = 55;
    
    doc.text(`Emissão: ${format(new Date(wo.created_at), 'dd/MM/yyyy HH:mm')}`, margin, currentY);
    const statusLabel = statusMap[wo.status]?.label || wo.status;
    doc.text(`Status: ${statusLabel}`, pageWidth / 2, currentY, { align: 'center' });
    if (wo.delivery_forecast) {
      doc.text(`Previsão: ${format(new Date(wo.delivery_forecast), 'dd/MM/yyyy HH:mm')}`, pageWidth - margin, currentY, { align: 'right' });
    }
    
    currentY += 8;
    doc.setDrawColor(...borderColor);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;

    // --- SECTION HEADER HELPER ---
    const drawSectionHeader = (title: string, y: number) => {
      doc.setFillColor(...lightGray);
      doc.rect(margin, y - 5, pageWidth - (margin * 2), 7, 'F');
      doc.setTextColor(...primaryColor);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin + 2, y);
      return y + 8;
    };

    // --- CLIENT SECTION ---
    currentY = drawSectionHeader('DADOS DO CLIENTE', currentY);
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nome: ${wo.client_name}  |  CPF/CNPJ: ${wo.client_document || 'N/A'}`, margin + 2, currentY);
    currentY += 5;
    doc.text(`Telefone: ${wo.client_phone || 'N/A'}  |  Email: ${wo.client_email || 'N/A'}`, margin + 2, currentY);
    currentY += 10;

    // --- VEHICLE SECTION ---
    currentY = drawSectionHeader('DADOS DO VEÍCULO', currentY);
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Veículo: ${wo.brand} ${wo.model}  |  Placa: ${wo.plate?.toUpperCase() || 'N/A'}`, margin + 2, currentY);
    currentY += 5;
    doc.text(`Ano: ${wo.year || 'N/A'}  |  KM: ${wo.km?.toLocaleString() || 0}  |  Cor: ${wo.color || 'N/A'}  |  Comb: ${wo.fuel_type || 'N/A'}`, margin + 2, currentY);
    currentY += 10;

    // Diagnosis
    currentY = drawSectionHeader('RECLAMAÇÃO E DIAGNÓSTICO', currentY);
    
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Relato/Queixa:', margin + 2, currentY);
    doc.setFont('helvetica', 'normal');
    const complaintText = wo.complaint || 'Nenhuma reclamação informada.';
    const splitComplaint = doc.splitTextToSize(complaintText, pageWidth - (margin * 2) - 4);
    doc.text(splitComplaint, margin + 2, currentY + 5);
    currentY += (splitComplaint.length * 4) + 8;

    doc.setFont('helvetica', 'bold');
    doc.text('Defeito Identificado:', margin + 2, currentY);
    doc.setFont('helvetica', 'normal');
    const defectText = wo.defect || 'Nenhum defeito específico registrado.';
    const splitDefect = doc.splitTextToSize(defectText, pageWidth - (margin * 2) - 4);
    doc.text(splitDefect, margin + 2, currentY + 5);
    currentY += (splitDefect.length * 4) + 12;

    if (wo.technical_report) {
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      currentY = drawSectionHeader('LAUDO TÉCNICO DETALHADO', currentY);
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'normal');
      const reportText = doc.splitTextToSize(wo.technical_report, pageWidth - (margin * 2) - 4);
      doc.text(reportText, margin + 2, currentY);
      currentY += (reportText.length * 4) + 12;
    }

    // Items
    const services = (wo.items || []).filter((i:any) => i.type === 'SERVICE');
    const parts = (wo.items || []).filter((i:any) => i.type === 'PART');

    if (services.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [[{ content: 'SERVIÇOS REALIZADOS', colSpan: 4, styles: { halign: 'center', fillColor: primaryColor } }], ['Cód/Item', 'Descrição Detalhada', 'Técnico', 'Valor']],
        body: services.map((i: any, index: number) => [
          index + 1,
          i.description + (i.long_description ? `\n${i.long_description}` : ''),
          users.find(u => u.id === i.mechanic_id)?.name || '---',
          `R$ ${parseFloat(i.unit_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        ]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [51, 65, 85], fontStyle: 'bold' },
        columnStyles: { 1: { cellWidth: 80 }, 3: { halign: 'right', fontStyle: 'bold' } },
        alternateRowStyles: { fillColor: [252, 252, 252] }
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    if (parts.length > 0) {
      if (currentY > 230) { doc.addPage(); currentY = 20; }
      autoTable(doc, {
        startY: currentY,
        head: [[{ content: 'PEÇAS E MATERIAIS', colSpan: 4, styles: { halign: 'center', fillColor: [51, 65, 85] } }], ['Item/Peça', 'Qtd', 'Unitário', 'Subtotal']],
        body: parts.map((i: any) => [
          i.description, 
          i.quantity, 
          `R$ ${parseFloat(i.unit_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          `R$ ${(i.quantity * i.unit_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        ]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [71, 85, 105], fontStyle: 'bold' },
        columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right', fontStyle: 'bold' } },
        alternateRowStyles: { fillColor: [252, 252, 252] }
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // Totals
    const servicesTotal = services.reduce((sum: number, i: any) => sum + (i.unit_price * i.quantity), 0);
    const partsTotal = parts.reduce((sum: number, i: any) => sum + (i.unit_price * i.quantity), 0);
    const subtotal = servicesTotal + partsTotal;
    const taxes = wo.taxes || 0;
    const discount = wo.discount || 0;
    const total = subtotal + taxes - discount;

    if (currentY > 230) { doc.addPage(); currentY = 20; }

    const totalsWidth = 70;
    const totalsX = pageWidth - margin - totalsWidth;
    doc.setFillColor(...lightGray);
    doc.rect(totalsX, currentY, totalsWidth, 35, 'F');
    doc.setDrawColor(...borderColor);
    doc.rect(totalsX, currentY, totalsWidth, 35, 'S');

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Total Serviços:`, totalsX + 5, currentY + 7);
    doc.setTextColor(30, 41, 59);
    doc.text(`R$ ${servicesTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - margin - 5, currentY + 7, { align: 'right' });
    doc.setTextColor(100, 116, 139);
    doc.text(`Total Peças:`, totalsX + 5, currentY + 12);
    doc.setTextColor(30, 41, 59);
    doc.text(`R$ ${partsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - margin - 5, currentY + 12, { align: 'right' });
    if (discount > 0) {
      doc.setTextColor(220, 38, 38);
      doc.text(`Desconto:`, totalsX + 5, currentY + 17);
      doc.text(`- R$ ${discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - margin - 5, currentY + 17, { align: 'right' });
    }
    doc.line(totalsX + 5, currentY + 22, pageWidth - margin - 5, currentY + 22);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...accentColor);
    doc.text(`TOTAL GERAL:`, totalsX + 5, currentY + 30);
    doc.text(`R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - margin - 5, currentY + 30, { align: 'right' });

    currentY += 45;
    if (currentY > 240) { doc.addPage(); currentY = 20; }

    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text('Termos e Observações:', margin, currentY);
    const terms = settings?.quote_terms || 'Garantia de 90 dias para serviços e peças.';
    doc.text(doc.splitTextToSize(terms, pageWidth - (margin * 2)), margin, currentY + 4);
    
    currentY += 25;
    const sigLine = 60;
    doc.setDrawColor(200);
    doc.line(margin, currentY, margin + sigLine, currentY);
    doc.line(pageWidth - margin - sigLine, currentY, pageWidth - margin, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text('Assinatura da Oficina', margin + (sigLine / 2), currentY + 4, { align: 'center' });
    doc.text('Assinatura do Cliente', pageWidth - margin - (sigLine / 2), currentY + 4, { align: 'center' });

    doc.save(`OS_${wo.number}.pdf`);
  };

  if (loading) return <div className="flex items-center justify-center h-full">Carregando...</div>;
  if (!wo) return <div className="flex items-center justify-center h-full">Ordem de Serviço não encontrada.</div>;

  const CurrentStatus = statusMap[wo.status];

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex flex-col">
      {/* Fixed Header - Compact */}
      <header className="h-12 bg-white border-b border-slate-200 sticky top-0 z-40 flex items-center px-4 justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/work-orders')} className="p-1.5 hover:bg-slate-100 rounded transition-colors">
            <ArrowLeft size={16} className="text-slate-500" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-slate-900">OS #{wo.number}</h1>
            <span className={cn(
              "px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-tight",
              statusMap[wo.status]?.color
            )}>
              {statusMap[wo.status]?.label}
            </span>
            <div className="h-4 w-px bg-slate-200 mx-1" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">{wo.client_name}</span>
              <span className="text-xs font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded font-mono tracking-wider">
                {wo.plate?.toUpperCase() || '---'}
              </span>
              <span className="text-xs text-slate-500">{wo.brand} {wo.model} • {wo.km} KM</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={generatePDF} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-all" title="PDF">
            <Printer size={16} />
          </button>
          <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-all" title="Enviar">
            <Send size={16} />
          </button>
          <div className="h-4 w-px bg-slate-200 mx-1" />
          <button onClick={handleSave} disabled={saving} className="h-8 px-3 bg-slate-900 text-white rounded font-bold text-xs hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-2">
            <Save size={14} /> {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-slate-200 px-6 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0 mt-[25px]">
        {[
          { id: 'INFORMATION', label: 'Informações', icon: Info },
          { id: 'DIAGNOSIS', label: 'Diagnóstico', icon: Search },
          { id: 'SERVICES', label: 'Serviços', icon: Wrench },
          { id: 'PARTS', label: 'Peças', icon: Package },
          { id: 'PHOTOS', label: 'Fotos', icon: Camera },
          { id: 'HISTORY', label: 'Histórico', icon: History }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all relative",
              activeTab === tab.id ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <tab.icon size={14} />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
            )}
          </button>
        ))}
      </div>

      {/* Main Content - 2 Columns: Left (tabs) + Right (Financial Summary) */}
      <main className="flex-1 overflow-hidden flex">
        {/* Left Column - Tabs Content */}
        <div className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
            {/* Tab: INFORMATION */}
            {activeTab === 'INFORMATION' && (
              <div className="max-w-4xl space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Informações da OS</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Cliente</label>
                      <p className="text-sm font-semibold text-slate-900">{wo.client_name}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Técnico / Responsável</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                        value={wo.responsible_id || ''}
                        onChange={e => setWo({...wo, responsible_id: e.target.value})}
                      >
                        <option value="">Selecione...</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Data Inicial</label>
                      <input 
                        type="datetime-local"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                        value={wo.start_date ? wo.start_date.substring(0, 16) : ''}
                        onChange={e => setWo({...wo, start_date: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Data Final (Entrega/Fim)</label>
                      <input 
                        type="datetime-local"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                        value={wo.finish_date ? wo.finish_date.substring(0, 16) : ''}
                        onChange={e => setWo({...wo, finish_date: e.target.value})}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Garantia / Termos</label>
                      <textarea 
                        rows={2}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                        placeholder="Ex: 90 dias para serviços..."
                        value={wo.guarantee || ''}
                        onChange={e => setWo({...wo, guarantee: e.target.value})}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Status da OS</label>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(statusMap).map(([key, value]: any) => (
                          <button
                            key={key}
                            onClick={() => setWo({...wo, status: key})}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-2",
                              wo.status === key ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            )}
                          >
                            <value.icon size={14} />
                            {value.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: DIAGNOSIS */}
            {activeTab === 'DIAGNOSIS' && (
              <div className="max-w-4xl space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <FileText size={16} /> Queixa & Observações
                    </h2>
                    <button 
                      onClick={() => { fetchVehicleHistory(); setIsCopyModalOpen(true); }}
                      className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <ClipboardList size={14} /> Copiar de OS Anterior
                    </button>
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Reclamação (Relato do Cliente)</label>
                      <textarea 
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                        placeholder="O que o cliente relatou..."
                        value={wo.complaint || ''}
                        onChange={e => setWo({...wo, complaint: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Defeito Identificado</label>
                      <textarea 
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                        placeholder="O defeito técnico encontrado..."
                        value={wo.defect || ''}
                        onChange={e => setWo({...wo, defect: e.target.value})}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Notas Internas</label>
                      <textarea 
                        rows={2}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                        placeholder="Observações internas..."
                        value={wo.internal_notes || ''}
                        onChange={e => setWo({...wo, internal_notes: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <Search size={16} /> Diagnóstico & Laudo
                    </h2>
                  </div>
                  <div className="p-6 space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Laudo Técnico</label>
                      <textarea 
                        rows={4}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                        placeholder="Descrição técnica detalhada, causa e solução..."
                        value={wo.technical_report || ''}
                        onChange={e => setWo({...wo, technical_report: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Sintomas Observados</label>
                        <textarea 
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                          placeholder="Descreva os sintomas observados..."
                          value={wo.symptoms?.observed || ''}
                          onChange={e => setWo({...wo, symptoms: { ...wo.symptoms, observed: e.target.value }})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Diagnóstico Anterior</label>
                        <textarea 
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                          placeholder="Qual a provável causa do problema..."
                          value={wo.diagnosis || ''}
                          onChange={e => setWo({...wo, diagnosis: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: SERVICES */}
            {activeTab === 'SERVICES' && (
              <div className="max-w-6xl space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Adicionar Serviço</h3>
                  <div className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-12 md:col-span-5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Digite o nome do serviço</label>
                      <input 
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                        placeholder="Ex: Mão de obra troca de óleo..."
                        value={itemForm.type === 'SERVICE' ? itemForm.description : ''}
                        onChange={e => setItemForm({ ...itemForm, type: 'SERVICE', description: e.target.value })}
                      />
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Preço</label>
                      <input 
                        type="number"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                        value={itemForm.type === 'SERVICE' ? itemForm.unit_price : 0}
                        onChange={e => setItemForm({ ...itemForm, type: 'SERVICE', unit_price: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Quantidade</label>
                      <input 
                        type="number"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                        value={itemForm.type === 'SERVICE' ? itemForm.quantity : 1}
                        onChange={e => setItemForm({ ...itemForm, type: 'SERVICE', quantity: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-3 flex gap-2">
                      <button 
                        onClick={() => handleQuickAdd('SERVICE')}
                        className="flex-1 h-10 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus size={16} /> Adicionar
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <Wrench size={16} /> Serviços Adicionados
                    </h2>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase">Serviço</th>
                        <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase text-center">Quantidade</th>
                        <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase text-right">Preço</th>
                        <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase text-right">Sub-total</th>
                        <th className="px-6 py-3 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {wo.items.filter((i: any) => i.type === 'SERVICE').map((item: any) => (
                        <tr key={item.id} className="group hover:bg-slate-50">
                          <td className="px-6 py-4 text-sm font-bold text-slate-900 uppercase">{item.description}</td>
                          <td className="px-6 py-4 text-center text-sm font-medium text-slate-600">{item.quantity}</td>
                          <td className="px-6 py-4 text-right text-sm font-medium text-slate-600">
                            R$ {item.unit_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-bold text-slate-900">
                            R$ {(item.quantity * item.unit_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => removeItem(item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50/30">
                        <td colSpan={3} className="px-6 py-4 text-right text-sm font-bold text-slate-400">Total Serviços:</td>
                        <td className="px-6 py-4 text-right text-lg font-black text-slate-900">
                          R$ {wo.items.filter((i:any) => i.type === 'SERVICE').reduce((sum:number, i:any) => sum + (i.quantity * i.unit_price), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab: PARTS */}
            {activeTab === 'PARTS' && (
              <div className="max-w-6xl space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Adicionar Produto / Peça</h3>
                  <div className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-12 md:col-span-5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Digite o nome do produto</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                        value={itemForm.part_id || ''}
                        onChange={e => {
                          const p = parts.find(p => p.id === e.target.value);
                          setItemForm({ 
                            ...itemForm, 
                            type: 'PART', 
                            part_id: e.target.value, 
                            description: p?.name || '', 
                            unit_price: p?.sale_price || 0 
                          });
                        }}
                      >
                        <option value="">Selecione um produto...</option>
                        {parts.map(p => <option key={p.id} value={p.id}>{p.name} (R$ {p.sale_price})</option>)}
                      </select>
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Preço</label>
                      <input 
                        type="number"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold"
                        value={itemForm.type === 'PART' ? itemForm.unit_price : 0}
                        onChange={e => setItemForm({ ...itemForm, type: 'PART', unit_price: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Quantidade</label>
                      <input 
                        type="number"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold"
                        value={itemForm.type === 'PART' ? itemForm.quantity : 1}
                        onChange={e => setItemForm({ ...itemForm, type: 'PART', quantity: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-3 flex gap-2">
                      <button 
                        onClick={() => handleQuickAdd('PART')}
                        className="flex-1 h-10 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus size={16} /> Adicionar
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Caso o produto não esteja na lista:</p>
                    <button 
                      onClick={() => setShowNewItemModal({ active: true, type: 'PART' })}
                      className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      <Plus size={12} /> CADASTRAR NOVO PRODUTO NO ESTOQUE
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <Package size={16} /> Produtos / Peças Adicionadas
                    </h2>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase">Produto</th>
                        <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase text-center">Quantidade</th>
                        <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase text-right">Preço unit.</th>
                        <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase text-right">Sub-total</th>
                        <th className="px-6 py-3 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {wo.items.filter((i: any) => i.type === 'PART').map((item: any) => (
                        <tr key={item.id} className="group hover:bg-slate-50">
                          <td className="px-6 py-4 text-sm font-bold text-slate-900 uppercase">{item.description}</td>
                          <td className="px-6 py-4 text-center text-sm font-medium text-slate-600">{item.quantity}</td>
                          <td className="px-6 py-4 text-right text-sm font-medium text-slate-600">
                            R$ {item.unit_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-bold text-slate-900">
                            R$ {(item.quantity * item.unit_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => removeItem(item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50/30">
                        <td colSpan={3} className="px-6 py-4 text-right text-sm font-bold text-slate-400">Total Produtos:</td>
                        <td className="px-6 py-4 text-right text-lg font-black text-slate-900">
                          R$ {wo.items.filter((i:any) => i.type === 'PART').reduce((sum:number, i:any) => sum + (i.quantity * i.unit_price), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab: PHOTOS */}
            {activeTab === 'PHOTOS' && (
              <div className="max-w-4xl">
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-900">Fotos</h3>
                    <label className="h-9 px-4 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm cursor-pointer">
                      <Camera size={16} /> Adicionar Foto
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {wo.photos && wo.photos.length > 0 ? (
                      wo.photos.map((photo: any, idx: number) => (
                        <div key={idx} className="relative group">
                          <img src={photo.url} alt={photo.legend} className="w-full h-48 object-cover rounded-lg" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <button className="p-2 bg-white rounded-full text-red-500 hover:bg-red-50">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 py-12 text-center">
                        <Camera size={48} className="text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-medium">Nenhuma foto adicionada</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: HISTORY */}
            {activeTab === 'HISTORY' && (
              <div className="max-w-4xl">
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <History size={20} />
                    Linha do Tempo
                  </h3>
                  <div className="space-y-4">
                    {/* OS Created */}
                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Plus size={20} className="text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">OS Criada</p>
                        <p className="text-xs text-slate-500">{format(parseISO(wo.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                      </div>
                    </div>
                    {/* History entries */}
                    {wo.history && wo.history.length > 0 && wo.history.map((entry: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle size={20} className="text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-900">{entry.action}</p>
                          <p className="text-xs text-slate-500">{format(parseISO(entry.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Right Column - Financial Summary (Fixed) */}
      <aside className="w-96 border-l border-slate-200 bg-white overflow-auto p-6 flex-shrink-0">
        <div className="sticky top-0 space-y-6">
          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-700 rounded-2xl p-6 text-white">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 opacity-80">Ações Rápidas</h3>
            <div className="space-y-2">
              {wo.status === 'OPEN' && (
                <button 
                  onClick={() => handleStatusChange('DIAGNOSIS')}
                  className="w-full h-10 bg-white/10 hover:bg-white/20 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Search size={16} /> Iniciar Diagnóstico
                </button>
              )}
              {wo.status === 'DIAGNOSIS' && (
                <button 
                  onClick={() => handleStatusChange('WAITING_APPROVAL')}
                  className="w-full h-10 bg-white/10 hover:bg-white/20 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <FileText size={16} /> Enviar Orçamento
                </button>
              )}
              {wo.status === 'WAITING_APPROVAL' && (
                <button 
                  onClick={() => handleStatusChange('APPROVED')}
                  className="w-full h-10 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} /> Aprovar Orçamento
                </button>
              )}
              
              <button 
                onClick={generatePDF}
                className="w-full h-10 bg-white/10 hover:bg-white/20 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 border border-white/10"
              >
                <Printer size={16} /> Baixar Orçamento (PDF)
              </button>

              <button 
                onClick={() => handleSendQuote('whatsapp')}
                className="w-full h-10 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 border border-emerald-600/30"
              >
                <Send size={16} /> Enviar via WhatsApp
              </button>
              {wo.status === 'APPROVED' && (
                <button 
                  onClick={() => handleStatusChange('EXECUTING')}
                  className="w-full h-10 bg-indigo-500 hover:bg-indigo-600 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Wrench size={16} /> Iniciar Execução
                </button>
              )}
              {wo.status === 'EXECUTING' && (
                <button 
                  onClick={() => handleStatusChange('FINISHED')}
                  className="w-full h-10 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} /> Finalizar Serviço
                </button>
              )}
              {(wo.status === 'FINISHED' || wo.status === 'APPROVED') && (
                <button 
                  onClick={() => setPaymentModalOpen(true)}
                  className="w-full h-10 bg-yellow-500 hover:bg-yellow-600 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard size={16} /> Registrar Pagamento
                </button>
              )}
              <button 
                onClick={() => setSendModalOpen(true)}
                className="w-full h-10 bg-white/10 hover:bg-white/20 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <Send size={16} /> Enviar Orçamento
              </button>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Resumo Financeiro</h3>
            </div>
            <div className="p-4 space-y-3">
              {/* Services */}
              <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-2">
                  <Wrench size={14} className="text-slate-400" />
                  <span className="text-sm text-slate-600">Serviços</span>
                  <span className="text-xs font-bold text-slate-400">
                    ({wo.items.filter((i: any) => i.type === 'SERVICE').length})
                  </span>
                </div>
                <span className="text-sm font-bold text-slate-900">
                  R$ {wo.items.filter((i: any) => i.type === 'SERVICE').reduce((sum: number, i: any) => sum + (i.quantity * i.unit_price), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Parts */}
              <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-slate-400" />
                  <span className="text-sm text-slate-600">Peças</span>
                  <span className="text-xs font-bold text-slate-400">
                    ({wo.items.filter((i: any) => i.type === 'PART').length})
                  </span>
                </div>
                <span className="text-sm font-bold text-slate-900">
                  R$ {wo.items.filter((i: any) => i.type === 'PART').reduce((sum: number, i: any) => sum + (i.quantity * i.unit_price), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="h-px bg-slate-200 my-2" />

              {/* Taxes */}
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-600">Impostos</span>
                <input 
                  type="number" 
                  className="w-28 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-right font-bold text-sm focus:ring-2 focus:ring-slate-900"
                  value={wo.taxes || 0}
                  onChange={e => setWo({...wo, taxes: parseFloat(e.target.value) || 0})}
                />
              </div>

              {/* Discount */}
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-600">Desconto</span>
                <input 
                  type="number" 
                  className="w-28 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-right font-bold text-sm focus:ring-2 focus:ring-slate-900"
                  value={wo.discount || 0}
                  onChange={e => setWo({...wo, discount: parseFloat(e.target.value) || 0})}
                />
              </div>

              <div className="h-px bg-slate-200 my-2" />

              {/* Total */}
              <div className="flex justify-between items-center py-4 bg-emerald-50 -mx-4 px-4 rounded-b-2xl">
                <span className="text-base font-bold text-slate-900">Total Geral</span>
                <span className="text-2xl font-black text-emerald-600">
                  R$ {(wo.items.reduce((sum: number, i: any) => sum + (i.quantity * i.unit_price), 0) + (wo.taxes || 0) - (wo.discount || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Payment Status */}
              <div className="pt-3 border-t border-slate-200 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase">Status Pagamento</span>
                  <span className={cn(
                    "px-2 py-1 rounded text-xs font-bold",
                    wo.payment_data?.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                    wo.payment_data?.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-slate-100 text-slate-700'
                  )}>
                    {wo.payment_data?.status === 'PAID' ? 'Pago' : 
                     wo.payment_data?.status === 'PARTIAL' ? 'Parcial' : 
                     'Pendente'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts & Warnings */}
          <div className="space-y-2">
            {wo.items.some((i: any) => i.type === 'PART' && i.stock < i.quantity) && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-900">Estoque Insuficiente</p>
                  <p className="text-xs text-amber-700">Algumas peças estão com estoque baixo</p>
                </div>
              </div>
            )}
            {wo.estimated_delivery && new Date(wo.estimated_delivery) < new Date() && wo.status !== 'DELIVERED' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <Clock size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-red-900">Prazo Vencido</p>
                  <p className="text-xs text-red-700">A previsão de entrega passou</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </main>

      {/* Fixed Footer - Compact */}
      <footer className="h-12 bg-white border-t border-slate-200 fixed bottom-0 left-0 right-0 z-40 flex items-center px-4 justify-between shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { setWo({...wo, status: 'CANCELLED'}); handleSave(); }}
            className="h-8 px-3 text-red-600 font-bold text-xs hover:bg-red-50 rounded transition-all"
          >
            Cancelar OS
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/work-orders')} className="h-8 px-3 text-slate-600 font-bold text-xs hover:bg-slate-100 rounded transition-all">
            Voltar
          </button>
          <button onClick={handleSave} className="h-8 px-4 bg-slate-900 text-white rounded font-bold text-xs hover:bg-slate-800 transition-all">
            Salvar OS
          </button>
        </div>
      </footer>

      {/* Payment Modal */}
      <AnimatePresence>
        {paymentModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-500 to-emerald-600">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Registrar Pagamento</h2>
                    <p className="text-xs text-emerald-100">OS #{wo.number}</p>
                  </div>
                </div>
                <button onClick={() => setPaymentModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                handlePayment({
                  method: formData.get('method'),
                  amount: parseFloat(formData.get('amount') as string),
                  status: formData.get('status'),
                  installments: parseInt(formData.get('installments') as string) || 1,
                  notes: formData.get('notes')
                });
              }} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Valor Total</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                    <input 
                      type="number"
                      name="amount"
                      step="0.01"
                      required
                      defaultValue={(wo.items.reduce((sum: number, i: any) => sum + (i.quantity * i.unit_price), 0) + (wo.taxes || 0) - (wo.discount || 0)).toFixed(2)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-2xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Forma de Pagamento</label>
                    <select 
                      name="method"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Selecione...</option>
                      <option value="CASH">💵 Dinheiro</option>
                      <option value="DEBIT">💳 Débito</option>
                      <option value="CREDIT">💳 Crédito</option>
                      <option value="PIX">📱 PIX</option>
                      <option value="TRANSFER">🏦 Transferência</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Status</label>
                    <select 
                      name="status"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="PENDING">Pendente</option>
                      <option value="PARTIAL">Parcial</option>
                      <option value="PAID">Pago</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Parcelas</label>
                  <input 
                    type="number"
                    name="installments"
                    min="1"
                    max="12"
                    defaultValue="1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Observações</label>
                  <textarea 
                    name="notes"
                    rows={3}
                    placeholder="Notas adicionais sobre o pagamento..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setPaymentModalOpen(false)}
                    className="flex-1 h-11 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 h-11 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold text-sm hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/30"
                  >
                    Confirmar Pagamento
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Send Quote Modal */}
      <AnimatePresence>
        {sendModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-500 to-blue-600">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center">
                    <Send size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Enviar Orçamento</h2>
                    <p className="text-xs text-blue-100">Escolha como enviar</p>
                  </div>
                </div>
                <button onClick={() => setSendModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-3">
                <button 
                  onClick={() => handleSendQuote('whatsapp')}
                  className="w-full h-14 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold text-base hover:from-green-600 hover:to-green-700 transition-all shadow-lg shadow-green-500/30 flex items-center justify-center gap-3"
                >
                  <Send size={20} />
                  Enviar via WhatsApp
                </button>
                <button 
                  onClick={() => handleSendQuote('email')}
                  className="w-full h-14 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold text-base hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-3"
                >
                  <FileText size={20} />
                  Gerar PDF e Email
                </button>
                <button 
                  onClick={() => setSendModalOpen(false)}
                  className="w-full h-11 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Copy OS Modal */}
      <AnimatePresence>
        {isCopyModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
                    <ClipboardList size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Copiar de OS Anterior</h2>
                    <p className="text-xs text-slate-500">Selecione uma OS para copiar itens e diagnóstico</p>
                  </div>
                </div>
                <button onClick={() => setIsCopyModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto no-scrollbar space-y-4">
                {vehicleHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <History size={48} className="text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Nenhuma OS anterior encontrada para este veículo.</p>
                  </div>
                ) : (
                  vehicleHistory.map((oldWo) => (
                    <button
                      key={oldWo.id}
                      onClick={() => handleCopyFrom(oldWo)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all text-left group"
                    >
                      <div className="text-center min-w-[80px]">
                        <p className="text-xs font-black text-slate-400 uppercase">{format(parseISO(oldWo.created_at), 'dd/MM/yy')}</p>
                        <p className="text-sm font-bold text-slate-900">#{oldWo.number}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{oldWo.complaint}</p>
                        <p className="text-xs text-slate-500 truncate">{oldWo.items?.length || 0} itens • R$ {oldWo.total_amount?.toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 group-hover:border-emerald-200 group-hover:text-emerald-600 transition-colors">
                        Copiar
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Cadastro Rápido de Item */}
      <AnimatePresence>
        {showNewItemModal.active && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Cadastrar Novo {showNewItemModal.type === 'PART' ? 'Produto' : 'Serviço'}</h3>
                <button onClick={() => setShowNewItemModal({ ...showNewItemModal, active: false })} className="text-slate-400 hover:text-slate-900">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nome / Descrição</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-black uppercase italic"
                    value={itemForm.description}
                    onChange={e => setItemForm({ ...itemForm, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Valor de Venda Sugerido</label>
                  <input 
                    type="number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold"
                    value={itemForm.unit_price}
                    onChange={e => setItemForm({ ...itemForm, unit_price: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 flex justify-end gap-2">
                <button 
                  onClick={() => setShowNewItemModal({ ...showNewItemModal, active: false })}
                  className="px-4 py-2 text-slate-500 font-bold text-sm"
                >
                  Cancelar
                </button>
                <button 
                  onClick={registerNewItem}
                  className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all"
                >
                  Confirmar Cadastro
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notification Modal */}
      <AnimatePresence>
        {notification.show && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setNotification({ ...notification, show: false })}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className={cn(
                "px-6 py-4 flex items-center gap-4",
                notification.type === 'success' && "bg-emerald-50",
                notification.type === 'error' && "bg-red-50",
                notification.type === 'info' && "bg-blue-50"
              )}>
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                  notification.type === 'success' && "bg-emerald-100",
                  notification.type === 'error' && "bg-red-100",
                  notification.type === 'info' && "bg-blue-100"
                )}>
                  {notification.type === 'success' && <CheckCircle className="text-emerald-600" size={24} />}
                  {notification.type === 'error' && <AlertTriangle className="text-red-600" size={24} />}
                  {notification.type === 'info' && <Info className="text-blue-600" size={24} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    "font-bold text-base",
                    notification.type === 'success' && "text-emerald-900",
                    notification.type === 'error' && "text-red-900",
                    notification.type === 'info' && "text-blue-900"
                  )}>{notification.title}</h3>
                  <p className="text-sm text-slate-600 mt-0.5">{notification.message}</p>
                </div>
                <button 
                  onClick={() => setNotification({ ...notification, show: false })}
                  className="text-slate-400 hover:text-slate-900 transition-colors shrink-0"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="px-6 py-4 bg-slate-50 flex justify-end">
                <button 
                  onClick={() => setNotification({ ...notification, show: false })}
                  className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
