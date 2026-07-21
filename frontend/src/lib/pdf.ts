import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Product } from '../types';
import { formatDate } from './expiry';
import { STATUS_LABELS } from '../types';

export function exportProductsToPdf(title: string, products: Product[]) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.text(`Generated ${new Date().toLocaleString()} · Total: ${products.length}`, 14, 25);

  autoTable(doc, {
    startY: 30,
    head: [['Name', 'Category', 'Batch', 'Qty', 'Mfg. Date', 'Expiry Date', 'Status']],
    body: products.map((p) => [
      p.name,
      p.category,
      p.batchNumber || '—',
      p.quantity ?? '—',
      formatDate(p.manufacturingDate),
      formatDate(p.expiryDate),
      STATUS_LABELS[p.status],
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [51, 65, 85] },
  });

  doc.save(`${title.replace(/\s+/g, '_').toLowerCase()}.pdf`);
}
