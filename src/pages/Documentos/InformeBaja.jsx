import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'
import { supabase } from '../../lib/supabase.js'

export default function InformeBaja() {
  const navigate = useNavigate()
  const hoy = new Date().toLocaleDateString('es-DO')
  const [form, setForm] = useState({ codigo: '14839987325', motivo: 'Producto vencido', cantidad: '10', fecha: hoy })
  const [modal, setModal] = useState(null)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleGenerar = async () => {
    const { data: productos } = await supabase.from('productos').select('id,stock').eq('codigo_sku', form.codigo)
    if (productos?.length) {
      const prod = productos[0]
      const cant = parseInt(form.cantidad)
      if (prod.stock >= cant) {
        await supabase.from('productos').update({ stock: prod.stock - cant }).eq('id', prod.id)
        await supabase.from('movimientos_inventario').insert({
          producto_id: prod.id, usuario_id: 1,
          tipo_movimiento: 'BAJA', cantidad: cant, observaciones: form.motivo,
        })
      }
    }
    setModal('ok')
  }

  return (
    <Layout>
      <div className="main-content">
        <div className="card card-gold" style={{maxWidth:680}}>
          <div className="section-heading" style={{marginTop:0}}>Informe de baja</div>
          <div className="form-group"><label>Código del producto:</label><input className="form-control" type="text" value={form.codigo} onChange={set('codigo')}/></div>
          <div className="form-group"><label>Motivo de baja:</label><input className="form-control" type="text" value={form.motivo} onChange={set('motivo')}/></div>
          <div className="form-group"><label>Cantidad de producto:</label><input className="form-control" type="number" value={form.cantidad} onChange={set('cantidad')}/></div>
          <div className="form-group"><label>Fecha:</label><input className="form-control" type="text" value={form.fecha} onChange={set('fecha')}/></div>
          <div className="section-heading">Firma del encargado del almacén</div>
          <div className="form-group"><label>Firma encargado:</label><input className="form-control" type="text" value="Usuario: Joselito Pérez - Firma electrónica" readOnly/></div>
          <div className="mt-3 text-center">
            <button className="btn btn-gold" onClick={handleGenerar}>Generar informe de baja</button>
          </div>
        </div>
      </div>
      <Modal show={modal === 'ok'} message="Informe de baja generado con éxito."
        actions={<button className="btn btn-gold" onClick={() => navigate('/documentos')}>✔ Aceptar</button>}/>
    </Layout>
  )
}
