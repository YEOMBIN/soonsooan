#!/usr/bin/env node
/* =========================================================
   순수안 소식 데이터 갱신 도구 — 공식 채널의 실제 최신 게시물로 data/feeds.js 를 다시 만듭니다.
   사용: soonsooan-site 폴더에서  node tools/update-feeds.js
   출처
     - 공지사항: https://soonsooan.co.kr/s_4_1 (게시판 목록) — 고정 '공지' 글과 일반 글 모두 공지사항 (2026-11-21~)
     - 칼럼: 자동 수집하지 않음. 직접 작성한 칼럼을 data/feeds.js 의 column.items 에 넣으면 그대로 유지됩니다
     - 블로그: https://rss.blog.naver.com/soonsooan.xml
     - 유튜브: https://www.youtube.com/feeds/videos.xml?channel_id=UCJyz6ST2HHb90yAJZ_Rt7SQ (@purelogue)
   썸네일은 assets/img/data/ 에 저장(이미 있으면 다시 받지 않음). 공지·칼럼 썸네일은 게시글 본문 첫 이미지.
   임의의 제목·날짜·링크를 만들지 않습니다. 가져오지 못한 카테고리는 기존 데이터를 그대로 둡니다.
   ========================================================= */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data', 'feeds.js');
const IMG = path.join(ROOT, 'assets', 'img', 'data');
const MAX = 6;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const LOCAL_POSTS = new Set(fs.readdirSync(path.join(ROOT, 'pages', 'news')).filter(f => /^notice-\d+\.html$/.test(f)).map(f => f.match(/\d+/)[0]));

const dec = s => String(s).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const ymd = d => { const t = new Date(d); const k = new Date(t.getTime() + 9 * 3600e3); return k.toISOString().slice(0, 10).replace(/-/g, '.'); }; // 한국 시간 기준

async function get(url, opt = {}) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, ...(opt.referer ? { Referer: opt.referer } : {}) } });
  if (!r.ok) throw new Error(r.status + ' ' + url);
  return opt.binary ? Buffer.from(await r.arrayBuffer()) : r.text();
}
async function saveImg(url, name, referer) {
  const file = path.join(IMG, name);
  if (!fs.existsSync(file)) fs.writeFileSync(file, await get(url, { binary: true, referer }));
  return 'assets/img/data/' + name;
}

async function board() {
  const html = await get('https://soonsooan.co.kr/s_4_1');
  const notice = [];
  for (const row of html.split('<tr').slice(1)) {
    const a = row.match(/href="https:\/\/soonsooan\.co\.kr\/s_4_1\/(\d+)"[^>]*>([\s\S]*?)<\/a>/);
    const d = row.match(/(\d{4}\.\d{2}\.\d{2})/);
    if (!a || !d) continue;
    const srl = a[1], title = dec(a[2].replace(/<[^>]+>/g, ''));
    notice.push({ srl, title, date: d[1] }); // 고정 '공지'·일반 글 모두 공지사항
  }
  const byDate = (x, y) => y.date.localeCompare(x.date);
  const pick = async (list, max) => {
    const out = [];
    for (const p of list.sort(byDate).slice(0, max)) {
      let thumb = null;
      for (const ext of ['webp', 'jpg', 'png']) {
        for (const base of ['assets/img/news/notice-' + p.srl, 'assets/img/data/notice-' + p.srl, 'assets/img/news/news-' + p.srl]) {
          if (!thumb && fs.existsSync(path.join(ROOT, base + '.' + ext))) thumb = base + '.' + ext;
        }
      }
      if (!thumb) {
        const post = await get('https://soonsooan.co.kr/s_4_1/' + p.srl);
        const body = post.split('xe_content')[1] || '';
        const m = body.match(/<img[^>]+src="([^"]+)"/);
        if (m) { const u = m[1].startsWith('http') ? m[1] : 'https://soonsooan.co.kr' + m[1]; thumb = await saveImg(u, 'notice-' + p.srl + path.extname(u.split('?')[0])); }
      }
      if (!thumb) continue; // 대표 이미지가 없으면 넣지 않음
      out.push({ title: p.title, date: p.date, url: LOCAL_POSTS.has(p.srl) ? 'pages/news/notice-' + p.srl + '.html' : 'https://soonsooan.co.kr/s_4_1/' + p.srl, source: 'https://soonsooan.co.kr/s_4_1/' + p.srl, thumb });
    }
    return out;
  };
  return { notice: await pick(notice, MAX * 2) };
}

async function blog() {
  const xml = await get('https://rss.blog.naver.com/soonsooan.xml');
  const out = [];
  for (const it of xml.split('<item>').slice(1, MAX + 1)) {
    const title = dec((it.match(/<title><!\[CDATA\[([\s\S]*?)\]\]>/) || [])[1] || '');
    const url = (it.match(/<guid>([^<]+)/) || [])[1];
    const date = ymd((it.match(/<pubDate>([^<]+)/) || [])[1]);
    const img = (it.match(/<img src="([^"]+)"/) || [])[1];
    if (!title || !url || !img) continue;
    const id = url.split('/').pop();
    const thumb = fs.existsSync(path.join(IMG, 'blog-' + id + '.webp')) ? 'assets/img/data/blog-' + id + '.webp' : await saveImg(img.replace(/\?type=\w+$/, '') + '?type=w2', 'blog-' + id + '.png', 'https://blog.naver.com/');
    out.push({ title, date, url, thumb });
  }
  return out;
}

async function youtube() {
  const xml = await get('https://www.youtube.com/feeds/videos.xml?channel_id=UCJyz6ST2HHb90yAJZ_Rt7SQ');
  // 썸네일: 채널 Shorts 탭에 보이는 '재생 전 커버'(sardefault) 우선, 없으면 oar2(영상 프레임)
  let shorts = ''; try { shorts = await get('https://www.youtube.com/@purelogue/shorts'); } catch (e) { /* 커버를 못 받으면 oar2 사용 */ }
  const cover = id => { const m = shorts.match(new RegExp('https://i\\.ytimg\\.com/vi/' + id + '/sardefault\\.jpg\\?sqp=[^"\\\\]*')); return m ? m[0] : 'https://i.ytimg.com/vi/' + id + '/oar2.jpg'; };
  const out = [];
  for (const e of xml.split('<entry>').slice(1, MAX + 1)) {
    const id = (e.match(/<yt:videoId>([^<]+)/) || [])[1];
    const title = dec((e.match(/<title>([^<]+)/) || [])[1] || '');
    const url = (e.match(/<link rel="alternate" href="([^"]+)"/) || [])[1];
    const date = ymd((e.match(/<published>([^<]+)/) || [])[1]);
    if (!id || !title || !url) continue;
    const thumb = fs.existsSync(path.join(IMG, 'yt-' + id + '.webp')) ? 'assets/img/data/yt-' + id + '.webp' : await saveImg(cover(id), 'yt-' + id + '.jpg');
    out.push({ title, date, url, thumb });
  }
  return out;
}

(async () => {
  const w = {}; new Function('window', fs.readFileSync(DATA, 'utf8'))(w);
  const F = w.SS_FEEDS; const cats = F.categories; const report = [];
  const apply = (key, items, label) => {
    if (items && items.length) { cats[key].items = items; report.push(`${label} ${items.length}건 갱신`); }
    else report.push(`${label}: 가져오지 못해 기존 데이터 유지`);
  };
  try { const b = await board(); apply('notice', b.notice, '공지사항'); } catch (e) { report.push('공지사항 실패(기존 유지): ' + e.message); }
  report.push('칼럼: 자동 수집 안 함(직접 작성분 ' + cats.column.items.length + '건 유지)');
  try { apply('youtube', await youtube(), '유튜브'); } catch (e) { report.push('유튜브 실패(기존 유지): ' + e.message); }
  try { apply('blog', await blog(), '블로그'); } catch (e) { report.push('블로그 실패(기존 유지): ' + e.message); }
  F.updatedAt = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
  F.version = Date.now().toString(36); // 썸네일 캐시 무효화용
  F.note = '공식 채널(공지사항 게시판·네이버 블로그 RSS·유튜브 RSS)에서 tools/update-feeds.js 로 수집한 실제 게시물. 게시판 글은 모두 공지사항. 칼럼은 직접 작성해 column.items 에 추가. 탭 순서: 공지사항/유튜브/블로그/칼럼.';
  const order = ['notice', 'youtube', 'blog', 'column', 'review'];
  const sorted = {}; order.forEach(k => { if (cats[k]) sorted[k] = cats[k]; }); Object.keys(cats).forEach(k => { if (!sorted[k]) sorted[k] = cats[k]; });
  F.categories = sorted;
  fs.writeFileSync(DATA, '/* 순수안 소식 데이터 — node tools/update-feeds.js 로 갱신 (README 6장) */\nwindow.SS_FEEDS = ' + JSON.stringify(F, null, 2) + ';\n');
  console.log(report.join('\n'));
})();
