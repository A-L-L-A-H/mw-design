'use client';

import { useState } from 'react';
import { Button, type ButtonSize, type ButtonVariant } from './button.js';
import { Popover, PopoverContent, PopoverTrigger } from './popover.js';
import { Switch } from './switch.js';
import { useTheme } from '../themes/provider.js';
import type { SkinDensity, ThemeMode } from '../themes/types.js';

export interface AppearanceToggleItem {
  readonly id: string;
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}

export interface AppearanceMenuProps {
  readonly mode?: ThemeMode;
  readonly onModeChange?: (mode: ThemeMode) => void;
  readonly density?: SkinDensity;
  readonly onDensityChange?: (density: SkinDensity) => void;
  readonly toggles?: readonly AppearanceToggleItem[];
  readonly buttonSize?: ButtonSize;
  readonly buttonVariant?: ButtonVariant;
  readonly align?: 'start' | 'center' | 'end';
  readonly ariaLabel?: string;
}

function useOptionalTheme() {
  try {
    return useTheme();
  } catch {
    return null;
  }
}

export function AppearanceMenu({
  mode: controlledMode,
  onModeChange,
  density: controlledDensity,
  onDensityChange,
  toggles = [],
  buttonSize = 'icon-sm',
  buttonVariant = 'outline',
  align = 'end',
  ariaLabel = 'Display & theme preferences',
}: AppearanceMenuProps) {
  const theme = useOptionalTheme();
  const [localMode, setLocalMode] = useState<ThemeMode>('light');
  const [localDensity, setLocalDensity] = useState<SkinDensity>('comfortable');

  const activeMode = controlledMode ?? theme?.mode ?? localMode;
  const activeDensity = controlledDensity ?? theme?.density ?? localDensity;

  const handleMode = (next: ThemeMode) => {
    if (onModeChange) onModeChange(next);
    else if (theme) theme.setMode(next);
    else {
      setLocalMode(next);
      if (typeof document !== 'undefined') {
        document.documentElement.dataset.theme = next;
        document.documentElement.classList.toggle('dark', next === 'dark');
        document.documentElement.classList.toggle('high-contrast', next === 'high-contrast');
      }
    }
  };

  const handleDensity = (next: SkinDensity) => {
    if (onDensityChange) onDensityChange(next);
    else if (theme) theme.setDensity(next);
    else {
      setLocalDensity(next);
      if (typeof document !== 'undefined') {
        document.documentElement.dataset.density = next;
      }
    }
  };

  const modes: readonly { id: ThemeMode; label: string }[] = [
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
    { id: 'high-contrast', label: 'Contrast' },
  ];

  const densities: readonly { id: SkinDensity; label: string }[] = [
    { id: 'comfortable', label: 'Comfort' },
    { id: 'compact', label: 'Compact' },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" size={buttonSize} variant={buttonVariant} aria-label={ariaLabel} title={ariaLabel}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <line x1="4" y1="6" x2="20" y2="6" />
            <circle cx="9" cy="6" r="2" fill="currentColor" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <circle cx="15" cy="12" r="2" fill="currentColor" />
            <line x1="4" y1="18" x2="20" y2="18" />
            <circle cx="11" cy="18" r="2" fill="currentColor" />
          </svg>
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="mw-ui-appearance-popover">
        <div>
          <div className="mw-ui-appearance-heading">Theme</div>
          <div className="mw-ui-appearance-grid" data-cols="3">
            {modes.map((m) => (
              <Button
                key={m.id}
                type="button"
                size="xs"
                variant={activeMode === m.id ? 'default' : 'outline'}
                onClick={() => handleMode(m.id)}
              >
                {m.label}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <div className="mw-ui-appearance-heading">Density</div>
          <div className="mw-ui-appearance-grid" data-cols="2">
            {densities.map((d) => (
              <Button
                key={d.id}
                type="button"
                size="xs"
                variant={activeDensity === d.id ? 'default' : 'outline'}
                onClick={() => handleDensity(d.id)}
              >
                {d.label}
              </Button>
            ))}
          </div>
        </div>

        {toggles.length > 0 && (
          <div className="mw-ui-appearance-toggles">
            {toggles.map((t) => (
              <label key={t.id} className="mw-ui-appearance-toggle">
                <span>{t.label}</span>
                <Switch checked={t.checked} onCheckedChange={t.onChange} />
              </label>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
