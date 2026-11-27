import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Button,
  type ButtonSize,
  type ButtonTreatment,
  type ButtonVariant,
} from '@moonwitness/ui/components/button';
import { Badge, type BadgeProps } from '@moonwitness/ui/components/badge';
import { Alert, AlertDescription, AlertTitle, type AlertVariant } from '@moonwitness/ui/components/alert';
import { Progress, type ProgressSize, type ProgressVariant } from '@moonwitness/ui/components/progress';
import { Field } from '@moonwitness/ui/components/field';
import { Input } from '@moonwitness/ui/components/input';
import { Panel, type PanelProps } from '@moonwitness/ui/components/panel';
import { SectionRibbon, type SectionRibbonProps } from '@moonwitness/ui/components/section-ribbon';
import { AddIcon } from '@moonwitness/ui/icons';
import { auditElementAccessibility, type A11yAuditReport } from './a11yAudit.js';

type PlaygroundComponentId = 'button' | 'badge' | 'alert' | 'progress' | 'field' | 'panel' | 'ribbon';

type BadgeVariant = NonNullable<BadgeProps['variant']>;
type BadgeSize = NonNullable<BadgeProps['size']>;
type PanelSurface = NonNullable<PanelProps['surface']>;
type PanelFrame = NonNullable<PanelProps['frame']>;
type PanelDensity = NonNullable<PanelProps['density']>;
type RibbonAccent = NonNullable<SectionRibbonProps['accent']>;
type RibbonSurface = NonNullable<SectionRibbonProps['surface']>;
type RibbonFrame = NonNullable<SectionRibbonProps['frame']>;
type RibbonSize = NonNullable<SectionRibbonProps['size']>;
type RibbonTreatment = NonNullable<SectionRibbonProps['treatment']>;
type BorderStyleScale = 'default' | 'hairline' | 'heavy' | 'dashed' | 'double';
type ShadowDensityScale = 'none' | 'subtle' | 'default' | 'bold' | 'impact';

const PLAYGROUND_COMPONENTS: ReadonlyArray<{
  id: PlaygroundComponentId;
  label: string;
}> = [
  { id: 'button', label: 'Button' },
  { id: 'badge', label: 'Badge' },
  { id: 'alert', label: 'Alert' },
  { id: 'progress', label: 'Progress' },
  { id: 'field', label: 'Field & Input' },
  { id: 'panel', label: 'Panel' },
  { id: 'ribbon', label: 'SectionRibbon' },
];

const BUTTON_VARIANTS: readonly ButtonVariant[] = [
  'default',
  'magenta',
  'destructive',
  'outline',
  'secondary',
  'ghost',
  'link',
];

const BUTTON_SIZES: readonly ButtonSize[] = [
  'xs',
  'sm',
  'default',
  'lg',
  'icon-sm',
  'icon',
  'icon-lg',
];

const BUTTON_TREATMENTS: readonly ButtonTreatment[] = ['solid', 'brush'];

const BADGE_VARIANTS: readonly BadgeVariant[] = [
  'default',
  'primary',
  'magenta',
  'cyan',
  'success',
  'warning',
  'destructive',
];

const BADGE_SIZES: readonly BadgeSize[] = ['sm', 'md'];

const ALERT_VARIANTS: readonly AlertVariant[] = [
  'default',
  'info',
  'success',
  'warning',
  'destructive',
];

const PROGRESS_VARIANTS: readonly ProgressVariant[] = [
  'default',
  'magenta',
  'cyan',
  'success',
  'warning',
  'destructive',
];

const PROGRESS_SIZES: readonly ProgressSize[] = ['sm', 'md', 'lg'];

const PANEL_SURFACES: readonly PanelSurface[] = ['default', 'paper', 'ink'];
const PANEL_FRAMES: readonly PanelFrame[] = ['line', 'torn', 'scuffed', 'grunge'];
const PANEL_DENSITIES: readonly PanelDensity[] = ['micro', 'compact', 'comfortable', 'spacious'];

const RIBBON_ACCENTS: readonly RibbonAccent[] = ['magenta', 'cyan', 'yellow'];
const RIBBON_SURFACES: readonly RibbonSurface[] = ['paper', 'ink'];
const RIBBON_FRAMES: readonly RibbonFrame[] = ['line', 'torn', 'scuffed', 'grunge'];
const RIBBON_SIZES: readonly RibbonSize[] = ['sm', 'md', 'lg'];
const RIBBON_TREATMENTS: readonly RibbonTreatment[] = ['display', 'brush'];

const BORDER_STYLE_SCALES: readonly BorderStyleScale[] = [
  'hairline',
  'default',
  'heavy',
  'dashed',
  'double',
];

const SHADOW_DENSITY_SCALES: readonly ShadowDensityScale[] = [
  'none',
  'subtle',
  'default',
  'bold',
  'impact',
];

const BORDER_SCALE_TOKENS: Record<BorderStyleScale, string | null> = {
  default: null,
  hairline: '--mw-frame-width: 1px; --mw-comic-border-width: 1px;',
  heavy: '--mw-frame-width: 3px; --mw-comic-border-width: 3px;',
  dashed: '--mw-frame-width: 2px; border-style: dashed;',
  double: '--mw-frame-width: 4px; border-style: double;',
};

const SHADOW_SCALE_TOKENS: Record<ShadowDensityScale, string | null> = {
  none: '--mw-shadow-ink: none; --mw-shadow-ink-lg: none; --mw-shadow-comic: none;',
  subtle:
    '--mw-shadow-ink: 2px 2px 0 0 var(--mw-ink); --mw-shadow-ink-lg: 3px 3px 0 0 var(--mw-ink);',
  default: null,
  bold: '--mw-shadow-ink: 5px 5px 0 0 var(--mw-ink); --mw-shadow-ink-lg: 9px 9px 0 0 var(--mw-ink);',
  impact:
    '--mw-shadow-ink: 4px 4px 0 0 var(--mw-ink), 7px 7px 0 0 var(--mw-magenta); --mw-shadow-comic: 4px 4px 0 0 var(--mw-ink), 7px 7px 0 0 var(--mw-magenta);',
};

function OptionSelector<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <fieldset className="catalog-playground-fieldset">
      <legend>{label}</legend>
      <div className="catalog-playground-options">
        {options.map((option) => {
          const active = value === option;
          return (
            <button
              key={option}
              type="button"
              className="catalog-playground-option"
              data-active={active ? 'true' : 'false'}
              aria-pressed={active}
              onClick={() => onChange(option)}
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

async function copySnippet(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below if Clipboard API is restricted.
    }
  }
  if (typeof document === 'undefined') return false;
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
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

export function ComponentPlayground() {
  const [selected, setSelected] = useState<PlaygroundComponentId>('button');
  const [borderStyle, setBorderStyle] = useState<BorderStyleScale>('default');
  const [shadowDensity, setShadowDensity] = useState<ShadowDensityScale>('default');
  const [copiedJsx, setCopiedJsx] = useState(false);
  const copyTimerRef = useRef<number | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [a11yReport, setA11yReport] = useState<A11yAuditReport | null>(null);

  // Button state
  const [buttonVariant, setButtonVariant] = useState<ButtonVariant>('default');
  const [buttonSize, setButtonSize] = useState<ButtonSize>('default');
  const [buttonTreatment, setButtonTreatment] = useState<ButtonTreatment>('solid');
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [buttonLabel, setButtonLabel] = useState('Launch action');
  const [buttonClicks, setButtonClicks] = useState(0);

  // Badge state
  const [badgeVariant, setBadgeVariant] = useState<BadgeVariant>('primary');
  const [badgeSize, setBadgeSize] = useState<BadgeSize>('md');
  const [badgeLabel, setBadgeLabel] = useState('Live signal');

  // Alert state
  const [alertVariant, setAlertVariant] = useState<AlertVariant>('info');
  const [alertTitle, setAlertTitle] = useState('Signal sync active');
  const [alertDescription, setAlertDescription] = useState(
    'Draft revisions are mirrored across MoonWitness workspaces in real time.'
  );
  const [alertDismissible, setAlertDismissible] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);

  // Progress state
  const [progressVariant, setProgressVariant] = useState<ProgressVariant>('default');
  const [progressSize, setProgressSize] = useState<ProgressSize>('md');
  const [progressValue, setProgressValue] = useState(68);
  const [progressShowValue, setProgressShowValue] = useState(true);
  const [progressIndeterminate, setProgressIndeterminate] = useState(false);

  // Field & Input state
  const [fieldLabel, setFieldLabel] = useState('Story slug');
  const [fieldPlaceholder, setFieldPlaceholder] = useState('moon-city-01');
  const [fieldValue, setFieldValue] = useState('');
  const [fieldDescription, setFieldDescription] = useState('Lowercase letters, numbers, and hyphens.');
  const [fieldRequired, setFieldRequired] = useState(true);
  const [fieldInvalid, setFieldInvalid] = useState(false);
  const [fieldDisabled, setFieldDisabled] = useState(false);

  // Panel state
  const [panelSurface, setPanelSurface] = useState<PanelSurface>('default');
  const [panelFrame, setPanelFrame] = useState<PanelFrame>('line');
  const [panelDensity, setPanelDensity] = useState<PanelDensity>('comfortable');
  const [panelTitle, setPanelTitle] = useState('Signal dossier');
  const [panelDescription, setPanelDescription] = useState(
    'Live preview of MoonWitness panel surfaces, frames, and spacing density.'
  );
  const [panelShowAction, setPanelShowAction] = useState(true);

  // SectionRibbon state
  const [ribbonAccent, setRibbonAccent] = useState<RibbonAccent>('magenta');
  const [ribbonSurface, setRibbonSurface] = useState<RibbonSurface>('paper');
  const [ribbonFrame, setRibbonFrame] = useState<RibbonFrame>('line');
  const [ribbonSize, setRibbonSize] = useState<RibbonSize>('md');
  const [ribbonTreatment, setRibbonTreatment] = useState<RibbonTreatment>('display');
  const [ribbonNumber, setRibbonNumber] = useState('01');
  const [ribbonTitle, setRibbonTitle] = useState('Field transmission');
  const [ribbonShowAction, setRibbonShowAction] = useState(true);

  const runA11yAudit = useCallback(() => {
    setA11yReport(auditElementAccessibility(previewRef.current));
  }, []);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      runA11yAudit();
    });
    return () => window.cancelAnimationFrame(raf);
  }, [
    runA11yAudit,
    selected,
    borderStyle,
    shadowDensity,
    buttonVariant,
    buttonSize,
    buttonTreatment,
    buttonDisabled,
    buttonLoading,
    buttonLabel,
    badgeVariant,
    badgeSize,
    badgeLabel,
    alertVariant,
    alertTitle,
    alertDescription,
    alertDismissible,
    alertDismissed,
    progressVariant,
    progressSize,
    progressValue,
    progressShowValue,
    progressIndeterminate,
    fieldLabel,
    fieldPlaceholder,
    fieldDescription,
    fieldRequired,
    fieldInvalid,
    fieldDisabled,
    panelSurface,
    panelFrame,
    panelDensity,
    panelTitle,
    panelDescription,
    panelShowAction,
    ribbonAccent,
    ribbonSurface,
    ribbonFrame,
    ribbonSize,
    ribbonTreatment,
    ribbonNumber,
    ribbonTitle,
    ribbonShowAction,
  ]);

  useEffect(() => {
    if (typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(() => {
      window.requestAnimationFrame(() => runA11yAudit());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-skin', 'data-density', 'class'],
    });
    return () => observer.disconnect();
  }, [runA11yAudit]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  function resetCurrentComponent() {
    setBorderStyle('default');
    setShadowDensity('default');
    if (selected === 'button') {
      setButtonVariant('default');
      setButtonSize('default');
      setButtonTreatment('solid');
      setButtonDisabled(false);
      setButtonLoading(false);
      setButtonLabel('Launch action');
      setButtonClicks(0);
    } else if (selected === 'badge') {
      setBadgeVariant('primary');
      setBadgeSize('md');
      setBadgeLabel('Live signal');
    } else if (selected === 'alert') {
      setAlertVariant('info');
      setAlertTitle('Signal sync active');
      setAlertDescription(
        'Draft revisions are mirrored across MoonWitness workspaces in real time.'
      );
      setAlertDismissible(false);
      setAlertDismissed(false);
    } else if (selected === 'progress') {
      setProgressVariant('default');
      setProgressSize('md');
      setProgressValue(68);
      setProgressShowValue(true);
      setProgressIndeterminate(false);
    } else if (selected === 'field') {
      setFieldLabel('Story slug');
      setFieldPlaceholder('moon-city-01');
      setFieldValue('');
      setFieldDescription('Lowercase letters, numbers, and hyphens.');
      setFieldRequired(true);
      setFieldInvalid(false);
      setFieldDisabled(false);
    } else if (selected === 'panel') {
      setPanelSurface('default');
      setPanelFrame('line');
      setPanelDensity('comfortable');
      setPanelTitle('Signal dossier');
      setPanelDescription(
        'Live preview of MoonWitness panel surfaces, frames, and spacing density.'
      );
      setPanelShowAction(true);
    } else {
      setRibbonAccent('magenta');
      setRibbonSurface('paper');
      setRibbonFrame('line');
      setRibbonSize('md');
      setRibbonTreatment('display');
      setRibbonNumber('01');
      setRibbonTitle('Field transmission');
      setRibbonShowAction(true);
    }
  }

  const isIconButtonSize = buttonSize.startsWith('icon');

  const generatedJsx = (() => {
    if (selected === 'button') {
      const props = [
        buttonVariant !== 'default' ? `variant="${buttonVariant}"` : null,
        buttonSize !== 'default' ? `size="${buttonSize}"` : null,
        buttonTreatment !== 'solid' ? `treatment="${buttonTreatment}"` : null,
        buttonLoading ? 'loading' : null,
        buttonDisabled ? 'disabled' : null,
        isIconButtonSize ? `aria-label="${buttonLabel || 'Action'}"` : null,
      ].filter(Boolean);
      const propString = props.length > 0 ? ` ${props.join(' ')}` : '';
      return isIconButtonSize
        ? `<Button${propString}>\n  <AddIcon aria-hidden="true" />\n</Button>`
        : `<Button${propString}>${buttonLabel || 'Button'}</Button>`;
    }
    if (selected === 'badge') {
      const props = [
        badgeVariant !== 'default' ? `variant="${badgeVariant}"` : null,
        badgeSize !== 'md' ? `size="${badgeSize}"` : null,
      ].filter(Boolean);
      const propString = props.length > 0 ? ` ${props.join(' ')}` : '';
      return `<Badge${propString}>${badgeLabel || 'Badge'}</Badge>`;
    }
    if (selected === 'alert') {
      const props = [
        alertVariant !== 'default' ? `variant="${alertVariant}"` : null,
        alertDismissible ? 'onDismiss={() => setDismissed(true)}' : null,
      ].filter(Boolean);
      const propString = props.length > 0 ? ` ${props.join(' ')}` : '';
      return `<Alert${propString}>\n  <AlertTitle>${alertTitle || 'Alert'}</AlertTitle>\n  <AlertDescription>${alertDescription}</AlertDescription>\n</Alert>`;
    }
    if (selected === 'progress') {
      const props = [
        !progressIndeterminate ? `value={${progressValue}}` : null,
        progressIndeterminate ? 'indeterminate' : null,
        'label="Signal upload"',
        progressVariant !== 'default' ? `variant="${progressVariant}"` : null,
        progressSize !== 'md' ? `size="${progressSize}"` : null,
        progressShowValue && !progressIndeterminate ? 'showValue' : null,
      ].filter(Boolean);
      return `<Progress\n  ${props.join('\n  ')}\n/>`;
    }
    if (selected === 'field') {
      const fieldProps = [
        `label="${fieldLabel}"`,
        'htmlFor="story-slug"',
        fieldDescription ? `description="${fieldDescription}"` : null,
        fieldInvalid ? 'error="Use lowercase letters, numbers, and hyphens only."' : null,
        fieldRequired ? 'required' : null,
      ].filter(Boolean);
      const inputProps = [
        fieldPlaceholder ? `placeholder="${fieldPlaceholder}"` : null,
        fieldDisabled ? 'disabled' : null,
      ].filter(Boolean);
      return `<Field\n  ${fieldProps.join('\n  ')}\n>\n  <Input${inputProps.length ? ` ${inputProps.join(' ')}` : ''} />\n</Field>`;
    }
    if (selected === 'panel') {
      const props = [
        `title="${panelTitle}"`,
        panelDescription ? `description="${panelDescription}"` : null,
        panelSurface !== 'default' ? `surface="${panelSurface}"` : null,
        panelFrame !== 'line' ? `frame="${panelFrame}"` : null,
        panelDensity !== 'comfortable' ? `density="${panelDensity}"` : null,
        panelShowAction ? 'actions={<Button size="sm" variant="outline">Inspect</Button>}' : null,
      ].filter(Boolean);
      return `<Panel\n  ${props.join('\n  ')}\n>\n  <p>Panel body content</p>\n</Panel>`;
    }
    const props = [
      `title="${ribbonTitle}"`,
      ribbonNumber ? `number="${ribbonNumber}"` : null,
      ribbonAccent !== 'magenta' ? `accent="${ribbonAccent}"` : null,
      ribbonSurface !== 'paper' ? `surface="${ribbonSurface}"` : null,
      ribbonFrame !== 'line' ? `frame="${ribbonFrame}"` : null,
      ribbonSize !== 'md' ? `size="${ribbonSize}"` : null,
      ribbonTreatment !== 'display' ? `treatment="${ribbonTreatment}"` : null,
      ribbonShowAction ? 'action={<Badge variant="primary">Live</Badge>}' : null,
    ].filter(Boolean);
    return `<SectionRibbon\n  ${props.join('\n  ')}\n/>`;
  })();

  const generatedSnippet = (() => {
    const scaleLines = [
      BORDER_SCALE_TOKENS[borderStyle]
        ? `/* border-style: ${borderStyle} -> ${BORDER_SCALE_TOKENS[borderStyle]} */`
        : null,
      SHADOW_SCALE_TOKENS[shadowDensity]
        ? `/* shadow-density: ${shadowDensity} -> ${SHADOW_SCALE_TOKENS[shadowDensity]} */`
        : null,
    ].filter(Boolean);
    return scaleLines.length > 0 ? `${scaleLines.join('\n')}\n${generatedJsx}` : generatedJsx;
  })();

  async function handleCopyJsx() {
    const ok = await copySnippet(generatedSnippet);
    if (!ok) return;
    setCopiedJsx(true);
    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = window.setTimeout(() => {
      setCopiedJsx(false);
      copyTimerRef.current = null;
    }, 2000);
  }

  return (
    <div className="catalog-playground" data-testid="component-playground">
      <div
        className="catalog-playground-tabs"
        role="group"
        aria-label="Playground target component"
      >
        {PLAYGROUND_COMPONENTS.map((item) => {
          const active = selected === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className="catalog-playground-tab"
              data-active={active ? 'true' : 'false'}
              aria-pressed={active}
              onClick={() => setSelected(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="catalog-playground-grid">
        <div className="catalog-playground-stage-wrap">
          <div className="catalog-playground-stage-bar">
            <span className="catalog-playground-stage-label">
              LIVE PREVIEW · {PLAYGROUND_COMPONENTS.find((c) => c.id === selected)?.label}
            </span>
            <div className="catalog-playground-stage-actions">
              <button
                type="button"
                className="catalog-copy-button"
                onClick={resetCurrentComponent}
              >
                Reset props
              </button>
              <button
                type="button"
                className="catalog-copy-button"
                data-copied={copiedJsx ? 'true' : 'false'}
                onClick={handleCopyJsx}
              >
                {copiedJsx ? 'Copied JSX' : 'Copy JSX'}
              </button>
            </div>
          </div>

          <div
            ref={previewRef}
            className="catalog-playground-canvas"
            data-testid="playground-preview"
            data-border-style={borderStyle}
            data-shadow-density={shadowDensity}
          >
            {selected === 'button' ? (
              <div className="catalog-playground-preview-stack">
                <Button
                  variant={buttonVariant}
                  size={buttonSize}
                  treatment={buttonTreatment}
                  loading={buttonLoading}
                  disabled={buttonDisabled}
                  aria-label={isIconButtonSize ? buttonLabel || 'Action' : undefined}
                  onClick={() => setButtonClicks((count) => count + 1)}
                >
                  {isIconButtonSize ? <AddIcon aria-hidden="true" /> : buttonLabel || 'Button'}
                </Button>
                <span className="catalog-playground-status" role="status">
                  {buttonLoading
                    ? 'State: loading (aria-busy, clicks blocked)'
                    : buttonDisabled
                      ? 'State: disabled (clicks blocked)'
                      : `Clicks: ${buttonClicks}`}
                </span>
              </div>
            ) : null}

            {selected === 'badge' ? (
              <Badge variant={badgeVariant} size={badgeSize}>
                {badgeLabel || 'Badge'}
              </Badge>
            ) : null}

            {selected === 'alert' ? (
              <div className="catalog-playground-wide-box">
                {alertDismissed ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAlertDismissed(false)}
                  >
                    Restore alert
                  </Button>
                ) : (
                  <Alert
                    variant={alertVariant}
                    onDismiss={alertDismissible ? () => setAlertDismissed(true) : undefined}
                  >
                    <AlertTitle>{alertTitle || 'Alert'}</AlertTitle>
                    {alertDescription ? (
                      <AlertDescription>{alertDescription}</AlertDescription>
                    ) : null}
                  </Alert>
                )}
              </div>
            ) : null}

            {selected === 'progress' ? (
              <div className="catalog-playground-wide-box">
                <Progress
                  value={progressValue}
                  label="Signal upload"
                  variant={progressVariant}
                  size={progressSize}
                  showValue={progressShowValue}
                  indeterminate={progressIndeterminate}
                />
              </div>
            ) : null}

            {selected === 'field' ? (
              <div className="catalog-playground-field-box">
                <Field
                  label={fieldLabel || 'Field label'}
                  htmlFor="playground-field-input"
                  description={fieldDescription || undefined}
                  error={
                    fieldInvalid
                      ? 'Use lowercase letters, numbers, and hyphens only.'
                      : undefined
                  }
                  required={fieldRequired}
                >
                  <Input
                    value={fieldValue}
                    onChange={(event) => setFieldValue(event.target.value)}
                    placeholder={fieldPlaceholder}
                    disabled={fieldDisabled}
                  />
                </Field>
              </div>
            ) : null}

            {selected === 'panel' ? (
              <div className="catalog-playground-wide-box">
                <Panel
                  title={panelTitle || 'Signal dossier'}
                  description={panelDescription || undefined}
                  surface={panelSurface}
                  frame={panelFrame}
                  density={panelDensity}
                  headingLevel={3}
                  actions={
                    panelShowAction ? (
                      <Button size="sm" variant="outline">
                        Inspect
                      </Button>
                    ) : undefined
                  }
                >
                  <p className="catalog-playground-panel-copy">
                    Active props: surface={panelSurface}, frame={panelFrame}, density={panelDensity}.
                  </p>
                </Panel>
              </div>
            ) : null}

            {selected === 'ribbon' ? (
              <div className="catalog-playground-wide-box">
                <SectionRibbon
                  title={ribbonTitle || 'Field transmission'}
                  number={ribbonNumber || undefined}
                  accent={ribbonAccent}
                  surface={ribbonSurface}
                  frame={ribbonFrame}
                  size={ribbonSize}
                  treatment={ribbonTreatment}
                  headingLevel={3}
                  action={ribbonShowAction ? <Badge variant="primary">Live</Badge> : undefined}
                />
              </div>
            ) : null}
          </div>

          <section
            className="catalog-a11y-panel"
            aria-label="Accessibility audit results"
            data-testid="playground-a11y-panel"
            data-status={a11yReport?.status ?? 'pass'}
          >
            <div className="catalog-a11y-header">
              <div className="catalog-a11y-heading">
                <span className="catalog-a11y-title">Accessibility inspector</span>
                <span
                  className="catalog-a11y-pill"
                  data-severity={a11yReport?.status ?? 'pass'}
                  data-testid="playground-a11y-status"
                >
                  {a11yReport?.status === 'fail'
                    ? `${a11yReport.counts.fail} issue${a11yReport.counts.fail === 1 ? '' : 's'}`
                    : a11yReport?.status === 'warn'
                      ? `${a11yReport.counts.warn} warning${a11yReport.counts.warn === 1 ? '' : 's'}`
                      : 'Checks passed'}
                </span>
              </div>
              <button
                type="button"
                className="catalog-copy-button"
                onClick={runA11yAudit}
              >
                Re-scan a11y
              </button>
            </div>

            {a11yReport ? (
              <div className="catalog-a11y-grid">
                <div className="catalog-a11y-card" data-testid="a11y-aria-section">
                  <h4>ARIA &amp; Labels ({a11yReport.ariaChecks.length})</h4>
                  <ul className="catalog-a11y-list">
                    {a11yReport.ariaChecks.map((item) => (
                      <li key={item.id} data-severity={item.status}>
                        <span className="catalog-a11y-badge" data-severity={item.status}>
                          {item.status.toUpperCase()}
                        </span>
                        <div className="catalog-a11y-item-copy">
                          <strong>{item.elementLabel}</strong>
                          <span>{item.detail}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="catalog-a11y-card" data-testid="a11y-contrast-section">
                  <h4>Contrast Ratios ({a11yReport.contrastChecks.length})</h4>
                  {a11yReport.contrastChecks.length > 0 ? (
                    <ul className="catalog-a11y-list">
                      {a11yReport.contrastChecks.map((item) => (
                        <li key={item.id} data-severity={item.status}>
                          <span className="catalog-a11y-badge" data-severity={item.status}>
                            {item.level}
                          </span>
                          <div className="catalog-a11y-item-copy">
                            <strong className="catalog-a11y-contrast-row">
                              <span>{item.ratio.toFixed(2)}:1</span>
                              <span
                                className="catalog-a11y-swatch"
                                style={{
                                  backgroundColor: item.background,
                                  color: item.foreground,
                                }}
                                aria-hidden="true"
                              >
                                Aa
                              </span>
                            </strong>
                            <span>
                              {item.label} ({item.foreground} on {item.background})
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="catalog-a11y-empty">
                      Computed contrast available in browser stylesheet runtime.
                    </p>
                  )}
                </div>

                <div className="catalog-a11y-card" data-testid="a11y-focus-section">
                  <h4>Focus Order ({a11yReport.focusOrder.length})</h4>
                  <p className="catalog-a11y-focus-summary">{a11yReport.focusSummary}</p>
                  {a11yReport.focusOrder.length > 0 ? (
                    <ol className="catalog-a11y-focus-list">
                      {a11yReport.focusOrder.map((stop) => (
                        <li key={`${stop.order}-${stop.elementLabel}`}>
                          <button
                            type="button"
                            className="catalog-a11y-focus-stop"
                            onClick={() => stop.element.focus()}
                            title="Move keyboard focus to this element"
                          >
                            <span className="catalog-a11y-focus-index">#{stop.order}</span>
                            <span>
                              {stop.elementLabel} &ldquo;{stop.accessibleName}&rdquo;
                            </span>
                            <small>tabIndex={stop.tabIndex}</small>
                          </button>
                          {stop.warning ? (
                            <span className="catalog-a11y-focus-warn">{stop.warning}</span>
                          ) : null}
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>

          <pre className="catalog-playground-code" data-testid="playground-jsx-output">
            <code>{generatedSnippet}</code>
          </pre>
        </div>

        <div className="catalog-playground-controls" aria-label="Component prop controls">
          <h3 className="catalog-playground-controls-title">Prop controls</h3>

          {selected === 'button' ? (
            <>
              <OptionSelector
                label="Variant"
                options={BUTTON_VARIANTS}
                value={buttonVariant}
                onChange={setButtonVariant}
              />
              <OptionSelector
                label="Size"
                options={BUTTON_SIZES}
                value={buttonSize}
                onChange={setButtonSize}
              />
              <OptionSelector
                label="Treatment"
                options={BUTTON_TREATMENTS}
                value={buttonTreatment}
                onChange={setButtonTreatment}
              />
              <label className="catalog-playground-input-field">
                <span>Label</span>
                <input
                  type="text"
                  value={buttonLabel}
                  onChange={(event) => setButtonLabel(event.target.value)}
                />
              </label>
              <label className="catalog-playground-toggle">
                <input
                  type="checkbox"
                  checked={buttonLoading}
                  onChange={(event) => setButtonLoading(event.target.checked)}
                />
                <span>Loading state</span>
              </label>
              <label className="catalog-playground-toggle">
                <input
                  type="checkbox"
                  checked={buttonDisabled}
                  onChange={(event) => setButtonDisabled(event.target.checked)}
                />
                <span>Disabled state</span>
              </label>
            </>
          ) : null}

          {selected === 'badge' ? (
            <>
              <OptionSelector
                label="Variant"
                options={BADGE_VARIANTS}
                value={badgeVariant}
                onChange={setBadgeVariant}
              />
              <OptionSelector
                label="Size"
                options={BADGE_SIZES}
                value={badgeSize}
                onChange={setBadgeSize}
              />
              <label className="catalog-playground-input-field">
                <span>Label</span>
                <input
                  type="text"
                  value={badgeLabel}
                  onChange={(event) => setBadgeLabel(event.target.value)}
                />
              </label>
            </>
          ) : null}

          {selected === 'alert' ? (
            <>
              <OptionSelector
                label="Variant"
                options={ALERT_VARIANTS}
                value={alertVariant}
                onChange={(next) => {
                  setAlertVariant(next);
                  setAlertDismissed(false);
                }}
              />
              <label className="catalog-playground-input-field">
                <span>Title</span>
                <input
                  type="text"
                  value={alertTitle}
                  onChange={(event) => setAlertTitle(event.target.value)}
                />
              </label>
              <label className="catalog-playground-input-field">
                <span>Description</span>
                <input
                  type="text"
                  value={alertDescription}
                  onChange={(event) => setAlertDescription(event.target.value)}
                />
              </label>
              <label className="catalog-playground-toggle">
                <input
                  type="checkbox"
                  checked={alertDismissible}
                  onChange={(event) => {
                    setAlertDismissible(event.target.checked);
                    setAlertDismissed(false);
                  }}
                />
                <span>Dismissible</span>
              </label>
            </>
          ) : null}

          {selected === 'progress' ? (
            <>
              <OptionSelector
                label="Variant"
                options={PROGRESS_VARIANTS}
                value={progressVariant}
                onChange={setProgressVariant}
              />
              <OptionSelector
                label="Size"
                options={PROGRESS_SIZES}
                value={progressSize}
                onChange={setProgressSize}
              />
              <label className="catalog-playground-input-field">
                <span>Value ({progressValue}%)</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progressValue}
                  disabled={progressIndeterminate}
                  onChange={(event) => setProgressValue(Number(event.target.value))}
                />
              </label>
              <label className="catalog-playground-toggle">
                <input
                  type="checkbox"
                  checked={progressShowValue}
                  onChange={(event) => setProgressShowValue(event.target.checked)}
                />
                <span>Show percentage</span>
              </label>
              <label className="catalog-playground-toggle">
                <input
                  type="checkbox"
                  checked={progressIndeterminate}
                  onChange={(event) => setProgressIndeterminate(event.target.checked)}
                />
                <span>Indeterminate mode</span>
              </label>
            </>
          ) : null}

          {selected === 'field' ? (
            <>
              <label className="catalog-playground-input-field">
                <span>Label</span>
                <input
                  type="text"
                  value={fieldLabel}
                  onChange={(event) => setFieldLabel(event.target.value)}
                />
              </label>
              <label className="catalog-playground-input-field">
                <span>Placeholder</span>
                <input
                  type="text"
                  value={fieldPlaceholder}
                  onChange={(event) => setFieldPlaceholder(event.target.value)}
                />
              </label>
              <label className="catalog-playground-input-field">
                <span>Description</span>
                <input
                  type="text"
                  value={fieldDescription}
                  onChange={(event) => setFieldDescription(event.target.value)}
                />
              </label>
              <label className="catalog-playground-toggle">
                <input
                  type="checkbox"
                  checked={fieldRequired}
                  onChange={(event) => setFieldRequired(event.target.checked)}
                />
                <span>Required</span>
              </label>
              <label className="catalog-playground-toggle">
                <input
                  type="checkbox"
                  checked={fieldInvalid}
                  onChange={(event) => setFieldInvalid(event.target.checked)}
                />
                <span>Validation error state</span>
              </label>
              <label className="catalog-playground-toggle">
                <input
                  type="checkbox"
                  checked={fieldDisabled}
                  onChange={(event) => setFieldDisabled(event.target.checked)}
                />
                <span>Disabled</span>
              </label>
            </>
          ) : null}

          {selected === 'panel' ? (
            <>
              <OptionSelector
                label="Surface"
                options={PANEL_SURFACES}
                value={panelSurface}
                onChange={setPanelSurface}
              />
              <OptionSelector
                label="Frame"
                options={PANEL_FRAMES}
                value={panelFrame}
                onChange={setPanelFrame}
              />
              <OptionSelector
                label="Density"
                options={PANEL_DENSITIES}
                value={panelDensity}
                onChange={setPanelDensity}
              />
              <label className="catalog-playground-input-field">
                <span>Title</span>
                <input
                  type="text"
                  value={panelTitle}
                  onChange={(event) => setPanelTitle(event.target.value)}
                />
              </label>
              <label className="catalog-playground-toggle">
                <input
                  type="checkbox"
                  checked={panelShowAction}
                  onChange={(event) => setPanelShowAction(event.target.checked)}
                />
                <span>Show header action</span>
              </label>
            </>
          ) : null}

          {selected === 'ribbon' ? (
            <>
              <OptionSelector
                label="Accent"
                options={RIBBON_ACCENTS}
                value={ribbonAccent}
                onChange={setRibbonAccent}
              />
              <OptionSelector
                label="Surface"
                options={RIBBON_SURFACES}
                value={ribbonSurface}
                onChange={setRibbonSurface}
              />
              <OptionSelector
                label="Frame"
                options={RIBBON_FRAMES}
                value={ribbonFrame}
                onChange={setRibbonFrame}
              />
              <OptionSelector
                label="Size"
                options={RIBBON_SIZES}
                value={ribbonSize}
                onChange={setRibbonSize}
              />
              <OptionSelector
                label="Treatment"
                options={RIBBON_TREATMENTS}
                value={ribbonTreatment}
                onChange={setRibbonTreatment}
              />
              <label className="catalog-playground-input-field">
                <span>Number</span>
                <input
                  type="text"
                  value={ribbonNumber}
                  onChange={(event) => setRibbonNumber(event.target.value)}
                />
              </label>
              <label className="catalog-playground-input-field">
                <span>Title</span>
                <input
                  type="text"
                  value={ribbonTitle}
                  onChange={(event) => setRibbonTitle(event.target.value)}
                />
              </label>
              <label className="catalog-playground-toggle">
                <input
                  type="checkbox"
                  checked={ribbonShowAction}
                  onChange={(event) => setRibbonShowAction(event.target.checked)}
                />
                <span>Show action badge</span>
              </label>
            </>
          ) : null}

          <div className="catalog-playground-scale-group">
            <h4 className="catalog-playground-scale-title">Design system scales</h4>
            <OptionSelector
              label="Border style"
              options={BORDER_STYLE_SCALES}
              value={borderStyle}
              onChange={setBorderStyle}
            />
            <OptionSelector
              label="Shadow density"
              options={SHADOW_DENSITY_SCALES}
              value={shadowDensity}
              onChange={setShadowDensity}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
