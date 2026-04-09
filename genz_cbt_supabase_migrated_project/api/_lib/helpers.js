const crypto = require('crypto');
const { getConfig } = require('./config');

function trim(value) {
  return String(value == null ? '' : value).trim();
}

function normalize(value) {
  return trim(value).toLowerCase();
}

function toBool(value) {
  if (typeof value === 'boolean') return value;
  const v = normalize(value);
  return ['true', '1', 'yes', 'y', 'on', 'active'].includes(v);
}

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function nowIso() {
  return new Date().toISOString();
}

function response(ok, message, data = undefined) {
  return { ok, message, data };
}

function normalizeUsername(username) {
  const raw = normalize(username).replace(/[^a-z0-9._-]+/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
  if (!raw) throw new Error('Username contains unsupported characters.');
  return raw;
}

function deriveEmail(username) {
  const cfg = getConfig();
  return `${normalizeUsername(username)}@${cfg.userEmailDomain}`;
}

function safeName(value, fallback = 'file') {
  const out = trim(value).replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '');
  return out || fallback;
}

function csvEscape(value) {
  let text = String(value == null ? '' : value);
  if (/[",\n]/.test(text)) text = '"' + text.replace(/"/g, '""') + '"';
  return text;
}

function sha256(text) {
  return crypto.createHash('sha256').update(String(text || '')).digest('hex');
}

function parseJsonArrayText(text, label) {
  const raw = trim(text);
  if (!raw) return [];
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`${label} must be valid JSON.`);
  }
  if (!Array.isArray(parsed)) throw new Error(`${label} must be a JSON array.`);
  return parsed;
}

function randomPassword(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#*';
  const size = Math.max(6, Number(length) || 8);
  let out = '';
  const bytes = crypto.randomBytes(size);
  for (let i = 0; i < size; i += 1) out += chars[bytes[i] % chars.length];
  return out;
}

function isAdminRole(role) {
  return ['principal_admin', 'subadmin', 'admin'].includes(trim(role));
}

function canManageUser(actorRole, targetRole) {
  if (actorRole === 'principal_admin') return true;
  if (['subadmin', 'admin'].includes(actorRole)) return targetRole === 'student';
  return false;
}

function sortByFullName(list) {
  return [...list].sort((a, b) => String(a.full_name || a.fullName || '').localeCompare(String(b.full_name || b.fullName || '')));
}

function parseRequestBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body); } catch { return {}; }
}

function getBearerToken(req, explicitToken = '') {
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  if (/^Bearer\s+/i.test(authHeader)) return authHeader.replace(/^Bearer\s+/i, '').trim();
  return trim(explicitToken);
}

function publicProfileShape(profile) {
  if (!profile) return null;
  return {
    fullName: profile.full_name || '',
    username: profile.username || '',
    role: profile.role || '',
    regId: profile.reg_id || '',
    isActive: !!profile.is_active,
    isDeleted: !!profile.deleted_at
  };
}

module.exports = {
  trim,
  normalize,
  toBool,
  toNum,
  nowIso,
  response,
  normalizeUsername,
  deriveEmail,
  safeName,
  csvEscape,
  sha256,
  parseJsonArrayText,
  randomPassword,
  isAdminRole,
  canManageUser,
  sortByFullName,
  parseRequestBody,
  getBearerToken,
  publicProfileShape
};
