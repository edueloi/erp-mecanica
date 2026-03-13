import * as XLSX from 'xlsx';
import XLSXStyle from 'xlsx-js-style';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export data to Excel file
 */
export const exportToExcel = (data: any[], filename: string, sheetName: string = 'Sheet1') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Auto-size columns
  const maxWidth = 50;
  const columns = Object.keys(data[0] || {});
  const colWidths = columns.map(col => {
    const maxLength = Math.max(
      col.length,
      ...data.map(row => String(row[col] || '').length)
    );
    return { wch: Math.min(maxLength + 2, maxWidth) };
  });
  worksheet['!cols'] = colWidths;
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativo', INACTIVE: 'Inativo', BLOCKED: 'Bloqueado',
  TRIAL: 'Teste', OVERDUE: 'Atrasado', PENDING_PAYMENT: 'Pendente',
  PF: 'Pessoa Física', PJ: 'Pessoa Jurídica',
};

/**
 * Export data to PDF file — landscape, with company header
 */
export const exportToPDF = (
  data: any[],
  columns: { header: string; dataKey: string }[],
  filename: string,
  title: string,
  options?: { tenantName?: string; tenantLogo?: string }
) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;
  const margin = 14;

  // ── Header band ──────────────────────────────────────────────
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageW, 22, 'F');

  let logoEndX = margin;

  // Logo (base64 or URL — only base64 works in jsPDF)
  if (options?.tenantLogo && options.tenantLogo.startsWith('data:image')) {
    try {
      const ext = options.tenantLogo.includes('png') ? 'PNG' : 'JPEG';
      doc.addImage(options.tenantLogo, ext, margin, 3, 16, 16);
      logoEndX = margin + 20;
    } catch {}
  }

  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(options?.tenantName || 'MecaERP', logoEndX, 13);

  // Report title (right side)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(title, pageW - margin, 10, { align: 'right' });
  doc.setFontSize(8);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageW - margin, 17, { align: 'right' });

  // ── Table ─────────────────────────────────────────────────────
  const translateCell = (value: any) =>
    value !== null && value !== undefined
      ? (STATUS_LABELS[String(value)] ?? String(value))
      : '';

  autoTable(doc, {
    startY: 28,
    head: [columns.map(col => col.header)],
    body: data.map(row => columns.map(col => translateCell(row[col.dataKey]))),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    margin: { left: margin, right: margin },
    didDrawPage: (hookData: any) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(100);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Página ${hookData.pageNumber} de ${pageCount}  •  ${options?.tenantName || 'MecaERP'}`,
        pageW / 2,
        pageH - 6,
        { align: 'center' }
      );
    }
  });

  doc.save(`${filename}.pdf`);
};

/**
 * Export data to CSV file
 */
export const exportToCSV = (data: any[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Download template file for import — styled with system colors
 */
export const downloadTemplate = (
  templateData: any[],
  filename: string,
  format: 'excel' | 'csv' = 'excel'
) => {
  if (format === 'csv') {
    exportToCSV(templateData, `${filename}_modelo`);
    return;
  }

  const headers = Object.keys(templateData[0] || {});
  const wsData = [
    headers,
    ...templateData.map(row => headers.map(h => row[h] ?? ''))
  ];

  const ws: any = XLSXStyle.utils.aoa_to_sheet(wsData);

  // Style header row — slate-900 background, white bold text
  headers.forEach((_, colIdx) => {
    const addr = XLSXStyle.utils.encode_cell({ r: 0, c: colIdx });
    ws[addr].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11, name: 'Calibri' },
      fill: { patternType: 'solid', fgColor: { rgb: '0F172A' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
      border: {
        top:    { style: 'thin', color: { rgb: '334155' } },
        bottom: { style: 'thin', color: { rgb: '334155' } },
        left:   { style: 'thin', color: { rgb: '334155' } },
        right:  { style: 'thin', color: { rgb: '334155' } },
      }
    };
  });

  // Style example data rows — alternating light background
  templateData.forEach((row, rowIdx) => {
    headers.forEach((_, colIdx) => {
      const addr = XLSXStyle.utils.encode_cell({ r: rowIdx + 1, c: colIdx });
      if (!ws[addr]) ws[addr] = { t: 's', v: '' };
      ws[addr].s = {
        font: { sz: 10, color: { rgb: '334155' }, name: 'Calibri' },
        fill: { patternType: 'solid', fgColor: { rgb: rowIdx % 2 === 0 ? 'F1F5F9' : 'FFFFFF' } },
        border: {
          top:    { style: 'thin', color: { rgb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
          left:   { style: 'thin', color: { rgb: 'E2E8F0' } },
          right:  { style: 'thin', color: { rgb: 'E2E8F0' } },
        }
      };
    });
  });

  // Column widths
  ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 6, 18) }));

  // Row height for header
  ws['!rows'] = [{ hpx: 30 }];

  // AutoFilter (dropdown arrows on each column header)
  const lastCol = XLSXStyle.utils.encode_col(headers.length - 1);
  const lastRow = templateData.length + 1;
  ws['!autofilter'] = { ref: `A1:${lastCol}${lastRow}` };

  const wb = XLSXStyle.utils.book_new();
  XLSXStyle.utils.book_append_sheet(wb, ws, 'Modelo');
  XLSXStyle.writeFile(wb, `${filename}_modelo.xlsx`);
};

/**
 * Parse imported file (Excel, CSV, JSON)
 */
export const parseImportFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        
        if (file.name.endsWith('.json')) {
          // Parse JSON
          const jsonData = JSON.parse(content as string);
          resolve(Array.isArray(jsonData) ? jsonData : [jsonData]);
        } else if (file.name.endsWith('.csv')) {
          // Parse CSV
          const workbook = XLSX.read(content, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet);
          resolve(data);
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          // Parse Excel
          const workbook = XLSX.read(content, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet);
          resolve(data);
        } else if (file.name.endsWith('.xml')) {
          // Parse XML (basic implementation)
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(content as string, 'text/xml');
          // This is a simple implementation - you may need to customize based on your XML structure
          const items = xmlDoc.getElementsByTagName('item');
          const data = Array.from(items).map(item => {
            const obj: any = {};
            Array.from(item.children).forEach(child => {
              obj[child.tagName] = child.textContent;
            });
            return obj;
          });
          resolve(data);
        } else {
          reject(new Error('Formato de arquivo não suportado'));
        }
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    
    if (file.name.endsWith('.json') || file.name.endsWith('.xml')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  });
};
