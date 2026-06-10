import { Router } from "express";
import { getDashboard } from "../controllers/dashboardController";

export const dashboardRouter = Router();

dashboardRouter.get("/", getDashboard);
