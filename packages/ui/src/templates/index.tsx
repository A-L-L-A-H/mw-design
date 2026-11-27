'use client';

import { useCallback, useState } from 'react';
import { Badge } from '../components/badge.js';
import { Button } from '../components/button.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/card.js';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../components/sheet.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/tabs.js';
import {
  AnimatedNumber,
  KineticText,
  MarqueeRibbon,
  PageTransitionCurtain,
  ScrollReveal,
  StaggerGroup,
  StateMorphButton,
  useMotion,
  type MorphButtonStatus,
  type PageTransitionVariant,
} from '../motion/index.js';
export { CartoonStudioTemplate, GameBattleTemplate } from './battle-arena.js';

export function WebLandingTemplate() {
  const { triggerSfx } = useMotion();
  const [ctaStatus, setCtaStatus] = useState<MorphButtonStatus>('idle');
  const [curtainVariant, setCurtainVariant] = useState<PageTransitionVariant>('ink-wipe');
  const [curtainActive, setCurtainActive] = useState(false);

  const handleLaunch = useCallback(() => {
    setCtaStatus('loading');
    window.setTimeout(() => {
      setCtaStatus('success');
      triggerSfx('success-chime');
      window.setTimeout(() => setCtaStatus('idle'), 1600);
    }, 650);
  }, [triggerSfx]);

  const previewCurtain = useCallback(
    (variant: PageTransitionVariant) => {
      setCurtainVariant(variant);
      setCurtainActive(true);
      triggerSfx('drawer-whoosh');
      window.setTimeout(() => setCurtainActive(false), 680);
    },
    [triggerSfx]
  );

  return (
    <div className="mw-ui-template-shell" data-testid="template-web-landing">
      <PageTransitionCurtain active={curtainActive} variant={curtainVariant} label="SCENE SHIFT" />
      <header className="mw-ui-template-hero">
        <div className="mw-ui-template-hero-copy">
          <Badge variant="magenta" size="sm">
            WEB MOTION TEMPLATE
          </Badge>
          <h3 className="mw-ui-template-hero-title">
            <KineticText text="SHIP LIVING INTERFACES" variant="stamp-drop" splitBy="word" />
          </h3>
          <p className="mw-ui-template-hero-lead">
            Zero-Tailwind animated hero built with KineticText, StaggerGroup, MarqueeRibbon, and
            accessible reduced-motion fallbacks.
          </p>
          <div className="mw-ui-template-actions">
            <StateMorphButton
              status={ctaStatus}
              idleLabel="Deploy Starter"
              loadingLabel="Deploying…"
              successLabel="Live on Edge"
              onClick={handleLaunch}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => previewCurtain('ink-wipe')}
            >
              Ink Wipe Transition
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => previewCurtain('iris-circle')}
            >
              Iris Transition
            </Button>
          </div>
        </div>
      </header>

      <MarqueeRibbon
        items={[
          'SPRING PHYSICS',
          '12FPS CARTOON EASING',
          'ZERO TAILWIND CSS',
          'WCAG AA CONTRAST',
          'SSR READY',
          'GAME & WEBTEMPLATES',
        ]}
      />

      <ScrollReveal preset="slide-snap">
        <StaggerGroup preset="pop-in" className="mw-ui-template-bento">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>01 · Kinetic Typography</CardTitle>
              <CardDescription>Word or character stagger with intact screen-reader label.</CardDescription>
            </CardHeader>
            <CardContent>
              <KineticText text="FRAME BY FRAME" variant="wave-bounce" splitBy="word" />
            </CardContent>
          </Card>
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>02 · Motion Profiles</CardTitle>
              <CardDescription>Switch off, subtle, expressive, or cartoon scale globally.</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="cyan" size="sm">
                Respects prefers-reduced-motion
              </Badge>
            </CardContent>
          </Card>
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>03 · Audio Ready</CardTitle>
              <CardDescription>Procedural WebAudio cues opt-in with zero external MP3s.</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="success" size="sm">
                13 Built-in SFX Presets
              </Badge>
            </CardContent>
          </Card>
        </StaggerGroup>
      </ScrollReveal>
    </div>
  );
}

export function AppCommandTemplate() {
  const { triggerSfx } = useMotion();
  const [revenue, setRevenue] = useState(48290);
  const [activeUsers, setActiveUsers] = useState(1428);
  const [latencyMs, setLatencyMs] = useState(34);
  const [syncStatus, setSyncStatus] = useState<MorphButtonStatus>('idle');
  const [tasks, setTasks] = useState([
    { id: 't1', title: 'Publish @moonwitness/ui v1.0.0', status: 'Ready' },
    { id: 't2', title: 'Verify multi-genre skin contrast matrix', status: 'Passed' },
    { id: 't3', title: 'Sync W3C design token artifacts', status: 'Synced' },
  ]);

  const simulatePulse = useCallback(() => {
    triggerSfx('coin-pickup');
    setRevenue((v) => v + 640);
    setActiveUsers((v) => v + 19);
    setLatencyMs((v) => (v <= 24 ? 38 : v - 4));
  }, [triggerSfx]);

  const runSync = useCallback(() => {
    setSyncStatus('loading');
    window.setTimeout(() => {
      setSyncStatus('success');
      triggerSfx('success-chime');
      setTasks((prev) => [
        { id: `t-${Date.now()}`, title: `Synced release snapshot #${prev.length + 1}`, status: 'Live' },
        ...prev.slice(0, 3),
      ]);
      window.setTimeout(() => setSyncStatus('idle'), 1400);
    }, 550);
  }, [triggerSfx]);

  return (
    <div className="mw-ui-template-shell" data-testid="template-app-command">
      <div className="mw-ui-template-app-bar">
        <div>
          <Badge variant="cyan" size="sm">
            APP / SAAS MOTION SHELL
          </Badge>
          <h3 className="mw-ui-template-section-title">Command Workspace</h3>
        </div>
        <div className="mw-ui-template-actions">
          <Button size="sm" variant="outline" onClick={simulatePulse}>
            Simulate Live Tick
          </Button>
          <StateMorphButton
            status={syncStatus}
            idleLabel="Sync Workspace"
            loadingLabel="Syncing…"
            successLabel="Synced"
            onClick={runSync}
          />
          <Sheet>
            <SheetTrigger asChild>
              <Button size="sm" variant="default">
                Open Inspector
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Workspace Inspector</SheetTitle>
                <SheetDescription>
                  Standalone CSS Sheet drawer with zero Tailwind dependency and smooth slide motion.
                </SheetDescription>
              </SheetHeader>
              <div className="mw-ui-template-inspector-body">
                <p>Active sessions: {activeUsers}</p>
                <p>Current p95 latency: {latencyMs} ms</p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <StaggerGroup preset="pop-in" className="mw-ui-template-kpi-grid">
        <Card variant="elevated">
          <CardHeader>
            <CardDescription>Monthly Recurring</CardDescription>
            <CardTitle>
              <AnimatedNumber value={revenue} prefix="$" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card variant="elevated">
          <CardHeader>
            <CardDescription>Active Operators</CardDescription>
            <CardTitle>
              <AnimatedNumber value={activeUsers} />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card variant="elevated">
          <CardHeader>
            <CardDescription>Edge Latency</CardDescription>
            <CardTitle>
              <AnimatedNumber value={latencyMs} suffix=" ms" />
            </CardTitle>
          </CardHeader>
        </Card>
      </StaggerGroup>

      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">Dispatch Queue ({tasks.length})</TabsTrigger>
          <TabsTrigger value="telemetry">Motion Telemetry</TabsTrigger>
        </TabsList>
        <TabsContent value="queue">
          <ul className="mw-ui-template-list">
            {tasks.map((task) => (
              <li key={task.id} className="mw-ui-template-list-item">
                <span>{task.title}</span>
                <Badge size="sm" variant="success">
                  {task.status}
                </Badge>
              </li>
            ))}
          </ul>
        </TabsContent>
        <TabsContent value="telemetry">
          <p className="mw-ui-template-hero-lead">
            All numeric KPI counters, tabs, and overlays honor global MotionProfile and
            prefers-reduced-motion automatically.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
