# Gold Club — Sistema de Inventario

Migración del proyecto C# (ASP.NET MVC) a **React + Vite + Supabase**.

---

## 🚀 Instalación rápida

### 1. Abrir en VS Code

Descomprime el ZIP y abre la carpeta `goldclub` en VS Code.

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Supabase

Copia el archivo `.env.example` como `.env`:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de Supabase:

```
VITE_SUPABASE_URL=https://TU_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
```

### 4. Crear las tablas en Supabase

Copia y ejecuta el contenido de `database/schema.sql` en el **SQL Editor** de Supabase.

### 5. Arrancar el servidor de desarrollo

```bash
npm run dev
```

Abre http://localhost:5173 en tu navegador.

---

## 📁 Estructura del proyecto

```
goldclub/
├── src/
│   ├── components/     # Modal, Navbar, Layout
│   ├── lib/            # Cliente de Supabase
│   └── pages/
│       ├── Home/       # Login, Dashboard, Menu
│       ├── Inventario/ # Registrar Entrada/Salida, Crear Producto, etc.
│       ├── Documentos/ # Nota de Despacho, Reportes, etc.
│       └── Tareas/     # Caducidad / Calendario
├── database/
│   └── schema.sql      # Esquema PostgreSQL (mismo del proyecto original)
├── .env.example        # Variables de entorno de ejemplo
└── index.html
```

---

## 🗃️ Base de datos

El archivo `database/schema.sql` es exactamente el mismo del proyecto C# original.
Contiene las tablas: `roles`, `usuarios`, `productos`, `categorias`, `ubicaciones`,
`proveedores`, `lotes`, `entradas`, `detalle_entradas`, `salidas`, `detalle_salidas`,
`movimientos_inventario` y `auditoria`.

---

## 🎨 Diseño

La apariencia es idéntica al proyecto original: tema oscuro con dorado (#D4A017),
mismo CSS, mismos modales, misma navegación.
