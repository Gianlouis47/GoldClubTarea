import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'
import { supabase } from '../../lib/supabase.js'
import { mensajeError } from '../../lib/errores.js'
import { usuarioIdValido, MENSAJE_SIN_USUARIO } from '../../lib/sesion.js'

export default function RegistrarEntrada() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', codigo: '', proveedor: '', cantidad: '', vencimiento: '' })
  const [modal, setModal] = useState(null)
  const [aviso, setAviso] = useState(null)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleConfirmar = async () => {
    if (!form.nombre || !form.codigo || !form.cantidad) { setModal('errorCampos'); return }

    const cant = parseInt(form.cantidad)
    if (!Number.isFinite(cant) || cant < 1) {
      setAviso('La cantidad debe ser un numero entero de 1 o mas.')
      return
    }

    const { data: productos, error: errProd } = await supabase
      .from('productos').select('id,stock').eq('codigo_sku', form.codigo)
    if (errProd) { setAviso(mensajeError(errProd, 'buscar el producto')); return }
    if (!productos?.length) {
      setAviso(`El codigo ${form.codigo} no existe en el inventario.`)
      return
    }
    const prod = productos[0]

    // movimientos_inventario.usuario_id es NOT NULL con FK a usuarios(id).
    // Antes estaba fijo en 1 y el movimiento fallaba en silencio.
    const usuarioId = await usuarioIdValido()
    if (usuarioId == null) { setAviso(MENSAJE_SIN_USUARIO); return }

    const { error: errStock } = await supabase
      .from('productos').update({ stock: prod.stock + cant }).eq('id', prod.id)
    if (errStock) { setAviso(mensajeError(errStock, 'sumar el stock')); return }

    if (form.vencimiento) {
      await supabase.from('lotes').insert({
        producto_id: prod.id,
        codigo_lote: `LOTE-${Date.now()}`,
        fecha_entrada: new Date().toISOString().split('T')[0],
        fecha_vencimiento: form.vencimiento,
        cantidad: cant,
      })
    }

    const { error: errMov } = await supabase.from('movimientos_inventario').insert({
      producto_id: prod.id,
      usuario_id: usuarioId,
      tipo_movimiento: 'ENTRADA',
      cantidad: cant,
      referencia: form.proveedor || null,
    })
    if (errMov) {
      setAviso(mensajeError(errMov, 'registrar el movimiento de inventario') +
        ' El stock si se sumo correctamente.')
      return
    }

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
      <Modal show={modal === 'errorCampos'} message="Debe completar el nombre, el código y la cantidad antes de confirmar."
        actions={<button className="btn btn-gold" onClick={() => setModal(null)}>✔ Aceptar</button>}/>
      <Modal show={!!aviso} message={aviso}
        actions={<button className="btn btn-gold" onClick={() => setAviso(null)}>✔ Entendido</button>}/>
    </Layout>
  )
}
