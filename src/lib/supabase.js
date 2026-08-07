import { createClient } from '@supabase/supabase-js'
// El import de ipcClient.js es estatico (no dynamic import) a proposito:
// solo usa `window.electronAPI` en tiempo de EJECUCION (dentro de las
// funciones), nunca al cargar el modulo, asi que es seguro incluirlo en el
// bundle web tambien -- en el navegador simplemente nunca se usa.
import { localSupabaseClient } from './local/ipcClient.js'

// =========================================
// Version de escritorio (Electron) vs version web
// =========================================
// Empaquetada con Electron, la app corre SIN INTERNET y con los datos
// guardados en un archivo SQLite local (ver src/lib/local/). electron/preload.js
// expone `window.electronAPI.isElectron = true` solo dentro de esa ventana,
// asi que sirve para elegir en tiempo de ejecucion que implementacion usar
// sin tocar ninguna pantalla: todas siguen importando { supabase,
// supabaseConfigurado, MENSAJE_SIN_CONFIGURAR } de este mismo archivo.
//
// La version web (navegador normal, `npm run dev` / `npm run build` sin
// Electron) sigue hablando con Supabase exactamente igual que antes.
// =========================================
const esElectron = typeof window !== 'undefined' && !!window.electronAPI?.isElectron

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
 * true cuando hay una base de datos utilizable: en Electron siempre (el
 * archivo SQLite local se crea solo la primera vez), en la version web solo
 * si hay credenciales reales de Supabase configuradas.
 * Las pantallas lo usan para mostrar un aviso concreto en lugar de
 * "Ocurrio un error" (Guia Tecnica: "Errores visibles").
 */
export const supabaseConfigurado =
  esElectron ||
  (!!SUPABASE_URL &&
    !!SUPABASE_ANON_KEY &&
    !PLACEHOLDERS.includes(SUPABASE_URL) &&
    !PLACEHOLDERS.includes(SUPABASE_ANON_KEY))

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
const supabaseWeb = createClient(
  SUPABASE_URL || 'http://localhost:54321',
  SUPABASE_ANON_KEY || 'sin-configurar'
)

export const supabase = esElectron ? localSupabaseClient : supabaseWeb
