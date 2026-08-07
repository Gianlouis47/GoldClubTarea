// =========================================
// Adaptador local: lado renderer (dentro de Electron)
// =========================================
// El renderer corre con contextIsolation activado (sin acceso directo a
// Node/fs por seguridad). Este modulo arma el cliente "estilo supabase-js"
// pero, en vez de ejecutar las consultas aqui mismo, se las manda al
// proceso principal por IPC (expuesto en window.electronAPI por
// electron/preload.js), que es quien de verdad toca sql.js y el disco.
// =========================================

import { createLocalClient } from './queryBuilder.js'

async function ejecutarPlan(plan) {
  return window.electronAPI.dbQuery(plan)
}

async function signInWithPassword(credenciales) {
  return window.electronAPI.dbAuth(credenciales)
}

/** Cliente local listo para usarse igual que el `supabase` de supabase-js. */
export const localSupabaseClient = createLocalClient(ejecutarPlan, signInWithPassword)
