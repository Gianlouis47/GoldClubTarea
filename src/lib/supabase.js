import { createClient } from '@supabase/supabase-js'

// Las credenciales NUNCA van en el repositorio (ver Guia Tecnica, seccion 5:
// "Variables de entorno - ninguna credencial en el repositorio").
// Copia .env.example a .env y rellena los dos valores desde:
// Supabase Dashboard -> Project Settings -> API
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Valores placeholder que traia el repo antes. Si siguen puestos, la app
// apuntaba a un proyecto inexistente y TODA peticion fallaba con un error
// generico. Los detectamos para poder avisar de forma clara.
const PLACEHOLDERS = ['https://TU_PROJECT.supabase.co', 'TU_ANON_KEY', '']

/**
 * true cuando hay credenciales reales configuradas.
 * Las pantallas lo usan para mostrar un aviso concreto en lugar de
 * "Ocurrio un error" (Guia Tecnica: "Errores visibles").
 */
export const supabaseConfigurado =
  !!SUPABASE_URL &&
  !!SUPABASE_ANON_KEY &&
  !PLACEHOLDERS.includes(SUPABASE_URL) &&
  !PLACEHOLDERS.includes(SUPABASE_ANON_KEY)

export const MENSAJE_SIN_CONFIGURAR =
  'La conexion con la base de datos no esta configurada. ' +
  'Copia el archivo .env.example a .env, pon VITE_SUPABASE_URL y ' +
  'VITE_SUPABASE_ANON_KEY de tu proyecto de Supabase y reinicia con "npm run dev".'

if (!supabaseConfigurado) {
  // Un fallo silencioso es peor que una caida: que se vea en consola.
  console.error('[Gold Club] ' + MENSAJE_SIN_CONFIGURAR)
}

// Se crea el cliente igual (aunque falten credenciales) para que los imports
// no revienten; las peticiones fallaran y el helper de errores lo explicara.
export const supabase = createClient(
  SUPABASE_URL || 'http://localhost:54321',
  SUPABASE_ANON_KEY || 'sin-configurar'
)
