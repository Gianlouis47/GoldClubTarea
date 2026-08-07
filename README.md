# Gold Club - Sistema de Gestión de Inventario

Proyecto en desarrollo para la asignatura de **Proyecto Aplicado 1**.

Es un sistema web desarrollado para gestionar las operaciones de inventario, registro de ventas, compras y generación de documentos operativos (notas de despacho, órdenes de preparación e incidentes).

---

## 🛠️ Tecnologías

* **Frontend:** React + Vite
* **Backend & Base de datos:** Supabase (PostgreSQL)

---

## 🚀 Cómo ejecutar el proyecto

### 1. Instalación

Clona el repositorio e instala las dependencias:

```bash
npm install

```

### 2. Variables de entorno

Crea un archivo `.env` en la raíz del proyecto copiando el archivo de ejemplo:

```bash
# En Windows (PowerShell)
Copy-Item .env.example .env

```

Abre `.env` y coloca las credenciales de tu proyecto de Supabase (**Project Settings → API**):

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon

```

### 3. Iniciar servidor de desarrollo

```bash
npm run dev

```

---

## 📁 Estructura básica del proyecto

```text
src/
 ├── components/     # Componentes reutilizables (Layout, Modal, etc.)
 ├── lib/            # Configuración de Supabase y funciones auxiliares
 │    └── local/     # Adaptador local (SQLite/sql.js) para la versión de escritorio
 └── pages/          # Vistas (Inventario, Ventas, Documentos, Login)
database/            # Scripts de la base de datos SQL
electron/            # Proceso principal + preload de la versión de escritorio (Electron)

```

---

## 🖥️ Versión de escritorio (Electron, sin internet)

Además de la versión web (Supabase), el proyecto se puede empaquetar como
programa de escritorio instalable para Windows, Mac y Linux. En esa versión
**no se necesita internet ni cuenta de Supabase**: los datos se guardan en un
archivo SQLite local (`goldclub.sqlite`) dentro de la carpeta de datos del
usuario del sistema operativo, y se crea automáticamente (con datos de
ejemplo) la primera vez que se abre la app. Cada instalación tiene su propia
base de datos: no hay sincronización entre equipos.

### Desarrollo

```bash
npm run electron:dev
```

Levanta el dev server de Vite y abre la ventana de Electron apuntando a él
(con recarga en caliente).

### Generar instaladores

```bash
npm run electron:build:linux   # .AppImage
npm run electron:build:win     # instalador .exe (NSIS)
npm run electron:build:mac     # GoldClub.app
npm run electron:build         # los tres targets de una vez
```

Los instaladores quedan en `release/`. Generar el instalador de Windows desde
Linux/Mac requiere tener `wine` instalado (`electron-builder` lo usa para
firmar los ejecutables y construir el desinstalador); en Windows no hace
falta. La build de macOS generada desde otro sistema operativo no queda
firmada ni notarizada (aceptable para uso educativo, no para publicarla en
la Mac App Store).

**Usuario de prueba:** correo `admin@goldclub.com` / usuario `admin` / clave
`admin123`. No hay pantalla de recuperación de contraseña en el modo local.
