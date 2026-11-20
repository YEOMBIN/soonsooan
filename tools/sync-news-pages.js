#!/usr/bin/env node
/* 순수안 소식 하위 페이지를 data/feeds.js 와 맞춤 (node tools/sync-news-pages.js — update-feeds.js 다음에 실행)
   - pages/news/column.html : 칼럼 카드 목록 = feeds 의 column 항목(최신순)
   - pages/news/notice.html : 게시판에 새로 올라온 글(목록에 없는 srl)을 일반 글 맨 앞에 추가 (기존 글·고정 공지는 그대로) */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const w = {}; new Function('window', fs.readFileSync(path.join(ROOT, 'data', 'feeds.js'), 'utf8'))(w);
const C = w.SS_FEEDS.categories;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const rel = u => /^https?:/.test(u) ? u : '../../' + u;            // 루트 기준 경로 → pages/news 기준
const href = u => /^https?:/.test(u) ? u : u.replace('pages/news/', '');
const card = (it, badge) => `<li class="snews__item">
				<a class="snews__card" href="${esc(href(it.url))}"${/^https?:/.test(it.url) ? ' target="_blank" rel="noopener"' : ''}>
					<span class="snews__thumb"><img src="${esc(rel(it.thumb))}" alt="" loading="lazy" decoding="async"></span>
					<span class="snews__body"><em class="snews__badge">${badge}</em><strong class="snews__name">${esc(it.title)}</strong><span class="snews__date">${esc(it.date)}</span></span>
				</a>
			</li>`;

// 칼럼
const colFile = path.join(ROOT, 'pages', 'news', 'column.html');
let col = fs.readFileSync(colFile, 'utf8');
col = col.replace(/<ul class="snews__grid">[\s\S]*?<\/ul>/, '<ul class="snews__grid">\n\t\t\t' + C.column.items.map(it => card(it, '칼럼')).join('\n\t\t\t') + '\n\t\t</ul>');
fs.writeFileSync(colFile, col);

// 공지사항(게시판 전체 목록): 새 글 추가
const nFile = path.join(ROOT, 'pages', 'news', 'notice.html');
let n = fs.readFileSync(nFile, 'utf8');
const all = [...C.notice.items, ...C.column.items].map(it => ({ ...it, srl: (it.source || it.url).match(/(\d+)(\.html)?$/)[1] }));
const added = [];
for (const it of all.sort((a, b) => b.date.localeCompare(a.date))) {
  if (n.includes('notice-' + it.srl + '.') || n.includes('s_4_1/' + it.srl + '"')) continue;
  const firstGeneral = n.match(/<li class="snews__item">/);
  const li = card(it, '칼럼').replace('<em class="snews__badge">칼럼</em>', '');
  n = firstGeneral ? n.replace(firstGeneral[0], li + '\n\t\t\t' + firstGeneral[0]) : n.replace('</ul>', '\t' + li + '\n\t\t</ul>');
  added.push(it.srl);
}
fs.writeFileSync(nFile, n);
console.log('column.html', C.column.items.length + '건 / notice.html 추가', added.join(',') || '없음');
