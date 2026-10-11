import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AnalyticsPeriodSummary } from '@/types';

export interface PDFExportOptions {
  summary: AnalyticsPeriodSummary;
  generatedBy?: string;
  logoUrl?: string;
}

/**
 * Génère et déclenche le téléchargement d'un rapport PDF officiel des statistiques du site APS-BÉNIN.
 *
 * RÈGLES STRICTES :
 * - Aucune donnée fictive ou inventée.
 * - Si aucune donnée n'est disponible pour la période, un avertissement clair est inclus.
 * - Mise en page A4 élégante avec en-tête institutionnel, métriques chiffrées, tableaux détaillés et pagination.
 */
export async function exportAnalyticsToPDF(options: PDFExportOptions): Promise<void> {
  const { summary, generatedBy } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Couleurs de la charte APS-BÉNIN
  const primaryViolet: [number, number, number] = [146, 39, 143]; // #92278F
  const secondaryOrange: [number, number, number] = [255, 140, 0]; // #FF8C00
  const darkText: [number, number, number] = [30, 41, 59];
  const mutedText: [number, number, number] = [100, 116, 139];
  const lightBg: [number, number, number] = [248, 250, 252];

  let currentY = 14;

  // =========================================================================
  // 1. BANDEAU SUPÉRIEUR INSTITUTIONNEL
  // =========================================================================
  doc.setFillColor(...primaryViolet);
  doc.rect(margin, currentY, contentWidth, 22, 'F');

  // Décoration orange latérale
  doc.setFillColor(...secondaryOrange);
  doc.rect(margin, currentY, 4, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('RÉPUBLIQUE DU BÉNIN', margin + 8, currentY + 7);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('ASSOCIATION DE PROTECTION ET DE SAUVEGARDE (APS-BÉNIN)', margin + 8, currentY + 13);
  doc.setFontSize(7.5);
  doc.setTextColor(254, 215, 170); // orange pastel
  doc.text('Portail Web Officiel — Système de Mesure d\'Audience et de Fréquentation Réelle', margin + 8, currentY + 18);

  currentY += 28;

  // =========================================================================
  // 2. TITRE DU DOCUMENT & MÉTADONNÉES
  // =========================================================================
  doc.setTextColor(...darkText);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Rapport Statistique du Site Web APS-BÉNIN', margin, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...mutedText);

  // Période textuelle
  const periodLabel =
    summary.period === '7d'
      ? '7 derniers jours'
      : summary.period === '30d'
      ? '30 derniers jours'
      : summary.period === '90d'
      ? '90 derniers jours'
      : 'Période personnalisée';

  const dateRangeStr = `Du ${summary.startDate || 'N/A'} au ${summary.endDate || 'N/A'}`;
  doc.text(`Période couverte : ${periodLabel} (${dateRangeStr})`, margin, currentY);

  currentY += 5;
  const genDate = new Date().toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  doc.text(`Date et heure de génération : ${genDate}${generatedBy ? ` • Opérateur : ${generatedBy}` : ''}`, margin, currentY);

  currentY += 8;

  // =========================================================================
  // 3. AVERTISSEMENT DE CONFORMITÉ & INTÉGRITÉ DES DONNÉES
  // =========================================================================
  doc.setFillColor(...lightBg);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 12, 1.5, 1.5, 'FD');

  doc.setFontSize(7.5);
  doc.setTextColor(...primaryViolet);
  doc.setFont('helvetica', 'bold');
  doc.text('RÈGLE D\'INTÉGRITÉ DES MESURES :', margin + 4, currentY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedText);
  doc.text(
    'Toutes les statistiques ci-dessous proviennent exclusivement d\'événements réels enregistrés sur le portail public. Aucun chiffre de démonstration, extrapolation ou visiteur fictif n\'est inclus.',
    margin + 4,
    currentY + 8.5
  );

  currentY += 16;

  // Si aucune donnée n'a été collectée pour la période sélectionnée
  if (!summary.hasData) {
    doc.setFillColor(254, 242, 242); // rouge clair
    doc.setDrawColor(248, 113, 113);
    doc.roundedRect(margin, currentY, contentWidth, 26, 2, 2, 'FD');

    doc.setTextColor(185, 28, 28);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('AUCUNE DONNÉE COLLECTÉE POUR CETTE PÉRIODE', margin + 6, currentY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(153, 27, 27);
    doc.text(
      'Aucune visite ou interaction réelle n\'a été enregistrée sur le site web entre le ' +
        summary.startDate +
        ' et le ' +
        summary.endDate +
        '.',
      margin + 6,
      currentY + 15
    );
    doc.text(
      'Conformément aux directives déontologiques de l\'APS-BÉNIN, aucun indicateur fictif n\'a été généré pour combler ce rapport.',
      margin + 6,
      currentY + 21
    );

    currentY += 34;

    // Tableau vide explicite
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Indicateur', 'Valeur Réelle Observée', 'Statut']],
      body: [
        ['Pages consultées', '0', 'Aucune visite enregistrée'],
        ['Sessions de navigation', '0', 'Aucune session enregistrée'],
        ['Visiteurs uniques réels', '0', 'Aucun visiteur'],
        ['Clics "Appeler le siège"', '0', 'Aucun appel déclenché'],
        ['Téléchargements de documents', '0', 'Aucun téléchargement'],
      ],
      headStyles: {
        fillColor: primaryViolet,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      styles: { fontSize: 8, cellPadding: 3 },
    });

    addFooters(doc, pageHeight, margin, contentWidth);
    savePDF(doc, summary);
    return;
  }

  // =========================================================================
  // 4. INDICATEURS CLÉS CHIFFRÉS (GRILLE DE BLOCS)
  // =========================================================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryViolet);
  doc.text('1. Indicateurs Clés de Fréquentation & d\'Interaction', margin, currentY);
  currentY += 5;

  const cardWidth = (contentWidth - 6) / 3;
  const cardHeight = 16;

  const kpis = [
    { label: 'Pages Vues', value: summary.totalPageViews.toLocaleString('fr-FR'), note: 'Consultations cumulées' },
    { label: 'Sessions Actives', value: summary.totalSessions.toLocaleString('fr-FR'), note: 'Visites distinctes' },
    { label: 'Clics "Appeler le siège"', value: summary.callHeadquartersClicks.toLocaleString('fr-FR'), note: 'Actions prioritaires' },
    { label: 'Téléchargements Docs', value: summary.documentDownloads.toLocaleString('fr-FR'), note: 'Rapports & PDF acquis' },
    { label: 'Vues Projets', value: summary.projectViews.toLocaleString('fr-FR'), note: 'Fiches projets lues' },
    { label: 'Vues Actualités & Opps', value: (summary.newsViews + summary.opportunityViews).toLocaleString('fr-FR'), note: 'Articles & avis consultés' },
  ];

  for (let i = 0; i < kpis.length; i++) {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const x = margin + col * (cardWidth + 3);
    const y = currentY + row * (cardHeight + 3);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    // Petite bordure violette gauche
    doc.setFillColor(...(i === 2 ? secondaryOrange : primaryViolet));
    doc.rect(x, y, 2, cardHeight, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...darkText);
    doc.text(kpis[i].value, x + 5, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...primaryViolet);
    doc.text(kpis[i].label, x + 5, y + 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...mutedText);
    doc.text(kpis[i].note, x + 5, y + 14);
  }

  currentY += (cardHeight + 3) * 2 + 6;

  // =========================================================================
  // 5. TABLEAU DE L'ÉVOLUTION DU TRAFIC PAR JOUR
  // =========================================================================
  if (summary.trafficByDate && summary.trafficByDate.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...primaryViolet);
    doc.text('2. Évolution Chronologique du Trafic', margin, currentY);
    currentY += 4;

    const trafficTableRows = summary.trafficByDate.map((item) => [
      item.date,
      item.pageViews.toString(),
      item.sessions.toString(),
      item.sessions > 0 ? (item.pageViews / item.sessions).toFixed(1) : '1.0',
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Date (AAAA-MM-JJ)', 'Pages Vues', 'Sessions Distinctes', 'Moyenne Pages / Session']],
      body: trafficTableRows,
      headStyles: {
        fillColor: primaryViolet,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        halign: 'left',
      },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    currentY = (doc as any).lastAutoTable?.finalY + 8 || currentY + 30;
  }

  // Vérifier si saut de page nécessaire
  if (currentY > pageHeight - 65) {
    doc.addPage();
    currentY = 16;
  }

  // =========================================================================
  // 6. TOP PAGES LES PLUS CONSULTÉES
  // =========================================================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryViolet);
  doc.text('3. Pages les Plus Consultées du Site', margin, currentY);
  currentY += 4;

  const topPagesRows = (summary.topPages || []).slice(0, 10).map((p, idx) => [
    (idx + 1).toString(),
    p.path,
    p.title || p.path,
    p.views.toString(),
    `${p.percentage}%`,
  ]);

  if (topPagesRows.length > 0) {
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['#', 'Chemin URL', 'Titre de la Page', 'Consultations', 'Part (%)']],
      body: topPagesRows,
      headStyles: {
        fillColor: primaryViolet,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { cellWidth: 40 },
        3: { halign: 'center', cellWidth: 22 },
        4: { halign: 'center', cellWidth: 16 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    currentY = (doc as any).lastAutoTable?.finalY + 8 || currentY + 30;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...mutedText);
    doc.text('Aucune page vue enregistrée sur cette période.', margin, currentY + 4);
    currentY += 10;
  }

  // Vérifier saut de page
  if (currentY > pageHeight - 65) {
    doc.addPage();
    currentY = 16;
  }

  // =========================================================================
  // 7. RÉPARTITION PAR APPAREILS & SOURCES DE TRAFIC
  // =========================================================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryViolet);
  doc.text('4. Profil Technique & Sources du Trafic', margin, currentY);
  currentY += 4;

  const techRows: string[][] = [];

  // Devices
  (summary.deviceBreakdown || []).forEach((d) => {
    techRows.push([
      'Appareil',
      d.device === 'mobile' ? 'Mobile (Smartphone)' : d.device === 'tablet' ? 'Tablette' : 'Ordinateur (Desktop)',
      d.count.toString(),
      `${d.percentage}%`,
    ]);
  });

  // Sources
  (summary.sourcesBreakdown || []).slice(0, 5).forEach((s) => {
    techRows.push(['Source de trafic', s.source, s.count.toString(), `${s.percentage}%`]);
  });

  if (techRows.length > 0) {
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Catégorie', 'Détail / Canal', 'Nombre Réel', 'Part (%)']],
      body: techRows,
      headStyles: {
        fillColor: secondaryOrange,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
      },
      columnStyles: {
        2: { halign: 'center', cellWidth: 24 },
        3: { halign: 'center', cellWidth: 20 },
      },
      alternateRowStyles: {
        fillColor: [255, 251, 235], // orange très clair
      },
    });

    currentY = (doc as any).lastAutoTable?.finalY + 8 || currentY + 30;
  }

  // Vérifier saut de page
  if (currentY > pageHeight - 55) {
    doc.addPage();
    currentY = 16;
  }

  // =========================================================================
  // 8. ACTIONS & INTERACTIONS CITOYENNES
  // =========================================================================
  if (summary.actionsBreakdown && summary.actionsBreakdown.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...primaryViolet);
    doc.text('5. Actions & Événements Spécifiques Réalisés', margin, currentY);
    currentY += 4;

    const actionRows = summary.actionsBreakdown.map((a) => [a.label, a.count.toString()]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Intitulé de l\'Action ou Document', 'Occurrences Réelles']],
      body: actionRows,
      headStyles: {
        fillColor: primaryViolet,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
      },
      columnStyles: {
        1: { halign: 'center', cellWidth: 35 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });
  }

  // =========================================================================
  // 9. PIED DE PAGE NUMÉROTÉ SUR TOUTES LES PAGES
  // =========================================================================
  addFooters(doc, pageHeight, margin, contentWidth);

  savePDF(doc, summary);
}

function addFooters(doc: jsPDF, pageHeight: number, margin: number, contentWidth: number): void {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, margin + contentWidth, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'APS-BÉNIN • Rapport Statistique Confidentiel • Toutes données issues de collectes réelles et vérifiables',
      margin,
      pageHeight - 8
    );
    doc.text(`Page ${i} sur ${totalPages}`, margin + contentWidth - 16, pageHeight - 8);
  }
}

function savePDF(doc: jsPDF, summary: AnalyticsPeriodSummary): void {
  const filename = `Rapport-Statistiques-APS-BENIN-${summary.period}-${summary.startDate}_au_${summary.endDate}.pdf`;
  doc.save(filename);
}
