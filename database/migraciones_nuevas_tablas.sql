-- =========================================
-- MIGRACIÓN: NUEVAS TABLAS (Ventas, Facturas, Órdenes de Compra)
-- =========================================
-- Este archivo SOLO crea tablas nuevas que no existían antes.
-- Usa CREATE TABLE IF NOT EXISTS para que sea seguro de correr.
-- NO toca las tablas existentes (no se pierden datos).
-- =========================================

-- =========================================
-- VENTAS
-- =========================================

CREATE TABLE IF NOT EXISTS public.ventas (
  id integer NOT NULL DEFAULT nextval('ventas_id_seq'::regclass),
  usuario_id integer NOT NULL,
  fecha timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cliente_nombre character varying NOT NULL,
  cliente_direccion text,
  total numeric NOT NULL DEFAULT 0,
  metodo_pago character varying DEFAULT 'efectivo'::character varying,
  estado character varying NOT NULL DEFAULT 'activa'::character varying,
  creado_en timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ventas_pkey PRIMARY KEY (id),
  CONSTRAINT fk_ventas_usuarios FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);

-- Crear secuencia si no existe
CREATE SEQUENCE IF NOT EXISTS public.ventas_id_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;
ALTER SEQUENCE public.ventas_id_seq OWNED BY public.ventas.id;

-- =========================================
-- DETALLE VENTAS
-- =========================================

CREATE TABLE IF NOT EXISTS public.detalle_ventas (
  id integer NOT NULL DEFAULT nextval('detalle_ventas_id_seq'::regclass),
  venta_id integer NOT NULL,
  producto_id integer NOT NULL,
  cantidad integer NOT NULL,
  precio_unitario numeric NOT NULL,
  subtotal numeric NOT NULL,
  CONSTRAINT detalle_ventas_pkey PRIMARY KEY (id),
  CONSTRAINT fk_detalle_ventas_venta FOREIGN KEY (venta_id) REFERENCES public.ventas(id),
  CONSTRAINT fk_detalle_ventas_producto FOREIGN KEY (producto_id) REFERENCES public.productos(id)
);

CREATE SEQUENCE IF NOT EXISTS public.detalle_ventas_id_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;
ALTER SEQUENCE public.detalle_ventas_id_seq OWNED BY public.detalle_ventas.id;

-- =========================================
-- FACTURAS
-- =========================================

CREATE TABLE IF NOT EXISTS public.facturas (
  id integer NOT NULL DEFAULT nextval('facturas_id_seq'::regclass),
  venta_id integer,
  numero_factura character varying NOT NULL UNIQUE,
  cliente_nombre character varying NOT NULL,
  cliente_direccion text,
  fecha timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total numeric NOT NULL DEFAULT 0,
  estado character varying NOT NULL DEFAULT 'activa'::character varying,
  creado_en timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT facturas_pkey PRIMARY KEY (id),
  CONSTRAINT fk_facturas_ventas FOREIGN KEY (venta_id) REFERENCES public.ventas(id)
);

CREATE SEQUENCE IF NOT EXISTS public.facturas_id_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;
ALTER SEQUENCE public.facturas_id_seq OWNED BY public.facturas.id;

-- =========================================
-- DETALLE FACTURAS
-- =========================================

CREATE TABLE IF NOT EXISTS public.detalle_facturas (
  id integer NOT NULL DEFAULT nextval('detalle_facturas_id_seq'::regclass),
  factura_id integer NOT NULL,
  producto_id integer NOT NULL,
  cantidad integer NOT NULL,
  precio_unitario numeric NOT NULL,
  subtotal numeric NOT NULL,
  CONSTRAINT detalle_facturas_pkey PRIMARY KEY (id),
  CONSTRAINT fk_detalle_facturas_factura FOREIGN KEY (factura_id) REFERENCES public.facturas(id),
  CONSTRAINT fk_detalle_facturas_producto FOREIGN KEY (producto_id) REFERENCES public.productos(id)
);

CREATE SEQUENCE IF NOT EXISTS public.detalle_facturas_id_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;
ALTER SEQUENCE public.detalle_facturas_id_seq OWNED BY public.detalle_facturas.id;

-- =========================================
-- ORDENES DE COMPRA
-- =========================================

CREATE TABLE IF NOT EXISTS public.ordenes_compra (
  id integer NOT NULL DEFAULT nextval('ordenes_compra_id_seq'::regclass),
  proveedor_id integer,
  usuario_id integer NOT NULL,
  numero_orden character varying NOT NULL UNIQUE,
  fecha timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado character varying NOT NULL DEFAULT 'pendiente'::character varying,
  observaciones text,
  creado_en timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ordenes_compra_pkey PRIMARY KEY (id),
  CONSTRAINT fk_ordenes_compra_proveedores FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id),
  CONSTRAINT fk_ordenes_compra_usuarios FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);

CREATE SEQUENCE IF NOT EXISTS public.ordenes_compra_id_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;
ALTER SEQUENCE public.ordenes_compra_id_seq OWNED BY public.ordenes_compra.id;

-- =========================================
-- DETALLE ORDEN DE COMPRA
-- =========================================

CREATE TABLE IF NOT EXISTS public.detalle_orden_compra (
  id integer NOT NULL DEFAULT nextval('detalle_orden_compra_id_seq'::regclass),
  orden_compra_id integer NOT NULL,
  producto_id integer NOT NULL,
  cantidad integer NOT NULL,
  precio_unitario numeric NOT NULL,
  subtotal numeric NOT NULL,
  CONSTRAINT detalle_orden_compra_pkey PRIMARY KEY (id),
  CONSTRAINT fk_detalle_orden_compra_orden FOREIGN KEY (orden_compra_id) REFERENCES public.ordenes_compra(id),
  CONSTRAINT fk_detalle_orden_compra_producto FOREIGN KEY (producto_id) REFERENCES public.productos(id)
);

CREATE SEQUENCE IF NOT EXISTS public.detalle_orden_compra_id_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;
ALTER SEQUENCE public.detalle_orden_compra_id_seq OWNED BY public.detalle_orden_compra.id;

-- =========================================
-- INDEXES NUEVOS
-- =========================================

CREATE INDEX IF NOT EXISTS idx_ventas_usuario ON ventas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_estado ON ventas(estado);
CREATE INDEX IF NOT EXISTS idx_detalle_ventas_venta ON detalle_ventas(venta_id);
CREATE INDEX IF NOT EXISTS idx_detalle_ventas_producto ON detalle_ventas(producto_id);
CREATE INDEX IF NOT EXISTS idx_facturas_venta ON facturas(venta_id);
CREATE INDEX IF NOT EXISTS idx_facturas_numero ON facturas(numero_factura);
CREATE INDEX IF NOT EXISTS idx_facturas_fecha ON facturas(fecha);
CREATE INDEX IF NOT EXISTS idx_facturas_estado ON facturas(estado);
CREATE INDEX IF NOT EXISTS idx_detalle_facturas_factura ON detalle_facturas(factura_id);
CREATE INDEX IF NOT EXISTS idx_detalle_facturas_producto ON detalle_facturas(producto_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_proveedor ON ordenes_compra(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_usuario ON ordenes_compra(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_numero ON ordenes_compra(numero_orden);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_estado ON ordenes_compra(estado);
CREATE INDEX IF NOT EXISTS idx_detalle_orden_compra_orden ON detalle_orden_compra(orden_compra_id);
CREATE INDEX IF NOT EXISTS idx_detalle_orden_compra_producto ON detalle_orden_compra(producto_id);

-- =========================================
-- COLUMNAS NUEVAS EN TABLAS EXISTENTES
-- =========================================
-- Agregar columna motivo_baja a informe_baja si no existe
-- (La app la usa para guardar el motivo preseleccionado)
-- Nota: Si la columna ya existe, este comando no hace nada.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'informe_baja' AND column_name = 'motivo_baja'
    ) THEN
        ALTER TABLE public.informe_baja ADD COLUMN motivo_baja text;
    END IF;
END $$;

-- Agregar columnas nuevas a nota_despacho si no existen
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'nota_despacho' AND column_name = 'tipo_nota'
    ) THEN
        ALTER TABLE public.nota_despacho ADD COLUMN tipo_nota text DEFAULT 'entrega';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'nota_despacho' AND column_name = 'num_factura'
    ) THEN
        ALTER TABLE public.nota_despacho ADD COLUMN num_factura text;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'nota_despacho' AND column_name = 'cliente'
    ) THEN
        ALTER TABLE public.nota_despacho ADD COLUMN cliente text;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'nota_despacho' AND column_name = 'items'
    ) THEN
        ALTER TABLE public.nota_despacho ADD COLUMN items jsonb DEFAULT '[]'::jsonb;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_nota_despacho_num_nota ON nota_despacho(num_nota);
CREATE INDEX IF NOT EXISTS idx_nota_despacho_num_factura ON nota_despacho(num_factura);
CREATE INDEX IF NOT EXISTS idx_informe_baja_motivo ON informe_baja(motivo_baja);
