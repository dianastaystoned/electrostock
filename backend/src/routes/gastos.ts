import { Router } from "express";
import {
  getGastos,
  getGastoById,
  crearGasto,
  actualizarGasto,
  eliminarGasto,
  getCategorias,
  getResumenMensual,
} from "../controllers/gastosController";

export const gastosRouter = Router();

gastosRouter.get("/", getGastos);
gastosRouter.get("/categorias", getCategorias);
gastosRouter.get("/resumen-mensual", getResumenMensual);
gastosRouter.get("/:id", getGastoById);
gastosRouter.post("/", crearGasto);
gastosRouter.put("/:id", actualizarGasto);
gastosRouter.delete("/:id", eliminarGasto);
