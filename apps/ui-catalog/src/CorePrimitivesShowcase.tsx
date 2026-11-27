import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  CopyButton,
  Progress,
  RadioGroup,
  RadioGroupItem,
  Separator,
  Spinner,
} from '@moonwitness/ui';
import { ComponentApiTable } from './ComponentApiTable.js';

type ExampleWrapper = ComponentType<{
  title: string;
  description: string;
  children: ReactNode;
}>;

export function CorePrimitivesShowcase({ Example }: { Example: ExampleWrapper }) {
  const [alertVisible, setAlertVisible] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(64);
  const [saving, setSaving] = useState(false);
  const [channel, setChannel] = useState('editorial');
  const [agree, setAgree] = useState(true);
  const [partial, setPartial] = useState<boolean | 'indeterminate'>('indeterminate');
  const indeterminateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (indeterminateRef.current) {
      indeterminateRef.current.indeterminate = partial === 'indeterminate';
    }
  }, [partial]);

  return (
    <>
      <Example
        title="Alerts & semantic status"
        description="Inline Alert callouts across default, info, success, warning, and destructive tones with optional dismissible actions."
      >
        <div className="catalog-primitives-stack">
          <Alert variant="info">
            <AlertTitle>Broadcast synced</AlertTitle>
            <AlertDescription>
              All theme tokens and component stylesheets are imported directly from @moonwitness/ui.
            </AlertDescription>
          </Alert>
          <Alert variant="success">
            <AlertTitle>Publication ready</AlertTitle>
            <AlertDescription>
              Accessibility contrast and keyboard navigation checks passed across all three theme modes.
            </AlertDescription>
          </Alert>
          <Alert variant="warning">
            <AlertTitle>Pending review</AlertTitle>
            <AlertDescription>
              Two field notes still need final editorial approval before dispatch.
            </AlertDescription>
          </Alert>
          {alertVisible ? (
            <Alert variant="destructive" onDismiss={() => setAlertVisible(false)}>
              <AlertTitle>Connection interrupted</AlertTitle>
              <AlertDescription>
                Click the close button to test dismissible alert handling.
              </AlertDescription>
            </Alert>
          ) : (
            <div>
              <Button variant="outline" size="sm" onClick={() => setAlertVisible(true)}>
                Restore dismissible alert
              </Button>
            </div>
          )}
        </div>
      </Example>

      <Example
        title="Progress, Spinner & Button loading"
        description="Accessible progress bars, inline spinners, and native Button loading state with aria-busy protection."
      >
        <div className="catalog-primitives-stack">
          <Progress label="Issue build pipeline" value={uploadProgress} showValue variant="default" />
          <Progress label="Media verification" value={88} showValue variant="success" size="sm" />
          <Progress label="Streaming live feed" indeterminate variant="magenta" size="lg" />
          <div className="catalog-inline">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setUploadProgress((prev) => (prev >= 100 ? 15 : Math.min(100, prev + 18)))}
            >
              Advance progress
            </Button>
            <Button
              variant="default"
              loading={saving}
              onClick={() => {
                setSaving(true);
                window.setTimeout(() => setSaving(false), 1200);
              }}
            >
              {saving ? 'Saving draft' : 'Save with loading state'}
            </Button>
            <CopyButton value="import { Button, Alert, Card } from '@moonwitness/ui';" label="Copy import" />
          </div>
          <div className="catalog-inline">
            <Spinner size="sm" label="Syncing" showLabel />
            <Spinner size="md" label="Loading dossier" showLabel />
            <Spinner size="lg" label="Indexing archive" />
          </div>
        </div>
      </Example>

      <Example
        title="Cards, Separators, Badges & Avatars"
        description="Composable Card surfaces, horizontal/vertical/labeled Separators, semantic Badges (success/warning/sm), and Avatar sizes."
      >
        <div className="catalog-card-grid">
          <Card variant="default">
            <CardHeader>
              <CardTitle>Default Card</CardTitle>
              <CardDescription>Balanced frame for structured consumer content.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="catalog-inline">
                <Badge variant="success">Approved</Badge>
                <Badge variant="warning">Review</Badge>
                <Badge variant="primary" size="sm">
                  Compact
                </Badge>
              </div>
            </CardContent>
            <CardFooter>
              <Avatar name="Ayu" size="sm" />
              <Avatar name="Bima" size="md" />
              <Avatar name="Citra" size="lg" />
            </CardFooter>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Elevated Card</CardTitle>
              <CardDescription>Paper surface with deeper ink drop-shadow.</CardDescription>
            </CardHeader>
            <CardContent>
              <Separator label="Signal split" />
              <div className="catalog-separator-row">
                <span>Editorial</span>
                <Separator orientation="vertical" />
                <span>Research</span>
                <Separator orientation="vertical" variant="dashed" />
                <span>Archive</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="outline">
                Open dossier
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Example>

      <Example
        title="Accordion, RadioGroup & custom Checkbox"
        description="Keyboard-accessible Radix Accordion and RadioGroup paired with consistent cross-browser Checkbox states."
      >
        <div className="catalog-card-grid">
          <Accordion type="single" collapsible defaultValue="item-1">
            <AccordionItem value="item-1">
              <AccordionTrigger>Single root import available?</AccordionTrigger>
              <AccordionContent>
                Yes — import primitives from @moonwitness/ui or keep granular subpath imports for minimal bundles.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Works without Tailwind CSS?</AccordionTrigger>
              <AccordionContent>
                Every component, Switch, Checkbox, and overlay ships complete CSS inside @moonwitness/ui/components.css — zero Tailwind runtime required.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>How is theming controlled?</AccordionTrigger>
              <AccordionContent>
                Wrap your app in ThemeProvider and call useTheme() to toggle light, dark, high-contrast, skin, and density.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="catalog-primitives-stack">
            <div className="catalog-radio-group-box">
              <span className="mw-ui-label">Dispatch channel ({channel})</span>
              <RadioGroup value={channel} onValueChange={setChannel} aria-label="Dispatch channel">
                <label className="mw-ui-radio-option">
                  <RadioGroupItem value="editorial" id="radio-editorial" />
                  <span>Editorial desk</span>
                </label>
                <label className="mw-ui-radio-option">
                  <RadioGroupItem value="field" id="radio-field" />
                  <span>Field reporters</span>
                </label>
                <label className="mw-ui-radio-option">
                  <RadioGroupItem value="archive" id="radio-archive" />
                  <span>Public archive</span>
                </label>
              </RadioGroup>
            </div>

            <Separator variant="dashed" />

            <div className="catalog-primitives-stack">
              <label className="mw-ui-radio-option">
                <Checkbox
                  checked={agree}
                  onChange={(event) => setAgree(event.target.checked)}
                />
                <span>Custom cross-browser checkbox ({agree ? 'checked' : 'unchecked'})</span>
              </label>
              <label className="mw-ui-radio-option">
                <Checkbox
                  ref={indeterminateRef}
                  checked={partial === true}
                  onChange={() =>
                    setPartial((prev) =>
                      prev === 'indeterminate' ? true : prev === true ? false : 'indeterminate'
                    )
                  }
                />
                <span>Indeterminate selection ({String(partial)})</span>
              </label>
            </div>
          </div>
        </div>
      </Example>

      <Example
        title="Component API & props reference"
        description="Searchable prop signatures, defaults, copyable imports, and CSS design tokens for core @moonwitness/ui primitives."
      >
        <ComponentApiTable />
      </Example>
    </>
  );
}
