// =========================================
// Adaptador local: query builder estilo supabase-js
// =========================================
// Implementa el subconjunto ENCADENABLE de la API de supabase-js que usa el
// resto de la app (ver inventario en el comentario de schema.js), con el
// mismo shape de retorno `{ data, error }`.
//
// Este archivo es agnostico de donde se ejecuta realmente la consulta: no
// importa Node, `fs` ni `sql.js`. Solo arma un "plan" (objeto plano
// serializable) describiendo la operacion, y se lo entrega a un `executor`
// inyectado por quien lo use:
//   - en el renderer de Electron, el executor manda el plan por IPC al
//     proceso principal (ver src/lib/local/ipcClient.js);
//   - en Node (proceso principal de Electron, o un script de prueba sin
//     Electron), el executor corre el plan directamente contra sql.js
//     (ver src/lib/local/engine.js).
//
// Por eso este mismo archivo se puede usar sin Electron: es lo que permite
// probar el adaptador con un script de Node plano.
// =========================================

function nuevoPlan(table) {
  return {
    table,
    op: 'select', // 'select' | 'insert' | 'update' | 'delete'
    selectStr: null,
    filters: [], // { col, op: 'eq'|'neq'|'gt'|'gte'|'lt'|'lte'|'like'|'ilike'|'is'|'not', subOp?, val }
    order: null, // { col, ascending }
    limit: null,
    single: null, // 'single' | 'maybeSingle' | null
    payload: null, // objeto o array, para insert/update
    returning: false, // si hay que devolver filas tras insert/update
  }
}

export class LocalQueryBuilder {
  constructor(table, executor) {
    this._plan = nuevoPlan(table)
    this._executor = executor
  }

  select(columnas = '*') {
    this._plan.selectStr = columnas
    if (this._plan.op === 'insert' || this._plan.op === 'update' || this._plan.op === 'delete') {
      this._plan.returning = true
    }
    return this
  }

  insert(payload) {
    this._plan.op = 'insert'
    this._plan.payload = payload
    return this
  }

  update(payload) {
    this._plan.op = 'update'
    this._plan.payload = payload
    return this
  }

  delete() {
    this._plan.op = 'delete'
    return this
  }

  eq(col, val) { this._plan.filters.push({ col, op: 'eq', val }); return this }
  neq(col, val) { this._plan.filters.push({ col, op: 'neq', val }); return this }
  gt(col, val) { this._plan.filters.push({ col, op: 'gt', val }); return this }
  gte(col, val) { this._plan.filters.push({ col, op: 'gte', val }); return this }
  lt(col, val) { this._plan.filters.push({ col, op: 'lt', val }); return this }
  lte(col, val) { this._plan.filters.push({ col, op: 'lte', val }); return this }
  like(col, val) { this._plan.filters.push({ col, op: 'like', val }); return this }
  ilike(col, val) { this._plan.filters.push({ col, op: 'ilike', val }); return this }
  is(col, val) { this._plan.filters.push({ col, op: 'is', val }); return this }

  /** Unico uso real en la app: .not('col', 'is', null) -> "col IS NOT NULL". */
  not(col, subOp, val) { this._plan.filters.push({ col, op: 'not', subOp, val }); return this }

  order(col, opciones) {
    this._plan.order = { col, ascending: opciones?.ascending !== false }
    return this
  }

  limit(n) { this._plan.limit = n; return this }

  single() { this._plan.single = 'single'; return this }
  maybeSingle() { this._plan.single = 'maybeSingle'; return this }

  // Hace que `await builder` funcione igual que en supabase-js real, sin
  // que quien llama tenga que invocar ningun metodo "execute()" explicito.
  then(onFulfilled, onRejected) {
    return this._executor(this._plan).then(onFulfilled, onRejected)
  }

  catch(onRejected) {
    return this._executor(this._plan).catch(onRejected)
  }
}

/**
 * Crea un cliente con la misma forma que el `supabase` de supabase-js
 * (solo el subconjunto que usa esta app): `.from(tabla)` y `.auth.signInWithPassword`.
 *
 * @param {(plan: object) => Promise<{data:any,error:any}>} executor
 * @param {(credenciales: {email:string,password:string}) => Promise<{data:any,error:any}>} signInWithPassword
 */
export function createLocalClient(executor, signInWithPassword) {
  return {
    from(table) {
      return new LocalQueryBuilder(table, executor)
    },
    auth: {
      signInWithPassword,
    },
  }
}
