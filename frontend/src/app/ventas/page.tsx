"use client";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Search, ShoppingCart, Download, RefreshCw, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NuevaVentaModal } from "@/components/ventas/NuevaVentaModal";
import { ventasApi, reportesApi, descargarArchivo } from "@/lib/api";
import { formatCurrency, formatDatetime } from "@/lib/utils";
import type { Venta } from "@/types";

const ESTADO_MAP = {
  COMPLETADA: { label: "Completada", variant: "success" as const },
  CANCELADA: { label: "Cancelada", variant: "destructive" as const },
  PENDIENTE: { label: "Pendiente", variant: "warning" as const },
};

const METODO_MAP: Record<string, string> = {
  efectivo: "💵 Efectivo",
  tarjeta: "💳 Tarjeta",
  transferencia: "🏦 Transferencia",
  credito: "📋 Crédito",
};

export default function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("__all__");
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [modalOpen, setModalOpen] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [ventaDetalle, setVentaDetalle] = useState<Venta | null>(null);

  const fetchVentas = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 20 };
      if (search) params.search = search;
      if (estado && estado !== "__all__") params.estado = estado;
      const r = await ventasApi.getAll(params);
      setVentas(r.data.data);
      setPagination(r.data.pagination);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, estado]);

  useEffect(() => { fetchVentas(1); }, [fetchVentas]);

  const handleCancelar = async (venta: Venta) => {
    const motivo = prompt("Motivo de cancelación (opcional):");
    if (motivo === null) return;
    try {
      await ventasApi.cancelar(venta.id, motivo);
      toast.success("Venta cancelada. Stock restaurado.");
      fetchVentas(pagination.page);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleEliminar = async (venta: Venta) => {
    if (!confirm(`¿Eliminar permanentemente la venta ${venta.folio}? Esta acción no se puede deshacer.`)) return;
    try {
      await ventasApi.eliminar(venta.id);
      toast.success("Venta eliminada correctamente");
      if (ventaDetalle?.id === venta.id) setVentaDetalle(null);
      fetchVentas(pagination.page);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleExport = async () => {
    setExportando(true);
    try {
      const r = await reportesApi.exportarVentas();
      descargarArchivo(r.data, `ventas-${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Ventas exportadas correctamente");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ventas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{pagination.total} registros</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exportando}>
            <Download className="w-4 h-4 mr-1.5" />
            {exportando ? "Exportando..." : "Exportar"}
          </Button>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />Nueva venta
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por folio, cliente..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={estado} onValueChange={setEstado}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los estados</SelectItem>
            <SelectItem value="COMPLETADA">Completada</SelectItem>
            <SelectItem value="PENDIENTE">Pendiente</SelectItem>
            <SelectItem value="CANCELADA">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => fetchVentas(1)}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Folio</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Productos</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Método</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Fecha</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/30">
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                        ))}
                      </tr>
                    ))
                  : ventas.map((v) => {
                      const estadoInfo = ESTADO_MAP[v.estado];
                      return (
                        <motion.tr
                          key={v.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer"
                          onClick={() => setVentaDetalle(v)}
                        >
                          <td className="px-5 py-3">
                            <code className="text-xs font-medium bg-muted px-2 py-0.5 rounded-md">{v.folio}</code>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <p className="font-medium truncate max-w-[160px]">{v.clienteNombre || "Público general"}</p>
                            {v.clienteEmail && <p className="text-xs text-muted-foreground truncate max-w-[160px]">{v.clienteEmail}</p>}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <div className="text-xs text-muted-foreground">
                              {v.detalles.slice(0, 2).map((d, i) => (
                                <p key={i} className="truncate max-w-[160px]">{d.cantidad}x {d.producto.nombre}</p>
                              ))}
                              {v.detalles.length > 2 && <p className="text-primary">+{v.detalles.length - 2} más</p>}
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell text-sm">{METODO_MAP[v.metodoPago] || v.metodoPago}</td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {formatCurrency(Number(v.total))}
                            {Number(v.descuento) > 0 && (
                              <p className="text-xs text-muted-foreground">-{formatCurrency(Number(v.descuento))}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={estadoInfo.variant} className="text-xs">{estadoInfo.label}</Badge>
                          </td>
                          <td className="px-4 py-3 hidden xl:table-cell text-xs text-muted-foreground">
                            {formatDatetime(v.createdAt)}
                          </td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              {v.estado === "COMPLETADA" && (
                                <Button variant="ghost" size="icon-sm" onClick={() => handleCancelar(v)}
                                  className="hover:text-amber-500 hover:bg-amber-50" title="Cancelar venta">
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon-sm" onClick={() => handleEliminar(v)}
                                className="hover:text-red-500 hover:bg-red-50" title="Eliminar venta">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
              </tbody>
            </table>

            {!loading && ventas.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
                <p className="font-medium">No se encontraron ventas</p>
              </div>
            )}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground">Mostrando {ventas.length} de {pagination.total}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => fetchVentas(pagination.page - 1)}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchVentas(pagination.page + 1)}>Siguiente</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalle venta */}
      {ventaDetalle && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={() => setVentaDetalle(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div>
                <h3 className="font-semibold">{ventaDetalle.folio}</h3>
                <p className="text-xs text-muted-foreground">{formatDatetime(ventaDetalle.createdAt)}</p>
              </div>
              <Badge variant={ESTADO_MAP[ventaDetalle.estado].variant}>{ESTADO_MAP[ventaDetalle.estado].label}</Badge>
            </div>
            <div className="p-5 space-y-4">
              {ventaDetalle.clienteNombre && (
                <div>
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="font-medium">{ventaDetalle.clienteNombre}</p>
                  {ventaDetalle.clienteEmail && <p className="text-sm text-muted-foreground">{ventaDetalle.clienteEmail}</p>}
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Productos</p>
                <div className="space-y-2">
                  {ventaDetalle.detalles.map((d) => (
                    <div key={d.id} className="flex items-center justify-between text-sm">
                      <span className="truncate flex-1">{d.cantidad}x {d.producto.nombre}</span>
                      <span className="font-medium ml-2">{formatCurrency(Number(d.subtotal))}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span><span>{formatCurrency(Number(ventaDetalle.subtotal))}</span>
                </div>
                {Number(ventaDetalle.descuento) > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Descuento</span><span>-{formatCurrency(Number(ventaDetalle.descuento))}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-1">
                  <span>Total</span><span>{formatCurrency(Number(ventaDetalle.total))}</span>
                </div>
                <p className="text-xs text-muted-foreground">{METODO_MAP[ventaDetalle.metodoPago] || ventaDetalle.metodoPago}</p>
              </div>
            </div>
            <div className="px-5 pb-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setVentaDetalle(null)}>Cerrar</Button>
              <Button variant="destructive" size="sm" onClick={() => handleEliminar(ventaDetalle)}>
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />Eliminar
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      <NuevaVentaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => { fetchVentas(1); setModalOpen(false); }}
      />
    </div>
  );
}
