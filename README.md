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
 └── pages/          # Vistas (Inventario, Ventas, Documentos, Login)
database/            # Scripts de la base de datos SQL

```
