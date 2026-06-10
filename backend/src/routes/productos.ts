import { Router } from "express";
import multer from "multer";
import {
  getProductos,
  getProductoById,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  getCategorias,
  getMarcas,
  importarExcel,
  ajustarStock,
} from "../controllers/productosController";

const upload = multer({ storage: multer.memoryStorage() });

export const productosRouter = Router();

productosRouter.get("/", getProductos);
productosRouter.get("/categorias", getCategorias);
productosRouter.get("/marcas", getMarcas);
productosRouter.get("/:id", getProductoById);
productosRouter.post("/", crearProducto);
productosRouter.put("/:id", actualizarProducto);
productosRouter.delete("/:id", eliminarProducto);
productosRouter.post("/importar/excel", upload.single("archivo"), importarExcel);
productosRouter.patch("/:id/stock", ajustarStock);
