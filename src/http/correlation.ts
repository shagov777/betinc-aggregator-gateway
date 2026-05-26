import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export const correlationIdHeader = "x-correlation-id";

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header(correlationIdHeader);
  const correlationId = incoming && incoming.trim().length > 0 ? incoming : randomUUID();

  req.correlationId = correlationId;
  res.setHeader(correlationIdHeader, correlationId);

  next();
}
