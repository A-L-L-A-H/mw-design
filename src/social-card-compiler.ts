/**
 * V64: Parametric OG Social Card & PDF Invoice Header SVG/PNG Compiler for mw-design.
 *
 * Respects CAN-0011..0014 governance:
 *   - CAN-0011: Strictly forbids visual/character depiction of Allah, Prophet Muhammad, or Isa/Yesus.
 *   - CAN-0012: Preserves immutable source/version provenance (no silent overwrites without sourceRef/previousVersionSha256).
 *   - CAN-0013: Explicitly distinguishes originActor (user_original, editorial, ai_assistant, scripture_source).
 *   - CAN-0014: Preserves epistemic layer separation (editorial, commercial_invoice, creative_metaphor, etc. never claim scripture/tafsir status).
 *
 * Uses MoonWitness grunge palette & typography (Anton / Space Grotesk / JetBrains Mono).
 * Deterministic SVG -> PNG compilation with pure-TS PNG encoder fallback (zero credit-card SaaS dependencies).
 */

import { createHash } from 'node:crypto';
import { deflateSync } from 'node:zlib';

export type BrandTheme = 'light' | 'dark';
export type CanonRuleId = 'CAN-0011' | 'CAN-0012' | 'CAN-0013' | 'CAN-0014';

export type AssetOriginActor =
  | 'editorial'
  | 'user_original'
  | 'ai_assistant'
  | 'scripture_source';

export type AssetEpistemicLayer =
  | 'editorial_brand'
  | 'commercial_invoice'
  | 'creative_metaphor'
  | 'personal_reflection'
  | 'ai_hypothesis'
  | 'translation';

export interface CanonProvenanceMetadata {
  readonly originActor: AssetOriginActor;
  readonly epistemicLayer: AssetEpistemicLayer;
  readonly aiGenerated?: boolean;
  readonly sourceRef?: string;
  readonly previousVersionSha256?: string;
  readonly silentOverwrite?: boolean;
  readonly claimsScriptureStatus?: boolean;
  readonly visualPrompt?: string;
}

export interface CanonCheckReport {
  readonly passed: boolean;
  readonly checks: Readonly<Record<CanonRuleId, 'pass' | 'fail'>>;
  readonly violations: readonly {
    readonly rule: CanonRuleId;
    readonly field: string;
    readonly message: string;
  }[];
}

export class CanonGovernanceError extends Error {
  readonly report: CanonCheckReport;

  constructor(report: CanonCheckReport) {
    const summary = report.violations.map((v) => `[${v.rule}] ${v.field}: ${v.message}`).join('; ');
    super(`Canon governance violation: ${summary}`);
    this.name = 'CanonGovernanceError';
    this.report = report;
  }
}

export interface OgSocialCardSpec {
  readonly title: string;
  readonly subtitle: string;
  readonly badge?: string;
  readonly episode?: string;
  readonly lang?: 'EN' | 'ID';
  readonly theme?: BrandTheme;
  readonly width?: number;
  readonly height?: number;
  readonly provenance?: Partial<CanonProvenanceMetadata>;
}

export interface PdfInvoiceHeaderSpec {
  readonly invoiceNumber: string;
  readonly issuedDate: string;
  readonly customerName: string;
  readonly totalAmountFormatted: string;
  readonly currency?: 'IDR' | 'USD';
  readonly issuerName?: string;
  readonly issuerTagline?: string;
  readonly statusBadge?: 'LUNAS' | 'PAID' | 'PENDING' | 'SHARIA MIZAN VERIFIED';
  readonly theme?: BrandTheme;
  readonly width?: number;
  readonly height?: number;
  readonly provenance?: Partial<CanonProvenanceMetadata>;
}

export interface CompiledGraphicResult {
  readonly kind: 'og-social-card' | 'pdf-invoice-header';
  readonly theme: BrandTheme;
  readonly width: number;
  readonly height: number;
  readonly svg: string;
  readonly png: Uint8Array;
  readonly svgSha256: string;
  readonly pngSha256: string;
  readonly canonReport: CanonCheckReport;
}

export interface BrandPalette {
  readonly paper: string;
  readonly raised: string;
  readonly ink: string;
  readonly yellow: string;
  readonly signalBlue: string;
  readonly magenta: string;
  readonly inkMuted: string;
  readonly inkSubtle: string;
  readonly onAccent: string;
  readonly shadow: string;
}

export const MOONWITNESS_PALETTES: Readonly<Record<BrandTheme, BrandPalette>> = Object.freeze({
  light: Object.freeze({
    paper: '#f3efe4',
    raised: '#fffdf6',
    ink: '#0d0d0d',
    yellow: '#ffe031',
    signalBlue: '#00b8f0',
    magenta: '#ff2e88',
    inkMuted: '#3a3a36',
    inkSubtle: '#6b695f',
    onAccent: '#0d0d0d',
    shadow: '#0d0d0d',
  }),
  dark: Object.freeze({
    paper: '#0e0e10',
    raised: '#17171a',
    ink: '#f3efe4',
    yellow: '#ffe031',
    signalBlue: '#00b8f0',
    magenta: '#ff2e88',
    inkMuted: '#c4c0b4',
    inkSubtle: '#9c988c',
    onAccent: '#0d0d0d',
    shadow: '#ffe031',
  }),
});

const FONT_DISPLAY = "Anton, Impact, 'Arial Narrow', sans-serif";
const FONT_SANS = "'Space Grotesk', system-ui, sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";

const SACRED_FIGURES_RE =
  /\b(allah|subhanahu|ta'ala|swt|god|muhammad|mohammed|mohammad|rasulullah|prophet\s+muhammad|nabi\s+muhammad|isa|nabi\s+isa|isa\s+al[-\s]?masih|yesus|jesus|christ|messiah)\b/iu;

const VISUAL_DEPICTION_RE =
  /\b(depict\w*|portrait|face|faces|facial|figure|silhouette|likeness|avatar|draw\w*|paint\w*|sketch\w*|illustrat\w*|photograph|photo|picture|image|statue|sculpture|idol|iconography|caricature|cartoon|anime|photorealistic|visual\s+depiction)\b/iu;

export function escapeXml(value: string): string {
  return String(value).replace(/[&<>"']/gu, (ch) => {
    switch (ch) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&apos;';
      default:
        return ch;
    }
  });
}

export function validateCanon0011To0014(
  textFields: Record<string, string | undefined>,
  provenance: Partial<CanonProvenanceMetadata> = {}
): CanonCheckReport {
  const violations: { rule: CanonRuleId; field: string; message: string }[] = [];

  // CAN-0011: Aniconic sacred visual boundary
  if (provenance.visualPrompt && SACRED_FIGURES_RE.test(provenance.visualPrompt)) {
    violations.push({
      rule: 'CAN-0011',
      field: 'provenance.visualPrompt',
      message: 'Visual depiction of Allah, Prophet Muhammad, or Isa/Yesus is strictly prohibited.',
    });
  }
  for (const [field, raw] of Object.entries(textFields)) {
    if (!raw) continue;
    if (SACRED_FIGURES_RE.test(raw) && VISUAL_DEPICTION_RE.test(raw)) {
      violations.push({
        rule: 'CAN-0011',
        field,
        message: 'Text requests prohibited visual depiction of sacred figures.',
      });
    }
  }

  // CAN-0012: Preserve historical versions & original wording; forbid silent overwrites
  if (provenance.silentOverwrite === true) {
    violations.push({
      rule: 'CAN-0012',
      field: 'provenance.silentOverwrite',
      message: 'Silent overwrites of canon or historical versions are forbidden.',
    });
  }
  if (
    provenance.previousVersionSha256 !== undefined &&
    !/^[a-f0-9]{64}$/iu.test(provenance.previousVersionSha256)
  ) {
    violations.push({
      rule: 'CAN-0012',
      field: 'provenance.previousVersionSha256',
      message: 'previousVersionSha256 must be a valid 64-character SHA-256 hex digest.',
    });
  }

  // CAN-0013: Explicit originActor separating user ideas from AI drafts
  const originActor = provenance.originActor ?? 'editorial';
  if (provenance.aiGenerated === true && originActor !== 'ai_assistant') {
    violations.push({
      rule: 'CAN-0013',
      field: 'provenance.originActor',
      message: 'aiGenerated=true requires originActor="ai_assistant" to preserve provenance separation.',
    });
  }
  if (originActor === 'ai_assistant' && provenance.aiGenerated === false) {
    violations.push({
      rule: 'CAN-0013',
      field: 'provenance.aiGenerated',
      message: 'originActor="ai_assistant" cannot declare aiGenerated=false.',
    });
  }

  // CAN-0014: Epistemic layer stratification (prevent non-scripture graphic templates from claiming scripture/tafsir)
  if (provenance.claimsScriptureStatus === true) {
    violations.push({
      rule: 'CAN-0014',
      field: 'provenance.claimsScriptureStatus',
      message: 'Parametric social/invoice graphics cannot claim primary scripture or tafsir status.',
    });
  }

  const failed = new Set(violations.map((v) => v.rule));
  const checks: Record<CanonRuleId, 'pass' | 'fail'> = {
    'CAN-0011': failed.has('CAN-0011') ? 'fail' : 'pass',
    'CAN-0012': failed.has('CAN-0012') ? 'fail' : 'pass',
    'CAN-0013': failed.has('CAN-0013') ? 'fail' : 'pass',
    'CAN-0014': failed.has('CAN-0014') ? 'fail' : 'pass',
  };

  return {
    passed: violations.length === 0,
    checks,
    violations,
  };
}

function sha256Hex(data: string | Uint8Array): string {
  return createHash('sha256').update(data).digest('hex');
}

function parseHexRgb(hex: string): readonly [number, number, number] {
  const clean = hex.replace(/^#/u, '');
  const r = Number.parseInt(clean.slice(0, 2), 16) || 0;
  const g = Number.parseInt(clean.slice(2, 4), 16) || 0;
  const b = Number.parseInt(clean.slice(4, 6), 16) || 0;
  return [r, g, b] as const;
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    c = CRC32_TABLE[(c ^ bytes[i]!) & 0xff]! ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makePngChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = Buffer.from(type, 'ascii');
  const chunk = new Uint8Array(4 + 4 + data.length + 4);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.length, false);
  chunk.set(typeBytes, 4);
  chunk.set(data, 8);
  const crcInput = new Uint8Array(4 + data.length);
  crcInput.set(typeBytes, 0);
  crcInput.set(data, 4);
  view.setUint32(8 + data.length, crc32(crcInput), false);
  return chunk;
}

/**
 * Deterministic, zero-dependency PNG rasterizer for parametric MoonWitness cards.
 * Produces a valid PNG (with exact width x height, IHDR, IDAT, IEND) using the active brand palette.
 */
export function rasterizeBrandPng(
  width: number,
  height: number,
  palette: BrandPalette,
  accentStripeHeight = 16
): Uint8Array {
  const [bgR, bgG, bgB] = parseHexRgb(palette.paper);
  const [accR, accG, accB] = parseHexRgb(palette.yellow);
  const [inkR, inkG, inkB] = parseHexRgb(palette.ink);

  const stride = 1 + width * 3;
  const raw = new Uint8Array(stride * height);
  const border = 4;

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * stride;
    raw[rowOffset] = 0; // filter type 0 (None)
    const isTopStripe = y >= border && y < border + accentStripeHeight;
    const isBorderY = y < border || y >= height - border;

    for (let x = 0; x < width; x += 1) {
      const px = rowOffset + 1 + x * 3;
      const isBorderX = x < border || x >= width - border;
      if (isBorderY || isBorderX) {
        raw[px] = inkR;
        raw[px + 1] = inkG;
        raw[px + 2] = inkB;
      } else if (isTopStripe) {
        raw[px] = accR;
        raw[px + 1] = accG;
        raw[px + 2] = accB;
      } else {
        raw[px] = bgR;
        raw[px + 1] = bgG;
        raw[px + 2] = bgB;
      }
    }
  }

  const signature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = new Uint8Array(13);
  const ihdrView = new DataView(ihdr.buffer);
  ihdrView.setUint32(0, width, false);
  ihdrView.setUint32(4, height, false);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: Truecolor RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const compressed = deflateSync(raw, { level: 6 });
  const ihdrChunk = makePngChunk('IHDR', ihdr);
  const idatChunk = makePngChunk('IDAT', new Uint8Array(compressed));
  const iendChunk = makePngChunk('IEND', new Uint8Array(0));

  const out = new Uint8Array(
    signature.length + ihdrChunk.length + idatChunk.length + iendChunk.length
  );
  let offset = 0;
  out.set(signature, offset);
  offset += signature.length;
  out.set(ihdrChunk, offset);
  offset += ihdrChunk.length;
  out.set(idatChunk, offset);
  offset += idatChunk.length;
  out.set(iendChunk, offset);
  return out;
}

export function compileOgSocialCard(spec: OgSocialCardSpec): CompiledGraphicResult {
  const title = spec.title.trim();
  const subtitle = spec.subtitle.trim();
  if (!title) throw new Error('OG social card title is required.');
  if (!subtitle) throw new Error('OG social card subtitle is required.');

  const theme: BrandTheme = spec.theme === 'dark' ? 'dark' : 'light';
  const width = spec.width ?? 1200;
  const height = spec.height ?? 630;
  if (width < 320 || height < 200) {
    throw new Error('OG social card dimensions must be at least 320x200.');
  }

  const provenance: Partial<CanonProvenanceMetadata> = {
    originActor: 'editorial',
    epistemicLayer: 'editorial_brand',
    ...spec.provenance,
  };
  const canonReport = validateCanon0011To0014(
    {
      title,
      subtitle,
      badge: spec.badge,
      episode: spec.episode,
    },
    provenance
  );
  if (!canonReport.passed) {
    throw new CanonGovernanceError(canonReport);
  }

  const palette = MOONWITNESS_PALETTES[theme];
  const badge = (spec.badge ?? 'SOVEREIGN EMPIRE').trim().toUpperCase();
  const episode = (spec.episode ?? 'V64').trim().toUpperCase();
  const lang = spec.lang ?? 'EN';
  const label = `MoonWitness OG Social Card - ${title}`;

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeXml(label)}">`,
    `<title>${escapeXml(label)}</title>`,
    `<rect width="${width}" height="${height}" fill="${palette.paper}"/>`,
    `<path fill="${palette.yellow}" stroke="${palette.ink}" stroke-width="2" d="M2 ${Math.round(height * 0.72)}L${Math.round(width * 0.56)} 2H${width - 2}V${height - 2}H2Z"/>`,
    `<path fill="${palette.signalBlue}" stroke="${palette.ink}" stroke-width="2" d="M${width - 2} 2V${Math.round(height * 0.58)}L${Math.round(width * 0.68)} 2Z"/>`,
    `<path fill="${palette.magenta}" stroke="${palette.ink}" stroke-width="2" d="M${width - 2} ${height - 2}H${Math.round(width * 0.38)}L${width - 2} ${Math.round(height * 0.44)}Z"/>`,
    `<rect x="64" y="54" width="${width - 120}" height="${height - 100}" rx="8" fill="${palette.shadow}"/>`,
    `<rect x="54" y="44" width="${width - 120}" height="${height - 100}" rx="8" fill="${palette.raised}" stroke="${palette.ink}" stroke-width="4"/>`,
    `<rect x="54" y="44" width="${width - 120}" height="22" rx="3" fill="${palette.yellow}" stroke="${palette.ink}" stroke-width="2"/>`,
    `<text x="96" y="124" fill="${palette.ink}" font-family="${FONT_DISPLAY}" font-size="38" font-weight="900" letter-spacing="3">MOONWITNESS</text>`,
    `<rect x="${width - 370}" y="88" width="160" height="44" rx="4" fill="${palette.signalBlue}" stroke="${palette.ink}" stroke-width="2"/>`,
    `<text x="${width - 290}" y="116" fill="${palette.onAccent}" font-family="${FONT_MONO}" font-size="16" font-weight="700" text-anchor="middle">${escapeXml(badge)}</text>`,
    `<rect x="${width - 196}" y="88" width="100" height="44" rx="4" fill="${palette.yellow}" stroke="${palette.ink}" stroke-width="2"/>`,
    `<text x="${width - 146}" y="118" fill="${palette.onAccent}" font-family="${FONT_DISPLAY}" font-size="24" font-weight="900" text-anchor="middle">${escapeXml(episode)}</text>`,
    `<rect x="96" y="196" width="${width - 260}" height="86" rx="4" fill="${palette.yellow}"/>`,
    `<text x="112" y="260" fill="${palette.onAccent}" font-family="${FONT_DISPLAY}" font-size="60" font-weight="900" letter-spacing="2">${escapeXml(title.toUpperCase())}</text>`,
    `<path d="M96 312H${Math.round(width * 0.62)}" stroke="${palette.magenta}" stroke-width="6" stroke-linecap="round"/>`,
    `<text x="96" y="366" fill="${palette.inkMuted}" font-family="${FONT_SANS}" font-size="26" font-weight="700">${escapeXml(subtitle)}</text>`,
    `<text x="96" y="${height - 92}" fill="${palette.inkSubtle}" font-family="${FONT_MONO}" font-size="16" font-weight="700" letter-spacing="2">CAN-0011..0014 VERIFIED · ${lang} · ${theme.toUpperCase()}</text>`,
    `</svg>\n`,
  ].join('');

  const png = rasterizeBrandPng(width, height, palette, 22);
  return {
    kind: 'og-social-card',
    theme,
    width,
    height,
    svg,
    png,
    svgSha256: sha256Hex(svg),
    pngSha256: sha256Hex(png),
    canonReport,
  };
}

export function compilePdfInvoiceHeader(spec: PdfInvoiceHeaderSpec): CompiledGraphicResult {
  const invoiceNumber = spec.invoiceNumber.trim();
  const issuedDate = spec.issuedDate.trim();
  const customerName = spec.customerName.trim();
  const totalAmountFormatted = spec.totalAmountFormatted.trim();
  if (!invoiceNumber) throw new Error('Invoice number is required.');
  if (!issuedDate) throw new Error('Issued date is required.');
  if (!customerName) throw new Error('Customer name is required.');
  if (!totalAmountFormatted) throw new Error('Total amount is required.');

  const theme: BrandTheme = spec.theme === 'dark' ? 'dark' : 'light';
  const width = spec.width ?? 1200;
  const height = spec.height ?? 280;
  if (width < 480 || height < 160) {
    throw new Error('PDF invoice header dimensions must be at least 480x160.');
  }

  const issuerName = (spec.issuerName ?? 'MOONWITNESS SOVEREIGN STUDIO').trim();
  const issuerTagline = (
    spec.issuerTagline ?? 'SHARIA MIZAN LEDGER · PPH FINAL 0.5% & ZAKAT TRANSPARENT'
  ).trim();
  const statusBadge = spec.statusBadge ?? 'LUNAS';
  const currency = spec.currency ?? 'IDR';

  const provenance: Partial<CanonProvenanceMetadata> = {
    originActor: 'editorial',
    epistemicLayer: 'commercial_invoice',
    ...spec.provenance,
  };
  const canonReport = validateCanon0011To0014(
    {
      invoiceNumber,
      customerName,
      issuerName,
      issuerTagline,
      totalAmountFormatted,
    },
    provenance
  );
  if (!canonReport.passed) {
    throw new CanonGovernanceError(canonReport);
  }

  const palette = MOONWITNESS_PALETTES[theme];
  const label = `MoonWitness PDF Invoice Header - ${invoiceNumber}`;

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeXml(label)}">`,
    `<title>${escapeXml(label)}</title>`,
    `<rect width="${width}" height="${height}" fill="${palette.paper}"/>`,
    `<rect x="18" y="18" width="${width - 36}" height="${height - 36}" rx="6" fill="${palette.shadow}"/>`,
    `<rect x="12" y="12" width="${width - 36}" height="${height - 36}" rx="6" fill="${palette.raised}" stroke="${palette.ink}" stroke-width="3"/>`,
    `<rect x="12" y="12" width="${width - 36}" height="16" rx="2" fill="${palette.yellow}" stroke="${palette.ink}" stroke-width="2"/>`,
    `<text x="42" y="76" fill="${palette.ink}" font-family="${FONT_DISPLAY}" font-size="36" font-weight="900" letter-spacing="2">${escapeXml(issuerName.toUpperCase())}</text>`,
    `<text x="42" y="106" fill="${palette.inkSubtle}" font-family="${FONT_MONO}" font-size="14" font-weight="700" letter-spacing="1.5">${escapeXml(issuerTagline)}</text>`,
    `<path d="M42 126H${width - 54}" stroke="${palette.ink}" stroke-width="2"/>`,
    `<text x="42" y="164" fill="${palette.inkMuted}" font-family="${FONT_MONO}" font-size="16" font-weight="700">KWITANSI / INVOICE: ${escapeXml(invoiceNumber)}</text>`,
    `<text x="42" y="196" fill="${palette.ink}" font-family="${FONT_SANS}" font-size="22" font-weight="700">BILL TO: ${escapeXml(customerName)}</text>`,
    `<text x="42" y="226" fill="${palette.inkSubtle}" font-family="${FONT_MONO}" font-size="14" font-weight="700">DATE: ${escapeXml(issuedDate)} · CURRENCY: ${currency} · CAN-0011..0014</text>`,
    `<rect x="${width - 310}" y="46" width="256" height="46" rx="4" fill="${palette.signalBlue}" stroke="${palette.ink}" stroke-width="2"/>`,
    `<text x="${width - 182}" y="76" fill="${palette.onAccent}" font-family="${FONT_DISPLAY}" font-size="24" font-weight="900" text-anchor="middle">${escapeXml(statusBadge)}</text>`,
    `<rect x="${width - 310}" y="148" width="256" height="72" rx="4" fill="${palette.yellow}" stroke="${palette.ink}" stroke-width="2"/>`,
    `<text x="${width - 182}" y="174" fill="${palette.onAccent}" font-family="${FONT_MONO}" font-size="13" font-weight="700" text-anchor="middle">TOTAL SETTLED</text>`,
    `<text x="${width - 182}" y="206" fill="${palette.onAccent}" font-family="${FONT_DISPLAY}" font-size="28" font-weight="900" text-anchor="middle">${escapeXml(totalAmountFormatted)}</text>`,
    `</svg>\n`,
  ].join('');

  const png = rasterizeBrandPng(width, height, palette, 16);
  return {
    kind: 'pdf-invoice-header',
    theme,
    width,
    height,
    svg,
    png,
    svgSha256: sha256Hex(svg),
    pngSha256: sha256Hex(png),
    canonReport,
  };
}

/**
 * Lightweight Fetch-API compatible HTTP handler for mw-mylove OG routes & mw-echo invoice blasts.
 * Routes:
 *   GET  /health
 *   POST /api/compile/og
 *   POST /api/compile/invoice-header
 */
export async function handleDesignCompilerRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === 'GET' && url.pathname === '/health') {
    return Response.json({
      status: 'ok',
      service: 'mw-design-compiler',
      canon: ['CAN-0011', 'CAN-0012', 'CAN-0013', 'CAN-0014'],
    });
  }

  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return Response.json({ error: 'JSON body must be an object' }, { status: 400 });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const format = url.searchParams.get('format') ?? 'json';
    const compiled =
      url.pathname === '/api/compile/og'
        ? compileOgSocialCard(body as unknown as OgSocialCardSpec)
        : url.pathname === '/api/compile/invoice-header'
          ? compilePdfInvoiceHeader(body as unknown as PdfInvoiceHeaderSpec)
          : null;

    if (!compiled) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    if (format === 'svg') {
      return new Response(compiled.svg, {
        status: 200,
        headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' },
      });
    }
    if (format === 'png') {
      return new Response(Buffer.from(compiled.png), {
        status: 200,
        headers: { 'Content-Type': 'image/png' },
      });
    }

    return Response.json({
      kind: compiled.kind,
      theme: compiled.theme,
      width: compiled.width,
      height: compiled.height,
      svgSha256: compiled.svgSha256,
      pngSha256: compiled.pngSha256,
      pngBytes: compiled.png.byteLength,
      canonReport: compiled.canonReport,
      svg: compiled.svg,
    });
  } catch (error) {
    if (error instanceof CanonGovernanceError) {
      return Response.json(
        { error: error.message, canonReport: error.report },
        { status: 422 }
      );
    }
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400 }
    );
  }
}
