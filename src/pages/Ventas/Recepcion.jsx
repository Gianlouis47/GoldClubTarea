import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'
import { supabase, supabaseConfigurado, MENSAJE_SIN_CONFIGURAR } from '../../lib/supabase.js'
import { mensajeError } from '../../lib/errores.js'
import { usuarioIdValido, MENSAJE_SIN_USUARIO } from '../../lib/sesion.js'

export default function Recepcion() {
  const navigate = useNavigate()
  const [ordenes, setOrdenes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [recibiendo, setRecibiendo] = useState(false)
  const [ordenSel, setOrdenSel] = useState(null)
  const [detalle, setDetalle] = useState([])

  useEffect(() => {
    cargarOrdenes()
  }, [])

  const cargarOrdenes = async () => {
    if (!supabaseConfigurado) { setAviso(MENSAJE_SIN_CONFIGURAR); setCargando(false); return }
    setCargando(true)
    const { data, error } = await supabase
      .from('ordenes_compra')
      .select('id, numero_orden, estado, observaciones, creado_en, proveedores(nombre_empresa)')
      .order('id', { ascending: false })
    if (error) setAviso(mensajeError(error, 'cargar las ordenes de compra'))
    else setOrdenes(data || [])
    setCargando(false)
  }

  const verDetalle = async (orden) => {
    setOrdenSel(orden)
    setDetalle([])
    const { data, error } = await supabase
      .from('detalle_orden_compra')
      .select('cantidad, precio_unitario, subtotal, productos(nombre, codigo_sku)')
      .eq('orden_compra_id', orden.id)
    if (error) { setAviso(mensajeError(error, 'cargar el detalle de la orden')); return }
    setDetalle(data || [])
  }

  const handleRecibir = async () => {
    if (!ordenSel) return

    // Una orden sin productos se podia "recibir" sin sumar nada al stock y
    // quedaba marcada como recibida.
    if (detalle.length === 0) {
      setAviso(`La orden ${ordenSel.numero_orden} no tiene productos registrados, no hay nada que recibir.`)
      return
    }
    // Evitar recibir dos veces la misma orden (duplicaba el stock).
    if (ordenSel.estado === 'recibida') {
      setAviso(`La orden ${ordenSel.numero_orden} ya fue recibida.`)
      return
    }

    const usuarioId = await usuarioIdValido()
    if (usuarioId == null) { setAviso(MENSAJE_SIN_USUARIO); return }

    setRecibiendo(true)
    const fallos = []
    let recibidos = 0

    for (const d of detalle) {
      const sku = d.productos?.codigo_sku
      if (!sku) { fallos.push('una linea sin producto asociado'); continue }

      // Antes se usaba .single(), que devuelve error si el producto no existe;
      // ese error se ignoraba y la linea se perdia en silencio.
      const { data: prod, error: errProd } = await supabase
        .from('productos').select('id,stock').eq('codigo_sku', sku).maybeSingle()

      if (errProd) { fallos.push(`${sku} (${errProd.message})`); continue }
      if (!prod) { fallos.push(`${sku} (ya no existe en inventario)`); continue }

      const { error: errStock } = await supabase
        .from('productos').update({ stock: prod.stock + d.cantidad }).eq('id', prod.id)
      if (errStock) { fallos.push(`${sku} (no se pudo sumar el stock)`); continue }

      const { error: errMov } = await supabase.from('movimientos_inventario').insert({
        producto_id: prod.id,
        usuario_id: usuarioId,
        tipo_movimiento: 'ENTRADA',
        cantidad: d.cantidad,
        referencia: `Recepcion OC ${ordenSel.numero_orden}`
      })
      if (errMov) console.warn('[Gold Club] No se registro el movimiento de inventario:', errMov)

      recibidos++
    }

    if (recibidos === 0) {
      setRecibiendo(false)
      setAviso(`No se pudo recibir ningun producto de la orden ${ordenSel.numero_orden}. Detalle: ${fallos.join('; ')}.`)
      return
    }

    // La orden solo se marca como recibida si TODO entro; si algo fallo se deja
    // pendiente para poder corregirlo y reintentar.
    if (fallos.length === 0) {
      const { error: errEstado } = await supabase
        .from('ordenes_compra').update({ estado: 'recibida' }).eq('id', ordenSel.id)
      if (errEstado) {
        setRecibiendo(false)
        setAviso(mensajeError(errEstado, 'marcar la orden como recibida') +
          ' El stock si se actualizo; cambia el estado manualmente para no recibirla dos veces.')
        return
      }
      setRecibiendo(false)
      setModal('ok')
    } else {
      setRecibiendo(false)
      setAviso(
        `Se recibieron ${recibidos} de ${detalle.length} productos. La orden queda PENDIENTE. ` +
        `No se pudo procesar: ${fallos.join('; ')}.`
      )
      setOrdenSel(null)
      cargarOrdenes()
    }
  }

  const pendientes = ordenes.filter(o => o.estado === 'pendiente')
  const recibidas = ordenes.filter(o => o.estado === 'recibida')

  return (
    <Layout>
      <div className="main-content">
        <div className="flex-between mb-2">
          <h1 className="page-title">Recepción de productos</h1>
          <button className="btn btn-outline" onClick={() => navigate('/ventas')}>Volver</button>
        </div>

        <div className="card card-gold mb-2">
          <div className="section-heading mb-2">Órdenes pendientes de recepción</div>
          {cargando ? (
            <div className="text-muted text-center py-4">Cargando órdenes...</div>
          ) : pendientes.length === 0 ? (
            <div className="text-muted text-center py-4">No hay órdenes pendientes de recepción.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #3a3a3a', color: 'var(--text-muted)' }}>
                  <th style={{ padding: 10, textAlign: 'left' }}>Nº Orden</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Proveedor</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Fecha</th>
                  <th style={{ padding: 10, textAlign: 'center' }}>Estado</th>
                  <th style={{ padding: 10, textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {pendientes.map((o, idx) => (
                  <tr key={o.id} style={{ borderBottom: idx < pendientes.length - 1 ? '1px solid #3a3a3a' : 'none' }}>
                    <td style={{ padding: 10, color: 'var(--gold)' }}>{o.numero_orden}</td>
                    <td style={{ padding: 10 }}>{o.proveedores?.nombre_empresa || 'Sin proveedor'}</td>
                    <td style={{ padding: 10 }}>{new Date(o.creado_en).toLocaleDateString('es-DO')}</td>
                    <td style={{ padding: 10, textAlign: 'center' }}>
                      <span style={{ background: 'rgba(212,160,23,0.2)', color: 'var(--gold)', padding: '2px 10px', borderRadius: 12 }}>{o.estado}</span>
                    </td>
                    <td style={{ padding: 10, textAlign: 'center' }}>
                      <button className="btn btn-gold" style={{ padding: '4px 14px', fontSize: 12 }}
                        onClick={() => verDetalle(o)}>Ver</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal de detalle de orden */}
        {ordenSel && (
          <>
            <div className="modal-overlay show" onClick={() => setOrdenSel(null)}>
              <div className="modal-box" style={{ width: 500, textAlign: 'left' }} onClick={e => e.stopPropagation()}>
                <div className="modal-brand">
                  Orden: <span style={{ color: 'var(--gold)' }}>{ordenSel.numero_orden}</span>
                </div>
                <div className="text-muted mb-2" style={{ fontSize: 13 }}>
                  Proveedor: {ordenSel.proveedores?.nombre_empresa || 'Sin proveedor'}
                </div>
                {ordenSel.observaciones && (
                  <div className="text-muted mb-2" style={{ fontSize: 13 }}>Obs: {ordenSel.observaciones}</div>
                )}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #3a3a3a', color: 'var(--text-muted)' }}>
                      <th style={{ padding: 6, textAlign: 'left' }}>Producto</th>
                      <th style={{ padding: 6, textAlign: 'center' }}>Cant.</th>
                      <th style={{ padding: 6, textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalle.map((d, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #3a3a3a' }}>
                        <td style={{ padding: 6 }}>{d.productos?.nombre || '—'}</td>
                        <td style={{ padding: 6, textAlign: 'center' }}>{d.cantidad}</td>
                        <td style={{ padding: 6, textAlign: 'right' }}>${(d.subtotal || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {detalle.length === 0 && (
                  <div className="text-muted mb-2" style={{ fontSize: 13 }}>
                    Esta orden no tiene productos registrados.
                  </div>
                )}
                <div className="modal-actions">
                  <button className="btn btn-gold" onClick={handleRecibir} disabled={recibiendo || detalle.length === 0}>
                    {recibiendo ? 'Recibiendo...' : 'Recibir y sumar al stock'}
                  </button>
                  <button className="btn btn-outline" onClick={() => setOrdenSel(null)}>Cancelar</button>
                </div>
              </div>
            </div>
          </>
        )}

        <Modal show={modal === 'ok'} message="Productos recibidos correctamente. Stock actualizado."
          actions={<button className="btn btn-gold" onClick={() => { setModal(null); setOrdenSel(null); cargarOrdenes() }}>&#10004; Aceptar</button>}/>
        <Modal show={!!aviso} message={aviso}
          actions={<button className="btn btn-gold" onClick={() => setAviso(null)}>&#10004; Entendido</button>}/>
      </div>
    </Layout>
  )
}
