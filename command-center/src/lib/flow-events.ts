import { useEffect, useState } from 'react';

export interface FlowEvent {
  id: number;
  nodeId: string;
  type: string;
  timestamp: number;
}

const SOURCE_NODES = ['gmail', 'calendar', 'projects'];
const EVENT_TYPES: Record<string, string[]> = {
  gmail: ['mail.received', 'mail.classified'],
  calendar: ['schedule.fired', 'event.created'],
  projects: ['task.updated', 'project.progress'],
};

let counter = 0;

/**
 * Simulated event stream. In production this would subscribe to a real
 * event bus (Electron IPC, WebSocket, or Google push).
 */
export function useFlowEvents() {
  const [events, setEvents] = useState<FlowEvent[]>([]);

  useEffect(() => {
    let stopped = false;
    function tick() {
      if (stopped) return;
      const nodeId = SOURCE_NODES[Math.floor(Math.random() * SOURCE_NODES.length)];
      const types = EVENT_TYPES[nodeId] ?? ['event'];
      const type = types[Math.floor(Math.random() * types.length)];
      const ev: FlowEvent = { id: ++counter, nodeId, type, timestamp: Date.now() };
      setEvents((prev) => [...prev.slice(-20), ev]);
      // Next event in 2–6 seconds
      setTimeout(tick, 2000 + Math.random() * 4000);
    }
    const initial = setTimeout(tick, 600);
    return () => {
      stopped = true;
      clearTimeout(initial);
    };
  }, []);

  return events;
}
