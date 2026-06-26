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