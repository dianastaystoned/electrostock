"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Upload, Download, AlertTriangle,
  Package, Pencil, Trash2, RefreshCw, Filter, ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ProductoModal } from "@/components/inventario/ProductoModal";
import { AjusteStockModal } from "@/components/inventario/AjusteStockModal";
import { productosApi, reportesApi, descargarArchivo } from "@/lib/api";
import { formatCurrency, calcMargen } from "@/lib/utils";
import type { Producto } from "@/types";

export default function InventarioPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState("__all__");
  const [categorias, setCategorias] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [bajoStockCount, setBajoStockCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [ajusteOpen, setAjusteOpen] = useState(false);
  const [productoEdit, setProductoEdit] = useState<Producto | null>(null);
  const [productoAjuste, setProductoAjuste] = useState<Producto | null>(null);
  const [exportando, setExportando] = useState(false);
  const [filtroBajoStock, setFiltroBajoStock] = useState(false);

  const fetchProductos = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 20 };
      if (search) params.search = search;
      if (categoria && categoria !== "__all__") params.categoria = categoria;
      if (filtroBajoStock) params.bajoStock = "true";
      const r = await productosApi.getAll(params);
      setProductos(r.data.data);
      setPagination(r.data.pagination);
      setBajoStockCount(r.data.meta?.bajoStockCount || 0);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, categoria, filtroBajoStock]);

  useEffect(() => {
    fetchProductos(1);
  }, [fetchProductos]);

  useEffect(() => {
    productosApi.getCategorias()
      .then((r) => setCategorias(r.data.data))
      .catch(() => {});
  }, []);

  const handleDelete = async (p: Producto) => {
    if (!confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await productosApi.delete(p.id);
      toast.success("Producto eliminado");
      fetchProductos(pagination.page);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleExport = async () => {
    setExportando(true);
    try {
      const r = await reportesApi.exportarInventario();
      descargarArchivo(r.data, `inventario-${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Inventario exportado correctamente");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setExportando(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading("Importando inventario...");
    try {
      const r = await productosApi.importarExcel(file);
      toast.success(r.data.message, { id: toastId });
      fetchProductos(1);
    } catch (e: any) {
      toast.error(e.message, { id: toastId });
    }
    e.target.value = "";
  };

  const openEdit = (p: Producto) => { setProductoEdit(p); setModalOpen(true); };
  const openNew = () => { setProductoEdit(null); setModalOpen(true); };
  const openAjuste = (p: Producto) => { setProductoAjuste(p); setAjusteOpen(true); };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventario</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pagination.total} productos
            {bajoStockCount > 0 && (
              <span className="ml-2 text-amber-600 font-medium">
                · {bajoStockCount} con bajo stock
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="cursor-pointer">
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
            <Button variant="outline" size="sm" asChild>
              <span><Upload className="w-4 h-4 mr-1.5" />Importar Excel</span>
            </Button>
          </label>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exportando}>
            <Download className="w-4 h-4 mr-1.5" />
            {exportando ? "Exportando..." : "Exportar"}
          </Button>
          <Button size="sm" onClick={openNew}>
            <Plus className="w-4 h-4 mr-1.5" />Nuevo producto
          </Button>
        </div>
      </div>

      {/* Alerta bajo stock */}
      <AnimatePresence>
        {bajoStockCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span><strong>{bajoStockCount} productos</strong> tienen stock igual o menor al mínimo.</span>
            <button
              className="ml-auto underline font-medium hover:no-underline"
              onClick={() => setFiltroBajoStock(!filtroBajoStock)}
            >
              {filtroBajoStock ? "Mostrar todos" : "Ver solo esos"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, SKU, marca..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={categoria} onValueChange={setCategoria}>
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas las categorías</SelectItem>
            {categorias.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => fetchProductos(1)}>
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
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Producto</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">SKU</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Categoría</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Costo</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Precio</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Margen</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Stock</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/30">
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <Skeleton className="h-4 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : productos.map((p) => {
                      const margen = calcMargen(Number(p.precioCompra), Number(p.precioVenta));
                      const bajoStock = p.stock <= p.stockMinimo;
                      return (
                        <motion.tr
                          key={p.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Package className="w-4 h-4 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium truncate max-w-[180px]">{p.nombre}</p>
                                <p className="text-xs text-muted-foreground">{p.marca}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <code className="text-xs bg-muted px-2 py-0.5 rounded-md">{p.sku}</code>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <Badge variant="secondary" className="text-xs">{p.categoria}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">{formatCurrency(Number(p.precioCompra))}</td>
                          <td className="px-4 py-3 text-right font-semibold">{formatCurrency(Number(p.precioVenta))}</td>
                          <td className="px-4 py-3 text-right hidden sm:table-cell">
                            <span className={`text-xs font-medium ${margen >= 30 ? "text-emerald-600" : margen >= 15 ? "text-amber-600" : "text-red-500"}`}>
                              {margen.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => openAjuste(p)}
                              className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                            >
                              <Badge variant={bajoStock ? "warning" : "success"} className="text-xs cursor-pointer">
                                {p.stock} uds
                              </Badge>
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="icon-sm" onClick={() => openEdit(p)}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(p)}
                                className="hover:text-red-500 hover:bg-red-50">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
              </tbody>
            </table>

            {!loading && productos.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Package className="w-12 h-12 mb-3 opacity-30" />
                <p className="font-medium">No se encontraron productos</p>
                <p className="text-sm mt-1">Intenta con otros filtros o agrega un nuevo producto.</p>
              </div>
            )}
          </div>

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                Mostrando {productos.length} de {pagination.total} productos
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={pagination.page <= 1}
                  onClick={() => fetchProductos(pagination.page - 1)}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchProductos(pagination.page + 1)}>Siguiente</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ProductoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        producto={productoEdit}
        onSaved={() => { fetchProductos(pagination.page); setModalOpen(false); }}
      />
      <AjusteStockModal
        open={ajusteOpen}
        onClose={() => setAjusteOpen(false)}
        producto={productoAjuste}
        onSaved={() => { fetchProductos(pagination.page); setAjusteOpen(false); }}
      />
    </div>
  );
}
