-- =========================================
-- GOLDCREW INVENTARIO DATABASE
-- PostgreSQL / Supabase
-- =========================================
-- ADVERTENCIA: Este schema refleja el estado ACTUAL de la BD en Supabase.
-- Las tablas que ya existen NO deben recrearse (se perderían datos).
-- Para tablas nuevas, usar database/migraciones_nuevas_tablas.sql
-- =========================================

-- =========================================
-- ROLES
-- =========================================

CREATE TABLE IF NOT EXISTS public.roles (
  id integer NOT NULL DEFAULT nextval('roles_id_seq'::regclass),
  nombre character varying NOT NULL UNIQUE,
  descripcion text,
  activo boolean NOT NULL DEFAULT true,
  creado_en timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);

-- =========================================
-- CATEGORIAS
-- =========================================

CREATE TABLE IF NOT EXISTS public.categorias (
  id integer NOT NULL DEFAULT nextval('categorias_id_seq'::regclass),
  nombre character varying NOT NULL UNIQUE,
  descripcion text,
  activo boolean NOT NULL DEFAULT true,
  creado_en timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT categorias_pkey PRIMARY KEY (id)
);

-- =========================================
-- UBICACIONES
-- =========================================

CREATE TABLE IF NOT EXISTS public.ubicaciones (
  id integer NOT NULL DEFAULT nextval('ubicaciones_id_seq'::regclass),
  nombre character varying NOT NULL,
  descripcion text,
  activo boolean NOT NULL DEFAULT true,
  creado_en timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ubicaciones_pkey PRIMARY KEY (id)
);

-- =========================================
-- PROVEEDORES
-- =========================================

CREATE TABLE IF NOT EXISTS public.proveedores (
  id integer NOT NULL DEFAULT nextval('proveedores_id_seq'::regclass),
  nombre_empresa character varying NOT NULL,
  contacto_nombre character varying,
  telefono character varying,
  correo character varying,
  direccion text,
  rnc character varying,
  activo boolean NOT NULL DEFAULT true,
  creado_en timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT proveedores_pkey PRIMARY KEY (id)
);

-- =========================================
-- USUARIOS
-- =========================================

CREATE TABLE IF NOT EXISTS public.usuarios (
  id integer NOT NULL DEFAULT nextval('usuarios_id_seq'::regclass),
  rol_id integer NOT NULL,
  nombre character varying NOT NULL,
  apellido character varying NOT NULL,
  correo character varying NOT NULL UNIQUE,
  username character varying NOT NULL UNIQUE,
  password_hash text NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  creado_en timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT usuarios_pkey PRIMARY KEY (id),
  CONSTRAINT fk_usuarios_roles FOREIGN KEY (rol_id) REFERENCES public.roles(id)
);

-- =========================================
-- PRODUCTOS
-- =========================================

CREATE TABLE IF NOT EXISTS public.productos (
  id integer NOT NULL DEFAULT nextval('productos_id_seq'::regclass),
  categoria_id integer NOT NULL,
  proveedor_id integer,
  ubicacion_id integer,
  nombre character varying NOT NULL,
  descripcion text,
  codigo_sku character varying NOT NULL UNIQUE,
  marca character varying,
  modelo character varying,
  precio_compra numeric NOT NULL,
  precio_venta numeric NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  stock_minimo integer NOT NULL DEFAULT 0,
  unidad_medida character varying NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  creado_en timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado text DEFAULT 'activo'::text,
  CONSTRAINT productos_pkey PRIMARY KEY (id),
  CONSTRAINT fk_productos_categorias FOREIGN KEY (categoria_id) REFERENCES public.categorias(id),
  CONSTRAINT fk_productos_proveedores FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id),
  CONSTRAINT fk_productos_ubicaciones FOREIGN KEY (ubicacion_id) REFERENCES public.ubicaciones(id)
);

-- =========================================
-- LOTES
-- =========================================

CREATE TABLE IF NOT EXISTS public.lotes (
  id integer NOT NULL DEFAULT nextval('lotes_id_seq'::regclass),
  producto_id integer NOT NULL,
  codigo_lote character varying NOT NULL,
  fecha_entrada date NOT NULL,
  fecha_vencimiento date,
  cantidad integer NOT NULL,
  creado_en timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT lotes_pkey PRIMARY KEY (id),
  CONSTRAINT fk_lotes_productos FOREIGN KEY (producto_id) REFERENCES public.productos(id)
);

-- =========================================
-- ENTRADAS
-- =========================================

CREATE TABLE IF NOT EXISTS public.entradas (
  id integer NOT NULL DEFAULT nextval('entradas_id_seq'::regclass),
  usuario_id integer NOT NULL,
  proveedor_id integer,
  fecha timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  numero_factura character varying,
  observaciones text,
  creado_en timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT entradas_pkey PRIMARY KEY (id),
  CONSTRAINT fk_entradas_usuarios FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id),
  CONSTRAINT fk_entradas_proveedores FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id)
);

-- =========================================
-- DETALLE ENTRADAS
-- =========================================

CREATE TABLE IF NOT EXISTS public.detalle_entradas (
  id integer NOT NULL DEFAULT nextval('detalle_entradas_id_seq'::regclass),
  entrada_id integer NOT NULL,
  producto_id integer NOT NULL,
  cantidad integer NOT NULL,
  precio_unitario numeric NOT NULL,
  subtotal numeric NOT NULL,
  CONSTRAINT detalle_entradas_pkey PRIMARY KEY (id),
  CONSTRAINT fk_detalle_entradas_entrada FOREIGN KEY (entrada_id) REFERENCES public.entradas(id),
  CONSTRAINT fk_detalle_entradas_producto FOREIGN KEY (producto_id) REFERENCES public.productos(id)
);

-- =========================================
-- SALIDAS
-- =========================================

CREATE TABLE IF NOT EXISTS public.salidas (
  id integer NOT NULL DEFAULT nextval('salidas_id_seq'::regclass),
  usuario_id integer NOT NULL,
  fecha timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tipo_salida character varying NOT NULL,
  destinatario character varying,
  observaciones text,
  creado_en timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT salidas_pkey PRIMARY KEY (id),
  CONSTRAINT fk_salidas_usuarios FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);

-- =========================================
-- DETALLE SALIDAS
-- =========================================

CREATE TABLE IF NOT EXISTS public.detalle_salidas (
  id integer NOT NULL DEFAULT nextval('detalle_salidas_id_seq'::regclass),
  salida_id integer NOT NULL,
  producto_id integer NOT NULL,
  cantidad integer NOT NULL,
  CONSTRAINT detalle_salidas_pkey PRIMARY KEY (id),
  CONSTRAINT fk_detalle_salidas_salida FOREIGN KEY (salida_id) REFERENCES public.salidas(id),
  CONSTRAINT fk_detalle_salidas_producto FOREIGN KEY (producto_id) REFERENCES public.productos(id)
);

-- =========================================
-- MOVIMIENTOS INVENTARIO
-- =========================================

CREATE TABLE IF NOT EXISTS public.movimientos_inventario (
  id integer NOT NULL DEFAULT nextval('movimientos_inventario_id_seq'::regclass),
  producto_id integer NOT NULL,
  usuario_id integer NOT NULL,
  tipo_movimiento character varying NOT NULL,
  cantidad integer NOT NULL,
  referencia character varying,
  observaciones text,
  fecha timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT movimientos_inventario_pkey PRIMARY KEY (id),
  CONSTRAINT fk_movimientos_productos FOREIGN KEY (producto_id) REFERENCES public.productos(id),
  CONSTRAINT fk_movimientos_usuarios FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);

-- =========================================
-- AUDITORIA
-- =========================================

CREATE TABLE IF NOT EXISTS public.auditoria (
  id integer NOT NULL DEFAULT nextval('auditoria_id_seq'::regclass),
  usuario_id integer,
  tabla_afectada character varying NOT NULL,
  accion character varying NOT NULL,
  registro_id integer,
  descripcion text,
  fecha timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT auditoria_pkey PRIMARY KEY (id),
  CONSTRAINT fk_auditoria_usuarios FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);

-- =========================================
-- INFORME BAJA (tal cual existe en Supabase)
-- =========================================

CREATE TABLE IF NOT EXISTS public.informe_baja (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  producto_id bigint,
  usuario_id bigint DEFAULT 1,
  tipo_movimiento text DEFAULT 'BAJA'::text,
  cantidad integer NOT NULL,
  observaciones text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  estado text DEFAULT 'activo'::text,
  CONSTRAINT informe_baja_pkey PRIMARY KEY (id),
  CONSTRAINT informe_baja_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id)
);

-- =========================================
-- NOTA DESPACHO (tal cual existe en Supabase)
-- =========================================

CREATE TABLE IF NOT EXISTS public.nota_despacho (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  num_nota text,
  fecha_emision text,
  direccion text,
  descripcion text,
  codigo text,
  num_orden text,
  cantidad integer NOT NULL,
  receptor text,
  encargado text,
  estado text DEFAULT 'activo'::text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT nota_despacho_pkey PRIMARY KEY (id)
);

-- =========================================
-- REPORTE INCIDENTES (tal cual existe en Supabase)
-- =========================================

CREATE TABLE IF NOT EXISTS public.reporte_incidentes (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  num_orden text,
  fecha_incidente text,
  codigo_producto text,
  cantidad integer NOT NULL DEFAULT 0,
  faltante text,
  descripcion text,
  creado_por text DEFAULT 'Juan Pérez'::text,
  estado text DEFAULT 'activo'::text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT reporte_incidentes_pkey PRIMARY KEY (id)
);

-- =========================================
-- ORDEN PREPARACION (tal cual existe en Supabase)
-- =========================================

CREATE TABLE IF NOT EXISTS public.orden_preparacion (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  num_orden text,
  codigo text,
  cantidad integer NOT NULL DEFAULT 0,
  destino text,
  recibido boolean NOT NULL DEFAULT true,
  creado_por text DEFAULT 'Juan Pérez'::text,
  estado text DEFAULT 'activo'::text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT orden_preparacion_pkey PRIMARY KEY (id)
);

-- =========================================
-- INDEXES EXISTENTES
-- =========================================

CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos(nombre);
CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo_sku);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_inventario(fecha);
CREATE INDEX IF NOT EXISTS idx_lotes_vencimiento ON lotes(fecha_vencimiento);
