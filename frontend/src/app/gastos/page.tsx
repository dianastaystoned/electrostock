"use client";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Download, RefreshCw, Pencil, Trash2, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GastoModal } from "@/components/gastos/GastoModal";
import { gastosApi, reportesApi, descargarArchivo } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Gasto } from "@/types";

const CATEGORIA_COLORS: Record<string, "default" | "success" | "warning" | "info" | "destructive" | "secondary"> = {
  Inventario: "info",
  Renta: "warning",
  Nómina: "default",
  Servicios: "secondary",
  Marketing: "success",
  Logística: "warning",
};

export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState("__all__");
  const [categorias, setCategorias] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [totalPeriodo, setTotalPeriodo] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [gastoEdit, setGastoEdit] = useState<Gasto | null>(null);
  const [exportando, setExportando] = useState(false);

  const fetchGastos = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 20 };
      if (search) params.search = search;
      if (categoria && categoria !== "__all__") params.categoria = categoria;
      const r = await gastosApi.getAll(params);
      setGastos(r.data.data);
      setPagination(r.data.pagination);
      setTotalPeriodo(r.data.meta?.totalPeriodo || 0);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, categoria]);

  useEffect(() => { fetchGastos(1); }, [fetchGastos]);

  useEffect(() => {
    gastosApi.getCategorias()
      .then((r) => setCategorias(r.data.data))
      .catch(() => {});
  }, []);

  const handleDelete = async (g: Gasto) => {
    if (!confirm(`¿Eliminar el gasto "${g.concepto}"?`)) return;
    try {
      await gastosApi.delete(g.id);
      toast.success("Gasto eliminado");
      fetchGastos(pagination.page);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleExport = async () => {
    setExportando(true);
    try {
      const r = await reportesApi.exportarGastos();
      descargarArchivo(r.data, `gastos-${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Gastos exportados");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setExportando(false);
    }
  };

  const openEdit = (g: Gasto) => { setGastoEdit(g); setModalOpen(true); };
  const openNew = () => { setGastoEdit(null); setModalOpen(true); };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gastos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pagination.total} registros
            {totalPeriodo > 0 && (
              <span className="ml-2 font-medium text-foreground">· {formatCurrency(totalPeriodo)} total</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exportando}>
            <Download className="w-4 h-4 mr-1.5" />
            {exportando ? "Exportando..." : "Exportar"}
          </Button>
          <Button size="sm" onClick={openNew}>
            <Plus className="w-4 h-4 mr-1.5" />Nuevo gasto
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por concepto, proveedor..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={categoria} onValueChange={setCategoria}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas</SelectItem>
            {categorias.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => fetchGastos(1)}>
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
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Concepto</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Categoría</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Proveedor</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Monto</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Fecha</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/30">
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                        ))}
                      </tr>
                    ))
                  : gastos.map((g) => (
                      <motion.tr
                        key={g.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <p className="font-medium">{g.concepto}</p>
                          {g.descripcion && (
                            <p className="text-xs text-muted-foreground truncate max-w-[220px]">{g.descripcion}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <Badge variant={CATEGORIA_COLORS[g.categoria] || "secondary"} className="text-xs">
                            {g.categoria}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                          {g.proveedor || "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {formatCurrency(Number(g.monto))}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-sm text-muted-foreground">
                          {formatDate(g.fecha)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon-sm" onClick={() => openEdit(g)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(g)}
                              className="hover:text-red-500 hover:bg-red-50">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
              </tbody>
            </table>

            {!loading && gastos.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Receipt className="w-12 h-12 mb-3 opacity-30" />
                <p className="font-medium">No se encontraron gastos</p>
              </div>
            )}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                Mostrando {gastos.length} de {pagination.total}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={pagination.page <= 1}
                  onClick={() => fetchGastos(pagination.page - 1)}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchGastos(pagination.page + 1)}>Siguiente</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <GastoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        gasto={gastoEdit}
        onSaved={() => { fetchGastos(pagination.page); setModalOpen(false); }}
      />
    </div>
  );
}
