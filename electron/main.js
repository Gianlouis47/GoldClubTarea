// =========================================
// Electron - proceso principal
// =========================================
// Responsable de:
//   1. Abrir la ventana de la app (cargando el dev server de Vite en
//      desarrollo, o el build estatico en produccion).
//   2. Abrir/crear la base de datos SQLite local (sql.js) en
//      app.getPath('userData') -- una copia independiente por instalacion,
//      sin sincronizar entre equipos (ver limitaciones en el README).
//   3. Exponer un canal IPC generico ('db:query') que recibe el "plan" que
//      arma LocalQueryBuilder (src/lib/local/queryBuilder.js) y lo ejecuta
//      con el motor sql.js (src/lib/local/engine.js), y otro ('db:auth')
//      para el login local.
//   4. Persistir la base a disco despues de cada escritura.
// =========================================

import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { openLocalDatabase } from '../src/lib/local/store.js'
import { runPlan, signInWithPassword } from '../src/lib/local/engine.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// =========================================
// Registro de diagnostico (temporal, para investigar la pantalla en negro
// reportada en Windows: en el sandbox de desarrollo la app renderiza bien
// en todos los escenarios probados, asi que hace falta ver el error real
// que ocurre en la maquina donde SI falla). Se guarda en un archivo de
// texto plano en la carpeta de datos de la app para poder mandarlo sin
// depender de que la ventana muestre algo.
// =========================================
const LOG_PATH = path.join(app.getPath('userData'), 'diagnostico.log')
function log(mensaje) {
  const linea = `[${new Date().toISOString()}] ${mensaje}\n`
  console.log(linea.trim())
  try {
    fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true })
    fs.appendFileSync(LOG_PATH, linea)
  } catch (e) {
    console.error('[Gold Club] No se pudo escribir el log de diagnostico:', e)
  }
}

log(`=== Gold Club iniciando === log en: ${LOG_PATH}`)
log(`Electron ${process.versions.electron} / Chrome ${process.versions.chrome} / Node ${process.versions.node} / plataforma ${process.platform} ${process.arch}`)

process.on('uncaughtException', (err) => log(`[uncaughtException] ${err?.stack || err}`))
process.on('unhandledRejection', (err) => log(`[unhandledRejection] ${err?.stack || err}`))

// En algunas PCs con Windows (tarjetas graficas integradas viejas, maquinas
// virtuales, drivers desactualizados) Electron/Chromium se queda con la
// ventana en negro al usar aceleracion por hardware para dibujar. Es un
// problema conocido de Electron, no de esta app; desactivarla es la
// solucion estandar y no se nota a simple vista en una app de formularios
// y tablas como esta (no hay animaciones ni graficos pesados).
app.disableHardwareAcceleration()

// Con VITE_DEV_SERVER_URL definido (ver package.json -> script "electron:dev")
// la ventana carga el dev server de Vite (hot reload); si no, carga el build
// estatico generado por `npm run build` (dist/index.html).
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

let dbHandle = null

async function iniciarBaseLocal() {
  const dbFilePath = path.join(app.getPath('userData'), 'goldclub.sqlite')
  log(`Abriendo base de datos local en ${dbFilePath} ...`)
  dbHandle = await openLocalDatabase(dbFilePath)
  log('Base de datos local lista.')
}

function registrarCanalesIpc() {
  ipcMain.handle('db:query', async (_event, plan) => {
    const resultado = await runPlan(dbHandle.db, plan)
    // Persistimos a disco tras cualquier escritura (insert/update/delete),
    // aunque la operacion haya fallado a medias, para no perder lo que si
    // se alcanzo a guardar antes del error.
    if (plan.op !== 'select') dbHandle.persist()
    return resultado
  })

  ipcMain.handle('db:auth', async (_event, credenciales) => {
    return signInWithPassword(dbHandle.db, credenciales)
  })
}

function crearVentana() {
  log('Creando ventana...')
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#1a1a1a',
    autoHideMenuBar: true,
    show: false, // se muestra recien en 'ready-to-show', para no ver un frame en negro mientras carga
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // requerido para poder usar un preload ESM (ver preload.js)
    },
  })

  win.once('ready-to-show', () => { log('ready-to-show: mostrando ventana.'); win.show() })
  win.webContents.on('console-message', (e) => log(`[renderer console] nivel=${e.level} ${e.sourceId}:${e.lineNumber} -> ${e.message}`))
  win.webContents.on('did-fail-load', (e, errorCode, errorDescription, validatedURL) => log(`[did-fail-load] codigo=${errorCode} desc=${errorDescription} url=${validatedURL}`))
  win.webContents.on('did-finish-load', () => log('did-finish-load: la pagina termino de cargar.'))
  win.webContents.on('preload-error', (e, preloadPath, error) => log(`[preload-error] ${preloadPath} -> ${error?.stack || error}`))
  win.webContents.on('render-process-gone', (e, details) => log(`[render-process-gone] ${JSON.stringify(details)}`))
  win.webContents.on('unresponsive', () => log('[unresponsive] la ventana dejo de responder.'))
  win.on('unresponsive', () => log('[window unresponsive]'))

  // DIAGNOSTICO TEMPORAL: se fuerzan las DevTools tambien en produccion para
  // poder ver el error real en la maquina donde la pantalla queda en negro.
  // Se debe quitar esta linea (dejando el bloque `if (DEV_SERVER_URL)` de
  // abajo tal cual) una vez resuelto el problema, antes de la entrega final.
  win.webContents.openDevTools({ mode: 'detach' })

  if (DEV_SERVER_URL) {
    log(`Cargando dev server: ${DEV_SERVER_URL}`)
    win.loadURL(DEV_SERVER_URL)
  } else {
    const distIndex = path.join(__dirname, '..', 'dist', 'index.html')
    log(`Cargando build estatico: ${distIndex} (existe: ${fs.existsSync(distIndex)})`)
    win.loadFile(distIndex)
      .then(() => log('loadFile resuelto sin error.'))
      .catch((err) => log(`[loadFile error] ${err?.stack || err}`))
  }
}

app.whenReady().then(async () => {
  log('app.whenReady().')
  try {
    await iniciarBaseLocal()
    registrarCanalesIpc()
    crearVentana()
  } catch (err) {
    log(`[error en el arranque] ${err?.stack || err}`)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentana()
  })
}).catch((err) => log(`[whenReady rechazado] ${err?.stack || err}`))

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
