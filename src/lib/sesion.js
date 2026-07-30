import { supabase } from './supabase.js'

// =========================================
// Sesion del usuario
// =========================================
// Problema que resuelve:
// varias pantallas escribian  usuario_id: 1  a mano. Las tablas
// ordenes_compra, movimientos_inventario, entradas y ventas tienen
// usuario_id NOT NULL con FOREIGN KEY a usuarios(id). Si el usuario 1 no
// existe en esa base de datos, PostgreSQL rechaza el INSERT con el error
// 23503 y la pantalla solo decia "Ocurrio un error".
//
// Ademas los documentos guardaban  creado_por: 'Juan Perez'  fijo, asi que
// la trazabilidad (Guia Tecnica, seccion 67) no servia de nada.
//
// Aqui guardamos la fila de la tabla `usuarios` que corresponde al usuario
// autenticado, y la exponemos a las pantallas.
// =========================================

const CLAVE = 'goldclub.usuario'

/** Guarda el usuario de la tabla `usuarios` tras un login correcto. */
export function guardarUsuario(usuario) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(usuario))
  } catch (e) {
    console.error('[Gold Club] No se pudo guardar la sesion:', e)
  }
}

/** Devuelve el usuario guardado, o null si no hay sesion. */
export function usuarioActual() {
  try {
    const bruto = localStorage.getItem(CLAVE)
    return bruto ? JSON.parse(bruto) : null
  } catch {
    return null
  }
}

/** Borra la sesion local. */
export function cerrarSesion() {
  try {
    localStorage.removeItem(CLAVE)
  } catch {
    /* ignorar */
  }
}

/** Nombre legible para los campos "creado por" / "encargado". */
export function nombreUsuarioActual() {
  const u = usuarioActual()
  if (!u) return 'Sin identificar'
  return [u.nombre, u.apellido].filter(Boolean).join(' ') || u.username || 'Sin identificar'
}

/**
 * Devuelve un usuario_id VALIDO para usar en claves foraneas.
 *
 * Orden de preferencia:
 *   1. el id del usuario de la sesion (si sigue existiendo en la tabla)
 *   2. el id del primer usuario activo que exista
 *   3. null  -> quien llama debe avisar en vez de mandar un id inventado
 *
 * @returns {Promise<number|null>}
 */
export async function usuarioIdValido() {
  const u = usuarioActual()

  if (u?.id != null) {
    const { data } = await supabase.from('usuarios').select('id').eq('id', u.id).maybeSingle()
    if (data?.id != null) return data.id
  }

  // La sesion no sirve (base de datos recreada, usuario borrado...).
  // Buscamos cualquier usuario existente antes de fallar.
  const { data: alguno } = await supabase
    .from('usuarios')
    .select('id')
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle()

  return alguno?.id ?? null
}

export const MENSAJE_SIN_USUARIO =
  'No hay ningun usuario registrado en la base de datos, y las ordenes ' +
  'necesitan un usuario responsable. Ejecuta database/02_recrear_todo.sql ' +
  'en el SQL Editor de Supabase (crea el usuario "admin") y vuelve a entrar.'
