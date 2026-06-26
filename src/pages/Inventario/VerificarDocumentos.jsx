import React from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'

const docs = [
  { id: '#DESP-0012', tipo: 'Nota de despacho', fecha: '26/10/2025', estado: 'Pendiente', estadoColor: 'rgba(212,160,23,0.2)', estadoText: 'var(--gold)', link: '/documentos/nota-despacho' },
  { id: '#INC-2025-0045', tipo: 'Reporte incidentes', fecha: '25/10/2025', estado: 'Revisión', estadoColor: 'rgba(224,82,82,0.2)', estadoText: '#e05252', link: '/documentos/reporte-incidentes' },
  { id: '#ORD-PREP-24', tipo: 'Orden preparación', fecha: '24/10/2025', estado: 'Verificado', estadoColor: 'rgba(76,175,125,0.2)', estadoText: '#4caf7d', link: '/documentos/orden-preparacion' },
]

export default function VerificarDocumentos() {
  return (
    <Layout>
      <div className="main-content">
        <h1 className="page-title">Verificar documentos</h1>
        <div className="card card-gold">
          <div className="flex-between mb-2">
            <span style={{fontWeight:600}}>Documentos pendientes de verificación</span>
            <div className="search-bar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" placeholder="Buscar..." />
            </div>
          </div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead>
              <tr style={{borderBottom:'1px solid #3a3a3a',color:'var(--text-muted)'}}>
                <th style={{padding:10,textAlign:'left'}}>N.° Documento</th>
                <th style={{padding:10,textAlign:'left'}}>Tipo</th>
                <th style={{padding:10,textAlign:'left'}}>Fecha</th>
                <th style={{padding:10,textAlign:'left'}}>Estado</th>
                <th style={{padding:10,textAlign:'left'}}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d, i) => (
                <tr key={d.id} style={{borderBottom: i < docs.length - 1 ? '1px solid #3a3a3a' : 'none'}}>
                  <td style={{padding:10,color:'var(--gold)'}}>{d.id}</td>
                  <td style={{padding:10}}>{d.tipo}</td>
                  <td style={{padding:10}}>{d.fecha}</td>
                  <td style={{padding:10}}><span style={{background:d.estadoColor,color:d.estadoText,padding:'2px 10px',borderRadius:12}}>{d.estado}</span></td>
                  <td style={{padding:10}}><Link className="btn btn-gold" style={{padding:'4px 14px',fontSize:12}} to={d.link}>Ver</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
