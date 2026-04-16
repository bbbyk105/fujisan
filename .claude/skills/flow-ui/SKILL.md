---
name: flow-ui
description: Invoke when building, animating, or modifying the living flowchart UI (FlowCanvas) on the Command Center home page. Use when the user asks for "flow diagram", "flowchart", "data flow", "node connections", "動的フロー", "常に変わる", or when adding/removing/reconnecting nodes in the top dashboard view.
---

# FlowCanvas — Living Flowchart Skill

The Command Center home page uses a custom SVG flowchart (`FlowCanvas.tsx`) that visualizes the user's products, workflows, and real-time state.

## Mental Model

The canvas is a **living nervous system**:
- **Nodes** = products / capabilities / stages
- **Edges** = data dependency or trigger flow (always directional)
- **Pulses** = runtime events (email received, schedule fired, build deployed)
- **Status ring** = current state of a node (idle / active / error / success)

It should feel alive — nodes breathe, edges pulse, data flows — without being distracting.

## Architecture

```
FlowCanvas
├── <svg viewBox="0 0 1200 600">
│   ├── <defs> — gradients, markers, filters
│   ├── Edges layer (<path> + <animateMotion> dots)
│   ├── Nodes layer (<g> with circle + label)
│   └── Overlay layer (tooltips, badges)
└── React state: nodes, edges, events[]
```

## Node Schema

```ts
interface FlowNode {
  id: string;
  label: string;
  kind: 'source' | 'process' | 'sink' | 'ai' | 'user';
  x: number;  // 0-1200
  y: number;  // 0-600
  status: 'idle' | 'active' | 'success' | 'error';
  productId?: string;  // link to Product in store
  metric?: { value: string; unit?: string };
}
```

## Edge Schema

```ts
interface FlowEdge {
  id: string;
  from: string;  // node id
  to: string;    // node id
  kind: 'data' | 'trigger' | 'auth';
  flowing?: boolean;  // currently transmitting
}
```

## Motion Rules

1. **Idle nodes breathe**: 3s cycle, opacity 0.85 → 1.0
2. **Active nodes pulse**: 1.2s ring animation, accent color
3. **Edges with `flowing: true`**: animated dot travels from → to, 2s duration
4. **State transitions**: 400ms cross-fade between status colors
5. **Layout changes**: use `<animateTransform>` for smooth node re-positioning when the graph mutates

## Status Colors (from design-system)

| Status  | Color                         |
|---------|-------------------------------|
| idle    | `ink-400` (#7a7a82)           |
| active  | `accent` (#c9a96a) — pulsing  |
| success | `emerald-400` (#34d399)       |
| error   | `#e56b6f`                     |

## Sample Graph (Command Center initial layout)

```
  [Gmail]───┐
            ├──→ [AI Classify]──→ [Auto Reply]──→ [Gmail Send]
  [Calendar]┘         │
       │              ↓
       └──→ [Schedule Sync]──→ [Slack Notify]
                 │
  [Projects]─────┤
                 ↓
           [Automation Engine]──→ [Logs / Dashboard]
```

## Live Event Stream

The canvas subscribes to an in-memory event stream (`useFlowEvents`) that fires simulated (or real) events every 3–8 seconds:

```ts
{ type: 'mail.received', nodeId: 'gmail' }
{ type: 'schedule.fired', nodeId: 'calendar' }
{ type: 'deploy.success', nodeId: 'fuji-sake-site' }
```

Each event:
1. Briefly lights up the source node (status → active)
2. Triggers edge flow along outgoing edges
3. Propagates to downstream nodes with a delay proportional to edge distance
4. Returns to idle after 1.5s

## Adding / Removing Nodes

When the user adds a product via the "+ 新規" menu, the flowchart should:
1. Compute a new layout position (prefer right-side column, below lowest existing y)
2. Animate the new node in with `animate-fade-in` (scale 0.8 → 1.0)
3. If the new product declares dependencies, draw edges with a brief "wiring up" animation

Use `framer-motion`? No — stick to CSS + SVG native animations. One less dependency.

## Interactions

- **Click node** → select product in store (`setSelectedNode('product:id', 'product', id)`)
- **Hover node** → show metric tooltip
- **Hover edge** → show event count + last-fired timestamp
- **Drag** (future) → reposition + persist

## Performance Budget

- < 16ms per frame (60 fps)
- Max 50 nodes before switching to canvas/WebGL
- Debounce event handlers to 100ms

## Accessibility

- Each node has `role="button"` and `aria-label={label + status}`
- Edges are `aria-hidden="true"` (decorative)
- Keyboard: Tab through nodes, Enter to select

## File Locations

- `command-center/src/components/FlowCanvas.tsx` — main component
- `command-center/src/lib/flow-layout.ts` — layout algorithm
- `command-center/src/lib/flow-events.ts` — event stream simulator / subscriber
- `command-center/src/lib/flow-data.ts` — initial nodes and edges definition
