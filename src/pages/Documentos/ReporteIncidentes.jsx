import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'

const archivos = ['INC 2025-0045','INC 2025-0044','INC 2025-0043','INC 2025-0042','INC 2025-0041','INC 2025-0040']

export default function ReporteIncidentes() {
  const navigate = useNavigate()
  
  const [form, setForm] = useState({
    fechaGuia: '', 
    numGuia: '',
    codigoProducto: '', 
    cantidad: '',
    faltante: '',
    descripcion: '',
    creadoPor: 'Juan Pérez', 
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
              ['Fecha de guía:', 'fechaGuia', 'text', 'Ej: 26/10/2025'],
              ['Número de guía:', 'numGuia', 'text', 'Ej: GIA-2025-0123'],
              ['Código de producto:', 'codigoProducto', 'text', 'Ej: 5678 - Ron añejo'],
              ['Cantidad de producto:', 'cantidad', 'number', 'Ej: 5'],
              ['Cantidad de faltante:', 'faltante', 'text', 'Ej: 2 o Cód: 5678 - Ron añejo'],
            ].map(([label, key, type, placeholder]) => (
              <div className="form-group" key={key}>
                <label>{label}</label>
                <input 
                  className="form-control" 
                  type={type} 
                  placeholder={placeholder}
                  value={form[key]} 
                  onChange={set(key)}
                />
              </div>
            ))}
            
            <div className="section-heading">Descripción del problema</div>
            <textarea 
              style={{width:'100%',background:'var(--bg-input)',border:'1px solid #555',borderRadius:6,padding:12,color:'var(--gold-light)',fontFamily:"'Inter',sans-serif",fontSize:13,resize:'vertical',minHeight:80}}
              placeholder="Describa el estado de la mercancía o la incidencia. Ej: Cinco botellas de ron añejo dañadas durante el transporte. Cajas húmedas..."
              value={form.descripcion} 
              onChange={set('descripcion')}
            />
            
            <div className="section-heading">Detalles de autoría</div>
            <div className="form-group">
              <label>Creado por:</label>
              <input className="form-control" type="text" value={form.creadoPor} readOnly/>
            </div>
            
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