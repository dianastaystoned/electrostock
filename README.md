# ⚡ ElectroStock — Sistema de Gestión para Tienda de Electrónicos

Sistema completo de inventario, ventas y control de gastos con dashboard analítico.

---

## 🧰 Requisitos previos

Antes de empezar, asegúrate de tener instalado:

| Herramienta | Versión mínima | Verificar con |
|---|---|---|
| Node.js | 18+ | `node -v` |
| npm | 9+ | `npm -v` |
| MySQL | 8.0+ | `mysql --version` |

---

## 🚀 Instalación paso a paso

### 1. Crear la base de datos en MySQL

Abre tu cliente MySQL (MySQL Workbench, TablePlus, terminal, etc.) y ejecuta:

```sql
CREATE DATABASE electrostock CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Configurar variables de entorno del backend

```bash
cd backend
cp .env.example .env
```

Abre `backend/.env` y ajusta con tus credenciales de MySQL:

```env
DATABASE_URL="mysql://root:TU_PASSWORD@localhost:3306/electrostock"
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 3. Configurar variables de entorno del frontend

```bash
cd ../frontend
cp .env.example .env.local
```

El archivo `.env.local` debe contener:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 4. Instalar dependencias

Desde la raíz del proyecto (`/electrostock`):

```bash
npm install          # instala concurrently en raíz
cd backend && npm install
cd ../frontend && npm install
```

### 5. Configurar Prisma y base de datos

Desde la carpeta `backend/`:

```bash
cd backend

# Generar el cliente Prisma
npx prisma generate --schema=../database/schema.prisma

# Crear las tablas en la base de datos
npx prisma db push --schema=../database/schema.prisma

# Poblar con datos de ejemplo (productos, ventas, gastos)
npx tsx ../database/seed.ts
```

### 6. ¡Arrancar el proyecto!

Desde la raíz `/electrostock`:

```bash
# Instalar concurrently si no lo hiciste
npm install

# Arrancar backend y frontend simultáneamente
npm run dev
```

O bien, en terminales separadas:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# API corriendo en http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# App corriendo en http://localhost:3000
```

### 7. Abrir en el navegador

```
http://localhost:3000
```

Serás redirigido automáticamente al Dashboard. ✅

---

## 📁 Estructura del proyecto

```
electrostock/
├── package.json               ← scripts raíz (dev, setup)
│
├── database/
│   ├── schema.prisma          ← Esquema completo de BD
│   └── seed.ts                ← Datos de ejemplo
│
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts           ← Servidor Express
│       ├── controllers/
│       │   ├── dashboardController.ts
│       │   ├── productosController.ts
│       │   ├── ventasController.ts
│       │   ├── gastosController.ts
│       │   └── reportesController.ts
│       ├── routes/
│       │   ├── dashboard.ts
│       │   ├── productos.ts
│       │   ├── ventas.ts
│       │   ├── gastos.ts
│       │   └── reportes.ts
│       ├── middleware/
│       │   └── errorHandler.ts
│       └── utils/
│           └── prisma.ts
│
└── frontend/
    ├── .env.example
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.js
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── page.tsx           ← Redirect a /dashboard
        │   ├── globals.css
        │   ├── dashboard/page.tsx
        │   ├── inventario/page.tsx
        │   ├── ventas/page.tsx
        │   ├── gastos/page.tsx
        │   └── reportes/page.tsx
        ├── components/
        │   ├── layout/
        │   │   ├── Sidebar.tsx
        │   │   └── PageHeader.tsx
        │   ├── ui/               ← Button, Card, Badge, Input, etc.
        │   ├── inventario/
        │   │   ├── ProductoModal.tsx
        │   │   └── AjusteStockModal.tsx
        │   ├── ventas/
        │   │   └── NuevaVentaModal.tsx
        │   └── gastos/
        │       └── GastoModal.tsx
        ├── lib/
        │   ├── api.ts            ← Axios + todos los endpoints
        │   └── utils.ts          ← formatCurrency, formatDate, etc.
        └── types/
            └── index.ts          ← Tipos TypeScript completos
```

---

## 🔌 API Endpoints

### Dashboard
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/dashboard` | KPIs, gráficas, top productos |

### Productos
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/productos` | Listar con filtros y paginación |
| GET | `/api/productos/:id` | Detalle de producto |
| POST | `/api/productos` | Crear producto |
| PUT | `/api/productos/:id` | Editar producto |
| DELETE | `/api/productos/:id` | Eliminar (soft delete) |
| GET | `/api/productos/categorias` | Lista de categorías |
| GET | `/api/productos/marcas` | Lista de marcas |
| POST | `/api/productos/importar/excel` | Importar desde .xlsx |
| PATCH | `/api/productos/:id/stock` | Ajustar stock |

### Ventas
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/ventas` | Listar ventas con filtros |
| GET | `/api/ventas/:id` | Detalle de venta |
| POST | `/api/ventas` | Registrar venta (descuenta stock) |
| PATCH | `/api/ventas/:id/cancelar` | Cancelar venta (restaura stock) |
| GET | `/api/ventas/estadisticas` | Stats hoy/semana/mes |

### Gastos
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/gastos` | Listar gastos con filtros |
| GET | `/api/gastos/:id` | Detalle |
| POST | `/api/gastos` | Registrar gasto |
| PUT | `/api/gastos/:id` | Editar gasto |
| DELETE | `/api/gastos/:id` | Eliminar gasto |
| GET | `/api/gastos/categorias` | Lista de categorías |
| GET | `/api/gastos/resumen-mensual` | Resumen por mes y categoría |

### Reportes (Excel)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/reportes/general` | Reporte anual JSON |
| GET | `/api/reportes/exportar/inventario` | Descargar inventario .xlsx |
| GET | `/api/reportes/exportar/ventas` | Descargar ventas .xlsx |
| GET | `/api/reportes/exportar/gastos` | Descargar gastos .xlsx |

---

## 📊 Formato de importación Excel (Inventario)

Para importar productos desde Excel, usa el siguiente formato de columnas:

| SKU | Nombre | Categoria | Marca | Modelo | Precio Compra | Precio Venta | Stock | Stock Minimo |
|---|---|---|---|---|---|---|---|---|
| APL-IP16-128 | iPhone 16 128GB | Smartphones | Apple | iPhone 16 | 19000 | 25999 | 10 | 3 |

- Si el SKU ya existe, el producto se **actualiza**
- Si el SKU no existe, se **crea** uno nuevo
- Las columnas deben tener exactamente esos nombres

---

## 🛠 Comandos útiles

```bash
# Ver base de datos en interfaz visual (Prisma Studio)
cd backend && npx prisma studio --schema=../database/schema.prisma

# Re-ejecutar seed (limpia y repuebla datos de ejemplo)
cd backend && npx tsx ../database/seed.ts

# Verificar que el backend responde
curl http://localhost:3001/health

# Reset completo de la BD (elimina y recrea tablas)
cd backend && npx prisma db push --force-reset --schema=../database/schema.prisma
```

---

## ❗ Solución de problemas comunes

**Error: `Can't reach database server`**
- Verifica que MySQL esté corriendo: `brew services start mysql` (macOS) o `sudo service mysql start` (Linux)
- Revisa usuario/contraseña en `backend/.env`

**Error: `ECONNREFUSED 127.0.0.1:3001`**
- El backend no está corriendo. Ejecuta `npm run dev` en la carpeta `backend/`

**Error: `Module not found`**
- Ejecuta `npm install` dentro de `backend/` y `frontend/` por separado

**Puerto 3000 o 3001 ocupado**
- Cambia `PORT=3002` en `backend/.env`
- O mata el proceso: `lsof -ti:3001 | xargs kill`

**Prisma no encuentra el schema**
- Asegúrate de ejecutar los comandos prisma desde la carpeta `backend/`
- Verifica la ruta: `--schema=../database/schema.prisma`

---

## ✨ Características

- 📦 **Inventario** — CRUD completo, búsqueda, filtros, importar/exportar Excel, ajuste de stock
- 🛒 **Ventas** — Punto de venta tipo POS, carrito interactivo, múltiples métodos de pago, cancelación con restauración de stock
- 💸 **Gastos** — Registro por categorías, filtros por fecha, exportar Excel
- 📈 **Dashboard** — KPIs en tiempo real, gráficas de área/barras/pie, top productos, últimas ventas
- 📊 **Reportes** — Análisis anual, gráficas mensuales, tabla detallada, exportación Excel
- 🔔 **Alertas** — Notificaciones toast, alerta visual de bajo stock
- 🎨 **Diseño** — Estilo Apple, Tailwind CSS, Framer Motion, totalmente responsive
