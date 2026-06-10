"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Package, ShoppingCart,
  Receipt, BarChart3, Zap, ChevronRight, Menu, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventario", label: "Inventario", icon: Package },
  { href: "/ventas", label: "Ventas", icon: ShoppingCart },
  { href: "/gastos", label: "Gastos", icon: Receipt },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-white/95 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight">ElectroStock</p>
            <p className="text-[10px] text-muted-foreground">Sistema de Gestión</p>
          </div>
        </div>
        {/* Botón cerrar solo en móvil/tablet */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} onClick={onClose}>
              <motion.div
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <Icon className={cn("w-4 h-4 relative z-10", isActive ? "text-primary" : "")} />
                <span className="relative z-10">{item.label}</span>
                {isActive && (
                  <ChevronRight className="w-3 h-3 ml-auto relative z-10 text-primary/60" />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border/50">
        <div className="flex items-center gap-3 px-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">Admin</p>
            <p className="text-[10px] text-muted-foreground truncate">Tienda ElectroStock</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Botón hamburguesa (solo móvil/tablet) ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white rounded-xl shadow-md border border-border/50 flex items-center justify-center"
      >
        <Menu className="w-5 h-5 text-foreground" />
      </button>

      {/* ── Sidebar desktop fijo (md+) ── */}
      <aside className="hidden md:flex w-60 flex-col shrink-0 border-r border-border/50">
        <SidebarContent />
      </aside>

      {/* ── Sidebar móvil/tablet con overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Overlay oscuro */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />

            {/* Panel sidebar */}
            <motion.div
              key="sidebar"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-72"
            >
              <SidebarContent onClose={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
