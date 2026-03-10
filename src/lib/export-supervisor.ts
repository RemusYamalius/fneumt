import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import logoFne from '@/assets/logo-fne.png';

type ExportLang = 'ar' | 'fr';

const labels: Record<ExportLang, Record<string, string>> = {
  ar: {
    title: 'تقرير لوحة الإشراف',
    subtitle: 'الجامعة الوطنية للتعليم - الاتحاد المغربي للشغل',
    date: 'تاريخ التصدير',
    kpiSection: 'المؤشرات العامة',
    totalSubordinates: 'المرؤوسون المعيّنون',
    totalRequests: 'إجمالي الطلبات',
    processedRequests: 'الطلبات المعالجة',
    responseRate: 'معدل الاستجابة',
    deputiesSection: 'تفاصيل المرؤوسين',
    name: 'الاسم',
    role: 'المنصب',
    directorate: 'المديرية',
    requests: 'الطلبات',
    submitted: 'مقدّم',
    viewed: 'مطّلع عليه',
    in_progress: 'قيد الإجراء',
    accepted: 'مقبول',
    cancelled: 'ملغى',
    respRate: 'معدل الاستجابة',
    awaitingAssignment: 'في انتظار التعيين',
    page: 'صفحة',
    sheetKPI: 'المؤشرات',
    sheetDeputies: 'المرؤوسون',
  },
  fr: {
    title: 'Rapport du Tableau de Supervision',
    subtitle: "Fédération Nationale de l'Enseignement - UMT",
    date: "Date d'exportation",
    kpiSection: 'Indicateurs Globaux',
    totalSubordinates: 'Subordonnés assignés',
    totalRequests: 'Total des demandes',
    processedRequests: 'Demandes traitées',
    responseRate: 'Taux de réponse',
    deputiesSection: 'Détails des Subordonnés',
    name: 'Nom',
    role: 'Rôle',
    directorate: 'Direction',
    requests: 'Demandes',
    submitted: 'Soumis',
    viewed: 'Consulté',
    in_progress: 'En cours',
    accepted: 'Accepté',
    cancelled: 'Annulé',
    respRate: 'Taux de réponse',
    awaitingAssignment: 'En attente d\'assignation',
    page: 'Page',
    sheetKPI: 'Indicateurs',
    sheetDeputies: 'Subordonnés',
  },
};

interface Deputy {
  user_id: string;
  full_name: string | null;
  role: string;
  directorate?: string | null;
}

interface KPIs {
  totalSubordinates: number;
  total: number;
  processed: number;
  responseRate: number;
}

interface DeputyStats {
  total: number;
  byStatus: Record<string, number>;
  responseRate: number;
}

interface ExportData {
  kpis: KPIs;
  deputies: Deputy[];
  getDeputyStats: (id: string) => DeputyStats;
  getRoleLabel: (role: string) => string;
}

const loadLogoAsBase64 = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No canvas context');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = logoFne;
  });
};

export async function exportToPDF(data: ExportData, lang: ExportLang) {
  const t = labels[lang];
  const isRTL = lang === 'ar';
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  
  // Load and add logo
  try {
    const logoBase64 = await loadLogoAsBase64();
    const logoSize = 28;
    const logoX = (210 - logoSize) / 2;
    doc.addImage(logoBase64, 'PNG', logoX, 8, logoSize, logoSize);
  } catch (e) {
    console.warn('Logo load failed', e);
  }

  // Title
  doc.setFontSize(18);
  doc.setTextColor(30, 64, 110);
  doc.text(t.title, 105, 44, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(t.subtitle, 105, 51, { align: 'center' });

  doc.setFontSize(9);
  doc.text(`${t.date}: ${new Date().toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR')}`, 105, 57, { align: 'center' });

  // KPI Section
  doc.setFontSize(13);
  doc.setTextColor(30, 64, 110);
  doc.text(t.kpiSection, isRTL ? 195 : 15, 67, { align: isRTL ? 'right' : 'left' });

  const kpiData = [
    [t.totalSubordinates, String(data.kpis.totalSubordinates)],
    [t.totalRequests, String(data.kpis.total)],
    [t.processedRequests, String(data.kpis.processed)],
    [t.responseRate, `${data.kpis.responseRate}%`],
  ];

  const kpiTable = autoTable(doc, {
    startY: 71,
    head: [],
    body: kpiData,
    theme: 'grid',
    styles: { 
      fontSize: 10, 
      cellPadding: 4,
      halign: isRTL ? 'right' : 'left',
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 90 },
      1: { cellWidth: 90, halign: 'center' },
    },
    margin: { left: 15, right: 15 },
    tableWidth: 180,
  });

  // Deputies Section
  const afterKPI = (kpiTable as any).finalY + 10;
  doc.setFontSize(13);
  doc.setTextColor(30, 64, 110);
  doc.text(t.deputiesSection, isRTL ? 195 : 15, afterKPI, { align: isRTL ? 'right' : 'left' });

  const realDeputies = data.deputies.filter(d => !d.user_id.startsWith('placeholder_'));

  const deputyHeaders = [
    [t.name, t.role, t.directorate, t.submitted, t.viewed, t.in_progress, t.accepted, t.cancelled, t.respRate],
  ];

  const deputyRows = realDeputies.map(dep => {
    const stats = data.getDeputyStats(dep.user_id);
    return [
      dep.full_name || '—',
      data.getRoleLabel(dep.role),
      dep.directorate || '—',
      String(stats.byStatus.submitted || 0),
      String(stats.byStatus.viewed || 0),
      String(stats.byStatus.in_progress || 0),
      String(stats.byStatus.accepted || 0),
      String(stats.byStatus.cancelled || 0),
      `${stats.responseRate}%`,
    ];
  });

  autoTable(doc, {
    startY: afterKPI + 4,
    head: deputyHeaders,
    body: deputyRows,
    theme: 'striped',
    styles: { 
      fontSize: 8, 
      cellPadding: 3,
      halign: isRTL ? 'right' : 'left',
    },
    headStyles: {
      fillColor: [30, 64, 110],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    margin: { left: 10, right: 10 },
    tableWidth: 190,
  });

  // Footer with page number
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`${t.page} ${i}/${pageCount}`, 105, 290, { align: 'center' });
  }

  doc.save(`supervision-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportToExcel(data: ExportData, lang: ExportLang) {
  const t = labels[lang];
  const wb = XLSX.utils.book_new();

  // KPI Sheet
  const kpiRows = [
    [t.title],
    [t.subtitle],
    [`${t.date}: ${new Date().toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR')}`],
    [],
    [t.kpiSection],
    [t.totalSubordinates, data.kpis.totalSubordinates],
    [t.totalRequests, data.kpis.total],
    [t.processedRequests, data.kpis.processed],
    [t.responseRate, `${data.kpis.responseRate}%`],
  ];
  const wsKPI = XLSX.utils.aoa_to_sheet(kpiRows);
  wsKPI['!cols'] = [{ wch: 30 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsKPI, t.sheetKPI);

  // Deputies Sheet
  const realDeputies = data.deputies.filter(d => !d.user_id.startsWith('placeholder_'));
  const deputyHeaders = [t.name, t.role, t.directorate, t.requests, t.submitted, t.viewed, t.in_progress, t.accepted, t.cancelled, t.respRate];
  const deputyRows = realDeputies.map(dep => {
    const stats = data.getDeputyStats(dep.user_id);
    return [
      dep.full_name || '—',
      data.getRoleLabel(dep.role),
      dep.directorate || '—',
      stats.total,
      stats.byStatus.submitted || 0,
      stats.byStatus.viewed || 0,
      stats.byStatus.in_progress || 0,
      stats.byStatus.accepted || 0,
      stats.byStatus.cancelled || 0,
      `${stats.responseRate}%`,
    ];
  });

  const wsDeputies = XLSX.utils.aoa_to_sheet([deputyHeaders, ...deputyRows]);
  wsDeputies['!cols'] = deputyHeaders.map(() => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wb, wsDeputies, t.sheetDeputies);

  XLSX.writeFile(wb, `supervision-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
