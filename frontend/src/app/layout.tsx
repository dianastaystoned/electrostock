import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "ElectroStock — Sistema de Gestión",
  description: "Sistema de inventario, ventas y control de gastos para tienda de electrónicos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-[#f5f5f7] min-h-screen">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          {/* pt-16 en móvil para no tapar el botón hamburguesa */}
          <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
            {children}
          </main>
        </div>
        <Toaster position="top-right" richColors expand={false} duration={4000} />
      </body>
    </html>
  );
}
