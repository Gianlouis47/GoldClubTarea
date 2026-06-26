import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'

const archivos = ['INC 2025-0045','INC 2025-0044','INC 2025-0043','INC 2025-0042','INC 2025-0041','INC 2025-0040']

export default function ReporteIncidentes() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fechaGuia: '26/10/2025', numGuia: 'GIA-2025-0123',
    codigoProducto: 'Cód: 5678 - Ron añejo', cantidad: '5',
    faltante: 'Cód: 5678 - Ron añejo',
    descripcion: 'Cinco botellas de ron añejo dañadas durante el transporte. Cajas humedas y sellos rotos en su totalidad.',
    firma: 'Usuario: [Jedeermín Pérez] - Firma electrónica',
  })
  const [modal, setModal] = useState(null)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <Layout>
      <div className="main-content">
        <div className="two-col">
          <div className="card card-gold">
            <div className="section-heading" style={{marginTop:0}}>Fecha de incidente</div>
            {[
              ['Fecha de guía:', 'fechaGuia', 'text'],
              ['Número de guía:', 'numGuia', 'text'],
              ['Código de producto:', 'codigoProducto', 'text'],
              ['Cantidad de producto:', 'cantidad', 'number'],
              ['Cantidad de faltante:', 'faltante', 'text'],
            ].map(([label, key, type]) => (
              <div className="form-group" key={key}>
                <label>{label}</label>
                <input className="form-control" type={type} value={form[key]} onChange={set(key)}/>
              </div>
            ))}
            <div className="section-heading">Descripción del problema</div>
            <textarea style={{width:'100%',background:'var(--bg-input)',border:'1px solid #555',borderRadius:6,padding:12,color:'var(--gold-light)',fontFamily:"'Inter',sans-serif",fontSize:13,resize:'vertical',minHeight:80}}
              value={form.descripcion} onChange={set('descripcion')}/>
            <div className="section-heading">Firma del encargado del almacén</div>
            <div className="form-group"><label>Firma encargado:</label><input className="form-control" type="text" value={form.firma} readOnly/></div>
            <div className="mt-3 flex gap-2" style={{justifyContent:'center'}}>
              <button className="btn btn-outline" onClick={() => setModal('ok')}>Generar reporte de incidente</button>
              <button className="btn btn-gold" onClick={() => navigate('/documentos/reporte-impreso')}>Imprimir reporte</button>
            </div>
          </div>

          <div>
            <div style={{fontWeight:600,marginBottom:12,fontSize:14}}>Archivos recientes</div>
            <ul className="sidebar-list">{archivos.map(a => <li key={a}>{a}</li>)}</ul>
          </div>
        </div>
      </div>

      <Modal show={modal === 'ok'} message="Reporte de incidente generado con éxito."
        actions={<button className="btn btn-gold" onClick={() => navigate('/documentos')}>✔ Aceptar</button>}/>
    </Layout>
  )
}
