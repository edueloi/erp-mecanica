import * as XLSX from 'xlsx';
import XLSXStyle from 'xlsx-js-style';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativo', INACTIVE: 'Inativo', BLOCKED: 'Bloqueado',
  TRIAL: 'Teste', OVERDUE: 'Atrasado', PENDING_PAYMENT: 'Pendente',
  PF: 'Pessoa Física', PJ: 'Pessoa Jurídica',
  MOTOR: 'Motor', FREIO: 'Freio', SUSPENSAO: 'Suspensão',
  ELETRICA: 'Elétrica', REVISAO: 'Revisão', OUTROS: 'Outros',
  LABOR: 'Mão de Obra', WITH_PART: 'Com Peça', COMPOSITE: 'Composto',
  FIXED: 'Fixo', HOURLY: 'Por Hora',
  FLEX: 'Flex', GASOLINE: 'Gasolina', DIESEL: 'Diesel',
  ELECTRIC: 'Elétrico', HYBRID: 'Híbrido',
};

const translateValue = (value: any): string => {
  if (value === null || value === undefined) return '';
  const str = String(value).trim();
  return STATUS_LABELS[str] ?? str;
};

/**
 * Export data to styled Excel file using xlsx-js-style.
 * Only exports the columns specified — no internal IDs exposed to the user.
 */
export const exportToExcel = (
  data: any[],
  filename: string,
  sheetName: string = 'Dados',
  columns?: { header: string; dataKey: string }[]
) => {
  if (!data || data.length === 0) return;

  // Excel sheet names cannot exceed 31 characters
  sheetName = sheetName.slice(0, 31);

  // If columns provided, use them to map/filter; otherwise fall back to all keys (excluding id/uuid fields)
  const cols = columns && columns.length > 0
    ? columns
    : Object.keys(data[0])
        .filter(k => !/^(id|uuid|tenant_id|created_at|updated_at|deleted_at)$/i.test(k))
        .map(k => ({ header: k, dataKey: k }));

  const headers = cols.map(c => c.header);
  const rows = data.map(row =>
    cols.map(c => translateValue(row[c.dataKey]))
  );

  const wsData = [headers, ...rows];
  const ws: any = XLSXStyle.utils.aoa_to_sheet(wsData);

  // ── Header row styling ────────────────────────────────────────
  headers.forEach((_, colIdx) => {
    const addr = XLSXStyle.utils.encode_cell({ r: 0, c: colIdx });
    ws[addr].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11, name: 'Calibri' },
      fill: { patternType: 'solid', fgColor: { rgb: '0F172A' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top:    { style: 'thin', color: { rgb: '334155' } },
        bottom: { style: 'thin', color: { rgb: '334155' } },
        left:   { style: 'thin', color: { rgb: '334155' } },
        right:  { style: 'thin', color: { rgb: '334155' } },
      },
    };
  });

  // ── Data rows styling (zebra) ─────────────────────────────────
  rows.forEach((_, rowIdx) => {
    const isEven = rowIdx % 2 === 0;
    headers.forEach((_, colIdx) => {
      const addr = XLSXStyle.utils.encode_cell({ r: rowIdx + 1, c: colIdx });
      if (!ws[addr]) ws[addr] = { t: 's', v: '' };
      ws[addr].s = {
        font: { sz: 10, color: { rgb: '1E293B' }, name: 'Calibri' },
        fill: { patternType: 'solid', fgColor: { rgb: isEven ? 'F8FAFC' : 'FFFFFF' } },
        alignment: { vertical: 'center' },
        border: {
          top:    { style: 'thin', color: { rgb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
          left:   { style: 'thin', color: { rgb: 'E2E8F0' } },
          right:  { style: 'thin', color: { rgb: 'E2E8F0' } },
        },
      };
    });
  });

  // ── Column widths ─────────────────────────────────────────────
  ws['!cols'] = headers.map((h, colIdx) => {
    const maxDataLen = Math.max(
      h.length,
      ...rows.map(r => String(r[colIdx] || '').length)
    );
    return { wch: Math.min(maxDataLen + 4, 50) };
  });

  // ── Row heights ───────────────────────────────────────────────
  ws['!rows'] = [{ hpx: 28 }, ...rows.map(() => ({ hpx: 20 }))];

  // ── AutoFilter (dropdown arrows on header) ────────────────────
  const lastCol = XLSXStyle.utils.encode_col(headers.length - 1);
  ws['!autofilter'] = { ref: `A1:${lastCol}${rows.length + 1}` };

  // ── Freeze top row ────────────────────────────────────────────
  ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activeCell: 'A2', sqref: 'A2' };

  const wb = XLSXStyle.utils.book_new();
  XLSXStyle.utils.book_append_sheet(wb, ws, sheetName);
  XLSXStyle.writeFile(wb, `${filename}.xlsx`);
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
  doc.setFillColor(255, 255, 255); // white background
  doc.rect(0, 0, pageW, 22, 'F');
  // Bottom border line
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.3);
  doc.line(0, 22, pageW, 22);

  let logoEndX = margin;

  if (options?.tenantLogo && options.tenantLogo.startsWith('data:image')) {
    try {
      const ext = options.tenantLogo.includes('png') ? 'PNG' : 'JPEG';
      doc.addImage(options.tenantLogo, ext, margin, 3, 16, 16);
      logoEndX = margin + 20;
    } catch {}
  }

  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(options?.tenantName || 'MecaERP', logoEndX, 13);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(title, pageW - margin, 10, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageW - margin, 17, { align: 'right' });

  // ── Table ─────────────────────────────────────────────────────
  autoTable(doc, {
    startY: 28,
    head: [columns.map(col => col.header)],
    body: data.map(row => columns.map(col => translateValue(row[col.dataKey]))),
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
 * Export data to CSV — filters by columns if provided
 */
export const exportToCSV = (
  data: any[],
  filename: string,
  columns?: { header: string; dataKey: string }[]
) => {
  let csvContent: string;

  if (columns && columns.length > 0) {
    const headers = columns.map(c => `"${c.header}"`).join(',');
    const rows = data.map(row =>
      columns.map(c => `"${translateValue(row[c.dataKey]).replace(/"/g, '""')}"`).join(',')
    );
    csvContent = [headers, ...rows].join('\r\n');
  } else {
    const ws = XLSX.utils.json_to_sheet(data);
    csvContent = XLSX.utils.sheet_to_csv(ws);
  }

  const bom = '\uFEFF'; // UTF-8 BOM for Excel to open correctly
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
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

  ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 6, 18) }));
  ws['!rows'] = [{ hpx: 30 }];

  const lastCol = XLSXStyle.utils.encode_col(headers.length - 1);
  const lastRow = templateData.length + 1;
  ws['!autofilter'] = { ref: `A1:${lastCol}${lastRow}` };

  const wb = XLSXStyle.utils.book_new();
  XLSXStyle.utils.book_append_sheet(wb, ws, 'Modelo');
  XLSXStyle.writeFile(wb, `${filename}_modelo.xlsx`);
};

/**
 * Parse imported file (Excel, CSV, JSON, XML)
 */
export const parseImportFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result;

        if (file.name.endsWith('.json')) {
          const jsonData = JSON.parse(content as string);
          resolve(Array.isArray(jsonData) ? jsonData : [jsonData]);
        } else if (file.name.endsWith('.csv')) {
          const workbook = XLSX.read(content, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          resolve(XLSX.utils.sheet_to_json(worksheet));
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const workbook = XLSX.read(content, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          resolve(XLSX.utils.sheet_to_json(worksheet));
        } else if (file.name.endsWith('.xml')) {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(content as string, 'text/xml');
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
