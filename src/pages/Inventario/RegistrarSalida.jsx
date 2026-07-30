import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'
import { supabase } from '../../lib/supabase.js'
import { mensajeError } from '../../lib/errores.js'
import { usuarioIdValido, MENSAJE_SIN_USUARIO } from '../../lib/sesion.js'

export default function RegistrarSalida() {
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ codigo: '', cantidad: '', motivo: '', fecha: today })
  const [modal, setModal] = useState(null)
  const [aviso, setAviso] = useState(null)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleConfirmar = async () => {
    // Antes los tres fallos posibles mostraban el MISMO mensaje generico, asi
    // que no se sabia si el problema era el codigo, la cantidad o el stock.
    if (!form.codigo || !form.cantidad || !form.motivo) {
      setAviso('Completa el código del producto, la cantidad y el motivo de salida.')
      return
    }

    const cant = parseInt(form.cantidad)
    if (!Number.isFinite(cant) || cant < 1) {
      setAviso('La cantidad a retirar debe ser un número entero de 1 o más.')
      return
    }

    const { data: productos, error: errProd } = await supabase
      .from('productos').select('id,stock,nombre').eq('codigo_sku', form.codigo)
    if (errProd) { setAviso(mensajeError(errProd, 'buscar el producto')); return }
    if (!productos?.length) {
      setAviso(`El código ${form.codigo} no existe en el inventario.`)
      return
    }

    const prod = productos[0]
    if (prod.stock < cant) {
      setAviso(`Stock insuficiente: ${prod.nombre} tiene ${prod.stock} uds. y quieres retirar ${cant}.`)
      return
    }

    // movimientos_inventario.usuario_id es NOT NULL con FK a usuarios(id).
    const usuarioId = await usuarioIdValido()
    if (usuarioId == null) { setAviso(MENSAJE_SIN_USUARIO); return }

    const { error: errStock } = await supabase
      .from('productos').update({ stock: prod.stock - cant }).eq('id', prod.id)
    if (errStock) { setAviso(mensajeError(errStock, 'descontar el stock')); return }

    const { error: errMov } = await supabase.from('movimientos_inventario').insert({
      producto_id: prod.id,
      usuario_id: usuarioId,
      tipo_movimiento: 'SALIDA',
      cantidad: cant,
      observaciones: form.motivo,
    })
    if (errMov) {
      setAviso(mensajeError(errMov, 'registrar el movimiento') + ' El stock sí se descontó.')
      return
    }

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
      <Modal show={!!aviso} message={aviso}
        actions={<button className="btn btn-gold" onClick={() => setAviso(null)}>✔ Entendido</button>}/>
    </Layout>
  )
}
