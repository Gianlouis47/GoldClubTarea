import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'

export default function VentasIndex() {
  return (
    <Layout>
      <div className="main-content">
        <h1 className="page-title">Ventas y Compras</h1>
        <div className="card">
          <div className="flex-between mb-3">
            <span style={{ fontSize: 16, fontWeight: 600 }}>Operaciones comerciales</span>
          </div>

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
      </div>
    </Layout>
  )
}
