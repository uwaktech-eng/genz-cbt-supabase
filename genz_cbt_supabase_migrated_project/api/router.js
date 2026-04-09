const { createServiceClient, createAnonClient } = require('./_lib/supabase');
const { getConfig } = require('./_lib/config');
const {
  trim,
  normalize,
  toBool,
  toNum,
  nowIso,
  response,
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
} = require('./_lib/helpers');

const ELEVATED_ACTIONS = new Set([
  'saveSettings','createExam','setExamOptions','setExamActive','archiveExam','deleteExam','restoreExam','hardDeleteExam','bulkHardDeleteExams','setExamLock','duplicateExam',
  'addCandidate','importCandidates','generateStudentAccounts','setUserActive','deleteUser','restoreUser','hardDeleteUser','adminResetUserPassword',
  'addQuestion','updateQuestionByExam','deleteQuestionByExam','restoreQuestionByExam','hardDeleteQuestionByExam','importQuestions','clearQuestionsByExam','bulkDeleteQuestionsByExam','bulkRestoreQuestionsByExam','bulkHardDeleteQuestionsByExam',
  'createPermissionCode','deletePermissionCode','clearPermissionCodes',
  'bulkSetResultPublished','bulkDeleteResults','bulkRestoreResults','bulkHardDeleteResults',
  'deleteSnapshot','restoreSnapshot','hardDeleteSnapshot','bulkDeleteSnapshots','bulkRestoreSnapshots','bulkHardDeleteSnapshots',
  'deleteVideo','restoreVideo','hardDeleteVideo','bulkDeleteVideos','bulkRestoreVideos','bulkHardDeleteVideos'
]);

const PUBLIC_ACTIONS = new Set(['getSettings','getPublicSiteContent','checkResultPublic','checkResultPublicById','listPublishedResultsForStudent']);

async function getSettingsRow(supabase) {
  const existing = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
  if (existing.error && existing.error.code !== 'PGRST116') throw existing.error;
  if (existing.data) return existing.data;
  const created = await supabase.from('site_settings').insert({}).select('*').single();
  if (created.error) throw created.error;
  return created.data;
}

function settingsResponseShape(row) {
  return {
    portalLocked: !!row.portal_locked,
    portalNotice: row.portal_notice || '',
    resultBrandName: row.result_brand_name || 'Genz EduTech Innovations',
    resultBrandLogoUrl: row.result_brand_logo_url || '',
    resultSignatureUrl: row.result_signature_url || '',
    siteFaviconUrl: row.site_favicon_url || '',
    siteHeroTitle: row.site_hero_title || 'Genz CBT Pro',
    siteHeroSubtitle: row.site_hero_subtitle || 'A modern CBT and result platform for schools, tutorial centres, and institutions.',
    siteHeroBadge: row.site_hero_badge || 'Trusted digital assessment experience',
    siteAboutTitle: row.site_about_title || 'About Genz CBT Pro',
    siteAboutText: row.site_about_text || '',
    ceoName: row.ceo_name || '',
    ceoTitle: row.ceo_title || '',
    ceoImageUrl: row.ceo_image_url || '',
    ceoBio: row.ceo_bio || '',
    contributorsJsonText: JSON.stringify(row.contributors || []),
    institutionsJsonText: JSON.stringify(row.institutions || []),
    testimonialsJsonText: JSON.stringify(row.testimonials || []),
    tutorialVideosJsonText: JSON.stringify(row.tutorial_videos || []),
    socialLinksJsonText: JSON.stringify(row.social_links || []),
    contactEmail: row.contact_email || '',
    contactPhone: row.contact_phone || '',
    contactAddress: row.contact_address || '',
    termsContent: row.terms_content || '',
    privacyContent: row.privacy_content || '',
    cookiesContent: row.cookies_content || '',
    hasSubadminActionToken: !!row.subadmin_token_hash,
    subadminActionTokenTtlMinutes: row.subadmin_token_ttl_minutes || 60
  };
}

function publicSiteContentShape(row) {
  return {
    resultBrandName: row.result_brand_name || 'Genz EduTech Innovations',
    resultBrandLogoUrl: row.result_brand_logo_url || '',
    resultSignatureUrl: row.result_signature_url || '',
    siteFaviconUrl: row.site_favicon_url || '',
    siteHeroTitle: row.site_hero_title || 'Genz CBT Pro',
    siteHeroSubtitle: row.site_hero_subtitle || 'A modern CBT and result platform for schools, tutorial centres, and institutions.',
    siteHeroBadge: row.site_hero_badge || 'Trusted digital assessment experience',
    siteAboutTitle: row.site_about_title || 'About Genz CBT Pro',
    siteAboutText: row.site_about_text || '',
    ceoName: row.ceo_name || '',
    ceoTitle: row.ceo_title || '',
    ceoImageUrl: row.ceo_image_url || '',
    ceoBio: row.ceo_bio || '',
    contributors: row.contributors || [],
    institutions: row.institutions || [],
    testimonials: row.testimonials || [],
    tutorialVideos: row.tutorial_videos || [],
    socialLinks: row.social_links || [],
    contactEmail: row.contact_email || '',
    contactPhone: row.contact_phone || '',
    contactAddress: row.contact_address || '',
    termsContent: row.terms_content || '',
    privacyContent: row.privacy_content || '',
    cookiesContent: row.cookies_content || ''
  };
}

async function getRequester(req, supabase, explicitToken = '') {
  const token = getBearerToken(req, explicitToken);
  if (!token) return null;
  const authResult = await supabase.auth.getUser(token);
  if (authResult.error || !authResult.data?.user) return null;
  const profileResult = await supabase.from('profiles').select('*').eq('id', authResult.data.user.id).maybeSingle();
  if (profileResult.error || !profileResult.data) return null;
  return { token, authUser: authResult.data.user, profile: profileResult.data };
}

function ensureAuthenticated(requester) {
  if (!requester || !requester.profile) throw new Error('Your session has expired. Please log in again.');
  if (!requester.profile.is_active || requester.profile.deleted_at) throw new Error('Your account is inactive.');
}

function ensureAdmin(requester) {
  ensureAuthenticated(requester);
  if (!isAdminRole(requester.profile.role)) throw new Error('You do not have permission to perform this action.');
}

async function ensureElevatedAdmin(requester, supabase, action) {
  ensureAdmin(requester);
  if (!ELEVATED_ACTIONS.has(action)) return;
  if (requester.profile.role === 'principal_admin') return;
  const session = await supabase
    .from('subadmin_action_sessions')
    .select('id, expires_at, is_active')
    .eq('subadmin_user_id', requester.profile.id)
    .eq('is_active', true)
    .gt('expires_at', nowIso())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (session.error) throw session.error;
  if (!session.data) throw new Error('This action requires a valid subadmin action token session.');
}

async function findProfileByUsername(supabase, username) {
  const row = await supabase.from('profiles').select('*').eq('username', trim(username)).maybeSingle();
  if (row.error) throw row.error;
  return row.data;
}

async function findCandidateByRegId(supabase, regId) {
  const row = await supabase.from('candidates').select('*').eq('reg_id', trim(regId)).maybeSingle();
  if (row.error) throw row.error;
  return row.data;
}

async function findExamByCode(supabase, examCode) {
  const row = await supabase.from('exams').select('*').eq('exam_code', trim(examCode)).maybeSingle();
  if (row.error) throw row.error;
  return row.data;
}

async function signInForResultAccess(regId, password) {
  const supabase = createServiceClient();
  const profileResult = await supabase.from('profiles').select('*').eq('reg_id', trim(regId)).eq('role', 'student').maybeSingle();
  if (profileResult.error || !profileResult.data || !profileResult.data.is_active || profileResult.data.deleted_at) return null;
  const anon = createAnonClient();
  const signIn = await anon.auth.signInWithPassword({ email: deriveEmail(profileResult.data.username), password: trim(password) });
  if (signIn.error || !signIn.data?.user) return null;
  await anon.auth.signOut();
  return profileResult.data;
}

async function saveSettings(payload, requester, supabase) {
  await ensureElevatedAdmin(requester, supabase, 'saveSettings');
  const current = await getSettingsRow(supabase);
  const update = {
    id: current.id,
    portal_locked: toBool(payload.portalLocked),
    portal_notice: trim(payload.portalNotice),
    result_brand_name: trim(payload.resultBrandName) || 'Genz EduTech Innovations',
    result_brand_logo_url: trim(payload.resultBrandLogoUrl),
    result_signature_url: trim(payload.resultSignatureUrl),
    site_favicon_url: trim(payload.siteFaviconUrl),
    site_hero_title: trim(payload.siteHeroTitle) || 'Genz CBT Pro',
    site_hero_subtitle: trim(payload.siteHeroSubtitle) || 'A modern CBT and result platform for schools, tutorial centres, and institutions.',
    site_hero_badge: trim(payload.siteHeroBadge) || 'Trusted digital assessment experience',
    site_about_title: trim(payload.siteAboutTitle) || 'About Genz CBT Pro',
    site_about_text: String(payload.siteAboutText || ''),
    ceo_name: trim(payload.ceoName),
    ceo_title: trim(payload.ceoTitle),
    ceo_image_url: trim(payload.ceoImageUrl),
    ceo_bio: String(payload.ceoBio || ''),
    contributors: parseJsonArrayText(payload.contributorsJsonText || '[]', 'Contributors JSON'),
    institutions: parseJsonArrayText(payload.institutionsJsonText || '[]', 'Institutions JSON'),
    testimonials: parseJsonArrayText(payload.testimonialsJsonText || '[]', 'Testimonials JSON'),
    tutorial_videos: parseJsonArrayText(payload.tutorialVideosJsonText || '[]', 'Tutorial Videos JSON'),
    social_links: parseJsonArrayText(payload.socialLinksJsonText || '[]', 'Social Links JSON'),
    contact_email: trim(payload.contactEmail),
    contact_phone: trim(payload.contactPhone),
    contact_address: String(payload.contactAddress || ''),
    terms_content: String(payload.termsContent || ''),
    privacy_content: String(payload.privacyContent || ''),
    cookies_content: String(payload.cookiesContent || ''),
    updated_by: requester.profile.id,
    subadmin_token_ttl_minutes: Math.max(5, Math.min(1440, toNum(payload.subadminActionTokenTtlMinutes, current.subadmin_token_ttl_minutes || 60)))
  };
  const saved = await supabase.from('site_settings').upsert(update).select('*').single();
  if (saved.error) throw saved.error;
  return response(true, 'Settings loaded.', settingsResponseShape(saved.data));
}

function examPublicShape(exam) {
  return {
    examCode: exam.exam_code,
    title: exam.title,
    durationMinutes: exam.duration_minutes,
    showScoreSummary: !!exam.show_score_summary,
    allowReview: !!exam.allow_review,
    shuffleQuestions: !!exam.shuffle_questions,
    passMark: exam.pass_mark,
    resultMessage: exam.result_message || '',
    isActive: !!exam.is_active,
    isCurrent: !!exam.is_current,
    isArchived: !!exam.is_archived,
    isDeleted: !!exam.is_deleted,
    examLocked: !!exam.exam_locked,
    lockNotice: exam.lock_notice || '',
    captureSnapshots: exam.capture_snapshots !== false,
    recordAudio: !!exam.record_audio,
    recordVideo: !!exam.record_video,
    recordScreen: !!exam.record_screen,
    createdAt: exam.created_at,
    updatedAt: exam.updated_at
  };
}

function questionPublicShape(question, includeAnswer = true) {
  const row = {
    id: question.id,
    question: question.question_text,
    imageUrl: question.image_url || '',
    optionA: question.option_a,
    optionB: question.option_b,
    optionC: question.option_c,
    optionD: question.option_d,
    isDeleted: !!question.is_deleted,
    updatedAt: question.updated_at
  };
  if (includeAnswer) row.answer = question.correct_option;
  return row;
}

function resultPublicShape(result, examTitle = '') {
  return {
    id: result.id,
    timestamp: result.submitted_at,
    examCode: result.exams?.exam_code || '',
    examTitle: examTitle || result.exams?.title || result.exams?.exam_code || '',
    attemptNo: result.attempt_no,
    fullName: result.profiles?.full_name || result.candidates?.full_name || '',
    regId: result.profiles?.reg_id || result.candidates?.reg_id || '',
    username: result.profiles?.username || '',
    score: result.score,
    total: result.total,
    percentage: Number(result.percentage || 0),
    passMark: result.pass_mark,
    showScoreSummary: !!result.show_score_summary,
    allowReview: !!result.allow_review,
    passStatus: result.pass_status || '',
    ranking: result.ranking || '',
    passedNos: Array.isArray(result.passed_nos) ? result.passed_nos.join(', ') : (result.passed_nos || 'None'),
    failedNos: Array.isArray(result.failed_nos) ? result.failed_nos.join(', ') : (result.failed_nos || 'None'),
    statusMessage: result.status_message || '',
    isPublished: !!result.is_published,
    isDeleted: !!result.deleted_at,
    publishedAt: result.published_at,
    publishedBy: result.published_by || ''
  };
}

async function storeProctoringFile({ supabase, payload, requester, kind }) {
  ensureAuthenticated(requester);
  const exam = await findExamByCode(supabase, payload.examCode);
  if (!exam) throw new Error('Exam not found.');
  const regId = trim(payload.regId || requester.profile.reg_id);
  if (!regId) throw new Error('Registration ID is required.');
  const candidate = await findCandidateByRegId(supabase, regId);
  const base64 = payload.imageData || payload.audioData || payload.videoData;
  if (!base64) throw new Error('No upload data was supplied.');
  const cfg = getConfig();
  const ext = (trim(payload.mimeType).split('/')[1] || 'bin').replace(/[^a-z0-9]+/gi, '').toLowerCase() || 'bin';
  const time = Date.now();
  const segment = safeName(payload.segmentLabel || `${kind}_${time}`);
  const fileName = `${segment}.${ext}`;
  const storagePath = `${kind}/${safeName(exam.exam_code)}/${safeName(regId)}/${time}_${fileName}`;
  const buffer = Buffer.from(base64, 'base64');
  const upload = await supabase.storage.from(cfg.proctoringBucket).upload(storagePath, buffer, {
    contentType: trim(payload.mimeType) || 'application/octet-stream',
    upsert: false
  });
  if (upload.error) throw upload.error;
  const inserted = await supabase.from('proctoring_files').insert({
    exam_id: exam.id,
    student_user_id: requester.profile.id,
    candidate_id: candidate ? candidate.id : null,
    kind,
    storage_bucket: cfg.proctoringBucket,
    storage_path: storagePath,
    original_name: fileName,
    mime_type: trim(payload.mimeType) || 'application/octet-stream',
    duration_seconds: payload.durationSeconds ? toNum(payload.durationSeconds, null) : null,
    segment_label: trim(payload.segmentLabel),
    meta: {
      fullName: trim(payload.fullName || requester.profile.full_name),
      source: 'browser',
      uploadedAt: nowIso()
    }
  }).select('*').single();
  if (inserted.error) throw inserted.error;
  return response(true, 'Evidence uploaded.', { id: inserted.data.id });
}

async function listProctoringByKind({ supabase, requester, payload, kind }) {
  ensureAdmin(requester);
  const examCode = trim(payload.examCode);
  const regId = trim(payload.regId);
  const includeDeleted = toBool(payload.includeDeleted);
  let query = supabase
    .from('proctoring_files')
    .select('*, exams!inner(exam_code), profiles!inner(username, full_name, reg_id)')
    .eq('kind', kind)
    .order('created_at', { ascending: false })
    .limit(Math.max(1, Math.min(500, toNum(payload.limit, 200))));
  if (examCode) query = query.eq('exams.exam_code', examCode);
  if (regId) query = query.eq('profiles.reg_id', regId);
  if (!includeDeleted) query = query.is('deleted_at', null);
  const rows = await query;
  if (rows.error) throw rows.error;
  const cfg = getConfig();
  const mapped = await Promise.all((rows.data || []).map(async (item) => {
    const signed = await supabase.storage.from(cfg.proctoringBucket).createSignedUrl(item.storage_path, 60 * 60);
    const viewUrl = signed.data?.signedUrl || '';
    return {
      id: item.id,
      kind: item.kind,
      examCode: item.exams?.exam_code || '',
      regId: item.profiles?.reg_id || '',
      fullName: item.profiles?.full_name || '',
      originalName: item.original_name || '',
      createdAt: item.created_at,
      driveUrl: viewUrl,
      viewUrl,
      thumbUrl: viewUrl,
      isDeleted: !!item.deleted_at
    };
  }));
  return response(true, mapped.length ? 'Evidence loaded.' : 'No evidence found for this filter yet.', mapped);
}

async function getProctoringFolderView({ supabase, requester, payload }) {
  const kind = trim(payload.kind || 'snapshot');
  const list = await listProctoringByKind({ supabase, requester, payload, kind });
  return response(list.ok, list.message, {
    folder: {
      name: `${kind} evidence`,
      examCode: trim(payload.examCode),
      regId: trim(payload.regId),
      folderUrl: ''
    },
    children: [],
    items: list.data
  });
}

async function applySoftDeleteByIds({ supabase, requester, payload, kinds, mode }) {
  ensureAdmin(requester);
  const ids = Array.isArray(payload.fileIds) ? payload.fileIds.map(String).filter(Boolean) : [];
  if (!ids.length) throw new Error('No file IDs were supplied.');
  const query = supabase.from('proctoring_files');
  if (mode === 'hard') {
    const selected = await supabase.from('proctoring_files').select('storage_bucket, storage_path').in('id', ids);
    if (selected.error) throw selected.error;
    const cfg = getConfig();
    const paths = (selected.data || []).map(item => item.storage_path).filter(Boolean);
    if (paths.length) await supabase.storage.from(cfg.proctoringBucket).remove(paths);
    const deleted = await query.delete().in('id', ids);
    if (deleted.error) throw deleted.error;
    return response(true, `${ids.length} file(s) deleted forever.`, { changed: ids.length });
  }
  const patch = mode === 'restore'
    ? { deleted_at: null, deleted_by: null }
    : { deleted_at: nowIso(), deleted_by: requester.profile.id };
  const updated = await query.update(patch).in('id', ids);
  if (updated.error) throw updated.error;
  const verb = mode === 'restore' ? 'restored' : 'deleted';
  return response(true, `${ids.length} file(s) ${verb}.`, { changed: ids.length });
}

async function savePermissionCode(payload, requester, supabase) {
  await ensureElevatedAdmin(requester, supabase, 'createPermissionCode');
  const exam = await findExamByCode(supabase, payload.examCode);
  if (!exam) throw new Error('Exam not found.');
  const regId = trim(payload.regId);
  const candidate = regId ? await findCandidateByRegId(supabase, regId) : null;
  const username = trim(payload.username);
  const student = username ? await findProfileByUsername(supabase, username) : null;
  const code = trim(payload.permissionCode) || randomPassword(10).replace(/[^A-Za-z0-9]/g, 'A').slice(0, 10).toUpperCase();
  const inserted = await supabase.from('permission_codes').insert({
    code,
    exam_id: exam.id,
    candidate_id: candidate ? candidate.id : null,
    student_user_id: student ? student.id : null,
    reason: trim(payload.reason),
    status: 'active',
    created_by: requester.profile.id
  }).select('*, exams(exam_code), candidates(reg_id), profiles(username)').single();
  if (inserted.error) throw inserted.error;
  return response(true, 'Permission code created successfully.', {
    permissionCode: inserted.data.code,
    examCode: exam.exam_code,
    regId: candidate?.reg_id || regId || '',
    username: student?.username || username || '',
    status: inserted.data.status,
    reason: inserted.data.reason || ''
  });
}

async function verifyPermissionCode({ supabase, examId, regId, username, code }) {
  const raw = trim(code);
  if (!raw) return null;
  let query = supabase.from('permission_codes').select('*').eq('exam_id', examId).eq('code', raw).eq('status', 'active').limit(1).maybeSingle();
  const row = await query;
  if (row.error) throw row.error;
  if (!row.data) return null;
  if (row.data.candidate_id) {
    const candidate = await supabase.from('candidates').select('reg_id').eq('id', row.data.candidate_id).maybeSingle();
    if (candidate.error) throw candidate.error;
    if (candidate.data && normalize(candidate.data.reg_id) !== normalize(regId)) return null;
  }
  if (row.data.student_user_id) {
    const profile = await supabase.from('profiles').select('username').eq('id', row.data.student_user_id).maybeSingle();
    if (profile.error) throw profile.error;
    if (profile.data && normalize(profile.data.username) !== normalize(username)) return null;
  }
  return row.data;
}

async function buildStudentResultPayload(supabase, resultRow) {
  const exam = await supabase.from('exams').select('*').eq('id', resultRow.exam_id).maybeSingle();
  if (exam.error) throw exam.error;
  const candidate = resultRow.candidate_id
    ? await supabase.from('candidates').select('*').eq('id', resultRow.candidate_id).maybeSingle()
    : { data: null, error: null };
  if (candidate.error) throw candidate.error;
  const settings = await getSettingsRow(supabase);
  return {
    resultId: resultRow.id,
    brandName: settings.result_brand_name || 'Genz EduTech Innovations',
    brandLogoUrl: settings.result_brand_logo_url || '',
    signatureUrl: settings.result_signature_url || '',
    fullName: candidate.data?.full_name || '',
    regId: candidate.data?.reg_id || '',
    examTitle: exam.data?.title || '',
    examCode: exam.data?.exam_code || '',
    attemptNo: resultRow.attempt_no,
    score: resultRow.score,
    total: resultRow.total,
    percentage: Number(resultRow.percentage || 0),
    passMark: resultRow.pass_mark,
    passStatus: resultRow.pass_status,
    passedNos: Array.isArray(resultRow.passed_nos) ? resultRow.passed_nos.join(', ') || 'None' : 'None',
    failedNos: Array.isArray(resultRow.failed_nos) ? resultRow.failed_nos.join(', ') || 'None' : 'None',
    statusMessage: resultRow.status_message || '',
    allowReview: !!resultRow.allow_review,
    showScoreSummary: !!resultRow.show_score_summary,
    ranking: resultRow.ranking || '—',
    passportUrl: candidate.data?.passport_url || '',
    review: Array.isArray(resultRow.review_json) ? resultRow.review_json : []
  };
}

async function handleAction(action, payload, req) {
  const supabase = createServiceClient();
  const requester = PUBLIC_ACTIONS.has(action) ? await getRequester(req, supabase, payload.token) : await getRequester(req, supabase, payload.token);

  switch (action) {
    case 'signup': {
      const fullName = trim(payload.fullName);
      const username = trim(payload.username);
      const password = trim(payload.password);
      const role = normalize(payload.role);
      if (!fullName || !username || !password) return response(false, 'Full name, username, and password are required.');
      const existing = await findProfileByUsername(supabase, username);
      if (existing) return response(false, 'That username already exists.');
      let userRole = role;
      let createdBy = null;
      const principals = await supabase.from('profiles').select('id').eq('role', 'principal_admin').limit(1);
      if (principals.error) throw principals.error;
      if (role === 'admin') {
        if (!(principals.data || []).length) {
          if (trim(payload.adminKey) !== getConfig().initialAdminSignupKey) return response(false, 'Invalid admin signup key.');
          userRole = 'principal_admin';
        } else {
          ensureAuthenticated(requester);
          if (requester.profile.role !== 'principal_admin') return response(false, 'Public admin signup is disabled. A principal admin must add subadmins from the dashboard.');
          userRole = 'subadmin';
          createdBy = requester.profile.id;
        }
      } else if (role === 'subadmin') {
        ensureAuthenticated(requester);
        if (requester.profile.role !== 'principal_admin') return response(false, 'Only the principal admin can create subadmins.');
        userRole = 'subadmin';
        createdBy = requester.profile.id;
      } else if (role === 'student') {
        userRole = 'student';
      } else {
        return response(false, 'Invalid signup role.');
      }
      const created = await supabase.auth.admin.createUser({
        email: deriveEmail(username),
        password,
        email_confirm: true,
        user_metadata: { username, role: userRole, full_name: fullName }
      });
      if (created.error) return response(false, created.error.message || 'Unable to create account.');
      const inserted = await supabase.from('profiles').insert({
        id: created.data.user.id,
        username,
        role: userRole,
        full_name: fullName,
        reg_id: trim(payload.regId) || null,
        created_by: createdBy
      });
      if (inserted.error) {
        await supabase.auth.admin.deleteUser(created.data.user.id);
        return response(false, inserted.error.message || 'Unable to save profile.');
      }
      const label = userRole === 'principal_admin' ? 'Principal admin' : (userRole === 'subadmin' ? 'Subadmin' : 'Student');
      return response(true, `${label} account created successfully.`, { username, role: userRole });
    }

    case 'getSettings': {
      const row = await getSettingsRow(supabase);
      return response(true, 'Settings loaded.', settingsResponseShape(row));
    }

    case 'getPublicSiteContent': {
      const row = await getSettingsRow(supabase);
      return response(true, 'Public site content loaded.', publicSiteContentShape(row));
    }

    case 'saveSettings':
      return await saveSettings(payload, requester, supabase);

    case 'saveSubadminActionToken': {
      ensureAuthenticated(requester);
      if (requester.profile.role !== 'principal_admin') return response(false, 'Only the principal admin can save the subadmin action token.');
      const token = trim(payload.tokenValue || payload.actionToken || payload.token || payload.subadminActionToken);
      if (!token) return response(false, 'Token value is required.');
      const ttl = Math.max(5, Math.min(1440, toNum(payload.ttlMinutes || payload.subadminActionTokenTtlMinutes, 60)));
      const row = await getSettingsRow(supabase);
      const saved = await supabase.from('site_settings').update({ subadmin_token_hash: sha256(token), subadmin_token_ttl_minutes: ttl, updated_by: requester.profile.id }).eq('id', row.id);
      if (saved.error) throw saved.error;
      return response(true, 'Subadmin action token saved successfully.', { ttlMinutes: ttl });
    }

    case 'activateSubadminActionToken': {
      ensureAuthenticated(requester);
      if (!['subadmin', 'admin'].includes(requester.profile.role)) return response(false, 'Only a subadmin or admin can activate the action token.');
      const token = trim(payload.actionToken || payload.tokenValue || payload.subadminActionToken || payload.token);
      if (!token) return response(false, 'Action token is required.');
      const row = await getSettingsRow(supabase);
      if (!row.subadmin_token_hash) return response(false, 'No subadmin action token has been configured yet.');
      if (sha256(token) !== row.subadmin_token_hash) return response(false, 'The action token you entered is invalid.');
      await supabase.from('subadmin_action_sessions').update({ is_active: false }).eq('subadmin_user_id', requester.profile.id).eq('is_active', true);
      const expiresAt = new Date(Date.now() + (row.subadmin_token_ttl_minutes || 60) * 60 * 1000).toISOString();
      const created = await supabase.from('subadmin_action_sessions').insert({ subadmin_user_id: requester.profile.id, session_token_hash: sha256(token + requester.profile.id + expiresAt), expires_at: expiresAt, is_active: true }).select('*').single();
      if (created.error) throw created.error;
      return response(true, 'Subadmin action session activated successfully.', { expiresAt });
    }

    case 'createExam': {
      await ensureElevatedAdmin(requester, supabase, 'createExam');
      const examCode = trim(payload.examCode);
      const title = trim(payload.title);
      if (!examCode || !title) return response(false, 'Exam code and title are required.');
      const existing = await findExamByCode(supabase, examCode);
      if (existing) return response(false, 'That exam code already exists.');
      const inserted = await supabase.from('exams').insert({
        exam_code: examCode,
        title,
        duration_minutes: Math.max(1, toNum(payload.durationMinutes, 20)),
        show_score_summary: toBool(payload.showScoreSummary ?? true),
        allow_review: toBool(payload.allowReview),
        shuffle_questions: toBool(payload.shuffleQuestions),
        pass_mark: Math.max(0, Math.min(100, toNum(payload.passMark, 50))),
        result_message: trim(payload.resultMessage),
        created_by: requester.profile.id,
        updated_by: requester.profile.id,
        capture_snapshots: payload.captureSnapshots === undefined ? true : toBool(payload.captureSnapshots),
        record_audio: toBool(payload.recordAudio),
        record_video: toBool(payload.recordVideo),
        record_screen: toBool(payload.recordScreen)
      }).select('*').single();
      if (inserted.error) return response(false, inserted.error.message || 'Unable to create exam.');
      return response(true, 'Exam created successfully.', examPublicShape(inserted.data));
    }

    case 'listExams': {
      ensureAdmin(requester);
      const rows = await supabase.from('exams').select('*').order('created_at', { ascending: false });
      if (rows.error) throw rows.error;
      return response(true, 'Exams loaded.', (rows.data || []).map(examPublicShape));
    }

    case 'setExamOptions': {
      await ensureElevatedAdmin(requester, supabase, 'setExamOptions');
      const exam = await findExamByCode(supabase, payload.examCode);
      if (!exam) return response(false, 'Exam not found.');
      const updated = await supabase.from('exams').update({
        show_score_summary: toBool(payload.showScoreSummary ?? exam.show_score_summary),
        allow_review: toBool(payload.allowReview),
        shuffle_questions: toBool(payload.shuffleQuestions),
        pass_mark: Math.max(0, Math.min(100, toNum(payload.passMark, exam.pass_mark))),
        result_message: trim(payload.resultMessage),
        capture_snapshots: payload.captureSnapshots === undefined ? exam.capture_snapshots : toBool(payload.captureSnapshots),
        record_audio: payload.recordAudio === undefined ? exam.record_audio : toBool(payload.recordAudio),
        record_video: payload.recordVideo === undefined ? exam.record_video : toBool(payload.recordVideo),
        record_screen: payload.recordScreen === undefined ? exam.record_screen : toBool(payload.recordScreen),
        updated_by: requester.profile.id
      }).eq('id', exam.id).select('*').single();
      if (updated.error) throw updated.error;
      return response(true, 'Exam settings updated successfully.', examPublicShape(updated.data));
    }

    case 'setExamActive': {
      await ensureElevatedAdmin(requester, supabase, 'setExamActive');
      const exam = await findExamByCode(supabase, payload.examCode);
      if (!exam) return response(false, 'Exam not found.');
      const active = toBool(payload.active);
      if (active) {
        const reset = await supabase.from('exams').update({ is_current: false }).neq('id', exam.id);
        if (reset.error) throw reset.error;
      }
      const updated = await supabase.from('exams').update({ is_active: active, is_current: active, updated_by: requester.profile.id }).eq('id', exam.id).select('*').single();
      if (updated.error) throw updated.error;
      return response(true, active ? 'Exam activated successfully.' : 'Exam deactivated successfully.', examPublicShape(updated.data));
    }

    case 'archiveExam': {
      await ensureElevatedAdmin(requester, supabase, 'archiveExam');
      const exam = await findExamByCode(supabase, payload.examCode);
      if (!exam) return response(false, 'Exam not found.');
      const archived = payload.archived === undefined ? true : toBool(payload.archived);
      const updated = await supabase.from('exams').update({ is_archived: archived, updated_by: requester.profile.id }).eq('id', exam.id).select('*').single();
      if (updated.error) throw updated.error;
      return response(true, archived ? 'Exam archived successfully.' : 'Exam restored from archive.', examPublicShape(updated.data));
    }

    case 'deleteExam': {
      await ensureElevatedAdmin(requester, supabase, 'deleteExam');
      const exam = await findExamByCode(supabase, payload.examCode);
      if (!exam) return response(false, 'Exam not found.');
      const updated = await supabase.from('exams').update({ is_deleted: true, is_active: false, is_current: false, updated_by: requester.profile.id }).eq('id', exam.id).select('*').single();
      if (updated.error) throw updated.error;
      return response(true, 'Exam deleted successfully.', examPublicShape(updated.data));
    }

    case 'restoreExam': {
      await ensureElevatedAdmin(requester, supabase, 'restoreExam');
      const exam = await findExamByCode(supabase, payload.examCode);
      if (!exam) return response(false, 'Exam not found.');
      const updated = await supabase.from('exams').update({ is_deleted: false, updated_by: requester.profile.id }).eq('id', exam.id).select('*').single();
      if (updated.error) throw updated.error;
      return response(true, 'Exam restored successfully.', examPublicShape(updated.data));
    }

    case 'hardDeleteExam':
    case 'bulkHardDeleteExams': {
      await ensureElevatedAdmin(requester, supabase, action);
      const examCodes = action === 'hardDeleteExam' ? [trim(payload.examCode)] : (Array.isArray(payload.examCodes) ? payload.examCodes.map(trim).filter(Boolean) : []);
      if (!examCodes.length) return response(false, 'No exam codes supplied.');
      const doomed = await supabase.from('exams').select('id, exam_code').in('exam_code', examCodes);
      if (doomed.error) throw doomed.error;
      const ids = (doomed.data || []).map(row => row.id);
      if (!ids.length) return response(false, 'No matching exams were found.');
      const deleted = await supabase.from('exams').delete().in('id', ids);
      if (deleted.error) throw deleted.error;
      return response(true, `${ids.length} exam(s) deleted forever.`, { deletedCount: ids.length });
    }

    case 'setExamLock': {
      await ensureElevatedAdmin(requester, supabase, 'setExamLock');
      const exam = await findExamByCode(supabase, payload.examCode);
      if (!exam) return response(false, 'Exam not found.');
      const updated = await supabase.from('exams').update({ exam_locked: toBool(payload.locked), lock_notice: trim(payload.notice), updated_by: requester.profile.id }).eq('id', exam.id).select('*').single();
      if (updated.error) throw updated.error;
      return response(true, toBool(payload.locked) ? 'Exam locked successfully.' : 'Exam unlocked successfully.', examPublicShape(updated.data));
    }

    case 'duplicateExam': {
      await ensureElevatedAdmin(requester, supabase, 'duplicateExam');
      const source = await findExamByCode(supabase, payload.sourceExamCode);
      if (!source) return response(false, 'Source exam not found.');
      if (await findExamByCode(supabase, payload.newExamCode)) return response(false, 'The new exam code already exists.');
      const created = await supabase.from('exams').insert({
        exam_code: trim(payload.newExamCode),
        title: trim(payload.newTitle),
        duration_minutes: source.duration_minutes,
        show_score_summary: source.show_score_summary,
        allow_review: source.allow_review,
        shuffle_questions: source.shuffle_questions,
        pass_mark: source.pass_mark,
        result_message: source.result_message,
        is_active: false,
        is_current: false,
        is_archived: false,
        is_deleted: false,
        exam_locked: false,
        lock_notice: '',
        capture_snapshots: source.capture_snapshots,
        record_audio: source.record_audio,
        record_video: source.record_video,
        record_screen: source.record_screen,
        created_by: requester.profile.id,
        updated_by: requester.profile.id
      }).select('*').single();
      if (created.error) throw created.error;
      const questions = await supabase.from('exam_questions').select('*').eq('exam_id', source.id).order('display_order');
      if (questions.error) throw questions.error;
      let copied = 0;
      if ((questions.data || []).length) {
        const inserts = questions.data.map((q, index) => ({
          exam_id: created.data.id,
          question_text: q.question_text,
          image_url: q.image_url,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_option: q.correct_option,
          display_order: index + 1,
          is_deleted: false,
          source_url: q.source_url
        }));
        const copiedRows = await supabase.from('exam_questions').insert(inserts);
        if (copiedRows.error) throw copiedRows.error;
        copied = inserts.length;
      }
      return response(true, 'Exam duplicated successfully.', { copiedQuestions: copied });
    }

    case 'addCandidate': {
      await ensureElevatedAdmin(requester, supabase, 'addCandidate');
      const fullName = trim(payload.fullName);
      const regId = trim(payload.regId);
      if (!fullName || !regId) return response(false, 'Full name and Reg ID are required.');
      const inserted = await supabase.from('candidates').insert({ full_name: fullName, reg_id: regId, passport_url: trim(payload.passportUrl), created_by: requester.profile.id }).select('*').single();
      if (inserted.error) return response(false, inserted.error.message || 'Unable to add candidate.');
      return response(true, 'Candidate added successfully.', { fullName: inserted.data.full_name, regId: inserted.data.reg_id, passportUrl: inserted.data.passport_url || '' });
    }

    case 'importCandidates': {
      await ensureElevatedAdmin(requester, supabase, 'importCandidates');
      const rows = Array.isArray(payload.rows) ? payload.rows : [];
      let added = 0, skipped = 0;
      for (const raw of rows) {
        const fullName = trim(raw.fullName || raw.FullName || raw.name || raw.Name);
        const regId = trim(raw.regId || raw.RegId || raw.regid || raw.RegID);
        const passportUrl = trim(raw.passportUrl || raw.PassportUrl || raw.imageUrl || raw.ImageUrl);
        if (!fullName || !regId) { skipped += 1; continue; }
        const existing = await findCandidateByRegId(supabase, regId);
        if (existing) { skipped += 1; continue; }
        const inserted = await supabase.from('candidates').insert({ full_name: fullName, reg_id: regId, passport_url: passportUrl, created_by: requester.profile.id });
        if (inserted.error) { skipped += 1; continue; }
        added += 1;
      }
      return response(true, 'Candidates imported successfully.', { added, skipped });
    }

    case 'listCandidates': {
      ensureAdmin(requester);
      const rows = await supabase.from('candidates').select('*').order('full_name');
      if (rows.error) throw rows.error;
      const data = (rows.data || []).map(item => ({ fullName: item.full_name, regId: item.reg_id, passportUrl: item.passport_url || '' }));
      return response(true, 'Candidates loaded.', data);
    }

    case 'generateStudentAccounts': {
      await ensureElevatedAdmin(requester, supabase, 'generateStudentAccounts');
      const passwordLength = Math.max(6, toNum(payload.passwordLength, 8));
      const candidates = await supabase.from('candidates').select('*').order('full_name');
      if (candidates.error) throw candidates.error;
      let createdCount = 0, skippedCount = 0;
      const csvRows = [['fullName', 'regId', 'username', 'password']];
      for (const candidate of candidates.data || []) {
        const regId = trim(candidate.reg_id);
        let profile = await supabase.from('profiles').select('*').eq('reg_id', regId).maybeSingle();
        if (profile.error) throw profile.error;
        if (profile.data && profile.data.deleted_at) { skippedCount += 1; continue; }
        if (profile.data && profile.data.is_active) { skippedCount += 1; continue; }
        const baseUsername = trim(profile.data?.username || regId);
        let username = baseUsername;
        let suffix = 1;
        while (true) {
          const existing = await findProfileByUsername(supabase, username);
          if (!existing || (profile.data && existing.id === profile.data.id)) break;
          username = `${baseUsername}_${suffix++}`;
        }
        const password = randomPassword(passwordLength);
        if (profile.data) {
          const authUpdate = await supabase.auth.admin.updateUserById(profile.data.id, { password, email: deriveEmail(username), user_metadata: { username, role: 'student', full_name: candidate.full_name } });
          if (authUpdate.error) { skippedCount += 1; continue; }
          const updated = await supabase.from('profiles').update({ full_name: candidate.full_name, username, reg_id: regId, role: 'student', is_active: true, deleted_at: null }).eq('id', profile.data.id);
          if (updated.error) { skippedCount += 1; continue; }
        } else {
          const created = await supabase.auth.admin.createUser({ email: deriveEmail(username), password, email_confirm: true, user_metadata: { username, role: 'student', full_name: candidate.full_name } });
          if (created.error) { skippedCount += 1; continue; }
          const inserted = await supabase.from('profiles').insert({ id: created.data.user.id, username, role: 'student', full_name: candidate.full_name, reg_id: regId, created_by: requester.profile.id });
          if (inserted.error) {
            await supabase.auth.admin.deleteUser(created.data.user.id);
            skippedCount += 1;
            continue;
          }
        }
        csvRows.push([candidate.full_name, regId, username, password]);
        createdCount += 1;
      }
      const csv = csvRows.map(row => row.map(csvEscape).join(',')).join('\n');
      const filename = `student_accounts_passwords_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
      return response(true, 'Student passwords generated.', { createdCount, skippedCount, csv, filename });
    }

    case 'listAdmins': {
      ensureAdmin(requester);
      const rows = await supabase.from('profiles').select('*').in('role', ['principal_admin', 'subadmin', 'admin']);
      if (rows.error) throw rows.error;
      return response(true, 'Admins loaded.', sortByFullName((rows.data || []).map(publicProfileShape)));
    }

    case 'listStudents': {
      ensureAdmin(requester);
      const rows = await supabase.from('profiles').select('*').eq('role', 'student');
      if (rows.error) throw rows.error;
      return response(true, 'Students loaded.', sortByFullName((rows.data || []).map(publicProfileShape)));
    }

    case 'setUserActive': {
      await ensureElevatedAdmin(requester, supabase, 'setUserActive');
      const target = await findProfileByUsername(supabase, payload.username);
      if (!target) return response(false, 'User not found.');
      if (!canManageUser(requester.profile.role, target.role)) return response(false, 'You do not have permission to manage this user.');
      const active = toBool(payload.active);
      const updated = await supabase.from('profiles').update({ is_active: active }).eq('id', target.id).select('*').single();
      if (updated.error) throw updated.error;
      return response(true, active ? 'User activated successfully.' : 'User deactivated successfully.', publicProfileShape(updated.data));
    }

    case 'deleteUser': {
      await ensureElevatedAdmin(requester, supabase, 'deleteUser');
      const target = await findProfileByUsername(supabase, payload.username);
      if (!target) return response(false, 'User not found.');
      if (!canManageUser(requester.profile.role, target.role)) return response(false, 'You do not have permission to manage this user.');
      const updated = await supabase.from('profiles').update({ is_active: false, deleted_at: nowIso() }).eq('id', target.id).select('*').single();
      if (updated.error) throw updated.error;
      return response(true, 'User deleted successfully.', publicProfileShape(updated.data));
    }

    case 'restoreUser': {
      await ensureElevatedAdmin(requester, supabase, 'restoreUser');
      const target = await findProfileByUsername(supabase, payload.username);
      if (!target) return response(false, 'User not found.');
      if (!canManageUser(requester.profile.role, target.role)) return response(false, 'You do not have permission to manage this user.');
      const updated = await supabase.from('profiles').update({ is_active: true, deleted_at: null }).eq('id', target.id).select('*').single();
      if (updated.error) throw updated.error;
      return response(true, 'User restored successfully.', publicProfileShape(updated.data));
    }

    case 'hardDeleteUser': {
      await ensureElevatedAdmin(requester, supabase, 'hardDeleteUser');
      const target = await findProfileByUsername(supabase, payload.username);
      if (!target) return response(false, 'User not found.');
      if (!canManageUser(requester.profile.role, target.role)) return response(false, 'You do not have permission to manage this user.');
      const deleted = await supabase.auth.admin.deleteUser(target.id);
      if (deleted.error) throw deleted.error;
      return response(true, 'User deleted forever.');
    }

    case 'adminResetUserPassword': {
      await ensureElevatedAdmin(requester, supabase, 'adminResetUserPassword');
      const target = await findProfileByUsername(supabase, payload.username);
      if (!target) return response(false, 'User not found.');
      if (!canManageUser(requester.profile.role, target.role)) return response(false, 'You do not have permission to manage this user.');
      const updated = await supabase.auth.admin.updateUserById(target.id, { password: trim(payload.newPassword) });
      if (updated.error) return response(false, updated.error.message || 'Unable to reset password.');
      return response(true, `Password reset successfully for ${target.username}.`);
    }

    case 'verifyCandidate': {
      ensureAuthenticated(requester);
      if (requester.profile.role !== 'student') return response(false, 'Only students can verify candidates.');
      const fullName = trim(payload.fullName);
      const regId = trim(payload.regId);
      if (!fullName || !regId) return response(false, 'Full name and Registration ID are required.');
      const candidate = await findCandidateByRegId(supabase, regId);
      if (!candidate) return response(false, 'Candidate not found.');
      if (normalize(candidate.full_name) !== normalize(fullName)) return response(false, 'Full name does not match the registration record.');
      if (requester.profile.reg_id && normalize(requester.profile.reg_id) !== normalize(regId)) return response(false, 'This account is linked to another Registration ID.');
      const updated = await supabase.from('profiles').update({ reg_id: regId, full_name: requester.profile.full_name || candidate.full_name }).eq('id', requester.profile.id);
      if (updated.error) throw updated.error;
      return response(true, 'Candidate verified successfully.', { fullName: candidate.full_name, regId: candidate.reg_id });
    }

    case 'addQuestion': {
      await ensureElevatedAdmin(requester, supabase, 'addQuestion');
      const exam = await findExamByCode(supabase, payload.examCode);
      if (!exam) return response(false, 'Exam not found.');
      const count = await supabase.from('exam_questions').select('id', { count: 'exact', head: true }).eq('exam_id', exam.id);
      const displayOrder = (count.count || 0) + 1;
      const inserted = await supabase.from('exam_questions').insert({
        exam_id: exam.id,
        question_text: trim(payload.question),
        image_url: trim(payload.imageUrl),
        option_a: trim(payload.optionA),
        option_b: trim(payload.optionB),
        option_c: trim(payload.optionC),
        option_d: trim(payload.optionD),
        correct_option: normalize(payload.answer).toUpperCase(),
        display_order: displayOrder,
        is_deleted: false,
        source_url: trim(payload.sourceUrl)
      }).select('*').single();
      if (inserted.error) return response(false, inserted.error.message || 'Unable to add question.');
      return response(true, 'Question added successfully.', questionPublicShape(inserted.data));
    }

    case 'listQuestionsByExam': {
      ensureAdmin(requester);
      const exam = await findExamByCode(supabase, payload.examCode);
      if (!exam) return response(false, 'Exam not found.');
      const rows = await supabase.from('exam_questions').select('*').eq('exam_id', exam.id).order('display_order');
      if (rows.error) throw rows.error;
      const includeDeleted = toBool(payload.includeDeleted);
      const data = (rows.data || []).filter(item => includeDeleted || !item.is_deleted).map(item => questionPublicShape(item, true));
      return response(true, 'Questions loaded.', data);
    }

    case 'updateQuestionByExam': {
      await ensureElevatedAdmin(requester, supabase, 'updateQuestionByExam');
      const patch = {
        question_text: trim(payload.question),
        image_url: trim(payload.imageUrl),
        option_a: trim(payload.optionA),
        option_b: trim(payload.optionB),
        option_c: trim(payload.optionC),
        option_d: trim(payload.optionD),
        correct_option: normalize(payload.answer).toUpperCase()
      };
      const updated = await supabase.from('exam_questions').update(patch).eq('id', payload.questionId).select('*').single();
      if (updated.error) return response(false, updated.error.message || 'Unable to update question.');
      return response(true, 'Question updated successfully.', questionPublicShape(updated.data));
    }

    case 'deleteQuestionByExam':
    case 'restoreQuestionByExam':
    case 'hardDeleteQuestionByExam':
    case 'bulkDeleteQuestionsByExam':
    case 'bulkRestoreQuestionsByExam':
    case 'bulkHardDeleteQuestionsByExam':
    case 'clearQuestionsByExam': {
      await ensureElevatedAdmin(requester, supabase, action);
      let ids = [];
      if (action === 'clearQuestionsByExam') {
        const exam = await findExamByCode(supabase, payload.examCode);
        if (!exam) return response(false, 'Exam not found.');
        const rows = await supabase.from('exam_questions').select('id').eq('exam_id', exam.id).eq('is_deleted', false);
        if (rows.error) throw rows.error;
        ids = (rows.data || []).map(item => item.id);
      } else if (action.includes('bulk')) {
        ids = Array.isArray(payload.questionIds) ? payload.questionIds : [];
      } else {
        ids = [payload.questionId];
      }
      ids = ids.filter(Boolean);
      if (!ids.length) return response(false, 'No question IDs supplied.');
      if (action.includes('Hard')) {
        const deleted = await supabase.from('exam_questions').delete().in('id', ids);
        if (deleted.error) throw deleted.error;
        return response(true, `${ids.length} question(s) deleted forever.`, { changed: ids.length });
      }
      const restoring = action.includes('Restore');
      const updated = await supabase.from('exam_questions').update({ is_deleted: !restoring }).in('id', ids);
      if (updated.error) throw updated.error;
      return response(true, `${ids.length} question(s) ${restoring ? 'restored' : 'deleted'}.`, { changed: ids.length });
    }

    case 'importQuestions': {
      await ensureElevatedAdmin(requester, supabase, 'importQuestions');
      const exam = await findExamByCode(supabase, payload.examCode);
      if (!exam) return response(false, 'Exam not found.');
      const existing = await supabase.from('exam_questions').select('display_order').eq('exam_id', exam.id).order('display_order', { ascending: false }).limit(1).maybeSingle();
      if (existing.error && existing.error.code !== 'PGRST116') throw existing.error;
      let displayOrder = existing.data?.display_order || 0;
      let added = 0, skipped = 0;
      for (const raw of (Array.isArray(payload.rows) ? payload.rows : [])) {
        const question = trim(raw.question || raw.Question);
        if (!question) { skipped += 1; continue; }
        displayOrder += 1;
        const inserted = await supabase.from('exam_questions').insert({
          exam_id: exam.id,
          question_text: question,
          image_url: trim(raw.imageUrl || raw.ImageUrl),
          option_a: trim(raw.optionA || raw.OptionA),
          option_b: trim(raw.optionB || raw.OptionB),
          option_c: trim(raw.optionC || raw.OptionC),
          option_d: trim(raw.optionD || raw.OptionD),
          correct_option: normalize(raw.answer || raw.Answer).toUpperCase(),
          display_order: displayOrder,
          is_deleted: false
        });
        if (inserted.error) { skipped += 1; displayOrder -= 1; continue; }
        added += 1;
      }
      return response(true, 'Questions imported successfully.', { added, skipped });
    }

    case 'createPermissionCode':
      return await savePermissionCode(payload, requester, supabase);

    case 'listPermissionCodes': {
      ensureAdmin(requester);
      const rows = await supabase.from('permission_codes').select('*, exams(exam_code), candidates(reg_id), profiles(username)').order('created_at', { ascending: false });
      if (rows.error) throw rows.error;
      const data = (rows.data || []).map(item => ({
        permissionCode: item.code,
        examCode: item.exams?.exam_code || '',
        regId: item.candidates?.reg_id || '',
        username: item.profiles?.username || '',
        reason: item.reason || '',
        status: item.status || '',
        usedAt: item.used_at || '',
        createdAt: item.created_at || ''
      }));
      return response(true, 'Permission codes loaded.', data);
    }

    case 'deletePermissionCode': {
      await ensureElevatedAdmin(requester, supabase, 'deletePermissionCode');
      const deleted = await supabase.from('permission_codes').delete().eq('code', trim(payload.permissionCode || payload.code));
      if (deleted.error) throw deleted.error;
      return response(true, 'Permission code deleted successfully.');
    }

    case 'clearPermissionCodes': {
      await ensureElevatedAdmin(requester, supabase, 'clearPermissionCodes');
      const deleted = await supabase.from('permission_codes').delete().eq('status', 'used');
      if (deleted.error) throw deleted.error;
      return response(true, 'Used permission codes cleared successfully.');
    }

    case 'unlockExam': {
      ensureAuthenticated(requester);
      if (requester.profile.role !== 'student') return response(false, 'Only students can unlock exams.');
      const regId = trim(payload.regId);
      const examCode = trim(payload.examCode);
      const permissionCode = trim(payload.permissionCode);
      if (!regId || !examCode) return response(false, 'Registration ID and exam code are required.');
      const settings = await getSettingsRow(supabase);
      if (settings.portal_locked) return response(false, settings.portal_notice || 'CBT portal is currently locked.');
      const exam = await findExamByCode(supabase, examCode);
      if (!exam || exam.is_deleted) return response(false, 'Exam not found.');
      if (exam.exam_locked) return response(false, exam.lock_notice || 'This exam is currently locked.');
      if ((!exam.is_active && !exam.is_current) || exam.is_archived) return response(false, 'This exam is not currently active.');
      const candidate = await findCandidateByRegId(supabase, regId);
      if (!candidate) return response(false, 'Candidate not found.');
      if (requester.profile.reg_id && normalize(requester.profile.reg_id) !== normalize(regId)) return response(false, 'This account is not linked to the supplied Registration ID.');
      const prior = await supabase.from('exam_results').select('id').eq('exam_id', exam.id).eq('student_user_id', requester.profile.id).is('deleted_at', null);
      if (prior.error) throw prior.error;
      if ((prior.data || []).length) {
        const perm = await verifyPermissionCode({ supabase, examId: exam.id, regId, username: requester.profile.username, code: permissionCode });
        if (!perm) return response(false, 'You have already taken this exam. Ask the admin for a permission code to retake it.');
      }
      const questions = await supabase.from('exam_questions').select('*').eq('exam_id', exam.id).eq('is_deleted', false).order('display_order');
      if (questions.error) throw questions.error;
      let list = (questions.data || []).map(row => questionPublicShape(row, false));
      if (exam.shuffle_questions) list = list.sort(() => Math.random() - 0.5);
      return response(true, 'Exam unlocked successfully.', {
        examTitle: exam.title,
        durationMinutes: exam.duration_minutes,
        questions: list,
        showScoreSummary: !!exam.show_score_summary,
        allowReview: !!exam.allow_review,
        shuffleQuestions: !!exam.shuffle_questions,
        passMark: exam.pass_mark,
        resultMessage: exam.result_message || '',
        captureSnapshots: exam.capture_snapshots !== false,
        recordAudio: !!exam.record_audio,
        recordVideo: !!exam.record_video,
        recordScreen: !!exam.record_screen
      });
    }

    case 'autosaveProgress': {
      ensureAuthenticated(requester);
      if (requester.profile.role !== 'student') return response(false, 'Only students can save progress.');
      const exam = await findExamByCode(supabase, payload.examCode);
      if (!exam) return response(false, 'Exam not found.');
      const candidate = requester.profile.reg_id ? await findCandidateByRegId(supabase, requester.profile.reg_id) : null;
      const upserted = await supabase.from('exam_progress').upsert({
        exam_id: exam.id,
        student_user_id: requester.profile.id,
        candidate_id: candidate ? candidate.id : null,
        remaining_seconds: Math.max(0, toNum(payload.remainingSeconds, 0)),
        answers_json: Array.isArray(payload.answers) ? payload.answers : [],
        updated_at: nowIso()
      }, { onConflict: 'exam_id,student_user_id' }).select('*').single();
      if (upserted.error) throw upserted.error;
      return response(true, 'Progress saved.', { saved: true });
    }

    case 'resumeProgress': {
      ensureAuthenticated(requester);
      const exam = await findExamByCode(supabase, payload.examCode);
      if (!exam) return response(false, 'Exam not found.');
      const row = await supabase.from('exam_progress').select('*').eq('exam_id', exam.id).eq('student_user_id', requester.profile.id).maybeSingle();
      if (row.error) throw row.error;
      if (!row.data) return response(true, 'No saved progress found.', { found: false, remainingSeconds: 0, answers: [] });
      return response(true, 'Progress loaded.', { found: true, remainingSeconds: row.data.remaining_seconds || 0, answers: row.data.answers_json || [] });
    }

    case 'submitExam': {
      ensureAuthenticated(requester);
      if (requester.profile.role !== 'student') return response(false, 'Only students can submit exams.');
      const exam = await findExamByCode(supabase, payload.examCode);
      if (!exam || exam.is_deleted) return response(false, 'Exam not found.');
      const regId = trim(payload.regId || requester.profile.reg_id);
      const candidate = await findCandidateByRegId(supabase, regId);
      const prior = await supabase.from('exam_results').select('id').eq('exam_id', exam.id).eq('student_user_id', requester.profile.id).is('deleted_at', null);
      if (prior.error) throw prior.error;
      let permissionRow = null;
      if ((prior.data || []).length) {
        permissionRow = await verifyPermissionCode({ supabase, examId: exam.id, regId, username: requester.profile.username, code: payload.permissionCode });
        if (!permissionRow) return response(false, 'You have already taken this exam.');
      }
      const questions = await supabase.from('exam_questions').select('*').eq('exam_id', exam.id).eq('is_deleted', false).order('display_order');
      if (questions.error) throw questions.error;
      if (!(questions.data || []).length) return response(false, 'No active questions found for this exam.');
      const answerMap = {};
      (Array.isArray(payload.answers) ? payload.answers : []).forEach(item => { answerMap[String(item.questionId)] = normalize(item.selected).toUpperCase(); });
      let score = 0;
      const passedNos = [];
      const failedNos = [];
      const review = [];
      for (let i = 0; i < questions.data.length; i += 1) {
        const q = questions.data[i];
        const selected = answerMap[String(q.id)] || '';
        const correct = normalize(q.correct_option).toUpperCase();
        const passed = !!selected && selected === correct;
        if (passed) { score += 1; passedNos.push(String(i + 1)); } else { failedNos.push(String(i + 1)); }
        review.push({
          qNo: i + 1,
          status: passed ? 'PASS' : 'FAIL',
          question: q.question_text,
          imageUrl: q.image_url || '',
          optionA: q.option_a,
          optionB: q.option_b,
          optionC: q.option_c,
          optionD: q.option_d,
          chosen: selected || 'BLANK',
          correct
        });
      }
      const total = questions.data.length;
      const percentage = total ? Math.round((score / total) * 100) : 0;
      const passMark = Math.max(0, Math.min(100, exam.pass_mark || 50));
      const passStatus = percentage >= passMark ? 'PASSED' : 'FAILED';
      const attemptNo = (prior.data || []).length + 1;
      const statusMessage = trim(exam.result_message) || (passStatus === 'PASSED' ? 'Congratulations! You passed.' : 'Keep practicing and try again.');
      const inserted = await supabase.from('exam_results').insert({
        exam_id: exam.id,
        student_user_id: requester.profile.id,
        candidate_id: candidate ? candidate.id : null,
        attempt_no: attemptNo,
        score,
        total,
        percentage,
        pass_mark: passMark,
        show_score_summary: !!exam.show_score_summary,
        allow_review: !!exam.allow_review,
        pass_status: passStatus,
        ranking: '',
        passed_nos: passedNos,
        failed_nos: failedNos,
        answers_json: Array.isArray(payload.answers) ? payload.answers : [],
        review_json: review,
        status_message: statusMessage,
        is_published: true,
        published_at: nowIso(),
        published_by: requester.profile.id
      }).select('*').single();
      if (inserted.error) throw inserted.error;
      if (permissionRow) {
        await supabase.from('permission_codes').update({ status: 'used', used_at: nowIso() }).eq('id', permissionRow.id);
      }
      await supabase.from('exam_progress').delete().eq('exam_id', exam.id).eq('student_user_id', requester.profile.id);
      const payloadResult = await buildStudentResultPayload(supabase, inserted.data);
      return response(true, 'Exam submitted successfully.', payloadResult);
    }

    case 'uploadSnapshot':
      return await storeProctoringFile({ supabase, payload, requester, kind: 'snapshot' });
    case 'uploadAudioClip':
      return await storeProctoringFile({ supabase, payload, requester, kind: 'audio' });
    case 'uploadVideoClip':
      return await storeProctoringFile({ supabase, payload, requester, kind: 'video' });
    case 'uploadScreenClip':
      return await storeProctoringFile({ supabase, payload, requester, kind: 'screen' });

    case 'listResultsByExam': {
      ensureAdmin(requester);
      const exam = await findExamByCode(supabase, payload.examCode);
      if (!exam) return response(false, 'Exam not found.');
      let query = supabase.from('exam_results').select('*, exams(exam_code,title), profiles(username, full_name, reg_id), candidates(full_name, reg_id)').eq('exam_id', exam.id).order('submitted_at', { ascending: false });
      if (!toBool(payload.includeDeleted)) query = query.is('deleted_at', null);
      const rows = await query;
      if (rows.error) throw rows.error;
      return response(true, 'Results loaded successfully.', (rows.data || []).map(item => resultPublicShape(item, exam.title)));
    }

    case 'setResultPublished':
    case 'bulkSetResultPublished': {
      await ensureElevatedAdmin(requester, supabase, action === 'setResultPublished' ? 'setResultPublished' : 'bulkSetResultPublished');
      const ids = action === 'setResultPublished' ? [payload.resultId] : (Array.isArray(payload.resultIds) ? payload.resultIds : []);
      const published = payload.published === undefined ? true : toBool(payload.published);
      const updated = await supabase.from('exam_results').update({ is_published: published, published_at: published ? nowIso() : null, published_by: published ? requester.profile.id : null }).in('id', ids);
      if (updated.error) throw updated.error;
      return response(true, published ? 'Result visibility updated.' : 'Result hidden successfully.', { changed: ids.length });
    }

    case 'deleteResult':
    case 'restoreResult':
    case 'hardDeleteResult':
    case 'bulkDeleteResults':
    case 'bulkRestoreResults':
    case 'bulkHardDeleteResults': {
      await ensureElevatedAdmin(requester, supabase, action);
      const ids = action === 'deleteResult' || action === 'restoreResult' || action === 'hardDeleteResult'
        ? [payload.resultId]
        : (Array.isArray(payload.resultIds) ? payload.resultIds : []);
      if (!ids.length) return response(false, 'No result IDs supplied.');
      if (action.includes('Hard')) {
        const deleted = await supabase.from('exam_results').delete().in('id', ids);
        if (deleted.error) throw deleted.error;
        return response(true, `${ids.length} result(s) deleted forever.`, { changed: ids.length });
      }
      const restoring = action.includes('Restore');
      const updated = await supabase.from('exam_results').update({ deleted_at: restoring ? null : nowIso(), deleted_by: restoring ? null : requester.profile.id }).in('id', ids);
      if (updated.error) throw updated.error;
      return response(true, `${ids.length} result(s) ${restoring ? 'restored' : 'deleted'}.`, { changed: ids.length });
    }

    case 'exportResultsByExam': {
      ensureAdmin(requester);
      const exam = await findExamByCode(supabase, payload.examCode);
      if (!exam) return response(false, 'Exam not found.');
      const rows = await supabase.from('exam_results').select('*, profiles(username, full_name, reg_id)').eq('exam_id', exam.id).is('deleted_at', null).order('submitted_at', { ascending: false });
      if (rows.error) throw rows.error;
      const csvRows = [['timestamp','examCode','attemptNo','fullName','regId','username','score','total','percentage','passMark','passStatus','ranking','passedNos','failedNos','statusMessage']];
      for (const row of rows.data || []) {
        csvRows.push([
          row.submitted_at,
          exam.exam_code,
          row.attempt_no,
          row.profiles?.full_name || '',
          row.profiles?.reg_id || '',
          row.profiles?.username || '',
          row.score,
          row.total,
          row.percentage,
          row.pass_mark,
          row.pass_status,
          row.ranking || '',
          Array.isArray(row.passed_nos) ? row.passed_nos.join(', ') : '',
          Array.isArray(row.failed_nos) ? row.failed_nos.join(', ') : '',
          row.status_message || ''
        ]);
      }
      const csv = csvRows.map(r => r.map(csvEscape).join(',')).join('\n');
      return response(true, 'Results export prepared successfully.', { csv, filename: `results_${safeName(exam.exam_code)}.csv` });
    }

    case 'listSnapshotsByExam':
      return await listProctoringByKind({ supabase, requester, payload, kind: 'snapshot' });
    case 'listAudioByExam':
      return await listProctoringByKind({ supabase, requester, payload, kind: 'audio' });
    case 'listVideosByExam': {
      const videos = await listProctoringByKind({ supabase, requester, payload, kind: 'video' });
      const screens = await listProctoringByKind({ supabase, requester, payload, kind: 'screen' });
      return response(true, (videos.data || []).length || (screens.data || []).length ? 'Video evidence loaded.' : 'No video clips found for this filter yet.', [...(videos.data || []), ...(screens.data || [])]);
    }
    case 'getProctoringFolderView':
      return await getProctoringFolderView({ supabase, requester, payload });
    case 'deleteSnapshot':
    case 'restoreSnapshot':
    case 'hardDeleteSnapshot':
    case 'bulkDeleteSnapshots':
    case 'bulkRestoreSnapshots':
    case 'bulkHardDeleteSnapshots': {
      const mode = action.includes('Restore') ? 'restore' : (action.includes('Hard') ? 'hard' : 'delete');
      const fileIds = action.startsWith('bulk') ? payload.fileIds : [payload.fileId];
      return await applySoftDeleteByIds({ supabase, requester, payload: { fileIds }, mode });
    }
    case 'deleteVideo':
    case 'restoreVideo':
    case 'hardDeleteVideo':
    case 'bulkDeleteVideos':
    case 'bulkRestoreVideos':
    case 'bulkHardDeleteVideos': {
      const mode = action.includes('Restore') ? 'restore' : (action.includes('Hard') ? 'hard' : 'delete');
      const fileIds = action.startsWith('bulk') ? payload.fileIds : [payload.fileId];
      return await applySoftDeleteByIds({ supabase, requester, payload: { fileIds }, mode });
    }

    case 'listPublishedResultsForStudent': {
      const regId = trim(payload.regId);
      const password = trim(payload.password);
      if (!regId || !password) return response(false, 'Registration ID and password are required.');
      const student = await signInForResultAccess(regId, password);
      if (!student) return response(false, 'Invalid Registration ID or password.');
      const rows = await supabase.from('exam_results').select('*, exams(exam_code,title)').eq('student_user_id', student.id).eq('is_published', true).is('deleted_at', null).order('submitted_at', { ascending: false });
      if (rows.error) throw rows.error;
      const results = (rows.data || []).map(item => ({
        id: item.id,
        examCode: item.exams?.exam_code || '',
        examTitle: item.exams?.title || item.exams?.exam_code || 'Untitled Exam',
        attemptNo: item.attempt_no,
        percentage: Number(item.percentage || 0),
        score: item.score,
        total: item.total,
        passMark: item.pass_mark,
        showScoreSummary: !!item.show_score_summary,
        status: item.pass_status || '',
        timestamp: item.submitted_at,
        statusMessage: item.status_message || ''
      }));
      return response(true, results.length ? 'Published result list loaded.' : 'No published result found for this student yet.', { regId, fullName: student.full_name || '', results });
    }

    case 'checkResultPublic':
    case 'checkResultPublicById': {
      const regId = trim(payload.regId);
      const password = trim(payload.password);
      if (!regId || !password) return response(false, 'Registration ID and password are required.');
      const student = await signInForResultAccess(regId, password);
      if (!student) return response(false, 'Invalid Registration ID or password.');
      let query = supabase.from('exam_results').select('*').eq('student_user_id', student.id).eq('is_published', true).is('deleted_at', null);
      if (action === 'checkResultPublicById') {
        query = query.eq('id', trim(payload.resultId));
      } else if (trim(payload.examCode)) {
        const exam = await findExamByCode(supabase, payload.examCode);
        if (!exam) return response(false, 'No published result found for this exam.');
        query = query.eq('exam_id', exam.id);
      }
      const rows = await query.order('submitted_at', { ascending: false }).limit(1);
      if (rows.error) throw rows.error;
      if (!(rows.data || []).length) return response(false, action === 'checkResultPublicById' ? 'The selected published result could not be found.' : (trim(payload.examCode) ? 'No published result found for this exam.' : 'No published result found for this student yet.'));
      const data = await buildStudentResultPayload(supabase, rows.data[0]);
      return response(true, 'Result loaded successfully.', data);
    }

    default:
      return response(false, `Unsupported action: ${action}`);
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const method = (req.method || 'GET').toUpperCase();
    const body = parseRequestBody(req);
    const source = method === 'GET' ? (req.query || {}) : body;
    const action = trim(source.action);
    const payload = source.payload && typeof source.payload === 'object' ? source.payload : (source.payload ? JSON.parse(source.payload) : source);
    if (!action) return res.status(400).json(response(false, 'Action is required.'));
    const result = await handleAction(action, payload || {}, req);
    res.status(result.ok ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json(response(false, error.message || 'An unexpected server error occurred.'));
  }
};
