import { Router, type Request, type Response } from "express";
import type { AppConfig } from "../config/env.js";

export function createHealthRouter(config: Pick<AppConfig, "serviceName" | "nodeEnv">): Router {
  const router = Router();

  router.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      service: config.serviceName,
      environment: config.nodeEnv
    });
  });

  return router;
}
