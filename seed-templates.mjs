import pg from 'pg';
import { randomUUID } from 'crypto';

const { Client } = pg;
const DB = 'postgresql://bifrost-admin:bifrost-admin@127.0.0.1/webstudio_db';

const SYSTEM_USER_ID = 'bifrost-system-templates-user';

// Shared breakpoints
const BP = [
  { id: 'bp-base', label: 'Base' },
  { id: 'bp-tablet', label: 'Tablet', maxWidth: 991 },
  { id: 'bp-mobile-l', label: 'Mobile landscape', maxWidth: 767 },
  { id: 'bp-mobile-p', label: 'Mobile portrait', maxWidth: 479 },
];

// Helper to build a minimal instance tree
function el(id, tag, children = [], label) {
  return { type: 'instance', id, component: 'ws:element', tag, children: children.map(c => ({ type: 'id', value: c })), ...(label ? { label } : {}) };
}

function txt(id, text) {
  return { type: 'instance', id, component: 'ws:element', tag: 'span', children: [{ type: 'text', value: text }] };
}

function style(breakpointId, styleSourceId, property, value) {
  return { breakpointId, styleSourceId, property, value };
}

function localSS(instanceId) {
  return { type: 'local', id: `${instanceId}:ws:style` };
}

function color(hex) {
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b = parseInt(hex.slice(5,7),16)/255;
  return { type: 'color', colorSpace: 'hex', components: [r, g, b], alpha: 1 };
}

function kw(v) { return { type: 'keyword', value: v }; }
function unit(v, u='px') { return { type: 'unit', unit: u, value: v }; }
function str(v) { return v; }

// ─── TEMPLATE BUILDER ────────────────────────────────────────────────────────

function buildTemplate(name, bg, text, accent, border, navBg, heroStyle) {
  const pid = randomUUID();
  const bid = randomUUID();

  // Instance IDs
  const ROOT = 'root-body';
  const NAV = 'nav-wrap'; const NAV_INNER = 'nav-inner';
  const LOGO = 'nav-logo'; const LOGO_TXT = 'logo-txt';
  const NAV_LINKS = 'nav-links'; const NAV_A = 'nav-a-txt';
  const NAV_CART = 'nav-cart'; const NAV_CART_TXT = 'nav-cart-txt';

  const HERO = 'hero-section'; const HERO_INNER = 'hero-inner';
  const HERO_H1 = 'hero-h1'; const HERO_H1_TXT = 'hero-h1-txt';
  const HERO_SUB = 'hero-sub'; const HERO_SUB_TXT = 'hero-sub-txt';
  const HERO_BTN = 'hero-btn'; const HERO_BTN_TXT = 'hero-btn-txt';

  const FEAT = 'feat-section'; const FEAT_INNER = 'feat-inner';
  const FEAT_H = 'feat-h'; const FEAT_H_TXT = 'feat-h-txt';
  const GRID = 'feat-grid';
  const CARD1 = 'card1'; const C1_IMG = 'c1-img'; const C1_INFO = 'c1-info'; const C1_NAME = 'c1-name-span'; const C1_PRICE = 'c1-price-span';
  const CARD2 = 'card2'; const C2_IMG = 'c2-img'; const C2_INFO = 'c2-info'; const C2_NAME = 'c2-name-span'; const C2_PRICE = 'c2-price-span';
  const CARD3 = 'card3'; const C3_IMG = 'c3-img'; const C3_INFO = 'c3-info'; const C3_NAME = 'c3-name-span'; const C3_PRICE = 'c3-price-span';

  const PROMO = 'promo-banner'; const PROMO_TXT = 'promo-txt'; const PROMO_TXT_SPAN = 'promo-txt-span';

  const NL = 'newsletter'; const NL_INNER = 'nl-inner'; const NL_H = 'nl-h'; const NL_H_TXT = 'nl-h-txt';
  const NL_SUB = 'nl-sub'; const NL_SUB_TXT = 'nl-sub-txt'; const NL_FORM = 'nl-form';
  const NL_INPUT = 'nl-input'; const NL_BTN = 'nl-btn'; const NL_BTN_TXT = 'nl-btn-txt';

  const FOOTER = 'footer'; const FOOTER_INNER = 'footer-inner';
  const FT_LOGO = 'ft-logo'; const FT_LOGO_TXT = 'ft-logo-txt';
  const FT_COPY = 'ft-copy'; const FT_COPY_TXT = 'ft-copy-txt';
  const FT_PWR = 'ft-pwr'; const FT_PWR_TXT = 'ft-pwr-txt';

  const pageId = 'home-page-id';

  const pages = {
    homePage: { id: pageId, name: 'Home', path: '', title: `"${name} - Store"`, meta: {}, rootInstanceId: ROOT },
    pages: [],
    folders: [{ id: 'root', name: 'Root', slug: '', children: [pageId] }]
  };

  const instances = [
    el(ROOT, 'body', [NAV, HERO, FEAT, PROMO, NL, FOOTER]),
    // NAV
    el(NAV, 'header', [NAV_INNER], 'Navbar'),
    el(NAV_INNER, 'nav', [LOGO, NAV_LINKS, NAV_CART]),
    el(LOGO, 'a', [LOGO_TXT], 'Logo'),
    txt(LOGO_TXT, name),
    el(NAV_LINKS, 'div', [NAV_A]),
    txt(NAV_A, 'Shop  Collections  About'),
    el(NAV_CART, 'a', [NAV_CART_TXT]),
    txt(NAV_CART_TXT, 'Cart (0)'),
    // HERO
    el(HERO, 'section', [HERO_INNER], 'Hero'),
    el(HERO_INNER, 'div', [HERO_H1, HERO_SUB, HERO_BTN]),
    el(HERO_H1, 'h1', [HERO_H1_TXT]),
    txt(HERO_H1_TXT, 'Discover Our Collection'),
    el(HERO_SUB, 'p', [HERO_SUB_TXT]),
    txt(HERO_SUB_TXT, 'Premium products for everyday life'),
    el(HERO_BTN, 'a', [HERO_BTN_TXT]),
    txt(HERO_BTN_TXT, 'Shop Now'),
    // FEATURED
    el(FEAT, 'section', [FEAT_INNER], 'Featured Products'),
    el(FEAT_INNER, 'div', [FEAT_H, GRID]),
    el(FEAT_H, 'h2', [FEAT_H_TXT]),
    txt(FEAT_H_TXT, 'Featured Products'),
    el(GRID, 'div', [CARD1, CARD2, CARD3]),
    el(CARD1, 'div', [C1_IMG, C1_INFO], 'Product Card'),
    el(C1_IMG, 'div', []),
    el(C1_INFO, 'div', [C1_NAME, C1_PRICE]),
    txt(C1_NAME, 'Product Name'),
    txt(C1_PRICE, '$29.99'),
    el(CARD2, 'div', [C2_IMG, C2_INFO], 'Product Card'),
    el(C2_IMG, 'div', []),
    el(C2_INFO, 'div', [C2_NAME, C2_PRICE]),
    txt(C2_NAME, 'Product Name'),
    txt(C2_PRICE, '$49.99'),
    el(CARD3, 'div', [C3_IMG, C3_INFO], 'Product Card'),
    el(C3_IMG, 'div', []),
    el(C3_INFO, 'div', [C3_NAME, C3_PRICE]),
    txt(C3_NAME, 'Product Name'),
    txt(C3_PRICE, '$19.99'),
    // PROMO
    el(PROMO, 'div', [PROMO_TXT], 'Promo Banner'),
    el(PROMO_TXT, 'p', [PROMO_TXT_SPAN]),
    txt(PROMO_TXT_SPAN, '✦ FREE SHIPPING ON ORDERS OVER $50 ✦ USE CODE: BIFROST10 ✦'),
    // NEWSLETTER
    el(NL, 'section', [NL_INNER], 'Newsletter'),
    el(NL_INNER, 'div', [NL_H, NL_SUB, NL_FORM]),
    el(NL_H, 'h2', [NL_H_TXT]),
    txt(NL_H_TXT, 'Stay in the loop'),
    el(NL_SUB, 'p', [NL_SUB_TXT]),
    txt(NL_SUB_TXT, 'Get exclusive deals and new arrivals first.'),
    el(NL_FORM, 'form', [NL_INPUT, NL_BTN]),
    el(NL_INPUT, 'input', []),
    el(NL_BTN, 'button', [NL_BTN_TXT]),
    txt(NL_BTN_TXT, 'Subscribe'),
    // FOOTER
    el(FOOTER, 'footer', [FOOTER_INNER]),
    el(FOOTER_INNER, 'div', [FT_LOGO, FT_COPY, FT_PWR]),
    el(FT_LOGO, 'a', [FT_LOGO_TXT]),
    txt(FT_LOGO_TXT, name),
    el(FT_COPY, 'p', [FT_COPY_TXT]),
    txt(FT_COPY_TXT, `© ${new Date().getFullYear()} ${name}. All rights reserved.`),
    el(FT_PWR, 'p', [FT_PWR_TXT]),
    txt(FT_PWR_TXT, 'Powered by Bifrost'),
  ];

  const B = 'bp-base';

  // Props
  const props = [
    { id: `${LOGO}:href`, instanceId: LOGO, name: 'href', type: 'string', value: '/' },
    { id: `${NAV_CART}:href`, instanceId: NAV_CART, name: 'href', type: 'string', value: '/cart' },
    { id: `${HERO_BTN}:href`, instanceId: HERO_BTN, name: 'href', type: 'string', value: '/collections/all' },
    { id: `${FT_LOGO}:href`, instanceId: FT_LOGO, name: 'href', type: 'string', value: '/' },
    { id: `${NL_INPUT}:type`, instanceId: NL_INPUT, name: 'type', type: 'string', value: 'email' },
    { id: `${NL_INPUT}:placeholder`, instanceId: NL_INPUT, name: 'placeholder', type: 'string', value: 'your@email.com' },
    { id: `${NL_BTN}:type`, instanceId: NL_BTN, name: 'type', type: 'string', value: 'submit' },
  ];

  // StyleSources
  const ss = [ROOT, NAV, NAV_INNER, LOGO, NAV_LINKS, NAV_CART, HERO, HERO_INNER, HERO_H1, HERO_SUB, HERO_BTN, FEAT, FEAT_INNER, FEAT_H, GRID, CARD1, C1_IMG, C1_INFO, CARD2, C2_IMG, C2_INFO, CARD3, C3_IMG, C3_INFO, PROMO, PROMO_TXT, NL, NL_INNER, NL_H, NL_SUB, NL_FORM, NL_INPUT, NL_BTN, FOOTER, FOOTER_INNER, FT_LOGO, FT_COPY].map(localSS);

  const styleSources = JSON.stringify(ss);

  // Styles
  const S = (id, property, value) => style(B, `${id}:ws:style`, property, value);
  const styles = JSON.stringify([
    // Reset/base
    S(ROOT, 'margin', unit(0)), S(ROOT, 'padding', unit(0)), S(ROOT, 'fontFamily', kw('sans-serif')),
    S(ROOT, 'backgroundColor', color(bg)), S(ROOT, 'color', color(text)),
    // NAV
    S(NAV, 'position', kw('sticky')), S(NAV, 'top', unit(0)), S(NAV, 'zIndex', unit(50, 'number')),
    S(NAV, 'backgroundColor', color(navBg)), S(NAV, 'borderBottom', { type: 'unparsed', value: `1px solid ${border}` }),
    S(NAV_INNER, 'display', kw('flex')), S(NAV_INNER, 'alignItems', kw('center')),
    S(NAV_INNER, 'justifyContent', kw('space-between')),
    S(NAV_INNER, 'maxWidth', unit(1200)), S(NAV_INNER, 'margin', { type: 'unparsed', value: '0 auto' }),
    S(NAV_INNER, 'padding', { type: 'unparsed', value: '0 24px' }), S(NAV_INNER, 'height', unit(64)),
    S(LOGO, 'fontWeight', unit(800, 'number')), S(LOGO, 'fontSize', unit(20)), S(LOGO, 'textDecoration', kw('none')),
    S(LOGO, 'color', color(text)), S(LOGO, 'letterSpacing', unit(2)),
    S(NAV_LINKS, 'display', kw('flex')), S(NAV_LINKS, 'gap', unit(32)),
    S(NAV_LINKS, 'color', color(text)), S(NAV_LINKS, 'fontSize', unit(14)),
    S(NAV_CART, 'color', color(text)), S(NAV_CART, 'textDecoration', kw('none')),
    S(NAV_CART, 'fontWeight', unit(600, 'number')),
    // HERO
    S(HERO, 'minHeight', { type: 'unit', unit: 'vh', value: 80 }),
    S(HERO, 'display', kw('flex')), S(HERO, 'alignItems', kw('center')),
    S(HERO, 'justifyContent', kw('center')),
    S(HERO, 'backgroundColor', color(heroStyle.bg)),
    S(HERO, 'padding', { type: 'unparsed', value: '80px 24px' }),
    S(HERO_INNER, 'textAlign', kw('center')), S(HERO_INNER, 'maxWidth', unit(700)),
    S(HERO_H1, 'fontSize', unit(heroStyle.h1size)), S(HERO_H1, 'fontWeight', unit(heroStyle.h1weight, 'number')),
    S(HERO_H1, 'color', color(heroStyle.titleColor)), S(HERO_H1, 'lineHeight', unit(1.1, 'number')),
    S(HERO_H1, 'marginBottom', unit(16)),
    S(HERO_SUB, 'fontSize', unit(18)), S(HERO_SUB, 'color', color(heroStyle.subColor)),
    S(HERO_SUB, 'marginBottom', unit(40)),
    S(HERO_BTN, 'display', kw('inline-block')), S(HERO_BTN, 'padding', { type: 'unparsed', value: '14px 40px' }),
    S(HERO_BTN, 'backgroundColor', color(accent)), S(HERO_BTN, 'color', color(heroStyle.btnTextColor)),
    S(HERO_BTN, 'textDecoration', kw('none')), S(HERO_BTN, 'fontWeight', unit(700, 'number')),
    S(HERO_BTN, 'fontSize', unit(15)), S(HERO_BTN, 'borderRadius', unit(heroStyle.btnRadius)),
    S(HERO_BTN, 'letterSpacing', unit(1)),
    // FEATURED
    S(FEAT, 'padding', { type: 'unparsed', value: '80px 24px' }), S(FEAT, 'backgroundColor', color(bg)),
    S(FEAT_INNER, 'maxWidth', unit(1200)), S(FEAT_INNER, 'margin', { type: 'unparsed', value: '0 auto' }),
    S(FEAT_H, 'fontSize', unit(32)), S(FEAT_H, 'fontWeight', unit(700, 'number')),
    S(FEAT_H, 'marginBottom', unit(40)), S(FEAT_H, 'textAlign', kw('center')), S(FEAT_H, 'color', color(text)),
    S(GRID, 'display', kw('grid')),
    S(GRID, 'gridTemplateColumns', { type: 'unparsed', value: 'repeat(3, 1fr)' }),
    S(GRID, 'gap', unit(24)),
    ...[CARD1, CARD2, CARD3].flatMap(id => [
      S(id, 'borderRadius', unit(heroStyle.cardRadius)), S(id, 'overflow', kw('hidden')),
      S(id, 'border', { type: 'unparsed', value: `1px solid ${border}` }),
      S(id, 'backgroundColor', color(bg)), S(id, 'cursor', kw('pointer')),
    ]),
    ...[C1_IMG, C2_IMG, C3_IMG].flatMap(id => [
      S(id, 'height', unit(260)), S(id, 'backgroundColor', color(border)),
    ]),
    ...[C1_INFO, C2_INFO, C3_INFO].flatMap(id => [
      S(id, 'display', kw('flex')), S(id, 'justifyContent', kw('space-between')),
      S(id, 'alignItems', kw('center')), S(id, 'padding', unit(16)),
    ]),
    // PROMO
    S(PROMO, 'backgroundColor', color(accent)), S(PROMO, 'padding', { type: 'unparsed', value: '16px 24px' }),
    S(PROMO_TXT, 'textAlign', kw('center')), S(PROMO_TXT, 'color', color(heroStyle.btnTextColor)),
    S(PROMO_TXT, 'fontWeight', unit(700, 'number')), S(PROMO_TXT, 'fontSize', unit(13)),
    S(PROMO_TXT, 'letterSpacing', unit(2)),
    // NEWSLETTER
    S(NL, 'backgroundColor', color(heroStyle.nlBg)), S(NL, 'padding', { type: 'unparsed', value: '80px 24px' }),
    S(NL_INNER, 'maxWidth', unit(600)), S(NL_INNER, 'margin', { type: 'unparsed', value: '0 auto' }),
    S(NL_INNER, 'textAlign', kw('center')),
    S(NL_H, 'fontSize', unit(36)), S(NL_H, 'fontWeight', unit(700, 'number')), S(NL_H, 'color', color(heroStyle.nlText)),
    S(NL_H, 'marginBottom', unit(12)),
    S(NL_SUB, 'fontSize', unit(16)), S(NL_SUB, 'color', color(heroStyle.nlText)), S(NL_SUB, 'marginBottom', unit(32)),
    S(NL_FORM, 'display', kw('flex')), S(NL_FORM, 'gap', unit(12)), S(NL_FORM, 'justifyContent', kw('center')),
    S(NL_INPUT, 'padding', { type: 'unparsed', value: '12px 20px' }), S(NL_INPUT, 'borderRadius', unit(heroStyle.btnRadius)),
    S(NL_INPUT, 'border', { type: 'unparsed', value: `1px solid ${border}` }), S(NL_INPUT, 'fontSize', unit(15)),
    S(NL_INPUT, 'width', unit(280)),
    S(NL_BTN, 'padding', { type: 'unparsed', value: '12px 28px' }), S(NL_BTN, 'borderRadius', unit(heroStyle.btnRadius)),
    S(NL_BTN, 'backgroundColor', color(accent)), S(NL_BTN, 'color', color(heroStyle.btnTextColor)),
    S(NL_BTN, 'border', kw('none')), S(NL_BTN, 'fontWeight', unit(700, 'number')), S(NL_BTN, 'cursor', kw('pointer')),
    // FOOTER
    S(FOOTER, 'backgroundColor', color(heroStyle.ftBg)), S(FOOTER, 'borderTop', { type: 'unparsed', value: `1px solid ${border}` }),
    S(FOOTER, 'padding', { type: 'unparsed', value: '40px 24px' }),
    S(FOOTER_INNER, 'maxWidth', unit(1200)), S(FOOTER_INNER, 'margin', { type: 'unparsed', value: '0 auto' }),
    S(FOOTER_INNER, 'display', kw('flex')), S(FOOTER_INNER, 'justifyContent', kw('space-between')),
    S(FOOTER_INNER, 'alignItems', kw('center')),
    S(FT_LOGO, 'fontWeight', unit(800, 'number')), S(FT_LOGO, 'textDecoration', kw('none')),
    S(FT_LOGO, 'color', color(heroStyle.ftText)), S(FT_LOGO, 'fontSize', unit(18)), S(FT_LOGO, 'letterSpacing', unit(2)),
    S(FT_COPY, 'fontSize', unit(12)), S(FT_COPY, 'color', color(heroStyle.ftText)),
  ]);

  const build = {
    id: bid,
    projectId: pid,
    pages: JSON.stringify(pages),
    instances: JSON.stringify(instances),
    props: JSON.stringify(props),
    styleSources,
    styles,
    breakpoints: JSON.stringify(BP),
    styleSourceSelections: JSON.stringify(
      [ROOT, NAV, NAV_INNER, LOGO, NAV_LINKS, NAV_CART, HERO, HERO_INNER, HERO_H1, HERO_SUB, HERO_BTN,
       FEAT, FEAT_INNER, FEAT_H, GRID, CARD1, C1_IMG, C1_INFO, CARD2, C2_IMG, C2_INFO, CARD3, C3_IMG, C3_INFO,
       PROMO, PROMO_TXT, NL, NL_INNER, NL_H, NL_SUB, NL_FORM, NL_INPUT, NL_BTN, FOOTER, FOOTER_INNER, FT_LOGO, FT_COPY
      ].map(id => ({ instanceId: id, values: [`${id}:ws:style`] }))
    ),
    dataSources: '[]',
    resources: '[]',
    marketplaceProduct: '{}',
  };

  return { pid, bid, name, build };
}

// ─── DEFINE 3 TEMPLATES ──────────────────────────────────────────────────────

const templates = [
  buildTemplate(
    'NOVA Store',
    '#0a0a0a', '#fafafa', '#ffffff', '#222222', '#0a0a0a',
    { bg: '#0a0a0a', titleColor: '#ffffff', subColor: '#888888', btnTextColor: '#000000', btnRadius: 0,
      h1size: 72, h1weight: 900, cardRadius: 4, nlBg: '#111111', nlText: '#cccccc', ftBg: '#050505', ftText: '#666666' }
  ),
  buildTemplate(
    'BLOOM Store',
    '#fdf8f0', '#2d2017', '#e8697d', '#f0e8d8', '#fdf8f0',
    { bg: '#fdf8f0', titleColor: '#2d2017', subColor: '#8a6a50', btnTextColor: '#ffffff', btnRadius: 50,
      h1size: 64, h1weight: 700, cardRadius: 16, nlBg: '#f9ede5', nlText: '#2d2017', ftBg: '#fdf8f0', ftText: '#8a6a50' }
  ),
  buildTemplate(
    'FORGE Store',
    '#ffffff', '#111111', '#e61919', '#111111', '#111111',
    { bg: '#ffffff', titleColor: '#111111', subColor: '#555555', btnTextColor: '#ffffff', btnRadius: 0,
      h1size: 80, h1weight: 900, cardRadius: 0, nlBg: '#111111', nlText: '#ffffff', ftBg: '#111111', ftText: '#aaaaaa' }
  ),
];

// ─── SEED TO DB ──────────────────────────────────────────────────────────────

const client = new Client({ connectionString: DB });
await client.connect();

try {
  await client.query('BEGIN');

  // Create dedicated system user if not exists
  const existingUser = await client.query('SELECT id FROM "User" WHERE id = $1', [SYSTEM_USER_ID]);
  if (existingUser.rows.length === 0) {
    await client.query(
      `INSERT INTO "User" (id, email, "createdAt") VALUES ($1, $2, NOW())`,
      [SYSTEM_USER_ID, 'templates@bifrost.system']
    );
    console.log('✓ Created system user: templates@bifrost.system');
  } else {
    console.log('✓ System user already exists');
  }

  // Create default workspace for system user
  const wsId = 'bifrost-templates-workspace';
  const existingWs = await client.query('SELECT id FROM "Workspace" WHERE id = $1', [wsId]);
  if (existingWs.rows.length === 0) {
    await client.query(
      `INSERT INTO "Workspace" (id, "userId", name, "isDeleted", "createdAt") VALUES ($1, $2, $3, false, NOW())`,
      [wsId, SYSTEM_USER_ID, 'Bifrost Templates']
    );
    console.log('✓ Created templates workspace');
  }

  const ids = [];

  for (const { pid, bid, name, build } of templates) {
    // Check if already seeded
    const existing = await client.query('SELECT id FROM "Project" WHERE id = $1', [pid]);
    if (existing.rows.length > 0) {
      console.log(`⚠ Template "${name}" already exists (${pid}), skipping`);
      ids.push(pid);
      continue;
    }

    // Insert Project
    await client.query(
      `INSERT INTO "Project" (id, "userId", title, domain, "isDeleted", "createdAt")
       VALUES ($1, $2, $3, $4, false, NOW())`,
      [pid, SYSTEM_USER_ID, name, `${pid.slice(0,8)}.bifrost.template`]
    );

    // Insert Build
    await client.query(
      `INSERT INTO "Build" (id, "projectId", pages, instances, props, "styleSources", styles, breakpoints,
        "styleSourceSelections", "dataSources", resources, "marketplaceProduct", version, "publishStatus")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,0,'PENDING')`,
      [bid, pid, build.pages, build.instances, build.props, build.styleSources, build.styles,
       build.breakpoints, build.styleSourceSelections, build.dataSources, build.resources, build.marketplaceProduct]
    );

    ids.push(pid);
    console.log(`✓ Created template "${name}" → ${pid}`);
  }

  await client.query('COMMIT');

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Add to apps/builder/.env:');
  console.log(`PROJECT_TEMPLATES=${ids.join(',')}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

} catch (err) {
  await client.query('ROLLBACK');
  console.error('✗ Seed failed:', err.message);
  console.error(err);
  process.exit(1);
} finally {
  await client.end();
}
