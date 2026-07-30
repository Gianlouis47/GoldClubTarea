import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'
import { supabase } from '../../lib/supabase.js'
import { mensajeError } from '../../lib/errores.js'

export default function HistorialVentas() {
  const navigate = useNavigate()
  const [ventas, setVentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal] = useState(null)
  const [ventaSel, setVentaSel] = useState(null)
  const [detalle, setDetalle] = useState([])
  const [errorCarga, setErrorCarga] = useState(null)

  useEffect(() => {
    cargarVentas()
  }, [])

  const cargarVentas = async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from('ventas')
      .select('id, cliente_nombre, cliente_direccion, total, fecha, estado')
      .order('id', { ascending: false })
    // Antes el error se ignoraba y la tabla se quedaba vacia sin explicar nada.
    if (error) setErrorCarga(mensajeError(error, 'cargar el historial de ventas'))
    else { setErrorCarga(null); setVentas(data || []) }
    setCargando(false)
  }

  const verDetalle = async (venta) => {
    setVentaSel(venta)
    setDetalle([])
    const { data, error } = await supabase
      .from('detalle_ventas')
      .select('cantidad, precio_unitario, subtotal, productos(nombre, codigo_sku)')
      .eq('venta_id', venta.id)
    if (error) { setErrorCarga(mensajeError(error, 'cargar el detalle de la venta')); return }
    setDetalle(data || [])
  }

  const filtradas = ventas.filter(v => {
    const t = busqueda.toLowerCase()
    return (v.cliente_nombre || '').toLowerCase().includes(t) ||
           (v.cliente_direccion || '').toLowerCase().includes(t) ||
           (v.id?.toString() || '').includes(t)
  })

  return (
    <Layout>
      <div className="main-content">
        <div className="flex-between mb-2">
          <h1 className="page-title">Historial de ventas</h1>
          <button className="btn btn-outline" onClick={() => navigate('/ventas')}>Volver</button>
        </div>

        <div className="search-bar mb-2" style={{ maxWidth: '100%' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder="Buscar por cliente, dirección o Nº venta..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>

        <div className="card card-gold">
          {cargando ? (
            <div className="text-muted text-center py-4">Cargando ventas...</div>
          ) : errorCarga ? (
            <div className="text-center py-4" style={{ color: 'var(--danger)' }}>{errorCarga}</div>
          ) : filtradas.length === 0 ? (
            <div className="text-muted text-center py-4">
              {busqueda
                ? `Ninguna venta coincide con "${busqueda}".`
                : 'Todavía no hay ventas registradas.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #3a3a3a', color: 'var(--text-muted)' }}>
                  <th style={{ padding: 10, textAlign: 'left' }}>Nº</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Cliente</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Dirección</th>
                  <th style={{ padding: 10, textAlign: 'right' }}>Total</th>
                  <th style={{ padding: 10, textAlign: 'center' }}>Fecha</th>
                  <th style={{ padding: 10, textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((v, idx) => (
                  <tr key={v.id} style={{ borderBottom: idx < filtradas.length - 1 ? '1px solid #3a3a3a' : 'none' }}>
                    <td style={{ padding: 10, color: 'var(--gold)' }}>#{v.id}</td>
                    <td style={{ padding: 10 }}>{v.cliente_nombre}</td>
                    <td style={{ padding: 10 }}><small className="text-muted">{v.cliente_direccion || '—'}</small></td>
                    <td style={{ padding: 10, textAlign: 'right', fontWeight: 'bold', color: 'var(--gold)' }}>${(v.total || 0).toFixed(2)}</td>
                    <td style={{ padding: 10, textAlign: 'center' }}>{new Date(v.fecha).toLocaleDateString('es-DO')}</td>
                    <td style={{ padding: 10, textAlign: 'center' }}>
                      <button className="btn btn-gold" style={{ padding: '4px 14px', fontSize: 12 }}
                        onClick={() => verDetalle(v)}>Ver detalle</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de detalle */}
      {ventaSel && (
        <div className="modal-overlay show" onClick={() => setVentaSel(null)}>
          <div className="modal-box" style={{ width: 520, textAlign: 'left' }} onClick={e => e.stopPropagation()}>
            <div className="modal-brand">Venta <span style={{ color: 'var(--gold)' }}>#{ventaSel.id}</span></div>
            <div className="text-muted mb-2" style={{ fontSize: 13 }}>
              <strong>Cliente:</strong> {ventaSel.cliente_nombre}<br/>
              <strong>Dirección:</strong> {ventaSel.cliente_direccion || '—'}<br/>
              <strong>Fecha:</strong> {new Date(ventaSel.fecha).toLocaleString('es-DO')}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #3a3a3a', color: 'var(--text-muted)' }}>
                  <th style={{ padding: 6, textAlign: 'left' }}>Producto</th>
                  <th style={{ padding: 6, textAlign: 'center' }}>Cant.</th>
                  <th style={{ padding: 6, textAlign: 'right' }}>Precio</th>
                  <th style={{ padding: 6, textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {detalle.map((d, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #3a3a3a' }}>
                    <td style={{ padding: 6 }}>{d.productos?.nombre || '—'}</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>{d.cantidad}</td>
                    <td style={{ padding: 6, textAlign: 'right' }}>${(d.precio_unitario || 0).toFixed(2)}</td>
                    <td style={{ padding: 6, textAlign: 'right' }}>${(d.subtotal || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--gold)' }}>
                  <td colSpan="3" style={{ padding: 10, textAlign: 'right', fontWeight: 700 }}>TOTAL:</td>
                  <td style={{ padding: 10, textAlign: 'right', fontWeight: 700, color: 'var(--gold)' }}>${(ventaSel.total || 0).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setVentaSel(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
