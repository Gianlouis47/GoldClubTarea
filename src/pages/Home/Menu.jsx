import React from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'

export default function Menu() {
  return (
    <Layout>
      <div className="main-content">
        <h1 className="page-title">Menú Principal</h1>

        <div className="menu-grid">
          {[
            { to: '/inventario', icon: <><path d="M12 5v14"/><path d="M5 12h14"/><rect x="3" y="3" width="18" height="18" rx="2"/></>, label: 'Crear nuevo producto' },
            { to: '/inventario/registrar-entrada', icon: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>, label: 'Registrar entrada de producto' },
            { to: '/documentos/nota-despacho', icon: <path d="M9 11H5a2 2 0 00-2 2v5a2 2 0 002 2h14a2 2 0 002-2v-5a2 2 0 00-2-2h-4M9 11V7a3 3 0 116 0v4M9 11h6"/>, label: 'Preparar despacho' },
            { to: '/documentos/informe-baja', icon: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></>, label: 'Generar informe de baja' },
            { to: '/inventario/asignar-ubicacion', icon: <><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></>, label: 'Asignar ubicación' },
            { to: '/inventario/registrar-salida', icon: <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/>, label: 'Registrar salida' },
            { to: '/inventario/consultar-movimientos', icon: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>, label: 'Consultar movimientos' },
            { to: '/inventario/verificar-documentos', icon: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="9 15 11 17 15 13"/></>, label: 'Verificar documentos' },
            { to: '/inventario/generar-alerta', icon: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>, label: 'Generar alerta por nivel mínimo' },
          ].map(({ to, icon, label }) => (
            <Link key={to} className="menu-card" to={to}>
              <svg className="menu-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{icon}</svg>
              <span className="menu-card-label">{label}</span>
            </Link>
          ))}
        </div>

        {/* Nueva sección: Ventas y Compras */}
        <div className="section-heading mt-3">Ventas y Compras</div>
        <div className="menu-grid">
          <Link className="menu-card" to="/ventas/nueva-venta">
            <svg className="menu-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
            </svg>
            <span className="menu-card-label">Nueva venta / Facturación</span>
          </Link>

          <Link className="menu-card" to="/ventas/orden-compra">
            <svg className="menu-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <span className="menu-card-label">Orden de compra / Pedir productos</span>
          </Link>

          <Link className="menu-card" to="/ventas/recepcion">
            <svg className="menu-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            <span className="menu-card-label">Recepción de productos</span>
          </Link>

          <Link className="menu-card" to="/ventas/historial">
            <svg className="menu-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span className="menu-card-label">Historial de ventas</span>
          </Link>
        </div>
      </div>
    </Layout>
  )
}