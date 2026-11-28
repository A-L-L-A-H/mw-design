'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import { cn } from '../lib/cn.js';

export type XvBadgeTone = 'yellow' | 'magenta' | 'cyan' | 'ok' | 'err' | 'cream' | 'neutral';
export type XvToastTone = 'ok' | 'err' | 'info';

const toneClass: Record<XvBadgeTone, string> = {
  yellow: 'mw-ui-xv-tone-yellow', magenta: 'mw-ui-xv-tone-magenta', cyan: 'mw-ui-xv-tone-cyan',
  ok: 'mw-ui-xv-tone-ok', err: 'mw-ui-xv-tone-err', cream: 'mw-ui-xv-tone-cream', neutral: 'mw-ui-xv-tone-neutral',
};

export function MonoBadge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: XvBadgeTone; className?: string }) {
  return <span className={cn('mw-ui-xv-mono-badge', toneClass[tone], className)}>{children}</span>;
}

export function ComicSticker({ children, tone = 'cream', tilt = '-2deg', className }: { children: ReactNode; tone?: XvBadgeTone; tilt?: string; className?: string }) {
  return <span className={cn('mw-ui-xv-comic-sticker', toneClass[tone], className)} style={{ '--mw-xv-tilt': tilt } as CSSProperties}>{children}</span>;
}

export interface StatTileProps { label: string; value: string | number; sublabel?: string; icon: ReactNode; tone?: XvBadgeTone; className?: string }
export function StatTile({ label, value, sublabel, icon, tone = 'yellow', className }: StatTileProps) {
  return <article className={cn('mw-ui-xv-stat-tile', toneClass[tone], className)}><header><span>{label}</span><span aria-hidden="true">{icon}</span></header><strong>{value}</strong>{sublabel ? <small>{sublabel}</small> : null}</article>;
}

export interface StageHeroBannerProps { sceneCode: string; sticker: string; title: string; subtitle: string; tone?: XvBadgeTone; actions?: ReactNode; className?: string }
export function StageHeroBanner({ sceneCode, sticker, title, subtitle, tone = 'yellow', actions, className }: StageHeroBannerProps) {
  return <section className={cn('mw-ui-xv-stage-hero', className)}><div className="mw-ui-xv-stage-hero-content"><div><div className="mw-ui-xv-stage-hero-labels"><MonoBadge tone="cream">{sceneCode}</MonoBadge><ComicSticker tone={tone}>{sticker}</ComicSticker></div><h1>{title}</h1><p>{subtitle}</p></div>{actions ? <div className="mw-ui-xv-actions">{actions}</div> : null}</div><div className="mw-ui-xv-hazard" /></section>;
}

export interface SectionCardProps { title: string; subtitle?: string; icon?: ReactNode; sticker?: string; stickerTone?: XvBadgeTone; accent?: XvBadgeTone; actions?: ReactNode; children: ReactNode; className?: string }
export function SectionCard({ title, subtitle, icon, sticker, stickerTone = 'yellow', accent = 'neutral', actions, children, className }: SectionCardProps) {
  return <section className={cn('mw-ui-xv-section-card', toneClass[accent], className)}><header><div className="mw-ui-xv-section-heading">{icon ? <span className="mw-ui-xv-section-icon">{icon}</span> : null}<div><div className="mw-ui-xv-section-title"><h2>{title}</h2>{sticker ? <ComicSticker tone={stickerTone}>{sticker}</ComicSticker> : null}</div>{subtitle ? <p>{subtitle}</p> : null}</div></div>{actions ? <div className="mw-ui-xv-actions">{actions}</div> : null}</header><div className="mw-ui-xv-section-body">{children}</div></section>;
}

export function CopyableSnippet({ label, value, tone = 'cyan', className }: { label: string; value: string; tone?: XvBadgeTone; className?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() { try { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { setCopied(false); } }
  return <div className={cn('mw-ui-xv-copyable', className)}><div><MonoBadge tone={tone}>{label}</MonoBadge><code>{value}</code></div><button type="button" onClick={copy}>{copied ? 'GOT IT!' : 'COPY'}</button></div>;
}

export interface ToastNotice { id: number; tone: XvToastTone; message: string }
export function ToastStack({ notices, onDismiss, className }: { notices: ToastNotice[]; onDismiss: (id: number) => void; className?: string }) {
  if (!notices.length) return null;
  return <div className={cn('mw-ui-xv-toast-stack', className)}>{notices.map((notice) => <div key={notice.id} className={cn('mw-ui-xv-toast', toneClass[notice.tone === 'info' ? 'yellow' : notice.tone])} role="status"><span>{notice.tone === 'err' ? '!' : notice.tone === 'ok' ? '✓' : 'i'}</span><span>{notice.message}</span><button type="button" onClick={() => onDismiss(notice.id)} aria-label="Dismiss notification">×</button></div>)}</div>;
}
