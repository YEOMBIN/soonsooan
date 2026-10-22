// 순수안피부과 기존 상세페이지 → 로컬 정적 복제 (가시안 전용 도구)
// 사용: 프로젝트 폴더에서  node tools/clone-pages.js .
//   운영 홈페이지에서 HTML·CSS·이미지를 받아 pages/, assets/original/ 에 저장하고 링크를 로컬로 바꿉니다.
//   다시 복제한 뒤에는 pages/about/location.html 의 구글 지도 스크립트를 '누르면 불러오기'로 바꿔야 합니다 (README 참고).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SITE = process.argv[2];
const BASE = 'https://soonsooan.co.kr';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const ASSET_ROOT = 'assets/original';

const PAGES = [
  ['순수안 소개', '인사말', 's_1_1', 'pages/about/greeting.html'],
  ['순수안 소개', '의료진소개', 's_1_2', 'pages/about/doctors.html'],
  ['순수안 소개', '시설안내', 's_1_3', 'pages/about/facility.html'],
  ['순수안 소개', '진료시간 / 오시는길', 's_1_4', 'pages/about/location.html'],
  ['순수안 소개', '보유장비소개', 's_1_6', 'pages/about/equipment.html'],
  ['순수안 프리미엄', '써마지FLX', 's_5_1', 'pages/premium/thermage.html'],
  ['순수안 프리미엄', '악센트프라임(튠페이스)', 's_5_2', 'pages/premium/accent-prime.html'],
  ['순수안 프리미엄', '이플러스', 's_5_3', 'pages/premium/eplus.html'],
  ['순수안 프리미엄', '브이로 어드밴스', 's_5_4', 'pages/premium/vro-advance.html'],
  ['순수안 프리미엄', '브이빔 퍼펙타', 's_5_5', 'pages/premium/vbeam-perfecta.html'],
  ['순수안 프리미엄', '피코웨이', 's_5_6', 'pages/premium/picoway.html'],
  ['순수안 프리미엄', '헐리우드 스펙트라', 's_5_7', 'pages/premium/hollywood-spectra.html'],
  ['순수안 프리미엄', '쥬베룩', 's_5_8', 'pages/premium/juvelook.html'],
  ['순수안 프리미엄', '순수안 물광주사', 's_5_9', 'pages/premium/water-glow.html'],
  ['순수안 프리미엄', '벨라소닉', 's_5_10', 'pages/premium/bellasonic.html'],
  ['순수안 프리미엄', '아스트로돔페이셜', 's_5_11', 'pages/premium/astrodome-facial.html'],
  ['시술 및 진료 분야', '탄력 / 리프팅 / 모공', 's_2_1', 'pages/treatment/lifting.html'],
  ['시술 및 진료 분야', '주름 / 보톡스 / 필러', 's_2_2', 'pages/treatment/wrinkle.html'],
  ['시술 및 진료 분야', '기미 / 색소질환', 's_2_3', 'pages/treatment/pigment.html'],
  ['시술 및 진료 분야', '여드름치료', 's_2_4', 'pages/treatment/acne.html'],
  ['시술 및 진료 분야', '안면홍조 / 주사', 's_2_5', 'pages/treatment/redness.html'],
  ['시술 및 진료 분야', '흉터 / 여드름흉터', 's_2_6', 'pages/treatment/scar.html'],
  ['시술 및 진료 분야', '탈모', 's_2_7', 'pages/treatment/hair-loss.html'],
  ['시술 및 진료 분야', '드레싱 / 냉동치료 / 피부질환', 's_2_8', 'pages/treatment/skin-disease.html'],
  ['온라인상담', '온라인상담', 's_3_1', 'pages/consult/online.html'],
  ['순수안 소식', '공지사항', 's_4_1', 'pages/news/notice.html'],
  ['순수안 소식', '치료후기', 's_4_2', 'pages/news/review.html'],
  ['기타', '개인정보처리방침', 'etc_1_1', 'pages/etc/privacy.html'],
  ['기타', '이용약관', 'etc_1_2', 'pages/etc/terms.html'],
  ['기타', '로그인', 'login', 'pages/etc/login.html', '/index.php?mid=index&act=dispMemberLoginForm'],
  ...[5685, 5610, 5624, 5580, 5457].map(n => ['순수안 소식', '공지 ' + n, 's_4_1/' + n, 'pages/news/notice-' + n + '.html']),
];
const PAGE_BY_ID = Object.fromEntries(PAGES.map(p => [p[2], p[3]]));

const TRACKER = /googletagmanager|gtag\(|google-analytics|googleadservices|doubleclick|wcs_do|wcslog|wcs\.naver|NaverAnalytics|fbq\(|connect\.facebook|facebook\.net|kakaoPixel|kakao_pixel|t1\.daumcdn\.net\/kas|adsbygoogle|criteo|channel\.io|ChannelIO|hotjar|beusable|acecounter|_AceGID|mixpanel|clarity\.ms|naver_trace|nlogger|tracker|tagmanager|adinsight|logger\.js/i;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = [];
const done = new Map(); // abs url -> local path (or null)
const missing = [];

async function get(url, asText) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, 'Referer': BASE + '/' }, redirect: 'follow' });
      if (!r.ok) return { status: r.status };
      const buf = Buffer.from(await r.arrayBuffer());
      return { status: 200, buf, type: r.headers.get('content-type') || '', finalUrl: r.url, text: asText ? buf.toString('utf8') : null };
    } catch (e) { await sleep(500 * (i + 1)); }
  }
  return { status: 0 };
}

function localFor(abs, type) {
  const u = new URL(abs);
  let p = decodeURIComponent(u.pathname).replace(/\/+$/, '/index');
  let ext = path.posix.extname(p);
  if (!ext || u.search && /css2?$|\/css$/.test(u.pathname)) {
    const guess = /css/.test(type || '') || /fonts\.googleapis/.test(u.host) ? '.css' : /javascript/.test(type || '') ? '.js' : /png/.test(type || '') ? '.png' : /jpe?g/.test(type || '') ? '.jpg' : /gif/.test(type || '') ? '.gif' : /svg/.test(type || '') ? '.svg' : /woff2/.test(type || '') ? '.woff2' : '';
    p += '_' + crypto.createHash('md5').update(u.search).digest('hex').slice(0, 8) + guess;
  }
  p = p.replace(/[<>:"|?*]/g, '_');
  const host = u.host.replace(/^www\./, '');
  return host === 'soonsooan.co.kr' ? ASSET_ROOT + p : ASSET_ROOT + '/_ext/' + host + p;
}
const rel = (fromFile, toFile) => { let r = path.posix.relative(path.posix.dirname(fromFile), toFile); return encodeURI(r).replace(/#/g, '%23'); };
function abs(ref, baseUrl) {
  ref = ref.trim().replace(/&amp;/g, '&');
  if (!ref || /^(data:|blob:|javascript:|mailto:|tel:|#|about:)/i.test(ref)) return null;
  if (ref.startsWith('//')) ref = 'https:' + ref;
  try { return new URL(ref, baseUrl).href; } catch (e) { return null; }
}

async function download(absUrl) {
  if (done.has(absUrl)) return done.get(absUrl);
  done.set(absUrl, null);
  const r = await get(absUrl, false);
  await sleep(60);
  if (r.status !== 200) { missing.push(absUrl + ' (' + r.status + ')'); return null; }
  const local = localFor(absUrl, r.type);
  done.set(absUrl, local);
  const out = path.join(SITE, local);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  if (/\.css$/i.test(local)) {
    fs.writeFileSync(out, await processCss(r.buf.toString('utf8'), absUrl, local));
  } else if (/\.js$/i.test(local)) {
    fs.writeFileSync(out, r.buf.toString('utf8').replace(/https?:\/\/(www\.)?soonsooan\.co\.kr/g, ''));
  } else fs.writeFileSync(out, r.buf);
  return local;
}

const CSS_URL = /url\(\s*(?:'([^']*)'|"([^"]*)"|([^'"()\s]+))\s*\)/g;
async function processCss(css, cssUrl, cssLocal) {
  const refs = new Set();
  // url() 안에 괄호가 들어간 주소(예: common.css?ver={uniqid()})도 읽도록 따옴표별로 나눠 매칭
  css.replace(CSS_URL, (m, a, b, c) => { refs.add(a || b || c); return m; });
  css.replace(/@import\s+(['"])([^'"]+)\1/g, (m, q, u) => { refs.add(u); return m; });
  const map = {};
  for (const ref of refs) {
    const a = abs(ref, cssUrl);
    if (!a) continue;
    const l = await download(a);
    if (l) map[ref] = rel(cssLocal, l);
  }
  return css
    .replace(CSS_URL, (m, a, b, c) => { const u = a || b || c; return map[u] ? `url("${map[u]}")` : m; })
    .replace(/@import\s+(['"])([^'"]+)\1/g, (m, q, u) => map[u] ? `@import "${map[u]}"` : m);
}

// 기존 사이트 내부 링크 → 로컬 페이지
function mapLink(href, pageLocal) {
  const raw = href.replace(/&amp;/g, '&').trim();
  if (/^(#|javascript:|mailto:|tel:)/i.test(raw) || raw === '') return null;
  let u;
  try { u = new URL(raw.startsWith('//') ? 'https:' + raw : raw, BASE + '/'); } catch (e) { return null; }
  const host = u.host.replace(/^www\./, '');
  if (host !== 'soonsooan.co.kr') return { external: true };
  const mid = u.searchParams.get('mid');
  const doc = u.searchParams.get('document_srl');
  const act = u.searchParams.get('act') || '';
  let m = u.pathname.match(/^\/((?:s|etc)_\d+_\d+)(?:\/(\d+))?\/?$/);
  let id = m ? m[1] : (mid && /^(s|etc)_\d+_\d+$/.test(mid) ? mid : null);
  let post = m && m[2] ? m[2] : doc;
  if (/MemberLoginForm|MemberSignUpForm|Login|SignUp/i.test(act)) return { to: rel(pageLocal, PAGE_BY_ID.login) };
  if (id) {
    if (post && PAGE_BY_ID[id + '/' + post]) return { to: rel(pageLocal, PAGE_BY_ID[id + '/' + post]) };
    if (PAGE_BY_ID[id]) return { to: rel(pageLocal, PAGE_BY_ID[id]), partial: !!post };
    return { blocked: true };
  }
  if ((u.pathname === '/' || u.pathname === '/index.php') && (!mid || mid === 'index') && !act) return { to: rel(pageLocal, 'index.html') };
  return { blocked: true };
}

async function processPage([menu, name, id, out, srcPath]) {
  const url = BASE + (srcPath || '/' + id);
  const r = await get(url, true);
  if (r.status !== 200) { log.push({ menu, name, original: url, local: out, status: 'failed', note: 'HTTP ' + r.status }); return; }
  let h = r.text;
  const notes = [];

  // 1) 추적·광고 스크립트 제거
  let removed = 0;
  h = h.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, s => (TRACKER.test(s) ? (removed++, '') : s));
  h = h.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, s => (TRACKER.test(s) || /<iframe/i.test(s) ? (removed++, '') : s));
  h = h.replace(/<link\b[^>]*rel=["']?(preconnect|dns-prefetch|prefetch)["']?[^>]*>/gi, '');
  h = h.replace(/<img\b[^>]*(facebook\.com\/tr|wcs\.naver|google-analytics|doubleclick)[^>]*>/gi, () => (removed++, ''));
  if (removed) notes.push('추적·광고 코드 ' + removed + '개 제거');

  // 2) 외부 iframe(유튜브·지도 등)은 자동으로 불러오지 않음 → 클릭 시 새 창
  h = h.replace(/<iframe\b[^>]*src=["']([^"']+)["'][^>]*>\s*<\/iframe>/gi, (m, src) => {
    const a = abs(src, url) || src;
    notes.push('외부 임베드 정지: ' + a.slice(0, 80));
    return `<a class="pv-embed" href="${a}" target="_blank" rel="noopener">외부 콘텐츠(${new URL(a).host})는 가시안에서 자동으로 불러오지 않습니다. 눌러서 새 창으로 보기 ↗</a>`;
  });

  // 3) 리소스 수집·경로 변경
  const resRefs = new Set();
  h.replace(/<(?:img|script|source|video|audio|input|embed)\b[^>]*?\s(?:src|data-src|data-original|data-lazy|poster)=["']([^"']+)["']/gi, (m, u) => (resRefs.add(u), m));
  h.replace(/<link\b[^>]*?\shref=["']([^"']+)["'][^>]*>/gi, (m, u) => (/rel=["']?(stylesheet|icon|shortcut icon|apple-touch-icon)/i.test(m) && resRefs.add(u), m));
  h.replace(/\ssrcset=["']([^"']+)["']/gi, (m, v) => (v.split(',').forEach(s => resRefs.add(s.trim().split(/\s+/)[0])), m));
  h.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (m, q, u) => (resRefs.add(u.replace(/&quot;/g, '')), m));
  h.replace(/\sbackground=["']([^"']+)["']/gi, (m, u) => (resRefs.add(u), m));
  const resMap = {};
  for (const ref of resRefs) {
    const a = abs(ref, url);
    if (!a) continue;
    if (TRACKER.test(a)) continue;
    const l = await download(a);
    if (l) resMap[ref] = rel(out, l);
  }
  const swap = v => (resMap[v] != null ? resMap[v] : v);
  h = h.replace(/(\s(?:src|data-src|data-original|data-lazy|poster|background)=["'])([^"']+)(["'])/gi, (m, a, v, b) => a + swap(v) + b);
  h = h.replace(/(<link\b[^>]*?\shref=["'])([^"']+)(["'])/gi, (m, a, v, b) => a + swap(v) + b);
  h = h.replace(/(\ssrcset=["'])([^"']+)(["'])/gi, (m, a, v, b) => a + v.split(',').map(s => { const [u, ...d] = s.trim().split(/\s+/); return [swap(u), ...d].join(' '); }).join(', ') + b);
  h = h.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (m, q, u) => { const k = u.replace(/&quot;/g, ''); return resMap[k] ? `url('${resMap[k]}')` : m; });

  // 4) 페이지 링크 → 로컬
  let partial = 0, blocked = 0;
  h = h.replace(/(<a\b[^>]*?\shref=["'])([^"']*)(["'][^>]*>)/gi, (m, a, v, b) => {
    const r2 = mapLink(v, out);
    if (!r2) return m;
    if (r2.external) return /target=/i.test(m) ? m : a + v + b.replace(/>$/, ' target="_blank" rel="noopener">');
    if (r2.blocked) { blocked++; return a + '#' + b.replace(/>$/, ' data-pv-blocked="' + v.replace(/"/g, '') + '">'); }
    if (r2.partial) partial++;
    return a + r2.to + b;
  });
  h = h.replace(/(<form\b[^>]*?\saction=["'])([^"']*)(["'])/gi, (m, a, v, b) => a + '#' + b);
  if (partial) notes.push('게시글 링크 ' + partial + '개는 목록 페이지로 연결');
  if (blocked) notes.push('복제 범위 밖 내부 링크 ' + blocked + '개 차단');

  // 5) 인라인 스크립트의 운영 서버 주소 제거
  h = h.replace(/(<script\b(?![^>]*\ssrc=)[^>]*>)([\s\S]*?)(<\/script>)/gi, (m, a, s, b) => a + s.replace(/https?:\/\/(www\.)?soonsooan\.co\.kr/g, '') + b);

  // 6) 가시안 표시·보호 스크립트 삽입
  const guardJs = rel(out, ASSET_ROOT + '/_preview/guard.js');
  const guardCss = rel(out, ASSET_ROOT + '/_preview/guard.css');
  const home = rel(out, 'index.html');
  h = h.replace(/<head([^>]*)>/i, `<head$1>\n<meta name="robots" content="noindex, nofollow">\n<script src="${guardJs}"></script>\n<link rel="stylesheet" href="${guardCss}">`);
  h = h.replace(/<\/body>/i, `<a class="pv-badge" href="${home}" title="리디자인 메인으로 돌아가기"><b>가시안</b> 기존 페이지 복제본 · 새 메인으로 ↩</a>\n</body>`);
  h = h.replace(/<!--\s*Global site tag[\s\S]*?-->/gi, '');
  // 검색·공유용 메타(운영 주소) 제거, 제목에 [가시안] 표시
  h = h.replace(/<meta\s+property="og:[^>]*>\s*/gi, '').replace(/<meta\s+name="(naver|google)-site-verification"[^>]*>\s*/gi, '').replace(/<link[^>]*rel="(canonical|alternate)"[^>]*>\s*/gi, '');
  h = h.replace(/<title>/i, '<title>[가시안] ');

  const outPath = path.join(SITE, out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, h);
  const hasForm = /<form\b/i.test(h);
  if (hasForm) notes.push('입력 폼 포함 → 전송 차단');
  log.push({ menu, name, original: url, local: out, status: 'cloned', note: notes.join(' · ') });
  console.log('OK', id, '->', out, notes.join(' · '));
}

(async () => {
  for (const p of PAGES) { await processPage(p); await sleep(200); }
  fs.mkdirSync(path.join(SITE, 'data'), { recursive: true });
  fs.writeFileSync(path.join(SITE, 'tools/clone-log.json'), JSON.stringify({ clonedAt: new Date().toISOString().slice(0, 10), pages: log, missingResources: missing }, null, 2));
  console.log('resources', done.size, 'missing', missing.length);
  missing.slice(0, 30).forEach(m => console.log('  MISS', m));
})();
