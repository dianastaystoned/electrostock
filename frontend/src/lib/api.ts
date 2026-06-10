import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Error de conexión con el servidor";
    return Promise.reject(new Error(message));
  }
);

// ─── Dashboard ───────────────────────────────────────
export const dashboardApi = {
  get: () => api.get("/dashboard"),
};

// ─── Productos ───────────────────────────────────────
export const productosApi = {
  getAll: (params?: Record<string, any>) =>
    api.get("/productos", { params }),
  getById: (id: number) => api.get(`/productos/${id}`),
  create: (data: any) => api.post("/productos", data),
  update: (id: number, data: any) => api.put(`/productos/${id}`, data),
  delete: (id: number) => api.delete(`/productos/${id}`),
  getCategorias: () => api.get("/productos/categorias"),
  getMarcas: () => api.get("/productos/marcas"),
  importarExcel: (file: File) => {
    const formData = new FormData();
    formData.append("archivo", file);
    return api.post("/productos/importar/excel", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  ajustarStock: (id: number, data: { cantidad: number; tipo: string; motivo?: string }) =>
    api.patch(`/productos/${id}/stock`, data),
};

// ─── Ventas ──────────────────────────────────────────
export const ventasApi = {
  getAll: (params?: Record<string, any>) => api.get("/ventas", { params }),
  getById: (id: number) => api.get(`/ventas/${id}`),
  create: (data: any) => api.post("/ventas", data),
  cancelar: (id: number, motivo?: string) =>
    api.patch(`/ventas/${id}/cancelar`, { motivo }),
  getEstadisticas: () => api.get("/ventas/estadisticas"),
};

// ─── Gastos ──────────────────────────────────────────
export const gastosApi = {
  getAll: (params?: Record<string, any>) => api.get("/gastos", { params }),
  getById: (id: number) => api.get(`/gastos/${id}`),
  create: (data: any) => api.post("/gastos", data),
  update: (id: number, data: any) => api.put(`/gastos/${id}`, data),
  delete: (id: number) => api.delete(`/gastos/${id}`),
  getCategorias: () => api.get("/gastos/categorias"),
  getResumenMensual: (año?: number) =>
    api.get("/gastos/resumen-mensual", { params: { año } }),
};

// ─── Reportes ────────────────────────────────────────
export const reportesApi = {
  getGeneral: (año?: number) =>
    api.get("/reportes/general", { params: { año } }),
  exportarInventario: () =>
    api.get("/reportes/exportar/inventario", { responseType: "blob" }),
  exportarVentas: (params?: { fechaDesde?: string; fechaHasta?: string }) =>
    api.get("/reportes/exportar/ventas", { params, responseType: "blob" }),
  exportarGastos: (params?: { fechaDesde?: string; fechaHasta?: string }) =>
    api.get("/reportes/exportar/gastos", { params, responseType: "blob" }),
};

// ─── Utilidad para descargar blob ────────────────────
export const descargarArchivo = (blob: Blob, nombre: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
