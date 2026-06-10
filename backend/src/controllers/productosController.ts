import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
import { createError } from "../middleware/errorHandler";
import * as XLSX from "xlsx";

export const getProductos = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      search,
      categoria,
      marca,
      bajoStock,
      page = "1",
      limit = "20",
      orderBy = "nombre",
      order = "asc",
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { activo: true };

    if (search) {
      where.OR = [
        { nombre: { contains: search as string } },
        { sku: { contains: search as string } },
        { marca: { contains: search as string } },
        { modelo: { contains: search as string } },
      ];
    }
    if (categoria) where.categoria = categoria as string;
    if (marca) where.marca = marca as string;
    if (bajoStock === "true") {
      where.stock = { lte: prisma.producto.fields.stockMinimo };
    }

    const validOrderFields = ["nombre", "precio", "stock", "createdAt", "categoria"];
    const orderField = validOrderFields.includes(orderBy as string) ? orderBy as string : "nombre";

    const [productos, total] = await Promise.all([
      prisma.producto.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [orderField]: order as "asc" | "desc" },
      }),
      prisma.producto.count({ where }),
    ]);

    // Calcular productos con bajo stock
    const todosProductos = await prisma.producto.findMany({
      where: { activo: true },
      select: { stock: true, stockMinimo: true },
    });
    const bajoStockCount = todosProductos.filter(p => p.stock <= p.stockMinimo).length;

    res.json({
      success: true,
      data: productos,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
      meta: { bajoStockCount },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductoById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const producto = await prisma.producto.findUnique({
      where: { id: parseInt(id) },
      include: {
        detallesVenta: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            venta: { select: { folio: true, createdAt: true, total: true } },
          },
        },
      },
    });

    if (!producto) throw createError("Producto no encontrado", 404);

    res.json({ success: true, data: producto });
  } catch (error) {
    next(error);
  }
};

export const crearProducto = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      nombre,
      descripcion,
      sku,
      categoria,
      marca,
      modelo,
      precioCompra,
      precioVenta,
      stock,
      stockMinimo,
      imagen,
    } = req.body;

    // Verificar SKU único
    const existente = await prisma.producto.findUnique({ where: { sku } });
    if (existente) throw createError(`Ya existe un producto con SKU: ${sku}`, 409);

    const producto = await prisma.producto.create({
      data: {
        nombre,
        descripcion,
        sku,
        categoria,
        marca,
        modelo,
        precioCompra: parseFloat(precioCompra),
        precioVenta: parseFloat(precioVenta),
        stock: parseInt(stock) || 0,
        stockMinimo: parseInt(stockMinimo) || 5,
        imagen,
      },
    });

    res.status(201).json({ success: true, data: producto, message: "Producto creado exitosamente" });
  } catch (error) {
    next(error);
  }
};

export const actualizarProducto = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      descripcion,
      sku,
      categoria,
      marca,
      modelo,
      precioCompra,
      precioVenta,
      stock,
      stockMinimo,
      imagen,
      activo,
    } = req.body;

    const productoExistente = await prisma.producto.findUnique({
      where: { id: parseInt(id) },
    });
    if (!productoExistente) throw createError("Producto no encontrado", 404);

    // Verificar SKU único si cambió
    if (sku && sku !== productoExistente.sku) {
      const skuExistente = await prisma.producto.findUnique({ where: { sku } });
      if (skuExistente) throw createError(`Ya existe un producto con SKU: ${sku}`, 409);
    }

    const producto = await prisma.producto.update({
      where: { id: parseInt(id) },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(sku !== undefined && { sku }),
        ...(categoria !== undefined && { categoria }),
        ...(marca !== undefined && { marca }),
        ...(modelo !== undefined && { modelo }),
        ...(precioCompra !== undefined && { precioCompra: parseFloat(precioCompra) }),
        ...(precioVenta !== undefined && { precioVenta: parseFloat(precioVenta) }),
        ...(stock !== undefined && { stock: parseInt(stock) }),
        ...(stockMinimo !== undefined && { stockMinimo: parseInt(stockMinimo) }),
        ...(imagen !== undefined && { imagen }),
        ...(activo !== undefined && { activo }),
      },
    });

    res.json({ success: true, data: producto, message: "Producto actualizado exitosamente" });
  } catch (error) {
    next(error);
  }
};

export const eliminarProducto = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const producto = await prisma.producto.findUnique({
      where: { id: parseInt(id) },
    });
    if (!producto) throw createError("Producto no encontrado", 404);

    // Soft delete
    await prisma.producto.update({
      where: { id: parseInt(id) },
      data: { activo: false },
    });

    res.json({ success: true, message: "Producto eliminado exitosamente" });
  } catch (error) {
    next(error);
  }
};

export const getCategorias = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categorias = await prisma.producto.findMany({
      where: { activo: true },
      select: { categoria: true },
      distinct: ["categoria"],
      orderBy: { categoria: "asc" },
    });

    res.json({
      success: true,
      data: categorias.map((c) => c.categoria),
    });
  } catch (error) {
    next(error);
  }
};

export const getMarcas = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const marcas = await prisma.producto.findMany({
      where: { activo: true },
      select: { marca: true },
      distinct: ["marca"],
      orderBy: { marca: "asc" },
    });

    res.json({
      success: true,
      data: marcas.map((m) => m.marca),
    });
  } catch (error) {
    next(error);
  }
};

export const importarExcel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) throw createError("No se recibió archivo Excel", 400);

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet) as any[];

    if (rows.length === 0) throw createError("El archivo Excel está vacío", 400);

    const resultados = {
      creados: 0,
      actualizados: 0,
      errores: [] as string[],
    };

    for (const row of rows) {
      try {
        const sku = String(row["SKU"] || row["sku"] || "").trim();
        if (!sku) {
          resultados.errores.push(`Fila sin SKU: ${JSON.stringify(row)}`);
          continue;
        }

        const data = {
          nombre: String(row["Nombre"] || row["nombre"] || ""),
          descripcion: String(row["Descripcion"] || row["descripcion"] || ""),
          categoria: String(row["Categoria"] || row["categoria"] || "General"),
          marca: String(row["Marca"] || row["marca"] || ""),
          modelo: String(row["Modelo"] || row["modelo"] || ""),
          precioCompra: parseFloat(String(row["Precio Compra"] || row["precioCompra"] || 0)),
          precioVenta: parseFloat(String(row["Precio Venta"] || row["precioVenta"] || 0)),
          stock: parseInt(String(row["Stock"] || row["stock"] || 0)),
          stockMinimo: parseInt(String(row["Stock Minimo"] || row["stockMinimo"] || 5)),
        };

        if (!data.nombre) {
          resultados.errores.push(`SKU ${sku}: Falta el nombre del producto`);
          continue;
        }

        const existente = await prisma.producto.findUnique({ where: { sku } });

        if (existente) {
          await prisma.producto.update({
            where: { sku },
            data: { ...data, activo: true },
          });
          resultados.actualizados++;
        } else {
          await prisma.producto.create({ data: { ...data, sku } });
          resultados.creados++;
        }
      } catch (err: any) {
        resultados.errores.push(`Error en fila: ${err.message}`);
      }
    }

    res.json({
      success: true,
      message: `Importación completada: ${resultados.creados} creados, ${resultados.actualizados} actualizados`,
      data: resultados,
    });
  } catch (error) {
    next(error);
  }
};

export const ajustarStock = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { cantidad, tipo, motivo } = req.body;

    const producto = await prisma.producto.findUnique({
      where: { id: parseInt(id) },
    });
    if (!producto) throw createError("Producto no encontrado", 404);

    const cantidadNum = parseInt(cantidad);

    if (tipo === "entrada") {
      await prisma.producto.update({
        where: { id: parseInt(id) },
        data: { stock: { increment: cantidadNum } },
      });
    } else if (tipo === "salida") {
      if (producto.stock < cantidadNum) {
        throw createError("Stock insuficiente para realizar la salida", 400);
      }
      await prisma.producto.update({
        where: { id: parseInt(id) },
        data: { stock: { decrement: cantidadNum } },
      });
    } else {
      // Ajuste directo
      await prisma.producto.update({
        where: { id: parseInt(id) },
        data: { stock: cantidadNum },
      });
    }

    const productoActualizado = await prisma.producto.findUnique({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      data: productoActualizado,
      message: `Stock ajustado exitosamente. Motivo: ${motivo || "Sin motivo"}`,
    });
  } catch (error) {
    next(error);
  }
};
