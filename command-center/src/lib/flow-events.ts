import { useEffect, useState } from 'react';
import { eventBus, type BusEvent } from './event-bus';
import { initialNodes } from './flow-data';

export interface FlowEvent {
  id: number;
  nodeId: string;
  type: string;
  timestamp: number;
}

const SIMULATED_SOURCES = ['gmail', 'calendar', 'projects'];
const SIMULATED_TYPES: Record<string, string[]> = {
  gmail: ['mail.received', 'mail.classified'],
  calendar: ['schedule.fired', 'event.created'],
  projects: ['task.updated', 'project.progress'],
};

let counter = 0;

function busToFlowEvent(ev: BusEvent): FlowEvent | null {
  // Map ProductId to FlowNode id by productId field
  const node = initialNodes.find((n) => n.productId === ev.source);
  if (!node) return null;
  return {
    id: ++counter,
    nodeId: node.id,
    type: ev.type,
    timestamp: ev.timestamp,
  };
}

/**
 * Yields a unified stream of FlowEvents from:
 * 1. The real event bus (AI assistant, OAuth, real Gmail/Calendar)
 * 2. A background simulator for nodes with no real source connected yet
 *
 * This keeps the canvas alive (breathing + occasional pulses) while
 * faithfully showing real activity when products are wired up.
 */
export function useFlowEvents() {
  const [events, setEvents] = useState<FlowEvent[]>([]);

  // Real event bus subscription
  useEffect(() => {
    return eventBus.subscribe((busEv) => {
      const flowEv = busToFlowEvent(busEv);
      if (flowEv) {
        setEvents((prev) => [...prev.slice(-20), flowEv]);
      }
    });
  }, []);

  // Background simulator (only fires occasionally — real events take priority)
  useEffect(() => {
    let stopped = false;
    function tick() {
      if (stopped) return;
      const nodeId = SIMULATED_SOURCES[Math.floor(Math.random() * SIMULATED_SOURCES.length)];
      const types = SIMULATED_TYPES[nodeId] ?? ['event'];
      const type = types[Math.floor(Math.random() * types.length)];
      const ev: FlowEvent = { id: ++counter, nodeId, type, timestamp: Date.now() };
      setEvents((prev) => [...prev.slice(-20), ev]);
      setTimeout(tick, 3000 + Math.random() * 5000);
    }
    const initial = setTimeout(tick, 1200);
    return () => {
      stopped = true;
      clearTimeout(initial);
    };
  }, []);

  return events;
}
