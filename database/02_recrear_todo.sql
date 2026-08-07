-- =========================================
-- SCRIPT 2: RECREAR TODO (BD COMPLETA)
-- =========================================
-- EJECUTAR EN: Supabase Dashboard → SQL Editor
-- despues de correr 01_borrar_todo.sql
-- Crea todas las tablas con la estructura FINAL
-- (viejas + nuevas columnas + tablas nuevas)
-- =========================================

-- =========================================
-- SECUENCIAS
-- =========================================

CREATE SEQUENCE public.roles_id_seq START 1;
CREATE SEQUENCE public.categorias_id_seq START 1;
CREATE SEQUENCE public.ubicaciones_id_seq START 1;
CREATE SEQUENCE public.proveedores_id_seq START 1;
CREATE SEQUENCE public.usuarios_id_seq START 1;
CREATE SEQUENCE public.productos_id_seq START 1;
CREATE SEQUENCE public.lotes_id_seq START 1;
CREATE SEQUENCE public.entradas_id_seq START 1;
CREATE SEQUENCE public.detalle_entradas_id_seq START 1;
CREATE SEQUENCE public.salidas_id_seq START 1;
CREATE SEQUENCE public.detalle_salidas_id_seq START 1;
CREATE SEQUENCE public.movimientos_inventario_id_seq START 1;
CREATE SEQUENCE public.auditoria_id_seq START 1;
CREATE SEQUENCE public.ventas_id_seq START 1;
CREATE SEQUENCE public.detalle_ventas_id_seq START 1;
CREATE SEQUENCE public.facturas_id_seq START 1;
CREATE SEQUENCE public.detalle_facturas_id_seq START 1;
CREATE SEQUENCE public.ordenes_compra_id_seq START 1;
CREATE SEQUENCE public.detalle_orden_compra_id_seq START 1;

-- =========================================
-- ROLES
-- =========================================

CREATE TABLE public.roles (
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

CREATE TABLE public.categorias (
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

CREATE TABLE public.ubicaciones (
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

CREATE TABLE public.proveedores (
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

CREATE TABLE public.usuarios (
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

CREATE TABLE public.productos (
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

CREATE TABLE public.lotes (
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

CREATE TABLE public.entradas (
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

CREATE TABLE public.detalle_entradas (
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

CREATE TABLE public.salidas (
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

CREATE TABLE public.detalle_salidas (
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

CREATE TABLE public.movimientos_inventario (
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

CREATE TABLE public.auditoria (
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
-- INFORME BAJA (con motivo_baja)
-- =========================================

CREATE TABLE public.informe_baja (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  producto_id bigint,
  usuario_id bigint DEFAULT 1,
  tipo_movimiento text DEFAULT 'BAJA'::text,
  cantidad integer NOT NULL,
  observaciones text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  estado text DEFAULT 'activo'::text,
  motivo_baja text,
  CONSTRAINT informe_baja_pkey PRIMARY KEY (id),
  CONSTRAINT informe_baja_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id)
);

-- =========================================
-- NOTA DESPACHO (con tipo_nota, num_factura, cliente, items)
-- =========================================

CREATE TABLE public.nota_despacho (
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
  tipo_nota text DEFAULT 'entrega'::text,
  num_factura text,
  cliente text,
  items jsonb DEFAULT '[]'::jsonb,
  observaciones text,
  CONSTRAINT nota_despacho_pkey PRIMARY KEY (id)
);

-- =========================================
-- REPORTE INCIDENTES
-- =========================================

CREATE TABLE public.reporte_incidentes (
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
-- ORDEN PREPARACION
-- =========================================

CREATE TABLE public.orden_preparacion (
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
-- VENTAS
-- =========================================

CREATE TABLE public.ventas (
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

-- =========================================
-- DETALLE VENTAS
-- =========================================

CREATE TABLE public.detalle_ventas (
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

-- =========================================
-- FACTURAS
-- =========================================

CREATE TABLE public.facturas (
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

-- =========================================
-- DETALLE FACTURAS
-- =========================================

CREATE TABLE public.detalle_facturas (
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

-- =========================================
-- ORDENES DE COMPRA
-- =========================================

CREATE TABLE public.ordenes_compra (
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

-- =========================================
-- DETALLE ORDEN DE COMPRA
-- =========================================

CREATE TABLE public.detalle_orden_compra (
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

-- =========================================
-- INDEXES
-- =========================================

CREATE INDEX idx_productos_nombre ON productos(nombre);
CREATE INDEX idx_productos_codigo ON productos(codigo_sku);
CREATE INDEX idx_movimientos_fecha ON movimientos_inventario(fecha);
CREATE INDEX idx_lotes_vencimiento ON lotes(fecha_vencimiento);
CREATE INDEX idx_ventas_usuario ON ventas(usuario_id);
CREATE INDEX idx_ventas_fecha ON ventas(fecha);
CREATE INDEX idx_ventas_estado ON ventas(estado);
CREATE INDEX idx_detalle_ventas_venta ON detalle_ventas(venta_id);
CREATE INDEX idx_detalle_ventas_producto ON detalle_ventas(producto_id);
CREATE INDEX idx_facturas_venta ON facturas(venta_id);
CREATE INDEX idx_facturas_numero ON facturas(numero_factura);
CREATE INDEX idx_facturas_fecha ON facturas(fecha);
CREATE INDEX idx_facturas_estado ON facturas(estado);
CREATE INDEX idx_detalle_facturas_factura ON detalle_facturas(factura_id);
CREATE INDEX idx_detalle_facturas_producto ON detalle_facturas(producto_id);
CREATE INDEX idx_ordenes_compra_proveedor ON ordenes_compra(proveedor_id);
CREATE INDEX idx_ordenes_compra_usuario ON ordenes_compra(usuario_id);
CREATE INDEX idx_ordenes_compra_numero ON ordenes_compra(numero_orden);
CREATE INDEX idx_ordenes_compra_estado ON ordenes_compra(estado);
CREATE INDEX idx_detalle_orden_compra_orden ON detalle_orden_compra(orden_compra_id);
CREATE INDEX idx_detalle_orden_compra_producto ON detalle_orden_compra(producto_id);
CREATE INDEX idx_nota_despacho_num_nota ON nota_despacho(num_nota);
CREATE INDEX idx_nota_despacho_num_factura ON nota_despacho(num_factura);
CREATE INDEX idx_informe_baja_producto ON informe_baja(producto_id);
CREATE INDEX idx_informe_baja_motivo ON informe_baja(motivo_baja);
CREATE INDEX idx_reporte_incidentes_num_orden ON reporte_incidentes(num_orden);
CREATE INDEX idx_orden_preparacion_num_orden ON orden_preparacion(num_orden);

-- =========================================
-- DATOS SEMILLA (para que la app funcione)
-- =========================================

INSERT INTO public.roles (nombre, descripcion) VALUES ('admin', 'Administrador del sistema');
INSERT INTO public.roles (nombre, descripcion) VALUES ('gerente', 'Gerente de inventario');
INSERT INTO public.roles (nombre, descripcion) VALUES ('empleado', 'Empleado general');

INSERT INTO public.categorias (nombre, descripcion) VALUES ('General', 'Categoria por defecto');
INSERT INTO public.categorias (nombre, descripcion) VALUES ('Bebidas', 'Productos de bebidas');
INSERT INTO public.categorias (nombre, descripcion) VALUES ('Alimentos', 'Productos alimenticios');

INSERT INTO public.ubicaciones (nombre, descripcion) VALUES ('Almacen Principal', 'Estante principal');
INSERT INTO public.ubicaciones (nombre, descripcion) VALUES ('Almacen Secundario', 'Estante secundario');

INSERT INTO public.proveedores (nombre_empresa, contacto_nombre, telefono, correo) VALUES ('Proveedor General', 'Juan Contacto', '809-000-0000', 'proveedor@general.com');

INSERT INTO public.usuarios (rol_id, nombre, apellido, correo, username, password_hash) VALUES (1, 'Admin', 'Sistema', 'admin@goldcrew.com', 'admin', 'hashed_password_placeholder');

-- Listo. Base de datos recreada con la estructura final.
-- La app deberia funcionar correctamente ahora.
