"use client";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { productosApi } from "@/lib/api";
import type { Producto } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  producto: Producto | null;
  onSaved: () => void;
}

export function AjusteStockModal({ open, onClose, producto, onSaved }: Props) {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<any>({
    defaultValues: { tipo: "entrada", cantidad: 1 },
  });

  const onSubmit = async (data: any) => {
    if (!producto) return;
    try {
      await productosApi.ajustarStock(producto.id, {
        cantidad: parseInt(data.cantidad),
        tipo: data.tipo,
        motivo: data.motivo,
      });
      toast.success("Stock ajustado correctamente");
      reset({ tipo: "entrada", cantidad: 1 });
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Ajustar stock</DialogTitle>
        </DialogHeader>
        {producto && (
          <div className="mb-2 p-3 bg-muted/50 rounded-xl text-sm">
            <p className="font-medium">{producto.nombre}</p>
            <p className="text-muted-foreground text-xs mt-0.5">Stock actual: <strong>{producto.stock} unidades</strong></p>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Tipo de movimiento</Label>
            <select
              {...register("tipo")}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="entrada">Entrada (agregar stock)</option>
              <option value="salida">Salida (reducir stock)</option>
              <option value="ajuste">Ajuste directo (establecer cantidad)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Cantidad *</Label>
            <Input type="number" min={0} {...register("cantidad", { required: true, min: 0 })} />
          </div>
          <div className="space-y-1.5">
            <Label>Motivo</Label>
            <Input {...register("motivo")} placeholder="Compra, devolución, ajuste inventario..." />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Aplicar ajuste"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
