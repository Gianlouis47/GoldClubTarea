import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'
import { supabase } from '../../lib/supabase.js'

export default function OrdenCompra() {
  const navigate = useNavigate()
  const [proveedores, setProveedores] = useState([])
  const [productos, setProductos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState([])
  const [mostrarLista, setMostrarLista] = useState(false)

  const [items, setItems] = useState([])
  const [proveedorId, setProveedorId] = useState('')
  const [numOrden, setNumOrden] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [modal, setModal] = useState(null)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    const { data: provs } = await supabase.from('proveedores').select('id,nombre_empresa').eq('activo', true)
    if (provs) setProveedores(provs)
    const { data: prods } = await supabase.from('productos').select('id,nombre,codigo_sku,precio_compra,unidad_medida').eq('activo', true)
    if (prods) setProductos(prods)
  }

  const buscarProducto = (texto) => {
    setBusqueda(texto)
    if (texto.trim().length < 1) { setResultados([]); setMostrarLista(false); return }
    const t = texto.toLowerCase()
    const filtrados = productos.filter(p =>
      (p.codigo_sku || '').toLowerCase().includes(t) ||
      (p.nombre || '').toLowerCase().includes(t)
    ).slice(0, 8)
    setResultados(filtrados)
    setMostrarLista(true)
  }

  const agregarItem = (prod) => {
    const existe = items.find(i => i.producto_id === prod.id)
    if (existe) {
      setItems(items.map(i => i.producto_id === prod.id ? { ...i, cantidad: i.cantidad + 1 } : i))
    } else {
      setItems([...items, {
        producto_id: prod.id,
        nombre: prod.nombre,
        codigo_sku: prod.codigo_sku,
        precio_unitario: parseFloat(prod.precio_compra) || 0,
        cantidad: 1
      }])
    }
    setBusqueda('')
    setResultados([])
    setMostrarLista(false)
  }

  const actualizarItem = (id, campo, valor) => {
    setItems(items.map(i => i.producto_id === id ? { ...i, [campo]: valor } : i))
  }

  const removerItem = (id) => setItems(items.filter(i => i.producto_id !== id))

  const total = items.reduce((sum, i) => sum + ((parseFloat(i.precio_unitario) || 0) * (parseInt(i.cantidad) || 0)), 0)

  const handleConfirmar = async () => {
    if (!numOrden.trim()) { setModal('error-orden'); return }
    if (items.length === 0) { setModal('error-items'); return }

    setCargando(true)

    // Verificar que el número de orden no exista
    const { data: existeOrden } = await supabase.from('ordenes_compra').select('id').eq('numero_orden', numOrden)
    if (existeOrden && existeOrden.length > 0) { setModal('error-duplicado'); setCargando(false); return }

    const { data: ordenData, error: ordenError } = await supabase.from('ordenes_compra').insert({
      proveedor_id: proveedorId || null,
      usuario_id: 1,
      numero_orden: numOrden,
      estado: 'pendiente',
      observaciones: observaciones
    }).select()

    if (ordenError || !ordenData) { setModal('error'); setCargando(false); return }
    const ordenId = ordenData[0].id

    const detalles = items.map(i => ({
      orden_compra_id: ordenId,
      producto_id: i.producto_id,
      cantidad: parseInt(i.cantidad),
      precio_unitario: parseFloat(i.precio_unitario) || 0,
      subtotal: (parseFloat(i.precio_unitario) || 0) * (parseInt(i.cantidad) || 0)
    }))

    await supabase.from('detalle_orden_compra').insert(detalles)

    setCargando(false)
    setModal('ok')
  }

  return (
    <Layout>
      <div className="main-content">
        <div className="flex-between mb-2">
          <h1 className="page-title">Orden de compra / Pedir productos</h1>
          <button className="btn btn-outline" onClick={() => navigate('/ventas')}>Volver</button>
        </div>

        <div className="card card-gold mb-2">
          <div className="section-heading" style={{ marginTop: 0 }}>Datos de la orden</div>
          <div className="form-group">
            <label>Nº de orden:</label>
            <input className="form-control" type="text" placeholder="Ej: OC-00001"
              value={numOrden} onChange={e => setNumOrden(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Proveedor:</label>
            <select className="form-control" value={proveedorId} onChange={e => setProveedorId(e.target.value)}>
              <option value="">Sin proveedor</option>
              {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre_empresa}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Observaciones:</label>
            <input className="form-control" type="text" placeholder="Ej: Urgente para fin de mes"
              value={observaciones} onChange={e => setObservaciones(e.target.value)} />
          </div>
        </div>

        {/* Buscador de productos */}
        <div className="card card-gold mb-2" style={{ position: 'relative' }}>
          <div className="section-heading" style={{ marginTop: 0 }}>Agregar productos a la orden</div>
          <div className="search-bar" style={{ maxWidth: '100%' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Buscar por código o nombre de producto..."
              value={busqueda} onChange={e => buscarProducto(e.target.value)}
              onFocus={() => resultados.length > 0 && setMostrarLista(true)} />
          </div>

          {mostrarLista && resultados.length > 0 && (
            <ul className="sidebar-list" style={{ position: 'absolute', zIndex: 50, left: 24, right: 24, marginTop: 4, background: 'var(--bg-card)', borderRadius: 8, padding: 12, border: '1px solid var(--gold)' }}>
              {resultados.map(p => (
                <li key={p.id} onClick={() => agregarItem(p)}>
                  <span><code>{p.codigo_sku}</code> — {p.nombre} (${p.precio_compra})</span>
                  <span className="sidebar-arrow">+ Agregar</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Tabla de items */}
        {items.length > 0 && (
          <div className="card mb-2">
            <div className="section-heading">Detalle de la orden de compra</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #3a3a3a', color: 'var(--text-muted)' }}>
                  <th style={{ padding: 10, textAlign: 'left' }}>Código</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Producto</th>
                  <th style={{ padding: 10, textAlign: 'center' }}>Cant.</th>
                  <th style={{ padding: 10, textAlign: 'right' }}>Precio</th>
                  <th style={{ padding: 10, textAlign: 'right' }}>Subtotal</th>
                  <th style={{ padding: 10, textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((i, idx) => (
                  <tr key={i.producto_id} style={{ borderBottom: idx < items.length - 1 ? '1px solid #3a3a3a' : 'none' }}>
                    <td style={{ padding: 10, color: 'var(--gold)' }}>{i.codigo_sku}</td>
                    <td style={{ padding: 10 }}>{i.nombre}</td>
                    <td style={{ padding: 10, textAlign: 'center' }}>
                      <input type="number" min="1" value={i.cantidad}
                        style={{ width: 60, background: 'var(--bg-input)', border: '1px solid #555', borderRadius: 4, color: 'var(--text)', padding: '4px 8px', textAlign: 'center' }}
                        onChange={e => actualizarItem(i.producto_id, 'cantidad', e.target.value)} />
                    </td>
                    <td style={{ padding: 10, textAlign: 'right' }}>
                      <input type="number" step="0.01" value={i.precio_unitario}
                        style={{ width: 80, background: 'var(--bg-input)', border: '1px solid #555', borderRadius: 4, color: 'var(--text)', padding: '4px 8px', textAlign: 'right' }}
                        onChange={e => actualizarItem(i.producto_id, 'precio_unitario', e.target.value)} />
                    </td>
                    <td style={{ padding: 10, textAlign: 'right', fontWeight: 'bold', color: 'var(--gold)' }}>
                      ${((parseFloat(i.precio_unitario) || 0) * (parseInt(i.cantidad) || 0)).toFixed(2)}
                    </td>
                    <td style={{ padding: 10, textAlign: 'center' }}>
                      <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={() => removerItem(i.producto_id)}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--gold)' }}>
                  <td colSpan="4" style={{ padding: 12, textAlign: 'right', fontWeight: 700, fontSize: 15 }}>TOTAL:</td>
                  <td style={{ padding: 12, textAlign: 'right', fontWeight: 700, fontSize: 18, color: 'var(--gold)' }}>${total.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="text-center mt-3">
          <button className="btn btn-gold" onClick={handleConfirmar} disabled={cargando}>
            {cargando ? 'Procesando...' : 'Generar orden de compra'}
          </button>
        </div>
      </div>

      <Modal show={modal === 'ok'} message="Orden de compra generada con éxito."
        actions={<button className="btn btn-gold" onClick={() => navigate('/ventas')}>✔ Aceptar</button>}/>
      <Modal show={modal === 'error-orden'} message="Debe ingresar un número de orden."
        actions={<button className="btn btn-gold" onClick={() => setModal(null)}>✔ Aceptar</button>}/>
      <Modal show={modal === 'error-items'} message="Debe agregar al menos un producto a la orden."
        actions={<button className="btn btn-gold" onClick={() => setModal(null)}>✔ Aceptar</button>}/>
      <Modal show={modal === 'error-duplicado'} message="Ya existe una orden de compra con ese número. Use un número diferente."
        actions={<button className="btn btn-gold" onClick={() => setModal(null)}>✔ Aceptar</button>}/>
      <Modal show={modal === 'error'} message="Ocurrió un error al generar la orden. Intente nuevamente."
        actions={<button className="btn btn-gold" onClick={() => setModal(null)}>✔ Aceptar</button>}/>
    </Layout>
  )
}
