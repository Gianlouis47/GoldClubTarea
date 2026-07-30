import { supabase } from './supabase.js'

// =========================================
// Origen unico de los numeros de orden
// =========================================
// La orden de preparacion, la nota de despacho y el reporte de incidentes
// LLEVAN el numero de la orden de compra. Antes cada pantalla lo pedia como
// texto libre ("Ej: 24", "Ej: 0893799", "Ej: ORD-2025-0123"), asi que los tres
// documentos podian apuntar a ordenes distintas o inexistentes y no se podia
// cruzar la informacion.
//
// Aqui se lee la orden REAL desde ordenes_compra / detalle_orden_compra, para
// que los documentos se generen a partir de datos que existen.
// =========================================

/**
 * Lista las ordenes de compra para poder elegirlas en un desplegable.
 * @param {{soloPendientes?: boolean}} opciones
 */
export async function cargarOrdenesCompra({ soloPendientes = false } = {}) {
  let consulta = supabase
    .from('ordenes_compra')
    .select('id, numero_orden, estado, creado_en, proveedores(nombre_empresa)')
    .order('id', { ascending: false })

  if (soloPendientes) consulta = consulta.eq('estado', 'pendiente')

  const { data, error } = await consulta
  if (error) return { ordenes: [], error }
  return { ordenes: data || [], error: null }
}

/**
 * Productos incluidos en una orden de compra concreta.
 * Se usa para que el "codigo de producto" de los documentos solo pueda ser
 * uno de los productos que realmente van en esa orden.
 *
 * @param {number} ordenCompraId
 */
export async function productosDeOrden(ordenCompraId) {
  const { data, error } = await supabase
    .from('detalle_orden_compra')
    .select('cantidad, precio_unitario, subtotal, productos(id, nombre, codigo_sku, stock)')
    .eq('orden_compra_id', ordenCompraId)

  if (error) return { productos: [], error }

  const productos = (data || [])
    .filter((d) => d.productos)
    .map((d) => ({
      producto_id: d.productos.id,
      codigo_sku: d.productos.codigo_sku,
      nombre: d.productos.nombre,
      stock: d.productos.stock,
      cantidad_pedida: d.cantidad,
    }))

  return { productos, error: null }
}

/**
 * Genera el siguiente numero consecutivo de un documento.
 * Ej: siguienteNumero('ordenes_compra', 'numero_orden', 'OC') -> "OC-00007"
 *
 * No es a prueba de concurrencia (para eso haria falta una secuencia en la
 * base de datos), pero evita el problema real que tenia la app: numeros
 * escritos a mano, repetidos o vacios. Quien lo llama debe seguir tratando
 * el error 23505 (duplicado) por si dos personas guardan a la vez.
 *
 * @param {string} tabla
 * @param {string} columna
 * @param {string} prefijo
 * @param {number} anchura  digitos del consecutivo
 */
export async function siguienteNumero(tabla, columna, prefijo, anchura = 5) {
  const { data, error } = await supabase
    .from(tabla)
    .select(columna)
    .like(columna, `${prefijo}-%`)
    .order(columna, { ascending: false })
    .limit(1)

  let ultimo = 0
  if (!error && data && data.length > 0) {
    const valor = String(data[0][columna] || '')
    const soloDigitos = valor.slice(prefijo.length + 1).replace(/\D/g, '')
    ultimo = parseInt(soloDigitos, 10) || 0
  }

  return `${prefijo}-${String(ultimo + 1).padStart(anchura, '0')}`
}
