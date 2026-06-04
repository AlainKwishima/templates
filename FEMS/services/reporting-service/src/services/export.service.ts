import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { ExportFormat } from '../prisma/types.js';
import { ReportDataSnapshot } from '../types/index.js';
import { EXPORT_DIR } from '../config/index.js';
import {
  BRAND,
  columnLabel,
  formatGeneratedAt,
  formatReportValue,
  summaryEntries,
} from './export-formatters.js';
import { buildPdfFilePath, buildProfessionalPdf } from './pdf-report.builder.js';

const MIME_TYPES: Record<ExportFormat, string> = {
  pdf: 'application/pdf',
  csv: 'text/csv',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

export function ensureExportDir(): string {
  const dir = path.resolve(EXPORT_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getMimeType(format: ExportFormat): string {
  return MIME_TYPES[format];
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export interface ExportResult {
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface ExportOptions {
  summary?: Record<string, unknown>;
}

export async function generateExport(
  reportId: string,
  reportTitle: string,
  format: ExportFormat,
  snapshot: ReportDataSnapshot,
  options: ExportOptions = {}
): Promise<ExportResult> {
  const dir = ensureExportDir();
  const baseName = `${slugify(reportTitle)}-${reportId.slice(0, 8)}`;

  switch (format) {
    case 'pdf':
      return generatePdf(dir, baseName, reportTitle, snapshot, options.summary);
    case 'csv':
      return generateCsv(dir, baseName, snapshot, options.summary);
    case 'xlsx':
      return generateXlsx(dir, baseName, reportTitle, snapshot, options.summary);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

async function generatePdf(
  dir: string,
  baseName: string,
  title: string,
  snapshot: ReportDataSnapshot,
  summary?: Record<string, unknown>
): Promise<ExportResult> {
  const filePath = buildPdfFilePath(dir, baseName);
  const fileName = `${baseName}.pdf`;

  await buildProfessionalPdf({
    filePath,
    title,
    snapshot,
    summary,
    rowCount: snapshot.rows.length,
  });

  const stats = fs.statSync(filePath);
  return { filePath, fileName, fileSize: stats.size, mimeType: MIME_TYPES.pdf };
}

async function generateCsv(
  dir: string,
  baseName: string,
  snapshot: ReportDataSnapshot,
  summary?: Record<string, unknown>
): Promise<ExportResult> {
  const fileName = `${baseName}.csv`;
  const filePath = path.join(dir, fileName);

  const escape = (val: unknown) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines: string[] = [
    `# ${BRAND.name} — Report export`,
    `# Generated: ${formatGeneratedAt()}`,
  ];
  for (const entry of summaryEntries(summary)) {
    lines.push(`# ${entry.label}: ${entry.value}`);
  }
  lines.push('');
  lines.push(snapshot.columns.map((col) => escape(columnLabel(col))).join(','));
  lines.push(
    ...snapshot.rows.map((row) =>
      snapshot.columns.map((col) => escape(formatReportValue(col, row[col]))).join(',')
    )
  );

  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  const stats = fs.statSync(filePath);
  return { filePath, fileName, fileSize: stats.size, mimeType: MIME_TYPES.csv };
}

async function generateXlsx(
  dir: string,
  baseName: string,
  title: string,
  snapshot: ReportDataSnapshot,
  summary?: Record<string, unknown>
): Promise<ExportResult> {
  const fileName = `${baseName}.xlsx`;
  const filePath = path.join(dir, fileName);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = BRAND.name;
  workbook.created = new Date();

  const headerRowIndex = 4 + summaryEntries(summary).length;
  const sheet = workbook.addWorksheet('Report', {
    views: [{ state: 'frozen', ySplit: headerRowIndex }],
  });

  sheet.mergeCells(1, 1, 1, Math.max(snapshot.columns.length, 1));
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { bold: true, size: 14, color: { argb: 'FF1E293B' } };

  sheet.getCell(2, 1).value = `Generated: ${formatGeneratedAt()}`;
  sheet.getCell(2, 1).font = { size: 9, color: { argb: 'FF64748B' } };

  let summaryRow = 3;
  for (const entry of summaryEntries(summary)) {
    sheet.getCell(summaryRow, 1).value = entry.label;
    sheet.getCell(summaryRow, 1).font = { bold: true, size: 9 };
    sheet.getCell(summaryRow, 2).value = entry.value;
    summaryRow += 1;
  }

  const headerRow = sheet.getRow(headerRowIndex);
  snapshot.columns.forEach((col, i) => {
    headerRow.getCell(i + 1).value = columnLabel(col);
  });
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' },
    };
    cell.alignment = { vertical: 'middle', wrapText: true };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };
  });

  for (const row of snapshot.rows) {
    const dataRow = sheet.addRow(snapshot.columns.map((col) => formatReportValue(col, row[col])));
    dataRow.eachCell((cell) => {
      cell.alignment = { vertical: 'top', wrapText: true };
      cell.font = { size: 9 };
    });
  }

  snapshot.columns.forEach((col, i) => {
    const colIndex = i + 1;
    const headerLen = columnLabel(col).length;
    const maxDataLen = snapshot.rows.reduce((max, row) => {
      const len = formatReportValue(col, row[col]).length;
      return Math.max(max, len);
    }, 0);
    const width = Math.min(48, Math.max(12, Math.max(headerLen, maxDataLen) + 2));
    sheet.getColumn(colIndex).width = width;
  });

  if (snapshot.rows.length > 0) {
    sheet.autoFilter = {
      from: { row: headerRowIndex, column: 1 },
      to: { row: headerRowIndex + snapshot.rows.length, column: snapshot.columns.length },
    };
  }

  await workbook.xlsx.writeFile(filePath);
  const stats = fs.statSync(filePath);
  return { filePath, fileName, fileSize: stats.size, mimeType: MIME_TYPES.xlsx };
}
