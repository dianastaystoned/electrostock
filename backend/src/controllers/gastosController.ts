import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
import { createError } from "../middleware/errorHandler";

export const getGastos = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      search,
      categoria,
      fechaDesde,
      fechaHasta,
      page = "1",
      limit = "20",
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      where.OR = [
        { concepto: { contains: search as string } },
        { proveedor: { contains: search as string } },
        { descripcion: { contains: search as string } },
      ];
    }
    if (categoria) where.categoria = categoria as string;
    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) where.fecha.gte = new Date(fechaDesde as string);
      if (fechaHasta) {
        const hasta = new Date(fechaHasta as string);
        hasta.setHours(23, 59, 59, 999);
        where.fecha.lte = hasta;
      }
    }

    const [gastos, total] = await Promise.all([
      prisma.gasto.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { fecha: "desc" },
      }),
      prisma.gasto.count({ where }),
    ]);

    // Sumar total del período
    const totalPeriodo = await prisma.gasto.aggregate({
      _sum: { monto: true },
      where,
    });

    res.json({
      success: true,
      data: gastos,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
      meta: {
        totalPeriodo: Number(totalPeriodo._sum.monto || 0),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getGastoById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const gasto = await prisma.gasto.findUnique({
      where: { id: parseInt(id) },
    });

    if (!gasto) throw createError("Gasto no encontrado", 404);

    res.json({ success: true, data: gasto });
  } catch (error) {
    next(error);
  }
};

export const crearGasto = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { concepto, descripcion, categoria, monto, fecha, proveedor, comprobante } =
      req.body;

    const gasto = await prisma.gasto.create({
      data: {
        concepto,
        descripcion: descripcion || null,
        categoria,
        monto: parseFloat(monto),
        fecha: new Date(fecha),
        proveedor: proveedor || null,
        comprobante: comprobante || null,
      },
    });

    res.status(201).json({
      success: true,
      data: gasto,
      message: "Gasto registrado exitosamente",
    });
  } catch (error) {
    next(error);
  }
};

export const actualizarGasto = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { concepto, descripcion, categoria, monto, fecha, proveedor, comprobante } =
      req.body;

    const existente = await prisma.gasto.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existente) throw createError("Gasto no encontrado", 404);

    const gasto = await prisma.gasto.update({
      where: { id: parseInt(id) },
      data: {
        ...(concepto !== undefined && { concepto }),
        ...(descripcion !== undefined && { descripcion }),
        ...(categoria !== undefined && { categoria }),
        ...(monto !== undefined && { monto: parseFloat(monto) }),
        ...(fecha !== undefined && { fecha: new Date(fecha) }),
        ...(proveedor !== undefined && { proveedor }),
        ...(comprobante !== undefined && { comprobante }),
      },
    });

    res.json({
      success: true,
      data: gasto,
      message: "Gasto actualizado exitosamente",
    });
  } catch (error) {
    next(error);
  }
};

export const eliminarGasto = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const gasto = await prisma.gasto.findUnique({
      where: { id: parseInt(id) },
    });
    if (!gasto) throw createError("Gasto no encontrado", 404);

    await prisma.gasto.delete({ where: { id: parseInt(id) } });

    res.json({ success: true, message: "Gasto eliminado exitosamente" });
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
    const categorias = await prisma.gasto.findMany({
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

export const getResumenMensual = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { año } = req.query;
    const añoNum = parseInt(año as string) || new Date().getFullYear();

    const meses = [];
    for (let mes = 0; mes < 12; mes++) {
      const inicio = new Date(añoNum, mes, 1);
      const fin = new Date(añoNum, mes + 1, 0, 23, 59, 59);

      const resultado = await prisma.gasto.aggregate({
        _sum: { monto: true },
        _count: { id: true },
        where: { fecha: { gte: inicio, lte: fin } },
      });

      const porCategoria = await prisma.gasto.groupBy({
        by: ["categoria"],
        _sum: { monto: true },
        where: { fecha: { gte: inicio, lte: fin } },
      });

      meses.push({
        mes: inicio.toLocaleString("es-MX", { month: "long" }),
        mesNum: mes + 1,
        total: Number(resultado._sum.monto || 0),
        cantidad: resultado._count.id,
        porCategoria: porCategoria.map((c) => ({
          categoria: c.categoria,
          total: Number(c._sum.monto || 0),
        })),
      });
    }

    res.json({ success: true, data: meses });
  } catch (error) {
    next(error);
  }
};
