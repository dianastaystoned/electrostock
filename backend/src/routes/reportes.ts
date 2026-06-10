import { Router } from "express";
import {
  exportarInventario,
  exportarVentas,
  exportarGastos,
  getReporteGeneral,
} from "../controllers/reportesController";

export const reportesRouter = Router();

reportesRouter.get("/general", getReporteGeneral);
reportesRouter.get("/exportar/inventario", exportarInventario);
reportesRouter.get("/exportar/ventas", exportarVentas);
reportesRouter.get("/exportar/gastos", exportarGastos);
