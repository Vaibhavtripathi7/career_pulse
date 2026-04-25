import { Router } from "express";
import { getMetrices } from "../utils/metrices.js";

const metrices_router = Router();

metrices_router.get("/", (req, res) => {
    res.json(getMetrices());
});

export default metrices_router;