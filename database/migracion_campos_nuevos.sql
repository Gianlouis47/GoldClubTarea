-- =========================================
-- MIGRACIÓN: Campos nuevos para nota_despacho e informe_baja
-- Proyecto: uuupvfuityioacsscxbj (GoldClubTarea)
-- Ejecutar en: Supabase SQL Editor
-- =========================================

-- =========================================
-- 1. ALTER TABLE nota_despacho
-- Agregar campos para soportar tipo de nota, factura, cliente, items múltiples y observaciones
-- =========================================

ALTER TABLE public.nota_despacho 
  ADD COLUMN IF NOT EXISTS tipo_nota text DEFAULT 'entrega',
  ADD COLUMN IF NOT EXISTS num_factura text,
  ADD COLUMN IF NOT EXISTS cliente text,
  ADD COLUMN IF NOT EXISTS items jsonb,
  ADD COLUMN IF NOT EXISTS observaciones text;

-- =========================================
-- 2. ALTER TABLE informe_baja
-- Agregar campo motivo_baja para el motivo preseleccionado
-- =========================================

ALTER TABLE public.informe_baja 
  ADD COLUMN IF NOT EXISTS motivo_baja text;

-- =========================================
-- 3. Verificar que las tablas nuevas existen (ventas, facturas, etc.)
-- Si NO existen, crearlas aquí:
-- =========================================

-- Tabla ventas
CREATE TABLE IF NOT EXISTS public.ventas (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL,
  fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cliente_nombre VARCHAR(150) NOT NULL,
  cliente_direccion TEXT,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  metodo_pago VARCHAR(50) DEFAULT 'efectivo',
  estado VARCHAR(20) NOT NULL DEFAULT 'activa',
  creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ventas_usuarios FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);

-- Tabla detalle_ventas
CREATE TABLE IF NOT EXISTS public.detalle_ventas (
  id SERIAL PRIMARY KEY,
  venta_id INTEGER NOT NULL,
  producto_id INTEGER NOT NULL,
  cantidad INTEGER NOT NULL,
  precio_unitario NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  CONSTRAINT fk_detalle_ventas_venta FOREIGN KEY (venta_id) REFERENCES public.ventas(id),
  CONSTRAINT fk_detalle_ventas_producto FOREIGN KEY (producto_id) REFERENCES public.productos(id)
);

-- Tabla facturas
CREATE TABLE IF NOT EXISTS public.facturas (
  id SERIAL PRIMARY KEY,
  venta_id INTEGER,
  numero_factura VARCHAR(100) NOT NULL UNIQUE,
  cliente_nombre VARCHAR(150) NOT NULL,
  cliente_direccion TEXT,
  fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  estado VARCHAR(20) NOT NULL DEFAULT 'activa',
  creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_facturas_ventas FOREIGN KEY (venta_id) REFERENCES public.ventas(id)
);

-- Tabla detalle_facturas
CREATE TABLE IF NOT EXISTS public.detalle_facturas (
  id SERIAL PRIMARY KEY,
  factura_id INTEGER NOT NULL,
  producto_id INTEGER NOT NULL,
  cantidad INTEGER NOT NULL,
  precio_unitario NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  CONSTRAINT fk_detalle_facturas_factura FOREIGN KEY (factura_id) REFERENCES public.facturas(id),
  CONSTRAINT fk_detalle_facturas_producto FOREIGN KEY (producto_id) REFERENCES public.productos(id)
);

-- Tabla ordenes_compra
CREATE TABLE IF NOT EXISTS public.ordenes_compra (
  id SERIAL PRIMARY KEY,
  proveedor_id INTEGER,
  usuario_id INTEGER NOT NULL,
  numero_orden VARCHAR(100) NOT NULL UNIQUE,
  fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  observaciones TEXT,
  creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ordenes_compra_proveedores FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id),
  CONSTRAINT fk_ordenes_compra_usuarios FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);

-- Tabla detalle_orden_compra
CREATE TABLE IF NOT EXISTS public.detalle_orden_compra (
  id SERIAL PRIMARY KEY,
  orden_compra_id INTEGER NOT NULL,
  producto_id INTEGER NOT NULL,
  cantidad INTEGER NOT NULL,
  precio_unitario NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  CONSTRAINT fk_detalle_orden_compra_orden FOREIGN KEY (orden_compra_id) REFERENCES public.ordenes_compra(id),
  CONSTRAINT fk_detalle_orden_compra_producto FOREIGN KEY (producto_id) REFERENCES public.productos(id)
);

-- =========================================
-- 4. ÍNDICES para las tablas nuevas
-- =========================================

CREATE INDEX IF NOT EXISTS idx_ventas_usuario ON public.ventas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON public.ventas(fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_estado ON public.ventas(estado);
CREATE INDEX IF NOT EXISTS idx_detalle_ventas_venta ON public.detalle_ventas(venta_id);
CREATE INDEX IF NOT EXISTS idx_detalle_ventas_producto ON public.detalle_ventas(producto_id);
CREATE INDEX IF NOT EXISTS idx_facturas_venta ON public.facturas(venta_id);
CREATE INDEX IF NOT EXISTS idx_facturas_numero ON public.facturas(numero_factura);
CREATE INDEX IF NOT EXISTS idx_facturas_estado ON public.facturas(estado);
CREATE INDEX IF NOT EXISTS idx_detalle_facturas_factura ON public.detalle_facturas(factura_id);
CREATE INDEX IF NOT EXISTS idx_detalle_facturas_producto ON public.detalle_facturas(producto_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_proveedor ON public.ordenes_compra(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_estado ON public.ordenes_compra(estado);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_numero ON public.ordenes_compra(numero_orden);
CREATE INDEX IF NOT EXISTS idx_detalle_orden_compra_orden ON public.detalle_orden_compra(orden_compra_id);
CREATE INDEX IF NOT EXISTS idx_detalle_orden_compra_producto ON public.detalle_orden_compra(producto_id);
CREATE INDEX IF NOT EXISTS idx_informe_baja_estado ON public.informe_baja(estado);
CREATE INDEX IF NOT EXISTS idx_informe_baja_producto ON public.informe_baja(producto_id);

-- =========================================
-- 5. Habilitar RLS (Row Level Security) en tablas nuevas
-- =========================================

ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_orden_compra ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: permitir todo para usuarios autenticados (ajustar según necesidades)
CREATE POLICY "Usuarios autenticados pueden gestionar ventas" ON public.ventas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Usuarios autenticados pueden gestionar detalle_ventas" ON public.detalle_ventas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Usuarios autenticados pueden gestionar facturas" ON public.facturas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Usuarios autenticados pueden gestionar detalle_facturas" ON public.detalle_facturas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Usuarios autenticados pueden gestionar ordenes_compra" ON public.ordenes_compra FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Usuarios autenticados pueden gestionar detalle_orden_compra" ON public.detalle_orden_compra FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================================
-- FIN MIGRACIÓN
-- =========================================