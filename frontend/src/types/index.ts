// ─── Producto ─────────────────────────────────────────
export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  sku: string;
  categoria: string;
  marca: string;
  modelo?: string;
  precioCompra: number;
  precioVenta: number;
  stock: number;
  stockMinimo: number;
  imagen?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Venta ────────────────────────────────────────────
export type EstadoVenta = "COMPLETADA" | "CANCELADA" | "PENDIENTE";
export type MetodoPago = "efectivo" | "tarjeta" | "transferencia" | "credito";

export interface DetalleVenta {
  id: number;
  ventaId: number;
  productoId: number;
  cantidad: number;
  precioUnit: number;
  subtotal: number;
  producto: Pick<Producto, "nombre" | "sku" | "imagen" | "categoria">;
}

export interface Venta {
  id: number;
  folio: string;
  clienteNombre?: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  subtotal: number;
  descuento: number;
  total: number;
  metodoPago: MetodoPago;
  estado: EstadoVenta;
  notas?: string;
  createdAt: string;
  updatedAt: string;
  detalles: DetalleVenta[];
}

// ─── Gasto ────────────────────────────────────────────
export interface Gasto {
  id: number;
  concepto: string;
  descripcion?: string;
  categoria: string;
  monto: number;
  fecha: string;
  proveedor?: string;
  comprobante?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Dashboard ────────────────────────────────────────
export interface DashboardKPIs {
  totalVentasMes: number;
  totalVentasMesAnterior: number;
  crecimientoVentas: number;
  totalGastosMes: number;
  totalGastosMesAnterior: number;
  crecimientoGastos: number;
  gananciasMes: number;
  totalVentasHistorico: number;
  totalGastosHistorico: number;
  gananciasHistorico: number;
  totalInvertidoInventario: number;
  valorInventarioVenta: number;
  productosConBajoStock: number;
  totalPedidosMes: number;
  totalProductos: number;
}

export interface ProductoMasVendido {
  productoId: number;
  nombre: string;
  sku: string;
  categoria: string;
  cantidadVendida: number;
  totalGenerado: number;
}

export interface VentaPorMes {
  mes: string;
  ventas: number;
  gastos: number;
  pedidos: number;
}

export interface VentaPorCategoria {
  categoria: string;
  total: number;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  productosMasVendidos: ProductoMasVendido[];
  ventasPorMes: VentaPorMes[];
  ventasPorCategoria: VentaPorCategoria[];
  ultimasVentas: {
    id: number;
    folio: string;
    clienteNombre?: string;
    total: number;
    metodoPago: string;
    estado: EstadoVenta;
    fecha: string;
    items: number;
  }[];
}

// ─── API Response ─────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  meta?: Record<string, any>;
}

// ─── Carrito de venta ─────────────────────────────────
export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
  subtotal: number;
}
