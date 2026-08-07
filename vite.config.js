import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Rutas relativas en el build: necesario para que Electron pueda cargar
  // dist/index.html con file:// (con base absoluta "/" los assets no se
  // encontrarian fuera de un servidor web).
  base: './',
})
