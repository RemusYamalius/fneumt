import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import logoFne from '@/assets/logo-fne.png';

type ExportLang = 'ar' | 'fr';

const esc = (s: unknown): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

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

/* ── Build a hidden HTML report, render it via html2canvas, then convert to PDF ── */
export async function exportToPDF(data: ExportData, lang: ExportLang) {
  const t = labels[lang];
  const isRTL = lang === 'ar';
  const realDeputies = data.deputies.filter(d => !d.user_id.startsWith('placeholder_'));
  const dateStr = new Date().toLocaleDateString(isRTL ? 'ar-MA' : 'fr-FR');

  // Build HTML string
  const html = `
<div id="__pdf_report" dir="${isRTL ? 'rtl' : 'ltr'}" style="
  width:794px; padding:40px; background:#fff; color:#1a1a1a;
  font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-size:13px; line-height:1.6;
">
  <!-- Header -->
  <div style="text-align:center; margin-bottom:24px;">
    <img src="${logoFne}" style="width:70px; height:70px; margin-bottom:8px;" crossorigin="anonymous" />
    <h1 style="margin:0; font-size:22px; color:#1e406e;">${t.title}</h1>
    <p style="margin:4px 0 0; font-size:12px; color:#666;">${t.subtitle}</p>
    <p style="margin:4px 0 0; font-size:11px; color:#999;">${t.date}: ${dateStr}</p>
  </div>

  <!-- KPIs -->
  <h2 style="font-size:15px; color:#1e406e; border-bottom:2px solid #1e406e; padding-bottom:4px; margin:20px 0 10px;">${t.kpiSection}</h2>
  <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
    <tr><td style="padding:8px 12px; border:1px solid #ddd; font-weight:bold; width:50%; background:#f8f9fa;">${t.totalSubordinates}</td><td style="padding:8px 12px; border:1px solid #ddd; text-align:center;">${data.kpis.totalSubordinates}</td></tr>
    <tr><td style="padding:8px 12px; border:1px solid #ddd; font-weight:bold; background:#f8f9fa;">${t.totalRequests}</td><td style="padding:8px 12px; border:1px solid #ddd; text-align:center;">${data.kpis.total}</td></tr>
    <tr><td style="padding:8px 12px; border:1px solid #ddd; font-weight:bold; background:#f8f9fa;">${t.processedRequests}</td><td style="padding:8px 12px; border:1px solid #ddd; text-align:center;">${data.kpis.processed}</td></tr>
    <tr><td style="padding:8px 12px; border:1px solid #ddd; font-weight:bold; background:#f8f9fa;">${t.responseRate}</td><td style="padding:8px 12px; border:1px solid #ddd; text-align:center;">${data.kpis.responseRate}%</td></tr>
  </table>

  <!-- Deputies -->
  <h2 style="font-size:15px; color:#1e406e; border-bottom:2px solid #1e406e; padding-bottom:4px; margin:20px 0 10px;">${t.deputiesSection}</h2>
  <table style="width:100%; border-collapse:collapse; font-size:11px;">
    <thead>
      <tr style="background:#1e406e; color:#fff;">
        <th style="padding:8px 6px; border:1px solid #1e406e; text-align:${isRTL ? 'right' : 'left'};">${t.name}</th>
        <th style="padding:8px 6px; border:1px solid #1e406e; text-align:center;">${t.role}</th>
        <th style="padding:8px 6px; border:1px solid #1e406e; text-align:center;">${t.directorate}</th>
        <th style="padding:8px 6px; border:1px solid #1e406e; text-align:center;">${t.submitted}</th>
        <th style="padding:8px 6px; border:1px solid #1e406e; text-align:center;">${t.viewed}</th>
        <th style="padding:8px 6px; border:1px solid #1e406e; text-align:center;">${t.in_progress}</th>
        <th style="padding:8px 6px; border:1px solid #1e406e; text-align:center;">${t.accepted}</th>
        <th style="padding:8px 6px; border:1px solid #1e406e; text-align:center;">${t.cancelled}</th>
        <th style="padding:8px 6px; border:1px solid #1e406e; text-align:center;">${t.respRate}</th>
      </tr>
    </thead>
    <tbody>
      ${realDeputies.map((dep, i) => {
        const stats = data.getDeputyStats(dep.user_id);
        const bg = i % 2 === 0 ? '#fff' : '#f8f9fa';
        return `<tr style="background:${bg};">
          <td style="padding:6px; border:1px solid #ddd;">${esc(dep.full_name || '—')}</td>
          <td style="padding:6px; border:1px solid #ddd; text-align:center;">${esc(data.getRoleLabel(dep.role))}</td>
          <td style="padding:6px; border:1px solid #ddd; text-align:center;">${esc(dep.directorate || '—')}</td>
          <td style="padding:6px; border:1px solid #ddd; text-align:center;">${stats.byStatus.submitted || 0}</td>
          <td style="padding:6px; border:1px solid #ddd; text-align:center;">${stats.byStatus.viewed || 0}</td>
          <td style="padding:6px; border:1px solid #ddd; text-align:center;">${stats.byStatus.in_progress || 0}</td>
          <td style="padding:6px; border:1px solid #ddd; text-align:center;">${stats.byStatus.accepted || 0}</td>
          <td style="padding:6px; border:1px solid #ddd; text-align:center;">${stats.byStatus.cancelled || 0}</td>
          <td style="padding:6px; border:1px solid #ddd; text-align:center;">${stats.responseRate}%</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>
</div>`;

  // Inject into DOM, render, then remove
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.innerHTML = html;
  document.body.appendChild(container);

  const element = container.querySelector('#__pdf_report') as HTMLElement;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = 190;
    const pdfPageHeight = 277;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10;

    pdf.addImage(imgData, 'PNG', 10, position, pdfWidth, imgHeight);
    heightLeft -= pdfPageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 10;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, pdfWidth, imgHeight);
      heightLeft -= pdfPageHeight;
    }

    pdf.save(`supervision-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
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
