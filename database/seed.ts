import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de base de datos...");

  // Limpiar datos existentes
  await prisma.detalleVenta.deleteMany();
  await prisma.venta.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.gasto.deleteMany();

  // Productos de ejemplo
  const productos = await Promise.all([
    prisma.producto.create({
      data: {
        nombre: "iPhone 15 Pro Max 256GB",
        descripcion: "Apple iPhone 15 Pro Max con chip A17 Pro, pantalla Super Retina XDR 6.7\"",
        sku: "APL-IP15PM-256",
        categoria: "Smartphones",
        marca: "Apple",
        modelo: "iPhone 15 Pro Max",
        precioCompra: 18500,
        precioVenta: 24999,
        stock: 12,
        stockMinimo: 3,
      },
    }),
    prisma.producto.create({
      data: {
        nombre: "Samsung Galaxy S24 Ultra 512GB",
        descripcion: "Samsung Galaxy S24 Ultra con S-Pen, cámara 200MP, pantalla Dynamic AMOLED 2X",
        sku: "SAM-S24U-512",
        categoria: "Smartphones",
        marca: "Samsung",
        modelo: "Galaxy S24 Ultra",
        precioCompra: 16000,
        precioVenta: 22499,
        stock: 8,
        stockMinimo: 3,
      },
    }),
    prisma.producto.create({
      data: {
        nombre: "MacBook Pro 14\" M3 Pro 512GB",
        descripcion: "MacBook Pro 14 pulgadas con chip M3 Pro, 18GB RAM, pantalla Liquid Retina XDR",
        sku: "APL-MBP14-M3P",
        categoria: "Laptops",
        marca: "Apple",
        modelo: "MacBook Pro 14 M3 Pro",
        precioCompra: 35000,
        precioVenta: 45999,
        stock: 5,
        stockMinimo: 2,
      },
    }),
    prisma.producto.create({
      data: {
        nombre: "Dell XPS 15 Intel Core i7 1TB",
        descripcion: "Dell XPS 15 con Intel Core i7-13700H, 32GB DDR5, NVIDIA RTX 4060, pantalla OLED 3.5K",
        sku: "DEL-XPS15-i7",
        categoria: "Laptops",
        marca: "Dell",
        modelo: "XPS 15 9530",
        precioCompra: 28000,
        precioVenta: 36999,
        stock: 4,
        stockMinimo: 2,
      },
    }),
    prisma.producto.create({
      data: {
        nombre: "iPad Pro 12.9\" M2 256GB WiFi",
        descripcion: "iPad Pro 12.9 pulgadas con chip M2, pantalla Liquid Retina XDR, Face ID",
        sku: "APL-IPDP12-M2",
        categoria: "Tablets",
        marca: "Apple",
        modelo: "iPad Pro 12.9 M2",
        precioCompra: 20000,
        precioVenta: 26999,
        stock: 3,
        stockMinimo: 2,
      },
    }),
    prisma.producto.create({
      data: {
        nombre: "AirPods Pro 2da Generación",
        descripcion: "Apple AirPods Pro 2da gen con cancelación activa de ruido, chip H2, estuche MagSafe",
        sku: "APL-APP2-USB",
        categoria: "Audio",
        marca: "Apple",
        modelo: "AirPods Pro 2",
        precioCompra: 3200,
        precioVenta: 4999,
        stock: 20,
        stockMinimo: 5,
      },
    }),
    prisma.producto.create({
      data: {
        nombre: "Sony WH-1000XM5 Negro",
        descripcion: "Audífonos Sony WH-1000XM5 con cancelación de ruido líder en la industria, 30h batería",
        sku: "SON-WH1000XM5-BK",
        categoria: "Audio",
        marca: "Sony",
        modelo: "WH-1000XM5",
        precioCompra: 4500,
        precioVenta: 6499,
        stock: 7,
        stockMinimo: 3,
      },
    }),
    prisma.producto.create({
      data: {
        nombre: "Apple Watch Series 9 45mm GPS",
        descripcion: "Apple Watch Series 9 con chip S9, pantalla Always-On Retina, detección de caída",
        sku: "APL-AW9-45G",
        categoria: "Wearables",
        marca: "Apple",
        modelo: "Watch Series 9",
        precioCompra: 6000,
        precioVenta: 8499,
        stock: 9,
        stockMinimo: 3,
      },
    }),
    prisma.producto.create({
      data: {
        nombre: "Samsung 65\" QLED 4K Smart TV",
        descripcion: "Samsung 65 pulgadas QLED 4K con Quantum Matrix Technology, Neo Quantum HDR+",
        sku: "SAM-QN65-4K",
        categoria: "Televisores",
        marca: "Samsung",
        modelo: "QN65QN90C",
        precioCompra: 22000,
        precioVenta: 29999,
        stock: 2,
        stockMinimo: 1,
      },
    }),
    prisma.producto.create({
      data: {
        nombre: "PlayStation 5 Slim 1TB",
        descripcion: "Sony PlayStation 5 Slim con lector de disco, 1TB SSD, DualSense incluido",
        sku: "SON-PS5S-1TB",
        categoria: "Gaming",
        marca: "Sony",
        modelo: "PS5 Slim",
        precioCompra: 9500,
        precioVenta: 12999,
        stock: 1,
        stockMinimo: 2,
      },
    }),
    prisma.producto.create({
      data: {
        nombre: "Cable USB-C a USB-C 2m Apple",
        descripcion: "Cable Apple USB-C trenzado de 2 metros, soporte para carga rápida 240W",
        sku: "APL-CABC-2M",
        categoria: "Accesorios",
        marca: "Apple",
        modelo: "USB-C Cable 2m",
        precioCompra: 350,
        precioVenta: 699,
        stock: 50,
        stockMinimo: 10,
      },
    }),
    prisma.producto.create({
      data: {
        nombre: "Cargador MagSafe 15W Apple",
        descripcion: "Cargador inalámbrico MagSafe de 15W para iPhone 12 o posterior",
        sku: "APL-MGS-15W",
        categoria: "Accesorios",
        marca: "Apple",
        modelo: "MagSafe Charger",
        precioCompra: 650,
        precioVenta: 1199,
        stock: 4,
        stockMinimo: 5,
      },
    }),
  ]);

  console.log(`✅ ${productos.length} productos creados`);

  // Ventas de ejemplo
  const venta1 = await prisma.venta.create({
    data: {
      folio: "VNT-2024-0001",
      clienteNombre: "Carlos Mendoza",
      clienteEmail: "carlos.mendoza@email.com",
      clienteTelefono: "3311234567",
      subtotal: 29998,
      descuento: 0,
      total: 29998,
      metodoPago: "tarjeta",
      estado: "COMPLETADA",
      createdAt: new Date("2024-11-15T10:30:00"),
      detalles: {
        create: [
          {
            productoId: productos[0].id,
            cantidad: 1,
            precioUnit: 24999,
            subtotal: 24999,
          },
          {
            productoId: productos[5].id,
            cantidad: 1,
            precioUnit: 4999,
            subtotal: 4999,
          },
        ],
      },
    },
  });

  // Actualizar stock
  await prisma.producto.update({ where: { id: productos[0].id }, data: { stock: { decrement: 1 } } });
  await prisma.producto.update({ where: { id: productos[5].id }, data: { stock: { decrement: 1 } } });

  const venta2 = await prisma.venta.create({
    data: {
      folio: "VNT-2024-0002",
      clienteNombre: "Ana García",
      clienteEmail: "ana.garcia@email.com",
      clienteTelefono: "3319876543",
      subtotal: 45999,
      descuento: 1000,
      total: 44999,
      metodoPago: "transferencia",
      estado: "COMPLETADA",
      createdAt: new Date("2024-11-20T14:15:00"),
      detalles: {
        create: [
          {
            productoId: productos[2].id,
            cantidad: 1,
            precioUnit: 45999,
            subtotal: 45999,
          },
        ],
      },
    },
  });
  await prisma.producto.update({ where: { id: productos[2].id }, data: { stock: { decrement: 1 } } });

  const venta3 = await prisma.venta.create({
    data: {
      folio: "VNT-2024-0003",
      clienteNombre: "Roberto Silva",
      subtotal: 13698,
      descuento: 0,
      total: 13698,
      metodoPago: "efectivo",
      estado: "COMPLETADA",
      createdAt: new Date("2024-12-01T09:00:00"),
      detalles: {
        create: [
          {
            productoId: productos[7].id,
            cantidad: 1,
            precioUnit: 8499,
            subtotal: 8499,
          },
          {
            productoId: productos[6].id,
            cantidad: 1,
            precioUnit: 6499,
            subtotal: 6499,
          },
          {
            productoId: productos[10].id,
            cantidad: 1,
            precioUnit: 699,
            subtotal: 699,
          },
        ],
      },
    },
  });
  await prisma.producto.update({ where: { id: productos[7].id }, data: { stock: { decrement: 1 } } });
  await prisma.producto.update({ where: { id: productos[6].id }, data: { stock: { decrement: 1 } } });
  await prisma.producto.update({ where: { id: productos[10].id }, data: { stock: { decrement: 1 } } });

  console.log(`✅ 3 ventas creadas`);

  // Gastos de ejemplo
  await prisma.gasto.createMany({
    data: [
      {
        concepto: "Compra de inventario inicial iPhone 15",
        descripcion: "Compra de 5 unidades iPhone 15 Pro Max al distribuidor",
        categoria: "Inventario",
        monto: 92500,
        fecha: new Date("2024-11-01"),
        proveedor: "DistrApple México",
      },
      {
        concepto: "Renta local comercial noviembre",
        descripcion: "Renta mensual del local en Galerías",
        categoria: "Renta",
        monto: 18000,
        fecha: new Date("2024-11-01"),
        proveedor: "Inmuebles Comerciales SA",
      },
      {
        concepto: "Servicios de internet y teléfono",
        descripcion: "Plan empresarial fibra óptica 1GB + telefonía",
        categoria: "Servicios",
        monto: 1200,
        fecha: new Date("2024-11-05"),
        proveedor: "Telmex",
      },
      {
        concepto: "Sueldos empleados noviembre",
        descripcion: "Nómina quincena 1 y 2 de noviembre",
        categoria: "Nómina",
        monto: 28000,
        fecha: new Date("2024-11-30"),
        proveedor: null,
      },
      {
        concepto: "Compra accesorios y cables",
        descripcion: "Lote de accesorios: cables, cargadores, protectores",
        categoria: "Inventario",
        monto: 15000,
        fecha: new Date("2024-12-01"),
        proveedor: "Accesorios Tech MX",
      },
      {
        concepto: "Publicidad Facebook e Instagram",
        descripcion: "Campaña publicitaria diciembre productos Apple",
        categoria: "Marketing",
        monto: 5000,
        fecha: new Date("2024-12-01"),
        proveedor: "Meta Ads",
      },
      {
        concepto: "Renta local comercial diciembre",
        descripcion: "Renta mensual del local en Galerías",
        categoria: "Renta",
        monto: 18000,
        fecha: new Date("2024-12-01"),
        proveedor: "Inmuebles Comerciales SA",
      },
    ],
  });

  console.log(`✅ Gastos creados`);
  console.log("🎉 Seed completado exitosamente");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
