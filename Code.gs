/**
 * 3DaySolve Google Sheets receiver.
 * Create/open the destination Google Sheet, choose Extensions > Apps Script,
 * paste this file into Code.gs, save, and deploy as a Web app.
 *
 * This stores profile/submission records for a prototype. It is NOT an authentication
 * service and should not be used for passwords, identity documents, payment data,
 * or other highly sensitive information.
 */
const SHEET_MAP = {
  student: 'Students',
  business: 'Businesses',
  project: 'Projects',
  application: 'Applications',
  contact: 'ContactMessages',
  feedback: 'Feedback',
  newsletter: 'Newsletter',
  signin: 'SignInEvents',
  savedProject: 'SavedProjects'
};

const HEADERS = [
  'Received At',
  'Record Type',
  'Record ID',
  'Email',
  'Status',
  'Project ID',
  'Data JSON'
];

function doPost(e) {
  try {
    const raw = e && e.postData && e.postData.contents ? e.postData.contents : '';
    if (!raw) return output_({ ok: false, error: 'Empty request body' });
    if (raw.length > 45000) return output_({ ok: false, error: 'Request too large' });

    const payload = JSON.parse(raw);
    const type = String(payload.type || '');
    if (!Object.prototype.hasOwnProperty.call(SHEET_MAP, type)) {
      return output_({ ok: false, error: 'Unsupported record type' });
    }
    if (!payload.record || typeof payload.record !== 'object' || Array.isArray(payload.record)) {
      return output_({ ok: false, error: 'Record must be an object' });
    }

    const record = sanitize_(payload.record);
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) throw new Error('No active spreadsheet. Bind this script to a Google Sheet.');

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const tabName = SHEET_MAP[type];
      let sheet = spreadsheet.getSheetByName(tabName);
      if (!sheet) sheet = spreadsheet.insertSheet(tabName);
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(HEADERS);
        sheet.setFrozenRows(1);
      }

      const recordId = record.id || record.applicationId || record.reference || '';
      const email = record.email || '';
      const status = record.status || '';
      const projectId = record.projectId || record.id || '';
      const row = [
        new Date(),
        type,
        safeCell_(recordId),
        safeCell_(email),
        safeCell_(status),
        safeCell_(projectId),
        JSON.stringify(record)
      ];
      sheet.appendRow(row);
    } finally {
      lock.releaseLock();
    }

    return output_({ ok: true, type: type });
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    return output_({ ok: false, error: 'Unable to store record' });
  }
}

function doGet() {
  return output_({
    service: '3DaySolve Sheets receiver',
    ready: true,
    note: 'POST a supported record type to save a row. This endpoint does not provide public read access.'
  });
}

function sanitize_(value) {
  if (Array.isArray(value)) return value.map(sanitize_);
  if (value && typeof value === 'object') {
    const clean = {};
    Object.keys(value).forEach(function (key) {
      // Never store credential-like fields even if a client accidentally sends them.
      if (/password|passcode|secret|token|authorization|private.?key/i.test(key)) return;
      clean[String(key).slice(0, 100)] = sanitize_(value[key]);
    });
    return clean;
  }
  if (typeof value === 'string') return value.slice(0, 10000);
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return value;
  return String(value).slice(0, 10000);
}

function safeCell_(value) {
  const text = String(value == null ? '' : value).slice(0, 500);
  // Prevent a value in a common column from being interpreted as a spreadsheet formula.
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function output_(object) {
  return ContentService
    .createTextOutput(JSON.stringify(object))
    .setMimeType(ContentService.MimeType.JSON);
}
