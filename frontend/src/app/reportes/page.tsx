"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, LineChart, Line,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { reportesApi, descargarArchivo } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface MesData {
  mes: string;
  mesNum: number;
  ventas: number;
  gastos: number;
  ganancia: number;
  pedidos: number;
}

interface ReporteData {
  año: number;
  meses: MesData[];
  totales: { ventas: number; gastos: number; ganancia: number; pedidos: number };
}

export default function ReportesPage() {
  const [reporte, setReporte] = useState<ReporteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [año, setAño] = useState(new Date().getFullYear());
  const [exportando, setExportando] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    reportesApi.getGeneral(año)
      .then((r) => setReporte(r.data.data))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [año]);

  const handleExport = async (tipo: "inventario" | "ventas" | "gastos") => {
    setExportando(tipo);
    try {
      let r;
      if (tipo === "inventario") r = await reportesApi.exportarInventario();
      else if (tipo === "ventas") r = await reportesApi.exportarVentas();
      else r = await reportesApi.exportarGastos();
      descargarArchivo(r.data, `${tipo}-${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success(`Reporte de ${tipo} descargado`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setExportando(null);
    }
  };

  const mesesConDatos = reporte?.meses.filter((m) => m.ventas > 0 || m.gastos > 0) || [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Análisis financiero anual</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={año}
            onChange={(e) => setAño(parseInt(e.target.value))}
            className="h-9 rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {[2023, 2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <Button variant="outline" size="sm" onClick={() => handleExport("inventario")}
            disabled={exportando === "inventario"}>
            <Download className="w-4 h-4 mr-1.5" />
            {exportando === "inventario" ? "..." : "Inventario"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("ventas")}
            disabled={exportando === "ventas"}>
            <Download className="w-4 h-4 mr-1.5" />
            {exportando === "ventas" ? "..." : "Ventas"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("gastos")}
            disabled={exportando === "gastos"}>
            <Download className="w-4 h-4 mr-1.5" />
            {exportando === "gastos" ? "..." : "Gastos"}
          </Button>
        </div>
      </div>

      {/* KPI Totales anuales */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          {[
            { label: "Ventas totales", value: reporte?.totales.ventas || 0, color: "text-blue-600", bg: "bg-blue-50", icon: TrendingUp },
            { label: "Gastos totales", value: reporte?.totales.gastos || 0, color: "text-red-500", bg: "bg-red-50", icon: TrendingDown },
            { label: "Ganancia neta", value: reporte?.totales.ganancia || 0, color: "text-emerald-600", bg: "bg-emerald-50", icon: TrendingUp },
            { label: "Total pedidos", value: reporte?.totales.pedidos || 0, color: "text-purple-600", bg: "bg-purple-50", icon: BarChart3, isCurrency: false },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="p-5">
                <div className={`w-9 h-9 rounded-xl ${kpi.bg} ${kpi.color} flex items-center justify-center mb-3`}>
                  <kpi.icon className="w-4 h-4" />
                </div>
                <p className="text-xl font-bold">
                  {(kpi as any).isCurrency === false ? kpi.value : formatCurrency(kpi.value as number)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{kpi.label} {año}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      {/* Gráfica de barras mensual */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Ventas vs Gastos por mes — {año}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-60 w-full" /> : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={reporte?.meses} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(v: number) => [formatCurrency(v)]}
                      contentStyle={{ borderRadius: "12px", fontSize: "12px", border: "1px solid #e5e7eb" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Bar dataKey="ventas" name="Ventas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="gastos" name="Gastos" fill="#f87171" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Gráfica de ganancias */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Ganancia mensual</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-60 w-full" /> : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={reporte?.meses} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mes" tick={{ fontSize: 10 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(v: number) => [formatCurrency(v)]}
                      contentStyle={{ borderRadius: "12px", fontSize: "12px" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="ganancia"
                      name="Ganancia"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ fill: "#10b981", r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabla mensual detallada */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Detalle mensual — {año}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Mes</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ventas</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Gastos</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ganancia</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Pedidos</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 12 }).map((_, i) => (
                        <tr key={i} className="border-b border-border/30">
                          {Array.from({ length: 6 }).map((_, j) => (
                            <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                          ))}
                        </tr>
                      ))
                    : reporte?.meses.map((m) => {
                        const margen = m.ventas > 0 ? ((m.ganancia / m.ventas) * 100) : 0;
                        return (
                          <tr key={m.mesNum} className="border-b border-border/30 hover:bg-muted/20 transition-colors capitalize">
                            <td className="px-5 py-3 font-medium">{m.mes}</td>
                            <td className="px-4 py-3 text-right text-blue-600 font-medium">
                              {m.ventas > 0 ? formatCurrency(m.ventas) : "—"}
                            </td>
                            <td className="px-4 py-3 text-right text-red-500 font-medium">
                              {m.gastos > 0 ? formatCurrency(m.gastos) : "—"}
                            </td>
                            <td className={`px-4 py-3 text-right font-semibold ${m.ganancia >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                              {m.ventas > 0 || m.gastos > 0 ? formatCurrency(m.ganancia) : "—"}
                            </td>
                            <td className="px-4 py-3 text-right hidden sm:table-cell text-muted-foreground">
                              {m.pedidos || "—"}
                            </td>
                            <td className="px-4 py-3 text-center hidden md:table-cell">
                              {m.ventas > 0 && (
                                <Badge
                                  variant={margen >= 20 ? "success" : margen >= 0 ? "warning" : "destructive"}
                                  className="text-xs"
                                >
                                  {margen.toFixed(1)}% margen
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
                {reporte && (
                  <tfoot>
                    <tr className="bg-muted/40 font-semibold border-t-2 border-border">
                      <td className="px-5 py-3">Total {año}</td>
                      <td className="px-4 py-3 text-right text-blue-600">{formatCurrency(reporte.totales.ventas)}</td>
                      <td className="px-4 py-3 text-right text-red-500">{formatCurrency(reporte.totales.gastos)}</td>
                      <td className={`px-4 py-3 text-right ${reporte.totales.ganancia >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {formatCurrency(reporte.totales.ganancia)}
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">{reporte.totales.pedidos}</td>
                      <td className="px-4 py-3 hidden md:table-cell" />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
