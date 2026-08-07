-- =========================================
-- MIGRACIÓN: Orden de preparación ya no depende de una orden de compra
-- Proyecto: GoldClubTarea
-- Ejecutar en: Supabase SQL Editor
-- =========================================
--
-- Antes, "Orden de preparación" obligaba a elegir una orden de compra y solo
-- dejaba preparar productos de ESA orden. Ahora el producto se elige
-- directamente del inventario (tabla productos) porque preparar solo tiene
-- sentido si el producto ya fue recibido; num_orden queda como referencia
-- opcional y se agrega el campo "recibido" para dejarlo explícito.

ALTER TABLE public.orden_preparacion
  ADD COLUMN IF NOT EXISTS recibido boolean NOT NULL DEFAULT true;

-- Las órdenes de preparación creadas antes de esta migración ya se referían
-- a productos recibidos (la app anterior solo dejaba elegir de una orden de
-- compra ya cargada), así que quedan marcadas como recibidas.
UPDATE public.orden_preparacion SET recibido = true WHERE recibido IS NULL;

-- num_orden ya era una columna de texto libre sin llave foránea, así que no
-- hace falta ningún ALTER para "desacoplarla": basta con que la app deje de
-- exigirla como obligatoria (ver src/pages/Documentos/OrdenPreparacion.jsx).
