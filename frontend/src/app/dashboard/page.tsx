"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, ShoppingCart, Package,
  DollarSign, AlertTriangle, BarChart2, ArrowUpRight,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardApi } from "@/lib/api";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";
import type { DashboardData } from "@/types";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

function KPICard({
  title, value, subtitle, icon: Icon, trend, color = "blue",
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: any;
  trend?: number;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <motion.div variants={item}>
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
              <Icon className="w-5 h-5" />
            </div>
            {trend !== undefined && (
              <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {formatPercent(trend)}
              </div>
            )}
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{title}</p>
            {subtitle && <p className="text-xs text-muted-foreground/70 mt-1">{subtitle}</p>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function KPISkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="h-7 w-32 mt-3" />
        <Skeleton className="h-4 w-24 mt-1.5" />
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.get()
      .then((r) => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const kpis = data?.kpis;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Resumen de tu negocio • {new Date().toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </motion.div>

      {/* KPI Grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 8 }).map((_, i) => <KPISkeleton key={i} />)}
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          <KPICard
            title="Ventas del mes"
            value={formatCurrency(kpis?.totalVentasMes || 0)}
            subtitle={`${kpis?.totalPedidosMes} pedidos`}
            icon={ShoppingCart}
            trend={kpis?.crecimientoVentas}
            color="blue"
          />
          <KPICard
            title="Gastos del mes"
            value={formatCurrency(kpis?.totalGastosMes || 0)}
            icon={DollarSign}
            trend={kpis?.crecimientoGastos}
            color="red"
          />
          <KPICard
            title="Ganancia del mes"
            value={formatCurrency(kpis?.gananciasMes || 0)}
            icon={TrendingUp}
            color="green"
          />
          <KPICard
            title="Bajo stock"
            value={String(kpis?.productosConBajoStock || 0)}
            subtitle="productos"
            icon={AlertTriangle}
            color="amber"
          />
          <KPICard
            title="Ventas totales"
            value={formatCurrency(kpis?.totalVentasHistorico || 0)}
            icon={BarChart2}
            color="purple"
          />
          <KPICard
            title="Gastos totales"
            value={formatCurrency(kpis?.totalGastosHistorico || 0)}
            icon={DollarSign}
            color="red"
          />
          <KPICard
            title="Ganancias totales"
            value={formatCurrency(kpis?.gananciasHistorico || 0)}
            icon={TrendingUp}
            color="green"
          />
          <KPICard
            title="Inventario invertido"
            value={formatCurrency(kpis?.totalInvertidoInventario || 0)}
            subtitle={`Venta: ${formatCurrency(kpis?.valorInventarioVenta || 0)}`}
            icon={Package}
            color="blue"
          />
        </motion.div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Area chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Ventas vs Gastos — Últimos 6 meses</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-52 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={data?.ventasPorMes} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value)]}
                      contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                    />
                    <Area type="monotone" dataKey="ventas" name="Ventas" stroke="#3b82f6" strokeWidth={2} fill="url(#colorVentas)" />
                    <Area type="monotone" dataKey="gastos" name="Gastos" stroke="#ef4444" strokeWidth={2} fill="url(#colorGastos)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Pie chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Ventas por categoría</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-52 w-full" />
              ) : (
                <div>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie
                        data={data?.ventasPorCategoria}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="total"
                      >
                        {data?.ventasPorCategoria.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [formatCurrency(v)]}
                        contentStyle={{ borderRadius: "12px", fontSize: "12px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-2 space-y-1.5">
                    {data?.ventasPorCategoria.slice(0, 4).map((cat, i) => (
                      <div key={cat.categoria} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="text-muted-foreground truncate max-w-[100px]">{cat.categoria}</span>
                        </div>
                        <span className="font-medium">{formatCurrency(cat.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top productos */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Productos más vendidos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {data?.productosMasVendidos.map((p, i) => (
                    <div key={p.productoId} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                      <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.nombre}</p>
                        <p className="text-xs text-muted-foreground">{p.categoria}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{p.cantidadVendida} uds</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(p.totalGenerado)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Últimas ventas */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Últimas ventas</CardTitle>
                <a href="/ventas" className="text-xs text-primary flex items-center gap-1 hover:underline">
                  Ver todas <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {data?.ultimasVentas.map((v) => (
                    <div key={v.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{v.folio}</p>
                          <Badge variant={v.estado === "COMPLETADA" ? "success" : v.estado === "CANCELADA" ? "destructive" : "warning"} className="text-[10px]">
                            {v.estado}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {v.clienteNombre || "Público general"} · {formatDate(v.fecha)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold">{formatCurrency(v.total)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
