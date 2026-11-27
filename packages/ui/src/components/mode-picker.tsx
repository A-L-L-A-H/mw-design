'use client';

import { type ComponentProps } from 'react';
import { Badge } from './badge.js';
import { Button } from './button.js';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from './dialog.js';
import { CheckCircleIcon, CloseIcon, CodeIcon, ColumnsIcon, SparkleIcon } from '../icons/index.js';

export type DesktopExperienceMode = 'workspace' | 'developer';

export type ModePickerProps = Omit<ComponentProps<'div'>, 'children' | 'onSelect'> & {
  currentMode?: DesktopExperienceMode;
  onSelect: (mode: DesktopExperienceMode) => void;
  onDismiss?: () => void;
  title?: string;
  description?: string;
};

interface ModeOption {
  id: DesktopExperienceMode;
  label: string;
  subtitle: string;
  badge: string;
  badgeVariant: 'primary' | 'cyan';
  highlights: readonly string[];
}

const MODE_OPTIONS: readonly ModeOption[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    subtitle: 'User Biasa · Focus & Productivity',
    badge: 'Recommended for daily work',
    badgeVariant: 'primary',
    highlights: [
      'Tasks & Kanban board',
      'Knowledge & Notes',
      'Stories & Workbench',
      'Offline-first, zero technical clutter',
    ],
  },
  {
    id: 'developer',
    label: 'DX / Developer',
    subtitle: 'Codex / Agent Harness',
    badge: 'Full Engineering Suite',
    badgeVariant: 'cyan',
    highlights: [
      'Full AI Mission Control',
      'Git Worktrees & Bounded PTY',
      'MCP Server & VPS Mesh Fleet',
      'Model Explorer & Dev Mode',
    ],
  },
];

export function ModePicker({
  currentMode,
  onSelect,
  onDismiss,
  title = 'Choose Your Desktop Experience',
  description = 'Pick the workspace layout that fits your workflow. You can switch anytime in the sidebar or Settings.',
  className,
  ...props
}: ModePickerProps) {
  return (
    <Dialog
      open
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onDismiss?.();
      }}
    >
      <DialogContent
        data-slot="mode-picker"
        aria-modal="true"
        className={['mw-ui-mode-picker', className].filter(Boolean).join(' ')}
        showCloseButton={false}
        onEscapeKeyDown={(event) => {
          if (!onDismiss) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (!onDismiss) event.preventDefault();
        }}
        {...props}
      >
        <div className="mw-ui-mode-picker-inner">
          <div className="mw-ui-mode-picker-header">
            <div className="mw-ui-mode-picker-heading">
              <p className="mw-ui-mode-picker-kicker">MoonWitness Desktop</p>
              <DialogTitle className="mw-ui-mode-picker-title">{title}</DialogTitle>
              <DialogDescription className="mw-ui-mode-picker-description">
                {description}
              </DialogDescription>
            </div>
            {onDismiss ? (
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Close mode selector"
                >
                  <CloseIcon className="mw-ui-mode-picker-close-icon" aria-hidden="true" />
                </Button>
              </DialogClose>
            ) : null}
          </div>

          <div className="mw-ui-mode-picker-grid">
            {MODE_OPTIONS.map((option) => {
              const isSelected = currentMode === option.id;
              const Icon = option.id === 'workspace' ? ColumnsIcon : CodeIcon;
              return (
                <div
                  key={option.id}
                  data-mode-option={option.id}
                  data-selected={isSelected ? 'true' : 'false'}
                  className="mw-ui-mode-picker-card"
                >
                  <div className="mw-ui-mode-picker-card-body">
                    <div className="mw-ui-mode-picker-card-top">
                      <span className="mw-ui-mode-picker-icon-box">
                        <Icon className="mw-ui-mode-picker-icon" aria-hidden="true" />
                      </span>
                      <Badge variant={option.badgeVariant}>{option.badge}</Badge>
                    </div>

                    <div>
                      <h3 className="mw-ui-mode-picker-card-title">{option.label}</h3>
                      <p className="mw-ui-mode-picker-card-subtitle">{option.subtitle}</p>
                    </div>

                    <ul className="mw-ui-mode-picker-highlights">
                      {option.highlights.map((item) => (
                        <li key={item} className="mw-ui-mode-picker-highlight">
                          {option.id === 'workspace' ? (
                            <CheckCircleIcon
                              className="mw-ui-mode-picker-highlight-icon"
                              aria-hidden="true"
                            />
                          ) : (
                            <SparkleIcon
                              className="mw-ui-mode-picker-highlight-icon"
                              aria-hidden="true"
                            />
                          )}
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                    className="mw-ui-mode-picker-action"
                    aria-pressed={isSelected}
                    onClick={() => onSelect(option.id)}
                  >
                    {isSelected ? `Active: ${option.label}` : `Use ${option.label}`}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
