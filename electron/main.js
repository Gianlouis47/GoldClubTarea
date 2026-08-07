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
import { fileURLToPath } from 'node:url'
import { openLocalDatabase } from '../src/lib/local/store.js'
import { runPlan, signInWithPassword } from '../src/lib/local/engine.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Con VITE_DEV_SERVER_URL definido (ver package.json -> script "electron:dev")
// la ventana carga el dev server de Vite (hot reload); si no, carga el build
// estatico generado por `npm run build` (dist/index.html).
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

let dbHandle = null

async function iniciarBaseLocal() {
  const dbFilePath = path.join(app.getPath('userData'), 'goldclub.sqlite')
  dbHandle = await openLocalDatabase(dbFilePath)
  console.log('[Gold Club] Base de datos local:', dbHandle.filePath)
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
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#1a1a1a',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // requerido para poder usar un preload ESM (ver preload.js)
    },
  })

  if (DEV_SERVER_URL) {
    win.loadURL(DEV_SERVER_URL)
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

app.whenReady().then(async () => {
  await iniciarBaseLocal()
  registrarCanalesIpc()
  crearVentana()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentana()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
