"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Minus, Trash2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { productosApi, ventasApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { Producto, ItemCarrito } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function NuevaVentaModal({ open, onClose, onSaved }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<Producto[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [cliente, setCliente] = useState({ nombre: "", email: "", telefono: "" });
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [descuento, setDescuento] = useState(0);
  const [notas, setNotas] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (open) {
      setCarrito([]);
      setBusqueda("");
      setResultados([]);
      setCliente({ nombre: "", email: "", telefono: "" });
      setMetodoPago("efectivo");
      setDescuento(0);
      setNotas("");
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!busqueda.trim()) { setResultados([]); return; }
    debounceRef.current = setTimeout(async () => {
      setBuscando(true);
      try {
        const r = await productosApi.getAll({ search: busqueda, limit: 6 });
        setResultados(r.data.data.filter((p: Producto) => p.stock > 0));
      } catch { } finally { setBuscando(false); }
    }, 300);
  }, [busqueda]);

  const agregarAlCarrito = (producto: Producto) => {
    setCarrito((prev) => {
      const existe = prev.find((i) => i.producto.id === producto.id);
      if (existe) {
        if (existe.cantidad >= producto.stock) {
          toast.warning(`Stock máximo disponible: ${producto.stock}`);
          return prev;
        }
        return prev.map((i) =>
          i.producto.id === producto.id
            ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * Number(i.producto.precioVenta) }
            : i
        );
      }
      return [...prev, {
        producto,
        cantidad: 1,
        subtotal: Number(producto.precioVenta),
      }];
    });
    setBusqueda("");
    setResultados([]);
  };

  const cambiarCantidad = (id: number, delta: number) => {
    setCarrito((prev) =>
      prev.map((i) => {
        if (i.producto.id !== id) return i;
        const nueva = i.cantidad + delta;
        if (nueva < 1) return i;
        if (nueva > i.producto.stock) {
          toast.warning(`Stock máximo: ${i.producto.stock}`);
          return i;
        }
        return { ...i, cantidad: nueva, subtotal: nueva * Number(i.producto.precioVenta) };
      })
    );
  };

  const quitarDelCarrito = (id: number) => {
    setCarrito((prev) => prev.filter((i) => i.producto.id !== id));
  };

  const subtotal = carrito.reduce((a, i) => a + i.subtotal, 0);
  const total = subtotal - (descuento || 0);

  const handleSubmit = async () => {
    if (carrito.length === 0) { toast.error("El carrito está vacío"); return; }
    if (total < 0) { toast.error("El descuento no puede superar el subtotal"); return; }
    setSubmitting(true);
    try {
      await ventasApi.create({
        clienteNombre: cliente.nombre || undefined,
        clienteEmail: cliente.email || undefined,
        clienteTelefono: cliente.telefono || undefined,
        metodoPago,
        descuento,
        notas: notas || undefined,
        items: carrito.map((i) => ({ productoId: i.producto.id, cantidad: i.cantidad })),
      });
      toast.success("¡Venta registrada exitosamente!");
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Nueva venta</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Izquierda: búsqueda + carrito */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden border-r">
            {/* Búsqueda */}
            <div className="px-4 pt-4 pb-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar producto por nombre o SKU..."
                  className="pl-9"
                />
              </div>

              {/* Resultados */}
              <AnimatePresence>
                {(resultados.length > 0 || buscando) && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute z-20 mt-1 w-[calc(100%-2rem)] bg-white border rounded-xl shadow-xl overflow-hidden"
                  >
                    {buscando ? (
                      <div className="px-4 py-3 text-sm text-muted-foreground">Buscando...</div>
                    ) : (
                      resultados.map((p) => (
                        <button
                          key={p.id}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 text-left transition-colors"
                          onClick={() => agregarAlCarrito(p)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{p.nombre}</p>
                            <p className="text-xs text-muted-foreground">{p.sku} · Stock: {p.stock}</p>
                          </div>
                          <span className="text-sm font-semibold shrink-0">{formatCurrency(Number(p.precioVenta))}</span>
                        </button>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Carrito */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {carrito.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10">
                  <ShoppingCart className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">Busca y agrega productos</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {carrito.map((item) => (
                      <motion.div
                        key={item.producto.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.producto.nombre}</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(Number(item.producto.precioVenta))} c/u</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button variant="outline" size="icon-sm" onClick={() => cambiarCantidad(item.producto.id, -1)}>
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-medium">{item.cantidad}</span>
                          <Button variant="outline" size="icon-sm" onClick={() => cambiarCantidad(item.producto.id, 1)}>
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <span className="text-sm font-semibold w-20 text-right">{formatCurrency(item.subtotal)}</span>
                        <Button variant="ghost" size="icon-sm" onClick={() => quitarDelCarrito(item.producto.id)}
                          className="hover:text-red-500 hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* Derecha: cliente + pago + totales */}
          <div className="w-full md:w-64 lg:w-72 flex flex-col overflow-y-auto">
            <div className="p-4 space-y-4 flex-1">
              {/* Cliente */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Cliente (opcional)</p>
                <div className="space-y-2">
                  <Input
                    placeholder="Nombre"
                    value={cliente.nombre}
                    onChange={(e) => setCliente((c) => ({ ...c, nombre: e.target.value }))}
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={cliente.email}
                    onChange={(e) => setCliente((c) => ({ ...c, email: e.target.value }))}
                  />
                  <Input
                    placeholder="Teléfono"
                    value={cliente.telefono}
                    onChange={(e) => setCliente((c) => ({ ...c, telefono: e.target.value }))}
                  />
                </div>
              </div>

              {/* Método de pago */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Método de pago</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {["efectivo", "tarjeta", "transferencia", "credito"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setMetodoPago(m)}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                        metodoPago === m
                          ? "bg-primary text-white border-primary"
                          : "bg-background border-input hover:bg-muted"
                      }`}
                    >
                      {m === "efectivo" ? "💵 Efectivo" : m === "tarjeta" ? "💳 Tarjeta" : m === "transferencia" ? "🏦 Transferencia" : "📋 Crédito"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Descuento */}
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Descuento (MXN)</Label>
                <Input
                  type="number"
                  min={0}
                  value={descuento || ""}
                  onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="mt-1.5"
                />
              </div>

              {/* Notas */}
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notas</Label>
                <Input
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Notas opcionales..."
                  className="mt-1.5"
                />
              </div>
            </div>

            {/* Totales */}
            <div className="border-t p-4 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
              </div>
              {descuento > 0 && (
                <div className="flex justify-between text-sm text-red-500">
                  <span>Descuento</span><span>-{formatCurrency(descuento)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-1 border-t">
                <span>Total</span><span>{formatCurrency(total)}</span>
              </div>
              <Button
                className="w-full mt-2"
                disabled={carrito.length === 0 || submitting || total < 0}
                onClick={handleSubmit}
              >
                {submitting ? "Procesando..." : `Registrar venta · ${formatCurrency(total)}`}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
