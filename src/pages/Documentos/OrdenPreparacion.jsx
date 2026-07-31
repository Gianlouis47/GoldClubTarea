import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'
import { supabase, supabaseConfigurado, MENSAJE_SIN_CONFIGURAR } from '../../lib/supabase.js'
import { mensajeError } from '../../lib/errores.js'
import { nombreUsuarioActual } from '../../lib/sesion.js'
import { cargarOrdenesCompra, productosDeOrden } from '../../lib/ordenes.js'

export default function OrdenPreparacion() {
  const navigate = useNavigate()

  const [vista, setVista] = useState('lista') // 'lista' | 'papelera' | 'crear' | 'editar'
  const [ordenes, setOrdenes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Ordenes de compra reales + productos de la orden elegida.
  // Antes el numero de orden y el codigo de producto eran texto libre, asi que
  // la orden de preparacion podia apuntar a una orden que no existia y no se
  // podia cruzar con la nota de despacho ni con el reporte de incidentes.
  const [ordenesCompra, setOrdenesCompra] = useState([])
  const [productosOrden, setProductosOrden] = useState([])

  const [form, setForm] = useState({
    numOrden: '', codigo: '', cantidad: '', destino: '',
    creadoPor: nombreUsuarioActual(),
  })
  const [editandoId, setEditandoId] = useState(null)

  useEffect(() => {
    cargarOrdenes()
    cargarCatalogoOrdenes()
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

  const cargarCatalogoOrdenes = async () => {
    if (!supabaseConfigurado) return
    const { ordenes: oc, error } = await cargarOrdenesCompra()
    if (error) { setAviso(mensajeError(error, 'cargar las ordenes de compra')); return }
    setOrdenesCompra(oc)
  }

  // Al elegir una orden de compra se cargan SUS productos.
  const elegirOrdenCompra = async (numero) => {
    setForm(f => ({ ...f, numOrden: numero, codigo: '', cantidad: '' }))
    setProductosOrden([])
    if (!numero) return

    const oc = ordenesCompra.find(o => o.numero_orden === numero)
    if (!oc) return

    const { productos, error } = await productosDeOrden(oc.id)
    if (error) { setAviso(mensajeError(error, 'cargar los productos de la orden')); return }
    setProductosOrden(productos)
    if (productos.length === 0) {
      setAviso(`La orden ${numero} no tiene productos registrados. Revisala en Ventas y Compras.`)
    }
  }

  const irACrear = () => {
    setForm({ numOrden: '', codigo: '', cantidad: '', destino: '', creadoPor: nombreUsuarioActual() })
    setProductosOrden([])
    setEditandoId(null)
    setVista('crear')
  }

  /** Validacion comun a crear y editar. Devuelve null si todo esta bien. */
  const validar = () => {
    if (!form.numOrden) return 'Selecciona el numero de la orden de compra.'
    if (!form.codigo) return 'Selecciona el producto a preparar.'
    const cant = parseInt(form.cantidad)
    if (!Number.isFinite(cant) || cant < 1) {
      return 'La cantidad a despachar debe ser un numero entero de 1 o mas.'
    }
    const prod = productosOrden.find(p => p.codigo_sku === form.codigo)
    if (prod && cant > prod.cantidad_pedida) {
      return `La orden ${form.numOrden} solo pidio ${prod.cantidad_pedida} unidad(es) de ${prod.nombre}. No puedes preparar ${cant}.`
    }
    // La orden de compra debe estar RECIBIDA: si sigue pendiente el producto
    // todavia no sumo al stock, y no tiene sentido "preparar" algo que no esta
    // fisicamente en el almacen.
    const oc = ordenesCompra.find(o => o.numero_orden === form.numOrden)
    if (oc && oc.estado !== 'recibida') {
      return `La orden ${form.numOrden} aun esta ${oc.estado} (no recibida). Ese producto todavia no afecta el stock, primero debe recibirse en Ventas y Compras -> Recepcion de productos.`
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
      num_orden: form.numOrden,
      codigo: form.codigo,
      cantidad: parseInt(form.cantidad),
      destino: form.destino.trim(),
      creado_por: form.creadoPor,
      estado: 'activo'
    })
    setGuardando(false)

    if (errIns) setAviso(mensajeError(errIns, 'guardar la orden de preparacion'))
    else setModal('crear-ok')
  }

  const irAEditar = async (orden) => {
    setEditandoId(orden.id)
    setForm({
      numOrden: orden.num_orden || '',
      codigo: orden.codigo || '',
      cantidad: orden.cantidad ?? '',
      destino: orden.destino || '',
      creadoPor: orden.creado_por || nombreUsuarioActual()
    })
    // Cargamos los productos de esa orden para poder validar la cantidad.
    const oc = ordenesCompra.find(o => o.numero_orden === orden.num_orden)
    if (oc) {
      const { productos } = await productosDeOrden(oc.id)
      setProductosOrden(productos)
    } else {
      setProductosOrden([])
    }
    setVista('editar')
  }

  const handleActualizar = async () => {
    const error = validar()
    if (error) { setAviso(error); return }

    setGuardando(true)
    const { error: errUpd } = await supabase.from('orden_preparacion').update({
      num_orden: form.numOrden,
      codigo: form.codigo,
      cantidad: parseInt(form.cantidad),
      destino: form.destino.trim(),
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

  const productoElegido = productosOrden.find(p => p.codigo_sku === form.codigo)
  const ordenCompraSel = ordenesCompra.find(o => o.numero_orden === form.numOrden)

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
                    <th className="px-3" style={{ paddingLeft: '15px' }}>N&ordm; Orden</th>
                    <th className="px-3">Cod. Producto</th>
                    <th className="px-3">Cantidad</th>
                    <th className="px-3">Destino</th>
                    <th className="text-center" style={{ width: '220px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cargando ? (
                    <tr><td colSpan="5" className="text-center text-muted py-4">Cargando datos...</td></tr>
                  ) : filtrados.length === 0 ? (
                    <tr><td colSpan="5" className="text-center text-muted py-4">
                      {busqueda
                        ? `Ninguna orden coincide con "${busqueda}".`
                        : vista === 'lista'
                          ? 'Todavia no hay ordenes de preparacion. Usa "Crear Orden" para generar la primera.'
                          : 'La papelera esta vacia.'}
                    </td></tr>
                  ) : (
                    filtrados.map((o) => (
                      <tr key={o.id}>
                        <td className="px-3" style={{ paddingLeft: '15px' }}><span className="text-gold">{o.num_orden || 'S/N'}</span></td>
                        <td className="px-3"><code>{o.codigo}</code></td>
                        <td className="px-3" style={{ fontWeight: 'bold' }}>{o.cantidad} uds.</td>
                        <td className="px-3">{o.destino} <br/> <small className="text-muted">Por: {o.creado_por}</small></td>
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
                <label>Numero de orden de compra:</label>
                <select className="form-control" value={form.numOrden}
                  onChange={e => elegirOrdenCompra(e.target.value)}>
                  <option value="">-- Selecciona una orden de compra --</option>
                  {ordenesCompra.map(o => (
                    <option key={o.id} value={o.numero_orden}>
                      {o.numero_orden} &mdash; {o.proveedores?.nombre_empresa || 'Sin proveedor'} ({o.estado})
                    </option>
                  ))}
                </select>
                {ordenesCompra.length === 0 && (
                  <small className="text-muted">
                    No hay ordenes de compra registradas. Crea una en Ventas y Compras &rarr; Orden de compra.
                  </small>
                )}
                {ordenCompraSel && (
                  <small className={ordenCompraSel.estado === 'recibida' ? 'text-success' : 'text-warning'}>
                    Estado de recepcion: {ordenCompraSel.estado === 'recibida'
                      ? 'Recibida (ya afecta el stock).'
                      : 'Pendiente (todavia NO afecta el stock, no se puede preparar).'}
                  </small>
                )}
              </div>

              <div className="form-group mb-3">
                <label>Producto de la orden:</label>
                <select className="form-control" value={form.codigo}
                  onChange={set('codigo')}
                  disabled={!form.numOrden || productosOrden.length === 0 || ordenCompraSel?.estado !== 'recibida'}>
                  <option value="">
                    {form.numOrden ? '-- Selecciona un producto --' : '-- Primero elige la orden --'}
                  </option>
                  {productosOrden.map(p => (
                    <option key={p.codigo_sku} value={p.codigo_sku}>
                      {p.codigo_sku} &mdash; {p.nombre} (pedidas: {p.cantidad_pedida})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group mb-3">
                <label>Cantidad a despachar:</label>
                <input
                  className="form-control"
                  type="number"
                  min="1"
                  step="1"
                  max={productoElegido?.cantidad_pedida || undefined}
                  placeholder="Ej: 8"
                  value={form.cantidad}
                  onChange={set('cantidad')}
                />
                {productoElegido && (
                  <small className="text-muted">
                    Maximo segun la orden: {productoElegido.cantidad_pedida} uds.
                    Stock actual en inventario: {productoElegido.stock} uds.
                  </small>
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
                <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>Ordenes de compra recientes:</div>
                <ul className="sidebar-list">
                  {ordenesCompra.slice(0, 6).map(o => (
                    <li key={o.id} onClick={() => elegirOrdenCompra(o.numero_orden)} style={{ cursor: 'pointer' }}>
                      {o.numero_orden} <span className="sidebar-arrow">&#9654;</span>
                    </li>
                  ))}
                  {ordenesCompra.length === 0 && (
                    <li className="text-muted">Sin ordenes registradas</li>
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
