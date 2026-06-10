import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { productosRouter } from "./routes/productos";
import { ventasRouter } from "./routes/ventas";
import { gastosRouter } from "./routes/gastos";
import { reportesRouter } from "./routes/reportes";
import { dashboardRouter } from "./routes/dashboard";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/dashboard", dashboardRouter);
app.use("/api/productos", productosRouter);
app.use("/api/ventas", ventasRouter);
app.use("/api/gastos", gastosRouter);
app.use("/api/reportes", reportesRouter);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 ElectroStock API corriendo en http://localhost:${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || "development"}`);
});

export default app;
