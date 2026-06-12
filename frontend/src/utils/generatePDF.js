import jsPDF from 'jspdf';

/**
 * Generate a multi-page PDF report from the evaluation data.
 * Uses jsPDF directly (no html2canvas) for crisp vector text rendering.
 */
export async function generatePDF(screens, aggregate) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const pageH = 297;
  const marginL = 16;
  const marginR = 16;
  const contentW = pageW - marginL - marginR;
  let y = 0;

  // ─── Color Palette ───────────────────────────────────────────────────────────
  const C = {
    bg: [5, 5, 5],
    surface: [22, 24, 29],
    surface2: [30, 33, 40],
    purple: [139, 92, 246],
    pink: [236, 72, 153],
    green: [16, 185, 129],
    blue: [59, 130, 246],
    yellow: [245, 158, 11],
    red: [239, 68, 68],
    white: [255, 255, 255],
    grey: [156, 163, 175],
    darkgrey: [75, 85, 99],
    border: [40, 44, 55],
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const setFill = (rgb) => pdf.setFillColor(...rgb);
  const setDraw = (rgb) => pdf.setDrawColor(...rgb);
  const setFont = (size, style = 'normal', rgb = C.white) => {
    pdf.setFontSize(size);
    pdf.setFont('helvetica', style);
    pdf.setTextColor(...rgb);
  };

  const rect = (x, xw, yy, h, rgb, border = false) => {
    setFill(rgb);
    if (border) { setDraw(border); pdf.roundedRect(x, yy, xw, h, 2, 2, 'FD'); }
    else pdf.roundedRect(x, yy, xw, h, 2, 2, 'F');
  };

  const text = (str, x, yy, opts = {}) => pdf.text(String(str), x, yy, opts);

  const wrappedText = (str, x, yy, maxW, lineH = 4.5) => {
    const lines = pdf.splitTextToSize(String(str || ''), maxW);
    pdf.text(lines, x, yy);
    return lines.length * lineH;
  };

  const scoreColor = (s) => {
    if (s >= 80 || s >= 8) return C.green;
    if (s >= 60 || s >= 6) return C.blue;
    if (s >= 40 || s >= 4) return C.yellow;
    return C.red;
  };

  const scoreCircle = (x, yy, r, score) => {
    const sc = scoreColor(score);
    setFill(sc);
    setDraw(sc);
    pdf.circle(x, yy, r, 'F');
    setFont(r * 1.4, 'bold', C.white);
    text(score, x, yy + r * 0.5, { align: 'center' });
  };

  const addNewPage = () => {
    pdf.addPage();
    // Dark background
    setFill(C.bg);
    pdf.rect(0, 0, pageW, pageH, 'F');
    y = 16;
  };

  const checkY = (needed = 20) => {
    if (y + needed > pageH - 14) addNewPage();
  };

  const sectionTitle = (title, color = C.purple) => {
    checkY(14);
    rect(marginL, contentW, y, 8, C.surface);
    // accent bar
    setFill(color);
    pdf.rect(marginL, y, 3, 8, 'F');
    setFont(9, 'bold', color);
    text(title.toUpperCase(), marginL + 6, y + 5.5);
    y += 12;
  };

  const miniCard = (x, cardW, yy, h, rgb = C.surface) => {
    setFill(rgb);
    pdf.roundedRect(x, yy, cardW, h, 2, 2, 'F');
  };

  const bulletList = (items, x, startY, color = C.grey, maxW = contentW - 6) => {
    if (!items || items.length === 0) return startY;
    let cy = startY;
    for (const item of items) {
      checkY(10);
      setFill(color);
      pdf.circle(x + 1.5, cy - 0.8, 1, 'F');
      setFont(7.5, 'normal', C.grey);
      const lines = pdf.splitTextToSize(String(item), maxW - 5);
      pdf.text(lines, x + 5, cy);
      cy += lines.length * 4.5 + 1.5;
    }
    return cy;
  };

  // ─── COVER PAGE ──────────────────────────────────────────────────────────────
  setFill(C.bg);
  pdf.rect(0, 0, pageW, pageH, 'F');

  // gradient-ish header block
  setFill(C.surface);
  pdf.rect(0, 0, pageW, 90, 'F');
  setFill(C.surface2);
  pdf.rect(0, 70, pageW, 25, 'F');

  // purple accent line
  setFill(C.purple);
  pdf.rect(0, 0, 4, 90, 'F');

  // Logo area
  setFont(22, 'bold', C.white);
  text('AI UX Expert', marginL, 30);
  setFont(22, 'bold', C.purple);
  text('Audit Report', marginL, 43);

  setFont(9, 'normal', C.grey);
  text('Powered by Expert AI Vision · Multi-Screen Evaluation', marginL, 55);

  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  setFont(8, 'normal', C.darkgrey);
  text(date, marginL, 65);

  if (aggregate) {
    // Product name
    setFont(13, 'bold', C.white);
    text(aggregate.productName || 'Prototype', marginL, 85);

    // Big score
    const sc = aggregate.overallScore;
    scoreCircle(pageW - 35, 45, 14, sc);
    setFont(8, 'normal', C.grey);
    text('Overall Score', pageW - 35, 65, { align: 'center' });

    // Verdict
    const verdColors = { Exceptional: C.green, Strong: C.blue, Good: C.purple, Average: C.yellow, 'Below Standard': C.red, 'Needs Major Redesign': C.red };
    const vc = verdColors[aggregate.finalVerdict] || C.grey;
    setFont(10, 'bold', vc);
    text(aggregate.finalVerdict, pageW - 35, 73, { align: 'center' });

    // Score breakdown cards
    y = 105;
    const breakdown = Object.entries(aggregate.breakdown || {});
    const cardW = (contentW / breakdown.length) - 2;
    breakdown.forEach(([key, val], i) => {
      const cx = marginL + i * (cardW + 2);
      miniCard(cx, cardW, y, 22, C.surface);
      setFill(scoreColor(val));
      pdf.rect(cx, y, cardW, 3, 'F');
      setFont(13, 'bold', scoreColor(val));
      text(val, cx + cardW / 2, y + 15, { align: 'center' });
      setFont(6.5, 'normal', C.darkgrey);
      text(key.charAt(0).toUpperCase() + key.slice(1), cx + cardW / 2, y + 21, { align: 'center' });
    });
    y += 30;

    // Product info
    setFont(8, 'normal', C.grey);
    const vpLines = pdf.splitTextToSize(aggregate.coreValueProposition || '', contentW);
    pdf.text(vpLines, marginL, y);
    y += vpLines.length * 4.5 + 8;

    // Senior designer advice
    rect(marginL, contentW, y, 28, C.surface2);
    setFill(C.purple);
    pdf.rect(marginL, y, 2, 28, 'F');
    setFont(7.5, 'bold', C.purple);
    text('Senior Designer Advice', marginL + 6, y + 7);
    setFont(7.5, 'italic', C.grey);
    const advLines = pdf.splitTextToSize(`"${aggregate.seniorDesignerAdvice}"`, contentW - 10);
    pdf.text(advLines, marginL + 6, y + 13);
    y += 35;

    // Screen count
    setFont(8, 'normal', C.darkgrey);
    text(`${screens.length} screen${screens.length !== 1 ? 's' : ''} evaluated`, marginL, y);
  }

  // Page number
  setFont(7, 'normal', C.darkgrey);
  text('1', pageW / 2, pageH - 8, { align: 'center' });

  // ─── PER-SCREEN PAGES ────────────────────────────────────────────────────────
  for (let si = 0; si < screens.length; si++) {
    const screen = screens[si];
    const ev = screen.evaluation;
    addNewPage();

    // Screen header bar
    setFill(C.surface);
    pdf.rect(0, 0, pageW, 22, 'F');
    setFill(C.purple);
    pdf.rect(0, 0, 3, 22, 'F');

    setFont(7.5, 'bold', C.purple);
    text(`SCREEN ${screen.index} OF ${screens.length}`, marginL + 2, 8);
    setFont(11, 'bold', C.white);
    text(screen.title || `Screen ${screen.index}`, marginL + 2, 17);
    setFont(7, 'normal', C.darkgrey);
    text(screen.url || '', pageW - marginR, 8, { align: 'right' });
    const overallSc = ev?.overallScore || 0;
    scoreCircle(pageW - 12, 11, 7, overallSc);

    y = 28;

    // Screenshot + scores side-by-side
    if (screen.screenshotBase64) {
      try {
        const imgW = 90;
        const imgH = 58;
        pdf.addImage(screen.screenshotBase64, 'PNG', marginL, y, imgW, imgH);

        // Scores column
        const sx = marginL + imgW + 6;
        const sw = contentW - imgW - 6;

        const miniScores = [
          ['First Impression', ev?.firstImpression?.score],
          ['UI Design', ev?.uiDesign?.score],
          ['UX Audit', ev?.uxAudit?.score],
          ['Content suggestions', ev?.contentSuggestions?.score],
          ['Accessibility', ev?.accessibility?.score],
          ['Conversion', ev?.conversion?.score],
        ].filter(([, v]) => v != null);

        miniScores.forEach(([label, val], i) => {
          const rowY = y + i * 9.6;
          miniCard(sx, sw, rowY, 8.5, C.surface);
          setFill(scoreColor(val));
          pdf.rect(sx, rowY, 2.5, 8.5, 'F');
          setFont(7, 'normal', C.grey);
          text(label, sx + 5, rowY + 6.0);
          setFont(8, 'bold', scoreColor(val));
          text(String(val), sx + sw - 4, rowY + 6.0, { align: 'right' });
        });

        y += imgH + 6;
      } catch (e) {
        y += 4;
      }
    }

    // Page role
    if (ev?.pageRole) {
      rect(marginL, contentW, y, 9, C.surface2);
      setFont(6.5, 'bold', C.purple);
      text('PAGE ROLE', marginL + 4, y + 3.5);
      setFont(8, 'normal', C.white);
      text(ev.pageRole, marginL + 30, y + 6.5);
      y += 13;
    }

    // Top priority
    if (ev?.topPriority) {
      checkY(16);
      setFill([60, 45, 10]);
      pdf.roundedRect(marginL, y, contentW, 12, 2, 2, 'F');
      setFill(C.yellow);
      pdf.rect(marginL, y, 2.5, 12, 'F');
      setFont(6.5, 'bold', C.yellow);
      text('TOP PRIORITY', marginL + 5, y + 4.5);
      setFont(7.5, 'normal', [255, 214, 120]);
      const tpLines = pdf.splitTextToSize(ev.topPriority, contentW - 8);
      pdf.text(tpLines, marginL + 5, y + 9);
      y += 16;
    }

    // Two column layout: Strengths | Issues
    const colW = (contentW - 4) / 2;
    const leftX = marginL;
    const rightX = marginL + colW + 4;
    const twoColY = y;

    // Strengths header
    checkY(8);
    setFill(C.surface);
    pdf.rect(leftX, y, colW, 7, 'F');
    setFill(C.green);
    pdf.rect(leftX, y, 2.5, 7, 'F');
    setFont(6.5, 'bold', C.green);
    text('✓  STRENGTHS', leftX + 5, y + 5);

    // Issues header
    setFill(C.surface);
    pdf.rect(rightX, y, colW, 7, 'F');
    setFill(C.red);
    pdf.rect(rightX, y, 2.5, 7, 'F');
    setFont(6.5, 'bold', C.red);
    text('×  CRITICAL ISSUES', rightX + 5, y + 5);
    y += 10;

    const strengths = ev?.firstImpression?.strengths || [];
    const issues = [...(ev?.uiDesign?.criticalIssues || []), ...(ev?.uxAudit?.confusingAreas || []), ...(ev?.accessibility?.issues || [])];

    const maxRows = Math.max(strengths.length, issues.length);
    for (let ri = 0; ri < Math.min(maxRows, 5); ri++) {
      checkY(7);
      if (strengths[ri]) {
        setFont(7, 'normal', C.grey);
        const lines = pdf.splitTextToSize('• ' + strengths[ri], colW - 5);
        pdf.text(lines, leftX + 3, y);
        y += lines.length * 4.2 + 2;
      }
    }

    y = twoColY + 10;
    for (let ri = 0; ri < Math.min(issues.length, 5); ri++) {
      setFont(7, 'normal', C.grey);
      const lines = pdf.splitTextToSize('• ' + issues[ri], colW - 5);
      pdf.text(lines, rightX + 3, y);
      y += lines.length * 4.2 + 2;
    }

    y = Math.max(y, twoColY + 10 + strengths.slice(0, 5).length * 7) + 4;

    // Recommendations
    const recs = [
      ...(ev?.uiDesign?.recommendations || []),
      ...(ev?.uxAudit?.improvements || []),
      ...(ev?.contentSuggestions?.improvements || [])
    ];
    if (recs.length > 0) {
      checkY(12);
      sectionTitle('Recommendations', C.purple);
      setFont(7.5, 'normal', C.grey);
      y = bulletList(recs.slice(0, 4), marginL + 3, y, C.purple);
    }

    // Page number
    setFont(7, 'normal', C.darkgrey);
    text(`Page ${si + 2}`, pageW / 2, pageH - 8, { align: 'center' });
  }

  // ─── AGGREGATE ROADMAP PAGE ───────────────────────────────────────────────────
  if (aggregate?.prioritizedRoadmap) {
    addNewPage();
    setFont(16, 'bold', C.white);
    text('Prioritized Improvement Roadmap', marginL, y);
    y += 12;

    const roadmapSections = [
      { label: 'CRITICAL — Must Fix', color: C.red, items: aggregate.prioritizedRoadmap.critical },
      { label: 'IMPORTANT — Should Fix', color: C.yellow, items: aggregate.prioritizedRoadmap.important },
      { label: 'ENHANCEMENTS — Nice to Have', color: C.green, items: aggregate.prioritizedRoadmap.enhancements },
    ];

    for (const section of roadmapSections) {
      if (!section.items?.length) continue;
      sectionTitle(section.label, section.color);

      for (const item of section.items) {
        checkY(22);
        const cardH = 20 + (pdf.splitTextToSize(item.suggestedSolution || '', contentW - 12).length * 4.5);
        miniCard(marginL, contentW, y, cardH, C.surface);
        setFill(section.color);
        pdf.rect(marginL, y, 2.5, cardH, 'F');

        setFont(8, 'bold', C.white);
        const probLines = pdf.splitTextToSize(item.problem, contentW - 14);
        pdf.text(probLines, marginL + 6, y + 6);

        setFont(7.5, 'normal', C.grey);
        const solLines = pdf.splitTextToSize(item.suggestedSolution || '', contentW - 14);
        pdf.text(solLines, marginL + 6, y + 6 + probLines.length * 5);

        if (item.affectedScreens?.length) {
          setFont(6.5, 'normal', C.darkgrey);
          text('Affects: ' + item.affectedScreens.join(', '), marginL + 6, y + cardH - 4);
        }

        // Effort badge
        const effortColors = { Low: C.green, Medium: C.yellow, High: C.red };
        setFill(effortColors[item.effort] || C.grey);
        pdf.roundedRect(pageW - marginR - 22, y + 3, 20, 7, 1.5, 1.5, 'F');
        setFont(6.5, 'bold', C.white);
        text(item.effort || '', pageW - marginR - 12, y + 7.5, { align: 'center' });

        y += cardH + 4;
      }
      y += 4;
    }
  }

  // ─── Cross-Screen Issues Page ─────────────────────────────────────────────────
  if (aggregate?.crossScreenIssues?.length) {
    checkY(40);
    sectionTitle('Cross-Screen Consistency Issues', C.yellow);
    y = bulletList(aggregate.crossScreenIssues, marginL + 3, y, C.yellow);
    y += 6;
  }

  // ─── Usability Heuristics Check Page ──────────────────────────────────────────
  if (aggregate?.heuristicsCheck?.length) {
    addNewPage();
    setFont(14, 'bold', C.white);
    text("Jakob Nielsen's Usability Heuristics Audit", marginL, y);
    y += 10;

    for (const hc of aggregate.heuristicsCheck) {
      checkY(20);
      const icon = hc.passed ? "✓  " : "×  ";
      const color = hc.passed ? C.green : C.red;

      rect(marginL, contentW, y, 12, C.surface);
      setFill(color);
      pdf.rect(marginL, y, 2.5, 12, 'F');

      setFont(8, 'bold', color);
      text(icon + hc.heuristic, marginL + 5, y + 7.5);

      const yNotes = y + 16;
      setFont(7.5, 'normal', C.grey);
      const noteLines = pdf.splitTextToSize(hc.notes || '', contentW - 10);
      pdf.text(noteLines, marginL + 5, yNotes);

      y += 18 + (noteLines.length * 4.5);
    }
  }

  // Final page number
  const totalPages = pdf.getNumberOfPages();
  for (let pg = 1; pg <= totalPages; pg++) {
    pdf.setPage(pg);
    setFont(7, 'normal', C.darkgrey);
    text(`${pg} / ${totalPages}`, pageW / 2, pageH - 8, { align: 'center' });
    // Footer line
    setFill(C.border);
    pdf.rect(marginL, pageH - 12, contentW, 0.5, 'F');
    setFont(6.5, 'normal', C.darkgrey);
    text('AI UX Expert Evaluator · Expert AI Vision', marginL, pageH - 5);
    text(date, pageW - marginR, pageH - 5, { align: 'right' });
  }

  const productName = (aggregate?.productName || 'ux-report').toLowerCase().replace(/\s+/g, '-');
  pdf.save(`ux-audit-${productName}-${Date.now()}.pdf`);
}

const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
