import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'
import { supabase } from '../../lib/supabase.js'

export default function Recepcion() {
  const navigate = useNavigate()
  const [ordenes, setOrdenes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(null)
  const [ordenSel, setOrdenSel] = useState(null)
  const [detalle, setDetalle] = useState([])

  useEffect(() => {
    cargarOrdenes()
  }, [])

  const cargarOrdenes = async () => {
    setCargando(true)
    const { data } = await supabase
      .from('ordenes_compra')
      .select('id, numero_orden, estado, observaciones, creado_en, proveedores(nombre_empresa)')
      .order('id', { ascending: false })
    if (data) setOrdenes(data)
    setCargando(false)
  }

  const verDetalle = async (orden) => {
    setOrdenSel(orden)
    const { data } = await supabase
      .from('detalle_orden_compra')
      .select('cantidad, precio_unitario, subtotal, productos(nombre, codigo_sku)')
      .eq('orden_compra_id', orden.id)
    if (data) setDetalle(data)
  }

  const handleRecibir = async () => {
    if (!ordenSel) return

    // Por cada producto del detalle, sumar al stock
    for (const d of detalle) {
      const { data: prod } = await supabase.from('productos').select('id,stock').eq('codigo_sku', d.productos?.codigo_sku).single()
      if (prod) {
        await supabase.from('productos').update({ stock: prod.stock + d.cantidad }).eq('id', prod.id)
        await supabase.from('movimientos_inventario').insert({
          producto_id: prod.id,
          usuario_id: 1,
          tipo_movimiento: 'ENTRADA',
          cantidad: d.cantidad,
          referencia: `Recepción OC ${ordenSel.numero_orden}`
        })
      }
    }

    // Marcar orden como recibida
    await supabase.from('ordenes_compra').update({ estado: 'recibida' }).eq('id', ordenSel.id)

    setModal('ok')
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
                <div className="modal-actions">
                  <button className="btn btn-gold" onClick={handleRecibir}>Recibir y sumar al stock</button>
                  <button className="btn btn-outline" onClick={() => setOrdenSel(null)}>Cancelar</button>
                </div>
              </div>
            </div>
          </>
        )}

        <Modal show={modal === 'ok'} message="Productos recibidos correctamente. Stock actualizado."
          actions={<button className="btn btn-gold" onClick={() => { setModal(null); setOrdenSel(null); cargarOrdenes() }}>✔ Aceptar</button>}/>
      </div>
    </Layout>
  )
}
