-- =========================================
-- SCRIPT: POLITICAS RLS (acceso total via anon key)
-- =========================================
-- Ejecutar en Supabase Dashboard → SQL Editor
-- Activa RLS pero permite acceso total al anon key
-- (la app frontend usa el anon key, no service_role)
-- =========================================

-- Asegurar que RLS este activado
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ubicaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_entradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_salidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.informe_baja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nota_despacho ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reporte_incidentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orden_preparacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_orden_compra ENABLE ROW LEVEL SECURITY;

-- Borrar politicas existentes para evitar conflictos
DROP POLICY IF EXISTS "allow_all_anon_select" ON public.roles;
DROP POLICY IF EXISTS "allow_all_anon_insert" ON public.roles;
DROP POLICY IF EXISTS "allow_all_anon_update" ON public.roles;
DROP POLICY IF EXISTS "allow_all_anon_delete" ON public.roles;
-- (repetir patron para cada tabla abajo)

--Politicas: permitir todo al anon
CREATE POLICY "roles_select" ON public.roles FOR SELECT TO anon USING (true);
CREATE POLICY "roles_insert" ON public.roles FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "roles_update" ON public.roles FOR UPDATE TO anon USING (true);
CREATE POLICY "roles_delete" ON public.roles FOR DELETE TO anon USING (true);

CREATE POLICY "categorias_select" ON public.categorias FOR SELECT TO anon USING (true);
CREATE POLICY "categorias_insert" ON public.categorias FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "categorias_update" ON public.categorias FOR UPDATE TO anon USING (true);
CREATE POLICY "categorias_delete" ON public.categorias FOR DELETE TO anon USING (true);

CREATE POLICY "ubicaciones_select" ON public.ubicaciones FOR SELECT TO anon USING (true);
CREATE POLICY "ubicaciones_insert" ON public.ubicaciones FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "ubicaciones_update" ON public.ubicaciones FOR UPDATE TO anon USING (true);
CREATE POLICY "ubicaciones_delete" ON public.ubicaciones FOR DELETE TO anon USING (true);

CREATE POLICY "proveedores_select" ON public.proveedores FOR SELECT TO anon USING (true);
CREATE POLICY "proveedores_insert" ON public.proveedores FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "proveedores_update" ON public.proveedores FOR UPDATE TO anon USING (true);
CREATE POLICY "proveedores_delete" ON public.proveedores FOR DELETE TO anon USING (true);

CREATE POLICY "usuarios_select" ON public.usuarios FOR SELECT TO anon USING (true);
CREATE POLICY "usuarios_insert" ON public.usuarios FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "usuarios_update" ON public.usuarios FOR UPDATE TO anon USING (true);
CREATE POLICY "usuarios_delete" ON public.usuarios FOR DELETE TO anon USING (true);

CREATE POLICY "productos_select" ON public.productos FOR SELECT TO anon USING (true);
CREATE POLICY "productos_insert" ON public.productos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "productos_update" ON public.productos FOR UPDATE TO anon USING (true);
CREATE POLICY "productos_delete" ON public.productos FOR DELETE TO anon USING (true);

CREATE POLICY "lotes_select" ON public.lotes FOR SELECT TO anon USING (true);
CREATE POLICY "lotes_insert" ON public.lotes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "lotes_update" ON public.lotes FOR UPDATE TO anon USING (true);
CREATE POLICY "lotes_delete" ON public.lotes FOR DELETE TO anon USING (true);

CREATE POLICY "entradas_select" ON public.entradas FOR SELECT TO anon USING (true);
CREATE POLICY "entradas_insert" ON public.entradas FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "entradas_update" ON public.entradas FOR UPDATE TO anon USING (true);
CREATE POLICY "entradas_delete" ON public.entradas FOR DELETE TO anon USING (true);

CREATE POLICY "detalle_entradas_select" ON public.detalle_entradas FOR SELECT TO anon USING (true);
CREATE POLICY "detalle_entradas_insert" ON public.detalle_entradas FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "detalle_entradas_update" ON public.detalle_entradas FOR UPDATE TO anon USING (true);
CREATE POLICY "detalle_entradas_delete" ON public.detalle_entradas FOR DELETE TO anon USING (true);

CREATE POLICY "salidas_select" ON public.salidas FOR SELECT TO anon USING (true);
CREATE POLICY "salidas_insert" ON public.salidas FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "salidas_update" ON public.salidas FOR UPDATE TO anon USING (true);
CREATE POLICY "salidas_delete" ON public.salidas FOR DELETE TO anon USING (true);

CREATE POLICY "detalle_salidas_select" ON public.detalle_salidas FOR SELECT TO anon USING (true);
CREATE POLICY "detalle_salidas_insert" ON public.detalle_salidas FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "detalle_salidas_update" ON public.detalle_salidas FOR UPDATE TO anon USING (true);
CREATE POLICY "detalle_salidas_delete" ON public.detalle_salidas FOR DELETE TO anon USING (true);

CREATE POLICY "movimientos_select" ON public.movimientos_inventario FOR SELECT TO anon USING (true);
CREATE POLICY "movimientos_insert" ON public.movimientos_inventario FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "movimientos_update" ON public.movimientos_inventario FOR UPDATE TO anon USING (true);
CREATE POLICY "movimientos_delete" ON public.movimientos_inventario FOR DELETE TO anon USING (true);

CREATE POLICY "auditoria_select" ON public.auditoria FOR SELECT TO anon USING (true);
CREATE POLICY "auditoria_insert" ON public.auditoria FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "auditoria_update" ON public.auditoria FOR UPDATE TO anon USING (true);
CREATE POLICY "auditoria_delete" ON public.auditoria FOR DELETE TO anon USING (true);

CREATE POLICY "informe_baja_select" ON public.informe_baja FOR SELECT TO anon USING (true);
CREATE POLICY "informe_baja_insert" ON public.informe_baja FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "informe_baja_update" ON public.informe_baja FOR UPDATE TO anon USING (true);
CREATE POLICY "informe_baja_delete" ON public.informe_baja FOR DELETE TO anon USING (true);

CREATE POLICY "nota_despacho_select" ON public.nota_despacho FOR SELECT TO anon USING (true);
CREATE POLICY "nota_despacho_insert" ON public.nota_despacho FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "nota_despacho_update" ON public.nota_despacho FOR UPDATE TO anon USING (true);
CREATE POLICY "nota_despacho_delete" ON public.nota_despacho FOR DELETE TO anon USING (true);

CREATE POLICY "reporte_incidentes_select" ON public.reporte_incidentes FOR SELECT TO anon USING (true);
CREATE POLICY "reporte_incidentes_insert" ON public.reporte_incidentes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "reporte_incidentes_update" ON public.reporte_incidentes FOR UPDATE TO anon USING (true);
CREATE POLICY "reporte_incidentes_delete" ON public.reporte_incidentes FOR DELETE TO anon USING (true);

CREATE POLICY "orden_preparacion_select" ON public.orden_preparacion FOR SELECT TO anon USING (true);
CREATE POLICY "orden_preparacion_insert" ON public.orden_preparacion FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "orden_preparacion_update" ON public.orden_preparacion FOR UPDATE TO anon USING (true);
CREATE POLICY "orden_preparacion_delete" ON public.orden_preparacion FOR DELETE TO anon USING (true);

CREATE POLICY "ventas_select" ON public.ventas FOR SELECT TO anon USING (true);
CREATE POLICY "ventas_insert" ON public.ventas FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "ventas_update" ON public.ventas FOR UPDATE TO anon USING (true);
CREATE POLICY "ventas_delete" ON public.ventas FOR DELETE TO anon USING (true);

CREATE POLICY "detalle_ventas_select" ON public.detalle_ventas FOR SELECT TO anon USING (true);
CREATE POLICY "detalle_ventas_insert" ON public.detalle_ventas FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "detalle_ventas_update" ON public.detalle_ventas FOR UPDATE TO anon USING (true);
CREATE POLICY "detalle_ventas_delete" ON public.detalle_ventas FOR DELETE TO anon USING (true);

CREATE POLICY "facturas_select" ON public.facturas FOR SELECT TO anon USING (true);
CREATE POLICY "facturas_insert" ON public.facturas FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "facturas_update" ON public.facturas FOR UPDATE TO anon USING (true);
CREATE POLICY "facturas_delete" ON public.facturas FOR DELETE TO anon USING (true);

CREATE POLICY "detalle_facturas_select" ON public.detalle_facturas FOR SELECT TO anon USING (true);
CREATE POLICY "detalle_facturas_insert" ON public.detalle_facturas FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "detalle_facturas_update" ON public.detalle_facturas FOR UPDATE TO anon USING (true);
CREATE POLICY "detalle_facturas_delete" ON public.detalle_facturas FOR DELETE TO anon USING (true);

CREATE POLICY "ordenes_compra_select" ON public.ordenes_compra FOR SELECT TO anon USING (true);
CREATE POLICY "ordenes_compra_insert" ON public.ordenes_compra FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "ordenes_compra_update" ON public.ordenes_compra FOR UPDATE TO anon USING (true);
CREATE POLICY "ordenes_compra_delete" ON public.ordenes_compra FOR DELETE TO anon USING (true);

CREATE POLICY "detalle_orden_compra_select" ON public.detalle_orden_compra FOR SELECT TO anon USING (true);
CREATE POLICY "detalle_orden_compra_insert" ON public.detalle_orden_compra FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "detalle_orden_compra_update" ON public.detalle_orden_compra FOR UPDATE TO anon USING (true);
CREATE POLICY "detalle_orden_compra_delete" ON public.detalle_orden_compra FOR DELETE TO anon USING (true);

-- Listo. RLS activado con politicas que permiten todo al anon key.
-- La app frontend puede leer y escribir en todas las tablas.
