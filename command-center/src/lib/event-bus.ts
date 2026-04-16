/**
 * Centralized event bus for inter-product communication.
 *
 * Any product (Gmail, Calendar, AI, Site, etc.) emits typed events here.
 * Other products subscribe to react to them.
 *
 * The FlowCanvas subscribes to all events to visualize live activity.
 * The Automation Engine subscribes to fire If-Then rules.
 *
 * Replaces the simulator at flow-events.ts when real data is wired in.
 */

import { useEffect, useState } from 'react';

export type ProductId =
  | 'gmail-auto'
  | 'calendar-sync'
  | 'ai-assistant'
  | 'analytics'
  | 'label-designer'
  | 'automation-engine'
  | 'kura-crm'
  | 'fuji-sake-site'
  | 'projects';

export type EventType =
  // Gmail
  | 'mail.received'
  | 'mail.classified'
  | 'mail.replied'
  | 'mail.sent'
  // Calendar
  | 'schedule.fired'
  | 'event.created'
  | 'event.updated'
  // AI
  | 'ai.request'
  | 'ai.response'
  | 'ai.error'
  // Projects
  | 'project.progress'
  | 'task.updated'
  | 'task.completed'
  // Site
  | 'deploy.started'
  | 'deploy.success'
  | 'deploy.failed'
  // Automation
  | 'automation.fired'
  | 'automation.completed';

export interface BusEvent {
  id: number;
  type: EventType;
  source: ProductId;
  target?: ProductId;
  payload?: unknown;
  timestamp: number;
}

type Listener = (event: BusEvent) => void;

class EventBus {
  private listeners = new Set<Listener>();
  private history: BusEvent[] = [];
  private counter = 0;
  private maxHistory = 100;

  emit(type: EventType, source: ProductId, opts: { target?: ProductId; payload?: unknown } = {}) {
    const event: BusEvent = {
      id: ++this.counter,
      type,
      source,
      target: opts.target,
      payload: opts.payload,
      timestamp: Date.now(),
    };
    this.history.push(event);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    this.listeners.forEach((l) => l(event));
    return event;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getHistory(): BusEvent[] {
    return [...this.history];
  }

  clear() {
    this.history = [];
  }
}

export const eventBus = new EventBus();

/**
 * React hook to subscribe to bus events.
 * Returns the rolling event history (capped at 50 in-component).
 */
export function useEventBus(): BusEvent[] {
  const [events, setEvents] = useState<BusEvent[]>(() => eventBus.getHistory());

  useEffect(() => {
    return eventBus.subscribe((ev) => {
      setEvents((prev) => {
        const next = [...prev, ev];
        return next.length > 50 ? next.slice(-50) : next;
      });
    });
  }, []);

  return events;
}

/**
 * Hook for events filtered by type or source.
 */
export function useEventBusFiltered(filter: {
  type?: EventType;
  source?: ProductId;
}): BusEvent[] {
  const all = useEventBus();
  return all.filter((e) => {
    if (filter.type && e.type !== filter.type) return false;
    if (filter.source && e.source !== filter.source) return false;
    return true;
  });
}
