// =========================================
// Electron - preload
// =========================================
// Corre en un contexto aislado con acceso a Node, pero el renderer (React)
// NO tiene contextIsolation desactivado ni nodeIntegration: solo puede
// hablar con el proceso principal a traves de lo que exponemos aca con
// contextBridge. `window.electronAPI.isElectron` es la bandera que usa
// src/lib/supabase.js para elegir el adaptador local en vez de supabase-js.
// =========================================

import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  /** Ejecuta un plan de consulta (ver src/lib/local/queryBuilder.js) contra la BD local. */
  dbQuery: (plan) => ipcRenderer.invoke('db:query', plan),
  /** Login local: verifica el hash bcrypt de usuarios.password_hash. */
  dbAuth: (credenciales) => ipcRenderer.invoke('db:auth', credenciales),
})
