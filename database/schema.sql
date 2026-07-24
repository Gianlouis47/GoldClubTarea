-- =========================================
-- GOLDCREW INVENTARIO DATABASE
-- PostgreSQL
-- =========================================

-- =========================================
-- ROLES
-- =========================================

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- CATEGORIAS
-- =========================================

CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- UBICACIONES
-- =========================================

CREATE TABLE ubicaciones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- PROVEEDORES
-- =========================================

CREATE TABLE proveedores (
    id SERIAL PRIMARY KEY,

    nombre_empresa VARCHAR(150) NOT NULL,
    contacto_nombre VARCHAR(100),

    telefono VARCHAR(20),
    correo VARCHAR(150),

    direccion TEXT,

    rnc VARCHAR(20),

    activo BOOLEAN NOT NULL DEFAULT true,

    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- USUARIOS
-- =========================================

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,

    rol_id INTEGER NOT NULL,

    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,

    correo VARCHAR(150) NOT NULL UNIQUE,

    username VARCHAR(50) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    activo BOOLEAN NOT NULL DEFAULT true,

    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_usuarios_roles
        FOREIGN KEY (rol_id)
        REFERENCES roles(id)
);

-- =========================================
-- PRODUCTOS
-- =========================================

CREATE TABLE productos (
    id SERIAL PRIMARY KEY,

    categoria_id INTEGER NOT NULL,
    proveedor_id INTEGER,
    ubicacion_id INTEGER,

    nombre VARCHAR(150) NOT NULL,

    descripcion TEXT,

    codigo_sku VARCHAR(50) NOT NULL UNIQUE,

    marca VARCHAR(100),
    modelo VARCHAR(100),

    precio_compra NUMERIC(10,2) NOT NULL,
    precio_venta NUMERIC(10,2) NOT NULL,

    stock INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER NOT NULL DEFAULT 0,

    unidad_medida VARCHAR(20) NOT NULL,

    activo BOOLEAN NOT NULL DEFAULT true,

    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_productos_categorias
        FOREIGN KEY (categoria_id)
        REFERENCES categorias(id),

    CONSTRAINT fk_productos_proveedores
        FOREIGN KEY (proveedor_id)
        REFERENCES proveedores(id),

    CONSTRAINT fk_productos_ubicaciones
        FOREIGN KEY (ubicacion_id)
        REFERENCES ubicaciones(id)
);

-- =========================================
-- LOTES
-- =========================================

CREATE TABLE lotes (
    id SERIAL PRIMARY KEY,

    producto_id INTEGER NOT NULL,

    codigo_lote VARCHAR(100) NOT NULL,

    fecha_entrada DATE NOT NULL,

    fecha_vencimiento DATE,

    cantidad INTEGER NOT NULL,

    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_lotes_productos
        FOREIGN KEY (producto_id)
        REFERENCES productos(id)
);

-- =========================================
-- ENTRADAS
-- =========================================

CREATE TABLE entradas (
    id SERIAL PRIMARY KEY,

    usuario_id INTEGER NOT NULL,
    proveedor_id INTEGER,

    fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    numero_factura VARCHAR(100),

    observaciones TEXT,

    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_entradas_usuarios
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id),

    CONSTRAINT fk_entradas_proveedores
        FOREIGN KEY (proveedor_id)
        REFERENCES proveedores(id)
);

-- =========================================
-- DETALLE ENTRADAS
-- =========================================

CREATE TABLE detalle_entradas (
    id SERIAL PRIMARY KEY,

    entrada_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,

    cantidad INTEGER NOT NULL,

    precio_unitario NUMERIC(10,2) NOT NULL,

    subtotal NUMERIC(10,2) NOT NULL,

    CONSTRAINT fk_detalle_entradas_entrada
        FOREIGN KEY (entrada_id)
        REFERENCES entradas(id),

    CONSTRAINT fk_detalle_entradas_producto
        FOREIGN KEY (producto_id)
        REFERENCES productos(id)
);

-- =========================================
-- SALIDAS
-- =========================================

CREATE TABLE salidas (
    id SERIAL PRIMARY KEY,

    usuario_id INTEGER NOT NULL,

    fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    tipo_salida VARCHAR(50) NOT NULL,

    destinatario VARCHAR(150),

    observaciones TEXT,

    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_salidas_usuarios
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
);

-- =========================================
-- DETALLE SALIDAS
-- =========================================

CREATE TABLE detalle_salidas (
    id SERIAL PRIMARY KEY,

    salida_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,

    cantidad INTEGER NOT NULL,

    CONSTRAINT fk_detalle_salidas_salida
        FOREIGN KEY (salida_id)
        REFERENCES salidas(id),

    CONSTRAINT fk_detalle_salidas_producto
        FOREIGN KEY (producto_id)
        REFERENCES productos(id)
);

-- =========================================
-- MOVIMIENTOS INVENTARIO
-- =========================================

CREATE TABLE movimientos_inventario (
    id SERIAL PRIMARY KEY,

    producto_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,

    tipo_movimiento VARCHAR(20) NOT NULL,

    cantidad INTEGER NOT NULL,

    referencia VARCHAR(100),

    observaciones TEXT,

    fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_movimientos_productos
        FOREIGN KEY (producto_id)
        REFERENCES productos(id),

    CONSTRAINT fk_movimientos_usuarios
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
);

-- =========================================
-- AUDITORIA
-- =========================================

CREATE TABLE auditoria (
    id SERIAL PRIMARY KEY,

    usuario_id INTEGER,

    tabla_afectada VARCHAR(100) NOT NULL,

    accion VARCHAR(50) NOT NULL,

    registro_id INTEGER,

    descripcion TEXT,

    fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_auditoria_usuarios
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
);

-- =========================================
-- INDEXES
-- =========================================

CREATE INDEX idx_productos_nombre
ON productos(nombre);

CREATE INDEX idx_productos_codigo
ON productos(codigo_sku);

CREATE INDEX idx_movimientos_fecha
ON movimientos_inventario(fecha);

CREATE INDEX idx_lotes_vencimiento
ON lotes(fecha_vencimiento);

-- =========================================
-- VENTAS
-- =========================================

CREATE TABLE ventas (
    id SERIAL PRIMARY KEY,

    usuario_id INTEGER NOT NULL,

    fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    cliente_nombre VARCHAR(150) NOT NULL,
    cliente_direccion TEXT,

    total NUMERIC(12,2) NOT NULL DEFAULT 0,

    metodo_pago VARCHAR(50) DEFAULT 'efectivo',

    estado VARCHAR(20) NOT NULL DEFAULT 'activa',

    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ventas_usuarios
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
);

-- =========================================
-- DETALLE VENTAS
-- =========================================

CREATE TABLE detalle_ventas (
    id SERIAL PRIMARY KEY,

    venta_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,

    cantidad INTEGER NOT NULL,

    precio_unitario NUMERIC(10,2) NOT NULL,

    subtotal NUMERIC(10,2) NOT NULL,

    CONSTRAINT fk_detalle_ventas_venta
        FOREIGN KEY (venta_id)
        REFERENCES ventas(id),

    CONSTRAINT fk_detalle_ventas_producto
        FOREIGN KEY (producto_id)
        REFERENCES productos(id)
);

-- =========================================
-- FACTURAS
-- =========================================

CREATE TABLE facturas (
    id SERIAL PRIMARY KEY,

    venta_id INTEGER,

    numero_factura VARCHAR(100) NOT NULL UNIQUE,

    cliente_nombre VARCHAR(150) NOT NULL,
    cliente_direccion TEXT,

    fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    total NUMERIC(12,2) NOT NULL DEFAULT 0,

    estado VARCHAR(20) NOT NULL DEFAULT 'activa',

    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_facturas_ventas
        FOREIGN KEY (venta_id)
        REFERENCES ventas(id)
);

-- =========================================
-- DETALLE FACTURAS
-- =========================================

CREATE TABLE detalle_facturas (
    id SERIAL PRIMARY KEY,

    factura_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,

    cantidad INTEGER NOT NULL,

    precio_unitario NUMERIC(10,2) NOT NULL,

    subtotal NUMERIC(10,2) NOT NULL,

    CONSTRAINT fk_detalle_facturas_factura
        FOREIGN KEY (factura_id)
        REFERENCES facturas(id),

    CONSTRAINT fk_detalle_facturas_producto
        FOREIGN KEY (producto_id)
        REFERENCES productos(id)
);

-- =========================================
-- ORDENES DE COMPRA
-- =========================================

CREATE TABLE ordenes_compra (
    id SERIAL PRIMARY KEY,

    proveedor_id INTEGER,
    usuario_id INTEGER NOT NULL,

    numero_orden VARCHAR(100) NOT NULL UNIQUE,

    fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',

    observaciones TEXT,

    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ordenes_compra_proveedores
        FOREIGN KEY (proveedor_id)
        REFERENCES proveedores(id),

    CONSTRAINT fk_ordenes_compra_usuarios
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
);

-- =========================================
-- DETALLE ORDEN DE COMPRA
-- =========================================

CREATE TABLE detalle_orden_compra (
    id SERIAL PRIMARY KEY,

    orden_compra_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,

    cantidad INTEGER NOT NULL,

    precio_unitario NUMERIC(10,2) NOT NULL,

    subtotal NUMERIC(10,2) NOT NULL,

    CONSTRAINT fk_detalle_orden_compra_orden
        FOREIGN KEY (orden_compra_id)
        REFERENCES ordenes_compra(id),

    CONSTRAINT fk_detalle_orden_compra_producto
        FOREIGN KEY (producto_id)
        REFERENCES productos(id)
);

-- =========================================
-- INDEXES NUEVOS
-- =========================================

CREATE INDEX idx_ventas_usuario
ON ventas(usuario_id);

CREATE INDEX idx_ventas_fecha
ON ventas(fecha);

CREATE INDEX idx_ventas_estado
ON ventas(estado);

CREATE INDEX idx_detalle_ventas_venta
ON detalle_ventas(venta_id);

CREATE INDEX idx_detalle_ventas_producto
ON detalle_ventas(producto_id);

CREATE INDEX idx_facturas_venta
ON facturas(venta_id);

CREATE INDEX idx_facturas_numero
ON facturas(numero_factura);

CREATE INDEX idx_facturas_fecha
ON facturas(fecha);

CREATE INDEX idx_facturas_estado
ON facturas(estado);

CREATE INDEX idx_detalle_facturas_factura
ON detalle_facturas(factura_id);

CREATE INDEX idx_detalle_facturas_producto
ON detalle_facturas(producto_id);

CREATE INDEX idx_ordenes_compra_proveedor
ON ordenes_compra(proveedor_id);

CREATE INDEX idx_ordenes_compra_usuario
ON ordenes_compra(usuario_id);

CREATE INDEX idx_ordenes_compra_numero
ON ordenes_compra(numero_orden);

CREATE INDEX idx_ordenes_compra_estado
ON ordenes_compra(estado);

CREATE INDEX idx_detalle_orden_compra_orden
ON detalle_orden_compra(orden_compra_id);

CREATE INDEX idx_detalle_orden_compra_producto
ON detalle_orden_compra(producto_id);

-- =========================================
-- NOTAS DE DESPACHO
-- =========================================

CREATE TABLE nota_despacho (
    id SERIAL PRIMARY KEY,
    num_nota VARCHAR(100) NOT NULL UNIQUE,
    fecha_emision DATE NOT NULL,
    tipo_nota VARCHAR(20) NOT NULL DEFAULT 'entrega', -- 'entrega' | 'facturacion'
    num_factura VARCHAR(100), -- referencia a facturas.numero_factura
    cliente VARCHAR(150),
    direccion TEXT,
    items JSONB NOT NULL DEFAULT '[]', -- array de {producto_id, nombre, codigo_sku, cantidad, precio_unitario}
    observaciones TEXT,
    encargado VARCHAR(100),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_nota_despacho_num_nota ON nota_despacho(num_nota);
CREATE INDEX idx_nota_despacho_num_factura ON nota_despacho(num_factura);
CREATE INDEX idx_nota_despacho_fecha ON nota_despacho(fecha_emision);
CREATE INDEX idx_nota_despacho_estado ON nota_despacho(estado);

-- =========================================
-- REPORTE INCIDENTES
-- =========================================

CREATE TABLE reporte_incidentes (
    id SERIAL PRIMARY KEY,
    num_orden VARCHAR(100) NOT NULL,
    fecha_incidente DATE NOT NULL,
    codigo_producto VARCHAR(100) NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 0,
    descripcion TEXT,
    creado_por VARCHAR(100),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reporte_incidentes_num_orden ON reporte_incidentes(num_orden);
CREATE INDEX idx_reporte_incidentes_fecha ON reporte_incidentes(fecha_incidente);
CREATE INDEX idx_reporte_incidentes_estado ON reporte_incidentes(estado);

-- =========================================
-- ORDEN PREPARACION
-- =========================================

CREATE TABLE orden_preparacion (
    id SERIAL PRIMARY KEY,
    num_orden VARCHAR(100) NOT NULL UNIQUE,
    codigo VARCHAR(100) NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 0,
    destino TEXT,
    creado_por VARCHAR(100),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orden_preparacion_num_orden ON orden_preparacion(num_orden);
CREATE INDEX idx_orden_preparacion_estado ON orden_preparacion(estado);

-- =========================================
-- INFORME BAJA
-- =========================================

CREATE TABLE informe_baja (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    cantidad INTEGER NOT NULL,
    observaciones TEXT,
    motivo_baja VARCHAR(50) NOT NULL, -- 'expirado', 'roto', 'corrompido', 'consumido', 'otro'
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_informe_baja_producto FOREIGN KEY (producto_id) REFERENCES productos(id),
    CONSTRAINT fk_informe_baja_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX idx_informe_baja_producto ON informe_baja(producto_id);
CREATE INDEX idx_informe_baja_fecha ON informe_baja(creado_en);
CREATE INDEX idx_informe_baja_estado ON informe_baja(estado);
CREATE INDEX idx_informe_baja_motivo ON informe_baja(motivo_baja);