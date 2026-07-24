# Guía para el Profesor — Funcionalidades y Base de Datos

## 1. ¿Qué estructura tiene la base de datos?

La base de datos tiene **23 tablas** en PostgreSQL (Supabase), organizadas en 4 grupos:

### Tablas base (las originales del sistema)
| Tabla | Propósito |
|---|---|
| `roles` | Roles de usuario (admin, gerente, empleado) |
| `categorias` | Categorías de productos |
| `ubicaciones` | Ubicaciones físicas en el almacén |
| `proveedores` | Proveedores de productos |
| `usuarios` | Usuarios del sistema |
| `productos` | Productos del inventario |
| `lotes` | Lotes de productos con fecha de vencimiento |
| `entradas` / `detalle_entradas` | Entradas de mercancía |
| `salidas` / `detalle_salidas` | Salidas de mercancía |
| `movimientos_inventario` | Registro de todo movimiento |
| `auditoria` | Auditoría de cambios |

### Tablas de documentos (creadas por mis compañeras)
| Tabla | Propósito |
|---|---|
| `informe_baja` | Productos dados de baja |
| `nota_despacho` | Notas de despacho/entrega |
| `reporte_incidentes` | Incidentes o faltantes |
| `orden_preparacion` | Órdenes de preparación de pedidos |

### Tablas nuevas (migración)
| Tabla | Propósito |
|---|---|
| `ventas` / `detalle_ventas` | Registro de ventas |
| `facturas` / `detalle_facturas` | Facturas emitidas |
| `ordenes_compra` / `detalle_orden_compra` | Órdenes de compra a proveedores |

---

## 2. ¿Cómo se relacionan las tablas?

```
usuarios ──< productos (categoria_id, proveedor_id, ubicacion_id)
productos ──< lotes (producto_id)
productos ──< entradas/detalle_entradas (producto_id)
productos ──< salidas/detalle_salidas (producto_id)
productos ──< movimientos_inventario (producto_id)
usuarios ──< ventas (usuario_id)
ventas ──< detalle_ventas (venta_id)
ventas ──< facturas (venta_id, opcional)
facturas ──< detalle_facturas (factura_id)
productos ──< detalle_ventas (producto_id)
productos ──< detalle_facturas (producto_id)
proveedores ──< ordenes_compra (proveedor_id)
usuarios ──< ordenes_compra (usuario_id)
ordenes_compra ──< detalle_orden_compra (orden_compra_id)
productos ──< detalle_orden_compra (producto_id)
```

---

## 3. Funcionalidades implementadas

### A) InformeBaja (mejorado)
**Pregunta esperada:** "¿Qué hace el informe de baja?"

**Respuesta:**
El informe de baja registra productos que se retiraron del inventario por estar vencidos, rotos, corrompidos o consumidos. Al generar un informe:
1. Se busca el producto por código o nombre (autocompletado)
2. Se selecciona un motivo predefinido: expirado, se rompió, se corrompió, consumido (envase vacío), u otro
3. Se puede agregar una nota con detalles opcionales
4. Se especifica la cantidad retirada
5. El sistema descuenta automáticamente el stock del producto
6. Se guarda en la tabla `informe_baja` con el motivo y las observaciones

**Campos en la BD:**
- `producto_id` → referencia al producto
- `cantidad` → cantidad retirada
- `observaciones` → texto con el motivo y la nota (formato: "Motivo: X. Nota: Y")
- `motivo_baja` → motivo preseleccionado (campo nuevo, agregado por migración)
- `estado` → "activo" o "eliminado" (papelera)
- `tipo_movimiento` → siempre "BAJA"

**¿Cómo se evita perder datos?** El borrado es lógico (estado = 'eliminado'), no físico. Hay una papelera donde se pueden restaurar los informes y reponer el stock.

---

### B) NotaDespacho (reestructurado)
**Pregunta esperada:** "¿Qué es una nota de despacho y cómo funciona?"

**Respuesta:**
Una nota de despacho es un documento que registra la entrega de productos. Hay dos tipos:
1. **Nota de entrega**: Entrega interna a otra área o departamento
2. **Nota de facturación**: Entrega asociada a una venta con factura

Al crear una nota:
1. Se ingresa el número de nota (debe ser único, el sistema valida)
2. Se selecciona el tipo: entrega o facturación
3. Si es facturación, se ingresa el número de factura → el sistema autocompleta el cliente y la dirección desde la tabla `facturas`
4. Se buscan y agregan múltiples productos (con su cantidad)
5. El sistema valida que el código no esté repetido
6. Se descuenta el stock de cada producto
7. Se registra un movimiento de inventario tipo "SALIDA"

**Campos en la BD (tabla `nota_despacho`):**
- `num_nota` → número único de la nota
- `tipo_nota` → "entrega" o "facturacion" (campo nuevo)
- `num_factura` → referencia a la factura (campo nuevo)
- `cliente` → nombre del cliente (campo nuevo, jalado de la factura)
- `cantidad` → cantidad total
- `descripcion` → descripción de la nota
- `receptor` → quien recibe
- `encargado` → quien despacha
- `items` → JSONB con el detalle de productos (campo nuevo)

---

### C) Ventas (módulo nuevo)
**Pregunta esperada:** "¿Qué hace el módulo de ventas?"

**Respuesta:**
El módulo de ventas tiene 4 funciones:

1. **Nueva Venta**: Registra una venta con:
   - Nombre del cliente y dirección
   - Múltiples productos con cantidad y precio
   - Validación de stock disponible
   - Genera una factura con número único
   - Descuenta stock automáticamente
   - Registra movimientos de inventario

2. **Orden de Compra**: Pedir productos a proveedores:
   - Seleccionar proveedor
   - Agregar múltiples productos con cantidad
   - Número de orden único
   - Estado: pendiente, recibida, cancelada

3. **Recepción**: Recibir órdenes de compra:
   - Lista las órdenes pendientes
   - Al recibir, suma el stock de los productos
   - Cambia el estado de la orden a "recibida"

4. **Historial**: Ver todas las ventas:
   - Búsqueda por cliente o número de factura
   - Ver detalle completo de cada venta

---

### D) Bug arreglado — "Crear producto" del Dashboard
**Pregunta esperada:** "¿Qué bug arreglaron?"

**Respuesta:**
En el Dashboard, al hacer clic en "Crear producto" en la sección de acceso rápido o en "Más opciones" del menú, el usuario era redirigido a una ruta que no existía (`/inventario/crear-producto`). La ruta correcta era `/inventario` que ya apunta al componente `CrearProducto`. Se arregló corrigiendo los links en `Menu.jsx` y agregando la ruta faltante en `App.jsx`.

---

## 4. ¿Cómo se previene la pérdida de datos?

| Mecanismo | Dónde se aplica |
|---|---|
| Borrado lógico (estado = 'eliminado') | informe_baja, nota_despacho, reporte_incidentes, orden_preparacion |
| Papelera con opción de restaurar | InformeBaja (reponer stock + restaurar) |
| `CREATE TABLE IF NOT EXISTS` | Migraciones nuevas tablas |
| `DO $$ ... END $$` para ALTER COLUMN | Migraciones (verifica antes de modificar) |
| Foreign Keys | Todas las tablas nuevas referencian a tablas existentes |
| Índices | Se crean con `IF NOT EXISTS` |

---

## 5. ¿Qué archivos se modificaron?

| Archivo | Cambio |
|---|---|
| `src/App.jsx` | Rutas nuevas de Ventas + ruta /inventario/crear-producto |
| `src/pages/Home/Menu.jsx` | Link "Crear producto" corregido + sección Ventas |
| `src/pages/Home/Dashboard.jsx` | Card "Crear producto" en acceso rápido |
| `src/components/Navbar.jsx` | Pestaña "Ventas" nueva |
| `src/pages/Documentos/InformeBaja.jsx` | Buscador + motivos preseleccionados + nota opcional |
| `src/pages/Documentos/NotaDespacho.jsx` | Reescrito: tipo nota, factura, múltiples productos |
| `src/pages/Ventas/Index.jsx` | Nuevo: índice del módulo Ventas |
| `src/pages/Ventas/NuevaVenta.jsx` | Nuevo: formulario de venta |
| `src/pages/Ventas/OrdenCompra.jsx` | Nuevo: orden de compra a proveedores |
| `src/pages/Ventas/Recepcion.jsx` | Nuevo: recepción de órdenes |
| `src/pages/Ventas/Historial.jsx` | Nuevo: historial de ventas |
| `database/schema.sql` | Refleja el estado actual de la BD en Supabase |
| `database/migraciones_nuevas_tablas.sql` | NUEVO: solo crea tablas nuevas, no destruye existentes |

---

## 6. Preguntas que el profesor podría hacer

**P: ¿Por qué hay dos archivos SQL?**
R: `schema.sql` documenta el estado completo de la BD (todas las tablas, tal cual existen en Supabase). `migraciones_nuevas_tablas.sql` es lo que hay que correr para agregar las tablas nuevas sin afectar las existentes.

**P: ¿Qué pasa si corren schema.sql de nuevo?**
R: Nada se rompe. Todas las tablas usan `CREATE TABLE IF NOT EXISTS`, así que si ya existen, se ignoran. No se pierden datos.

**P: ¿Por qué nota_despacho tiene items como JSONB?**
R: Para aceptar múltiples productos por nota. Cada nota puede tener N productos con su cantidad y precio. El JSONB permite flexibilidad sin crear otra tabla de detalle.

**P: ¿Cómo se valida que no se repita una nota?**
R: El frontend consulta Supabase antes de guardar para verificar que `num_nota` no exista. Si ya existe, muestra un error y no guarda.

**P: ¿Qué pasa con el stock cuando se hace una venta?**
R: Se descuenta automáticamente el stock de cada producto vendido. También se registra un movimiento en `movimientos_inventario` con tipo "SALIDA" para trazabilidad.

**P: ¿Qué pasa si se recibe una orden de compra?**
R: Se suma el stock de los productos recibidos y se cambia el estado de la orden a "recibida". También se pueden registrar entradas en la tabla `entradas`.

**P: ¿Qué bibliotecas usa el frontend?**
R: React 18.3 + Vite 5.4 + React Router 6.26 + Supabase JS 2.45 + Bootstrap 5.3.

**P: ¿Cómo funciona el buscador de productos en InformeBaja?**
R: Usa el operador `ilike` de PostgreSQL (búsqueda case-insensitive) con `OR` entre `codigo_sku` y `nombre`. Necesita mínimo 2 caracteres y devuelve hasta 10 resultados.

**P: ¿Por qué el borrado es lógico y no físico?**
R: Para mantener la integridad referencial y el historial. Si se borra físicamente, se pierde la trazabilidad de qué productos se dieron de baja y cuándo. El borrado lógico permite restaurar.

**P: ¿Qué es el campo "motivo_baja" en informe_baja?**
R: Es un campo nuevo que guarda el motivo preseleccionado (expirado, roto, corrompido, consumido, otro). Antes solo existía "observaciones" como texto libre. Ahora el motivo es estructurado para poder filtrar por tipo de baja.
