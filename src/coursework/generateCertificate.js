/**
 * PDF Certificate Generator for Mythouse course completions.
 * Uses jsPDF (loaded via dynamic import at call site) to draw
 * a landscape A4 certificate with dark background, gold borders,
 * and course details.
 */

const PAGE_W = 297; // A4 landscape width (mm)
const PAGE_H = 210; // A4 landscape height (mm)

const COLORS = {
  bg: [10, 10, 15],           // #0a0a0f
  gold: [201, 169, 97],       // #c9a961
  goldDim: [201, 169, 97],
  ember: [196, 113, 58],      // #c4713a
  text: [220, 215, 200],      // warm off-white
  muted: [140, 135, 125],
  borderOuter: [201, 169, 97],
  borderInner: [160, 135, 75],
};

function rgb(c) { return c; }

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Draw a decorative corner flourish (small L-bracket with serif ends).
 * corner: 'tl' | 'tr' | 'bl' | 'br'
 */
function drawCornerFlourish(doc, x, y, corner, size = 12) {
  doc.setDrawColor(...rgb(COLORS.gold));
  doc.setLineWidth(0.6);

  const s = size;
  const dot = 2; // serif nub length

  switch (corner) {
    case 'tl':
      doc.line(x, y + s, x, y);
      doc.line(x, y, x + s, y);
      doc.line(x, y + s, x + dot, y + s);
      doc.line(x + s, y, x + s, y + dot);
      break;
    case 'tr':
      doc.line(x, y, x - s, y);
      doc.line(x, y, x, y + s);
      doc.line(x - s, y, x - s, y + dot);
      doc.line(x, y + s, x - dot, y + s);
      break;
    case 'bl':
      doc.line(x, y, x, y - s);
      doc.line(x, y, x + s, y);
      doc.line(x, y - s, x + dot, y - s);
      doc.line(x + s, y, x + s, y - dot);
      break;
    case 'br':
      doc.line(x, y, x - s, y);
      doc.line(x, y, x, y - s);
      doc.line(x - s, y, x - s, y - dot);
      doc.line(x, y - s, x - dot, y - s);
      break;
    default:
      break;
  }
}

/**
 * Generate and download a PDF certificate.
 *
 * @param {typeof import('jspdf').jsPDF} jsPDF — the jsPDF constructor (passed in so we don't import at module level)
 * @param {object} opts
 * @param {string} opts.userName — display name
 * @param {string} opts.courseName — e.g. "Monomyth Explorer"
 * @param {string} opts.courseDescription — one-liner
 * @param {Array<{description: string}>} opts.requirements — course requirements
 * @param {number} opts.completedAt — timestamp (ms)
 * @param {string} opts.courseId — for filename
 */
export function generateCertificate(jsPDF, { userName, courseName, courseDescription, requirements, completedAt, courseId }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // ── Background ──
  doc.setFillColor(...rgb(COLORS.bg));
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  // ── Double border ──
  const m1 = 8;  // outer margin
  const m2 = 12; // inner margin
  doc.setDrawColor(...rgb(COLORS.borderOuter));
  doc.setLineWidth(0.8);
  doc.rect(m1, m1, PAGE_W - m1 * 2, PAGE_H - m1 * 2);
  doc.setDrawColor(...rgb(COLORS.borderInner));
  doc.setLineWidth(0.4);
  doc.rect(m2, m2, PAGE_W - m2 * 2, PAGE_H - m2 * 2);

  // ── Corner flourishes ──
  const fi = m2 + 2; // inset from inner border
  drawCornerFlourish(doc, fi, fi, 'tl');
  drawCornerFlourish(doc, PAGE_W - fi, fi, 'tr');
  drawCornerFlourish(doc, fi, PAGE_H - fi, 'bl');
  drawCornerFlourish(doc, PAGE_W - fi, PAGE_H - fi, 'br');

  // ── Decorative top line ──
  const cx = PAGE_W / 2;
  doc.setDrawColor(...rgb(COLORS.gold));
  doc.setLineWidth(0.3);
  doc.line(cx - 50, 28, cx + 50, 28);
  // small diamond in center
  const dy = 28;
  doc.setFillColor(...rgb(COLORS.gold));
  doc.triangle(cx, dy - 2, cx - 2, dy, cx + 2, dy, 'F');
  doc.triangle(cx, dy + 2, cx - 2, dy, cx + 2, dy, 'F');

  // ── "MYTHOUSE" header ──
  let y = 38;
  doc.setFont('times', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(...rgb(COLORS.gold));
  // Letter-spaced effect: draw each char individually
  const headerText = 'MYTHOUSE';
  const spacing = 5;
  const headerWidth = (headerText.length - 1) * spacing;
  let hx = cx - headerWidth / 2;
  for (const ch of headerText) {
    doc.text(ch, hx, y, { align: 'center' });
    hx += spacing;
  }

  // ── "Certificate of Completion" ──
  y = 52;
  doc.setFont('times', 'italic');
  doc.setFontSize(22);
  doc.setTextColor(...rgb(COLORS.ember));
  doc.text('Certificate of Completion', cx, y, { align: 'center' });

  // ── "This certifies that" ──
  y = 66;
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...rgb(COLORS.muted));
  doc.text('This certifies that', cx, y, { align: 'center' });

  // ── User name ──
  y = 80;
  doc.setFont('times', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...rgb(COLORS.text));
  doc.text(userName, cx, y, { align: 'center' });

  // Gold underline under name
  const nameWidth = doc.getTextWidth(userName);
  doc.setDrawColor(...rgb(COLORS.gold));
  doc.setLineWidth(0.4);
  doc.line(cx - nameWidth / 2 - 5, y + 2, cx + nameWidth / 2 + 5, y + 2);

  // ── "has successfully completed" ──
  y = 90;
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...rgb(COLORS.muted));
  doc.text('has successfully completed', cx, y, { align: 'center' });

  // ── Course name ──
  y = 103;
  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...rgb(COLORS.gold));
  doc.text(courseName, cx, y, { align: 'center' });

  // ── Course description ──
  y = 112;
  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...rgb(COLORS.muted));
  const descLines = doc.splitTextToSize(courseDescription, 180);
  doc.text(descLines, cx, y, { align: 'center' });
  y += descLines.length * 4;

  // ── Requirements ──
  y += 6;
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...rgb(COLORS.muted));
  doc.text('Requirements fulfilled:', cx, y, { align: 'center' });
  y += 6;

  const reqX = cx - 80; // left-align requirements
  doc.setFontSize(8.5);
  doc.setTextColor(...rgb(COLORS.text));

  for (const req of requirements) {
    const lines = doc.splitTextToSize(req.description, 155);
    // Gold bullet
    doc.setFillColor(...rgb(COLORS.gold));
    doc.circle(reqX - 2, y - 1, 0.8, 'F');

    for (let i = 0; i < lines.length; i++) {
      doc.text(lines[i], reqX + 2, y);
      y += 3.8;
    }
    y += 1;
  }

  // ── Decorative bottom line ──
  const bottomLineY = Math.max(y + 4, PAGE_H - 40);
  doc.setDrawColor(...rgb(COLORS.gold));
  doc.setLineWidth(0.3);
  doc.line(cx - 50, bottomLineY, cx + 50, bottomLineY);
  // diamond
  doc.setFillColor(...rgb(COLORS.gold));
  doc.triangle(cx, bottomLineY - 2, cx - 2, bottomLineY, cx + 2, bottomLineY, 'F');
  doc.triangle(cx, bottomLineY + 2, cx - 2, bottomLineY, cx + 2, bottomLineY, 'F');

  // ── Completion date ──
  const dateY = bottomLineY + 10;
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...rgb(COLORS.muted));
  doc.text(formatDate(completedAt), cx, dateY, { align: 'center' });

  // ── Footer ──
  doc.setFontSize(7);
  doc.setTextColor(...rgb(COLORS.muted));
  doc.text('mythouse.org', cx, PAGE_H - 14, { align: 'center' });

  // ── Download ──
  const dateStr = completedAt ? new Date(completedAt).toISOString().slice(0, 10) : 'unknown';
  doc.save(`mythouse-certificate-${courseId}-${dateStr}.pdf`);
}
