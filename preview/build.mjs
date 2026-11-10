// Vista previa estática del tema de Shopify para Vercel.
//
// Lee los archivos del tema (lafototienda-theme/) y genera páginas HTML en
// preview/dist con productos de ejemplo (preview/sample-data.mjs), para poder
// ver los cambios de diseño sin Shopify. NO es una tienda: no hay carrito,
// pagos ni inventario reales.
//
// Uso:  npm run preview:build   (Vercel lo ejecuta en cada despliegue)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Liquid } from 'liquidjs';
import { buildSampleData, credits } from './sample-data.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const THEME = path.join(ROOT, 'lafototienda-theme');
const DIST = path.join(__dirname, 'dist');

const readJSON = (file) => {
  const raw = fs.readFileSync(file, 'utf8').replace(/^\s*\/\*[\s\S]*?\*\/\s*/, '');
  return JSON.parse(raw);
};

// ---------------------------------------------------------------------------
// Traducciones
// ---------------------------------------------------------------------------
const locale = readJSON(path.join(THEME, 'locales', 'es.default.json'));

function translate(key, kwargs) {
  let value = key.split('.').reduce((obj, k) => (obj == null ? obj : obj[k]), locale);
  if (value == null) return `traducción faltante: ${key}`;
  if (typeof value === 'object') {
    const count = Number(kwargs.count);
    value = count === 1 && value.one ? value.one : value.other ?? value.one ?? '';
  }
  return String(value).replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name) => (kwargs[name] ?? ''));
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
const kw = (args) => {
  const out = {};
  const positional = [];
  for (const a of args) {
    if (Array.isArray(a) && a.length === 2 && typeof a[0] === 'string') out[a[0]] = a[1];
    else positional.push(a);
  }
  return { out, positional };
};

const escapeAttr = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const formatMoney = (cents, withSymbol = true) => {
  const n = (Number(cents) || 0) / 100;
  const s = n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return withSymbol ? `Q${s}` : s;
};

class Color {
  constructor(hex) {
    this.hex = hex;
    const h = hex.replace('#', '');
    this.red = parseInt(h.slice(0, 2), 16);
    this.green = parseInt(h.slice(2, 4), 16);
    this.blue = parseInt(h.slice(4, 6), 16);
  }
  toString() { return this.hex; }
}

class Font {
  constructor(handle) {
    const family = (handle || 'assistant').split('_')[0];
    this.family = family.charAt(0).toUpperCase() + family.slice(1);
    this.fallback_families = 'sans-serif';
    this.weight = 400;
    this['system?'] = false;
  }
  toString() { return this.family; }
}

// Un URL de imagen que recuerda su imagen de origen (para image_tag)
class ImageUrl {
  constructor(image, width) { this.image = image; this.width = width; }
  toString() { return this.image.src(this.width); }
}

// ---------------------------------------------------------------------------
// Motor Liquid con filtros y etiquetas de Shopify (versión simplificada)
// ---------------------------------------------------------------------------
const globals = {};
const engine = new Liquid({
  root: [THEME],
  partials: path.join(THEME, 'snippets'),
  extname: '.liquid',
  globals,
  strictFilters: false,
  strictVariables: false,
  ownPropertyOnly: false,
});

engine.registerFilter('t', (key, ...args) => translate(key, kw(args).out));
engine.registerFilter('money', (v) => formatMoney(v));
engine.registerFilter('money_with_currency', (v) => `${formatMoney(v)} GTQ`);
engine.registerFilter('money_without_currency', (v) => formatMoney(v, false));
engine.registerFilter('money_without_trailing_zeros', (v) => formatMoney(v).replace(/\.00$/, ''));
engine.registerFilter('asset_url', (name) => `/assets/${name}`);
engine.registerFilter('shopify_asset_url', (name) => `https://cdn.shopify.com/s/shopify/${name}`);
engine.registerFilter('stylesheet_tag', (url) => `<link href="${url}" rel="stylesheet" type="text/css" media="all" />`);
engine.registerFilter('script_tag', (url) => `<script src="${url}" defer></script>`);
engine.registerFilter('handle', (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
engine.registerFilter('url_encode', (s) => encodeURIComponent(String(s ?? '')));
engine.registerFilter('link_to', (text, url) => `<a href="${escapeAttr(url)}">${text}</a>`);
engine.registerFilter('time_tag', (d) => {
  const date = new Date(d);
  return `<time datetime="${date.toISOString()}">${date.toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' })}</time>`;
});
engine.registerFilter('format_address', () => '');
engine.registerFilter('default_errors', (errors) => (errors ? String(errors) : ''));
engine.registerFilter('metafield_tag', (m) => (m && m.value ? String(m.value) : ''));
engine.registerFilter('font_face', () => '');
engine.registerFilter('font_modify', (font) => font);
engine.registerFilter('font_url', () => '');
engine.registerFilter('payment_type_svg_tag', (type) => {
  const label = { visa: 'VISA', master: 'MC', american_express: 'AMEX' }[type] || type;
  return `<svg viewBox="0 0 38 24" width="38" height="24" role="img" aria-label="${escapeAttr(type)}"><rect width="38" height="24" rx="3" fill="#fff"/><text x="19" y="15.5" font-size="8" font-family="Arial" font-weight="700" text-anchor="middle" fill="#1a1f71">${label}</text></svg>`;
});
engine.registerFilter('placeholder_svg_tag', (name, cls) => (
  `<svg class="${escapeAttr(cls || '')}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 525 525" preserveAspectRatio="xMidYMid slice" aria-hidden="true">`
  + '<rect width="525" height="525" fill="#ececf0"/><g fill="none" stroke="#c6c6cf" stroke-width="6">'
  + '<rect x="150" y="190" width="225" height="150" rx="18"/><circle cx="262" cy="265" r="45"/><rect x="205" y="160" width="70" height="30" rx="8"/></g></svg>'
));

const imageOf = (obj) => (obj && obj.preview_image ? obj.preview_image : obj);
engine.registerFilter('image_url', (obj, ...args) => {
  const img = imageOf(obj);
  if (!img || typeof img.src !== 'function') return '';
  const { out } = kw(args);
  return new ImageUrl(img, Number(out.width) || img.width);
});
engine.registerFilter('image_tag', (url, ...args) => {
  if (!(url instanceof ImageUrl)) return '';
  const { out } = kw(args);
  const img = url.image;
  const width = url.width;
  const height = Math.round(width / (img.aspect_ratio || 1));
  const widths = String(out.widths || '').split(',').map((w) => parseInt(w, 10)).filter(Boolean);
  const srcset = widths.length ? ` srcset="${widths.map((w) => `${img.src(w)} ${w}w`).join(', ')}"` : '';
  const attrs = ['alt', 'class', 'sizes', 'loading', 'fetchpriority', 'style']
    .filter((k) => out[k] != null && out[k] !== '')
    .map((k) => ` ${k}="${escapeAttr(out[k])}"`).join('');
  const alt = out.alt == null ? ` alt="${escapeAttr(img.alt)}"` : '';
  return `<img src="${img.src(width)}"${srcset} width="${width}" height="${height}"${alt}${attrs}>`;
});

// {% schema %} … {% endschema %}: se quita antes de renderizar (ver loadSection)

// {% form 'tipo', objeto, clave: valor %}
function splitArgs(str) {
  const parts = [];
  let depth = 0; let quote = null; let cur = '';
  for (const ch of str) {
    if (quote) { cur += ch; if (ch === quote) quote = null; continue; }
    if (ch === '"' || ch === "'") { quote = ch; cur += ch; continue; }
    if (ch === '(' || ch === '[') depth++;
    if (ch === ')' || ch === ']') depth--;
    if (ch === ',' && depth === 0) { parts.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

engine.registerTag('form', {
  parse(token, remainTokens) {
    this.args = splitArgs(token.args);
    this.tpls = [];
    const stream = this.liquid.parser.parseStream(remainTokens)
      .on('tag:endform', () => stream.stop())
      .on('template', (tpl) => this.tpls.push(tpl))
      .on('end', () => { throw new Error(`form sin cerrar: ${token.getText()}`); });
    stream.start();
  },
  * render(ctx, emitter) {
    const type = this.liquid.evalValueSync(this.args[0], ctx);
    const attrs = {};
    for (const part of this.args.slice(1)) {
      const m = part.match(/^([\w-]+)\s*:\s*([\s\S]+)$/);
      if (m) attrs[m[1]] = this.liquid.evalValueSync(m[2], ctx);
    }
    const action = {
      product: '/cart/add', contact: '/contact', customer_login: '/account/login',
      create_customer: '/account', recover_customer_password: '/account/recover',
      new_comment: '#', customer_address: '/account/addresses', storefront_password: '/password',
    }[type] || '#';
    const attrHtml = Object.entries(attrs).map(([k, v]) => ` ${k}="${escapeAttr(v)}"`).join('');
    ctx.push({ form: { 'posted_successfully?': false, errors: null } });
    const inner = yield this.liquid.renderer.renderTemplates(this.tpls, ctx);
    ctx.pop();
    emitter.write(`<form method="post" action="${action}" accept-charset="UTF-8"${attrHtml}><input type="hidden" name="form_type" value="${escapeAttr(type)}">${inner}</form>`);
  },
});

// {% paginate lista by n %}: en la vista previa todo cabe en una página
engine.registerTag('paginate', {
  parse(token, remainTokens) {
    this.tpls = [];
    const stream = this.liquid.parser.parseStream(remainTokens)
      .on('tag:endpaginate', () => stream.stop())
      .on('template', (tpl) => this.tpls.push(tpl))
      .on('end', () => { throw new Error('paginate sin cerrar'); });
    stream.start();
  },
  * render(ctx, emitter) {
    ctx.push({ paginate: { pages: 1, current_page: 1, parts: [], previous: null, next: null } });
    emitter.write(yield this.liquid.renderer.renderTemplates(this.tpls, ctx));
    ctx.pop();
  },
});

// {% section 'nombre' %} y {% sections 'grupo' %}
engine.registerTag('section', {
  parse(token) { this.name = token.args.trim().replace(/^['"]|['"]$/g, ''); },
  * render(ctx, emitter) {
    emitter.write(yield renderSection(this.name, this.name, {}));
  },
});
engine.registerTag('sections', {
  parse(token) { this.name = token.args.trim().replace(/^['"]|['"]$/g, ''); },
  * render(ctx, emitter) {
    const group = readJSON(path.join(THEME, 'sections', `${this.name}.json`));
    let html = '';
    for (const id of group.order) {
      const data = group.sections[id];
      if (data.disabled) continue;
      html += yield renderSection(id, data.type, data, `shopify-section-group-${this.name}`);
    }
    emitter.write(html);
  },
});

// ---------------------------------------------------------------------------
// Secciones
// ---------------------------------------------------------------------------
const sectionCache = new Map();
function loadSection(type) {
  if (!sectionCache.has(type)) {
    const src = fs.readFileSync(path.join(THEME, 'sections', `${type}.liquid`), 'utf8');
    const m = src.match(/\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/);
    const schema = m ? JSON.parse(m[1]) : {};
    const body = src.replace(/\{%-?\s*schema\s*-?%\}[\s\S]*?\{%-?\s*endschema\s*-?%\}/, '');
    sectionCache.set(type, { schema, tpl: engine.parse(body) });
  }
  return sectionCache.get(type);
}

function resolveSetting(def, value, data) {
  if (value === undefined) value = def.default;
  switch (def.type) {
    case 'collection': return value ? data.collectionsByHandle[value] || null : null;
    case 'product': return value ? data.productsByHandle[value] || null : null;
    case 'link_list': return value ? data.linklists[value] || null : null;
    case 'image_picker': return null;
    case 'color': return value ? new Color(value) : value;
    case 'font_picker': return new Font(value);
    case 'url':
      if (typeof value === 'string') {
        const m = value.match(/^shopify:\/\/(collections|products|pages|blogs)\/(.+)$/);
        if (m) return `/${m[1]}/${m[2]}`;
      }
      return value ?? null;
    default: return value ?? null;
  }
}

function resolveSettings(defs = [], values = {}, data) {
  const out = {};
  for (const def of defs) if (def.id) out[def.id] = resolveSetting(def, values[def.id], data);
  return out;
}

async function renderSection(id, type, data, groupClass = '') {
  const { schema, tpl } = loadSection(type);
  const sample = globals.__data;
  const blockDefs = Object.fromEntries((schema.blocks || []).map((b) => [b.type, b]));
  const order = data.block_order || Object.keys(data.blocks || {});
  const blocks = order
    .map((bid) => ({ bid, b: data.blocks[bid] }))
    .filter(({ b }) => b && !b.disabled)
    .map(({ bid, b }) => ({
      id: bid,
      type: b.type,
      settings: resolveSettings(blockDefs[b.type]?.settings, b.settings, sample),
      shopify_attributes: '',
    }));
  const section = { id, settings: resolveSettings(schema.settings, data.settings, sample), blocks };
  const inner = await engine.render(tpl, { section });
  const tag = schema.tag || 'div';
  const cls = ['shopify-section', groupClass, schema.class].filter(Boolean).join(' ');
  return `<${tag} id="shopify-section-${id}" class="${cls}">${inner}</${tag}>`;
}

async function renderTemplate(templateName) {
  const tpl = readJSON(path.join(THEME, 'templates', `${templateName}.json`));
  let html = '';
  for (const id of tpl.order) {
    const data = tpl.sections[id];
    if (data.disabled) continue;
    html += await renderSection(id, data.type, data);
  }
  return html;
}

// ---------------------------------------------------------------------------
// Construcción de páginas
// ---------------------------------------------------------------------------
const layoutTpl = engine.parse(fs.readFileSync(path.join(THEME, 'layout', 'theme.liquid'), 'utf8'));

const PREVIEW_EXTRAS = `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  .preview-badge{position:fixed;left:12px;bottom:12px;z-index:200;background:#111;color:#fff;font:600 12px/1.3 Assistant,sans-serif;padding:8px 12px;border-radius:999px;box-shadow:0 6px 20px rgba(0,0,0,.25);opacity:.85}
  .preview-toast{position:fixed;left:50%;bottom:24px;transform:translate(-50%,20px);z-index:300;background:#111;color:#fff;font:600 14px/1.4 Assistant,sans-serif;padding:12px 18px;border-radius:12px;opacity:0;transition:all .3s;pointer-events:none;max-width:90vw;text-align:center}
  .preview-toast.is-visible{opacity:1;transform:translate(-50%,0)}
</style>`;

const PREVIEW_SCRIPT = `
<div class="preview-badge">Vista previa · productos de ejemplo · <a href="/creditos" style="color:#fff">créditos de fotos</a></div>
<div class="preview-toast" id="PreviewToast" role="status"></div>
<script>
  (function () {
    var toast = document.getElementById('PreviewToast'), t;
    function show(msg) {
      toast.textContent = msg; toast.classList.add('is-visible');
      clearTimeout(t); t = setTimeout(function () { toast.classList.remove('is-visible'); }, 3200);
    }
    window.addEventListener('submit', function (e) {
      if (!e.target.matches('form[method="post"]')) return;
      e.preventDefault(); e.stopImmediatePropagation();
      show('Vista previa: el carrito, el checkout y los formularios funcionan en la tienda de Shopify.');
    }, true);
  })();
</script>`;

async function buildPage(outFile, pageGlobals, templateName) {
  Object.assign(globals, {
    product: null, collection: null, page: null, search: null, recommendations: { 'performed?': false },
    current_tags: null, current_page: 1, page_image: null, page_description: '',
  }, pageGlobals);
  globals.template = { name: templateName.split('.')[0].replace('customers/', '') };
  const content = await renderTemplate(templateName);
  let html = await engine.render(layoutTpl, { content_for_layout: content, content_for_header: '' });
  html = html.replace('</head>', `${PREVIEW_EXTRAS}\n</head>`).replace('</body>', `${PREVIEW_SCRIPT}\n</body>`);
  const dest = path.join(DIST, outFile);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, html);
  console.log('  ✓', outFile);
}

function themeSettings(data) {
  const schema = readJSON(path.join(THEME, 'config', 'settings_schema.json'));
  const settingsData = readJSON(path.join(THEME, 'config', 'settings_data.json'));
  const current = typeof settingsData.current === 'string'
    ? settingsData.presets?.[settingsData.current] || {}
    : settingsData.current || {};
  const defs = schema.flatMap((g) => g.settings || []);
  return resolveSettings(defs, current, data);
}

function writeCreditsPage() {
  const rows = credits.map((c) => `<li><strong>${c.title}</strong> — ${c.author}. Licencia ${c.license}. <a href="${c.source}">Ver en Wikimedia Commons</a></li>`).join('\n');
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Créditos de fotos | Vista previa</title>
<style>body{font:16px/1.6 system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 16px;color:#1a1a1a}a{color:#E30613}li{margin-bottom:10px}</style></head>
<body><h1>Créditos de fotos</h1><p>Las fotos de esta vista previa son de <a href="https://commons.wikimedia.org">Wikimedia Commons</a> y se usan según su licencia. Se redujeron de tamaño y se recortan en el carrusel. Algunas muestran un modelo cercano al producto de ejemplo.</p>
<ul>${rows}</ul><p>La imagen del DJI Osmo 360 es una ilustración temporal.</p><p><a href="/">Volver a la vista previa</a></p></body></html>`;
  fs.writeFileSync(path.join(DIST, 'creditos.html'), html);
}

async function main() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
  fs.cpSync(path.join(THEME, 'assets'), path.join(DIST, 'assets'), { recursive: true });
  fs.cpSync(path.join(__dirname, 'images'), path.join(DIST, 'preview-images'), {
    recursive: true,
    filter: (src) => !src.endsWith('.json'),
  });
  writeCreditsPage();

  const data = buildSampleData();
  Object.assign(globals, {
    __data: data,
    settings: themeSettings(data),
    shop: data.shop,
    cart: data.cart,
    routes: data.routes,
    linklists: data.linklists,
    collections: data.collectionList,
    customer: null,
    canonical_url: data.shop.url,
    request: { locale: { iso_code: 'es' }, page_type: 'index' },
  });

  console.log('Generando vista previa…');
  await buildPage('index.html', {
    request: { locale: { iso_code: 'es' }, page_type: 'index' },
    page_title: data.shop.name, page_description: 'Fotografía, video y drones en Guatemala.',
    canonical_url: `${data.shop.url}/`,
  }, 'index');

  for (const product of data.products) {
    const related = product.collections[0]?.products.filter((p) => p.id !== product.id) || [];
    await buildPage(`products/${product.handle}.html`, {
      request: { locale: { iso_code: 'es' }, page_type: 'product' },
      product, collection: null, page_title: product.title,
      page_description: product.description.replace(/<[^>]+>/g, ' ').slice(0, 160),
      page_image: product.featured_media.preview_image,
      canonical_url: data.shop.url + product.url,
      recommendations: { 'performed?': true, products: related.slice(0, 3), products_count: Math.min(3, related.length) },
    }, 'product');
  }

  for (const collection of data.collectionList) {
    await buildPage(`collections/${collection.handle}.html`, {
      request: { locale: { iso_code: 'es' }, page_type: 'collection' },
      collection, page_title: collection.title, canonical_url: data.shop.url + collection.url,
    }, 'collection');
  }

  const basic = (type, title) => ({ request: { locale: { iso_code: 'es' }, page_type: type }, page_title: title });
  await buildPage('collections.html', basic('list-collections', 'Categorías'), 'list-collections');
  await buildPage('cart.html', basic('cart', 'Tu carrito'), 'cart');
  await buildPage('search.html', { ...basic('search', 'Buscar'), search: { performed: false, terms: '' } }, 'search');
  await buildPage('pages/contacto.html', {
    ...basic('page', 'Contacto'),
    page: { title: 'Contacto', url: '/pages/contacto', content: '<p>¿Tienes dudas sobre algún equipo? Escríbenos y te asesoramos.</p>' },
  }, 'page.contact');
  await buildPage('account/login.html', basic('customers/login', 'Iniciar sesión'), 'customers/login');
  await buildPage('account/register.html', basic('customers/register', 'Crear cuenta'), 'customers/register');
  await buildPage('404.html', basic('404', 'Página no encontrada'), '404');
  console.log('Listo →', path.relative(ROOT, DIST));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
