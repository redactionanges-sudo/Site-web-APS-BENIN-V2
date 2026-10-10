import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AnalyticsPeriodSummary } from '@/types';

export interface GeneratePdfOptions {
  summary: AnalyticsPeriodSummary;
  orgName?: string;
  slogan?: string;
  generatedByName?: string;
}

export function exportAnalyticsToPDF(options: GeneratePdfOptions): void {
  const { summary, orgName = 'AGISSONS POUR SAUVER (APS-BÉNIN)', slogan = 'Pour un monde plus juste et égalitaire' } = options;

  if (!summary.hasData || summary.totalPageViews === 0) {
    throw new Error('Aucune donnée statistique disponible pour générer un rapport sur cette période.');
  }

  // Create A4 Portrait PDF (210 x 297 mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Colors
  const purplePrimary: [number, number, number] = [146, 39, 143]; // #92278F
  const orangeAccent: [number, number, number] = [255, 140, 0];  // #FF8C00
  const darkGray: [number, number, number] = [31, 41, 55];
  const mutedGray: [number, number, number] = [107, 114, 128];
  const lightBg: [number, number, number] = [249, 250, 251];

  let currentY = 14;

  // ==========================================
  // 1. BRAND HEADER
  // ==========================================
  // Top accent bar (dual color: purple & orange)
  doc.setFillColor(...purplePrimary);
  doc.rect(margin, currentY, (pageWidth - margin * 2) * 0.7, 2, 'F');
  doc.setFillColor(...orangeAccent);
  doc.rect(margin + (pageWidth - margin * 2) * 0.7, currentY, (pageWidth - margin * 2) * 0.3, 2, 'F');
  currentY += 8;

  // Header Logo & Organization Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...purplePrimary);
  doc.text('APS-BÉNIN', margin, currentY);

  doc.setFontSize(10);
  doc.setTextColor(...darkGray);
  doc.text(`— ${orgName}`, margin + 34, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(...orangeAccent);
  doc.text(`« ${slogan} »`, margin, currentY);

  currentY += 8;

  // Document Title
  doc.setFillColor(243, 232, 243); // subtle purple tint
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 18, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...purplePrimary);
  doc.text('RAPPORT STATISTIQUE DU SITE WEB APS-BÉNIN', margin + 6, currentY + 7);

  const periodLabel =
    summary.period === '7d'
      ? '7 derniers jours'
      : summary.period === '30d'
      ? '30 derniers jours'
      : summary.period === '90d'
      ? '90 derniers jours'
      : 'Période personnalisée';

  const startFormatted = new Date(summary.startDate).toLocaleDateString('fr-FR');
  const endFormatted = new Date(summary.endDate).toLocaleDateString('fr-FR');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...darkGray);
  doc.text(
    `Période : ${periodLabel} (du ${startFormatted} au ${endFormatted}) • Généré le ${new Date().toLocaleString('fr-FR')}`,
    margin + 6,
    currentY + 13
  );

  currentY += 24;

  // ==========================================
  // 2. PRINCIPAUX INDICATEURS (KPI CARDS)
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...purplePrimary);
  doc.text('1. Indicateurs Clés de Fréquentation Réelle', margin, currentY);
  currentY += 4;

  const cardWidth = (pageWidth - margin * 2 - 6) / 3;
  const cardHeight = 18;

  const kpis = [
    { label: 'Pages Vues', value: summary.totalPageViews.toLocaleString('fr-FR'), desc: 'Consultations totales' },
    { label: 'Visiteurs & Sessions', value: summary.totalSessions.toLocaleString('fr-FR'), desc: 'Sessions uniques anonymes' },
    { label: 'Appels au Siège', value: summary.callHeadquartersClicks.toLocaleString('fr-FR'), desc: 'Clics sur CTA téléphone' },
    { label: 'Téléchargements', value: summary.documentDownloads.toLocaleString('fr-FR'), desc: 'Documents institutionnels' },
    { label: 'Projets Consultés', value: summary.projectViews.toLocaleString('fr-FR'), desc: 'Fiches projets lues' },
    { label: 'Actualités Lues', value: summary.newsViews.toLocaleString('fr-FR'), desc: 'Articles et communiqués' },
  ];

  // Draw 2 rows of 3 cards
  kpis.forEach((kpi, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const x = margin + col * (cardWidth + 3);
    const y = currentY + row * (cardHeight + 3);

    doc.setFillColor(...lightBg);
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(x, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...purplePrimary);
    doc.text(kpi.value, x + 4, y + 7);

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...darkGray);
    doc.text(kpi.label, x + 4, y + 12);

    // Desc
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...mutedGray);
    doc.text(kpi.desc, x + 4, y + 16);
  });

  currentY += cardHeight * 2 + 10;

  // ==========================================
  // 3. TOP DES PAGES LES PLUS CONSULTÉES
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...purplePrimary);
  doc.text('2. Pages les Plus Consultées sur la Période', margin, currentY);
  currentY += 3;

  const tableData = summary.topPages.map((p, idx) => [
    `#${idx + 1}`,
    p.path,
    p.title || 'Page du site',
    p.views.toLocaleString('fr-FR'),
    `${p.percentage}%`,
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Rang', 'Chemin d’accès (URL)', 'Titre de la page', 'Consultations', 'Part']],
    body: tableData.length > 0 ? tableData : [['-', 'Aucune page consultée', '-', '0', '0%']],
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      font: 'helvetica',
    },
    headStyles: {
      fillColor: purplePrimary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center' },
      1: { cellWidth: 50 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 18, halign: 'right' },
    },
  });

  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 8;

  // Check page overflow
  if (currentY > pageHeight - 65) {
    doc.addPage();
    currentY = 16;
  }

  // ==========================================
  // 4. RÉPARTITION PAR APPAREILS & SOURCES
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...purplePrimary);
  doc.text('3. Répartition Technique & Sources de Trafic', margin, currentY);
  currentY += 3;

  const deviceData = summary.deviceBreakdown.map((d) => [
    d.device === 'mobile' ? 'Téléphone Mobile' : d.device === 'desktop' ? 'Ordinateur (Desktop)' : 'Tablette',
    d.count.toLocaleString('fr-FR'),
    `${d.percentage}%`,
  ]);

  const sourceData = summary.sourcesBreakdown.map((s) => [
    s.source,
    s.count.toLocaleString('fr-FR'),
    `${s.percentage}%`,
  ]);

  // Devices Table
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: pageWidth / 2 + 2 },
    head: [['Type d’appareil', 'Événements', 'Part']],
    body: deviceData,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [75, 85, 99], textColor: [255, 255, 255] },
  });

  // Sources Table on right side
  autoTable(doc, {
    startY: currentY,
    margin: { left: pageWidth / 2 + 2, right: margin },
    head: [['Source de trafic', 'Événements', 'Part']],
    body: sourceData.length > 0 ? sourceData : [['Direct / Non identifié', '100%', '100%']],
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: orangeAccent, textColor: [255, 255, 255] },
  });

  // @ts-ignore
  currentY = Math.max(doc.lastAutoTable.finalY || currentY, currentY) + 8;

  // Check overflow
  if (currentY > pageHeight - 40) {
    doc.addPage();
    currentY = 16;
  }

  // ==========================================
  // 5. SYNTHÈSE & MENTIONS DE CONFIDENTIALITÉ
  // ==========================================
  doc.setFillColor(...lightBg);
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...purplePrimary);
  doc.text('Synthèse & Respect de la Confidentialité :', margin + 4, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...darkGray);
  doc.text(
    '• Ce rapport est généré à partir des événements mesurés en direct sur le site officiel APS-BÉNIN sans interpolation.',
    margin + 4,
    currentY + 10.5
  );
  doc.text(
    '• Conforme à l’éthique d’APS-BÉNIN : aucun traceur intrusif ni donnée personnelle identifiante (PII) n’est enregistrée.',
    margin + 4,
    currentY + 15
  );
  doc.text(
    '• Les adresses IP et identités nominatives des visiteurs publics ne sont ni stockées ni présentées dans ce document.',
    margin + 4,
    currentY + 19.5
  );

  // ==========================================
  // 6. NUMÉROTATION DES PAGES & FOOTER
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer line
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...mutedGray);
    doc.text(
      'APS-BÉNIN — Djacoṭé-Comè, Mono, République du Bénin • Enregistrement N°9/040PDM/SG/STCCD- du 20/09/2017',
      margin,
      pageHeight - 7.5
    );

    doc.text(`Page ${i} sur ${totalPages}`, pageWidth - margin - 18, pageHeight - 7.5);
  }

  // Save / Trigger Download
  const filename = `rapport-statistiques-aps-benin-${summary.period}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
