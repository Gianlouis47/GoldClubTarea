import { supabaseConfigurado, MENSAJE_SIN_CONFIGURAR } from './supabase.js'

// =========================================
// Errores visibles
// =========================================
// Guia Tecnica, seccion 5 (principios no negociables):
//   "Errores visibles - un fallo silencioso en produccion es peor que una
//    caida. Todo error se registra con contexto suficiente para reproducirlo".
//
// Antes, todas las pantallas hacian:
//     if (error) alert("Ocurrio un error. Intente nuevamente.")
// y se perdia la causa real. Este helper traduce el error de Supabase /
// PostgreSQL a un mensaje que el usuario puede accionar, y deja el error
// completo en la consola para poder depurarlo.
// =========================================

/** Codigos de error de PostgreSQL que nos interesan explicar. */
const CODIGOS_PG = {
  '23502': 'Falta un dato obligatorio para guardar el registro.',
  '23503':
    'El registro hace referencia a algo que no existe en la base de datos ' +
    '(por ejemplo un usuario, proveedor o producto que fue borrado).',
  '23505': 'Ya existe un registro con ese valor unico. Usa otro numero o codigo.',
  '23514': 'Uno de los valores no cumple las reglas de la base de datos.',
  '22P02': 'Uno de los valores tiene un formato invalido (por ejemplo texto donde se espera un numero).',
  '42501':
    'La base de datos rechazo la operacion por permisos (RLS). ' +
    'Ejecuta database/03_politicas_rls.sql en el SQL Editor de Supabase.',
  '42P01':
    'La tabla no existe en la base de datos. ' +
    'Ejecuta database/02_recrear_todo.sql en el SQL Editor de Supabase.',
  'PGRST116': 'No se encontro el registro buscado.',
  'PGRST205':
    'La tabla no existe o no esta expuesta en la API. ' +
    'Ejecuta database/02_recrear_todo.sql en el SQL Editor de Supabase.',
  '42703': 'Falta una columna en la tabla. Revisa los scripts de database/.',
}

/**
 * Convierte un error de Supabase en un mensaje claro en espanol.
 *
 * @param {object|null} error  el objeto error que devuelve supabase-js
 * @param {string} accion      que se estaba intentando, para el contexto.
 *                             Ej: "generar la orden de compra"
 * @returns {string} mensaje listo para mostrar al usuario
 */
export function mensajeError(error, accion = 'completar la operacion') {
  // Registro con contexto (obligatorio segun la guia).
  console.error(`[Gold Club] Fallo al ${accion}:`, error)

  // Causa numero 1 en este proyecto: no hay .env configurado.
  if (!supabaseConfigurado) return MENSAJE_SIN_CONFIGURAR

  if (!error) return `No se pudo ${accion}.`

  // Sin red o URL de Supabase incorrecta.
  const texto = `${error.message || ''} ${error.details || ''}`.toLowerCase()
  if (
    texto.includes('failed to fetch') ||
    texto.includes('networkerror') ||
    texto.includes('load failed')
  ) {
    return (
      `No se pudo ${accion}: no hay conexion con la base de datos. ` +
      'Revisa tu internet y que VITE_SUPABASE_URL sea correcta.'
    )
  }

  const explicacion = CODIGOS_PG[error.code]
  if (explicacion) return `No se pudo ${accion}. ${explicacion}`

  // Ultimo recurso: mostramos el mensaje real en vez de esconderlo.
  const detalle = error.message || error.details || error.hint || 'error desconocido'
  return `No se pudo ${accion}. Detalle tecnico: ${detalle}`
}
