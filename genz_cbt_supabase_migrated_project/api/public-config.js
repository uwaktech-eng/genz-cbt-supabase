const { getPublicConfig } = require('./_lib/config');

module.exports = async function handler(req, res) {
  try {
    const config = getPublicConfig();
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(config);
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Public config is not ready.',
      hint: 'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.'
    });
  }
};
