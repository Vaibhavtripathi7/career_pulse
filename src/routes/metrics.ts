import { Router } from "express";
import type { Request, Response } from "express";
import { register } from "../utils/metrics.js";

const metrices_router = Router();

metrices_router.get("/", async (req: Request, res: Response) => {
  res.set("Content-Type", register.contentType);
  res.send(await register.metrics());
});

export default metrices_router;
