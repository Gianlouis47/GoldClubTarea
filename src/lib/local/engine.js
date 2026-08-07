// =========================================
// Adaptador local: motor de ejecucion (sql.js)
// =========================================
// Interpreta los "planes" que arma LocalQueryBuilder (ver queryBuilder.js) y
// los ejecuta contra una base de datos sql.js (SQLite compilado a WASM/asm.js
// puro JS: sin binarios nativos, para no complicar electron-builder al
// generar instaladores de Windows/Mac desde Linux).
//
// Este modulo SOLO se importa desde Node (proceso principal de Electron, o
// un script de prueba sin Electron). El renderer nunca lo toca directamente
// -- habla con el mediante IPC (ver electron/main.js + src/lib/local/ipcClient.js).
// =========================================

import bcrypt from 'bcryptjs'
import { RELATION_FK, BOOLEAN_COLUMNS } from './schema.js'

// -----------------------------------------
// Helpers de bajo nivel sobre sql.js
// -----------------------------------------

function run(db, sql, params = []) {
  const stmt = db.prepare(sql)
  try {
    stmt.bind(params)
    stmt.step()
  } finally {
    stmt.free()
  }
}

function queryAll(db, sql, params = []) {
  const stmt = db.prepare(sql)
  const filas = []
  try {
    stmt.bind(params)
    while (stmt.step()) filas.push(stmt.getAsObject())
  } finally {
    stmt.free()
  }
  return filas
}

function lastInsertId(db) {
  const filas = queryAll(db, 'SELECT last_insert_rowid() AS id')
  return filas[0]?.id
}

/** true/false -> 1/0 para guardarlos en columnas SQLite (sin tipo boolean nativo). */
function coerceParam(v) {
  if (v === true) return 1
  if (v === false) return 0
  if (v === undefined) return null
  return v
}

/** Convierte 0/1 -> boolean en las columnas marcadas como booleanas en BOOLEAN_COLUMNS. */
function coerceRow(table, row) {
  const boolCols = BOOLEAN_COLUMNS[table]
  if (!boolCols || !row) return row
  const out = { ...row }
  for (const c of boolCols) {
    if (c in out && out[c] !== null && out[c] !== undefined) out[c] = !!out[c]
  }
  return out
}

function mapSqliteError(e) {
  const msg = e?.message || String(e)
  if (/UNIQUE constraint failed/i.test(msg)) {
    return { message: msg, details: msg, hint: null, code: '23505' }
  }
  if (/NOT NULL constraint failed/i.test(msg)) {
    return { message: msg, details: msg, hint: null, code: '23502' }
  }
  if (/FOREIGN KEY constraint failed/i.test(msg)) {
    return { message: msg, details: msg, hint: null, code: '23503' }
  }
  if (/CHECK constraint failed/i.test(msg)) {
    return { message: msg, details: msg, hint: null, code: '23514' }
  }
  if (/no such table/i.test(msg)) {
    return { message: msg, details: msg, hint: null, code: '42P01' }
  }
  if (/no such column/i.test(msg)) {
    return { message: msg, details: msg, hint: null, code: '42703' }
  }
  return { message: msg, details: msg, hint: null, code: null }
}

// -----------------------------------------
// Parser de `.select('col1, col2, relacion(col3, col4)')`
// -----------------------------------------

/** Separa por comas de nivel superior, respetando parentesis anidados. */
function splitTopLevel(str) {
  const partes = []
  let profundidad = 0
  let actual = ''
  for (const ch of str) {
    if (ch === '(') profundidad++
    if (ch === ')') profundidad--
    if (ch === ',' && profundidad === 0) {
      partes.push(actual)
      actual = ''
    } else {
      actual += ch
    }
  }
  if (actual.trim()) partes.push(actual)
  return partes
}

function parseSelect(selectStr) {
  const str = (selectStr || '*').trim()
  if (str === '*' || str === '') return { star: true, columns: [], relations: [] }

  const columns = []
  const relations = []
  for (const raw of splitTopLevel(str)) {
    const parte = raw.trim().replace(/\s+/g, ' ')
    if (!parte) continue
    const m = parte.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([\s\S]*)\)$/)
    if (m) {
      const nombreRelacion = m[1]
      const subcolumnas = splitTopLevel(m[2]).map((s) => s.trim()).filter(Boolean)
      relations.push({ name: nombreRelacion, columns: subcolumnas })
    } else {
      columns.push(parte)
    }
  }
  return { star: false, columns, relations }
}

// -----------------------------------------
// WHERE
// -----------------------------------------

function mapOperador(op) {
  return { eq: '=', neq: '!=', gt: '>', gte: '>=', lt: '<', lte: '<=', like: 'LIKE', ilike: 'LIKE' }[op] || '='
}

function buildWhere(filters) {
  if (!filters || filters.length === 0) return { whereSql: '', params: [] }
  const partes = []
  const params = []
  for (const f of filters) {
    if (f.op === 'not') {
      if (f.subOp === 'is' && f.val === null) {
        partes.push(`${f.col} IS NOT NULL`)
      } else {
        partes.push(`NOT (${f.col} ${mapOperador(f.subOp)} ?)`)
        params.push(coerceParam(f.val))
      }
      continue
    }
    if (f.op === 'is') {
      if (f.val === null) partes.push(`${f.col} IS NULL`)
      else { partes.push(`${f.col} IS ?`); params.push(coerceParam(f.val)) }
      continue
    }
    partes.push(`${f.col} ${mapOperador(f.op)} ?`)
    params.push(coerceParam(f.val))
  }
  return { whereSql: partes.join(' AND '), params }
}

// -----------------------------------------
// Resultado final segun .single()/.maybeSingle()
// -----------------------------------------

function applySingle(rows, modo) {
  if (modo === 'single') {
    if (rows.length === 0) {
      return { data: null, error: { message: 'No se encontro el registro (0 filas).', details: null, hint: null, code: 'PGRST116' } }
    }
    if (rows.length > 1) {
      return { data: null, error: { message: 'Se esperaba una sola fila y se encontraron varias.', details: null, hint: null, code: 'PGRST116' } }
    }
    return { data: rows[0], error: null }
  }
  if (modo === 'maybeSingle') {
    if (rows.length === 0) return { data: null, error: null }
    if (rows.length > 1) {
      return { data: null, error: { message: 'Se esperaba una sola fila y se encontraron varias.', details: null, hint: null, code: 'PGRST116' } }
    }
    return { data: rows[0], error: null }
  }
  return { data: rows, error: null }
}

/** Deja en cada fila solo las columnas/relaciones pedidas explicitamente. */
function shapeRows(rows, columns, relations) {
  return rows.map((r) => {
    const out = {}
    for (const c of columns) out[c] = r[c]
    for (const rel of relations) out[rel.name] = r[rel.name]
    return out
  })
}

function attachRelations(db, table, rows, relations) {
  for (const rel of relations) {
    const fkCol = RELATION_FK[rel.name]
    if (!fkCol) continue // relacion desconocida: se ignora en vez de reventar
    const ids = [...new Set(rows.map((r) => r[fkCol]).filter((v) => v !== null && v !== undefined))]
    let relRows = []
    if (ids.length > 0) {
      const relCols = rel.columns.length ? Array.from(new Set(['id', ...rel.columns])) : ['*']
      const placeholders = ids.map(() => '?').join(',')
      relRows = queryAll(db, `SELECT ${relCols.join(', ')} FROM ${rel.name} WHERE id IN (${placeholders})`, ids)
        .map((r) => coerceRow(rel.name, r))
    }
    const byId = new Map(relRows.map((r) => [r.id, r]))
    for (const r of rows) {
      const relacionada = r[fkCol] !== null && r[fkCol] !== undefined ? byId.get(r[fkCol]) || null : null
      if (relacionada && rel.columns.length) {
        const recortada = {}
        for (const c of rel.columns) recortada[c] = relacionada[c]
        r[rel.name] = recortada
      } else {
        r[rel.name] = relacionada
      }
    }
  }
}

// -----------------------------------------
// Operaciones
// -----------------------------------------

function execSelect(db, plan) {
  const { star, columns, relations } = parseSelect(plan.selectStr)
  const fkColsNecesarias = relations.map((r) => RELATION_FK[r.name]).filter(Boolean)

  let selectCols = ['*']
  if (!star) {
    const set = new Set(columns)
    for (const c of fkColsNecesarias) set.add(c)
    set.add('id') // por si acaso alguna relacion lo necesita y no vino en columns
    selectCols = Array.from(set)
  }

  const { whereSql, params } = buildWhere(plan.filters)
  let sql = `SELECT ${selectCols.join(', ')} FROM ${plan.table}`
  if (whereSql) sql += ` WHERE ${whereSql}`
  if (plan.order) sql += ` ORDER BY ${plan.order.col} ${plan.order.ascending ? 'ASC' : 'DESC'}`
  if (plan.limit !== null && plan.limit !== undefined) sql += ` LIMIT ${plan.limit}`

  let rows
  try {
    rows = queryAll(db, sql, params).map((r) => coerceRow(plan.table, r))
  } catch (e) {
    return { data: null, error: mapSqliteError(e) }
  }

  attachRelations(db, plan.table, rows, relations)

  const shaped = star ? rows : shapeRows(rows, columns, relations)
  return applySingle(shaped, plan.single)
}

function execInsert(db, plan) {
  const filas = Array.isArray(plan.payload) ? plan.payload : [plan.payload]
  const idsInsertados = []

  try {
    for (const fila of filas) {
      const cols = Object.keys(fila)
      const vals = cols.map((c) => coerceParam(fila[c]))
      const sql = cols.length
        ? `INSERT INTO ${plan.table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`
        : `INSERT INTO ${plan.table} DEFAULT VALUES`
      run(db, sql, vals)
      idsInsertados.push(lastInsertId(db))
    }
  } catch (e) {
    return { data: null, error: mapSqliteError(e) }
  }

  if (!plan.returning) return { data: null, error: null }

  const placeholders = idsInsertados.map(() => '?').join(',')
  const filasInsertadas = queryAll(db, `SELECT * FROM ${plan.table} WHERE id IN (${placeholders})`, idsInsertados)
    .map((r) => coerceRow(plan.table, r))
  const byId = new Map(filasInsertadas.map((r) => [r.id, r]))
  let out = idsInsertados.map((id) => byId.get(id)).filter(Boolean)

  const { star, columns, relations } = parseSelect(plan.selectStr)
  if (!star) {
    attachRelations(db, plan.table, out, relations)
    out = shapeRows(out, columns, relations)
  }

  return applySingle(out, plan.single)
}

function execUpdate(db, plan) {
  const { whereSql, params } = buildWhere(plan.filters)
  const cols = Object.keys(plan.payload)
  const setSql = cols.map((c) => `${c} = ?`).join(', ')
  const setParams = cols.map((c) => coerceParam(plan.payload[c]))

  let sql = `UPDATE ${plan.table} SET ${setSql}`
  if (whereSql) sql += ` WHERE ${whereSql}`

  try {
    run(db, sql, [...setParams, ...params])
  } catch (e) {
    return { data: null, error: mapSqliteError(e) }
  }

  if (!plan.returning) return { data: null, error: null }

  let rows
  try {
    const sqlSel = `SELECT * FROM ${plan.table}${whereSql ? ` WHERE ${whereSql}` : ''}`
    rows = queryAll(db, sqlSel, params).map((r) => coerceRow(plan.table, r))
  } catch (e) {
    return { data: null, error: mapSqliteError(e) }
  }

  const { star, columns, relations } = parseSelect(plan.selectStr)
  if (!star) {
    attachRelations(db, plan.table, rows, relations)
    rows = shapeRows(rows, columns, relations)
  }

  return applySingle(rows, plan.single)
}

function execDelete(db, plan) {
  const { whereSql, params } = buildWhere(plan.filters)
  let sql = `DELETE FROM ${plan.table}`
  if (whereSql) sql += ` WHERE ${whereSql}`
  try {
    run(db, sql, params)
  } catch (e) {
    return { data: null, error: mapSqliteError(e) }
  }
  return { data: null, error: null }
}

/**
 * Ejecuta un plan (ver queryBuilder.js) contra una base sql.js ya abierta.
 * Sincrono por dentro (sql.js lo es), envuelto en Promise para que el
 * executor tenga siempre la misma forma sin importar de donde se llame.
 *
 * @param {import('sql.js').Database} db
 * @param {object} plan
 * @returns {Promise<{data:any,error:any}>}
 */
export async function runPlan(db, plan) {
  try {
    switch (plan.op) {
      case 'select': return execSelect(db, plan)
      case 'insert': return execInsert(db, plan)
      case 'update': return execUpdate(db, plan)
      case 'delete': return execDelete(db, plan)
      default:
        return { data: null, error: { message: `Operacion no soportada: ${plan.op}`, code: null } }
    }
  } catch (e) {
    return { data: null, error: mapSqliteError(e) }
  }
}

/**
 * Autenticacion local: reemplaza a `supabase.auth.signInWithPassword`.
 * Verifica el hash bcrypt guardado en `usuarios.password_hash` contra la
 * columna `correo` (mismo campo que usa src/pages/Home/Login.jsx).
 *
 * @param {import('sql.js').Database} db
 * @param {{email:string,password:string}} credenciales
 */
export async function signInWithPassword(db, { email, password }) {
  const filas = queryAll(db, 'SELECT id, correo, password_hash FROM usuarios WHERE correo = ?', [email])
  const usuario = filas[0]

  // Mismo mensaje que devuelve supabase-js real para credenciales invalidas:
  // Login.jsx hace  /invalid login credentials/i.test(errorAuth.message)
  // para mostrar un aviso amigable en vez del error tecnico.
  const credencialesInvalidas = {
    data: { user: null, session: null },
    error: { message: 'Invalid login credentials', details: null, hint: null, code: 'invalid_credentials' },
  }

  if (!usuario) return credencialesInvalidas

  const ok = bcrypt.compareSync(password, usuario.password_hash)
  if (!ok) return credencialesInvalidas

  return {
    data: { user: { id: usuario.id, email: usuario.correo }, session: { user: { id: usuario.id, email: usuario.correo } } },
    error: null,
  }
}
