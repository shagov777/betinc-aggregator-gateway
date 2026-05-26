import { randomUUID } from "node:crypto";
import { redactSensitiveFields } from "../security/redaction.js";
import type { GatewayEvent, GatewayEventInput, GatewayEventQuery, GatewayEventTimeline } from "./eventTypes.js";

export type GatewayEventEmitter = {
  emit(event: GatewayEventInput): GatewayEvent;
  query(filter?: GatewayEventQuery): GatewayEvent[];
  timeline(correlationId: string): GatewayEventTimeline;
  clear(): void;
};

export function createInMemoryGatewayEventEmitter(): GatewayEventEmitter {
  const events: GatewayEvent[] = [];

  return {
    emit(input: GatewayEventInput): GatewayEvent {
      const event: GatewayEvent = {
        ...input,
        id: randomUUID(),
        timestamp: input.timestamp ?? new Date().toISOString(),
        details: redactSensitiveFields(input.details)
      };

      events.push(event);
      return event;
    },

    query(filter: GatewayEventQuery = {}): GatewayEvent[] {
      return events.filter(
        (event) =>
          (filter.correlationId === undefined || event.correlationId === filter.correlationId) &&
          (filter.callbackType === undefined || event.callbackType === filter.callbackType) &&
          (filter.eventType === undefined || event.eventType === filter.eventType)
      );
    },

    timeline(correlationId: string): GatewayEventTimeline {
      return {
        correlationId,
        events: events.filter((event) => event.correlationId === correlationId)
      };
    },

    clear(): void {
      events.splice(0, events.length);
    }
  };
}
