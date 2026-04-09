const { createClient } = require('@supabase/supabase-js');
const { getConfig } = require('./config');

function createServiceClient() {
  const cfg = getConfig();
  return createClient(cfg.supabaseUrl, cfg.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function createAnonClient() {
  const cfg = getConfig();
  return createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

module.exports = { createServiceClient, createAnonClient };
