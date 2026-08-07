// =========================================
// Script de desarrollo: Vite + Electron juntos
// =========================================
// `npm run electron:dev` levanta el dev server de Vite (con hot reload) y
// abre la ventana de Electron apuntando a el, sin depender de paquetes
// adicionales (concurrently/wait-on): Vite se arranca con su API
// programatica, así sabemos exactamente cuando ya esta listo.
// =========================================

import { createServer } from 'vite'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import electronPath from 'electron'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const raiz = path.join(__dirname, '..')

async function main() {
  const server = await createServer({ root: raiz, configFile: path.join(raiz, 'vite.config.js') })
  await server.listen()
  const url = server.resolvedUrls.local[0]
  console.log(`[electron:dev] Vite dev server en ${url}`)

  const hijo = spawn(electronPath, [raiz], {
    stdio: 'inherit',
    env: { ...process.env, VITE_DEV_SERVER_URL: url },
  })

  hijo.on('close', async (codigo) => {
    await server.close()
    process.exit(codigo ?? 0)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
