'use client';

import { forwardRef, useMemo, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../lib/cn.js';
import { useMotion } from '../motion/index.js';

export interface RadarBlip {
  readonly id: string;
  readonly label: string;
  readonly x: number; // -1..1
  readonly y: number; // -1..1
  readonly kind: 'ally' | 'enemy' | 'boss' | 'objective';
}

export type TacticalRadarProps = ComponentPropsWithoutRef<'section'> & {
  zoneLabel?: string;
  blips: readonly RadarBlip[];
  scanning?: boolean;
};

export const TacticalRadar = forwardRef<HTMLElement, TacticalRadarProps>(function TacticalRadar(
  { zoneLabel = 'SECTOR 07 · ROOFTOP', blips, scanning = true, className, ...props },
  ref
) {
  const { reducedMotion } = useMotion();
  return (
    <section
      ref={ref}
      aria-label={`Tactical radar ${zoneLabel}`}
      data-slot="tactical-radar"
      data-scanning={scanning && !reducedMotion ? 'true' : 'false'}
      className={cn('mw-ui-radar', className)}
      {...props}
    >
      <div className="mw-ui-radar-head">
        <span className="mw-ui-radar-zone">{zoneLabel}</span>
        <span className="mw-ui-radar-count">{blips.length} SIGNALS</span>
      </div>
      <div className="mw-ui-radar-dial">
        <svg viewBox="0 0 140 140" className="mw-ui-radar-svg" aria-hidden="true">
          <circle cx="70" cy="70" r="62" className="mw-ui-radar-ring" />
          <circle cx="70" cy="70" r="41" className="mw-ui-radar-ring" />
          <circle cx="70" cy="70" r="20" className="mw-ui-radar-ring" />
          <line x1="70" y1="8" x2="70" y2="132" className="mw-ui-radar-axis" />
          <line x1="8" y1="70" x2="132" y2="70" className="mw-ui-radar-axis" />
          <path d="M 70 70 L 70 8 A 62 62 0 0 1 114 26 Z" className="mw-ui-radar-sweep" />
          <polygon points="70,63 75,74 70,71 65,74" className="mw-ui-radar-player" />
          {blips.map((blip) => {
            const cx = 70 + Math.max(-0.85, Math.min(0.85, blip.x)) * 56;
            const cy = 70 + Math.max(-0.85, Math.min(0.85, blip.y)) * 56;
            return (
              <g key={blip.id} className="mw-ui-radar-blip" data-kind={blip.kind}>
                <circle cx={cx} cy={cy} r={blip.kind === 'boss' ? 6 : 4} />
              </g>
            );
          })}
        </svg>
        <span className="mw-ui-radar-dir mw-ui-radar-dir-n" aria-hidden="true">N</span>
        <span className="mw-ui-radar-dir mw-ui-radar-dir-e" aria-hidden="true">E</span>
        <span className="mw-ui-radar-dir mw-ui-radar-dir-s" aria-hidden="true">S</span>
        <span className="mw-ui-radar-dir mw-ui-radar-dir-w" aria-hidden="true">W</span>
      </div>
    </section>
  );
});
TacticalRadar.displayName = 'TacticalRadar';

export type SkillNodeState = 'locked' | 'available' | 'unlocked' | 'maxed';

export interface SkillTreeNode {
  readonly id: string;
  readonly label: string;
  readonly cost: number;
  readonly x: number; // 0..100
  readonly y: number; // 0..100
  readonly requires?: readonly string[];
  readonly state: SkillNodeState;
  readonly summary?: string;
}

export type SkillTreeGraphProps = ComponentPropsWithoutRef<'section'> & {
  title?: string;
  availablePoints: number;
  nodes: readonly SkillTreeNode[];
  onUnlockNode?: (node: SkillTreeNode) => void;
};

export const SkillTreeGraph = forwardRef<HTMLElement, SkillTreeGraphProps>(function SkillTreeGraph(
  { title = 'COMBAT SKILL TREE', availablePoints, nodes, onUnlockNode, className, ...props },
  ref
) {
  const { triggerSfx } = useMotion();
  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  const edges = useMemo(() => {
    const list: { from: SkillTreeNode; to: SkillTreeNode; active: boolean }[] = [];
    for (const node of nodes) {
      for (const reqId of node.requires ?? []) {
        const parent = nodeMap.get(reqId);
        if (parent) {
          const active =
            (parent.state === 'unlocked' || parent.state === 'maxed') &&
            (node.state === 'unlocked' || node.state === 'maxed');
          list.push({ from: parent, to: node, active });
        }
      }
    }
    return list;
  }, [nodes, nodeMap]);

  return (
    <section
      ref={ref}
      aria-label={title}
      data-slot="skill-tree-graph"
      className={cn('mw-ui-skill-tree', className)}
      {...props}
    >
      <div className="mw-ui-skill-tree-head">
        <strong>{title}</strong>
        <span className="mw-ui-skill-tree-sp">{availablePoints} SP</span>
      </div>
      <div className="mw-ui-skill-tree-canvas">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mw-ui-skill-tree-edges" aria-hidden="true">
          {edges.map(({ from, to, active }) => (
            <line
              key={`${from.id}-${to.id}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              data-active={active ? 'true' : 'false'}
              className="mw-ui-skill-tree-edge"
            />
          ))}
        </svg>
        {nodes.map((node) => {
          const canUnlock = node.state === 'available' && availablePoints >= node.cost;
          return (
            <button
              key={node.id}
              type="button"
              data-state={node.state}
              disabled={!canUnlock}
              className="mw-ui-skill-node"
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              title={node.summary ?? node.label}
              onClick={() => {
                if (!canUnlock) return;
                triggerSfx('level-up');
                onUnlockNode?.(node);
              }}
            >
              <span className="mw-ui-skill-node-label">{node.label}</span>
              <small className="mw-ui-skill-node-meta">
                {node.state === 'maxed'
                  ? 'MAX'
                  : node.state === 'unlocked'
                    ? 'ON'
                    : `${node.cost} SP`}
              </small>
            </button>
          );
        })}
      </div>
    </section>
  );
});
SkillTreeGraph.displayName = 'SkillTreeGraph';
