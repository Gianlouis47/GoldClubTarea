import React from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'

export default function DocumentosIndex() {
  return (
    <Layout>
      <div className="main-content">
        <h1 className="page-title">Documentos Digitalizados</h1>
        <div className="card">
          <div className="flex-between mb-3">
            <span style={{fontSize:16,fontWeight:600}}>Inventario / almacén</span>
            <div className="flex gap-2">
              <div className="search-bar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" placeholder="Buscar" />
              </div>
              <button className="btn btn-gold">Subir nuevo documento</button>
            </div>
          </div>

          <div className="doc-grid">
            <Link className="doc-card" to="/documentos/nota-despacho">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 11H5a2 2 0 00-2 2v5a2 2 0 002 2h14a2 2 0 002-2v-5a2 2 0 00-2-2h-4M9 11V7a3 3 0 116 0v4M9 11h6"/></svg>
              <span className="doc-card-label">Nota de despacho</span>
            </Link>
            <Link className="doc-card" to="/documentos/reporte-incidentes">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="12" cy="14" r="1"/><line x1="12" y1="11" x2="12" y2="11.5"/></svg>
              <span className="doc-card-label">Reporte de incidentes</span>
            </Link>
            <Link className="doc-card" to="/documentos/orden-preparacion">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
              <span className="doc-card-label">Orden de preparación</span>
            </Link>
            <Link className="doc-card" to="/documentos/informe-baja">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
              <span className="doc-card-label">Informe de baja</span>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}
