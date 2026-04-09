(function(){
  const configPromise = fetch('/api/public-config', { cache: 'no-store' }).then(async (res) => {
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Public config could not be loaded.');
    return json;
  });

  let supabasePromise = null;

  function trim(value){ return String(value == null ? '' : value).trim(); }
  function normalize(value){ return trim(value).toLowerCase(); }
  function deriveEmail(username){
    const local = normalize(username).replace(/[^a-z0-9._-]+/g,'.').replace(/\.+/g,'.').replace(/^\.|\.$/g,'');
    if(!local) throw new Error('Username contains unsupported characters.');
    return `${local}@users.genzcbt.local`;
  }

  async function getSupabase(){
    if (!supabasePromise) {
      supabasePromise = (async () => {
        const cfg = await configPromise;
        if (!window.supabase || !window.supabase.createClient) throw new Error('Supabase browser library failed to load.');
        return window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        });
      })();
    }
    return supabasePromise;
  }

  async function getSession(){
    const sb = await getSupabase();
    const { data, error } = await sb.auth.getSession();
    if (error) throw error;
    return data.session || null;
  }

  async function getProfile(userId){
    const session = await getSession();
    if (!session) return null;
    const sb = await getSupabase();
    const profile = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (profile.error) throw profile.error;
    return profile.data || null;
  }

  async function sessionResponse(session){
    if (!session || !session.user) return { ok:false, message:'Your session has expired. Please log in again.' };
    const profile = await getProfile(session.user.id);
    if (!profile) return { ok:false, message:'Your profile could not be loaded.' };
    return {
      ok: true,
      message: 'Session is valid.',
      data: {
        token: session.access_token,
        username: profile.username || '',
        role: profile.role || '',
        fullName: profile.full_name || '',
        regId: profile.reg_id || ''
      }
    };
  }

  async function serverRequest(action, payload = {}, method = 'POST'){
    const cfg = await configPromise;
    const session = await getSession();
    const headers = { 'Content-Type': 'application/json' };
    if (session && session.access_token) headers.Authorization = `Bearer ${session.access_token}`;
    let url = cfg.apiBase;
    const options = { method, headers, cache: 'no-store' };
    if (method === 'GET') {
      const params = new URLSearchParams({ action, _ts: String(Date.now()) });
      Object.entries(payload || {}).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        params.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      });
      url += `?${params.toString()}`;
    } else {
      options.body = JSON.stringify({ action, ...payload, payload });
    }
    const res = await fetch(url, options);
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { ok:false, message:'Server returned non-JSON response.', raw:text }; }
    return json;
  }

  async function request(action, payload = {}, method = 'POST'){
    try{
      const sb = await getSupabase();
      switch(action){
        case 'login': {
          const username = trim(payload.username);
          const password = String(payload.password || '');
          if (!username || !password) return { ok:false, message:'Username and password are required.' };
          const signIn = await sb.auth.signInWithPassword({ email: deriveEmail(username), password });
          if (signIn.error || !signIn.data.session) return { ok:false, message: signIn.error?.message || 'Invalid username or password.' };
          const out = await sessionResponse(signIn.data.session);
          const role = out.data && out.data.role;
          if (payload.role === 'admin' && !['principal_admin','subadmin','admin'].includes(role)) {
            await sb.auth.signOut();
            return { ok:false, message:'This is not an admin account.' };
          }
          if (payload.role === 'student' && role !== 'student') {
            await sb.auth.signOut();
            return { ok:false, message:'This is not a student account.' };
          }
          out.message = 'Login successful.';
          return out;
        }
        case 'validateSession': {
          const session = await getSession();
          const out = await sessionResponse(session);
          if (!out.ok) return out;
          return { ok:true, message:'Session is valid.', data: out.data };
        }
        case 'logout': {
          await sb.auth.signOut();
          return { ok:true, message:'Signed out.' };
        }
        case 'changePassword': {
          const currentPassword = String(payload.currentPassword || '');
          const newPassword = String(payload.newPassword || '');
          if (!currentPassword || !newPassword) return { ok:false, message:'Current and new passwords are required.' };
          const session = await getSession();
          if (!session || !session.user) return { ok:false, message:'Your session has expired. Please log in again.' };
          const profile = await getProfile(session.user.id);
          if (!profile) return { ok:false, message:'Your profile could not be loaded.' };
          const verify = await sb.auth.signInWithPassword({ email: deriveEmail(profile.username), password: currentPassword });
          if (verify.error) return { ok:false, message:'Current password is incorrect.' };
          const updated = await sb.auth.updateUser({ password: newPassword });
          if (updated.error) return { ok:false, message: updated.error.message || 'Unable to change password.' };
          const refreshed = await getSession();
          const out = await sessionResponse(refreshed);
          out.message = 'Password changed successfully.';
          return out;
        }
        case 'resetForgottenPassword':
          return { ok:false, message:'Self-service password reset was removed for security. Please contact an administrator to reset the account safely.' };
        default:
          return await serverRequest(action, payload, method);
      }
    }catch(error){
      return { ok:false, message:error.message || 'Failed to fetch.' };
    }
  }

  window.AppApi = { request, getSession, configPromise };
})();
