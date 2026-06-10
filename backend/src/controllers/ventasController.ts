import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
import { createError } from "../middleware/errorHandler";

const generarFolio = async (): Promise<string> => {
  const ahora = new Date();
  const año = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");

  const ultimaVenta = await prisma.venta.findFirst({
    where: {
      folio: { startsWith: `VNT-${año}${mes}` },
    },
    orderBy: { id: "desc" },
  });

  let siguiente = 1;
  if (ultimaVenta) {
    const partes = ultimaVenta.folio.split("-");
    siguiente = parseInt(partes[partes.length - 1]) + 1;
  }

  return `VNT-${año}${mes}-${String(siguiente).padStart(4, "0")}`;
};

export const getVentas = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      search,
      estado,
      metodoPago,
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
        { folio: { contains: search as string } },
        { clienteNombre: { contains: search as string } },
        { clienteEmail: { contains: search as string } },
      ];
    }
    if (estado) where.estado = estado as string;
    if (metodoPago) where.metodoPago = metodoPago as string;
    if (fechaDesde || fechaHasta) {
      where.createdAt = {};
      if (fechaDesde) where.createdAt.gte = new Date(fechaDesde as string);
      if (fechaHasta) {
        const hasta = new Date(fechaHasta as string);
        hasta.setHours(23, 59, 59, 999);
        where.createdAt.lte = hasta;
      }
    }

    const [ventas, total] = await Promise.all([
      prisma.venta.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          detalles: {
            include: {
              producto: {
                select: { nombre: true, sku: true, imagen: true },
              },
            },
          },
        },
      }),
      prisma.venta.count({ where }),
    ]);

    res.json({
      success: true,
      data: ventas,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getVentaById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const venta = await prisma.venta.findUnique({
      where: { id: parseInt(id) },
      include: {
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    });

    if (!venta) throw createError("Venta no encontrada", 404);

    res.json({ success: true, data: venta });
  } catch (error) {
    next(error);
  }
};

export const crearVenta = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      clienteNombre,
      clienteEmail,
      clienteTelefono,
      metodoPago,
      descuento = 0,
      notas,
      items,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw createError("La venta debe tener al menos un producto", 400);
    }

    // Verificar stock de todos los productos
    const erroresStock: string[] = [];
    const productosVenta = await Promise.all(
      items.map(async (item: { productoId: number; cantidad: number }) => {
        const producto = await prisma.producto.findUnique({
          where: { id: item.productoId },
        });

        if (!producto) {
          erroresStock.push(`Producto ID ${item.productoId} no encontrado`);
          return null;
        }

        if (!producto.activo) {
          erroresStock.push(`Producto "${producto.nombre}" está inactivo`);
          return null;
        }

        if (producto.stock < item.cantidad) {
          erroresStock.push(
            `Stock insuficiente para "${producto.nombre}": disponible ${producto.stock}, solicitado ${item.cantidad}`
          );
          return null;
        }

        return { producto, cantidad: item.cantidad };
      })
    );

    if (erroresStock.length > 0) {
      throw createError(erroresStock.join("; "), 400);
    }

    // Calcular totales
    let subtotal = 0;
    const detallesData = productosVenta
      .filter((p) => p !== null)
      .map((p) => {
        const itemSubtotal = Number(p!.producto.precioVenta) * p!.cantidad;
        subtotal += itemSubtotal;
        return {
          productoId: p!.producto.id,
          cantidad: p!.cantidad,
          precioUnit: Number(p!.producto.precioVenta),
          subtotal: itemSubtotal,
        };
      });

    const descuentoNum = parseFloat(String(descuento));
    const total = subtotal - descuentoNum;

    if (total < 0) throw createError("El descuento no puede ser mayor al subtotal", 400);

    const folio = await generarFolio();

    // Crear venta y actualizar stock en transacción
    const venta = await prisma.$transaction(async (tx) => {
      const nuevaVenta = await tx.venta.create({
        data: {
          folio,
          clienteNombre: clienteNombre || null,
          clienteEmail: clienteEmail || null,
          clienteTelefono: clienteTelefono || null,
          subtotal,
          descuento: descuentoNum,
          total,
          metodoPago,
          notas: notas || null,
          detalles: {
            create: detallesData,
          },
        },
        include: {
          detalles: {
            include: { producto: true },
          },
        },
      });

      // Actualizar stock
      for (const detalle of detallesData) {
        await tx.producto.update({
          where: { id: detalle.productoId },
          data: { stock: { decrement: detalle.cantidad } },
        });
      }

      return nuevaVenta;
    });

    res.status(201).json({
      success: true,
      data: venta,
      message: `Venta ${folio} registrada exitosamente`,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelarVenta = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const venta = await prisma.venta.findUnique({
      where: { id: parseInt(id) },
      include: { detalles: true },
    });

    if (!venta) throw createError("Venta no encontrada", 404);
    if (venta.estado === "CANCELADA") {
      throw createError("Esta venta ya está cancelada", 400);
    }

    // Cancelar venta y restaurar stock
    await prisma.$transaction(async (tx) => {
      await tx.venta.update({
        where: { id: parseInt(id) },
        data: {
          estado: "CANCELADA",
          notas: motivo
            ? `${venta.notas || ""}\nMotivo de cancelación: ${motivo}`
            : venta.notas,
        },
      });

      // Restaurar stock solo si estaba completada
      if (venta.estado === "COMPLETADA") {
        for (const detalle of venta.detalles) {
          await tx.producto.update({
            where: { id: detalle.productoId },
            data: { stock: { increment: detalle.cantidad } },
          });
        }
      }
    });

    res.json({ success: true, message: "Venta cancelada. Stock restaurado." });
  } catch (error) {
    next(error);
  }
};

export const getEstadisticas = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

    const [ventasHoy, ventasSemana, ventasMes] = await Promise.all([
      prisma.venta.aggregate({
        _sum: { total: true },
        _count: { id: true },
        where: { estado: "COMPLETADA", createdAt: { gte: inicioHoy } },
      }),
      prisma.venta.aggregate({
        _sum: { total: true },
        _count: { id: true },
        where: {
          estado: "COMPLETADA",
          createdAt: {
            gte: new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.venta.aggregate({
        _sum: { total: true },
        _count: { id: true },
        where: {
          estado: "COMPLETADA",
          createdAt: {
            gte: new Date(hoy.getFullYear(), hoy.getMonth(), 1),
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        hoy: {
          total: Number(ventasHoy._sum.total || 0),
          pedidos: ventasHoy._count.id,
        },
        semana: {
          total: Number(ventasSemana._sum.total || 0),
          pedidos: ventasSemana._count.id,
        },
        mes: {
          total: Number(ventasMes._sum.total || 0),
          pedidos: ventasMes._count.id,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
