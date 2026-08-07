// =========================================
// Esquema SQLite local (modo escritorio / Electron)
// =========================================
// Traduccion de database/02_recrear_todo.sql (+ database/migracion_orden_preparacion.sql,
// que agrego la columna `recibido` a orden_preparacion) de sintaxis PostgreSQL a SQLite.
//
// Equivalencias usadas:
//   - "integer ... DEFAULT nextval(...)"      -> "INTEGER PRIMARY KEY AUTOINCREMENT"
//   - "bigint GENERATED ALWAYS AS IDENTITY"   -> "INTEGER PRIMARY KEY AUTOINCREMENT"
//   - "character varying" / "text"            -> "TEXT"
//   - "timestamp with time zone DEFAULT ..."  -> "TEXT DEFAULT CURRENT_TIMESTAMP"
//     (SQLite no tiene tipo de fecha nativo; CURRENT_TIMESTAMP genera texto UTC
//      "YYYY-MM-DD HH:MM:SS", suficiente para esta app que solo muestra/ordena fechas)
//   - "numeric"                                -> "REAL"
//   - "boolean DEFAULT true/false"             -> "INTEGER DEFAULT 1/0"
//     (el adaptador en engine.js convierte 1/0 <-> true/false al leer/escribir,
//      ver BOOLEAN_COLUMNS mas abajo)
//   - "jsonb"                                  -> "TEXT" (se guarda el JSON como texto)
//   - Las secuencias (CREATE SEQUENCE ...) se eliminan: AUTOINCREMENT las reemplaza.
//   - Las politicas RLS (database/03_politicas_rls.sql) NO se replican: son todas
//     `USING (true)`, sin logica de negocio real.
// =========================================

export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ubicaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE proveedores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre_empresa TEXT NOT NULL,
  contacto_nombre TEXT,
  telefono TEXT,
  correo TEXT,
  direccion TEXT,
  rnc TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rol_id INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  correo TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rol_id) REFERENCES roles(id)
);

CREATE TABLE productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  categoria_id INTEGER NOT NULL,
  proveedor_id INTEGER,
  ubicacion_id INTEGER,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  codigo_sku TEXT NOT NULL UNIQUE,
  marca TEXT,
  modelo TEXT,
  precio_compra REAL NOT NULL,
  precio_venta REAL NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  stock_minimo INTEGER NOT NULL DEFAULT 0,
  unidad_medida TEXT NOT NULL,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado TEXT DEFAULT 'activo',
  FOREIGN KEY (categoria_id) REFERENCES categorias(id),
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
  FOREIGN KEY (ubicacion_id) REFERENCES ubicaciones(id)
);

CREATE TABLE lotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  producto_id INTEGER NOT NULL,
  codigo_lote TEXT NOT NULL,
  fecha_entrada TEXT NOT NULL,
  fecha_vencimiento TEXT,
  cantidad INTEGER NOT NULL,
  creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE TABLE entradas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  proveedor_id INTEGER,
  fecha TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  numero_factura TEXT,
  observaciones TEXT,
  creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
);

CREATE TABLE detalle_entradas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entrada_id INTEGER NOT NULL,
  producto_id INTEGER NOT NULL,
  cantidad INTEGER NOT NULL,
  precio_unitario REAL NOT NULL,
  subtotal REAL NOT NULL,
  FOREIGN KEY (entrada_id) REFERENCES entradas(id),
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE TABLE salidas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  fecha TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tipo_salida TEXT NOT NULL,
  destinatario TEXT,
  observaciones TEXT,
  creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE detalle_salidas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  salida_id INTEGER NOT NULL,
  producto_id INTEGER NOT NULL,
  cantidad INTEGER NOT NULL,
  FOREIGN KEY (salida_id) REFERENCES salidas(id),
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE TABLE movimientos_inventario (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  producto_id INTEGER NOT NULL,
  usuario_id INTEGER NOT NULL,
  tipo_movimiento TEXT NOT NULL,
  cantidad INTEGER NOT NULL,
  referencia TEXT,
  observaciones TEXT,
  fecha TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE auditoria (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER,
  tabla_afectada TEXT NOT NULL,
  accion TEXT NOT NULL,
  registro_id INTEGER,
  descripcion TEXT,
  fecha TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE informe_baja (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  producto_id INTEGER,
  usuario_id INTEGER DEFAULT 1,
  tipo_movimiento TEXT DEFAULT 'BAJA',
  cantidad INTEGER NOT NULL,
  observaciones TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado TEXT DEFAULT 'activo',
  motivo_baja TEXT,
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE TABLE nota_despacho (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  num_nota TEXT,
  fecha_emision TEXT,
  direccion TEXT,
  descripcion TEXT,
  codigo TEXT,
  num_orden TEXT,
  cantidad INTEGER NOT NULL,
  receptor TEXT,
  encargado TEXT,
  estado TEXT DEFAULT 'activo',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tipo_nota TEXT DEFAULT 'entrega',
  num_factura TEXT,
  cliente TEXT,
  items TEXT DEFAULT '[]',
  observaciones TEXT
);

CREATE TABLE reporte_incidentes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  num_orden TEXT,
  fecha_incidente TEXT,
  codigo_producto TEXT,
  cantidad INTEGER NOT NULL DEFAULT 0,
  faltante TEXT,
  descripcion TEXT,
  creado_por TEXT DEFAULT 'Juan Pérez',
  estado TEXT DEFAULT 'activo',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orden_preparacion (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  num_orden TEXT,
  codigo TEXT,
  cantidad INTEGER NOT NULL DEFAULT 0,
  destino TEXT,
  recibido INTEGER NOT NULL DEFAULT 1,
  creado_por TEXT DEFAULT 'Juan Pérez',
  estado TEXT DEFAULT 'activo',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ventas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  fecha TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cliente_nombre TEXT NOT NULL,
  cliente_direccion TEXT,
  total REAL NOT NULL DEFAULT 0,
  metodo_pago TEXT DEFAULT 'efectivo',
  estado TEXT NOT NULL DEFAULT 'activa',
  creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE detalle_ventas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venta_id INTEGER NOT NULL,
  producto_id INTEGER NOT NULL,
  cantidad INTEGER NOT NULL,
  precio_unitario REAL NOT NULL,
  subtotal REAL NOT NULL,
  FOREIGN KEY (venta_id) REFERENCES ventas(id),
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE TABLE facturas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venta_id INTEGER,
  numero_factura TEXT NOT NULL UNIQUE,
  cliente_nombre TEXT NOT NULL,
  cliente_direccion TEXT,
  fecha TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total REAL NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'activa',
  creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (venta_id) REFERENCES ventas(id)
);

CREATE TABLE detalle_facturas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  factura_id INTEGER NOT NULL,
  producto_id INTEGER NOT NULL,
  cantidad INTEGER NOT NULL,
  precio_unitario REAL NOT NULL,
  subtotal REAL NOT NULL,
  FOREIGN KEY (factura_id) REFERENCES facturas(id),
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE TABLE ordenes_compra (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proveedor_id INTEGER,
  usuario_id INTEGER NOT NULL,
  numero_orden TEXT NOT NULL UNIQUE,
  fecha TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  observaciones TEXT,
  creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE detalle_orden_compra (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_compra_id INTEGER NOT NULL,
  producto_id INTEGER NOT NULL,
  cantidad INTEGER NOT NULL,
  precio_unitario REAL NOT NULL,
  subtotal REAL NOT NULL,
  FOREIGN KEY (orden_compra_id) REFERENCES ordenes_compra(id),
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

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
`

// =========================================
// Datos semilla
// =========================================
// Usuario admin: correo admin@goldclub.com / usuario "admin" / clave "admin123"
// (hash bcrypt generado con bcryptjs, ver src/lib/local/authLocal.js).
// Cambia esta clave despues del primer ingreso: no hay pantalla de
// "recuperar contrasena" en el modo local (ver limitaciones en el README).
const HASH_ADMIN = '$2b$10$ulz1TcyfFxPByMiYb7hOEuIRnFSlt.262IPc3agh2EwVn9ic5m0GW'

export const SEED_SQL = `
INSERT INTO roles (nombre, descripcion) VALUES ('admin', 'Administrador del sistema');
INSERT INTO roles (nombre, descripcion) VALUES ('gerente', 'Gerente de inventario');
INSERT INTO roles (nombre, descripcion) VALUES ('empleado', 'Empleado general');

INSERT INTO categorias (nombre, descripcion) VALUES ('General', 'Categoria por defecto');
INSERT INTO categorias (nombre, descripcion) VALUES ('Bebidas', 'Productos de bebidas');
INSERT INTO categorias (nombre, descripcion) VALUES ('Alimentos', 'Productos alimenticios');

INSERT INTO ubicaciones (nombre, descripcion) VALUES ('Almacen Principal', 'Estante principal');
INSERT INTO ubicaciones (nombre, descripcion) VALUES ('Almacen Secundario', 'Estante secundario');

INSERT INTO proveedores (nombre_empresa, contacto_nombre, telefono, correo, activo)
  VALUES ('Proveedor General', 'Juan Contacto', '809-000-0000', 'proveedor@general.com', 1);

INSERT INTO usuarios (rol_id, nombre, apellido, correo, username, password_hash, activo)
  VALUES (1, 'Admin', 'Sistema', 'admin@goldclub.com', 'admin', '${HASH_ADMIN}', 1);

INSERT INTO productos (categoria_id, proveedor_id, ubicacion_id, nombre, codigo_sku, precio_compra, precio_venta, stock, stock_minimo, unidad_medida, activo, estado)
  VALUES (2, 1, 1, 'Ron Barcelo Imperial', 'BEB-0001', 450.00, 650.00, 24, 5, 'botella', 1, 'activo');
INSERT INTO productos (categoria_id, proveedor_id, ubicacion_id, nombre, codigo_sku, precio_compra, precio_venta, stock, stock_minimo, unidad_medida, activo, estado)
  VALUES (2, 1, 1, 'Cerveza Presidente', 'BEB-0002', 60.00, 100.00, 120, 24, 'unidad', 1, 'activo');
INSERT INTO productos (categoria_id, proveedor_id, ubicacion_id, nombre, codigo_sku, precio_compra, precio_venta, stock, stock_minimo, unidad_medida, activo, estado)
  VALUES (3, 1, 2, 'Pica Pollo (porcion)', 'ALI-0001', 120.00, 220.00, 15, 5, 'porcion', 1, 'activo');

-- Orden de compra ya recibida, para que Recepcion/Historial no arranquen vacios.
INSERT INTO ordenes_compra (proveedor_id, usuario_id, numero_orden, estado, observaciones)
  VALUES (1, 1, 'OC-00001', 'recibida', 'Orden semilla de ejemplo, ya recibida.');
INSERT INTO detalle_orden_compra (orden_compra_id, producto_id, cantidad, precio_unitario, subtotal)
  VALUES (1, 1, 24, 450.00, 10800.00);
INSERT INTO detalle_orden_compra (orden_compra_id, producto_id, cantidad, precio_unitario, subtotal)
  VALUES (1, 2, 120, 60.00, 7200.00);
`

/**
 * Relaciones "embebidas" que el frontend pide con la sintaxis de supabase-js
 * `.select('col, tabla_relacionada(col1, col2)')`. Son todas relaciones
 * "pertenece a" (belongs-to): la tabla principal tiene una columna
 * `<relacion>_id` que apunta al `id` de la tabla relacionada.
 *
 * Inventario COMPLETO verificado con:
 *   grep -rn "\\.select(" src --include="*.jsx" --include="*.js"
 */
export const RELATION_FK = {
  productos: 'producto_id',
  proveedores: 'proveedor_id',
  ubicaciones: 'ubicacion_id',
  usuarios: 'usuario_id',
}

/** Columnas booleanas por tabla (se guardan como INTEGER 0/1 en SQLite). */
export const BOOLEAN_COLUMNS = {
  roles: ['activo'],
  categorias: ['activo'],
  ubicaciones: ['activo'],
  proveedores: ['activo'],
  usuarios: ['activo'],
  productos: ['activo'],
  orden_preparacion: ['recibido'],
}
