const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { stringify } = require('csv-stringify/sync');

const ensureDir = (filePath) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// Column definitions per report subtype
const SCHEMAS = {
  'employee-summary': [
    { label: 'Employee ID', key: 'employeeId', w: 75 },
    { label: 'Name', key: 'employeeName', w: 130 },
    { label: 'Department', key: 'departmentName', w: 100 },
    { label: 'Total Items', key: 'totalItems', w: 70 },
    { label: 'Total Hours', key: 'totalHours', w: 70, fmt: (v) => `${Number(v).toFixed(1)}h` },
    { label: 'Days', key: 'entryCount', w: 45 },
    { label: 'Items/Hr', key: 'avgItemsPerHour', w: 65, fmt: (v) => Number(v).toFixed(2) },
    { label: 'Avg Score', key: 'avgProductivityScore', w: 70, fmt: (v) => `${Number(v).toFixed(1)}%` },
  ],
  'department-summary': [
    { label: 'Department', key: 'departmentName', w: 140 },
    { label: 'Code', key: 'departmentCode', w: 60 },
    { label: 'Employees', key: 'employeeCount', w: 75 },
    { label: 'Total Items', key: 'totalItems', w: 75 },
    { label: 'Total Hours', key: 'totalHours', w: 75, fmt: (v) => `${Number(v).toFixed(1)}h` },
    { label: 'Days', key: 'entryCount', w: 45 },
    { label: 'Items/Hr', key: 'avgItemsPerHour', w: 65, fmt: (v) => Number(v).toFixed(2) },
    { label: 'Avg Score', key: 'avgProductivityScore', w: 75, fmt: (v) => `${Number(v).toFixed(1)}%` },
  ],
  'project-summary': [
    { label: 'Code', key: 'projectCode', w: 65 },
    { label: 'Project Name', key: 'projectName', w: 155 },
    { label: 'Employees', key: 'employeeCount', w: 75 },
    { label: 'Total Items', key: 'totalItems', w: 75 },
    { label: 'Total Hours', key: 'totalHours', w: 75, fmt: (v) => `${Number(v).toFixed(1)}h` },
    { label: 'Days', key: 'entryCount', w: 45 },
    { label: 'Items/Hr', key: 'avgItemsPerHour', w: 75, fmt: (v) => Number(v).toFixed(2) },
  ],
  'top-performers': [
    { label: '#', key: 'rank', w: 30 },
    { label: 'Employee ID', key: 'employeeId', w: 75 },
    { label: 'Name', key: 'employeeName', w: 120 },
    { label: 'Department', key: 'departmentName', w: 100 },
    { label: 'Total Items', key: 'totalItems', w: 75 },
    { label: 'Total Hours', key: 'totalHours', w: 70, fmt: (v) => `${Number(v).toFixed(1)}h` },
    { label: 'Avg Score', key: 'avgProductivityScore', w: 70, fmt: (v) => `${Number(v).toFixed(1)}%` },
    { label: 'Level', key: 'performanceLevel', w: 95 },
  ],
  'low-productivity': [
    { label: 'Employee ID', key: 'employeeId', w: 75 },
    { label: 'Name', key: 'employeeName', w: 130 },
    { label: 'Department', key: 'departmentName', w: 100 },
    { label: 'Total Items', key: 'totalItems', w: 70 },
    { label: 'Days', key: 'entryCount', w: 45 },
    { label: 'Avg Score', key: 'avgProductivityScore', w: 75, fmt: (v) => `${Number(v).toFixed(1)}%` },
    { label: 'Level', key: 'performanceLevel', w: 110 },
    { label: 'Daily Target', key: 'dailyTargetSnapshot', w: 75 },
  ],
  'missing-entries': [
    { label: 'Employee ID', key: 'employeeId', w: 75 },
    { label: 'Name', key: 'employeeName', w: 130 },
    { label: 'Department', key: 'departmentName', w: 100 },
    { label: 'Expected Days', key: 'expectedDays', w: 80 },
    { label: 'Submitted', key: 'submittedDays', w: 65 },
    { label: 'Missing', key: 'missingDays', w: 65 },
    { label: 'Compliance', key: 'complianceRate', w: 75, fmt: (v) => `${Number(v).toFixed(1)}%` },
  ],
  'holiday-working-days': [
    { label: 'Date', key: 'date', w: 90 },
    { label: 'Day', key: 'dayName', w: 55 },
    { label: 'Type', key: 'type', w: 75 },
    { label: 'Name / Reason', key: 'name', w: 260 },
  ],
  // Analytics exports
  'analytics-productivity': [
    { label: 'Date', key: 'date', w: 90 },
    { label: 'Total Items', key: 'totalItems', w: 80 },
    { label: 'Total Hours', key: 'totalHours', w: 80, fmt: (v) => `${Number(v).toFixed(1)}h` },
    { label: 'Entries', key: 'entryCount', w: 70 },
    { label: 'Items/Hr', key: 'avgItemsPerHour', w: 80, fmt: (v) => Number(v || 0).toFixed(2) },
  ],
  'analytics-monthly-trend': [
    { label: 'Month', key: 'monthName', w: 80 },
    { label: 'Total Items', key: 'totalItems', w: 90 },
    { label: 'Total Hours', key: 'totalHours', w: 90, fmt: (v) => `${Number(v).toFixed(1)}h` },
    { label: 'Entries', key: 'entryCount', w: 70 },
  ],
  'analytics-weekly-trend': [
    { label: 'Week', key: 'label', w: 110 },
    { label: 'Year', key: 'year', w: 60 },
    { label: 'Total Items', key: 'totalItems', w: 90 },
    { label: 'Total Hours', key: 'totalHours', w: 90, fmt: (v) => `${Number(v).toFixed(1)}h` },
    { label: 'Entries', key: 'entryCount', w: 70 },
  ],
  'analytics-yearly-trend': [
    { label: 'Year', key: 'year', w: 70 },
    { label: 'Total Items', key: 'totalItems', w: 90 },
    { label: 'Total Hours', key: 'totalHours', w: 90, fmt: (v) => `${Number(v).toFixed(1)}h` },
    { label: 'Entries', key: 'entryCount', w: 70 },
    { label: 'Employees', key: 'employeeCount', w: 80 },
  ],
  'analytics-department': [
    { label: 'Department', key: 'departmentName', w: 140 },
    { label: 'Employees', key: 'employeeCount', w: 80 },
    { label: 'Total Items', key: 'totalItems', w: 90 },
    { label: 'Total Hours', key: 'totalHours', w: 90, fmt: (v) => `${Number(v).toFixed(1)}h` },
    { label: 'Entries', key: 'entryCount', w: 70 },
    { label: 'Items/Hr', key: 'avgItemsPerHour', w: 80, fmt: (v) => Number(v || 0).toFixed(2) },
  ],
  'analytics-project': [
    { label: 'Project', key: 'projectName', w: 160 },
    { label: 'Code', key: 'projectCode', w: 70 },
    { label: 'Employees', key: 'employeeCount', w: 80 },
    { label: 'Total Items', key: 'totalItems', w: 90 },
    { label: 'Total Hours', key: 'totalHours', w: 90, fmt: (v) => `${Number(v).toFixed(1)}h` },
    { label: 'Entries', key: 'entryCount', w: 70 },
    { label: 'Items/Hr', key: 'avgItemsPerHour', w: 80, fmt: (v) => Number(v || 0).toFixed(2) },
  ],
  'analytics-top-performers': [
    { label: '#', key: 'rank', w: 30 },
    { label: 'Employee ID', key: 'employeeId', w: 75 },
    { label: 'Name', key: 'employeeName', w: 130 },
    { label: 'Department', key: 'departmentName', w: 100 },
    { label: 'Total Items', key: 'totalItems', w: 80 },
    { label: 'Total Hours', key: 'totalHours', w: 75, fmt: (v) => `${Number(v).toFixed(1)}h` },
    { label: 'Score', key: 'avgProductivityScore', w: 60, fmt: (v) => `${Number(v)}%` },
    { label: 'Level', key: 'performanceLevel', w: 110 },
  ],
  'analytics-low-performers': [
    { label: 'Employee ID', key: 'employeeId', w: 75 },
    { label: 'Name', key: 'employeeName', w: 130 },
    { label: 'Department', key: 'departmentName', w: 100 },
    { label: 'Total Items', key: 'totalItems', w: 80 },
    { label: 'Days', key: 'entryCount', w: 50 },
    { label: 'Score', key: 'avgProductivityScore', w: 60, fmt: (v) => `${Number(v)}%` },
    { label: 'Level', key: 'performanceLevel', w: 110 },
    { label: 'Target', key: 'dailyTargetSnapshot', w: 60 },
  ],
  'analytics-approval-time': [
    { label: 'Department', key: 'department', w: 140 },
    { label: 'Avg Hours', key: 'avgHours', w: 80, fmt: (v) => `${Number(v).toFixed(1)}h` },
    { label: 'Min Hours', key: 'minHours', w: 80, fmt: (v) => `${Number(v).toFixed(1)}h` },
    { label: 'Max Hours', key: 'maxHours', w: 80, fmt: (v) => `${Number(v).toFixed(1)}h` },
    { label: 'Count', key: 'count', w: 60 },
  ],
  'analytics-rejections': [
    { label: 'Category', key: 'category', w: 200 },
    { label: 'Count / Value', key: 'value', w: 120 },
    { label: 'Rate', key: 'pct', w: 80 },
  ],
  'audit-logs': [
    { label: 'Timestamp', key: 'createdAt', w: 140, fmt: (v) => v ? new Date(v).toLocaleString() : '—' },
    { label: 'User', key: 'userName', w: 120 },
    { label: 'Role', key: 'userRole', w: 70 },
    { label: 'Action', key: 'action', w: 130 },
    { label: 'Module', key: 'module', w: 90 },
    { label: 'Status', key: 'status', w: 70 },
    { label: 'IP Address', key: 'ipAddress', w: 100 },
    { label: 'Browser', key: 'browser', w: 80 },
    { label: 'OS', key: 'os', w: 80 },
  ],
};

const getSchema = (subType) => SCHEMAS[subType] || SCHEMAS['employee-summary'];

const fmtVal = (col, row) => {
  const v = row[col.key];
  if (v === undefined || v === null) return '—';
  if (col.fmt) return col.fmt(v);
  return String(v);
};

// --- PDF ---
const generatePDF = (rows, filePath, meta) => {
  return new Promise((resolve, reject) => {
    ensureDir(filePath);
    const cols = getSchema(meta.subType);
    const totalW = cols.reduce((s, c) => s + c.w, 0);
    const layout = totalW > 480 ? 'landscape' : 'portrait';
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Title block
    doc.fontSize(14).font('Helvetica-Bold').text(meta.company, { align: 'center' });
    doc.fontSize(11).font('Helvetica-Bold').text(meta.title, { align: 'center' });
    doc.fontSize(9).font('Helvetica').text(meta.period, { align: 'center' });

    // Summary block
    if (meta.summary) {
      doc.moveDown(0.3);
      const summaryText = Object.entries(meta.summary)
        .map(([k, v]) => `${k}: ${v}`)
        .join('   |   ');
      doc.fontSize(8).fillColor('#666666').text(summaryText, { align: 'center' });
      doc.fillColor('#000000');
    }
    doc.moveDown(0.5);

    const startX = 40;
    // Header row
    const headerY = doc.y;
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#1d4ed8');
    let x = startX;
    cols.forEach((col) => {
      doc.text(col.label, x, headerY, { width: col.w, align: 'left' });
      x += col.w;
    });
    doc.fillColor('#000000');
    doc.moveDown(0.3);
    doc.moveTo(startX, doc.y).lineTo(startX + totalW, doc.y).strokeColor('#d1d5db').stroke();
    doc.moveDown(0.25);

    // Data rows
    doc.font('Helvetica').fontSize(8);
    rows.forEach((row, idx) => {
      const pageHeight = layout === 'landscape' ? 540 : 750;
      if (doc.y > pageHeight - 20) {
        doc.addPage();
        doc.font('Helvetica').fontSize(8);
      }
      if (idx % 2 === 1) {
        doc.rect(startX, doc.y - 1, totalW, 14).fill('#f9fafb').stroke('#f9fafb');
        doc.fillColor('#000000');
      }
      const rowY = doc.y;
      x = startX;
      cols.forEach((col) => {
        doc.text(fmtVal(col, row), x, rowY, { width: col.w });
        x += col.w;
      });
      doc.moveDown(0.25);
    });

    // Footer
    doc.moveDown(0.5);
    doc
      .fontSize(7)
      .fillColor('#9ca3af')
      .text(
        `Generated ${new Date().toLocaleString()}  •  ${rows.length} record${rows.length !== 1 ? 's' : ''}`,
        { align: 'right' }
      );

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
};

// --- Excel ---
const generateExcel = async (rows, filePath, meta) => {
  ensureDir(filePath);
  const cols = getSchema(meta.subType);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Report');

  const colCount = cols.length;

  const mergeRange = (row, from, to, value, opts = {}) => {
    sheet.mergeCells(`A${row}:${String.fromCharCode(64 + colCount)}${row}`);
    const cell = sheet.getCell(`A${row}`);
    cell.value = value;
    Object.assign(cell.font || {}, opts.font || {});
    cell.font = opts.font;
    cell.alignment = opts.alignment || { horizontal: 'center', vertical: 'middle' };
  };

  mergeRange(1, 1, colCount, meta.company, { font: { bold: true, size: 13 } });
  mergeRange(2, 1, colCount, meta.title, { font: { bold: true, size: 11 } });
  mergeRange(3, 1, colCount, meta.period, { font: { size: 9, color: { argb: 'FF6b7280' } } });

  let headerRowNum = 5;
  if (meta.summary) {
    const summaryText = Object.entries(meta.summary).map(([k, v]) => `${k}: ${v}`).join('   |   ');
    mergeRange(4, 1, colCount, summaryText, { font: { size: 8, color: { argb: 'FF6b7280' } } });
    headerRowNum = 6;
    sheet.addRow([]);
  } else {
    sheet.addRow([]);
  }

  // Header row
  const headerRow = sheet.addRow(cols.map((c) => c.label));
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1d4ed8' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFbfdbfe' } } };
  });

  // Data rows
  rows.forEach((row, idx) => {
    const dataRow = sheet.addRow(cols.map((col) => fmtVal(col, row)));
    if (idx % 2 === 1) {
      dataRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf9fafb' } };
      });
    }
  });

  // Column widths
  sheet.columns.forEach((col, i) => {
    col.width = Math.max(10, Math.ceil((cols[i]?.w || 100) / 7));
  });

  // Footer row
  sheet.addRow([]);
  const footerRow = sheet.addRow([`Generated: ${new Date().toLocaleString()}  |  ${rows.length} records`]);
  footerRow.getCell(1).font = { size: 8, color: { argb: 'FF9ca3af' } };

  await workbook.xlsx.writeFile(filePath);
};

// --- CSV ---
const generateCSV = (rows, filePath, meta) => {
  ensureDir(filePath);
  const cols = getSchema(meta.subType);
  const data = rows.map((row) => {
    const obj = {};
    cols.forEach((col) => { obj[col.label] = fmtVal(col, row); });
    return obj;
  });
  const csv = stringify(data, { header: true });
  fs.writeFileSync(filePath, csv, 'utf8');
};

// --- Main ---
const generate = async (rows, format, filePath, meta) => {
  switch (format) {
    case 'excel': return generateExcel(rows, filePath, meta);
    case 'csv':   return generateCSV(rows, filePath, meta);
    default:      return generatePDF(rows, filePath, meta);
  }
};

module.exports = { generate, generatePDF, generateExcel, generateCSV };
