-- =========================================
-- SCRIPT 1: BORRAR TODO (RESET COMPLETO)
-- =========================================
-- EJECUTAR EN: Supabase Dashboard → SQL Editor
-- ADVERTENCIA: Esto borra TODA la base de datos.
-- Los datos existentes se PERDERAN.
-- =========================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS public.detalle_orden_compra CASCADE;
DROP TABLE IF EXISTS public.ordenes_compra CASCADE;
DROP TABLE IF EXISTS public.detalle_facturas CASCADE;
DROP TABLE IF EXISTS public.facturas CASCADE;
DROP TABLE IF EXISTS public.detalle_ventas CASCADE;
DROP TABLE IF EXISTS public.ventas CASCADE;
DROP TABLE IF EXISTS public.orden_preparacion CASCADE;
DROP TABLE IF EXISTS public.reporte_incidentes CASCADE;
DROP TABLE IF EXISTS public.nota_despacho CASCADE;
DROP TABLE IF EXISTS public.informe_baja CASCADE;
DROP TABLE IF EXISTS public.auditoria CASCADE;
DROP TABLE IF EXISTS public.movimientos_inventario CASCADE;
DROP TABLE IF EXISTS public.detalle_salidas CASCADE;
DROP TABLE IF EXISTS public.salidas CASCADE;
DROP TABLE IF EXISTS public.detalle_entradas CASCADE;
DROP TABLE IF EXISTS public.entradas CASCADE;
DROP TABLE IF EXISTS public.lotes CASCADE;
DROP TABLE IF EXISTS public.productos CASCADE;
DROP TABLE IF EXISTS public.usuarios CASCADE;
DROP TABLE IF EXISTS public.proveedores CASCADE;
DROP TABLE IF EXISTS public.ubicaciones CASCADE;
DROP TABLE IF EXISTS public.categorias CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

DROP SEQUENCE IF EXISTS public.detalle_orden_compra_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.ordenes_compra_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.detalle_facturas_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.facturas_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.detalle_ventas_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.ventas_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.detalle_salidas_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.salidas_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.detalle_entradas_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.entradas_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.lotes_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.productos_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.usuarios_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.proveedores_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.ubicaciones_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.categorias_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.roles_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.movimientos_inventario_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.auditoria_id_seq CASCADE;

SET FOREIGN_KEY_CHECKS = 1;

-- Listo. La base de datos esta vacia.
-- Ahora ejecutar: 02_recrear_todo.sql
