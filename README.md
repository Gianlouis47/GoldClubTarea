# Gold Club — Sistema de inventario, ventas y documentos

Aplicación web hecha con **Vite + React (JavaScript)** y **Supabase (PostgreSQL)**.

---

## 1. Requisitos

- Node.js 18 o superior
- Una cuenta de [Supabase](https://supabase.com) con un proyecto creado

---

## 2. Instalación

```bash
npm install
```

## 3. Configurar la base de datos (una sola vez)

En **Supabase Dashboard → SQL Editor**, ejecuta los scripts de la carpeta
`database/` **en este orden**:

| Orden | Archivo | Para qué sirve |
|-------|---------|----------------|
| 1 | `database/01_borrar_todo.sql` | Borra todo. **Solo** si quieres empezar de cero. |
| 2 | `database/02_recrear_todo.sql` | Crea todas las tablas y los datos semilla (roles, categorías, el usuario `admin`, un proveedor). |
| 3 | `database/03_politicas_rls.sql` | Activa RLS y da permiso a la clave `anon` que usa el navegador. |

> Si te sale el error *"la tabla no existe"* o *"la base de datos rechazó la
> operación por permisos (RLS)"*, es porque falta ejecutar el paso 2 o el 3.

## 4. Configurar las credenciales

Las credenciales **nunca** se suben al repositorio.

```bash
# Windows (PowerShell)
Copy-Item .env.example .env
```

Abre el `.env` y rellena los dos valores, que salen de
**Supabase Dashboard → Project Settings → API**:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Usa la clave **anon / publishable**. La `service_role` nunca va en el navegador.

## 5. Arrancar

```bash
npm run dev
```

---

## Primer acceso (importante)

Las contraseñas las gestiona **Supabase Auth**, no la tabla `usuarios`
(así no se guardan contraseñas en texto plano). El script
`02_recrear_todo.sql` crea la *ficha* del usuario `admin` en la tabla
`usuarios`, pero **no** su contraseña.

Para poder entrar la primera vez:

1. Ve a **Supabase Dashboard → Authentication → Users → Add user**.
2. Email: el mismo que está en la tabla `usuarios` (por defecto
   `admin@goldcrew.com`).
3. Pon una contraseña y marca *Auto Confirm User*.
4. Entra en la app con `admin` (o el correo completo) y esa contraseña.

El login acepta **el nombre de usuario o el correo**: si escribes el usuario,
la app busca su correo en la tabla `usuarios` y autentica con Supabase Auth.

---

## Flujo de trabajo del sistema

El número de la orden de compra es la referencia que une los documentos, así
que el orden importa:

```
Ventas y Compras
  ├── Orden de compra ──────────┐   genera el Nº de orden (OC-00001)
  └── Recepción de productos ◄──┘   suma el pedido al stock

Documentos (usan el Nº de orden de compra)
  ├── Orden de preparación      qué se prepara y a dónde va
  ├── Nota de despacho          descuenta el stock al entregar
  └── Reporte de incidentes     faltantes o daños de esa orden
```

Por eso, si no hay ninguna orden de compra creada, los tres documentos
muestran el desplegable vacío con un aviso: **primero se crea la orden de
compra**.

---

## Estructura

```
src/
  lib/
    supabase.js   cliente de Supabase + detección de credenciales faltantes
    errores.js    traduce los errores de Supabase/PostgreSQL a español
    sesion.js     usuario de la sesión y usuario_id válido para las FK
    ordenes.js    lee las órdenes de compra reales y sus productos
  components/     Layout, Navbar, Modal
  pages/
    Home/         Login, Dashboard, Menu
    Inventario/   productos, entradas, salidas, ubicaciones, alertas
    Ventas/       nueva venta, orden de compra, recepción, historial
    Documentos/   nota de despacho, orden de preparación, incidentes, baja
    Tareas/       caducidad
database/         scripts SQL
```

---

## Si algo falla

La app ya **no** muestra "Ocurrió un error": dice la causa concreta. Si aun
así te quedas atascado, abre la consola del navegador (**F12 → Console**),
donde queda registrado el error completo.

| Mensaje | Qué hacer |
|---------|-----------|
| "La conexión con la base de datos no está configurada" | Falta el `.env` (paso 4). Reinicia `npm run dev` después de crearlo. |
| "La tabla no existe" | Ejecuta `database/02_recrear_todo.sql`. |
| "…rechazó la operación por permisos (RLS)" | Ejecuta `database/03_politicas_rls.sql`. |
| "No hay ningún usuario registrado…" | Ejecuta `database/02_recrear_todo.sql` (crea el usuario `admin`). |
| "Usuario o contraseña incorrectos" | Crea el usuario en Authentication → Users (ver *Primer acceso*). |
| "No hay conexión con la base de datos" | Revisa tu internet y que `VITE_SUPABASE_URL` sea correcta. |
