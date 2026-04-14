import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import {
  initialNodes,
  initialEdges,
  type FlowNode,
  type FlowStatus,
} from '@/lib/flow-data';
import { useFlowEvents } from '@/lib/flow-events';

const W = 1200;
const H = 560;

function statusColor(s: FlowStatus) {
  switch (s) {
    case 'active':
      return '#c9a96a';
    case 'success':
      return '#34d399';
    case 'error':
      return '#e56b6f';
    default:
      return '#7a7a82';
  }
}

function kindRing(kind: FlowNode['kind']) {
  switch (kind) {
    case 'source':
      return '#6aa4c9';
    case 'ai':
      return '#b68aff';
    case 'process':
      return '#c9a96a';
    case 'sink':
      return '#34d399';
    case 'user':
      return '#eaeaee';
  }
}

/**
 * Build an SVG path between two nodes with a smooth horizontal curve.
 */
function edgePath(a: FlowNode, b: FlowNode) {
  const mx = (a.x + b.x) / 2;
  return `M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`;
}

function downstream(edges: typeof initialEdges, nodeId: string): string[] {
  return edges.filter((e) => e.from === nodeId).map((e) => e.to);
}

export function FlowCanvas() {
  const { setSelectedNode } = useStore();
  const [nodeStatus, setNodeStatus] = useState<Record<string, FlowStatus>>({});
  const [flowingEdges, setFlowingEdges] = useState<Set<string>>(new Set());
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const events = useFlowEvents();

  const edges = initialEdges;
  const nodes = initialNodes;

  // React to each new event: light up the node + propagate through edges
  useEffect(() => {
    if (events.length === 0) return;
    const latest = events[events.length - 1];
    const chain = [latest.nodeId, ...downstream(edges, latest.nodeId)];

    chain.forEach((nodeId, idx) => {
      setTimeout(() => {
        setNodeStatus((s) => ({ ...s, [nodeId]: 'active' }));
        // Mark outgoing edges as flowing
        const outEdges = edges.filter((e) => e.from === nodeId);
        if (outEdges.length) {
          setFlowingEdges((prev) => {
            const next = new Set(prev);
            outEdges.forEach((e) => next.add(e.id));
            return next;
          });
          // Fade edges after 2s
          setTimeout(() => {
            setFlowingEdges((prev) => {
              const next = new Set(prev);
              outEdges.forEach((e) => next.delete(e.id));
              return next;
            });
          }, 2000);
        }
        // Return node to success briefly, then idle
        setTimeout(() => {
          setNodeStatus((s) => ({ ...s, [nodeId]: 'success' }));
        }, 1200);
        setTimeout(() => {
          setNodeStatus((s) => ({ ...s, [nodeId]: 'idle' }));
        }, 2400);
      }, idx * 600);
    });
  }, [events, edges]);

  const nodeById = useMemo(
    () => Object.fromEntries(nodes.map((n) => [n.id, n])),
    [nodes],
  );

  return (
    <div className="relative w-full h-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="edge-idle" x1="0" x2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.12)" />
          </linearGradient>
          <linearGradient id="edge-flow" x1="0" x2="1">
            <stop offset="0%" stopColor="#c9a96a" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#c9a96a" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#c9a96a" stopOpacity="0.2" />
          </linearGradient>
          <radialGradient id="node-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#c9a96a" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#c9a96a" stopOpacity="0" />
          </radialGradient>
          <filter id="soft-glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid background (very subtle) */}
        <g opacity="0.04">
          {Array.from({ length: Math.floor(W / 40) }).map((_, i) => (
            <line key={`v${i}`} x1={i * 40} y1={0} x2={i * 40} y2={H} stroke="#fff" strokeWidth="1" />
          ))}
          {Array.from({ length: Math.floor(H / 40) }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 40} x2={W} y2={i * 40} stroke="#fff" strokeWidth="1" />
          ))}
        </g>

        {/* Edges */}
        <g>
          {edges.map((e) => {
            const a = nodeById[e.from];
            const b = nodeById[e.to];
            if (!a || !b) return null;
            const d = edgePath(a, b);
            const flowing = flowingEdges.has(e.id);
            return (
              <g key={e.id}>
                <path
                  d={d}
                  fill="none"
                  stroke={flowing ? 'url(#edge-flow)' : 'url(#edge-idle)'}
                  strokeWidth={flowing ? 2 : 1.25}
                  style={{
                    transition: 'stroke-width 300ms ease-out',
                  }}
                />
                {flowing && (
                  <circle r="3" fill="#c9a96a" filter="url(#soft-glow)">
                    <animateMotion dur="1.4s" repeatCount="2" path={d} />
                  </circle>
                )}
              </g>
            );
          })}
        </g>

        {/* Nodes */}
        <g>
          {nodes.map((n) => {
            const status = nodeStatus[n.id] ?? n.status;
            const color = statusColor(status);
            const ring = kindRing(n.kind);
            const active = status !== 'idle';
            const hovered = hoveredNode === n.id;

            return (
              <g
                key={n.id}
                transform={`translate(${n.x}, ${n.y})`}
                onClick={() => {
                  if (n.productId) {
                    setSelectedNode(`product:${n.productId}`, 'product', n.productId);
                  }
                }}
                onMouseEnter={() => setHoveredNode(n.id)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: n.productId ? 'pointer' : 'default' }}
                role={n.productId ? 'button' : undefined}
                aria-label={`${n.label} — ${status}`}
              >
                {/* Glow halo when active */}
                {active && <circle r="40" fill="url(#node-glow)" />}

                {/* Pulse ring */}
                {active && (
                  <circle
                    r="22"
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    opacity="0.6"
                  >
                    <animate
                      attributeName="r"
                      from="22"
                      to="36"
                      dur="1.4s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      from="0.6"
                      to="0"
                      dur="1.4s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Outer ring (kind color) */}
                <circle
                  r="20"
                  fill="rgba(10,10,15,0.9)"
                  stroke={ring}
                  strokeWidth={hovered ? 2 : 1}
                  opacity={hovered ? 1 : 0.55}
                  style={{ transition: 'all 200ms ease-out' }}
                />

                {/* Inner disc (status) */}
                <circle
                  r="8"
                  fill={color}
                  opacity={active ? 1 : 0.6}
                  style={{ transition: 'fill 300ms ease-out, opacity 300ms ease-out' }}
                />

                {/* Breathing for idle */}
                {!active && (
                  <circle r="8" fill={color} opacity="0.3">
                    <animate
                      attributeName="r"
                      values="8;11;8"
                      dur="3s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.3;0;0.3"
                      dur="3s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Label */}
                <text
                  y="44"
                  textAnchor="middle"
                  fill="#eaeaee"
                  fontSize="13"
                  fontWeight="500"
                  style={{ pointerEvents: 'none' }}
                >
                  {n.label}
                </text>

                {/* Metric */}
                {n.metric && (
                  <text
                    y="60"
                    textAnchor="middle"
                    fill="#7a7a82"
                    fontSize="10"
                    style={{ pointerEvents: 'none' }}
                  >
                    {n.metric.value} {n.metric.unit ?? ''}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* Legend */}
        <g transform={`translate(20, ${H - 30})`}>
          <LegendItem x={0} color={kindRing('source')} label="Source" />
          <LegendItem x={90} color={kindRing('ai')} label="AI" />
          <LegendItem x={140} color={kindRing('process')} label="Process" />
          <LegendItem x={220} color={kindRing('sink')} label="Output" />
        </g>
      </svg>

      {/* Live event ticker */}
      <EventTicker events={events} />
    </div>
  );
}

function LegendItem({ x, color, label }: { x: number; color: string; label: string }) {
  return (
    <g transform={`translate(${x}, 0)`}>
      <circle r="4" fill={color} />
      <text x="10" y="4" fill="#7a7a82" fontSize="10">
        {label}
      </text>
    </g>
  );
}

function EventTicker({ events }: { events: ReturnType<typeof useFlowEvents> }) {
  const latest = events.slice(-3).reverse();
  return (
    <div className="absolute top-3 right-3 flex flex-col gap-1 pointer-events-none">
      {latest.map((e, idx) => (
        <div
          key={e.id}
          className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-ink-900/80 border border-white/5 backdrop-blur text-[10px] text-ink-300 animate-slide-up"
          style={{ opacity: 1 - idx * 0.3 }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="font-mono">{e.type}</span>
          <span className="text-ink-400">{e.nodeId}</span>
        </div>
      ))}
    </div>
  );
}
