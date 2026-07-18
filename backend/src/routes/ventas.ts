import { Router } from "express";
import { getVentas, getVentaById, crearVenta, cancelarVenta, eliminarVenta, getEstadisticas } from "../controllers/ventasController";

export const ventasRouter = Router();

ventasRouter.get("/", getVentas);
ventasRouter.get("/estadisticas", getEstadisticas);
ventasRouter.get("/:id", getVentaById);
ventasRouter.post("/", crearVenta);
ventasRouter.patch("/:id/cancelar", cancelarVenta);
ventasRouter.delete("/:id", eliminarVenta);
