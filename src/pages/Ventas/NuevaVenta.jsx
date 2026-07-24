import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'
import { supabase } from '../../lib/supabase.js'

export default function NuevaVenta() {
  const navigate = useNavigate()
  const [productos, setProductos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState([])
  const [mostrarLista, setMostrarLista] = useState(false)

  const [items, setItems] = useState([])
  const [cliente, setCliente] = useState({ nombre: '', direccion: '' })
  const [numFactura, setNumFactura] = useState('')
  const [modal, setModal] = useState(null)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    cargarProductos()
  }, [])

  const cargarProductos = async () => {
    const { data } = await supabase.from('productos').select('id,nombre,codigo_sku,precio_venta,stock,unidad_medida').eq('activo', true)
    if (data) setProductos(data)
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
        precio_unitario: parseFloat(prod.precio_venta) || 0,
        cantidad: 1,
        stock: prod.stock
      }])
    }
    setBusqueda('')
    setResultados([])
    setMostrarLista(false)
  }

  const actualizarItem = (id, campo, valor) => {
    setItems(items.map(i => {
      if (i.producto_id !== id) return i
      const nuevo = { ...i, [campo]: valor }
      nuevo.subtotal = (parseFloat(nuevo.precio_unitario) || 0) * (parseInt(nuevo.cantidad) || 0)
      return nuevo
    }))
  }

  const removerItem = (id) => {
    setItems(items.filter(i => i.producto_id !== id))
  }

  const total = items.reduce((sum, i) => sum + ((parseFloat(i.precio_unitario) || 0) * (parseInt(i.cantidad) || 0)), 0)

  const handleConfirmar = async () => {
    if (!cliente.nombre.trim()) { setModal('error-cliente'); return }
    if (items.length === 0) { setModal('error-items'); return }

    setCargando(true)

    // Validar stock
    for (const item of items) {
      if (item.stock < item.cantidad) { setModal('error-stock'); setCargando(false); return }
    }

    // Generar número de factura si no existe
    const facturaNum = numFactura.trim() || `FAC-${Date.now()}`

    // 1. Crear la venta
    const { data: ventaData, error: ventaError } = await supabase.from('ventas').insert({
      usuario_id: 1,
      cliente_nombre: cliente.nombre,
      cliente_direccion: cliente.direccion,
      total: total,
      estado: 'activa'
    }).select()

    if (ventaError) { setModal('error'); setCargando(false); return }
    const ventaId = ventaData[0].id

    // 2. Crear los detalles de venta
    const detalles = items.map(i => ({
      venta_id: ventaId,
      producto_id: i.producto_id,
      cantidad: parseInt(i.cantidad),
      precio_unitario: parseFloat(i.precio_unitario) || 0,
      subtotal: (parseFloat(i.precio_unitario) || 0) * (parseInt(i.cantidad) || 0)
    }))

    await supabase.from('detalle_ventas').insert(detalles)

    // 3. Crear factura
    const { error: facError } = await supabase.from('facturas').insert({
      venta_id: ventaId,
      numero_factura: facturaNum,
      cliente_nombre: cliente.nombre,
      cliente_direccion: cliente.direccion,
      total: total,
      estado: 'activa'
    })

    // 4. Crear detalles de factura
    await supabase.from('detalle_facturas').insert(detalles.map(d => ({
      factura_id: null, // se actualiza después si es necesario
      producto_id: d.producto_id,
      cantidad: d.cantidad,
      precio_unitario: d.precio_unitario,
      subtotal: d.subtotal
    })))

    // 5. Descontar stock de productos
    for (const item of items) {
      const prod = productos.find(p => p.id === item.producto_id)
      if (prod) {
        await supabase.from('productos').update({ stock: prod.stock - parseInt(item.cantidad) }).eq('id', item.producto_id)
      }
      // Registrar movimiento
      await supabase.from('movimientos_inventario').insert({
        producto_id: item.producto_id,
        usuario_id: 1,
        tipo_movimiento: 'SALIDA',
        cantidad: parseInt(item.cantidad),
        referencia: `Venta ${facturaNum}`
      })
    }

    setCargando(false)
    setModal('ok')
  }

  return (
    <Layout>
      <div className="main-content">
        <div className="flex-between mb-2">
          <h1 className="page-title">Nueva venta / Facturación</h1>
          <button className="btn btn-outline" onClick={() => navigate('/ventas')}>Volver</button>
        </div>

        {/* Datos del cliente */}
        <div className="card card-gold mb-2">
          <div className="section-heading" style={{ marginTop: 0 }}>Datos del cliente</div>
          <div className="form-group">
            <label>Nombre del cliente:</label>
            <input className="form-control" type="text" placeholder="Ej: Carlos De Jesús"
              value={cliente.nombre} onChange={e => setCliente({ ...cliente, nombre: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Dirección del cliente:</label>
            <input className="form-control" type="text" placeholder="Ej: C/ 27 de febrero, Tenares"
              value={cliente.direccion} onChange={e => setCliente({ ...cliente, direccion: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Nº de factura:</label>
            <input className="form-control" type="text" placeholder="Ej: FAC-00001 (se genera automático si se deja vacío)"
              value={numFactura} onChange={e => setNumFactura(e.target.value)} />
          </div>
        </div>

        {/* Buscador de productos */}
        <div className="card card-gold mb-2" style={{ position: 'relative' }}>
          <div className="section-heading" style={{ marginTop: 0 }}>Agregar productos</div>
          <div className="search-bar" style={{ maxWidth: '100%' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Buscar por código o nombre de producto..."
              value={busqueda} onChange={e => buscarProducto(e.target.value)}
              onFocus={() => resultados.length > 0 && setMostrarLista(true)}
            />
          </div>

          {mostrarLista && resultados.length > 0 && (
            <ul className="sidebar-list" style={{ position: 'absolute', zIndex: 50, left: 24, right: 24, marginTop: 4, background: 'var(--bg-card)', borderRadius: 8, padding: 12, border: '1px solid var(--gold)' }}>
              {resultados.map(p => (
                <li key={p.id} onClick={() => agregarItem(p)}>
                  <span><code>{p.codigo_sku}</code> — {p.nombre} (${p.precio_venta}) <small className="text-muted">Stock: {p.stock}</small></span>
                  <span className="sidebar-arrow">+ Agregar</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Tabla de items */}
        {items.length > 0 && (
          <div className="card mb-2">
            <div className="section-heading">Detalle de la factura</div>
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
            {cargando ? 'Procesando...' : 'Confirmar venta y generar factura'}
          </button>
        </div>
      </div>

      <Modal show={modal === 'ok'} message={`Venta registrada con éxito. Nº de factura: ${numFactura.trim() || 'FAC-' + Date.now()}`}
        actions={<button className="btn btn-gold" onClick={() => navigate('/ventas')}>✔ Aceptar</button>}/>
      <Modal show={modal === 'error-cliente'} message="Debe ingresar el nombre del cliente."
        actions={<button className="btn btn-gold" onClick={() => setModal(null)}>✔ Aceptar</button>}/>
      <Modal show={modal === 'error-items'} message="Debe agregar al menos un producto a la venta."
        actions={<button className="btn btn-gold" onClick={() => setModal(null)}>✔ Aceptar</button>}/>
      <Modal show={modal === 'error-stock'} message="Hay productos en la venta que no tienen suficiente stock disponible."
        actions={<button className="btn btn-gold" onClick={() => setModal(null)}>✔ Aceptar</button>}/>
      <Modal show={modal === 'error'} message="Ocurrió un error al procesar la venta. Intente nuevamente."
        actions={<button className="btn btn-gold" onClick={() => setModal(null)}>✔ Aceptar</button>}/>
    </Layout>
  )
}
