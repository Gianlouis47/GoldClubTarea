// =========================================
// Adaptador local: carga y persistencia en disco
// =========================================
// sql.js mantiene la base de datos EN MEMORIA (es SQLite compilado a WASM,
// no puede escribir un archivo directamente). Este modulo:
//   1. Carga el archivo .sqlite del disco al iniciar (o crea uno nuevo con
//      el esquema + datos semilla si todavia no existe).
//   2. Expone `persist()` para volcar la memoria de vuelta al archivo
//      despues de cada escritura (insert/update/delete).
//
// Solo se usa desde Node: el proceso principal de Electron (electron/main.js)
// y el script de validacion sin Electron. NUNCA se importa desde el
// renderer (que no tiene acceso a `fs` por seguridad -- contextIsolation).
// =========================================

import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import initSqlJs from 'sql.js'
import { SCHEMA_SQL, SEED_SQL } from './schema.js'

const require = createRequire(import.meta.url)

let SQLPromise = null
function getSQL() {
  if (!SQLPromise) {
    const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm')
    SQLPromise = initSqlJs({ locateFile: () => wasmPath })
  }
  return SQLPromise
}

/**
 * Abre (o crea) la base de datos SQLite ubicada en `dbFilePath`.
 *
 * @param {string} dbFilePath ruta absoluta al archivo .sqlite
 * @returns {Promise<{db: import('sql.js').Database, persist: () => void, filePath: string}>}
 */
export async function openLocalDatabase(dbFilePath) {
  const SQL = await getSQL()

  let db
  const existe = fs.existsSync(dbFilePath)
  if (existe) {
    const buffer = fs.readFileSync(dbFilePath)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
    db.run(SCHEMA_SQL)
    db.run(SEED_SQL)
    fs.mkdirSync(path.dirname(dbFilePath), { recursive: true })
    fs.writeFileSync(dbFilePath, Buffer.from(db.export()))
  }

  function persist() {
    fs.mkdirSync(path.dirname(dbFilePath), { recursive: true })
    fs.writeFileSync(dbFilePath, Buffer.from(db.export()))
  }

  return { db, persist, filePath: dbFilePath }
}
