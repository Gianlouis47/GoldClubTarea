import React from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'

const archivos = ['INC 2025-0045','INC 2025-0044','INC 2025-0043','INC 2025-0042','INC 2025-0041','INC 2025-0040']
const campos = [
  ['Fecha de guía:', '26/10/2025'],
  ['Número de guía:', 'GIA-2025-0123'],
  ['Código de producto:', 'Cód: 5678- Ron añejo'],
  ['Cantidad de producto:', '5'],
  ['Cantidad de faltante:', 'Cód: 5678-Ron añejo'],
]

export default function ReporteImpreso() {
  const navigate = useNavigate()
  return (
    <Layout>
      <div className="main-content">
        <div className="two-col">
          <div style={{background:'#c8c8c8',borderRadius:12,padding:28,color:'#1a1a1a'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
              <svg width="50" height="50" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="38" fill="#2c2c2c" stroke="#D4A017" strokeWidth="3"/>
                <text x="40" y="50" textAnchor="middle" fontSize="28" fontWeight="bold" fill="#D4A017" fontFamily="serif">G</text>
              </svg>
              <span style={{fontSize:20,fontWeight:700}}>Gold Club Tenares</span>
            </div>
            <h2 style={{fontSize:20,fontWeight:700,marginBottom:16}}>Reporte de incidentes</h2>
            <div style={{background:'white',borderRadius:8,padding:16,marginBottom:16}}>
              <div style={{fontWeight:700,marginBottom:10,fontSize:14}}>Fecha de incidente</div>
              {campos.map(([label, val]) => (
                <div key={label} style={{display:'flex',gap:12,marginBottom:8,fontSize:13}}>
                  <span style={{minWidth:180,color:'#555'}}>{label}</span>
                  <span style={{background:'#e8e8e8',borderRadius:4,padding:'3px 10px',flex:1}}>{val}</span>
                </div>
              ))}
            </div>
            <div style={{background:'white',borderRadius:8,padding:16,marginBottom:16}}>
              <div style={{fontWeight:700,marginBottom:8,fontSize:14}}>Descripción del problema</div>
              <div style={{background:'#e8e8e8',borderRadius:4,padding:10,fontSize:13}}>
                Cinco botellas de ron añejo dañadas durante el transporte. Cajas humedas y sellos rotos en su totalidad.
              </div>
            </div>
            <div style={{background:'white',borderRadius:8,padding:16}}>
              <div style={{fontWeight:700,marginBottom:8,fontSize:14}}>Firma del encargado del almacén</div>
              <div style={{display:'flex',gap:12,fontSize:13}}>
                <span style={{color:'#555',minWidth:120}}>Firma encargado:</span>
                <span style={{background:'#e8e8e8',borderRadius:4,padding:'3px 10px',flex:1}}>Usuario: [Jedeermín Pérez] - Firma electrónica</span>
              </div>
            </div>
            <div className="mt-3 text-center">
              <button className="btn btn-gold" onClick={() => window.print()}>🖨️ Imprimir</button>
              <button className="btn btn-outline" onClick={() => navigate('/documentos/reporte-incidentes')} style={{marginLeft:8}}>← Volver</button>
            </div>
          </div>

          <div>
            <div style={{fontWeight:600,marginBottom:12,fontSize:14}}>Archivos recientes</div>
            <ul className="sidebar-list">{archivos.map(a => <li key={a}>{a}</li>)}</ul>
          </div>
        </div>
      </div>
    </Layout>
  )
}
