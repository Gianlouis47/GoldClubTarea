// import React from 'react'
// import { Routes, Route, Navigate } from 'react-router-dom'

// import Login from './pages/Home/Login.jsx'
// import Dashboard from './pages/Home/Dashboard.jsx'
// import Menu from './pages/Home/Menu.jsx'

// import RegistrarEntrada from './pages/Inventario/RegistrarEntrada.jsx'
// import RegistrarSalida from './pages/Inventario/RegistrarSalida.jsx'
// import CrearProducto from './pages/Inventario/CrearProducto.jsx'
// import AsignarUbicacion from './pages/Inventario/AsignarUbicacion.jsx'
// import ConsultarMovimientos from './pages/Inventario/ConsultarMovimientos.jsx'
// import GenerarAlerta from './pages/Inventario/GenerarAlerta.jsx'
// import VerificarDocumentos from './pages/Inventario/VerificarDocumentos.jsx'

// import DocumentosIndex from './pages/Documentos/Index.jsx'
// import NotaDespacho from './pages/Documentos/NotaDespacho.jsx'
// import ReporteIncidentes from './pages/Documentos/ReporteIncidentes.jsx'
// import ReporteImpreso from './pages/Documentos/ReporteImpreso.jsx'
// import OrdenPreparacion from './pages/Documentos/OrdenPreparacion.jsx'
// import InformeBaja from './pages/Documentos/InformeBaja.jsx'

// import Caducidad from './pages/Tareas/Caducidad.jsx'

// export default function App() {
//   return (
//     <Routes>
//       <Route path="/" element={<Login />} />
//       <Route path="/dashboard" element={<Dashboard />} />
//       <Route path="/menu" element={<Menu />} />

//       {/* Inventario */}
//       <Route path="/inventario" element={<Navigate to="/inventario/registrar-entrada" replace />} />
//       <Route path="/inventario/registrar-entrada" element={<RegistrarEntrada />} />
//       <Route path="/inventario/registrar-salida" element={<RegistrarSalida />} />
//       <Route path="/inventario/crear-producto" element={<CrearProducto />} />
//       <Route path="/inventario/asignar-ubicacion" element={<AsignarUbicacion />} />
//       <Route path="/inventario/consultar-movimientos" element={<ConsultarMovimientos />} />
//       <Route path="/inventario/generar-alerta" element={<GenerarAlerta />} />
//       <Route path="/inventario/verificar-documentos" element={<VerificarDocumentos />} />

//       {/* Documentos */}
//       <Route path="/documentos" element={<DocumentosIndex />} />
//       <Route path="/documentos/nota-despacho" element={<NotaDespacho />} />
//       <Route path="/documentos/reporte-incidentes" element={<ReporteIncidentes />} />
//       <Route path="/documentos/reporte-impreso" element={<ReporteImpreso />} />
//       <Route path="/documentos/orden-preparacion" element={<OrdenPreparacion />} />
//       <Route path="/documentos/informe-baja" element={<InformeBaja />} />

//       {/* Tareas */}
//       <Route path="/tareas" element={<Caducidad />} />

//       <Route path="*" element={<Navigate to="/" replace />} />
//     </Routes>
//   )
// }


import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import Login from './pages/Home/Login.jsx'
import Dashboard from './pages/Home/Dashboard.jsx'
import Menu from './pages/Home/Menu.jsx'
import Inventario from './pages/Inventario/Inventario.jsx' 

import RegistrarEntrada from './pages/Inventario/RegistrarEntrada.jsx'
import RegistrarSalida from './pages/Inventario/RegistrarSalida.jsx'
import CrearProducto from './pages/Inventario/CrearProducto.jsx'
import AsignarUbicacion from './pages/Inventario/AsignarUbicacion.jsx'
import ConsultarMovimientos from './pages/Inventario/ConsultarMovimientos.jsx'
import GenerarAlerta from './pages/Inventario/GenerarAlerta.jsx'
import VerificarDocumentos from './pages/Inventario/VerificarDocumentos.jsx'
import EditarProducto from './pages/Inventario/EditarProducto.jsx'

import DocumentosIndex from './pages/Documentos/Index.jsx'
import NotaDespacho from './pages/Documentos/NotaDespacho.jsx'
import ReporteIncidentes from './pages/Documentos/ReporteIncidentes.jsx'
import ReporteImpreso from './pages/Documentos/ReporteImpreso.jsx'
import OrdenPreparacion from './pages/Documentos/OrdenPreparacion.jsx'
import InformeBaja from './pages/Documentos/InformeBaja.jsx'

import Caducidad from './pages/Tareas/Caducidad.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/menu" element={<Menu />} />

      <Route path="/inventario" element={<Inventario />} /> 
      
      <Route path="/inventario/registrar-entrada" element={<RegistrarEntrada />} />
      <Route path="/inventario/registrar-salida" element={<RegistrarSalida />} />
      <Route path="/inventario/crear-producto" element={<CrearProducto />} />
      <Route path="/inventario/editar-producto/:id" element={<EditarProducto />} />
      <Route path="/inventario/asignar-ubicacion" element={<AsignarUbicacion />} />
      <Route path="/inventario/consultar-movimientos" element={<ConsultarMovimientos />} />
      <Route path="/inventario/generar-alerta" element={<GenerarAlerta />} />
      <Route path="/inventario/verificar-documentos" element={<VerificarDocumentos />} />

      {/* Documentos */}
      <Route path="/documentos" element={<DocumentosIndex />} />
      <Route path="/documentos/nota-despacho" element={<NotaDespacho />} />
      <Route path="/documentos/reporte-incidentes" element={<ReporteIncidentes />} />
      <Route path="/documentos/reporte-impreso" element={<ReporteImpreso />} />
      <Route path="/documentos/orden-preparacion" element={<OrdenPreparacion />} />
      <Route path="/documentos/informe-baja" element={<InformeBaja />} />

      {/* Tareas */}
      <Route path="/tareas" element={<Caducidad />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}