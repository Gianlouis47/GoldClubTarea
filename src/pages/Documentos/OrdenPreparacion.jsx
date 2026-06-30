import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'

export default function OrdenPreparacion() {
  const navigate = useNavigate()
  
  const [form, setForm] = useState({ 
    numOrden: '', 
    codigo: '', 
    cantidad: '', 
    destino: '', 
    creadoPor: 'Juan Pérez' 
  })
  const [modal, setModal] = useState(null)
  
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <Layout>
      <div className="main-content">
        <div className="card card-gold" style={{maxWidth:680}}>
          <div className="section-heading" style={{marginTop:0}}>Orden de preparación</div>
          
          <div className="form-group">
            <label>Número de orden:</label>
            <input 
              className="form-control" 
              type="text" 
              placeholder="Ej: 24" 
              value={form.numOrden} 
              onChange={set('numOrden')}
            />
          </div>
          
          <div className="form-group">
            <label>Código del producto:</label>
            <input 
              className="form-control" 
              type="text" 
              placeholder="Ej: 283940003" 
              value={form.codigo} 
              onChange={set('codigo')}
            />
          </div>
          
          <div className="form-group">
            <label>Cantidad a despachar:</label>
            <input 
              className="form-control" 
              type="number" 
              placeholder="Ej: 8" 
              value={form.cantidad} 
              onChange={set('cantidad')}
            />
          </div>
          
          <div className="form-group">
            <label>Destino del pedido:</label>
            <input 
              className="form-control" 
              type="text" 
              placeholder="Ej: C/ 27 de febrero, Tenares, centro del pueblo" 
              value={form.destino} 
              onChange={set('destino')}
            />
          </div>
          
          <div className="section-heading">Detalles de autoría</div>
          
          <div className="form-group">
            <label>Creado por:</label>
            <input 
              className="form-control" 
              type="text" 
              value={form.creadoPor} 
              readOnly
            />
          </div>
          
          <div className="mt-3 text-center">
            <button className="btn btn-gold" onClick={() => setModal('ok')}>Generar orden de preparación</button>
          </div>
        </div>
      </div>
      
      <Modal show={modal === 'ok'} message="Orden de preparación generada con éxito."
        actions={<button className="btn btn-gold" onClick={() => navigate('/documentos')}>✔ Aceptar</button>}/>
    </Layout>
  )
}