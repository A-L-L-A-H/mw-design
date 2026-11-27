export type AuditSeverity = 'pass' | 'warn' | 'fail';

export interface AriaCheckItem {
  id: string;
  elementLabel: string;
  accessibleName: string;
  detail: string;
  status: AuditSeverity;
}

export interface ContrastCheckItem {
  id: string;
  label: string;
  foreground: string;
  background: string;
  ratio: number;
  level: 'AAA' | 'AA' | 'FAIL';
  isLargeText: boolean;
  status: AuditSeverity;
}

export interface FocusStopItem {
  order: number;
  elementLabel: string;
  accessibleName: string;
  tabIndex: number;
  warning?: string;
  element: HTMLElement;
}

export interface A11yAuditReport {
  status: AuditSeverity;
  ariaChecks: AriaCheckItem[];
  contrastChecks: ContrastCheckItem[];
  focusOrder: FocusStopItem[];
  focusSummary: string;
  counts: {
    pass: number;
    warn: number;
    fail: number;
  };
}

interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

const INTERACTIVE_SELECTOR = [
  'button',
  'a[href]',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  '[role="button"]',
  '[role="link"]',
  '[role="checkbox"]',
  '[role="switch"]',
  '[role="radio"]',
  '[role="progressbar"]',
  '[role="alert"]',
  '[role="status"]',
].join(', ');

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not(:disabled)',
  'input:not(:disabled):not([type="hidden"])',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function parseCssColor(raw: string | null | undefined): RgbaColor | null {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed || trimmed === 'transparent') {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  // rgb(r, g, b) / rgba(r, g, b, a) / rgb(r g b / a)
  const rgbMatch = trimmed.match(
    /^rgba?\(\s*([\d.]+)\s*[,\s]\s*([\d.]+)\s*[,\s]\s*([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/
  );
  if (rgbMatch) {
    const r = Math.min(255, Math.max(0, Number(rgbMatch[1])));
    const g = Math.min(255, Math.max(0, Number(rgbMatch[2])));
    const b = Math.min(255, Math.max(0, Number(rgbMatch[3])));
    let a = 1;
    if (rgbMatch[4] !== undefined) {
      a = rgbMatch[4].endsWith('%')
        ? Number(rgbMatch[4].slice(0, -1)) / 100
        : Number(rgbMatch[4]);
    }
    return { r, g, b, a: Math.min(1, Math.max(0, a)) };
  }

  // color(srgb r g b / a)
  const srgbMatch = trimmed.match(
    /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\)$/
  );
  if (srgbMatch) {
    const r = Math.round(Math.min(1, Math.max(0, Number(srgbMatch[1]))) * 255);
    const g = Math.round(Math.min(1, Math.max(0, Number(srgbMatch[2]))) * 255);
    const b = Math.round(Math.min(1, Math.max(0, Number(srgbMatch[3]))) * 255);
    let a = 1;
    if (srgbMatch[4] !== undefined) {
      a = srgbMatch[4].endsWith('%')
        ? Number(srgbMatch[4].slice(0, -1)) / 100
        : Number(srgbMatch[4]);
    }
    return { r, g, b, a: Math.min(1, Math.max(0, a)) };
  }

  // Hex #rgb / #rrggbb
  const hexMatch = trimmed.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (hexMatch) {
    const hex = hexMatch[1];
    const full =
      hex.length === 3 ? hex.split('').map((ch) => ch + ch).join('') : hex;
    return {
      r: Number.parseInt(full.slice(0, 2), 16),
      g: Number.parseInt(full.slice(2, 4), 16),
      b: Number.parseInt(full.slice(4, 6), 16),
      a: 1,
    };
  }

  return null;
}

function compositeOver(fg: RgbaColor, bg: RgbaColor): RgbaColor {
  const alpha = fg.a + bg.a * (1 - fg.a);
  if (alpha === 0) return { r: 0, g: 0, b: 0, a: 0 };
  return {
    r: Math.round((fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / alpha),
    g: Math.round((fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / alpha),
    b: Math.round((fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / alpha),
    a: alpha,
  };
}

function relativeLuminance({ r, g, b }: RgbaColor): number {
  const linearize = (channel: number) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

export function computeContrastRatio(fg: RgbaColor, bg: RgbaColor): number {
  const effectiveFg = fg.a < 1 ? compositeOver(fg, bg) : fg;
  const l1 = relativeLuminance(effectiveFg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

function formatHex({ r, g, b }: RgbaColor): string {
  const toHex = (value: number) => value.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function isHiddenFromA11y(el: HTMLElement): boolean {
  if (el.closest('[aria-hidden="true"]')) return true;
  if (el.hasAttribute('hidden')) return true;
  const style = window.getComputedStyle(el);
  return style.display === 'none' || style.visibility === 'hidden';
}

export function getAccessibleName(el: HTMLElement, root: HTMLElement): string {
  const ariaLabel = el.getAttribute('aria-label')?.trim();
  if (ariaLabel) return ariaLabel;

  const labelledBy = el.getAttribute('aria-labelledby')?.trim();
  if (labelledBy) {
    const parts = labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
      .filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
  }

  if (el.id) {
    const escapedId = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(el.id) : el.id;
    const explicitLabel =
      root.querySelector<HTMLLabelElement>(`label[for="${escapedId}"]`) ??
      document.querySelector<HTMLLabelElement>(`label[for="${escapedId}"]`);
    const labelText = explicitLabel?.textContent?.trim();
    if (labelText) return labelText;
  }

  const wrappingLabel = el.closest('label');
  if (wrappingLabel && root.contains(wrappingLabel)) {
    const clone = wrappingLabel.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('input, select, textarea').forEach((node) => node.remove());
    const text = clone.textContent?.trim();
    if (text) return text;
  }

  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    const placeholder = el.placeholder?.trim();
    if (placeholder) return placeholder;
  }

  const title = el.getAttribute('title')?.trim();
  if (title) return title;

  return el.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

function describeElement(el: HTMLElement): string {
  const role = el.getAttribute('role');
  const tag = el.tagName.toLowerCase();
  return role ? `<${tag} role="${role}">` : `<${tag}>`;
}

function resolveEffectiveBackground(el: HTMLElement): RgbaColor | null {
  const layers: RgbaColor[] = [];
  let current: HTMLElement | null = el;
  while (current) {
    const parsed = parseCssColor(window.getComputedStyle(current).backgroundColor);
    if (parsed && parsed.a > 0) {
      layers.push(parsed);
      if (parsed.a >= 0.999) break;
    }
    current = current.parentElement;
  }

  if (layers.length === 0) return null;
  // Composite from bottom-most layer upward
  let acc = layers[layers.length - 1];
  for (let i = layers.length - 2; i >= 0; i -= 1) {
    acc = compositeOver(layers[i], acc);
  }
  return acc;
}

function isLargeTextStyle(style: CSSStyleDeclaration): boolean {
  const sizePx = Number.parseFloat(style.fontSize);
  const weight = Number.parseInt(style.fontWeight, 10) || (style.fontWeight === 'bold' ? 700 : 400);
  if (Number.isNaN(sizePx)) return false;
  return sizePx >= 24 || (sizePx >= 18.66 && weight >= 700);
}

export function auditElementAccessibility(container: HTMLElement | null): A11yAuditReport {
  if (!container || typeof window === 'undefined') {
    return {
      status: 'pass',
      ariaChecks: [],
      contrastChecks: [],
      focusOrder: [],
      focusSummary: 'No preview mounted',
      counts: { pass: 0, warn: 0, fail: 0 },
    };
  }

  const ariaChecks: AriaCheckItem[] = [];
  const contrastChecks: ContrastCheckItem[] = [];
  const focusOrder: FocusStopItem[] = [];

  // 1. ARIA & Accessible Name Audit
  const interactiveElements = Array.from(
    container.querySelectorAll<HTMLElement>(INTERACTIVE_SELECTOR)
  ).filter((el) => !isHiddenFromA11y(el) && !el.classList.contains('catalog-playground-status'));

  interactiveElements.forEach((el, index) => {
    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute('role');
    const name = getAccessibleName(el, container);
    const label = describeElement(el);
    const id = `aria-${index}-${tag}`;

    const isFormControl = tag === 'input' || tag === 'select' || tag === 'textarea';
    const hasExplicitLabel =
      Boolean(el.getAttribute('aria-label')?.trim()) ||
      Boolean(el.getAttribute('aria-labelledby')?.trim()) ||
      Boolean(el.id && document.querySelector(`label[for="${el.id}"]`)) ||
      Boolean(el.closest('label'));

    if (!name) {
      ariaChecks.push({
        id,
        elementLabel: label,
        accessibleName: '(missing)',
        detail: 'Missing accessible name (add visible text, aria-label, or associated label).',
        status: 'fail',
      });
      return;
    }

    if (isFormControl && !hasExplicitLabel) {
      ariaChecks.push({
        id,
        elementLabel: label,
        accessibleName: name,
        detail: 'Relies only on placeholder/title — associate a <label> or aria-label.',
        status: 'warn',
      });
      return;
    }

    if (role === 'progressbar') {
      const hasAriaLabel =
        Boolean(el.getAttribute('aria-label')?.trim()) ||
        Boolean(el.getAttribute('aria-labelledby')?.trim());
      if (!hasAriaLabel) {
        ariaChecks.push({
          id,
          elementLabel: label,
          accessibleName: name,
          detail: 'Progressbar should expose aria-label or aria-labelledby.',
          status: 'fail',
        });
        return;
      }
      const valueNow = el.getAttribute('aria-valuenow');
      ariaChecks.push({
        id,
        elementLabel: label,
        accessibleName: name,
        detail:
          valueNow !== null
            ? `Named "${name}" (aria-valuenow=${valueNow}).`
            : `Named "${name}" (indeterminate).`,
        status: 'pass',
      });
      return;
    }

    if (el.getAttribute('aria-invalid') === 'true' && !el.getAttribute('aria-describedby')) {
      ariaChecks.push({
        id,
        elementLabel: label,
        accessibleName: name,
        detail: 'aria-invalid="true" without aria-describedby error message link.',
        status: 'warn',
      });
      return;
    }

    const extraNotes: string[] = [];
    if (el.getAttribute('aria-busy') === 'true') extraNotes.push('aria-busy');
    if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') {
      extraNotes.push('disabled');
    }

    ariaChecks.push({
      id,
      elementLabel: label,
      accessibleName: name,
      detail:
        extraNotes.length > 0
          ? `Named "${name}" (${extraNotes.join(', ')}).`
          : `Named "${name}".`,
      status: 'pass',
    });
  });

  if (ariaChecks.length === 0) {
    ariaChecks.push({
      id: 'aria-static',
      elementLabel: 'Preview',
      accessibleName: container.textContent?.trim().slice(0, 32) || 'Static specimen',
      detail: 'Non-interactive decorative/display component — no missing control labels.',
      status: 'pass',
    });
  }

  // 2. Contrast Ratio Audit
  const seenPairs = new Set<string>();
  const textCandidates = Array.from(container.querySelectorAll<HTMLElement>('*')).filter((el) => {
    if (isHiddenFromA11y(el)) return false;
    if (el.classList.contains('catalog-playground-status')) return false;
    const directText = Array.from(el.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent?.trim() ?? '')
      .join('');
    return directText.length > 0;
  });

  textCandidates.forEach((el, index) => {
    const style = window.getComputedStyle(el);
    const fg = parseCssColor(style.color);
    const bg = resolveEffectiveBackground(el);
    if (!fg || !bg || fg.a === 0 || bg.a === 0) return;

    const fgHex = formatHex(fg.a < 1 ? compositeOver(fg, bg) : fg);
    const bgHex = formatHex(bg);
    const isLarge = isLargeTextStyle(style);
    const sampleLabel =
      el.getAttribute('data-slot') ||
      el.tagName.toLowerCase();
    const dedupeKey = `${sampleLabel}:${fgHex}:${bgHex}:${isLarge}`;
    if (seenPairs.has(dedupeKey)) return;
    seenPairs.add(dedupeKey);

    const ratio = computeContrastRatio(fg, bg);
    const aaMin = isLarge ? 3.0 : 4.5;
    const aaaMin = isLarge ? 4.5 : 7.0;
    const level: ContrastCheckItem['level'] =
      ratio >= aaaMin ? 'AAA' : ratio >= aaMin ? 'AA' : 'FAIL';
    const status: AuditSeverity = level === 'FAIL' ? 'fail' : 'pass';

    contrastChecks.push({
      id: `contrast-${index}`,
      label: sampleLabel,
      foreground: fgHex,
      background: bgHex,
      ratio,
      level,
      isLargeText: isLarge,
      status,
    });
  });

  // 3. Focus Order Audit
  const rawFocusable = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).filter((el) => !isHiddenFromA11y(el));

  const sortedFocusable = rawFocusable
    .map((el, domIndex) => {
      const attr = el.getAttribute('tabindex');
      const tabIndex = attr !== null ? Number.parseInt(attr, 10) : 0;
      return { el, domIndex, tabIndex: Number.isNaN(tabIndex) ? 0 : tabIndex };
    })
    .sort((a, b) => {
      const aPositive = a.tabIndex > 0;
      const bPositive = b.tabIndex > 0;
      if (aPositive && bPositive) {
        return a.tabIndex - b.tabIndex || a.domIndex - b.domIndex;
      }
      if (aPositive) return -1;
      if (bPositive) return 1;
      return a.domIndex - b.domIndex;
    });

  sortedFocusable.forEach(({ el, tabIndex }, idx) => {
    const accessibleName = getAccessibleName(el, container) || '(unlabeled)';
    focusOrder.push({
      order: idx + 1,
      elementLabel: describeElement(el),
      accessibleName,
      tabIndex,
      warning:
        tabIndex > 0
          ? `Positive tabIndex="${tabIndex}" overrides natural DOM focus order.`
          : undefined,
      element: el,
    });
  });

  const hasDisabledControls = container.querySelector(':disabled, [aria-disabled="true"]') !== null;
  const focusSummary =
    focusOrder.length > 0
      ? `${focusOrder.length} keyboard tab ${focusOrder.length === 1 ? 'stop' : 'stops'} in order`
      : hasDisabledControls
        ? '0 active tab stops (control disabled)'
        : '0 tab stops (static display component)';

  // Aggregate counts
  let pass = 0;
  let warn = 0;
  let fail = 0;

  for (const item of ariaChecks) {
    if (item.status === 'fail') fail += 1;
    else if (item.status === 'warn') warn += 1;
    else pass += 1;
  }
  for (const item of contrastChecks) {
    if (item.status === 'fail') fail += 1;
    else if (item.status === 'warn') warn += 1;
    else pass += 1;
  }
  for (const stop of focusOrder) {
    if (stop.warning) warn += 1;
    else pass += 1;
  }

  const status: AuditSeverity = fail > 0 ? 'fail' : warn > 0 ? 'warn' : 'pass';

  return {
    status,
    ariaChecks,
    contrastChecks,
    focusOrder,
    focusSummary,
    counts: { pass, warn, fail },
  };
}
