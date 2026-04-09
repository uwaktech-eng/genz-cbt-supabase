function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getOptionalEnv(name, fallback = '') {
  return process.env[name] || fallback;
}

function getConfig() {
  return {
    supabaseUrl: getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    supabaseAnonKey: getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    supabaseServiceRoleKey: getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    initialAdminSignupKey: getRequiredEnv('INITIAL_ADMIN_SIGNUP_KEY'),
    proctoringBucket: getOptionalEnv('SUPABASE_PROCTORING_BUCKET', 'proctoring-private'),
    resultAssetBucket: getOptionalEnv('SUPABASE_RESULT_ASSET_BUCKET', 'public-assets'),
    appName: getOptionalEnv('APP_NAME', 'Genz CBT Pro'),
    userEmailDomain: getOptionalEnv('APP_USER_EMAIL_DOMAIN', 'users.genzcbt.local')
  };
}

function getPublicConfig() {
  const cfg = getConfig();
  return {
    supabaseUrl: cfg.supabaseUrl,
    supabaseAnonKey: cfg.supabaseAnonKey,
    apiBase: '/api/router',
    appName: cfg.appName
  };
}

module.exports = {
  getConfig,
  getPublicConfig,
  getRequiredEnv,
  getOptionalEnv
};
