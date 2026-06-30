import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'
import { supabase } from '../../lib/supabase.js'

const ordenesPendientes = ['N.° ORDEN DESP-0012', 'N.° ORDEN RBE-1004', 'N.° ORDEN JAM-5032']

export default function NotaDespacho() {
  const navigate = useNavigate()
  const hoy = new Date().toLocaleDateString('es-DO')
  
  const [form, setForm] = useState({
    numNota: '', 
    fechaEmision: hoy, 
    direccion: '',
    descripcion: '',
    codigo: '', 
    numOrden: '',
    cantidad: '', 
    receptor: '', 
    encargado: '',
  })
  const [modal, setModal] = useState(null)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleGenerar = async () => {
    if (!form.codigo || !form.cantidad) {
      alert("Por favor, introduce el código del producto y la cantidad.")
      return
    }

    const { data: productos } = await supabase.from('productos').select('id,stock').eq('codigo_sku', form.codigo)
    if (productos?.length) {
      const prod = productos[0]
      if (prod.stock < parseInt(form.cantidad)) { setModal('insuficiente'); return }
    }
    setModal('ok')
  }

  return (
    <Layout>
      <div className="main-content">
        <div className="two-col">
          <div className="card card-gold">
            <div className="section-heading" style={{marginTop:0}}>Nota de despacho</div>
            
            {[
              ['Num. nota de despacho:', 'numNota', 'text', 'Ej: 408542'],
              ['Fecha de emisión:', 'fechaEmision', 'text', 'Ej: DD/MM/AAAA'],
              ['Dirección de entrega:', 'direccion', 'text', 'Ej: C/ 27 de febrero, Tenares'],
              ['Descripción del producto:', 'descripcion', 'text', 'Ej: Tequila Don Julio 70 6x75 Cl'],
              ['Código del producto:', 'codigo', 'text', 'Ej: BB076689638'],
              ['Num. de orden:', 'numOrden', 'text', 'Ej: 0893799'],
              ['Cantidad despachada:', 'cantidad', 'number', 'Ej: 54'],
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
            
            <div className="section-heading">Datos de entrega:</div>
            
            <div className="form-group">
              <label>Nombre de quien recibe:</label>
              <input 
                className="form-control" 
                type="text" 
                placeholder="Ej: Carlos De Jesús" 
                value={form.receptor} 
                onChange={set('receptor')}
              />
            </div>
            
            <div className="form-group">
              <label>Encargado de despacho:</label>
              <input 
                className="form-control" 
                type="text" 
                placeholder="Ej: Camilo Alonso" 
                value={form.encargado} 
                onChange={set('encargado')}
              />
            </div>
            
            <div className="mt-3 text-center">
              <button className="btn btn-gold" onClick={handleGenerar}>Generar nota de despacho</button>
            </div>
          </div>

          <div>
            <div style={{fontWeight:600,marginBottom:12,fontSize:14}}>1. Órdenes pendientes:</div>
            <ul className="sidebar-list">
              {ordenesPendientes.map(o => <li key={o}>{o} <span className="sidebar-arrow">▶</span></li>)}
            </ul>
          </div>
        </div>
      </div>

      <Modal show={modal === 'ok'} message="Nota de despacho realizada con éxito."
        actions={<button className="btn btn-gold" onClick={() => navigate('/documentos')}>✔ Aceptar</button>}/>
      <Modal show={modal === 'insuficiente'} message="Lo sentimos, no se pudo generar la nota de despacho por falta de stock."
        actions={<button className="btn btn-gold" onClick={() => setModal(null)}>✔ Aceptar</button>}/>
    </Layout>
  )
}