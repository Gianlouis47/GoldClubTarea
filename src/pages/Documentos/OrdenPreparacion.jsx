import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'
import { supabase, supabaseConfigurado, MENSAJE_SIN_CONFIGURAR } from '../../lib/supabase.js'
import { mensajeError } from '../../lib/errores.js'
import { nombreUsuarioActual } from '../../lib/sesion.js'
import { cargarOrdenesCompra } from '../../lib/ordenes.js'

export default function OrdenPreparacion() {
  const navigate = useNavigate()

  const [vista, setVista] = useState('lista') // 'lista' | 'papelera' | 'crear' | 'editar'
  const [ordenes, setOrdenes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [guardando, setGuardando] = useState(false)

  // El producto a preparar se elige del INVENTARIO real (tabla productos), no
  // de una orden de compra puntual. Preparar un producto significa alistarlo
  // para su entrega, y eso solo tiene sentido si ya esta fisicamente en el
  // almacen (ya fue recibido); por eso el campo "recibido" no es una casilla
  // que alguien marca a mano, sino un hecho: si esta en el inventario, fue
  // recibido. La orden de compra queda como referencia OPCIONAL, para
  // trazabilidad, pero ya no bloquea ni filtra nada.
  const [productos, setProductos] = useState([])
  const [ordenesCompra, setOrdenesCompra] = useState([])

  const [form, setForm] = useState({
    codigo: '', cantidad: '', destino: '', numOrden: '',
    creadoPor: nombreUsuarioActual(),
  })
  const [editandoId, setEditandoId] = useState(null)

  useEffect(() => {
    cargarOrdenes()
    cargarProductos()
    cargarCatalogoOrdenesCompra()
  }, [])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const cargarOrdenes = async () => {
    if (!supabaseConfigurado) { setAviso(MENSAJE_SIN_CONFIGURAR); setCargando(false); return }
    setCargando(true)
    const { data, error } = await supabase
      .from('orden_preparacion')
      .select('*')
      .order('id', { ascending: false })

    if (error) setAviso(mensajeError(error, 'cargar las ordenes de preparacion'))
    else setOrdenes(data || [])
    setCargando(false)
  }

  // Productos ya recibidos en inventario (con stock disponible): son los
  // unicos que realmente se pueden preparar para despachar.
  const cargarProductos = async () => {
    if (!supabaseConfigurado) return
    const { data, error } = await supabase
      .from('productos')
      .select('id, codigo_sku, nombre, stock')
      .gt('stock', 0)
      .order('nombre', { ascending: true })
    if (error) { setAviso(mensajeError(error, 'cargar el inventario')); return }
    setProductos(data || [])
  }

  // Solo para el campo de referencia opcional "Orden de compra relacionada".
  const cargarCatalogoOrdenesCompra = async () => {
    if (!supabaseConfigurado) return
    const { ordenes: oc, error } = await cargarOrdenesCompra()
    if (error) return
    setOrdenesCompra(oc)
  }

  const irACrear = () => {
    setForm({ codigo: '', cantidad: '', destino: '', numOrden: '', creadoPor: nombreUsuarioActual() })
    setEditandoId(null)
    setVista('crear')
  }

  /** Validacion comun a crear y editar. Devuelve null si todo esta bien. */
  const validar = () => {
    if (!form.codigo) return 'Selecciona el producto a preparar.'
    const cant = parseInt(form.cantidad)
    if (!Number.isFinite(cant) || cant < 1) {
      return 'La cantidad a preparar debe ser un numero entero de 1 o mas.'
    }
    const prod = productos.find(p => p.codigo_sku === form.codigo)
    if (prod && cant > prod.stock) {
      return `Solo hay ${prod.stock} unidad(es) de ${prod.nombre} recibidas en inventario. No puedes preparar ${cant}.`
    }
    if (!form.destino.trim()) return 'Indica el destino del pedido.'
    return null
  }

  const handleGenerar = async () => {
    if (!supabaseConfigurado) { setAviso(MENSAJE_SIN_CONFIGURAR); return }
    const error = validar()
    if (error) { setAviso(error); return }

    setGuardando(true)
    const { error: errIns } = await supabase.from('orden_preparacion').insert({
      codigo: form.codigo,
      cantidad: parseInt(form.cantidad),
      destino: form.destino.trim(),
      num_orden: form.numOrden || null,
      recibido: true,
      creado_por: form.creadoPor,
      estado: 'activo'
    })
    setGuardando(false)

    if (errIns) setAviso(mensajeError(errIns, 'guardar la orden de preparacion'))
    else setModal('crear-ok')
  }

  const irAEditar = (orden) => {
    setEditandoId(orden.id)
    setForm({
      codigo: orden.codigo || '',
      cantidad: orden.cantidad ?? '',
      destino: orden.destino || '',
      numOrden: orden.num_orden || '',
      creadoPor: orden.creado_por || nombreUsuarioActual()
    })
    setVista('editar')
  }

  const handleActualizar = async () => {
    const error = validar()
    if (error) { setAviso(error); return }

    setGuardando(true)
    const { error: errUpd } = await supabase.from('orden_preparacion').update({
      codigo: form.codigo,
      cantidad: parseInt(form.cantidad),
      destino: form.destino.trim(),
      num_orden: form.numOrden || null,
      creado_por: form.creadoPor
    }).eq('id', editandoId)
    setGuardando(false)

    if (errUpd) setAviso(mensajeError(errUpd, 'actualizar la orden de preparacion'))
    else setModal('editar-ok')
  }

  const handleMoverAPapelera = async (id) => {
    const { error } = await supabase.from('orden_preparacion').update({ estado: 'eliminado' }).eq('id', id)
    if (error) setAviso(mensajeError(error, 'enviar la orden a la papelera'))
    else cargarOrdenes()
  }

  const handleRestaurar = async (id) => {
    const { error } = await supabase.from('orden_preparacion').update({ estado: 'activo' }).eq('id', id)
    if (error) setAviso(mensajeError(error, 'restaurar la orden'))
    else { setAviso('Orden restaurada con exito.'); cargarOrdenes() }
  }

  const handleBorrarDefinitivo = async (id) => {
    if (!window.confirm('Eliminar de forma permanente esta orden de preparacion?')) return
    const { error } = await supabase.from('orden_preparacion').delete().eq('id', id)
    if (error) setAviso(mensajeError(error, 'eliminar la orden'))
    else cargarOrdenes()
  }

  const cerrarYRefrescar = () => {
    setModal(null)
    setVista('lista')
    cargarOrdenes()
    cargarProductos()
  }

  const activos = ordenes.filter(o => o.estado !== 'eliminado')
  const eliminados = ordenes.filter(o => o.estado === 'eliminado')

  const filtrados = (vista === 'lista' ? activos : eliminados).filter(o => {
    const t = busqueda.toLowerCase()
    return (o.num_orden || '').toLowerCase().includes(t) ||
           (o.codigo || '').toLowerCase().includes(t) ||
           (o.destino || '').toLowerCase().includes(t) ||
           (o.creado_por || '').toLowerCase().includes(t)
  })

  const productoElegido = productos.find(p => p.codigo_sku === form.codigo)

  return (
    <Layout>
      <div className="main-content">

        {(vista === 'lista' || vista === 'papelera') && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-4" style={{ maxWidth: 1000, margin: '0 auto' }}>
              <h1 className="page-title" style={{ margin: 0 }}>
                {vista === 'lista' ? 'Ordenes de Preparacion' : 'Ordenes Eliminadas Recientemente'}
              </h1>
              <div className="d-flex gap-2">
                {vista === 'lista' ? (
                  <>
                    <button className="btn btn-outline-secondary" onClick={() => { setBusqueda(''); setVista('papelera') }}>
                      Ver Eliminados
                    </button>
                    <button className="btn btn-gold" onClick={irACrear}>Crear Orden</button>
                  </>
                ) : (
                  <button className="btn btn-secondary" onClick={() => { setBusqueda(''); setVista('lista') }}>
                    Volver al Historial
                  </button>
                )}
              </div>
            </div>

            <div style={{ maxWidth: 1000, margin: '0 auto 15px auto' }}>
              <input
                type="text" className="form-control" placeholder="Buscar por N&ordm; orden, codigo, destino o autor..."
                value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                style={{ background: 'var(--bg-input)', color: 'white', border: '1px solid #444' }}
              />
            </div>

            <div className="card card-gold" style={{ maxWidth: 1000, margin: '0 auto', padding: '20px' }}>
              <div className="section-heading mb-3">
                {vista === 'lista' ? 'Historial General de Ordenes' : 'Papelera de Ordenes Archivadas'}
              </div>

              <table className="table table-dark table-striped align-middle" style={{ borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                <thead>
                  <tr>
                    <th className="px-3" style={{ paddingLeft: '15px' }}>Cod. Producto</th>
                    <th className="px-3">Recibido</th>
                    <th className="px-3">Cantidad</th>
                    <th className="px-3">Destino</th>
                    <th className="px-3">Ref. Orden de compra</th>
                    <th className="text-center" style={{ width: '220px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cargando ? (
                    <tr><td colSpan="6" className="text-center text-muted py-4">Cargando datos...</td></tr>
                  ) : filtrados.length === 0 ? (
                    <tr><td colSpan="6" className="text-center text-muted py-4">
                      {busqueda
                        ? `Ninguna orden coincide con "${busqueda}".`
                        : vista === 'lista'
                          ? 'Todavia no hay ordenes de preparacion. Usa "Crear Orden" para generar la primera.'
                          : 'La papelera esta vacia.'}
                    </td></tr>
                  ) : (
                    filtrados.map((o) => (
                      <tr key={o.id}>
                        <td className="px-3" style={{ paddingLeft: '15px' }}><code>{o.codigo}</code></td>
                        <td className="px-3">
                          {o.recibido !== false
                            ? <span className="text-success">Si &#10004;</span>
                            : <span className="text-warning">No</span>}
                        </td>
                        <td className="px-3" style={{ fontWeight: 'bold' }}>{o.cantidad} uds.</td>
                        <td className="px-3">{o.destino} <br/> <small className="text-muted">Por: {o.creado_por}</small></td>
                        <td className="px-3">{o.num_orden || <span className="text-muted">Sin referencia</span>}</td>
                        <td className="text-center">
                          <div className="d-flex gap-2 justify-content-center">
                            {vista === 'lista' ? (
                              <>
                                <button className="btn btn-sm btn-light" onClick={() => irAEditar(o)}>Editar</button>
                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleMoverAPapelera(o.id)}>Borrar</button>
                              </>
                            ) : (
                              <>
                                <button className="btn btn-sm btn-outline-success" onClick={() => handleRestaurar(o.id)}>
                                  Restaurar
                                </button>
                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleBorrarDefinitivo(o.id)}>Eliminar</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {(vista === 'crear' || vista === 'editar') && (
          <div className="two-col">
            <div className="card card-gold">
              <div className="section-heading" style={{ marginTop: 0 }}>
                {vista === 'crear' ? 'Orden de preparacion' : 'Modificar Orden de Preparacion'}
              </div>

              <div className="form-group mb-3">
                <label>Producto a preparar (ya recibido en inventario):</label>
                <select className="form-control" value={form.codigo} onChange={set('codigo')}>
                  <option value="">-- Selecciona un producto --</option>
                  {productos.map(p => (
                    <option key={p.codigo_sku} value={p.codigo_sku}>
                      {p.codigo_sku} &mdash; {p.nombre} (stock: {p.stock})
                    </option>
                  ))}
                </select>
                {productos.length === 0 && (
                  <small className="text-muted">
                    No hay productos con stock disponible. Primero recibe una orden de compra en
                    Ventas y Compras &rarr; Recepcion de productos.
                  </small>
                )}
                {productoElegido && (
                  <small className="text-success">
                    Producto recibido &#10004; (hay {productoElegido.stock} uds. en inventario).
                  </small>
                )}
              </div>

              <div className="form-group mb-3">
                <label>Cantidad a preparar:</label>
                <input
                  className="form-control"
                  type="number"
                  min="1"
                  step="1"
                  max={productoElegido?.stock || undefined}
                  placeholder="Ej: 8"
                  value={form.cantidad}
                  onChange={set('cantidad')}
                />
                {productoElegido && (
                  <small className="text-muted">Maximo disponible: {productoElegido.stock} uds.</small>
                )}
              </div>

              <div className="form-group mb-3">
                <label>Destino del pedido:</label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="Ej: Area de ventas"
                  value={form.destino}
                  onChange={set('destino')}
                />
              </div>

              <div className="form-group mb-3">
                <label>Orden de compra relacionada (opcional):</label>
                <select className="form-control" value={form.numOrden} onChange={set('numOrden')}>
                  <option value="">-- Sin referencia --</option>
                  {ordenesCompra.map(o => (
                    <option key={o.id} value={o.numero_orden}>
                      {o.numero_orden} &mdash; {o.proveedores?.nombre_empresa || 'Sin proveedor'}
                    </option>
                  ))}
                </select>
                <small className="text-muted">
                  Solo para trazabilidad. La orden de preparacion no depende de ninguna orden de compra.
                </small>
              </div>

              <div className="section-heading mt-4">Detalles de autoria</div>
              <div className="form-group mb-4">
                <label>Creado por:</label>
                <input className="form-control" type="text" placeholder="Ej: Juan Perez"
                  value={form.creadoPor} onChange={set('creadoPor')} />
              </div>

              <div className="text-center gap-2 d-flex justify-content-center">
                {vista === 'crear' ? (
                  <button className="btn btn-gold" onClick={handleGenerar} disabled={guardando}>
                    {guardando ? 'Guardando...' : 'Generar orden de preparacion'}
                  </button>
                ) : (
                  <button className="btn btn-gold" onClick={handleActualizar} disabled={guardando}>
                    {guardando ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                )}
                <button className="btn btn-secondary" onClick={() => setVista('lista')}>Cancelar</button>
              </div>
            </div>

            {vista === 'crear' && (
              <div>
                <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>Productos con stock disponible:</div>
                <ul className="sidebar-list">
                  {productos.slice(0, 6).map(p => (
                    <li key={p.codigo_sku} onClick={() => setForm(f => ({ ...f, codigo: p.codigo_sku }))} style={{ cursor: 'pointer' }}>
                      {p.codigo_sku} &mdash; {p.nombre} <span className="sidebar-arrow">&#9654;</span>
                    </li>
                  ))}
                  {productos.length === 0 && (
                    <li className="text-muted">Sin productos recibidos en inventario</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

      </div>

      <Modal show={modal === 'crear-ok' || modal === 'editar-ok'} message="Operacion realizada con exito."
        actions={<button className="btn btn-gold" onClick={cerrarYRefrescar}>&#10004; Aceptar</button>}/>
      <Modal show={!!aviso} message={aviso}
        actions={<button className="btn btn-gold" onClick={() => setAviso(null)}>&#10004; Entendido</button>}/>
    </Layout>
  )
}
