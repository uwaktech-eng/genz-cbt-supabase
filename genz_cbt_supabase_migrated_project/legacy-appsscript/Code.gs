const SPREADSHEET_ID = '1gx-012b0Jp8qavy_xyn8FeaAjEsEHQcSZ9nUQY2Qc2k';
const ADMIN_SIGNUP_KEY = '1234';
const SESSION_HOURS = 12;
const ROOT_FOLDER_NAME = 'Genz CBT System Storage';
const TZ = Session.getScriptTimeZone() || 'Africa/Lagos';

const SHEETS = {
  SETTINGS: 'Settings',
  USERS: 'Users',
  SESSIONS: 'Sessions',
  CANDIDATES: 'Candidates',
  EXAMS: 'Exams',
  QUESTIONS: 'Questions',
  PERMISSION_CODES: 'PermissionCodes',
  RESULTS: 'Results',
  PROGRESS: 'Progress',
  DRIVE_FILES: 'DriveFiles',
  ACTION_SESSIONS: 'ActionSessions'
};

const HEADERS = {};
HEADERS[SHEETS.SETTINGS] = ['Key', 'Value'];
HEADERS[SHEETS.USERS] = ['Id', 'FullName', 'Username', 'PasswordHash', 'Role', 'RegId', 'IsActive', 'IsDeleted', 'CreatedAt', 'CreatedBy', 'DeletedAt', 'DeletedBy', 'RestoredAt', 'RestoredBy'];
HEADERS[SHEETS.SESSIONS] = ['Token', 'Username', 'Role', 'CreatedAt', 'ExpiresAt', 'IsActive'];
HEADERS[SHEETS.CANDIDATES] = ['FullName', 'RegId', 'CreatedAt', 'UpdatedAt', 'PassportUrl'];
HEADERS[SHEETS.EXAMS] = ['ExamCode', 'Title', 'DurationMinutes', 'ShowScoreSummary', 'AllowReview', 'ShuffleQuestions', 'PassMark', 'ResultMessage', 'IsActive', 'IsCurrent', 'IsArchived', 'IsDeleted', 'ExamLocked', 'LockNotice', 'CreatedAt', 'CreatedBy', 'UpdatedAt', 'CaptureSnapshots', 'RecordAudio', 'RecordVideo', 'RecordScreen'];
HEADERS[SHEETS.QUESTIONS] = ['Id', 'ExamCode', 'Question', 'ImageUrl', 'OptionA', 'OptionB', 'OptionC', 'OptionD', 'Answer', 'IsDeleted', 'DriveFileId', 'SourceUrl', 'CreatedAt', 'UpdatedAt'];
HEADERS[SHEETS.PERMISSION_CODES] = ['PermissionCode', 'ExamCode', 'RegId', 'Username', 'Reason', 'Status', 'UsedAt', 'CreatedAt', 'CreatedBy'];
HEADERS[SHEETS.RESULTS] = ['Id', 'Timestamp', 'ExamCode', 'AttemptNo', 'FullName', 'RegId', 'Username', 'Score', 'Total', 'Percentage', 'PassMark', 'ShowScoreSummary', 'AllowReview', 'PassStatus', 'Ranking', 'PassedNos', 'FailedNos', 'AnswersJson', 'ReviewJson', 'StatusMessage', 'IsPublished', 'PublishedAt', 'PublishedBy', 'IsDeleted', 'DeletedAt', 'DeletedBy', 'RestoredAt', 'RestoredBy'];
HEADERS[SHEETS.PROGRESS] = ['ExamCode', 'RegId', 'FullName', 'RemainingSeconds', 'AnswersJson', 'UpdatedAt'];
HEADERS[SHEETS.DRIVE_FILES] = ['Id', 'Kind', 'OriginalName', 'DriveFileId', 'DriveUrl', 'ExamCode', 'RegId', 'Username', 'MetaJson', 'CreatedAt', 'IsDeleted', 'DeletedAt', 'DeletedBy', 'RestoredAt', 'RestoredBy'];
HEADERS[SHEETS.ACTION_SESSIONS] = ['SessionToken', 'Username', 'Role', 'CreatedAt', 'ExpiresAt', 'IsActive'];

function doGet(e) {
  return handleRequest_(e && e.parameter ? e.parameter : {});
}

function doPost(e) {
  var params = {};
  if (e && e.parameter) params = e.parameter;
  if (e && e.postData && e.postData.contents) {
    try {
      var body = JSON.parse(e.postData.contents);
      if (body && typeof body === 'object') params = body;
    } catch (err) {}
  }
  return handleRequest_(params || {});
}

function handleRequest_(params) {
  try {
    ensureSystem_();
    var action = trim_(params.action || '');
    var payload = parsePayload_(params.payload);
    payload = mergePayload_(params, payload);
    var result;

    switch (action) {
      case 'signup': result = signup_(payload); break;
      case 'login': result = login_(payload); break;
      case 'logout': result = logout_(payload); break;
      case 'validateSession': result = validateSession_(payload); break;
      case 'changePassword': result = changePassword_(payload); break;
      case 'resetForgottenPassword': result = resetForgottenPassword_(payload); break;
      case 'adminResetUserPassword': result = adminResetUserPassword_(payload); break;
      case 'saveSubadminActionToken': result = saveSubadminActionToken_(payload); break;
      case 'activateSubadminActionToken': result = activateSubadminActionTokenSession_(payload); break;

      case 'getSettings': result = getSettings_(payload); break;
      case 'saveSettings': result = saveSettings_(payload); break;

      case 'createExam': result = createExam_(payload); break;
      case 'listExams': result = listExams_(payload); break;
      case 'setExamOptions': result = setExamOptions_(payload); break;
      case 'setExamActive': result = setExamActive_(payload); break;
      case 'archiveExam': result = archiveExam_(payload); break;
      case 'deleteExam': result = deleteExam_(payload); break;
      case 'restoreExam': result = restoreExam_(payload); break;
      case 'hardDeleteExam': result = hardDeleteExam_(payload); break;
      case 'bulkHardDeleteExams': result = bulkHardDeleteExams_(payload); break;
      case 'setExamLock': result = setExamLock_(payload); break;
      case 'duplicateExam': result = duplicateExam_(payload); break;
      case 'getCurrentExamPublic': result = getCurrentExamPublic_(payload); break;

      case 'addCandidate': result = addCandidate_(payload); break;
      case 'importCandidates': result = importCandidates_(payload); break;
      case 'listCandidates': result = listCandidates_(payload); break;

      case 'generateStudentAccounts': result = generateStudentAccounts_(payload); break;
      case 'listAdmins': result = listAdmins_(payload); break;
      case 'listStudents': result = listStudents_(payload); break;
      case 'setUserActive': result = setUserActive_(payload); break;
      case 'deleteUser': result = deleteUser_(payload); break;
      case 'restoreUser': result = restoreUser_(payload); break;
      case 'hardDeleteUser': result = hardDeleteUser_(payload); break;

      case 'addQuestion': result = addQuestion_(payload); break;
      case 'updateQuestionByExam': result = updateQuestionByExam_(payload); break;
      case 'deleteQuestionByExam': result = deleteQuestionByExam_(payload); break;
      case 'restoreQuestionByExam': result = restoreQuestionByExam_(payload); break;
      case 'hardDeleteQuestionByExam': result = hardDeleteQuestionByExam_(payload); break;
      case 'importQuestions': result = importQuestions_(payload); break;
      case 'clearQuestionsByExam': result = clearQuestionsByExam_(payload); break;
      case 'bulkDeleteQuestionsByExam': result = bulkDeleteQuestionsByExam_(payload); break;
      case 'bulkRestoreQuestionsByExam': result = bulkRestoreQuestionsByExam_(payload); break;
      case 'bulkHardDeleteQuestionsByExam': result = bulkHardDeleteQuestionsByExam_(payload); break;
      case 'listQuestionsByExam': result = listQuestionsByExam_(payload); break;

      case 'createPermissionCode': result = createPermissionCode_(payload); break;
      case 'listPermissionCodes': result = listPermissionCodes_(payload); break;
      case 'deletePermissionCode': result = deletePermissionCode_(payload); break;
      case 'clearPermissionCodes': result = clearPermissionCodes_(payload); break;

      case 'verifyCandidate': result = verifyCandidate_(payload); break;
      case 'unlockExam': result = unlockExam_(payload); break;
      case 'autosaveProgress': result = autosaveProgress_(payload); break;
      case 'resumeProgress': result = resumeProgress_(payload); break;
      case 'submitExam': result = submitExam_(payload); break;
      case 'uploadSnapshot': result = uploadSnapshot_(payload); break;
      case 'uploadAudioClip': result = uploadAudioClip_(payload); break;
      case 'uploadVideoClip': result = uploadVideoClip_(payload); break;
      case 'uploadScreenClip': result = uploadScreenClip_(payload); break;

      case 'listResultsByExam': result = listResultsByExam_(payload); break;
      case 'setResultPublished': result = setResultPublished_(payload); break;
      case 'bulkSetResultPublished': result = bulkSetResultPublished_(payload); break;
      case 'deleteResult': result = deleteResult_(payload); break;
      case 'restoreResult': result = restoreResult_(payload); break;
      case 'hardDeleteResult': result = hardDeleteResult_(payload); break;
      case 'bulkDeleteResults': result = bulkDeleteResults_(payload); break;
      case 'bulkRestoreResults': result = bulkRestoreResults_(payload); break;
      case 'bulkHardDeleteResults': result = bulkHardDeleteResults_(payload); break;
      case 'listSnapshotsByExam': result = listSnapshotsByExam_(payload); break;
      case 'deleteSnapshot': result = deleteSnapshot_(payload); break;
      case 'restoreSnapshot': result = restoreSnapshot_(payload); break;
      case 'hardDeleteSnapshot': result = hardDeleteSnapshot_(payload); break;
      case 'bulkDeleteSnapshots': result = bulkDeleteSnapshots_(payload); break;
      case 'bulkRestoreSnapshots': result = bulkRestoreSnapshots_(payload); break;
      case 'bulkHardDeleteSnapshots': result = bulkHardDeleteSnapshots_(payload); break;
      case 'listAudioByExam': result = listAudioByExam_(payload); break;
      case 'listVideosByExam': result = listVideosByExam_(payload); break;
      case 'getProctoringFolderView': result = getProctoringFolderView_(payload); break;
      case 'deleteVideo': result = deleteVideo_(payload); break;
      case 'restoreVideo': result = restoreVideo_(payload); break;
      case 'hardDeleteVideo': result = hardDeleteVideo_(payload); break;
      case 'bulkDeleteVideos': result = bulkDeleteVideos_(payload); break;
      case 'bulkRestoreVideos': result = bulkRestoreVideos_(payload); break;
      case 'bulkHardDeleteVideos': result = bulkHardDeleteVideos_(payload); break;
      case 'exportResultsByExam': result = exportResultsByExam_(payload); break;
      case 'checkResultPublic': result = checkResultPublic_(payload); break;
      case 'checkResultPublicById': result = checkResultPublicById_(payload); break;
      case 'listPublishedResultsForStudent': result = listPublishedResultsForStudent_(payload); break;
      case 'getPublicSiteContent': result = getPublicSiteContent_(payload); break;

      default:
        result = response_(false, 'Invalid or missing action.');
    }
    return jsonOutput_(result);
  } catch (error) {
    return jsonOutput_(response_(false, error && error.message ? error.message : 'Server error.'));
  }
}

function parsePayload_(raw) {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw); } catch (err) { return {}; }
}

function mergePayload_(params, payload) {
  var out = {};
  var key;
  for (key in payload) out[key] = payload[key];
  for (key in params) {
    if (key === 'action' || key === 'payload') continue;
    if (out[key] === undefined || out[key] === null || out[key] === '') out[key] = params[key];
  }
  return out;
}

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function response_(ok, message, data) {
  return { ok: !!ok, message: message || '', data: data || null };
}

function nowIso_() {
  return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss');
}

function trim_(value) {
  return String(value == null ? '' : value).trim();
}

function normalizeImageUrl_(value) {
  var url = trim_(value);
  if (!url) return '';
  var match = url.match(/drive\.google\.com\/file\/d\/([^\/]+)/i);
  if (!match) match = url.match(/[?&]id=([^&]+)/i);
  if (!match) match = url.match(/drive\.google\.com\/open\?id=([^&]+)/i);
  if (!match) match = url.match(/uc\?export=(?:view|download)&id=([^&]+)/i);
  if (match && match[1]) return 'https://drive.google.com/uc?export=view&id=' + match[1];
  return url;
}

function normalize_(value) {
  return trim_(value).replace(/\s+/g, ' ').toUpperCase();
}

function toBool_(value) {
  if (typeof value === 'boolean') return value;
  var t = normalize_(value);
  return t === 'TRUE' || t === 'YES' || t === '1' || t === 'ON';
}

function toNum_(value, fallback) {
  var n = Number(value);
  return isFinite(n) ? n : fallback;
}


function parseJsonArraySafe_(raw) {
  var text = trim_(raw);
  if (!text) return [];
  try {
    var parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

function normalizeMediaObjectUrls_(list) {
  return (list || []).map(function(item){
    var out = item || {};
    ['imageUrl','logoUrl','videoUrl','thumbUrl','avatarUrl','iconUrl','profileUrl'].forEach(function(key){
      if (out[key] != null) out[key] = normalizeImageUrl_(out[key]);
    });
    return out;
  });
}

function toMultilineText_(value) {
  return String(value == null ? '' : value).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function getSubadminTokenTtlMinutes_() {
  return Math.max(5, Math.min(1440, toNum_(getSettingsMap_()['Subadmin Action Token TTL Minutes'], 60)));
}

function getActionSessionRows_() {
  return getObjects_(SHEETS.ACTION_SESSIONS);
}

function saveActionSessionRows_(rows) {
  writeObjects_(SHEETS.ACTION_SESSIONS, rows || []);
}

function deactivateActionSessionsForUsername_(username) {
  var rows = getActionSessionRows_();
  var changed = false;
  var key = normalize_(username);
  for (var i = 0; i < rows.length; i++) {
    if (normalize_(rows[i].Username) === key && toBool_(rows[i].IsActive)) {
      rows[i].IsActive = false;
      changed = true;
    }
  }
  if (changed) saveActionSessionRows_(rows);
}

function createSubadminActionSession_(user) {
  deactivateActionSessionsForUsername_(user.Username);
  var rows = getActionSessionRows_();
  var created = new Date();
  var ttl = getSubadminTokenTtlMinutes_();
  var expires = new Date(created.getTime() + ttl * 60 * 1000);
  var sessionToken = Utilities.getUuid();
  rows.push({
    SessionToken: sessionToken,
    Username: user.Username,
    Role: user.Role,
    CreatedAt: created.toISOString(),
    ExpiresAt: expires.toISOString(),
    IsActive: true
  });
  saveActionSessionRows_(rows);
  return { actionSessionToken: sessionToken, actionSessionExpiresAt: expires.toISOString(), subadminActionTokenTtlMinutes: ttl };
}

function requireValidSubadminActionSession_(user, actionSessionToken) {
  var token = trim_(actionSessionToken);
  if (!token) throw new Error('Subadmin action token session is required for this action.');
  var rows = getActionSessionRows_();
  var now = new Date().getTime();
  for (var i = 0; i < rows.length; i++) {
    if (trim_(rows[i].SessionToken) !== token || !toBool_(rows[i].IsActive)) continue;
    if (normalize_(rows[i].Username) !== normalize_(user.Username)) continue;
    var exp = new Date(String(rows[i].ExpiresAt || '')).getTime();
    if (isFinite(exp) && exp > now) return rows[i];
  }
  throw new Error('Your subadmin action token session has expired. Enter the action token again.');
}

function validateJsonArrayText_(raw, label) {
  var text = trim_(raw);
  if (!text) return '';
  try {
    var parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return label + ' must be a JSON array.';
  } catch (err) {
    return label + ' must be valid JSON.';
  }
  return '';
}

function getPublicSiteContent_() {
  var map = getSettingsMap_();
  return response_(true, 'Public site content loaded.', {
    resultBrandName: trim_(map['Result Brand Name']) || 'Genz EduTech Innovations',
    resultBrandLogoUrl: normalizeImageUrl_(map['Result Brand Logo URL']),
    siteFaviconUrl: normalizeImageUrl_(map['Site Favicon URL']) || normalizeImageUrl_(map['Result Brand Logo URL']),
    siteHeroTitle: trim_(map['Site Hero Title']) || 'Genz CBT Pro',
    siteHeroSubtitle: trim_(map['Site Hero Subtitle']) || 'A modern CBT and result platform for schools, tutorial centres, and institutions.',
    siteHeroBadge: trim_(map['Site Hero Badge']) || 'Trusted digital assessment experience',
    siteAboutTitle: trim_(map['Site About Title']) || 'About Genz CBT Pro',
    siteAboutText: toMultilineText_(map['Site About Text']),
    ceoName: trim_(map['CEO Name']) || 'CEO, Genz EduTech Innovations',
    ceoTitle: trim_(map['CEO Title']) || 'Founder & Chief Executive Officer',
    ceoImageUrl: normalizeImageUrl_(map['CEO Image URL']),
    ceoBio: toMultilineText_(map['CEO Bio']),
    contributors: normalizeMediaObjectUrls_(parseJsonArraySafe_(map['Contributors JSON'])),
    institutions: normalizeMediaObjectUrls_(parseJsonArraySafe_(map['Institutions JSON'])),
    testimonials: normalizeMediaObjectUrls_(parseJsonArraySafe_(map['Testimonials JSON'])),
    tutorialVideos: normalizeMediaObjectUrls_(parseJsonArraySafe_(map['Tutorial Videos JSON'])),
    socialLinks: normalizeMediaObjectUrls_(parseJsonArraySafe_(map['Social Links JSON'])),
    contactEmail: trim_(map['Contact Email']),
    contactPhone: trim_(map['Contact Phone']),
    contactAddress: toMultilineText_(map['Contact Address']),
    termsContent: toMultilineText_(map['Terms Content']),
    privacyContent: toMultilineText_(map['Privacy Content']),
    cookiesContent: toMultilineText_(map['Cookies Content'])
  });
}

function hashPassword_(password) {
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, trim_(password), Utilities.Charset.UTF_8);
  return Utilities.base64EncodeWebSafe(raw);
}

function randomCode_(prefix) {
  return prefix + '-' + Utilities.getUuid().replace(/-/g, '').slice(0, 8).toUpperCase();
}

function randomPassword_(len) {
  len = Math.max(6, toNum_(len, 8));
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#';
  var out = '';
  for (var i = 0; i < len; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return out;
}

function getSpreadsheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getOrCreateSheet_(name) {
  var ss = getSpreadsheet_();
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  return sh;
}

function ensureHeader_(sheetName) {
  var sh = getOrCreateSheet_(sheetName);
  var wanted = HEADERS[sheetName];
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, wanted.length).setValues([wanted]);
    return;
  }
  if (sh.getMaxColumns() < wanted.length) {
    sh.insertColumnsAfter(sh.getMaxColumns(), wanted.length - sh.getMaxColumns());
  }
  sh.getRange(1, 1, 1, wanted.length).setValues([wanted]);
}

function ensureSystem_() {
  var names = Object.keys(SHEETS).map(function(k){ return SHEETS[k]; });
  for (var i = 0; i < names.length; i++) ensureHeader_(names[i]);

  var settings = getObjects_(SHEETS.SETTINGS);
  if (!settings.length) {
    appendObject_(SHEETS.SETTINGS, { Key: 'Portal Locked', Value: 'false' });
    appendObject_(SHEETS.SETTINGS, { Key: 'Portal Notice', Value: '' });
  }
  var defaults = {
    'Result Brand Name': 'Genz EduTech Innovations',
    'Result Brand Logo URL': '',
    'Result Signature URL': '',
    'Site Favicon URL': '',
    'Site Hero Title': 'Genz CBT Pro',
    'Site Hero Subtitle': 'A modern CBT and result platform for schools, tutorial centres, and institutions.',
    'Site Hero Badge': 'Trusted digital assessment experience',
    'Site About Title': 'About Genz CBT Pro',
    'Site About Text': 'Genz CBT Pro helps schools run secure exams, manage results, and present professional report slips online.',
    'CEO Name': 'CEO, Genz EduTech Innovations',
    'CEO Title': 'Founder & Chief Executive Officer',
    'CEO Image URL': '',
    'CEO Bio': 'Add the CEO biography here from the admin portal settings.',
    'Contributors JSON': '[]',
    'Institutions JSON': '[]',
    'Testimonials JSON': '[]',
    'Tutorial Videos JSON': '[]',
    'Social Links JSON': '[]',
    'Contact Email': '',
    'Contact Phone': '',
    'Contact Address': '',
    'Terms Content': 'Add your terms and conditions here from the admin portal.',
    'Privacy Content': 'Add your privacy policy here from the admin portal.',
    'Cookies Content': 'Add your cookies policy here from the admin portal.',
    'Subadmin Action Token TTL Minutes': '60'
  };
  var settingsMap = getSettingsMap_();
  for (var key in defaults) {
    if (defaults.hasOwnProperty(key) && String(settingsMap[key] || '') === '') upsertSetting_(key, defaults[key]);
  }
}

function authorizeDriveAccess_() {
  ensureSystem_();
  var folder = getRootFolder_();
  return 'Drive authorization completed. Root folder: ' + folder.getName();
}

function getObjects_(sheetName) {
  var sh = getOrCreateSheet_(sheetName);
  var values = sh.getDataRange().getValues();
  if (!values.length) return [];
  var headers = values[0];
  var rows = [];
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var hasAny = false;
    for (var c = 0; c < row.length; c++) {
      if (String(row[c] || '') !== '') { hasAny = true; break; }
    }
    if (!hasAny) continue;
    var obj = {};
    for (var h = 0; h < headers.length; h++) obj[headers[h]] = row[h];
    obj._row = r + 1;
    rows.push(obj);
  }
  return rows;
}

function writeObjects_(sheetName, objects) {
  var sh = getOrCreateSheet_(sheetName);
  var headers = HEADERS[sheetName];
  sh.clearContents();
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (!objects || !objects.length) return;
  var values = objects.map(function(obj){
    return headers.map(function(key){ return obj[key] != null ? obj[key] : ''; });
  });
  sh.getRange(2, 1, values.length, headers.length).setValues(values);
}

function appendObject_(sheetName, obj) {
  var sh = getOrCreateSheet_(sheetName);
  var headers = HEADERS[sheetName];
  var row = headers.map(function(key){ return obj[key] != null ? obj[key] : ''; });
  sh.appendRow(row);
}

function upsertSetting_(key, value) {
  var rows = getObjects_(SHEETS.SETTINGS);
  var found = false;
  for (var i = 0; i < rows.length; i++) {
    if (trim_(rows[i].Key) === key) {
      rows[i].Value = value;
      found = true;
      break;
    }
  }
  if (!found) rows.push({ Key: key, Value: value });
  writeObjects_(SHEETS.SETTINGS, rows);
}

function getSettingsMap_() {
  var rows = getObjects_(SHEETS.SETTINGS);
  var map = {};
  for (var i = 0; i < rows.length; i++) map[trim_(rows[i].Key)] = rows[i].Value;
  return map;
}

function getUsers_() { return getObjects_(SHEETS.USERS); }
function saveUsers_(rows) { writeObjects_(SHEETS.USERS, rows); }
function getExams_() { return getObjects_(SHEETS.EXAMS); }
function saveExams_(rows) { writeObjects_(SHEETS.EXAMS, rows); }
function getQuestions_() { return getObjects_(SHEETS.QUESTIONS); }
function saveQuestions_(rows) { writeObjects_(SHEETS.QUESTIONS, rows); }
function getCandidates_() { return getObjects_(SHEETS.CANDIDATES); }
function saveCandidates_(rows) { writeObjects_(SHEETS.CANDIDATES, rows); }
function getResults_() { return getObjects_(SHEETS.RESULTS); }
function saveResults_(rows) { writeObjects_(SHEETS.RESULTS, rows); }
function getProgressRows_() { return getObjects_(SHEETS.PROGRESS); }
function saveProgressRows_(rows) { writeObjects_(SHEETS.PROGRESS, rows); }
function getPermissionRows_() { return getObjects_(SHEETS.PERMISSION_CODES); }
function savePermissionRows_(rows) { writeObjects_(SHEETS.PERMISSION_CODES, rows); }
function getSessionRows_() { return getObjects_(SHEETS.SESSIONS); }
function saveSessionRows_(rows) { writeObjects_(SHEETS.SESSIONS, rows); }
function getDriveFileRows_() { return getObjects_(SHEETS.DRIVE_FILES); }
function saveDriveFileRows_(rows) { writeObjects_(SHEETS.DRIVE_FILES, rows); }

function findUserByUsername_(username) {
  var key = normalize_(username);
  var users = getUsers_();
  for (var i = 0; i < users.length; i++) {
    if (normalize_(users[i].Username) === key) return users[i];
  }
  return null;
}

function findStudentByRegId_(regId) {
  var key = normalize_(regId);
  var users = getUsers_();
  for (var i = 0; i < users.length; i++) {
    if ((users[i].Role === 'student') && normalize_(users[i].RegId) === key && !toBool_(users[i].IsDeleted)) return users[i];
  }
  return null;
}

function findCandidateByRegId_(regId) {
  var key = normalize_(regId);
  var list = getCandidates_();
  for (var i = 0; i < list.length; i++) {
    if (normalize_(list[i].RegId) === key) return list[i];
  }
  return null;
}

function findExam_(examCode) {
  var key = normalize_(examCode);
  var exams = getExams_();
  for (var i = 0; i < exams.length; i++) {
    if (normalize_(exams[i].ExamCode) === key) return exams[i];
  }
  return null;
}

function principalAdmins_() {
  return getUsers_().filter(function(u){ return u.Role === 'principal_admin' && !toBool_(u.IsDeleted); });
}

function nameSortValue_(value) {
  return String(value == null ? '' : value).trim().toLowerCase();
}

function sortByFullName_(list) {
  list.sort(function(a, b){
    return nameSortValue_(a.fullName || a.FullName).localeCompare(nameSortValue_(b.fullName || b.FullName));
  });
  return list;
}

function ordinal_(n) {
  n = Math.max(0, toNum_(n, 0));
  var mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return n + 'st';
  if (mod10 === 2 && mod100 !== 12) return n + 'nd';
  if (mod10 === 3 && mod100 !== 13) return n + 'rd';
  return n + 'th';
}

function shuffleArrayCopy_(items) {
  var arr = (items || []).slice();
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function uniqueStrings_(arr) {
  var out = [];
  var seen = {};
  (arr || []).forEach(function(item){
    var key = String(item || '');
    if (!key || seen[key]) return;
    seen[key] = true;
    out.push(key);
  });
  return out;
}

function activePublishedResult_(row) {
  return row && !toBool_(row.IsDeleted) && toBool_(row.IsPublished);
}

function getResultBranding_() {
  var map = getSettingsMap_();
  return {
    brandName: trim_(map['Result Brand Name']) || 'Genz EduTech Innovations',
    brandLogoUrl: normalizeImageUrl_(map['Result Brand Logo URL']),
    signatureUrl: normalizeImageUrl_(map['Result Signature URL'])
  };
}

function normalizeIdList_(arr) {
  return uniqueStrings_(Array.isArray(arr) ? arr.map(function(v){ return trim_(v); }) : []);
}


function studentUsernameBase_(regId) {
  var raw = trim_(regId).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  if (!raw) raw = 'student';
  return 'stu_' + raw;
}

function usernameExists_(users, username, ignoreUserId) {
  var key = normalize_(username);
  for (var i = 0; i < users.length; i++) {
    if (ignoreUserId && String(users[i].Id || '') === String(ignoreUserId)) continue;
    if (normalize_(users[i].Username) === key) return true;
  }
  return false;
}

function buildStudentUsername_(users, regId, preferred, ignoreUserId) {
  var base = trim_(preferred) || studentUsernameBase_(regId);
  if (!usernameExists_(users, base, ignoreUserId)) return base;
  var seed = studentUsernameBase_(regId);
  if (!usernameExists_(users, seed, ignoreUserId)) return seed;
  for (var i = 2; i < 10000; i++) {
    var candidate = seed + '_' + i;
    if (!usernameExists_(users, candidate, ignoreUserId)) return candidate;
  }
  return seed + '_' + new Date().getTime();
}

function findStudentUserIndexByRegId_(users, regId) {
  var key = normalize_(regId);
  for (var i = 0; i < users.length; i++) {
    if (users[i].Role === 'student' && normalize_(users[i].RegId || users[i].Username) === key) return i;
  }
  return -1;
}

function ensureStudentShadowUser_(users, fullName, regId, actorUsername) {
  var idx = findStudentUserIndexByRegId_(users, regId);
  if (idx >= 0) {
    if (!trim_(users[idx].FullName)) users[idx].FullName = fullName;
    if (!trim_(users[idx].RegId)) users[idx].RegId = regId;
    if (!trim_(users[idx].Username) || normalize_(users[idx].Username) === normalize_(regId)) {
      users[idx].Username = buildStudentUsername_(users, regId, '', users[idx].Id);
    }
    return false;
  }
  users.push({
    Id: Utilities.getUuid(),
    FullName: fullName,
    Username: buildStudentUsername_(users, regId),
    PasswordHash: '',
    Role: 'student',
    RegId: regId,
    IsActive: false,
    IsDeleted: false,
    CreatedAt: nowIso_(),
    CreatedBy: actorUsername || 'system',
    DeletedAt: '',
    DeletedBy: '',
    RestoredAt: '',
    RestoredBy: ''
  });
  return true;
}

function roleCanManageUser_(actorRole, targetRole) {
  if (actorRole === 'principal_admin') return true;
  if (actorRole === 'subadmin') return targetRole === 'student';
  return false;
}

function requireSession_(token, allowedRoles) {
  var t = trim_(token);
  if (!t) throw new Error('Session token is required.');
  var sessions = getSessionRows_();
  var now = new Date().getTime();
  var matched = null;
  for (var i = 0; i < sessions.length; i++) {
    if (trim_(sessions[i].Token) === t && toBool_(sessions[i].IsActive)) {
      var exp = new Date(String(sessions[i].ExpiresAt || '')).getTime();
      if (isFinite(exp) && exp > now) {
        matched = sessions[i];
        break;
      }
    }
  }
  if (!matched) throw new Error('Your session has expired. Please log in again.');
  var user = findUserByUsername_(matched.Username);
  if (!user || toBool_(user.IsDeleted) || !toBool_(user.IsActive)) throw new Error('Your account is inactive.');
  if (allowedRoles && allowedRoles.length) {
    var ok = false;
    for (var j = 0; j < allowedRoles.length; j++) {
      if (user.Role === allowedRoles[j]) { ok = true; break; }
      if (allowedRoles[j] === 'admin' && (user.Role === 'principal_admin' || user.Role === 'subadmin' || user.Role === 'admin')) { ok = true; break; }
    }
    if (!ok) throw new Error('You do not have permission to perform this action.');
  }
  return { session: matched, user: user };
}

function createSession_(user) {
  var sessions = getSessionRows_();
  for (var i = 0; i < sessions.length; i++) {
    if (normalize_(sessions[i].Username) === normalize_(user.Username)) sessions[i].IsActive = false;
  }
  var created = new Date();
  var expires = new Date(created.getTime() + SESSION_HOURS * 60 * 60 * 1000);
  var token = Utilities.getUuid();
  sessions.push({
    Token: token,
    Username: user.Username,
    Role: user.Role,
    CreatedAt: created.toISOString(),
    ExpiresAt: expires.toISOString(),
    IsActive: true
  });
  saveSessionRows_(sessions);
  return { token: token, username: user.Username, role: user.Role, fullName: user.FullName || '' };
}

function signup_(payload) {
  var fullName = trim_(payload.fullName);
  var username = trim_(payload.username);
  var password = trim_(payload.password);
  var role = trim_(payload.role).toLowerCase();
  if (!fullName || !username || !password) return response_(false, 'Full name, username, and password are required.');
  if (findUserByUsername_(username)) return response_(false, 'That username already exists.');

  var users = getUsers_();
  var now = nowIso_();
  var userRole = role;
  var createdBy = 'self';
  var regId = trim_(payload.regId);

  if (role === 'admin') {
    var principals = principalAdmins_();
    if (!principals.length) {
      if (trim_(payload.adminKey) !== ADMIN_SIGNUP_KEY) return response_(false, 'Invalid admin signup key.');
      userRole = 'principal_admin';
      createdBy = 'initial_setup';
    } else {
      var actor;
      try {
        actor = requireSession_(payload.token, ['principal_admin']).user;
      } catch (err) {
        return response_(false, 'Public admin signup is disabled. A principal admin must add subadmins from the dashboard.');
      }
      userRole = 'subadmin';
      createdBy = actor.Username;
    }
  } else if (role === 'subadmin') {
    var creator = requireSession_(payload.token, ['principal_admin']).user;
    userRole = 'subadmin';
    createdBy = creator.Username;
  } else if (role === 'student') {
    userRole = 'student';
    createdBy = 'self';
  } else {
    return response_(false, 'Invalid signup role.');
  }

  users.push({
    Id: Utilities.getUuid(),
    FullName: fullName,
    Username: username,
    PasswordHash: hashPassword_(password),
    Role: userRole,
    RegId: regId,
    IsActive: true,
    IsDeleted: false,
    CreatedAt: now,
    CreatedBy: createdBy,
    DeletedAt: '',
    DeletedBy: '',
    RestoredAt: '',
    RestoredBy: ''
  });
  saveUsers_(users);

  var label = userRole === 'principal_admin' ? 'principal admin' : (userRole === 'subadmin' ? 'subadmin' : 'student');
  return response_(true, label.charAt(0).toUpperCase() + label.slice(1) + ' account created successfully.', { username: username, role: userRole });
}

function login_(payload) {
  var username = trim_(payload.username);
  var password = trim_(payload.password);
  var role = trim_(payload.role).toLowerCase();
  if (!username || !password) return response_(false, 'Username and password are required.');
  var user = findUserByUsername_(username);
  if (!user || toBool_(user.IsDeleted)) return response_(false, 'Invalid username or password.');
  if (!toBool_(user.IsActive)) return response_(false, 'This account is inactive.');
  if (user.PasswordHash !== hashPassword_(password)) return response_(false, 'Invalid username or password.');

  if (role === 'admin' && !(user.Role === 'principal_admin' || user.Role === 'subadmin' || user.Role === 'admin')) return response_(false, 'This is not an admin account.');
  if (role === 'student' && user.Role !== 'student') return response_(false, 'This is not a student account.');

  return response_(true, 'Login successful.', createSession_(user));
}

function logout_(payload) {
  var token = trim_(payload.token);
  if (!token) return response_(true, 'Signed out.');
  var sessions = getSessionRows_();
  var username = '';
  for (var i = 0; i < sessions.length; i++) {
    if (trim_(sessions[i].Token) === token) {
      sessions[i].IsActive = false;
      username = trim_(sessions[i].Username);
    }
  }
  saveSessionRows_(sessions);
  if (username) deactivateActionSessionsForUsername_(username);
  return response_(true, 'Signed out successfully.');
}

function validateSession_(payload) {
  try {
    var auth = requireSession_(payload.token, []);
    return response_(true, 'Session is valid.', { username: auth.user.Username, fullName: auth.user.FullName, role: auth.user.Role, regId: auth.user.RegId || '' });
  } catch (err) {
    return response_(false, err.message);
  }
}

function passwordValidationMessage_(password) {
  var cleaned = trim_(password);
  if (!cleaned) return 'New password is required.';
  if (cleaned.length < 6) return 'New password must be at least 6 characters.';
  return '';
}

function getSubadminActionTokenHash_() {
  return trim_(getSettingsMap_()['Subadmin Action Token Hash']);
}

function requireAdminAction_(payload, requireSubadminToken) {
  var auth = requireSession_(payload.token, ['admin']);
  if (requireSubadminToken && auth.user && auth.user.Role === 'subadmin') {
    var expectedHash = getSubadminActionTokenHash_();
    if (!expectedHash) throw new Error('The principal admin has not configured a subadmin action token yet.');
    requireValidSubadminActionSession_(auth.user, payload.actionSessionToken || payload.actionTokenSession);
  }
  return auth;
}

function saveSubadminActionToken_(payload) {
  var actor = requireSession_(payload.token, ['principal_admin']).user;
  var newToken = trim_(payload.newToken);
  if (!newToken) return response_(false, 'Enter a token for subadmins.');
  var issue = passwordValidationMessage_(newToken);
  if (issue) return response_(false, issue.replace('password', 'token'));
  var ttl = Math.max(5, Math.min(1440, toNum_(payload.ttlMinutes, 60)));
  upsertSetting_('Subadmin Action Token Hash', hashPassword_(newToken));
  upsertSetting_('Subadmin Action Token UpdatedAt', nowIso_());
  upsertSetting_('Subadmin Action Token UpdatedBy', actor.Username);
  upsertSetting_('Subadmin Action Token TTL Minutes', String(ttl));
  return response_(true, 'Subadmin action token saved successfully.', { hasSubadminActionToken: true, subadminActionTokenTtlMinutes: ttl });
}

function activateSubadminActionTokenSession_(payload) {
  var auth = requireSession_(payload.token, ['subadmin']);
  var expectedHash = getSubadminActionTokenHash_();
  if (!expectedHash) return response_(false, 'The principal admin has not configured a subadmin action token yet.');
  var providedToken = trim_(payload.actionToken);
  if (!providedToken) return response_(false, 'Enter the token from the principal admin.');
  if (hashPassword_(providedToken) !== expectedHash) return response_(false, 'Invalid subadmin action token.');
  var sessionData = createSubadminActionSession_(auth.user);
  return response_(true, 'Subadmin action access granted.', sessionData);
}

function deactivateSessionsForUsername_(username) {
  var key = normalize_(username);
  var rows = getSessionRows_();
  var changed = false;
  for (var i = 0; i < rows.length; i++) {
    if (normalize_(rows[i].Username) === key && toBool_(rows[i].IsActive)) {
      rows[i].IsActive = false;
      changed = true;
    }
  }
  if (changed) saveSessionRows_(rows);
}

function changePassword_(payload) {
  var auth = requireSession_(payload.token, []);
  var currentPassword = trim_(payload.currentPassword);
  var newPassword = trim_(payload.newPassword);
  if (!currentPassword || !newPassword) return response_(false, 'Current password and new password are required.');
  var passwordIssue = passwordValidationMessage_(newPassword);
  if (passwordIssue) return response_(false, passwordIssue);
  if (auth.user.PasswordHash !== hashPassword_(currentPassword)) return response_(false, 'Current password is incorrect.');
  if (currentPassword === newPassword) return response_(false, 'New password must be different from the current password.');

  var users = getUsers_();
  var updated = null;
  for (var i = 0; i < users.length; i++) {
    if (String(users[i].Id || '') === String(auth.user.Id || '') || normalize_(users[i].Username) === normalize_(auth.user.Username)) {
      users[i].PasswordHash = hashPassword_(newPassword);
      updated = users[i];
      break;
    }
  }
  if (!updated) return response_(false, 'Account not found.');
  saveUsers_(users);
  deactivateSessionsForUsername_(updated.Username);
  var sessionData = createSession_(updated);
  return response_(true, 'Password changed successfully.', sessionData);
}

function resetForgottenPassword_(payload) {
  var username = trim_(payload.username);
  var fullName = trim_(payload.fullName);
  var regId = trim_(payload.regId);
  var role = trim_(payload.role).toLowerCase();
  var newPassword = trim_(payload.newPassword);
  if (!username || !fullName || !newPassword) return response_(false, 'Username, full name, and new password are required.');
  var passwordIssue = passwordValidationMessage_(newPassword);
  if (passwordIssue) return response_(false, passwordIssue);

  var user = findUserByUsername_(username);
  if (!user || toBool_(user.IsDeleted)) return response_(false, 'Account details could not be verified.');
  if (!toBool_(user.IsActive)) return response_(false, 'This account is inactive. Contact the administrator.');
  if (normalize_(user.FullName) !== normalize_(fullName)) return response_(false, 'Account details could not be verified.');

  if (role === 'admin') {
    if (!(user.Role === 'principal_admin' || user.Role === 'subadmin' || user.Role === 'admin')) return response_(false, 'This is not an admin account.');
  } else if (role === 'student') {
    if (user.Role !== 'student') return response_(false, 'This is not a student account.');
    if (!regId || normalize_(user.RegId) !== normalize_(regId)) return response_(false, 'Account details could not be verified.');
  } else {
    return response_(false, 'Invalid account type for password reset.');
  }

  var users = getUsers_();
  for (var i = 0; i < users.length; i++) {
    if (String(users[i].Id || '') === String(user.Id || '') || normalize_(users[i].Username) === normalize_(user.Username)) {
      users[i].PasswordHash = hashPassword_(newPassword);
      saveUsers_(users);
      deactivateSessionsForUsername_(users[i].Username);
      return response_(true, 'Password reset successful. You can now log in with the new password.');
    }
  }
  return response_(false, 'Account not found.');
}

function adminResetUserPassword_(payload) {
  var actor = requireAdminAction_(payload, true).user;
  var username = trim_(payload.username);
  var newPassword = trim_(payload.newPassword);
  if (!username || !newPassword) return response_(false, 'Username and new password are required.');
  var passwordIssue = passwordValidationMessage_(newPassword);
  if (passwordIssue) return response_(false, passwordIssue);

  var target = findUserByUsername_(username);
  if (!target || toBool_(target.IsDeleted)) return response_(false, 'User not found.');
  if (!roleCanManageUser_(actor.Role, target.Role)) return response_(false, "You do not have permission to reset this user's password.");
  if (target.Role === 'principal_admin') return response_(false, 'Principal admin passwords must be changed by the account owner.');

  var users = getUsers_();
  for (var i = 0; i < users.length; i++) {
    if (String(users[i].Id || '') === String(target.Id || '') || normalize_(users[i].Username) === normalize_(target.Username)) {
      users[i].PasswordHash = hashPassword_(newPassword);
      saveUsers_(users);
      deactivateSessionsForUsername_(users[i].Username);
      return response_(true, 'Password reset successfully for ' + users[i].Username + '.');
    }
  }
  return response_(false, 'User not found.');
}

function getSettings_() {
  var map = getSettingsMap_();
  return response_(true, 'Settings loaded.', {
    portalLocked: toBool_(map['Portal Locked']),
    portalNotice: trim_(map['Portal Notice']),
    resultBrandName: trim_(map['Result Brand Name']) || 'Genz EduTech Innovations',
    resultBrandLogoUrl: trim_(map['Result Brand Logo URL']),
    resultSignatureUrl: trim_(map['Result Signature URL']),
    siteFaviconUrl: trim_(map['Site Favicon URL']),
    siteHeroTitle: trim_(map['Site Hero Title']) || 'Genz CBT Pro',
    siteHeroSubtitle: trim_(map['Site Hero Subtitle']) || 'A modern CBT and result platform for schools, tutorial centres, and institutions.',
    siteHeroBadge: trim_(map['Site Hero Badge']) || 'Trusted digital assessment experience',
    siteAboutTitle: trim_(map['Site About Title']) || 'About Genz CBT Pro',
    siteAboutText: toMultilineText_(map['Site About Text']),
    ceoName: trim_(map['CEO Name']) || 'CEO, Genz EduTech Innovations',
    ceoTitle: trim_(map['CEO Title']) || 'Founder & Chief Executive Officer',
    ceoImageUrl: trim_(map['CEO Image URL']),
    ceoBio: toMultilineText_(map['CEO Bio']),
    contributorsJsonText: trim_(map['Contributors JSON']) || '[]',
    institutionsJsonText: trim_(map['Institutions JSON']) || '[]',
    testimonialsJsonText: trim_(map['Testimonials JSON']) || '[]',
    tutorialVideosJsonText: trim_(map['Tutorial Videos JSON']) || '[]',
    socialLinksJsonText: trim_(map['Social Links JSON']) || '[]',
    contactEmail: trim_(map['Contact Email']),
    contactPhone: trim_(map['Contact Phone']),
    contactAddress: toMultilineText_(map['Contact Address']),
    termsContent: toMultilineText_(map['Terms Content']),
    privacyContent: toMultilineText_(map['Privacy Content']),
    cookiesContent: toMultilineText_(map['Cookies Content']),
    hasSubadminActionToken: !!trim_(map['Subadmin Action Token Hash']),
    subadminActionTokenTtlMinutes: getSubadminTokenTtlMinutes_()
  });
}

function saveSettings_(payload) {
  requireAdminAction_(payload, true);
  var validations = [
    validateJsonArrayText_(payload.contributorsJsonText, 'Contributors JSON'),
    validateJsonArrayText_(payload.institutionsJsonText, 'Institutions JSON'),
    validateJsonArrayText_(payload.testimonialsJsonText, 'Testimonials JSON'),
    validateJsonArrayText_(payload.tutorialVideosJsonText, 'Tutorial Videos JSON'),
    validateJsonArrayText_(payload.socialLinksJsonText, 'Social Links JSON')
  ].filter(function(x){ return !!x; });
  if (validations.length) return response_(false, validations[0]);
  upsertSetting_('Portal Locked', String(toBool_(payload.portalLocked)));
  upsertSetting_('Portal Notice', trim_(payload.portalNotice));
  upsertSetting_('Result Brand Name', trim_(payload.resultBrandName) || 'Genz EduTech Innovations');
  upsertSetting_('Result Brand Logo URL', normalizeImageUrl_(payload.resultBrandLogoUrl));
  upsertSetting_('Result Signature URL', normalizeImageUrl_(payload.resultSignatureUrl));
  upsertSetting_('Site Favicon URL', normalizeImageUrl_(payload.siteFaviconUrl));
  upsertSetting_('Site Hero Title', trim_(payload.siteHeroTitle) || 'Genz CBT Pro');
  upsertSetting_('Site Hero Subtitle', trim_(payload.siteHeroSubtitle) || 'A modern CBT and result platform for schools, tutorial centres, and institutions.');
  upsertSetting_('Site Hero Badge', trim_(payload.siteHeroBadge) || 'Trusted digital assessment experience');
  upsertSetting_('Site About Title', trim_(payload.siteAboutTitle) || 'About Genz CBT Pro');
  upsertSetting_('Site About Text', toMultilineText_(payload.siteAboutText));
  upsertSetting_('CEO Name', trim_(payload.ceoName) || 'CEO, Genz EduTech Innovations');
  upsertSetting_('CEO Title', trim_(payload.ceoTitle) || 'Founder & Chief Executive Officer');
  upsertSetting_('CEO Image URL', normalizeImageUrl_(payload.ceoImageUrl));
  upsertSetting_('CEO Bio', toMultilineText_(payload.ceoBio));
  upsertSetting_('Contributors JSON', trim_(payload.contributorsJsonText) || '[]');
  upsertSetting_('Institutions JSON', trim_(payload.institutionsJsonText) || '[]');
  upsertSetting_('Testimonials JSON', trim_(payload.testimonialsJsonText) || '[]');
  upsertSetting_('Tutorial Videos JSON', trim_(payload.tutorialVideosJsonText) || '[]');
  upsertSetting_('Social Links JSON', trim_(payload.socialLinksJsonText) || '[]');
  upsertSetting_('Contact Email', trim_(payload.contactEmail));
  upsertSetting_('Contact Phone', trim_(payload.contactPhone));
  upsertSetting_('Contact Address', toMultilineText_(payload.contactAddress));
  upsertSetting_('Terms Content', toMultilineText_(payload.termsContent));
  upsertSetting_('Privacy Content', toMultilineText_(payload.privacyContent));
  upsertSetting_('Cookies Content', toMultilineText_(payload.cookiesContent));
  if (payload.subadminActionTokenTtlMinutes !== undefined && payload.subadminActionTokenTtlMinutes !== null && payload.subadminActionTokenTtlMinutes !== '') {
    upsertSetting_('Subadmin Action Token TTL Minutes', String(Math.max(5, Math.min(1440, toNum_(payload.subadminActionTokenTtlMinutes, 60)))));
  }
  return getSettings_();
}

function examPublicShape_(exam) {
  if (!exam) return null;
  return {
    examCode: exam.ExamCode,
    title: exam.Title,
    durationMinutes: toNum_(exam.DurationMinutes, 20),
    showScoreSummary: toBool_(exam.ShowScoreSummary),
    allowReview: toBool_(exam.AllowReview),
    shuffleQuestions: toBool_(exam.ShuffleQuestions),
    passMark: toNum_(exam.PassMark, 50),
    resultMessage: exam.ResultMessage || '',
    captureSnapshots: toBool_(exam.CaptureSnapshots === '' ? true : exam.CaptureSnapshots),
    recordAudio: toBool_(exam.RecordAudio),
    recordVideo: toBool_(exam.RecordVideo),
    recordScreen: toBool_(exam.RecordScreen),
    isActive: toBool_(exam.IsActive),
    isCurrent: toBool_(exam.IsCurrent),
    isArchived: toBool_(exam.IsArchived),
    isDeleted: toBool_(exam.IsDeleted),
    examLocked: toBool_(exam.ExamLocked),
    lockNotice: exam.LockNotice || ''
  };
}

function createExam_(payload) {
  var actor = requireAdminAction_(payload, true).user;
  var title = trim_(payload.title);
  var examCode = trim_(payload.examCode);
  if (!title || !examCode) return response_(false, 'Exam title and exam code are required.');
  if (findExam_(examCode)) return response_(false, 'That exam code already exists.');
  var exams = getExams_();
  exams.push({
    ExamCode: examCode,
    Title: title,
    DurationMinutes: Math.max(1, toNum_(payload.durationMinutes, 20)),
    ShowScoreSummary: payload.showScoreSummary !== false,
    AllowReview: toBool_(payload.allowReview),
    ShuffleQuestions: toBool_(payload.shuffleQuestions),
    PassMark: Math.max(0, Math.min(100, toNum_(payload.passMark, 50))),
    ResultMessage: trim_(payload.resultMessage),
    CaptureSnapshots: payload.captureSnapshots === undefined ? true : toBool_(payload.captureSnapshots),
    RecordAudio: toBool_(payload.recordAudio),
    RecordVideo: toBool_(payload.recordVideo),
    RecordScreen: toBool_(payload.recordScreen),
    IsActive: false,
    IsCurrent: false,
    IsArchived: false,
    IsDeleted: false,
    ExamLocked: false,
    LockNotice: '',
    CreatedAt: nowIso_(),
    CreatedBy: actor.Username,
    UpdatedAt: nowIso_()
  });
  saveExams_(exams);
  return response_(true, 'Exam created successfully.', { examCode: examCode, title: title });
}

function listExams_(payload) {
  requireSession_(payload.token, ['admin']);
  var exams = getExams_().map(examPublicShape_);
  exams.sort(function(a, b){ return String(a.title).localeCompare(String(b.title)); });
  return response_(true, 'Exams loaded.', exams);
}

function setExamOptions_(payload) {
  requireAdminAction_(payload, true);
  var examCode = trim_(payload.examCode);
  var exams = getExams_();
  var found = false;
  for (var i = 0; i < exams.length; i++) {
    if (normalize_(exams[i].ExamCode) === normalize_(examCode) && !toBool_(exams[i].IsDeleted)) {
      exams[i].ShowScoreSummary = payload.showScoreSummary !== false;
      exams[i].AllowReview = toBool_(payload.allowReview);
      exams[i].ShuffleQuestions = toBool_(payload.shuffleQuestions);
      exams[i].PassMark = Math.max(0, Math.min(100, toNum_(payload.passMark, 50)));
      exams[i].ResultMessage = trim_(payload.resultMessage);
      exams[i].CaptureSnapshots = payload.captureSnapshots === undefined ? toBool_(exams[i].CaptureSnapshots === '' ? true : exams[i].CaptureSnapshots) : toBool_(payload.captureSnapshots);
      exams[i].RecordAudio = toBool_(payload.recordAudio);
      exams[i].RecordVideo = toBool_(payload.recordVideo);
      exams[i].RecordScreen = toBool_(payload.recordScreen);
      exams[i].UpdatedAt = nowIso_();
      found = true;
      break;
    }
  }
  if (!found) return response_(false, 'Exam not found.');
  saveExams_(exams);
  return response_(true, 'Exam settings saved successfully.');
}

function setExamActive_(payload) {
  requireAdminAction_(payload, true);
  var examCode = trim_(payload.examCode);
  var active = toBool_(payload.active);
  var exams = getExams_();
  var found = false;
  var targetKey = normalize_(examCode);
  for (var i = 0; i < exams.length; i++) {
    if (normalize_(exams[i].ExamCode) === targetKey && !toBool_(exams[i].IsDeleted)) {
      exams[i].IsActive = active;
      exams[i].IsCurrent = active;
      exams[i].UpdatedAt = nowIso_();
      found = true;
      break;
    }
  }
  if (!found) return response_(false, 'Exam not found.');
  if (!active) {
    var hasCurrent = false;
    for (var j = 0; j < exams.length; j++) {
      if (!toBool_(exams[j].IsDeleted) && !toBool_(exams[j].IsArchived) && toBool_(exams[j].IsActive) && toBool_(exams[j].IsCurrent)) {
        hasCurrent = true;
        break;
      }
    }
    if (!hasCurrent) {
      for (var k = 0; k < exams.length; k++) {
        if (!toBool_(exams[k].IsDeleted) && !toBool_(exams[k].IsArchived) && toBool_(exams[k].IsActive)) {
          exams[k].IsCurrent = true;
          break;
        }
      }
    }
  }
  saveExams_(exams);
  return response_(true, active ? 'Exam activated successfully. Other active exams remain active.' : 'Exam deactivated successfully.');
}

function archiveExam_(payload) {
  requireAdminAction_(payload, true);
  var examCode = trim_(payload.examCode);
  var archived = toBool_(payload.archived);
  var exams = getExams_();
  var found = false;
  for (var i = 0; i < exams.length; i++) {
    if (normalize_(exams[i].ExamCode) === normalize_(examCode) && !toBool_(exams[i].IsDeleted)) {
      exams[i].IsArchived = archived;
      exams[i].UpdatedAt = nowIso_();
      found = true;
      break;
    }
  }
  if (!found) return response_(false, 'Exam not found.');
  saveExams_(exams);
  return response_(true, archived ? 'Exam archived successfully.' : 'Exam restored from archive successfully.');
}

function deleteExam_(payload) {
  requireAdminAction_(payload, true);
  var examCode = trim_(payload.examCode);
  var exams = getExams_();
  var found = false;
  for (var i = 0; i < exams.length; i++) {
    if (normalize_(exams[i].ExamCode) === normalize_(examCode) && !toBool_(exams[i].IsDeleted)) {
      exams[i].IsDeleted = true;
      exams[i].IsActive = false;
      exams[i].IsCurrent = false;
      exams[i].UpdatedAt = nowIso_();
      found = true;
      break;
    }
  }
  if (!found) return response_(false, 'Exam not found or already deleted.');
  saveExams_(exams);
  return response_(true, 'Exam deleted. You can restore it later.');
}

function restoreExam_(payload) {
  requireAdminAction_(payload, true);
  var examCode = trim_(payload.examCode);
  var exams = getExams_();
  var found = false;
  for (var i = 0; i < exams.length; i++) {
    if (normalize_(exams[i].ExamCode) === normalize_(examCode) && toBool_(exams[i].IsDeleted)) {
      exams[i].IsDeleted = false;
      exams[i].UpdatedAt = nowIso_();
      found = true;
      break;
    }
  }
  if (!found) return response_(false, 'Deleted exam not found.');
  saveExams_(exams);
  return response_(true, 'Exam restored successfully.');
}

function hardDeleteExam_(payload) {
  requireAdminAction_(payload, true);
  return hardDeleteExamsInternal_([trim_(payload.examCode)]);
}

function bulkHardDeleteExams_(payload) {
  requireAdminAction_(payload, true);
  var codes = Array.isArray(payload.examCodes) ? payload.examCodes : [];
  return hardDeleteExamsInternal_(codes);
}

function hardDeleteExamsInternal_(examCodes) {
  var codeMap = {};
  examCodes.forEach(function(code){ if (trim_(code)) codeMap[normalize_(code)] = true; });
  if (!Object.keys(codeMap).length) return response_(false, 'No exam selected.');

  saveExams_(getExams_().filter(function(e){ return !codeMap[normalize_(e.ExamCode)]; }));
  saveQuestions_(getQuestions_().filter(function(q){ return !codeMap[normalize_(q.ExamCode)]; }));
  saveResults_(getResults_().filter(function(r){ return !codeMap[normalize_(r.ExamCode)]; }));
  saveProgressRows_(getProgressRows_().filter(function(p){ return !codeMap[normalize_(p.ExamCode)]; }));
  savePermissionRows_(getPermissionRows_().filter(function(p){ return !codeMap[normalize_(p.ExamCode)]; }));
  saveDriveFileRows_(getDriveFileRows_().filter(function(f){ return !codeMap[normalize_(f.ExamCode)]; }));
  return response_(true, Object.keys(codeMap).length + ' exam(s) deleted forever.');
}

function setExamLock_(payload) {
  requireAdminAction_(payload, true);
  var examCode = trim_(payload.examCode);
  var locked = toBool_(payload.locked);
  var exams = getExams_();
  var found = false;
  for (var i = 0; i < exams.length; i++) {
    if (normalize_(exams[i].ExamCode) === normalize_(examCode) && !toBool_(exams[i].IsDeleted)) {
      exams[i].ExamLocked = locked;
      exams[i].LockNotice = locked ? trim_(payload.notice) : '';
      exams[i].UpdatedAt = nowIso_();
      found = true;
      break;
    }
  }
  if (!found) return response_(false, 'Exam not found.');
  saveExams_(exams);
  return response_(true, locked ? 'Exam locked successfully.' : 'Exam unlocked successfully.');
}

function duplicateExam_(payload) {
  var actor = requireAdminAction_(payload, true).user;
  var sourceExamCode = trim_(payload.sourceExamCode);
  var newExamCode = trim_(payload.newExamCode);
  var newTitle = trim_(payload.newTitle);
  if (!sourceExamCode || !newExamCode || !newTitle) return response_(false, 'Source exam code, new exam code, and new title are required.');
  var source = findExam_(sourceExamCode);
  if (!source || toBool_(source.IsDeleted)) return response_(false, 'Source exam not found.');
  if (findExam_(newExamCode)) return response_(false, 'New exam code already exists.');

  var exams = getExams_();
  exams.push({
    ExamCode: newExamCode,
    Title: newTitle,
    DurationMinutes: source.DurationMinutes,
    ShowScoreSummary: source.ShowScoreSummary,
    AllowReview: source.AllowReview,
    ShuffleQuestions: source.ShuffleQuestions,
    PassMark: source.PassMark,
    ResultMessage: source.ResultMessage,
    CaptureSnapshots: source.CaptureSnapshots,
    RecordAudio: source.RecordAudio,
    RecordVideo: source.RecordVideo,
    RecordScreen: source.RecordScreen,
    IsActive: false,
    IsCurrent: false,
    IsArchived: false,
    IsDeleted: false,
    ExamLocked: false,
    LockNotice: '',
    CreatedAt: nowIso_(),
    CreatedBy: actor.Username,
    UpdatedAt: nowIso_()
  });
  saveExams_(exams);

  var questions = getQuestions_();
  var copied = 0;
  var sourceQuestions = questions.filter(function(q){
    return normalize_(q.ExamCode) === normalize_(sourceExamCode) && !toBool_(q.IsDeleted);
  });
  sourceQuestions.forEach(function(q){
    questions.push({
      Id: Utilities.getUuid(),
      ExamCode: newExamCode,
      Question: q.Question,
      ImageUrl: q.ImageUrl,
      OptionA: q.OptionA,
      OptionB: q.OptionB,
      OptionC: q.OptionC,
      OptionD: q.OptionD,
      Answer: q.Answer,
      IsDeleted: false,
      DriveFileId: q.DriveFileId || '',
      SourceUrl: q.SourceUrl || '',
      CreatedAt: nowIso_(),
      UpdatedAt: nowIso_()
    });
    copied++;
  });
  saveQuestions_(questions);
  return response_(true, 'Exam duplicated successfully.', { copiedQuestions: copied });
}

function getCurrentExamPublic_() {
  var current = getCurrentExam_();
  return response_(true, 'Public exam info loaded.', { currentExam: current ? examPublicShape_(current) : null });
}

function addCandidate_(payload) {
  var actor = requireAdminAction_(payload, true).user;
  var fullName = trim_(payload.fullName);
  var regId = trim_(payload.regId);
  var passportUrl = normalizeImageUrl_(payload.passportUrl);
  if (!fullName || !regId) return response_(false, 'Full name and Registration ID are required.');
  var rows = getCandidates_();
  for (var i = 0; i < rows.length; i++) {
    if (normalize_(rows[i].RegId) === normalize_(regId)) return response_(false, 'This Registration ID has already been used.');
  }
  rows.push({ FullName: fullName, RegId: regId, CreatedAt: nowIso_(), UpdatedAt: nowIso_(), PassportUrl: passportUrl });
  saveCandidates_(rows);

  var users = getUsers_();
  ensureStudentShadowUser_(users, fullName, regId, actor.Username);
  saveUsers_(users);

  return response_(true, 'Candidate added successfully.', { fullName: fullName, regId: regId, passportUrl: passportUrl });
}

function importCandidates_(payload) {
  var actor = requireAdminAction_(payload, true).user;
  var rows = Array.isArray(payload.rows) ? payload.rows : [];
  var list = getCandidates_();
  var users = getUsers_();
  var existing = {};
  list.forEach(function(item){ existing[normalize_(item.RegId)] = true; });
  var added = 0, skipped = 0;
  for (var i = 0; i < rows.length; i++) {
    var fullName = trim_(rows[i].fullName || rows[i].FullName);
    var regId = trim_(rows[i].regId || rows[i].RegId);
    var passportUrl = normalizeImageUrl_(rows[i].passportUrl || rows[i].PassportUrl);
    if (!fullName || !regId || existing[normalize_(regId)]) { skipped++; continue; }
    list.push({ FullName: fullName, RegId: regId, CreatedAt: nowIso_(), UpdatedAt: nowIso_(), PassportUrl: passportUrl });
    ensureStudentShadowUser_(users, fullName, regId, actor.Username);
    existing[normalize_(regId)] = true;
    added++;
  }
  saveCandidates_(list);
  saveUsers_(users);
  var driveNotice = '';
  if (trim_(payload.csvText) && trim_(payload.filename)) {
    try {
      saveTextBackupFile_('Candidate CSV Uploads', trim_(payload.filename), payload.csvText, { kind: 'candidate_csv' });
    } catch (err) {
      driveNotice = ' Candidates were imported, but the Drive backup could not be saved yet. Reauthorize the Apps Script deployment with Drive permission and try again.';
    }
  }
  return response_(true, 'Candidates imported successfully.' + driveNotice, { added: added, skipped: skipped, driveBackupSaved: !driveNotice });
}

function listCandidates_(payload) {
  requireSession_(payload.token, ['admin']);
  var list = getCandidates_().map(function(item){ return { fullName: item.FullName, regId: item.RegId, passportUrl: normalizeImageUrl_(item.PassportUrl || '') }; });
  list.sort(function(a, b){ return String(a.fullName).localeCompare(String(b.fullName)); });
  return response_(true, 'Candidates loaded.', list);
}

function generateStudentAccounts_(payload) {
  var actor = requireAdminAction_(payload, true).user;
  var passwordLength = Math.max(6, toNum_(payload.passwordLength, 8));
  var users = getUsers_();
  var candidates = getCandidates_();
  var csvRows = [['fullName', 'regId', 'username', 'password']];
  var createdCount = 0, skippedCount = 0;

  candidates.forEach(function(c){
    var regId = trim_(c.RegId);
    var idx = findStudentUserIndexByRegId_(users, regId);
    var target = idx >= 0 ? users[idx] : null;

    if (target && toBool_(target.IsDeleted)) {
      skippedCount++;
      return;
    }

    var password = randomPassword_(passwordLength);
    var preferredUsername = target && trim_(target.Username) && normalize_(target.Username) !== normalize_(regId) ? trim_(target.Username) : '';
    var desiredUsername = buildStudentUsername_(users, regId, preferredUsername, target ? target.Id : '');
    if (target) {
      if (trim_(target.PasswordHash) && toBool_(target.IsActive)) {
        skippedCount++;
        return;
      }
      target.FullName = c.FullName;
      target.Username = desiredUsername;
      target.RegId = regId;
      target.PasswordHash = hashPassword_(password);
      target.Role = 'student';
      target.IsActive = true;
      target.IsDeleted = false;
      target.RestoredAt = '';
      target.RestoredBy = '';
      target.DeletedAt = '';
      target.DeletedBy = '';
      if (!trim_(target.CreatedAt)) target.CreatedAt = nowIso_();
      if (!trim_(target.CreatedBy)) target.CreatedBy = actor.Username;
    } else {
      users.push({
        Id: Utilities.getUuid(),
        FullName: c.FullName,
        Username: desiredUsername,
        PasswordHash: hashPassword_(password),
        Role: 'student',
        RegId: regId,
        IsActive: true,
        IsDeleted: false,
        CreatedAt: nowIso_(),
        CreatedBy: actor.Username,
        DeletedAt: '',
        DeletedBy: '',
        RestoredAt: '',
        RestoredBy: ''
      });
    }
    csvRows.push([c.FullName, regId, desiredUsername, password]);
    createdCount++;
  });

  saveUsers_(users);
  var csv = csvRows.map(function(r){ return r.map(csvEscape_).join(','); }).join('\n');
  var filename = 'student_accounts_passwords_' + Utilities.formatDate(new Date(), TZ, 'yyyyMMdd_HHmmss') + '.csv';
  var driveNotice = '';
  try {
    saveTextBackupFile_('Generated Student Passwords', filename, csv, { kind: 'student_password_csv', createdBy: actor.Username });
  } catch (err) {
    driveNotice = ' Student accounts were generated, but the Drive backup could not be saved yet. Reauthorize the Apps Script deployment with Drive permission and try again.';
  }
  return response_(true, 'Student passwords generated.' + driveNotice, { createdCount: createdCount, skippedCount: skippedCount, csv: csv, filename: filename, driveBackupSaved: !driveNotice });
}

function userPublicShape_(u) {
  return {
    fullName: u.FullName || '',
    username: u.Username || '',
    role: u.Role || '',
    regId: u.RegId || '',
    isActive: toBool_(u.IsActive),
    isDeleted: toBool_(u.IsDeleted)
  };
}

function listAdmins_(payload) {
  requireSession_(payload.token, ['admin']);
  var data = getUsers_().filter(function(u){ return u.Role === 'principal_admin' || u.Role === 'subadmin' || u.Role === 'admin'; }).map(userPublicShape_);
  sortByFullName_(data);
  return response_(true, 'Admins loaded.', data);
}

function listStudents_(payload) {
  requireSession_(payload.token, ['admin']);
  var data = getUsers_().filter(function(u){ return u.Role === 'student'; }).map(userPublicShape_);
  sortByFullName_(data);
  return response_(true, 'Students loaded.', data);
}

function setUserActive_(payload) {
  var actor = requireAdminAction_(payload, true).user;
  var username = trim_(payload.username);
  var active = toBool_(payload.active);
  if (!username) return response_(false, 'Username is required.');
  var users = getUsers_();
  var target = null;
  for (var i = 0; i < users.length; i++) {
    if (normalize_(users[i].Username) === normalize_(username)) { target = users[i]; break; }
  }
  if (!target) return response_(false, 'User not found.');
  if (!roleCanManageUser_(actor.Role, target.Role)) return response_(false, 'You do not have permission to manage this user.');
  if (toBool_(target.IsDeleted)) return response_(false, 'Restore this user first.');
  if (!active && target.Role === 'principal_admin') {
    var activePrincipals = principalAdmins_().filter(function(u){ return toBool_(u.IsActive); });
    if (activePrincipals.length <= 1 && normalize_(target.Username) === normalize_(activePrincipals[0].Username)) {
      return response_(false, 'You cannot deactivate the last active principal admin.');
    }
  }
  target.IsActive = active;
  saveUsers_(users);
  return response_(true, active ? 'User activated successfully.' : 'User deactivated successfully.');
}

function deleteUser_(payload) {
  var actor = requireAdminAction_(payload, true).user;
  var username = trim_(payload.username);
  var users = getUsers_();
  var target = null;
  for (var i = 0; i < users.length; i++) {
    if (normalize_(users[i].Username) === normalize_(username)) { target = users[i]; break; }
  }
  if (!target) return response_(false, 'User not found.');
  if (!roleCanManageUser_(actor.Role, target.Role)) return response_(false, 'You do not have permission to manage this user.');
  if (target.Role === 'principal_admin') {
    var principals = principalAdmins_();
    if (principals.length <= 1) return response_(false, 'You cannot delete the last principal admin.');
  }
  target.IsDeleted = true;
  target.IsActive = false;
  target.DeletedAt = nowIso_();
  target.DeletedBy = actor.Username;
  saveUsers_(users);
  return response_(true, 'User deleted. You can restore the account later.');
}

function restoreUser_(payload) {
  var actor = requireAdminAction_(payload, true).user;
  var username = trim_(payload.username);
  var users = getUsers_();
  var target = null;
  for (var i = 0; i < users.length; i++) {
    if (normalize_(users[i].Username) === normalize_(username)) { target = users[i]; break; }
  }
  if (!target) return response_(false, 'User not found.');
  if (!roleCanManageUser_(actor.Role, target.Role)) return response_(false, 'You do not have permission to manage this user.');
  target.IsDeleted = false;
  target.IsActive = true;
  target.RestoredAt = nowIso_();
  target.RestoredBy = actor.Username;
  saveUsers_(users);
  return response_(true, 'User restored successfully.');
}

function hardDeleteUser_(payload) {
  var actor = requireAdminAction_(payload, true).user;
  var username = trim_(payload.username);
  var users = getUsers_();
  var target = null;
  for (var i = 0; i < users.length; i++) {
    if (normalize_(users[i].Username) === normalize_(username)) { target = users[i]; break; }
  }
  if (!target) return response_(false, 'User not found.');
  if (!roleCanManageUser_(actor.Role, target.Role)) return response_(false, 'You do not have permission to manage this user.');
  if (target.Role === 'principal_admin') return response_(false, 'Principal admin accounts cannot be deleted forever from the dashboard.');
  saveUsers_(users.filter(function(u){ return normalize_(u.Username) !== normalize_(username); }));
  return response_(true, 'User deleted forever.');
}

function listQuestionsByExam_(payload) {
  requireSession_(payload.token, ['admin']);
  var examCode = trim_(payload.examCode);
  var includeDeleted = payload.includeDeleted === undefined ? true : toBool_(payload.includeDeleted);
  var list = getQuestions_().filter(function(q){
    if (normalize_(q.ExamCode) !== normalize_(examCode)) return false;
    if (!includeDeleted && toBool_(q.IsDeleted)) return false;
    return true;
  }).map(function(q){
    return {
      id: q.Id,
      examCode: q.ExamCode,
      question: q.Question,
      imageUrl: q.ImageUrl || '',
      optionA: q.OptionA,
      optionB: q.OptionB,
      optionC: q.OptionC,
      optionD: q.OptionD,
      answer: q.Answer,
      isDeleted: toBool_(q.IsDeleted)
    };
  });
  return response_(true, 'Questions loaded.', list);
}

function ensureExamExistsForWrite_(examCode) {
  var exam = findExam_(examCode);
  if (!exam || toBool_(exam.IsDeleted)) throw new Error('Exam not found.');
  return exam;
}

function addQuestion_(payload) {
  requireAdminAction_(payload, true);
  ensureExamExistsForWrite_(payload.examCode);
  var question = trim_(payload.question);
  if (!question) return response_(false, 'Question text is required.');
  var img = persistQuestionImageIfPossible_(trim_(payload.imageUrl), trim_(payload.examCode));
  var rows = getQuestions_();
  rows.push({
    Id: Utilities.getUuid(),
    ExamCode: trim_(payload.examCode),
    Question: question,
    ImageUrl: img.imageUrl,
    OptionA: trim_(payload.optionA),
    OptionB: trim_(payload.optionB),
    OptionC: trim_(payload.optionC),
    OptionD: trim_(payload.optionD),
    Answer: trim_(payload.answer).toUpperCase(),
    IsDeleted: false,
    DriveFileId: img.driveFileId,
    SourceUrl: img.sourceUrl,
    CreatedAt: nowIso_(),
    UpdatedAt: nowIso_()
  });
  saveQuestions_(rows);
  return response_(true, 'Question added successfully.');
}

function updateQuestionByExam_(payload) {
  requireAdminAction_(payload, true);
  var examCode = trim_(payload.examCode);
  var questionId = trim_(payload.questionId);
  var rows = getQuestions_();
  var found = false;
  for (var i = 0; i < rows.length; i++) {
    if (normalize_(rows[i].ExamCode) === normalize_(examCode) && String(rows[i].Id) === String(questionId)) {
      var img = persistQuestionImageIfPossible_(trim_(payload.imageUrl), examCode);
      rows[i].Question = trim_(payload.question);
      rows[i].ImageUrl = img.imageUrl;
      rows[i].OptionA = trim_(payload.optionA);
      rows[i].OptionB = trim_(payload.optionB);
      rows[i].OptionC = trim_(payload.optionC);
      rows[i].OptionD = trim_(payload.optionD);
      rows[i].Answer = trim_(payload.answer).toUpperCase();
      rows[i].DriveFileId = img.driveFileId;
      rows[i].SourceUrl = img.sourceUrl;
      rows[i].UpdatedAt = nowIso_();
      found = true;
      break;
    }
  }
  if (!found) return response_(false, 'Question not found.');
  saveQuestions_(rows);
  return response_(true, 'Question updated successfully.');
}

function deleteQuestionByExam_(payload) {
  return setQuestionDeletedState_(payload, true, false);
}
function restoreQuestionByExam_(payload) {
  return setQuestionDeletedState_(payload, false, false);
}
function hardDeleteQuestionByExam_(payload) {
  return setQuestionDeletedState_(payload, true, true);
}

function setQuestionDeletedState_(payload, deleted, hardDelete) {
  requireAdminAction_(payload, true);
  var examCode = trim_(payload.examCode);
  var questionId = trim_(payload.questionId);
  var rows = getQuestions_();
  if (hardDelete) {
    var kept = rows.filter(function(q){ return !(normalize_(q.ExamCode) === normalize_(examCode) && String(q.Id) === String(questionId)); });
    if (kept.length === rows.length) return response_(false, 'Question not found.');
    saveQuestions_(kept);
    return response_(true, 'Question deleted forever.');
  }
  var found = false;
  rows.forEach(function(q){
    if (normalize_(q.ExamCode) === normalize_(examCode) && String(q.Id) === String(questionId)) {
      q.IsDeleted = deleted;
      q.UpdatedAt = nowIso_();
      found = true;
    }
  });
  if (!found) return response_(false, 'Question not found.');
  saveQuestions_(rows);
  return response_(true, deleted ? 'Question deleted successfully.' : 'Question restored successfully.');
}

function importQuestions_(payload) {
  requireAdminAction_(payload, true);
  var examCode = trim_(payload.examCode);
  ensureExamExistsForWrite_(examCode);
  var rows = Array.isArray(payload.rows) ? payload.rows : [];
  var questionRows = getQuestions_();
  var added = 0, skipped = 0;
  for (var i = 0; i < rows.length; i++) {
    var question = trim_(rows[i].question || rows[i].Question);
    if (!question) { skipped++; continue; }
    var imageUrl = trim_(rows[i].imageUrl || rows[i].ImageUrl);
    var img = persistQuestionImageIfPossible_(imageUrl, examCode);
    questionRows.push({
      Id: Utilities.getUuid(),
      ExamCode: examCode,
      Question: question,
      ImageUrl: img.imageUrl,
      OptionA: trim_(rows[i].optionA || rows[i].OptionA),
      OptionB: trim_(rows[i].optionB || rows[i].OptionB),
      OptionC: trim_(rows[i].optionC || rows[i].OptionC),
      OptionD: trim_(rows[i].optionD || rows[i].OptionD),
      Answer: trim_(rows[i].answer || rows[i].Answer).toUpperCase(),
      IsDeleted: false,
      DriveFileId: img.driveFileId,
      SourceUrl: img.sourceUrl,
      CreatedAt: nowIso_(),
      UpdatedAt: nowIso_()
    });
    added++;
  }
  saveQuestions_(questionRows);
  var driveNotice = '';
  if (trim_(payload.csvText) && trim_(payload.filename)) {
    try {
      saveTextBackupFile_('Question CSV Uploads', trim_(payload.filename), payload.csvText, { kind: 'question_csv', examCode: examCode });
    } catch (err) {
      driveNotice = ' Questions were imported, but the Drive backup could not be saved yet. Reauthorize the Apps Script deployment with Drive permission and try again.';
    }
  }
  return response_(true, 'Questions imported successfully.' + driveNotice, { added: added, skipped: skipped, driveBackupSaved: !driveNotice });
}

function clearQuestionsByExam_(payload) {
  requireAdminAction_(payload, true);
  var examCode = trim_(payload.examCode);
  var rows = getQuestions_();
  var count = 0;
  rows.forEach(function(q){
    if (normalize_(q.ExamCode) === normalize_(examCode) && !toBool_(q.IsDeleted)) { q.IsDeleted = true; q.UpdatedAt = nowIso_(); count++; }
  });
  saveQuestions_(rows);
  return response_(true, count ? 'All active questions deleted for this exam.' : 'No active questions found for this exam.');
}

function bulkDeleteQuestionsByExam_(payload) { return bulkQuestionState_(payload, 'delete'); }
function bulkRestoreQuestionsByExam_(payload) { return bulkQuestionState_(payload, 'restore'); }
function bulkHardDeleteQuestionsByExam_(payload) { return bulkQuestionState_(payload, 'hard'); }

function bulkQuestionState_(payload, mode) {
  requireAdminAction_(payload, true);
  var examCode = trim_(payload.examCode);
  var ids = Array.isArray(payload.questionIds) ? payload.questionIds.map(String) : [];
  if (!ids.length) return response_(false, 'No questions selected.');
  var idMap = {};
  ids.forEach(function(id){ idMap[String(id)] = true; });
  var rows = getQuestions_();
  var changed = 0;
  if (mode === 'hard') {
    var kept = rows.filter(function(q){
      var match = normalize_(q.ExamCode) === normalize_(examCode) && idMap[String(q.Id)];
      if (match) changed++;
      return !match;
    });
    saveQuestions_(kept);
    return response_(true, changed + ' question(s) deleted forever.');
  }
  rows.forEach(function(q){
    if (normalize_(q.ExamCode) === normalize_(examCode) && idMap[String(q.Id)]) {
      q.IsDeleted = mode === 'delete';
      q.UpdatedAt = nowIso_();
      changed++;
    }
  });
  saveQuestions_(rows);
  return response_(true, changed + ' question(s) ' + (mode === 'delete' ? 'deleted.' : 'restored.'));
}

function createPermissionCode_(payload) {
  var actor = requireAdminAction_(payload, true).user;
  var examCode = trim_(payload.examCode);
  var regId = trim_(payload.regId);
  var username = trim_(payload.username);
  if (!examCode || (!regId && !username)) return response_(false, 'Exam code and either Reg ID or username are required.');
  var rows = getPermissionRows_();
  var code = randomCode_('PERM');
  rows.push({
    PermissionCode: code,
    ExamCode: examCode,
    RegId: regId,
    Username: username,
    Reason: trim_(payload.reason),
    Status: 'ACTIVE',
    UsedAt: '',
    CreatedAt: nowIso_(),
    CreatedBy: actor.Username
  });
  savePermissionRows_(rows);
  return response_(true, 'Permission code created successfully.', { permissionCode: code });
}

function listPermissionCodes_(payload) {
  requireSession_(payload.token, ['admin']);
  var rows = getPermissionRows_().map(function(p){
    return {
      permissionCode: p.PermissionCode,
      examCode: p.ExamCode,
      regId: p.RegId || '',
      username: p.Username || '',
      reason: p.Reason || '',
      status: p.Status || ''
    };
  });
  rows.sort(function(a, b){ return String(b.permissionCode).localeCompare(String(a.permissionCode)); });
  return response_(true, 'Permission codes loaded.', rows);
}

function deletePermissionCode_(payload) {
  requireAdminAction_(payload, true);
  var code = trim_(payload.permissionCode);
  var rows = getPermissionRows_();
  var kept = rows.filter(function(p){ return normalize_(p.PermissionCode) !== normalize_(code); });
  if (kept.length === rows.length) return response_(false, 'Permission code not found.');
  savePermissionRows_(kept);
  return response_(true, 'Permission code deleted successfully.');
}

function clearPermissionCodes_(payload) {
  requireAdminAction_(payload, true);
  savePermissionRows_([]);
  return response_(true, 'All permission codes deleted successfully.');
}

function verifyCandidate_(payload) {
  var auth = requireSession_(payload.token, ['student']);
  var fullName = trim_(payload.fullName);
  var regId = trim_(payload.regId);
  if (!fullName || !regId) return response_(false, 'Full name and Registration ID are required.');
  var candidate = findCandidateByRegId_(regId);
  if (!candidate) return response_(false, 'Candidate not found.');
  if (normalize_(candidate.FullName) !== normalize_(fullName)) return response_(false, 'Full name does not match the registration record.');

  var users = getUsers_();
  for (var i = 0; i < users.length; i++) {
    if (normalize_(users[i].Username) === normalize_(auth.user.Username)) {
      if (users[i].RegId && normalize_(users[i].RegId) !== normalize_(regId)) return response_(false, 'This account is linked to another Registration ID.');
      users[i].RegId = regId;
      if (!trim_(users[i].FullName)) users[i].FullName = candidate.FullName;
      saveUsers_(users);
      break;
    }
  }
  return response_(true, 'Candidate verified successfully.', { fullName: candidate.FullName, regId: candidate.RegId });
}

function getCurrentExam_() {
  var exams = getExams_();
  for (var i = 0; i < exams.length; i++) {
    if (!toBool_(exams[i].IsDeleted) && !toBool_(exams[i].IsArchived) && toBool_(exams[i].IsCurrent) && toBool_(exams[i].IsActive)) return exams[i];
  }
  for (var j = 0; j < exams.length; j++) {
    if (!toBool_(exams[j].IsDeleted) && !toBool_(exams[j].IsArchived) && toBool_(exams[j].IsActive)) return exams[j];
  }
  return null;
}

function isPortalLocked_() {
  return toBool_(getSettingsMap_()['Portal Locked']);
}

function canUsePermissionCode_(examCode, regId, username, code) {
  if (!code) return null;
  var rows = getPermissionRows_();
  for (var i = 0; i < rows.length; i++) {
    if (normalize_(rows[i].PermissionCode) === normalize_(code) && normalize_(rows[i].ExamCode) === normalize_(examCode) && rows[i].Status === 'ACTIVE') {
      var matchesReg = !trim_(rows[i].RegId) || normalize_(rows[i].RegId) === normalize_(regId);
      var matchesUser = !trim_(rows[i].Username) || normalize_(rows[i].Username) === normalize_(username);
      if (matchesReg && matchesUser) return rows[i];
    }
  }
  return null;
}

function unlockExam_(payload) {
  var auth = requireSession_(payload.token, ['student']);
  var regId = trim_(payload.regId);
  var examCode = trim_(payload.examCode);
  var permissionCode = trim_(payload.permissionCode);
  if (!regId || !examCode) return response_(false, 'Registration ID and exam code are required.');
  if (isPortalLocked_()) {
    return response_(false, trim_(getSettingsMap_()['Portal Notice']) || 'CBT portal is currently locked.');
  }
  var exam = findExam_(examCode);
  if (!exam || toBool_(exam.IsDeleted)) return response_(false, 'Exam not found.');
  if (toBool_(exam.ExamLocked)) return response_(false, trim_(exam.LockNotice) || 'This exam is currently locked.');
  if (!toBool_(exam.IsActive) && !toBool_(exam.IsCurrent)) return response_(false, 'This exam is not currently active.');
  if (toBool_(exam.IsArchived)) return response_(false, 'This exam is archived.');

  var candidate = findCandidateByRegId_(regId);
  if (!candidate) return response_(false, 'Candidate not found.');
  var user = findUserByUsername_(auth.user.Username);
  if (trim_(user.RegId) && normalize_(user.RegId) !== normalize_(regId)) return response_(false, 'This account is not linked to the supplied Registration ID.');

  var prior = getResults_().filter(function(r){ return normalize_(r.ExamCode) === normalize_(examCode) && normalize_(r.RegId) === normalize_(regId) && !toBool_(r.IsDeleted); });
  if (prior.length) {
    var perm = canUsePermissionCode_(examCode, regId, user.Username, permissionCode);
    if (!perm) return response_(false, 'You have already taken this exam. Ask the admin for a permission code to retake it.');
  }

  var questions = getQuestions_().filter(function(q){
    return normalize_(q.ExamCode) === normalize_(examCode) && !toBool_(q.IsDeleted);
  }).map(function(q){
    return { id: q.Id, question: q.Question, imageUrl: q.ImageUrl || '', optionA: q.OptionA, optionB: q.OptionB, optionC: q.OptionC, optionD: q.OptionD, answer: q.Answer };
  });

  if (toBool_(exam.ShuffleQuestions)) questions = shuffleArrayCopy_(questions);

  return response_(true, 'Exam unlocked successfully.', {
    examTitle: exam.Title,
    durationMinutes: toNum_(exam.DurationMinutes, 20),
    questions: questions,
    showScoreSummary: toBool_(exam.ShowScoreSummary),
    allowReview: toBool_(exam.AllowReview),
    shuffleQuestions: toBool_(exam.ShuffleQuestions),
    passMark: toNum_(exam.PassMark, 50),
    resultMessage: trim_(exam.ResultMessage),
    captureSnapshots: toBool_(exam.CaptureSnapshots === '' ? true : exam.CaptureSnapshots),
    recordAudio: toBool_(exam.RecordAudio),
    recordVideo: toBool_(exam.RecordVideo),
    recordScreen: toBool_(exam.RecordScreen)
  });
}

function autosaveProgress_(payload) {
  requireSession_(payload.token, ['student']);
  var examCode = trim_(payload.examCode);
  var regId = trim_(payload.regId);
  if (!examCode || !regId) return response_(false, 'Exam code and Reg ID are required.');
  var rows = getProgressRows_();
  var found = false;
  for (var i = 0; i < rows.length; i++) {
    if (normalize_(rows[i].ExamCode) === normalize_(examCode) && normalize_(rows[i].RegId) === normalize_(regId)) {
      rows[i].FullName = trim_(payload.fullName);
      rows[i].RemainingSeconds = toNum_(payload.remainingSeconds, 0);
      rows[i].AnswersJson = JSON.stringify(Array.isArray(payload.answers) ? payload.answers : []);
      rows[i].UpdatedAt = nowIso_();
      found = true;
      break;
    }
  }
  if (!found) {
    rows.push({
      ExamCode: examCode,
      RegId: regId,
      FullName: trim_(payload.fullName),
      RemainingSeconds: toNum_(payload.remainingSeconds, 0),
      AnswersJson: JSON.stringify(Array.isArray(payload.answers) ? payload.answers : []),
      UpdatedAt: nowIso_()
    });
  }
  saveProgressRows_(rows);
  return response_(true, 'Progress saved.', { saved: true });
}

function resumeProgress_(payload) {
  requireSession_(payload.token, ['student']);
  var examCode = trim_(payload.examCode);
  var regId = trim_(payload.regId);
  var rows = getProgressRows_();
  for (var i = 0; i < rows.length; i++) {
    if (normalize_(rows[i].ExamCode) === normalize_(examCode) && normalize_(rows[i].RegId) === normalize_(regId)) {
      var answers = [];
      try { answers = JSON.parse(rows[i].AnswersJson || '[]'); } catch (err) {}
      return response_(true, 'Progress loaded.', { found: true, remainingSeconds: toNum_(rows[i].RemainingSeconds, 0), answers: answers });
    }
  }
  return response_(true, 'No saved progress found.', { found: false, remainingSeconds: 0, answers: [] });
}

function submitExam_(payload) {
  var auth = requireSession_(payload.token, ['student']);
  var examCode = trim_(payload.examCode);
  var regId = trim_(payload.regId);
  var fullName = trim_(payload.fullName);
  var permissionCode = trim_(payload.permissionCode);
  var exam = findExam_(examCode);
  if (!exam || toBool_(exam.IsDeleted)) return response_(false, 'Exam not found.');
  var user = findUserByUsername_(auth.user.Username);
  var prior = getResults_().filter(function(r){ return normalize_(r.ExamCode) === normalize_(examCode) && normalize_(r.RegId) === normalize_(regId) && !toBool_(r.IsDeleted); });
  var permissionRow = null;
  if (prior.length) {
    permissionRow = canUsePermissionCode_(examCode, regId, user.Username, permissionCode);
    if (!permissionRow) return response_(false, 'You have already taken this exam.');
  }

  var questions = getQuestions_().filter(function(q){ return normalize_(q.ExamCode) === normalize_(examCode) && !toBool_(q.IsDeleted); });
  if (!questions.length) return response_(false, 'No active questions found for this exam.');

  var answerMap = {};
  (Array.isArray(payload.answers) ? payload.answers : []).forEach(function(a){ answerMap[String(a.questionId)] = trim_(a.selected).toUpperCase(); });

  var score = 0;
  var passedNos = [];
  var failedNos = [];
  var review = [];
  for (var i = 0; i < questions.length; i++) {
    var q = questions[i];
    var selected = answerMap[String(q.Id)] || '';
    var correct = trim_(q.Answer).toUpperCase();
    var passed = selected && selected === correct;
    if (passed) { score++; passedNos.push(String(i + 1)); } else { failedNos.push(String(i + 1)); }
    review.push({
      qNo: i + 1,
      status: passed ? 'PASS' : 'FAIL',
      question: q.Question,
      imageUrl: q.ImageUrl || '',
      optionA: q.OptionA,
      optionB: q.OptionB,
      optionC: q.OptionC,
      optionD: q.OptionD,
      chosen: selected || 'BLANK',
      correct: correct
    });
  }

  var total = questions.length;
  var percentage = total ? Math.round((score / total) * 100) : 0;
  var passMark = Math.max(0, Math.min(100, toNum_(exam.PassMark, 50)));
  var passStatus = percentage >= passMark ? 'PASSED' : 'FAILED';
  var attemptNo = prior.length + 1;
  var statusMessage = trim_(exam.ResultMessage) || (passStatus === 'PASSED' ? 'Congratulations! You passed.' : 'Keep practicing and try again.');
  var createdAt = nowIso_();
  var createdId = Utilities.getUuid();

  var results = getResults_();
  results.push({
    Id: createdId,
    Timestamp: createdAt,
    ExamCode: examCode,
    AttemptNo: attemptNo,
    FullName: fullName,
    RegId: regId,
    Username: user.Username,
    Score: score,
    Total: total,
    Percentage: percentage,
    PassMark: passMark,
    ShowScoreSummary: true,
    AllowReview: toBool_(exam.AllowReview),
    PassStatus: passStatus,
    Ranking: '',
    PassedNos: passedNos.join(', ') || 'None',
    FailedNos: failedNos.join(', ') || 'None',
    AnswersJson: JSON.stringify(Array.isArray(payload.answers) ? payload.answers : []),
    ReviewJson: JSON.stringify(review),
    StatusMessage: statusMessage,
    IsPublished: true,
    PublishedAt: createdAt,
    PublishedBy: 'system',
    IsDeleted: false,
    DeletedAt: '',
    DeletedBy: '',
    RestoredAt: '',
    RestoredBy: ''
  });
  assignRankingsForExam_(results, examCode);
  saveResults_(results);

  if (permissionRow) {
    var perms = getPermissionRows_();
    perms.forEach(function(p){
      if (normalize_(p.PermissionCode) === normalize_(permissionRow.PermissionCode)) {
        p.Status = 'USED';
        p.UsedAt = nowIso_();
      }
    });
    savePermissionRows_(perms);
  }

  saveProgressRows_(getProgressRows_().filter(function(p){ return !(normalize_(p.ExamCode) === normalize_(examCode) && normalize_(p.RegId) === normalize_(regId)); }));

  var latest = getResults_().filter(function(r){ return String(r.Id) === String(createdId); })[0] || null;
  var candidateInfo = findCandidateByRegId_(regId) || {};
  var branding = getResultBranding_();

  return response_(true, 'Exam submitted successfully.', {
    fullName: fullName,
    regId: regId,
    score: score,
    total: total,
    percentage: percentage,
    ranking: latest ? latest.Ranking : '',
    passedNos: passedNos.join(', ') || 'None',
    failedNos: failedNos.join(', ') || 'None',
    passStatus: passStatus,
    statusMessage: statusMessage,
    showScoreSummary: toBool_(exam.ShowScoreSummary),
    allowReview: toBool_(exam.AllowReview),
    brandName: branding.brandName,
    brandLogoUrl: branding.brandLogoUrl,
    signatureUrl: branding.signatureUrl,
    passportUrl: normalizeImageUrl_(candidateInfo.PassportUrl || ''),
    review: toBool_(exam.AllowReview) ? review : []
  });
}

function assignRankingsForExam_(results, examCode) {
  var subset = results.filter(function(r){ return normalize_(r.ExamCode) === normalize_(examCode) && !toBool_(r.IsDeleted); });
  subset.sort(function(a, b){
    var pa = toNum_(a.Percentage, 0), pb = toNum_(b.Percentage, 0);
    if (pb !== pa) return pb - pa;
    var sa = toNum_(a.Score, 0), sb = toNum_(b.Score, 0);
    if (sb !== sa) return sb - sa;
    return String(a.Timestamp).localeCompare(String(b.Timestamp));
  });
  var rankById = {};
  var rank = 0;
  var prevKey = '';
  for (var i = 0; i < subset.length; i++) {
    var key = subset[i].Percentage + '|' + subset[i].Score;
    if (key !== prevKey) rank = i + 1;
    rankById[String(subset[i].Id)] = ordinal_(rank);
    prevKey = key;
  }
  results.forEach(function(r){ if (rankById[String(r.Id)]) r.Ranking = rankById[String(r.Id)]; });
}

function listResultsByExam_(payload) {
  requireSession_(payload.token, ['admin']);
  var examCode = trim_(payload.examCode);
  var includeDeleted = toBool_(payload.includeDeleted);
  var rows = getResults_().filter(function(r){
    if (examCode && normalize_(r.ExamCode) !== normalize_(examCode)) return false;
    if (!includeDeleted && toBool_(r.IsDeleted)) return false;
    return true;
  }).map(function(r){
    return {
      id: r.Id || '',
      timestamp: r.Timestamp,
      examCode: r.ExamCode,
      attemptNo: r.AttemptNo,
      fullName: r.FullName,
      regId: r.RegId,
      username: r.Username || '',
      score: r.Score,
      total: r.Total,
      percentage: r.Percentage,
      passMark: r.PassMark,
      passStatus: r.PassStatus,
      ranking: r.Ranking || '',
      statusMessage: r.StatusMessage || '',
      isPublished: toBool_(r.IsPublished),
      isDeleted: toBool_(r.IsDeleted)
    };
  });
  rows.sort(function(a, b){
    var examCmp = String(a.examCode || '').localeCompare(String(b.examCode || ''));
    if (examCmp !== 0) return examCmp;
    return String(b.timestamp || '').localeCompare(String(a.timestamp || ''));
  });
  return response_(true, 'Results loaded successfully.', rows);
}

function updateResultRowsByIds_(payload, updater, successMessage) {
  var actor = requireAdminAction_(payload, true).user;
  var ids = normalizeIdList_(payload.resultIds || [payload.resultId]);
  if (!ids.length) return response_(false, 'No result selected.');
  var idMap = {};
  ids.forEach(function(id){ idMap[String(id)] = true; });
  var rows = getResults_();
  var changed = 0;
  rows.forEach(function(r){
    if (!idMap[String(r.Id || '')]) return;
    if (updater(r, actor) !== false) changed++;
  });
  saveResults_(rows);
  return response_(true, successMessage || (changed + ' result(s) updated.'), { changed: changed });
}

function setResultPublished_(payload) { payload.resultIds = [trim_(payload.resultId)]; return bulkSetResultPublished_(payload); }
function deleteResult_(payload) { payload.resultIds = [trim_(payload.resultId)]; return bulkDeleteResults_(payload); }
function restoreResult_(payload) { payload.resultIds = [trim_(payload.resultId)]; return bulkRestoreResults_(payload); }
function hardDeleteResult_(payload) { payload.resultIds = [trim_(payload.resultId)]; return bulkHardDeleteResults_(payload); }

function bulkSetResultPublished_(payload) {
  var published = toBool_(payload.published);
  return updateResultRowsByIds_(payload, function(r, actor){
    if (toBool_(r.IsDeleted)) return false;
    r.IsPublished = published;
    r.PublishedAt = nowIso_();
    r.PublishedBy = actor.Username;
  }, published ? 'Selected result(s) are now visible in the result checker.' : 'Selected result(s) have been hidden from the result checker.');
}

function bulkDeleteResults_(payload) {
  return updateResultRowsByIds_(payload, function(r, actor){
    if (toBool_(r.IsDeleted)) return false;
    r.IsDeleted = true;
    r.IsPublished = false;
    r.DeletedAt = nowIso_();
    r.DeletedBy = actor.Username;
  }, 'Selected result(s) deleted.');
}

function bulkRestoreResults_(payload) {
  return updateResultRowsByIds_(payload, function(r, actor){
    r.IsDeleted = false;
    r.RestoredAt = nowIso_();
    r.RestoredBy = actor.Username;
  }, 'Selected result(s) restored.');
}

function bulkHardDeleteResults_(payload) {
  requireAdminAction_(payload, true);
  var ids = normalizeIdList_(payload.resultIds || [payload.resultId]);
  if (!ids.length) return response_(false, 'No result selected.');
  var idMap = {};
  ids.forEach(function(id){ idMap[String(id)] = true; });
  var rows = getResults_();
  var kept = rows.filter(function(r){ return !idMap[String(r.Id || '')]; });
  var changed = rows.length - kept.length;
  saveResults_(kept);
  return response_(true, changed + ' result(s) deleted forever.', { changed: changed });
}

function driveFilePublicShape_(row) {
  var meta = {};
  try { meta = JSON.parse(row.MetaJson || '{}'); } catch (err) {}
  var fileId = trim_(row.DriveFileId);
  return {
    id: row.Id || '',
    examCode: row.ExamCode || '',
    regId: row.RegId || '',
    username: row.Username || '',
    originalName: row.OriginalName || '',
    createdAt: row.CreatedAt || '',
    driveFileId: fileId,
    driveUrl: row.DriveUrl || (fileId ? ('https://drive.google.com/file/d/' + fileId + '/view') : ''),
    viewUrl: fileId ? ('https://drive.google.com/uc?export=view&id=' + fileId) : '',
    thumbUrl: fileId ? ('https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1200') : '',
    fullName: meta.fullName || '',
    mimeType: meta.mimeType || '',
    durationSeconds: meta.durationSeconds || '',
    segmentLabel: meta.segmentLabel || '',
    mediaLabel: meta.mediaLabel || '',
    kind: trim_(row.Kind).toLowerCase(),
    isDeleted: toBool_(row.IsDeleted)
  };
}

function listSnapshotsByExam_(payload) {
  requireSession_(payload.token, ['admin']);
  var examCode = normalize_(payload.examCode);
  var regId = normalize_(payload.regId);
  var includeDeleted = toBool_(payload.includeDeleted);
  var limit = Math.max(1, Math.min(500, toNum_(payload.limit, 200)));
  var rows = getDriveFileRows_().filter(function(row){
    if (trim_(row.Kind).toLowerCase() !== 'snapshot') return false;
    if (examCode && normalize_(row.ExamCode) !== examCode) return false;
    if (regId && normalize_(row.RegId) !== regId) return false;
    if (!includeDeleted && toBool_(row.IsDeleted)) return false;
    return true;
  }).map(driveFilePublicShape_);
  rows.sort(function(a, b){ return String(b.createdAt).localeCompare(String(a.createdAt)); });
  if (rows.length > limit) rows = rows.slice(0, limit);
  return response_(true, 'Snapshots loaded.', rows);
}

function listAudioByExam_(payload) {
  requireSession_(payload.token, ['admin']);
  var examCode = normalize_(payload.examCode);
  var regId = normalize_(payload.regId);
  var includeDeleted = toBool_(payload.includeDeleted);
  var limit = Math.max(1, Math.min(500, toNum_(payload.limit, 200)));
  var rows = getDriveFileRows_().filter(function(row){
    if (trim_(row.Kind).toLowerCase() !== 'audio') return false;
    if (examCode && normalize_(row.ExamCode) !== examCode) return false;
    if (regId && normalize_(row.RegId) !== regId) return false;
    if (!includeDeleted && toBool_(row.IsDeleted)) return false;
    return true;
  }).map(driveFilePublicShape_);
  rows.sort(function(a, b){ return String(b.createdAt).localeCompare(String(a.createdAt)); });
  if (rows.length > limit) rows = rows.slice(0, limit);
  return response_(true, 'Audio clips loaded.', rows);
}

function listVideosByExam_(payload) {
  requireSession_(payload.token, ['admin']);
  var examCode = normalize_(payload.examCode);
  var regId = normalize_(payload.regId);
  var includeDeleted = toBool_(payload.includeDeleted);
  var limit = Math.max(1, Math.min(500, toNum_(payload.limit, 200)));
  var rows = getDriveFileRows_().filter(function(row){
    var kind = trim_(row.Kind).toLowerCase();
    if (kind !== 'video' && kind !== 'screen') return false;
    if (examCode && normalize_(row.ExamCode) !== examCode) return false;
    if (regId && normalize_(row.RegId) !== regId) return false;
    if (!includeDeleted && toBool_(row.IsDeleted)) return false;
    return true;
  }).map(driveFilePublicShape_);
  rows.sort(function(a, b){ return String(b.createdAt).localeCompare(String(a.createdAt)); });
  if (rows.length > limit) rows = rows.slice(0, limit);
  return response_(true, 'Video clips loaded.', rows);
}


function getProctoringFolderPathParts_(kind, examCode, regId) {
  var rootMap = {
    snapshot: 'Proctoring Snapshots',
    audio: 'Proctoring Audio',
    video: 'Proctoring Video',
    screen: 'Proctoring Screen'
  };
  var root = rootMap[kind] || 'Proctoring Snapshots';
  var parts = [root];
  if (trim_(examCode)) parts.push(safeName_(examCode));
  if (trim_(regId)) parts.push(safeName_(regId));
  return parts;
}

function getFolderChildrenForView_(folder, limit) {
  var out = [];
  var seen = 0;
  var folders = folder.getFolders();
  while (folders.hasNext() && seen < limit) {
    var childFolder = folders.next();
    out.push({
      type: 'folder',
      id: childFolder.getId(),
      name: childFolder.getName(),
      url: childFolder.getUrl()
    });
    seen++;
  }
  var files = folder.getFiles();
  while (files.hasNext() && seen < limit) {
    var childFile = files.next();
    out.push({
      type: 'file',
      id: childFile.getId(),
      name: childFile.getName(),
      url: childFile.getUrl(),
      mimeType: childFile.getMimeType()
    });
    seen++;
  }
  return out;
}

function getProctoringFolderView_(payload) {
  requireSession_(payload.token, ['admin']);
  var kind = normalize_(payload.kind) || 'snapshot';
  var examCode = trim_(payload.examCode);
  var regId = trim_(payload.regId);
  var includeDeleted = toBool_(payload.includeDeleted);
  var limit = Math.max(1, Math.min(200, toNum_(payload.limit, 100)));
  var folder = getNestedFolder_(getProctoringFolderPathParts_(kind, examCode, regId));
  var rows = getDriveFileRows_().filter(function(row){
    var rowKind = trim_(row.Kind).toLowerCase();
    if (kind === 'video') {
      if (rowKind !== 'video') return false;
    } else if (kind === 'screen') {
      if (rowKind !== 'screen') return false;
    } else if (rowKind !== kind) {
      return false;
    }
    if (examCode && normalize_(row.ExamCode) !== normalize_(examCode)) return false;
    if (regId && normalize_(row.RegId) !== normalize_(regId)) return false;
    if (!includeDeleted && toBool_(row.IsDeleted)) return false;
    return true;
  }).map(driveFilePublicShape_);
  rows.sort(function(a, b){ return String(b.createdAt).localeCompare(String(a.createdAt)); });
  if (rows.length > limit) rows = rows.slice(0, limit);
  var children = getFolderChildrenForView_(folder, limit);
  return response_(true, 'Drive folder loaded.', {
    folder: {
      kind: kind,
      name: folder.getName(),
      folderId: folder.getId(),
      folderUrl: folder.getUrl(),
      examCode: examCode || '',
      regId: regId || ''
    },
    children: children,
    items: rows
  });
}

function updateDriveRowsByIds_(payload, successMessage, updater, hardDelete) {
  requireAdminAction_(payload, true);
  var ids = normalizeIdList_(payload.fileIds || [payload.fileId]);
  if (!ids.length) return response_(false, 'No file selected.');
  var idMap = {};
  ids.forEach(function(id){ idMap[String(id)] = true; });
  var rows = getDriveFileRows_();
  var changed = 0;
  rows.forEach(function(r){
    if (!idMap[String(r.Id || '')]) return;
    if (hardDelete) {
      changed++;
      try { if (trim_(r.DriveFileId)) DriveApp.getFileById(trim_(r.DriveFileId)).setTrashed(true); } catch (err) {}
      r._remove = true;
    } else {
      updater(r);
      changed++;
    }
  });
  if (hardDelete) rows = rows.filter(function(r){ return !r._remove; });
  saveDriveFileRows_(rows);
  return response_(true, successMessage.replace('%s', String(changed)), { changed: changed });
}

function deleteSnapshot_(payload) { payload.fileIds = [trim_(payload.fileId)]; return bulkDeleteSnapshots_(payload); }
function restoreSnapshot_(payload) { payload.fileIds = [trim_(payload.fileId)]; return bulkRestoreSnapshots_(payload); }
function hardDeleteSnapshot_(payload) { payload.fileIds = [trim_(payload.fileId)]; return bulkHardDeleteSnapshots_(payload); }

function bulkDeleteSnapshots_(payload) {
  return updateDriveRowsByIds_(payload, '%s snapshot(s) deleted.', function(r){
    r.IsDeleted = true;
    r.DeletedAt = nowIso_();
    try { if (trim_(r.DriveFileId)) DriveApp.getFileById(trim_(r.DriveFileId)).setTrashed(true); } catch (err) {}
  }, false);
}

function bulkRestoreSnapshots_(payload) {
  return updateDriveRowsByIds_(payload, '%s snapshot(s) restored.', function(r){
    r.IsDeleted = false;
    r.RestoredAt = nowIso_();
    try { if (trim_(r.DriveFileId)) DriveApp.getFileById(trim_(r.DriveFileId)).setTrashed(false); } catch (err) {}
  }, false);
}

function bulkHardDeleteSnapshots_(payload) {
  return updateDriveRowsByIds_(payload, '%s snapshot(s) deleted forever.', function(){}, true);
}

function deleteVideo_(payload) { payload.fileIds = [trim_(payload.fileId)]; return bulkDeleteVideos_(payload); }
function restoreVideo_(payload) { payload.fileIds = [trim_(payload.fileId)]; return bulkRestoreVideos_(payload); }
function hardDeleteVideo_(payload) { payload.fileIds = [trim_(payload.fileId)]; return bulkHardDeleteVideos_(payload); }

function bulkDeleteVideos_(payload) {
  return updateDriveRowsByIds_(payload, '%s video clip(s) deleted.', function(r){
    r.IsDeleted = true;
    r.DeletedAt = nowIso_();
    try { if (trim_(r.DriveFileId)) DriveApp.getFileById(trim_(r.DriveFileId)).setTrashed(true); } catch (err) {}
  }, false);
}

function bulkRestoreVideos_(payload) {
  return updateDriveRowsByIds_(payload, '%s video clip(s) restored.', function(r){
    r.IsDeleted = false;
    r.RestoredAt = nowIso_();
    try { if (trim_(r.DriveFileId)) DriveApp.getFileById(trim_(r.DriveFileId)).setTrashed(false); } catch (err) {}
  }, false);
}

function bulkHardDeleteVideos_(payload) {
  return updateDriveRowsByIds_(payload, '%s video clip(s) deleted forever.', function(){}, true);
}

function exportResultsByExam_(payload) {
  requireSession_(payload.token, ['admin']);
  var examCode = trim_(payload.examCode);
  var rows = getResults_().filter(function(r){ return normalize_(r.ExamCode) === normalize_(examCode) && !toBool_(r.IsDeleted); });
  var csvRows = [['timestamp','examCode','attemptNo','fullName','regId','username','score','total','percentage','passMark','passStatus','ranking','passedNos','failedNos','statusMessage']];
  rows.forEach(function(r){
    csvRows.push([r.Timestamp, r.ExamCode, r.AttemptNo, r.FullName, r.RegId, r.Username, r.Score, r.Total, r.Percentage, r.PassMark, r.PassStatus, r.Ranking, r.PassedNos, r.FailedNos, r.StatusMessage]);
  });
  var csv = csvRows.map(function(r){ return r.map(csvEscape_).join(','); }).join('\n');
  var filename = 'results_' + safeName_(examCode || 'exam') + '.csv';
  saveTextBackupFile_('Results Exports', filename, csv, { kind: 'results_export', examCode: examCode });
  return response_(true, 'Results export prepared successfully.', { csv: csv, filename: filename });
}



function authenticateStudentForResultAccess_(regId, password) {
  var user = findStudentByRegId_(regId) || findUserByUsername_(regId);
  if (!user || user.Role !== 'student' || toBool_(user.IsDeleted) || !toBool_(user.IsActive)) return null;
  if (user.PasswordHash !== hashPassword_(password)) return null;
  return user;
}

function resultShowScoreSummaryForChecker_(result, exam) {
  if (result && String(result.ShowScoreSummary || '').trim() !== '') return toBool_(result.ShowScoreSummary);
  return true;
}

function resultAllowReviewForChecker_(result, exam) {
  if (result && String(result.AllowReview || '').trim() !== '') return toBool_(result.AllowReview);
  return exam ? toBool_(exam.AllowReview) : false;
}

function buildPublicResultResponse_(result, exam, candidateInfo, branding) {
  var review = [];
  try { review = JSON.parse(result.ReviewJson || '[]'); } catch (err) {}
  return {
    resultId: result.Id || '',
    fullName: result.FullName,
    regId: result.RegId,
    username: result.Username,
    examTitle: exam ? exam.Title : result.ExamCode,
    examCode: result.ExamCode,
    attemptNo: result.AttemptNo,
    score: toNum_(result.Score, 0),
    total: toNum_(result.Total, 0),
    percentage: toNum_(result.Percentage, 0),
    passMark: toNum_(result.PassMark, 50),
    ranking: result.Ranking || '—',
    passedNos: result.PassedNos || 'None',
    failedNos: result.FailedNos || 'None',
    passedStatus: result.PassStatus || '',
    statusMessage: result.StatusMessage || '',
    allowReview: resultAllowReviewForChecker_(result, exam),
    showScoreSummary: resultShowScoreSummaryForChecker_(result, exam),
    brandName: branding.brandName,
    brandLogoUrl: branding.brandLogoUrl,
    signatureUrl: branding.signatureUrl,
    passportUrl: normalizeImageUrl_(candidateInfo.PassportUrl || ''),
    review: review
  };
}

function listPublishedResultsForStudent_(payload) {
  var regId = trim_(payload.regId);
  var password = trim_(payload.password);
  if (!regId || !password) return response_(false, 'Registration ID and password are required.');

  var user = authenticateStudentForResultAccess_(regId, password);
  if (!user) return response_(false, 'Invalid Registration ID or password.');

  var rows = getResults_().filter(function(r){
    return !toBool_(r.IsDeleted) && toBool_(r.IsPublished) && normalize_(r.RegId) === normalize_(regId);
  });

  rows.sort(function(a, b){
    var tc = String(b.Timestamp || '').localeCompare(String(a.Timestamp || ''));
    if (tc !== 0) return tc;
    return toNum_(b.AttemptNo, 0) - toNum_(a.AttemptNo, 0);
  });

  var exams = getExams_();
  var examMap = {};
  exams.forEach(function(exam){ examMap[normalize_(exam.ExamCode)] = exam; });
  var results = rows.map(function(r){
    var exam = examMap[normalize_(r.ExamCode)] || null;
    var showScoreSummary = resultShowScoreSummaryForChecker_(r, exam);
    return {
      id: r.Id,
      examCode: r.ExamCode,
      examTitle: exam ? exam.Title : (r.ExamCode || 'Untitled Exam'),
      attemptNo: toNum_(r.AttemptNo, 1),
      percentage: toNum_(r.Percentage, 0),
      score: toNum_(r.Score, 0),
      total: toNum_(r.Total, 0),
      passMark: toNum_(r.PassMark, 50),
      showScoreSummary: showScoreSummary,
      status: r.PassStatus || '',
      timestamp: r.Timestamp || '',
      statusMessage: r.StatusMessage || ''
    };
  });

  return response_(true, results.length ? 'Published result list loaded.' : 'No published result found for this student yet.', {
    regId: regId,
    fullName: user.FullName || '',
    results: results
  });
}

function checkResultPublic_(payload) {
  var examCode = trim_(payload.examCode);
  var regId = trim_(payload.regId);
  var password = trim_(payload.password);
  if (!regId || !password) return response_(false, 'Registration ID and password are required.');

  var user = authenticateStudentForResultAccess_(regId, password);
  if (!user) return response_(false, 'Invalid Registration ID or password.');

  var eligible = getResults_().filter(function(r){
    if (toBool_(r.IsDeleted) || !toBool_(r.IsPublished)) return false;
    if (normalize_(r.RegId) !== normalize_(regId)) return false;
    if (examCode && normalize_(r.ExamCode) !== normalize_(examCode)) return false;
    return true;
  });

  if (!eligible.length) return response_(false, examCode ? 'No published result found for this exam.' : 'No published result found for this student yet.');

  eligible.sort(function(a, b){
    if (!examCode) {
      var tc = String(b.Timestamp || '').localeCompare(String(a.Timestamp || ''));
      if (tc !== 0) return tc;
    }
    return toNum_(b.AttemptNo, 0) - toNum_(a.AttemptNo, 0);
  });

  var result = eligible[0];
  var exam = findExam_(result.ExamCode);
  var candidateInfo = findCandidateByRegId_(result.RegId) || {};
  var branding = getResultBranding_();

  return response_(true, 'Result loaded successfully.', buildPublicResultResponse_(result, exam, candidateInfo, branding));
}

function checkResultPublicById_(payload) {
  var resultId = trim_(payload.resultId);
  var regId = trim_(payload.regId);
  var password = trim_(payload.password);
  if (!resultId || !regId || !password) return response_(false, 'Registration ID, password, and result selection are required.');

  var user = authenticateStudentForResultAccess_(regId, password);
  if (!user) return response_(false, 'Invalid Registration ID or password.');

  var result = null;
  var rows = getResults_();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].Id || '') === String(resultId) && !toBool_(rows[i].IsDeleted) && toBool_(rows[i].IsPublished) && normalize_(rows[i].RegId) === normalize_(regId)) {
      result = rows[i];
      break;
    }
  }
  if (!result) return response_(false, 'The selected published result could not be found.');

  var exam = findExam_(result.ExamCode);
  var candidateInfo = findCandidateByRegId_(result.RegId) || {};
  var branding = getResultBranding_();
  return response_(true, 'Result loaded successfully.', buildPublicResultResponse_(result, exam, candidateInfo, branding));
}

function csvEscape_(value) {
  var text = String(value == null ? '' : value);
  if (/[",\n]/.test(text)) text = '"' + text.replace(/"/g, '""') + '"';
  return text;
}

function safeName_(value) {
  return String(value || 'file').replace(/[^a-z0-9_-]+/gi, '_');
}

function getRootFolder_() {
  var folders = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(ROOT_FOLDER_NAME);
}

function getOrCreateChildFolder_(parent, name) {
  var folders = parent.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return parent.createFolder(name);
}

function getNestedFolder_(names) {
  var folder = getRootFolder_();
  for (var i = 0; i < names.length; i++) folder = getOrCreateChildFolder_(folder, names[i]);
  return folder;
}

function logDriveFile_(kind, originalName, file, examCode, regId, username, meta) {
  var rows = getDriveFileRows_();
  rows.push({
    Id: Utilities.getUuid(),
    Kind: kind,
    OriginalName: originalName,
    DriveFileId: file.getId(),
    DriveUrl: file.getUrl(),
    ExamCode: examCode || '',
    RegId: regId || '',
    Username: username || '',
    MetaJson: JSON.stringify(meta || {}),
    CreatedAt: nowIso_(),
    IsDeleted: false,
    DeletedAt: '',
    DeletedBy: '',
    RestoredAt: '',
    RestoredBy: ''
  });
  saveDriveFileRows_(rows);
}

function saveTextBackupFile_(subFolder, filename, content, meta) {
  var folder = getNestedFolder_(['Admin Uploads', subFolder]);
  var blob = Utilities.newBlob(String(content || ''), 'text/csv', filename);
  var file = folder.createFile(blob);
  logDriveFile_(meta && meta.kind ? meta.kind : 'text_backup', filename, file, meta && meta.examCode, meta && meta.regId, meta && meta.username, meta || {});
  return file;
}

function persistQuestionImageIfPossible_(imageUrl, examCode) {
  imageUrl = normalizeImageUrl_(imageUrl);
  if (!imageUrl) return { imageUrl: '', driveFileId: '', sourceUrl: '' };
  if (/drive\.google\.com\/uc\?export=view&id=/i.test(imageUrl)) return { imageUrl: imageUrl, driveFileId: '', sourceUrl: imageUrl };
  try {
    var response = UrlFetchApp.fetch(imageUrl, { muteHttpExceptions: true, followRedirects: true, headers: { 'User-Agent': 'Mozilla/5.0' } });
    var code = response.getResponseCode();
    if (code >= 200 && code < 300) {
      var blob = response.getBlob();
      var contentType = blob.getContentType() || 'image/jpeg';
      var ext = 'jpg';
      if (/png/i.test(contentType)) ext = 'png';
      if (/gif/i.test(contentType)) ext = 'gif';
      if (/webp/i.test(contentType)) ext = 'webp';
      var folder = getNestedFolder_(['Admin Uploads', 'Question Images', safeName_(examCode || 'general')]);
      var file = folder.createFile(blob.setName('question_image_' + Utilities.getUuid() + '.' + ext));
      try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (err) {}
      logDriveFile_('question_image', file.getName(), file, examCode, '', '', { sourceUrl: imageUrl });
      return { imageUrl: 'https://drive.google.com/uc?export=view&id=' + file.getId(), driveFileId: file.getId(), sourceUrl: imageUrl };
    }
  } catch (err) {}
  try {
    saveTextBackupFile_('Question Image Links', 'image_link_' + Utilities.getUuid() + '.txt', imageUrl, { kind: 'question_image_link', examCode: examCode, sourceUrl: imageUrl });
  } catch (e) {}
  return { imageUrl: imageUrl, driveFileId: '', sourceUrl: imageUrl };
}

function uploadSnapshot_(payload) {
  var auth = requireSession_(payload.token, ['student']);
  var examCode = trim_(payload.examCode);
  var regId = trim_(payload.regId);
  var fullName = trim_(payload.fullName);
  var imageData = trim_(payload.imageData);
  var mimeType = trim_(payload.mimeType) || 'image/jpeg';
  if (!examCode || !regId || !imageData) return response_(false, 'Exam code, Reg ID, and image data are required.');
  var folder = getNestedFolder_(['Proctoring Snapshots', safeName_(examCode), safeName_(regId)]);
  var bytes = Utilities.base64Decode(imageData);
  var ext = /png/i.test(mimeType) ? 'png' : 'jpg';
  var filename = safeName_(regId) + '_' + Utilities.formatDate(new Date(), TZ, 'yyyyMMdd_HHmmss') + '.' + ext;
  var file = folder.createFile(Utilities.newBlob(bytes, mimeType, filename));
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (err) {}
  logDriveFile_('snapshot', filename, file, examCode, regId, auth.user.Username, { fullName: fullName, mimeType: mimeType, viewUrl: 'https://drive.google.com/uc?export=view&id=' + file.getId() });
  return response_(true, 'Snapshot uploaded successfully.', { fileId: file.getId(), url: file.getUrl(), viewUrl: 'https://drive.google.com/uc?export=view&id=' + file.getId() });
}

function uploadAudioClip_(payload) {
  var auth = requireSession_(payload.token, ['student']);
  var examCode = trim_(payload.examCode);
  var regId = trim_(payload.regId);
  var fullName = trim_(payload.fullName);
  var audioData = trim_(payload.audioData);
  var mimeType = trim_(payload.mimeType) || 'audio/webm';
  var segmentLabel = trim_(payload.segmentLabel) || '';
  var durationSeconds = toNum_(payload.durationSeconds, 0);
  if (!examCode || !regId || !audioData) return response_(false, 'Exam code, Reg ID, and audio data are required.');
  var folder = getNestedFolder_(['Proctoring Audio', safeName_(examCode), safeName_(regId)]);
  var bytes = Utilities.base64Decode(audioData);
  var ext = 'webm';
  if (/mp4/i.test(mimeType)) ext = 'mp4';
  if (/mpeg|mp3/i.test(mimeType)) ext = 'mp3';
  if (/ogg/i.test(mimeType)) ext = 'ogg';
  var filename = safeName_(regId) + '_' + Utilities.formatDate(new Date(), TZ, 'yyyyMMdd_HHmmss') + (segmentLabel ? '_' + safeName_(segmentLabel) : '') + '.' + ext;
  var file = folder.createFile(Utilities.newBlob(bytes, mimeType, filename));
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (err) {}
  logDriveFile_('audio', filename, file, examCode, regId, auth.user.Username, { fullName: fullName, mimeType: mimeType, durationSeconds: durationSeconds, segmentLabel: segmentLabel });
  return response_(true, 'Audio clip uploaded successfully.', { fileId: file.getId(), url: file.getUrl() });
}

function uploadVideoClip_(payload) {
  var auth = requireSession_(payload.token, ['student']);
  var examCode = trim_(payload.examCode);
  var regId = trim_(payload.regId);
  var fullName = trim_(payload.fullName);
  var videoData = trim_(payload.videoData);
  var mimeType = trim_(payload.mimeType) || 'video/webm';
  var segmentLabel = trim_(payload.segmentLabel) || '';
  var durationSeconds = toNum_(payload.durationSeconds, 0);
  if (!examCode || !regId || !videoData) return response_(false, 'Exam code, Reg ID, and video data are required.');
  var folder = getNestedFolder_(['Proctoring Video', safeName_(examCode), safeName_(regId)]);
  var bytes = Utilities.base64Decode(videoData);
  var ext = 'webm';
  if (/mp4/i.test(mimeType)) ext = 'mp4';
  if (/ogg/i.test(mimeType)) ext = 'ogv';
  var filename = safeName_(regId) + '_' + Utilities.formatDate(new Date(), TZ, 'yyyyMMdd_HHmmss') + (segmentLabel ? '_' + safeName_(segmentLabel) : '') + '.' + ext;
  var file = folder.createFile(Utilities.newBlob(bytes, mimeType, filename));
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (err) {}
  logDriveFile_('video', filename, file, examCode, regId, auth.user.Username, { fullName: fullName, mimeType: mimeType, durationSeconds: durationSeconds, segmentLabel: segmentLabel, viewUrl: 'https://drive.google.com/file/d/' + file.getId() + '/preview' });
  return response_(true, 'Video clip uploaded successfully.', { fileId: file.getId(), url: file.getUrl() });
}

function uploadScreenClip_(payload) {
  var auth = requireSession_(payload.token, ['student']);
  var examCode = trim_(payload.examCode);
  var regId = trim_(payload.regId);
  var fullName = trim_(payload.fullName);
  var videoData = trim_(payload.videoData);
  var mimeType = trim_(payload.mimeType) || 'video/webm';
  var segmentLabel = trim_(payload.segmentLabel) || '';
  var durationSeconds = toNum_(payload.durationSeconds, 0);
  if (!examCode || !regId || !videoData) return response_(false, 'Exam code, Reg ID, and screen data are required.');
  var folder = getNestedFolder_(['Proctoring Screen', safeName_(examCode), safeName_(regId)]);
  var bytes = Utilities.base64Decode(videoData);
  var ext = 'webm';
  if (/mp4/i.test(mimeType)) ext = 'mp4';
  if (/ogg/i.test(mimeType)) ext = 'ogv';
  var filename = safeName_(regId) + '_' + Utilities.formatDate(new Date(), TZ, 'yyyyMMdd_HHmmss') + (segmentLabel ? '_' + safeName_(segmentLabel) : '') + '.' + ext;
  var file = folder.createFile(Utilities.newBlob(bytes, mimeType, filename));
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (err) {}
  logDriveFile_('screen', filename, file, examCode, regId, auth.user.Username, { fullName: fullName, mimeType: mimeType, durationSeconds: durationSeconds, segmentLabel: segmentLabel, mediaLabel: 'Screen', viewUrl: 'https://drive.google.com/file/d/' + file.getId() + '/preview' });
  return response_(true, 'Screen recording uploaded successfully.', { fileId: file.getId(), url: file.getUrl() });
}
