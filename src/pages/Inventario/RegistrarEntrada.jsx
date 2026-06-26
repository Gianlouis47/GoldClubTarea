import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'
import { supabase } from '../../lib/supabase.js'

export default function RegistrarEntrada() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', codigo: '', proveedor: '', cantidad: '', vencimiento: '' })
  const [modal, setModal] = useState(null)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleConfirmar = async () => {
    if (!form.nombre || !form.codigo || !form.cantidad) { setModal('errorCampos'); return }

    const { data: productos } = await supabase.from('productos').select('id,stock').eq('codigo_sku', form.codigo)
    if (!productos?.length) { setModal('errorCampos'); return }
    const prod = productos[0]

    await supabase.from('productos').update({ stock: prod.stock + parseInt(form.cantidad) }).eq('id', prod.id)

    if (form.vencimiento) {
      await supabase.from('lotes').insert({
        producto_id: prod.id,
        codigo_lote: `LOTE-${Date.now()}`,
        fecha_entrada: new Date().toISOString().split('T')[0],
        fecha_vencimiento: form.vencimiento,
        cantidad: parseInt(form.cantidad),
      })
    }

    await supabase.from('movimientos_inventario').insert({
      producto_id: prod.id,
      usuario_id: 1, 
      tipo_movimiento: 'ENTRADA',
      cantidad: parseInt(form.cantidad),
      referencia: form.proveedor,
    })

    setModal('ok')
  }

  return (
    <Layout>
      <div className="main-content">
        <h1 className="page-title">Registrar entrada de producto</h1>

        <div className="card card-gold" style={{maxWidth:680}}>
          <div className="section-heading" style={{marginTop:0}}>Registrar entrada de Producto</div>

          <div className="form-group">
            <label>Nombre del producto:</label>
            <input className="form-control" type="text" placeholder="Ej: Ron Barceló" value={form.nombre} onChange={set('nombre')}/>
          </div>
          <div className="form-group">
            <label>Código del producto:</label>
            <input className="form-control" type="text" placeholder="Ej: 5678-RB" value={form.codigo} onChange={set('codigo')}/>
          </div>
          <div className="form-group">
            <label>Proveedor:</label>
            <input className="form-control" type="text" placeholder="Ej: Distribuidora Norte" value={form.proveedor} onChange={set('proveedor')}/>
          </div>
          <div className="form-group">
            <label>Cantidad:</label>
            <input className="form-control" type="number" placeholder="0" value={form.cantidad} onChange={set('cantidad')}/>
          </div>
          <div className="form-group">
            <label>Fecha de vencimiento:</label>
            <input className="form-control" type="date" value={form.vencimiento} onChange={set('vencimiento')}/>
          </div>

          <div className="mt-3 text-center">
            <button className="btn btn-gold" onClick={handleConfirmar}>Confirmar</button>
          </div>
        </div>
      </div>

      <Modal show={modal === 'ok'} message="Se ha registrado con éxito la entrada del producto."
        actions={<button className="btn btn-gold" onClick={() => navigate('/inventario/asignar-ubicacion')}>✔ Aceptar</button>}/>
      <Modal show={modal === 'errorCampos'} message="Debe completar todos los campos antes de confirmar."
        actions={<button className="btn btn-gold" onClick={() => setModal(null)}>✔ Aceptar</button>}/>
    </Layout>
  )
}
