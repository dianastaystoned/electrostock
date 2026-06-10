import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";

export const getDashboard = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ahora = new Date();
    const inicioMesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    const finMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0, 23, 59, 59);

    // === VENTAS ===
    const [ventasMesActual, ventasMesAnterior, totalVentasHistorico] = await Promise.all([
      prisma.venta.aggregate({
        _sum: { total: true },
        _count: { id: true },
        where: {
          estado: "COMPLETADA",
          createdAt: { gte: inicioMesActual },
        },
      }),
      prisma.venta.aggregate({
        _sum: { total: true },
        _count: { id: true },
        where: {
          estado: "COMPLETADA",
          createdAt: { gte: inicioMesAnterior, lte: finMesAnterior },
        },
      }),
      prisma.venta.aggregate({
        _sum: { total: true },
        _count: { id: true },
        where: { estado: "COMPLETADA" },
      }),
    ]);

    // === GASTOS ===
    const [gastosMesActual, gastosMesAnterior, totalGastosHistorico] = await Promise.all([
      prisma.gasto.aggregate({
        _sum: { monto: true },
        where: { fecha: { gte: inicioMesActual } },
      }),
      prisma.gasto.aggregate({
        _sum: { monto: true },
        where: { fecha: { gte: inicioMesAnterior, lte: finMesAnterior } },
      }),
      prisma.gasto.aggregate({
        _sum: { monto: true },
      }),
    ]);

    // === INVENTARIO ===
    const productos = await prisma.producto.findMany({
      where: { activo: true },
      select: { precioCompra: true, precioVenta: true, stock: true, stockMinimo: true },
    });

    const totalInvertido = productos.reduce(
      (acc, p) => acc + Number(p.precioCompra) * p.stock,
      0
    );
    const totalInventarioValorVenta = productos.reduce(
      (acc, p) => acc + Number(p.precioVenta) * p.stock,
      0
    );
    const productosConBajoStock = productos.filter(
      (p) => p.stock <= p.stockMinimo
    ).length;

    // === PRODUCTOS MÁS VENDIDOS ===
    const productosMasVendidos = await prisma.detalleVenta.groupBy({
      by: ["productoId"],
      _sum: { cantidad: true, subtotal: true },
      orderBy: { _sum: { cantidad: "desc" } },
      take: 5,
    });

    const productosMasVendidosDetalle = await Promise.all(
      productosMasVendidos.map(async (item) => {
        const producto = await prisma.producto.findUnique({
          where: { id: item.productoId },
          select: { nombre: true, sku: true, categoria: true },
        });
        return {
          productoId: item.productoId,
          nombre: producto?.nombre || "Desconocido",
          sku: producto?.sku || "",
          categoria: producto?.categoria || "",
          cantidadVendida: item._sum.cantidad || 0,
          totalGenerado: Number(item._sum.subtotal || 0),
        };
      })
    );

    // === VENTAS POR MES (últimos 6 meses) ===
    const ventasPorMes = [];
    for (let i = 5; i >= 0; i--) {
      const inicio = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const fin = new Date(ahora.getFullYear(), ahora.getMonth() - i + 1, 0, 23, 59, 59);
      const mes = await prisma.venta.aggregate({
        _sum: { total: true },
        _count: { id: true },
        where: {
          estado: "COMPLETADA",
          createdAt: { gte: inicio, lte: fin },
        },
      });
      const gastos = await prisma.gasto.aggregate({
        _sum: { monto: true },
        where: { fecha: { gte: inicio, lte: fin } },
      });
      ventasPorMes.push({
        mes: inicio.toLocaleString("es-MX", { month: "short", year: "numeric" }),
        ventas: Number(mes._sum.total || 0),
        gastos: Number(gastos._sum.monto || 0),
        pedidos: mes._count.id,
      });
    }

    // === VENTAS POR CATEGORÍA ===
    const detallesConProducto = await prisma.detalleVenta.findMany({
      include: {
        producto: { select: { categoria: true } },
        venta: { select: { estado: true } },
      },
    });

    const categorias: Record<string, number> = {};
    detallesConProducto
      .filter((d) => d.venta.estado === "COMPLETADA")
      .forEach((d) => {
        const cat = d.producto.categoria;
        categorias[cat] = (categorias[cat] || 0) + Number(d.subtotal);
      });

    const ventasPorCategoria = Object.entries(categorias)
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total);

    // === ÚLTIMAS VENTAS ===
    const ultimasVentas = await prisma.venta.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        detalles: {
          include: { producto: { select: { nombre: true } } },
        },
      },
    });

    const ventasMesActualNum = Number(ventasMesActual._sum.total || 0);
    const ventasMesAnteriorNum = Number(ventasMesAnterior._sum.total || 0);
    const gastosMesActualNum = Number(gastosMesActual._sum.monto || 0);
    const gastosMesAnteriorNum = Number(gastosMesAnterior._sum.monto || 0);

    const calcCrecimiento = (actual: number, anterior: number) => {
      if (anterior === 0) return actual > 0 ? 100 : 0;
      return ((actual - anterior) / anterior) * 100;
    };

    res.json({
      success: true,
      data: {
        kpis: {
          totalVentasMes: ventasMesActualNum,
          totalVentasMesAnterior: ventasMesAnteriorNum,
          crecimientoVentas: calcCrecimiento(ventasMesActualNum, ventasMesAnteriorNum),
          totalGastosMes: gastosMesActualNum,
          totalGastosMesAnterior: gastosMesAnteriorNum,
          crecimientoGastos: calcCrecimiento(gastosMesActualNum, gastosMesAnteriorNum),
          gananciasMes: ventasMesActualNum - gastosMesActualNum,
          totalVentasHistorico: Number(totalVentasHistorico._sum.total || 0),
          totalGastosHistorico: Number(totalGastosHistorico._sum.monto || 0),
          gananciasHistorico:
            Number(totalVentasHistorico._sum.total || 0) -
            Number(totalGastosHistorico._sum.monto || 0),
          totalInvertidoInventario: totalInvertido,
          valorInventarioVenta: totalInventarioValorVenta,
          productosConBajoStock,
          totalPedidosMes: ventasMesActual._count.id,
          totalProductos: productos.length,
        },
        productosMasVendidos: productosMasVendidosDetalle,
        ventasPorMes,
        ventasPorCategoria,
        ultimasVentas: ultimasVentas.map((v) => ({
          id: v.id,
          folio: v.folio,
          clienteNombre: v.clienteNombre,
          total: Number(v.total),
          metodoPago: v.metodoPago,
          estado: v.estado,
          fecha: v.createdAt,
          items: v.detalles.length,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
