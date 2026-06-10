import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
import * as XLSX from "xlsx";

export const exportarInventario = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const productos = await prisma.producto.findMany({
      where: { activo: true },
      orderBy: { categoria: "asc" },
    });

    const datos = productos.map((p) => ({
      SKU: p.sku,
      Nombre: p.nombre,
      Categoria: p.categoria,
      Marca: p.marca,
      Modelo: p.modelo || "",
      "Precio Compra": Number(p.precioCompra),
      "Precio Venta": Number(p.precioVenta),
      "Margen %": (((Number(p.precioVenta) - Number(p.precioCompra)) / Number(p.precioCompra)) * 100).toFixed(2),
      Stock: p.stock,
      "Stock Minimo": p.stockMinimo,
      "Estado Stock": p.stock <= p.stockMinimo ? "BAJO" : "OK",
      "Valor Inventario": (Number(p.precioCompra) * p.stock).toFixed(2),
      Activo: p.activo ? "Sí" : "No",
      "Fecha Creacion": p.createdAt.toLocaleDateString("es-MX"),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(datos);

    // Ajustar anchos de columna
    ws["!cols"] = [
      { wch: 20 }, { wch: 40 }, { wch: 15 }, { wch: 15 },
      { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 10 },
      { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 16 },
      { wch: 8 }, { wch: 16 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Inventario");

    // Resumen por categoría
    const porCategoria: Record<string, { cantidad: number; valorTotal: number }> = {};
    productos.forEach((p) => {
      if (!porCategoria[p.categoria]) {
        porCategoria[p.categoria] = { cantidad: 0, valorTotal: 0 };
      }
      porCategoria[p.categoria].cantidad++;
      porCategoria[p.categoria].valorTotal += Number(p.precioCompra) * p.stock;
    });

    const resumenCat = Object.entries(porCategoria).map(([cat, data]) => ({
      Categoria: cat,
      "Total Productos": data.cantidad,
      "Valor Inventario": data.valorTotal.toFixed(2),
    }));

    const wsResumen = XLSX.utils.json_to_sheet(resumenCat);
    wsResumen["!cols"] = [{ wch: 20 }, { wch: 16 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen por Categoria");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", `attachment; filename="inventario-${new Date().toISOString().split("T")[0]}.xlsx"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

export const exportarVentas = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;

    const where: any = { estado: "COMPLETADA" };
    if (fechaDesde || fechaHasta) {
      where.createdAt = {};
      if (fechaDesde) where.createdAt.gte = new Date(fechaDesde as string);
      if (fechaHasta) {
        const hasta = new Date(fechaHasta as string);
        hasta.setHours(23, 59, 59, 999);
        where.createdAt.lte = hasta;
      }
    }

    const ventas = await prisma.venta.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        detalles: {
          include: { producto: { select: { nombre: true, sku: true, categoria: true } } },
        },
      },
    });

    // Hoja de ventas
    const datosVentas = ventas.map((v) => ({
      Folio: v.folio,
      Cliente: v.clienteNombre || "Público general",
      Email: v.clienteEmail || "",
      Telefono: v.clienteTelefono || "",
      Subtotal: Number(v.subtotal),
      Descuento: Number(v.descuento),
      Total: Number(v.total),
      "Metodo Pago": v.metodoPago,
      Estado: v.estado,
      "Num Productos": v.detalles.reduce((acc, d) => acc + d.cantidad, 0),
      Fecha: v.createdAt.toLocaleDateString("es-MX"),
      Hora: v.createdAt.toLocaleTimeString("es-MX"),
    }));

    // Detalles de venta
    const datosDetalles: any[] = [];
    ventas.forEach((v) => {
      v.detalles.forEach((d) => {
        datosDetalles.push({
          Folio: v.folio,
          "Fecha Venta": v.createdAt.toLocaleDateString("es-MX"),
          SKU: d.producto.sku,
          Producto: d.producto.nombre,
          Categoria: d.producto.categoria,
          Cantidad: d.cantidad,
          "Precio Unitario": Number(d.precioUnit),
          Subtotal: Number(d.subtotal),
        });
      });
    });

    const wb = XLSX.utils.book_new();

    const wsVentas = XLSX.utils.json_to_sheet(datosVentas);
    wsVentas["!cols"] = [
      { wch: 20 }, { wch: 30 }, { wch: 30 }, { wch: 15 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 },
      { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 10 },
    ];
    XLSX.utils.book_append_sheet(wb, wsVentas, "Ventas");

    const wsDetalles = XLSX.utils.json_to_sheet(datosDetalles);
    wsDetalles["!cols"] = [
      { wch: 20 }, { wch: 12 }, { wch: 20 }, { wch: 40 },
      { wch: 15 }, { wch: 10 }, { wch: 16 }, { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(wb, wsDetalles, "Detalle de Ventas");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", `attachment; filename="ventas-${new Date().toISOString().split("T")[0]}.xlsx"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

export const exportarGastos = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;

    const where: any = {};
    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) where.fecha.gte = new Date(fechaDesde as string);
      if (fechaHasta) {
        const hasta = new Date(fechaHasta as string);
        hasta.setHours(23, 59, 59, 999);
        where.fecha.lte = hasta;
      }
    }

    const gastos = await prisma.gasto.findMany({
      where,
      orderBy: { fecha: "desc" },
    });

    const datos = gastos.map((g) => ({
      ID: g.id,
      Concepto: g.concepto,
      Descripcion: g.descripcion || "",
      Categoria: g.categoria,
      Monto: Number(g.monto),
      Fecha: g.fecha.toLocaleDateString("es-MX"),
      Proveedor: g.proveedor || "",
    }));

    // Resumen por categoría
    const porCategoria: Record<string, number> = {};
    gastos.forEach((g) => {
      porCategoria[g.categoria] = (porCategoria[g.categoria] || 0) + Number(g.monto);
    });

    const resumen = Object.entries(porCategoria).map(([cat, total]) => ({
      Categoria: cat,
      "Total Gastado": total,
      "Porcentaje": ((total / gastos.reduce((a, g) => a + Number(g.monto), 0)) * 100).toFixed(2) + "%",
    }));

    const wb = XLSX.utils.book_new();

    const wsGastos = XLSX.utils.json_to_sheet(datos);
    wsGastos["!cols"] = [
      { wch: 8 }, { wch: 40 }, { wch: 40 }, { wch: 15 },
      { wch: 12 }, { wch: 12 }, { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, wsGastos, "Gastos");

    const wsResumen = XLSX.utils.json_to_sheet(resumen);
    wsResumen["!cols"] = [{ wch: 20 }, { wch: 16 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen por Categoria");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", `attachment; filename="gastos-${new Date().toISOString().split("T")[0]}.xlsx"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

export const getReporteGeneral = async (
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

      const [ventasMes, gastosMes] = await Promise.all([
        prisma.venta.aggregate({
          _sum: { total: true },
          _count: { id: true },
          where: { estado: "COMPLETADA", createdAt: { gte: inicio, lte: fin } },
        }),
        prisma.gasto.aggregate({
          _sum: { monto: true },
          where: { fecha: { gte: inicio, lte: fin } },
        }),
      ]);

      const ventas = Number(ventasMes._sum.total || 0);
      const gastos = Number(gastosMes._sum.monto || 0);

      meses.push({
        mes: inicio.toLocaleString("es-MX", { month: "long" }),
        mesNum: mes + 1,
        ventas,
        gastos,
        ganancia: ventas - gastos,
        pedidos: ventasMes._count.id,
      });
    }

    const totales = meses.reduce(
      (acc, m) => ({
        ventas: acc.ventas + m.ventas,
        gastos: acc.gastos + m.gastos,
        ganancia: acc.ganancia + m.ganancia,
        pedidos: acc.pedidos + m.pedidos,
      }),
      { ventas: 0, gastos: 0, ganancia: 0, pedidos: 0 }
    );

    res.json({
      success: true,
      data: { año: añoNum, meses, totales },
    });
  } catch (error) {
    next(error);
  }
};
