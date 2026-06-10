"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { gastosApi } from "@/lib/api";
import type { Gasto } from "@/types";

const CATEGORIAS_GASTO = [
  "Inventario", "Renta", "Nómina", "Servicios", "Marketing",
  "Logística", "Mantenimiento", "Impuestos", "Otro",
];

interface Props {
  open: boolean;
  onClose: () => void;
  gasto: Gasto | null;
  onSaved: () => void;
}

export function GastoModal({ open, onClose, gasto, onSaved }: Props) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<any>();

  useEffect(() => {
    if (open) {
      reset(
        gasto
          ? {
              concepto: gasto.concepto,
              descripcion: gasto.descripcion || "",
              categoria: gasto.categoria,
              monto: gasto.monto,
              fecha: gasto.fecha ? new Date(gasto.fecha).toISOString().split("T")[0] : "",
              proveedor: gasto.proveedor || "",
            }
          : { fecha: new Date().toISOString().split("T")[0] }
      );
    }
  }, [open, gasto, reset]);

  const onSubmit = async (data: any) => {
    try {
      if (gasto) {
        await gastosApi.update(gasto.id, data);
        toast.success("Gasto actualizado");
      } else {
        await gastosApi.create(data);
        toast.success("Gasto registrado");
      }
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{gasto ? "Editar gasto" : "Nuevo gasto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1">
          <div className="space-y-1.5">
            <Label>Concepto *</Label>
            <Input {...register("concepto", { required: "Requerido" })} placeholder="Renta local, compra de inventario..." />
            {errors.concepto && <p className="text-xs text-red-500">{errors.concepto.message as string}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Categoría *</Label>
              <select
                {...register("categoria", { required: "Requerido" })}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Selecciona...</option>
                {CATEGORIAS_GASTO.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.categoria && <p className="text-xs text-red-500">{errors.categoria.message as string}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Monto (MXN) *</Label>
              <Input
                type="number"
                step="0.01"
                {...register("monto", { required: "Requerido", min: { value: 0.01, message: "Debe ser mayor a 0" } })}
                placeholder="0.00"
              />
              {errors.monto && <p className="text-xs text-red-500">{errors.monto.message as string}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Fecha *</Label>
              <Input type="date" {...register("fecha", { required: "Requerido" })} />
              {errors.fecha && <p className="text-xs text-red-500">{errors.fecha.message as string}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Proveedor</Label>
              <Input {...register("proveedor")} placeholder="Nombre del proveedor" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Textarea {...register("descripcion")} placeholder="Descripción adicional..." rows={2} />
          </div>

          <DialogFooter className="gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : gasto ? "Guardar cambios" : "Registrar gasto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
