const APPS_SCRIPT_URL = "/api/router";
const FALLBACK_FAVICON = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22%3E%3Crect width=%2264%22 height=%2264%22 rx=%2214%22 fill=%22%23081224%22/%3E%3Ctext x=%2250%25%22 y=%2254%25%22 font-size=%2232%22 text-anchor=%22middle%22 fill=%22%23facc15%22 font-family=%22Arial%22 dy=%22.1em%22%3EG%3C/text%3E%3C/svg%3E';

function escHtml(v){ return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function nl2br(v){ return escHtml(v).replace(/\n/g,'<br>'); }
function safeList(arr,fallback){ return Array.isArray(arr) && arr.length ? arr : (fallback || []); }
function setSiteFavicon(url){ const el = document.getElementById('siteFavicon'); if(el) el.href = url || FALLBACK_FAVICON; }
function youtubeEmbed(url){ if(!url) return ''; const m = String(url).match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/); return m ? `https://www.youtube.com/embed/${m[1]}` : ''; }
async function getPublicSiteContent(){
  const u = new URL(APPS_SCRIPT_URL);
  u.searchParams.set('action','getPublicSiteContent');
  u.searchParams.set('_ts', Date.now());
  const res = await fetch(u.toString());
  const data = await res.json();
  return data.ok ? data.data : {};
}
function renderBrand(root, data){
  if(!root) return;
  const logo = data.resultBrandLogoUrl || '';
  root.innerHTML = logo ? `<img src="${escHtml(logo)}" alt="Brand logo">` : '<div class="mark">G</div>';
}
function renderFooter(data){
  const footer = document.getElementById('siteFooter');
  if(!footer) return;
  const socials = safeList(data.socialLinks, []).map(item => `<a href="${escHtml(item.url||'#')}" target="_blank" rel="noopener">${escHtml(item.label||'Social')}</a>`).join('');
  footer.innerHTML = `
    <div class="footer-links">
      <a href="index.html">Home</a>
      <a href="about.html">About</a>
      <a href="terms.html">Terms</a>
      <a href="privacy.html">Privacy</a>
      <a href="cookies.html">Cookies</a>
      <a href="contact.html">Contact</a>
      <a href="student.html">Student Portal</a>
      <a href="admin.html">Admin Portal</a>
      <a href="result_checker.html">Result Checker</a>
    </div>
    <div style="margin-top:18px" class="social">${socials || '<a href="#">Add social links from admin settings</a>'}</div>
    <div style="margin-top:16px">${escHtml(data.resultBrandName || 'Genz EduTech Innovations')} · Built for modern exam delivery and result presentation.</div>
  `;
}
function cardMedia(item, fallbackLabel){
  if(item.videoUrl){
    const yt = youtubeEmbed(item.videoUrl);
    if(yt) return `<div class="media-thumb"><iframe src="${escHtml(yt)}" allowfullscreen loading="lazy"></iframe></div>`;
  }
  if(item.imageUrl || item.logoUrl || item.thumbUrl || item.avatarUrl){
    const src = item.imageUrl || item.logoUrl || item.thumbUrl || item.avatarUrl;
    return `<div class="media-thumb"><img src="${escHtml(src)}" alt="${escHtml(item.name || item.title || fallbackLabel || 'Media')}"></div>`;
  }
  return `<div class="media-thumb" style="display:grid;place-items:center;color:#c7d2fe">${escHtml(fallbackLabel || 'Media')}</div>`;
}
