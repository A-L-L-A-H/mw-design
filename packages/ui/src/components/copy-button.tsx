'use client';

import { forwardRef, useEffect, useRef, useState } from 'react';
import { Button, type ButtonProps } from './button.js';

export type CopyButtonProps = Omit<ButtonProps, 'onClick' | 'value'> & {
  value: string | (() => string);
  label?: string;
  copiedLabel?: string;
  timeoutMs?: number;
  onCopied?: (copiedValue: string) => void;
};

async function writeClipboardText(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below when Clipboard API is restricted.
    }
  }
  if (typeof document === 'undefined') return false;
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';
  document.body.appendChild(textarea);
  textarea.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  } finally {
    document.body.removeChild(textarea);
  }
  return ok;
}

export const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(function CopyButton(
  {
    value,
    label = 'Copy',
    copiedLabel = 'Copied',
    timeoutMs = 2000,
    onCopied,
    variant = 'outline',
    size = 'sm',
    className,
    children,
    ...props
  },
  ref
) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  async function handleCopy() {
    const text = typeof value === 'function' ? value() : value;
    const ok = await writeClipboardText(text);
    if (!ok) return;
    setCopied(true);
    onCopied?.(text);
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setCopied(false);
      timerRef.current = null;
    }, timeoutMs);
  }

  return (
    <Button
      ref={ref}
      type="button"
      variant={variant}
      size={size}
      data-slot="copy-button"
      data-copied={copied ? 'true' : 'false'}
      className={['mw-ui-copy-button', className].filter(Boolean).join(' ')}
      onClick={handleCopy}
      {...props}
    >
      {copied ? (
        <svg
          className="mw-ui-copy-icon"
          viewBox="0 0 16 16"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3.2 8.4 6.5 11.7 12.8 4.8" />
        </svg>
      ) : (
        <svg
          className="mw-ui-copy-icon"
          viewBox="0 0 16 16"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="5.5" y="5.5" width="8" height="8" rx="1" />
          <path d="M10.5 5.5V3.5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" />
        </svg>
      )}
      <span>{children ?? (copied ? copiedLabel : label)}</span>
    </Button>
  );
});

CopyButton.displayName = 'CopyButton';
