import * as XLSX from 'xlsx';
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

/**
 * Export data to PDF file
 */
export const exportToPDF = (
  data: any[], 
  columns: { header: string; dataKey: string }[],
  filename: string,
  title: string
) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 20);
  
  // Add date
  doc.setFontSize(10);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);
  
  // Add table
  autoTable(doc, {
    startY: 35,
    head: [columns.map(col => col.header)],
    body: data.map(row => columns.map(col => row[col.dataKey] || '')),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [15, 23, 42] }, // slate-900
    margin: { top: 35 },
    didDrawPage: (data: any) => {
      // Footer
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.text(
        `Página ${data.pageNumber} de ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
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
 * Download template file for import
 */
export const downloadTemplate = (
  templateData: any[],
  filename: string,
  format: 'excel' | 'csv' = 'excel'
) => {
  if (format === 'excel') {
    exportToExcel(templateData, `${filename}_template`, 'Template');
  } else {
    exportToCSV(templateData, `${filename}_template`);
  }
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
