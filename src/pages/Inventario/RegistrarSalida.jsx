import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'
import { supabase } from '../../lib/supabase.js'

export default function RegistrarSalida() {
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ codigo: '', cantidad: '', motivo: '', fecha: today })
  const [modal, setModal] = useState(null)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleConfirmar = async () => {
    if (!form.codigo || !form.cantidad || !form.motivo) { setModal('error'); return }

    const { data: productos } = await supabase.from('productos').select('id,stock').eq('codigo_sku', form.codigo)
    if (!productos?.length) { setModal('error'); return }
    const prod = productos[0]
    const cant = parseInt(form.cantidad)
    if (prod.stock < cant) { setModal('error'); return }

    await supabase.from('productos').update({ stock: prod.stock - cant }).eq('id', prod.id)
    await supabase.from('movimientos_inventario').insert({
      producto_id: prod.id,
      usuario_id: 1,
      tipo_movimiento: 'SALIDA',
      cantidad: cant,
      observaciones: form.motivo,
    })
    setModal('ok')
  }

  return (
    <Layout>
      <div className="main-content">
        <h1 className="page-title">Registrar salida de producto</h1>
        <div className="card card-gold" style={{maxWidth:680}}>
          <div className="form-group"><label>Código del producto:</label><input className="form-control" type="text" placeholder="Ej: 5678-RB" value={form.codigo} onChange={set('codigo')}/></div>
          <div className="form-group"><label>Cantidad a retirar:</label><input className="form-control" type="number" placeholder="0" value={form.cantidad} onChange={set('cantidad')}/></div>
          <div className="form-group"><label>Motivo de salida:</label><input className="form-control" type="text" placeholder="Ej: Venta, caducidad..." value={form.motivo} onChange={set('motivo')}/></div>
          <div className="form-group"><label>Fecha:</label><input className="form-control" type="date" value={form.fecha} onChange={set('fecha')}/></div>
          <div className="mt-3 text-center">
            <button className="btn btn-gold" onClick={handleConfirmar}>Confirmar salida</button>
          </div>
        </div>
      </div>
      <Modal show={modal === 'ok'} message="Salida registrada con éxito."
        actions={<button className="btn btn-gold" onClick={() => navigate('/dashboard')}>✔ Aceptar</button>}/>
      <Modal show={modal === 'error'} message="Error al registrar la salida. Verifique el código y la cantidad disponible."
        actions={<button className="btn btn-gold" onClick={() => setModal(null)}>✔ Aceptar</button>}/>
    </Layout>
  )
}
