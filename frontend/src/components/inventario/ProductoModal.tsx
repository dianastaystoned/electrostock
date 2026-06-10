"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { productosApi } from "@/lib/api";
import type { Producto } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  producto: Producto | null;
  onSaved: () => void;
}

const CATEGORIAS = ["Smartphones", "Tablets", "Audio", "Cables", "Adaptador", "Cargador", "Gaming", "Accesorios", "Fotografía", "Otro"];

export function ProductoModal({ open, onClose, producto, onSaved }: Props) {
  const {
    register, handleSubmit, reset, formState: { errors, isSubmitting },
  } = useForm<any>();

  useEffect(() => {
    if (open) {
      reset(
        producto
          ? {
              nombre: producto.nombre,
              descripcion: producto.descripcion || "",
              sku: producto.sku,
              categoria: producto.categoria,
              marca: producto.marca,
              modelo: producto.modelo || "",
              precioCompra: producto.precioCompra,
              precioVenta: producto.precioVenta,
              stock: producto.stock,
              stockMinimo: producto.stockMinimo,
            }
          : { stock: 0, stockMinimo: 5 }
      );
    }
  }, [open, producto, reset]);

  const onSubmit = async (data: any) => {
    try {
      if (producto) {
        await productosApi.update(producto.id, data);
        toast.success("Producto actualizado correctamente");
      } else {
        await productosApi.create(data);
        toast.success("Producto creado correctamente");
      }
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{producto ? "Editar producto" : "Nuevo producto"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Nombre *</Label>
              <Input {...register("nombre", { required: "Requerido" })} placeholder="iPhone 15 Pro Max 256GB" />
              {errors.nombre && <p className="text-xs text-red-500">{errors.nombre.message as string}</p>}
            </div>

            {/* SKU */}
            <div className="space-y-1.5">
              <Label>SKU *</Label>
              <Input {...register("sku", { required: "Requerido" })} placeholder="APL-IP15PM-256" className="font-mono" />
              {errors.sku && <p className="text-xs text-red-500">{errors.sku.message as string}</p>}
            </div>

            {/* Categoría */}
            <div className="space-y-1.5">
              <Label>Categoría *</Label>
              <select
                {...register("categoria", { required: "Requerido" })}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Selecciona...</option>
                {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.categoria && <p className="text-xs text-red-500">{errors.categoria.message as string}</p>}
            </div>

            {/* Marca */}
            <div className="space-y-1.5">
              <Label>Marca *</Label>
              <Input {...register("marca", { required: "Requerido" })} placeholder="Apple" />
              {errors.marca && <p className="text-xs text-red-500">{errors.marca.message as string}</p>}
            </div>

            {/* Modelo */}
            <div className="space-y-1.5">
              <Label>Modelo</Label>
              <Input {...register("modelo")} placeholder="iPhone 15 Pro Max" />
            </div>

            {/* Precio compra */}
            <div className="space-y-1.5">
              <Label>Precio de compra (MXN) *</Label>
              <Input
                type="number"
                step="0.01"
                {...register("precioCompra", { required: "Requerido", min: { value: 0, message: "Debe ser positivo" } })}
                placeholder="18500.00"
              />
              {errors.precioCompra && <p className="text-xs text-red-500">{errors.precioCompra.message as string}</p>}
            </div>

            {/* Precio venta */}
            <div className="space-y-1.5">
              <Label>Precio de venta (MXN) *</Label>
              <Input
                type="number"
                step="0.01"
                {...register("precioVenta", { required: "Requerido", min: { value: 0, message: "Debe ser positivo" } })}
                placeholder="24999.00"
              />
              {errors.precioVenta && <p className="text-xs text-red-500">{errors.precioVenta.message as string}</p>}
            </div>

            {/* Stock */}
            <div className="space-y-1.5">
              <Label>Stock inicial</Label>
              <Input
                type="number"
                {...register("stock", { min: { value: 0, message: "No puede ser negativo" } })}
                placeholder="10"
              />
            </div>

            {/* Stock mínimo */}
            <div className="space-y-1.5">
              <Label>Stock mínimo</Label>
              <Input
                type="number"
                {...register("stockMinimo", { min: { value: 0, message: "No puede ser negativo" } })}
                placeholder="5"
              />
            </div>

            {/* Descripción */}
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Descripción</Label>
              <Textarea
                {...register("descripcion")}
                placeholder="Descripción del producto..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : producto ? "Guardar cambios" : "Crear producto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
