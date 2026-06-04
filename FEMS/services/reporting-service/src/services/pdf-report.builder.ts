import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import type PDFKit from 'pdfkit';
import type { ReportDataSnapshot } from '../types/index.js';
import {
  BRAND,
  PDF_OMIT_COLUMNS,
  columnLabel,
  columnWeight,
  formatGeneratedAt,
  formatReportValue,
  summaryEntries,
} from './export-formatters.js';

const PAGE = {
  marginTop: 72,
  marginBottom: 56,
  marginX: 48,
  headerHeight: 36,
  footerHeight: 28,
  minRowHeight: 22,
  cellPaddingX: 6,
  cellPaddingY: 5,
};

export interface PdfReportOptions {
  filePath: string;
  title: string;
  snapshot: ReportDataSnapshot;
  summary?: Record<string, unknown>;
  rowCount?: number;
}

interface PdfColumn {
  key: string;
  label: string;
  width: number;
}

function contentWidth(doc: PDFKit.PDFDocument): number {
  return doc.page.width - PAGE.marginX * 2;
}

function contentBottom(doc: PDFKit.PDFDocument): number {
  return doc.page.height - PAGE.marginBottom;
}

function drawPageHeader(doc: PDFKit.PDFDocument): void {
  const y = PAGE.marginTop - PAGE.headerHeight;
  doc.save();
  doc.rect(0, y, doc.page.width, PAGE.headerHeight).fill(BRAND.primary);
  doc.fillColor(BRAND.white).font('Helvetica-Bold').fontSize(9);
  doc.text(BRAND.name.toUpperCase(), PAGE.marginX, y + 12, { continued: false });
  doc.font('Helvetica').fontSize(7);
  doc.text('Compliance & operations report', PAGE.marginX, y + 12, {
    width: contentWidth(doc),
    align: 'right',
  });
  doc.restore();
}

function drawPageFooter(doc: PDFKit.PDFDocument, pageNum: number, totalPages: number, generatedLabel: string): void {
  const y = doc.page.height - PAGE.footerHeight;
  doc.save();
  doc.strokeColor(BRAND.border).lineWidth(0.5);
  doc.moveTo(PAGE.marginX, y).lineTo(doc.page.width - PAGE.marginX, y).stroke();
  doc.fillColor(BRAND.slateMuted).font('Helvetica').fontSize(7);
  doc.text(`Generated ${generatedLabel}`, PAGE.marginX, y + 8);
  doc.text('Confidential — for authorised business use only', PAGE.marginX, y + 8, {
    width: contentWidth(doc),
    align: 'center',
  });
  doc.text(`Page ${pageNum} of ${totalPages}`, PAGE.marginX, y + 8, {
    width: contentWidth(doc),
    align: 'right',
  });
  doc.restore();
}

function prepareColumns(doc: PDFKit.PDFDocument, snapshot: ReportDataSnapshot): PdfColumn[] {
  const keys = snapshot.columns.filter((k) => !PDF_OMIT_COLUMNS.has(k));
  const totalWeight = keys.reduce((sum, k) => sum + columnWeight(k), 0);
  const width = contentWidth(doc);
  return keys.map((key) => ({
    key,
    label: columnLabel(key),
    width: (width * columnWeight(key)) / totalWeight,
  }));
}

function drawTitleBlock(
  doc: PDFKit.PDFDocument,
  title: string,
  generatedLabel: string,
  summary: Record<string, unknown> | undefined,
  rowCount: number
): number {
  let y = PAGE.marginTop + 8;

  doc.fillColor(BRAND.slate).font('Helvetica-Bold').fontSize(18).text(title, PAGE.marginX, y, {
    width: contentWidth(doc),
  });
  y = doc.y + 6;

  doc.fillColor(BRAND.slateMuted).font('Helvetica').fontSize(9).text(BRAND.tagline, PAGE.marginX, y);
  y = doc.y + 4;
  doc.fontSize(8).text(generatedLabel, PAGE.marginX, y);
  y = doc.y + 14;

  const cards = [
    { label: 'Records in report', value: String(rowCount) },
    ...summaryEntries(summary),
  ];

  if (cards.length > 0) {
    const cardWidth = (contentWidth(doc) - 12 * (Math.min(cards.length, 4) - 1)) / Math.min(cards.length, 4);
    const cardHeight = 44;
    let x = PAGE.marginX;
    const visible = cards.slice(0, 4);
    for (const card of visible) {
      doc.save();
      doc.roundedRect(x, y, cardWidth, cardHeight, 4).fillAndStroke(BRAND.zebra, BRAND.border);
      doc.fillColor(BRAND.slateMuted).font('Helvetica').fontSize(7).text(card.label.toUpperCase(), x + 10, y + 10, {
        width: cardWidth - 20,
      });
      doc.fillColor(BRAND.slate).font('Helvetica-Bold').fontSize(14).text(card.value, x + 10, y + 22, {
        width: cardWidth - 20,
      });
      doc.restore();
      x += cardWidth + 12;
    }
    y += cardHeight + 18;
  }

  if (rowCount === 0) {
    doc.fillColor(BRAND.slateMuted).font('Helvetica').fontSize(10).text(
      'No records matched the selected filters for this report.',
      PAGE.marginX,
      y
    );
    return doc.y + 20;
  }

  return y;
}

function drawTableHeader(doc: PDFKit.PDFDocument, columns: PdfColumn[], y: number): number {
  const tableWidth = columns.reduce((s, c) => s + c.width, 0);
  const headerHeight = 24;
  doc.save();
  doc.rect(PAGE.marginX, y, tableWidth, headerHeight).fill(BRAND.headerBg);
  let x = PAGE.marginX;
  doc.fillColor(BRAND.white).font('Helvetica-Bold').fontSize(8);
  for (const col of columns) {
    doc.text(col.label, x + PAGE.cellPaddingX, y + 7, {
      width: col.width - PAGE.cellPaddingX * 2,
      lineBreak: false,
    });
    x += col.width;
  }
  doc.restore();
  return y + headerHeight;
}

function measureRowHeight(
  doc: PDFKit.PDFDocument,
  columns: PdfColumn[],
  row: Record<string, unknown>
): number {
  let maxH = PAGE.minRowHeight;
  for (const col of columns) {
    const text = formatReportValue(col.key, row[col.key]);
    const h =
      doc.heightOfString(text, {
        width: col.width - PAGE.cellPaddingX * 2,
        align: 'left',
      }) +
      PAGE.cellPaddingY * 2;
    if (h > maxH) maxH = h;
  }
  return Math.min(maxH, 120);
}

function drawTableRow(
  doc: PDFKit.PDFDocument,
  columns: PdfColumn[],
  row: Record<string, unknown>,
  y: number,
  rowHeight: number,
  stripe: boolean
): void {
  const tableWidth = columns.reduce((s, c) => s + c.width, 0);
  if (stripe) {
    doc.save();
    doc.rect(PAGE.marginX, y, tableWidth, rowHeight).fill(BRAND.zebra);
    doc.restore();
  }

  let x = PAGE.marginX;
  doc.font('Helvetica').fontSize(8);
  for (const col of columns) {
    const raw = row[col.key];
    const text = formatReportValue(col.key, raw);
    if (col.key === 'status') {
      const lower = String(raw ?? '').toLowerCase();
      if (lower === 'failed' || lower === 'expired') doc.fillColor(BRAND.danger);
      else if (lower === 'sent' || lower === 'completed' || lower === 'active') doc.fillColor(BRAND.success);
      else if (lower.includes('expiring') || lower === 'pending') doc.fillColor(BRAND.warning);
      else doc.fillColor(BRAND.slate);
    } else {
      doc.fillColor(BRAND.slate);
    }
    doc.text(text, x + PAGE.cellPaddingX, y + PAGE.cellPaddingY, {
      width: col.width - PAGE.cellPaddingX * 2,
      align: 'left',
      lineGap: 1,
    });
    x += col.width;
  }
}

export async function buildProfessionalPdf(options: PdfReportOptions): Promise<void> {
  const { filePath, title, snapshot, summary, rowCount = snapshot.rows.length } = options;
  const generatedLabel = formatGeneratedAt();
  const visibleColumnCount = snapshot.columns.filter((k) => !PDF_OMIT_COLUMNS.has(k)).length;
  const useLandscape = visibleColumnCount >= 4;

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: useLandscape ? 'landscape' : 'portrait',
      margins: { top: PAGE.marginTop, bottom: PAGE.marginBottom, left: PAGE.marginX, right: PAGE.marginX },
      bufferPages: true,
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const columns = prepareColumns(doc, snapshot);
    const tableStartY = PAGE.marginTop + 8;

    drawPageHeader(doc);
    let y = drawTitleBlock(doc, title, generatedLabel, summary, rowCount);

    if (columns.length > 0 && rowCount > 0) {
      y = drawTableHeader(doc, columns, y);
      let rowIndex = 0;
      for (const row of snapshot.rows) {
        const rowHeight = measureRowHeight(doc, columns, row);
        if (y + rowHeight > contentBottom(doc)) {
          doc.addPage();
          drawPageHeader(doc);
          y = drawTableHeader(doc, columns, tableStartY);
        }
        drawTableRow(doc, columns, row, y, rowHeight, rowIndex % 2 === 0);
        y += rowHeight;
        rowIndex += 1;
      }
    }

    const range = doc.bufferedPageRange();
    const totalPages = range.count;
    for (let i = range.start; i < range.start + range.count; i += 1) {
      doc.switchToPage(i);
      drawPageFooter(doc, i - range.start + 1, totalPages, generatedLabel);
    }

    doc.end();
    stream.on('finish', () => resolve());
    stream.on('error', reject);
  });
}

export function buildPdfFilePath(dir: string, baseName: string): string {
  return path.join(dir, `${baseName}.pdf`);
}
