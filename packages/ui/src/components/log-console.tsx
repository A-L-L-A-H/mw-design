'use client';

import { forwardRef, useMemo, useState, type ComponentProps } from 'react';
import { Badge } from './badge.js';
import { Button } from './button.js';
import { Input } from './input.js';
import { Panel } from './panel.js';
import { SelectField } from './select-field.js';
import { cn } from '../lib/cn.js';
import {
  CheckCircleIcon,
  CodeIcon,
  DeleteIcon,
  DocumentIcon,
  ErrorIcon,
  InfoIcon,
  RefreshIcon,
  SearchIcon,
  SparkleIcon,
  WarningIcon,
} from '../icons/index.js';

export type LogLevel = 'info' | 'warn' | 'error';
export type LogLevelFilter = 'all' | LogLevel;
export type LogSource = 'rust' | 'sidecar' | 'webview' | 'mcp' | 'mesh';
export type LogSourceFilter = 'all' | LogSource;
export type LogDisplayMode = 'compact' | 'terminal';

export interface LogConsoleEntry {
  readonly id: string;
  readonly timestamp: string;
  readonly level: LogLevel;
  readonly source: LogSource;
  readonly message: string;
  readonly detail?: string;
}

export type LogConsoleProps = Omit<ComponentProps<'div'>, 'children'> & {
  readonly entries: readonly LogConsoleEntry[];
  readonly title?: string;
  readonly description?: string;
  readonly defaultLevel?: LogLevelFilter;
  readonly defaultSource?: LogSourceFilter;
  readonly defaultSearch?: string;
  readonly defaultDisplayMode?: LogDisplayMode;
  readonly loading?: boolean;
  readonly copyStatus?: 'idle' | 'copied' | 'error';
  readonly emptyMessage?: string;
  readonly onRefresh?: () => void;
  readonly onClear?: () => void;
  readonly onCopyForAi?: (visibleEntries: readonly LogConsoleEntry[]) => void;
};

const LEVEL_OPTIONS: readonly { readonly value: LogLevelFilter; readonly label: string }[] = [
  { value: 'all', label: 'All levels' },
  { value: 'error', label: 'Error' },
  { value: 'warn', label: 'Warn' },
  { value: 'info', label: 'Info' },
];

const SOURCE_OPTIONS: readonly { readonly value: LogSourceFilter; readonly label: string }[] = [
  { value: 'all', label: 'All sources' },
  { value: 'rust', label: 'Rust' },
  { value: 'sidecar', label: 'Sidecar' },
  { value: 'webview', label: 'Webview' },
  { value: 'mcp', label: 'MCP' },
  { value: 'mesh', label: 'Mesh' },
];

function getLevelBadgeVariant(level: LogLevel): 'destructive' | 'magenta' | 'cyan' {
  if (level === 'error') return 'destructive';
  if (level === 'warn') return 'magenta';
  return 'cyan';
}

function LevelIcon({ level }: { readonly level: LogLevel }) {
  if (level === 'error') {
    return <ErrorIcon className="mw-ui-log-console-icon" aria-hidden="true" />;
  }
  if (level === 'warn') {
    return <WarningIcon className="mw-ui-log-console-icon" aria-hidden="true" />;
  }
  return <InfoIcon className="mw-ui-log-console-icon" aria-hidden="true" />;
}

function formatTimeShort(timestamp: string): string {
  const parsed = Date.parse(timestamp);
  if (Number.isNaN(parsed)) return timestamp;
  return new Date(parsed).toISOString().slice(11, 23);
}

export const LogConsole = forwardRef<HTMLDivElement, LogConsoleProps>(function LogConsole(
  {
    entries,
    title = 'Desktop Log Console',
    description = 'Live local diagnostics across Rust, Sidecar, Webview, MCP, and Mesh.',
    defaultLevel = 'all',
    defaultSource = 'all',
    defaultSearch = '',
    defaultDisplayMode = 'compact',
    loading = false,
    copyStatus = 'idle',
    emptyMessage = 'No log entries match the active filters.',
    onRefresh,
    onClear,
    onCopyForAi,
    className,
    ...props
  },
  ref
) {
  const [levelFilter, setLevelFilter] = useState<LogLevelFilter>(defaultLevel);
  const [sourceFilter, setSourceFilter] = useState<LogSourceFilter>(defaultSource);
  const [searchQuery, setSearchQuery] = useState<string>(defaultSearch);
  const [displayMode, setDisplayMode] = useState<LogDisplayMode>(defaultDisplayMode);

  const filteredEntries = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return entries.filter((entry) => {
      if (levelFilter !== 'all' && entry.level !== levelFilter) return false;
      if (sourceFilter !== 'all' && entry.source !== sourceFilter) return false;
      if (normalizedQuery.length > 0) {
        const haystack =
          `${entry.message} ${entry.detail ?? ''} ${entry.source} ${entry.level}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) return false;
      }
      return true;
    });
  }, [entries, levelFilter, sourceFilter, searchQuery]);

  const errorCount = useMemo(
    () => entries.filter((entry) => entry.level === 'error').length,
    [entries]
  );
  const warnCount = useMemo(
    () => entries.filter((entry) => entry.level === 'warn').length,
    [entries]
  );

  return (
    <div
      ref={ref}
      data-slot="log-console"
      data-display-mode={displayMode}
      className={cn('mw-ui-log-console', className)}
      {...props}
    >
      <Panel
        title={title}
        description={description}
        density="compact"
        actions={
          <div className="mw-ui-log-console-actions">
            <Badge variant={errorCount > 0 ? 'destructive' : 'default'}>{errorCount} err</Badge>
            <Badge variant={warnCount > 0 ? 'magenta' : 'default'}>{warnCount} warn</Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setDisplayMode((prev) => (prev === 'compact' ? 'terminal' : 'compact'))
              }
              aria-label={`Switch to ${displayMode === 'compact' ? 'terminal' : 'compact'} view`}
            >
              <CodeIcon className="mw-ui-log-console-icon" aria-hidden="true" />
              <span>{displayMode === 'compact' ? 'Terminal' : 'Compact'}</span>
            </Button>
            {onRefresh ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
                aria-label="Refresh logs"
              >
                <RefreshIcon className="mw-ui-log-console-icon" aria-hidden="true" />
                <span>Refresh</span>
              </Button>
            ) : null}
            {onClear ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClear}
                aria-label="Clear logs"
              >
                <DeleteIcon className="mw-ui-log-console-icon" aria-hidden="true" />
                <span>Clear</span>
              </Button>
            ) : null}
            {onCopyForAi ? (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => onCopyForAi(filteredEntries)}
                data-action="copy-for-ai"
              >
                {copyStatus === 'copied' ? (
                  <CheckCircleIcon className="mw-ui-log-console-icon" aria-hidden="true" />
                ) : (
                  <SparkleIcon className="mw-ui-log-console-icon" aria-hidden="true" />
                )}
                <span>
                  {copyStatus === 'copied'
                    ? 'Copied for AI'
                    : copyStatus === 'error'
                      ? 'Copy failed'
                      : 'Copy for AI'}
                </span>
              </Button>
            ) : null}
          </div>
        }
      >
        <div className="mw-ui-log-console-body">
          <div className="mw-ui-log-console-filters">
            <div className="mw-ui-log-console-search">
              <SearchIcon className="mw-ui-log-console-search-icon" aria-hidden="true" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Filter logs by message, detail, or source..."
                aria-label="Search logs"
                className="mw-ui-log-console-search-input"
              />
            </div>
            <div className="mw-ui-log-console-filter-cell">
              <SelectField
                aria-label="Filter by log level"
                value={levelFilter}
                onChange={(event) => setLevelFilter(event.target.value as LogLevelFilter)}
              >
                {LEVEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectField>
            </div>
            <div className="mw-ui-log-console-filter-cell">
              <SelectField
                aria-label="Filter by log source"
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value as LogSourceFilter)}
              >
                {SOURCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectField>
            </div>
          </div>

          <div
            data-slot="log-console-summary"
            role="status"
            aria-live="polite"
            className="mw-ui-visually-hidden"
          >
            {filteredEntries.length} log entries
          </div>
          <div
            data-slot="log-console-entries"
            data-mode={displayMode}
            role="log"
            aria-live="off"
            className="mw-ui-log-console-entries"
          >
            {filteredEntries.length === 0 ? (
              <div className="mw-ui-log-console-empty">
                <DocumentIcon className="mw-ui-log-console-empty-icon" aria-hidden="true" />
                <span>{emptyMessage}</span>
              </div>
            ) : (
              filteredEntries.map((entry) =>
                displayMode === 'terminal' ? (
                  <div
                    key={entry.id}
                    data-log-entry-id={entry.id}
                    data-log-level={entry.level}
                    data-log-source={entry.source}
                    className="mw-ui-log-console-terminal-row"
                  >
                    <span className="mw-ui-log-console-terminal-time">
                      [{formatTimeShort(entry.timestamp)}]
                    </span>{' '}
                    <span className="mw-ui-log-console-terminal-level">[{entry.level}]</span>{' '}
                    <span className="mw-ui-log-console-terminal-source">[{entry.source}]</span>{' '}
                    <span>{entry.message}</span>
                    {entry.detail ? (
                      <div className="mw-ui-log-console-terminal-detail">{entry.detail}</div>
                    ) : null}
                  </div>
                ) : (
                  <div
                    key={entry.id}
                    data-log-entry-id={entry.id}
                    data-log-level={entry.level}
                    data-log-source={entry.source}
                    className="mw-ui-log-console-compact-row"
                  >
                    <div className="mw-ui-log-console-compact-meta">
                      <Badge variant={getLevelBadgeVariant(entry.level)}>
                        <LevelIcon level={entry.level} />
                        <span className="mw-ui-log-console-level-text">{entry.level}</span>
                      </Badge>
                      <Badge variant="default">{entry.source}</Badge>
                      <span className="mw-ui-log-console-timestamp">
                        {formatTimeShort(entry.timestamp)}
                      </span>
                    </div>
                    <p className="mw-ui-log-console-message">{entry.message}</p>
                    {entry.detail ? (
                      <pre className="mw-ui-log-console-detail">{entry.detail}</pre>
                    ) : null}
                  </div>
                )
              )
            )}
          </div>
        </div>
      </Panel>
    </div>
  );
});

LogConsole.displayName = 'LogConsole';
