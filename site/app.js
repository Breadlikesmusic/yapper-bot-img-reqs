const KINDS = [
  { key: 'talents', label: 'Talents' },
  { key: 'mantras', label: 'Mantras' },
  { key: 'oaths', label: 'Oaths' },
  { key: 'boons', label: 'Boons' },
  { key: 'flaws', label: 'Flaws' },
  { key: 'weapons', label: 'Weapons' },
  { key: 'outfits', label: 'Outfits' },
];

const state = { base: '', kinds: KINDS, data: {}, counts: {} };

async function loadManifest() {
  // The manifest lives next to the data and says where to read everything from.
  const sources = [
    './data/manifest.json',
    'https://raw.githubusercontent.com/Breadlikesmusic/yapper-bot-img-reqs/main/site/data/manifest.json',
  ];
  for (const url of sources) {
    try {
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) continue;
      const m = await r.json();
      if (m && m.base) return m;
    } catch {}
  }
  return null;
}

export async function boot() {
  const manifest = await loadManifest();
  if (manifest) {
    state.base = manifest.base;
    state.counts = manifest.counts || {};
  }
  return state;
}

export function getBase() {
  return state.base;
}

export function getCounts() {
  return state.counts;
}

export async function loadKind(key) {
  if (state.data[key]) return state.data[key];
  // The copy next to the site is used first. It is served by the site host
  // itself, so it is always current. The repo copy is the fallback, and it can
  // be a few minutes behind because that CDN caches for five minutes and
  // ignores the query string.
  const urls = [`./data/${key}.json`];
  if (state.base) urls.push(`${state.base}/${key}.json`);
  for (const url of urls) {
    try {
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) continue;
      state.data[key] = await r.json();
      return state.data[key];
    } catch {}
  }
  state.data[key] = [];
  return state.data[key];
}

export function normalise(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function searchRows(rows, query) {
  const q = normalise(query);
  if (!q) return rows;
  const words = q.split(' ');
  return rows.filter((row) => {
    const name = normalise(row.name);
    if (words.every((w) => name.includes(w))) return true;
    const hay = normalise([row.category, row.rarity, row.description, row.details, row.type, row.tier].filter(Boolean).join(' '));
    return words.every((w) => hay.includes(w));
  });
}

export function escapeHtml(text) {
  return String(text ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function formatStatBlock(stats) {
  if (!stats) return '';
  return Object.entries(stats)
    .map(([key, value]) => `<span class="pill">${escapeHtml(key)} ${escapeHtml(value)}</span>`)
    .join('');
}
