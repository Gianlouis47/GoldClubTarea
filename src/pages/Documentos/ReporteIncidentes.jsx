import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'
import { supabase, supabaseConfigurado, MENSAJE_SIN_CONFIGURAR } from '../../lib/supabase.js'
import { mensajeError } from '../../lib/errores.js'
import { nombreUsuarioActual } from '../../lib/sesion.js'
import { cargarOrdenesCompra, productosDeOrden } from '../../lib/ordenes.js'

export default function ReporteIncidentes() {
  const navigate = useNavigate()
  const hoy = new Date().toLocaleDateString('es-DO')

  const [vista, setVista] = useState('lista') // 'lista' | 'papelera' | 'crear' | 'editar'
  const [incidentes, setIncidentes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [guardando, setGuardando] = useState(false)

  // El reporte de incidentes tiene que HALLAR el numero de orden de compra y el
  // codigo de producto, no pedirlos como texto libre. Se leen de
  // ordenes_compra / detalle_orden_compra.
  const [ordenesCompra, setOrdenesCompra] = useState([])
  const [productosOrden, setProductosOrden] = useState([])

  const [form, setForm] = useState({
    numOrden: '', fechaIncidente: hoy, codigoProducto: '',
    cantidad: '', faltante: '', descripcion: '',
    creadoPor: nombreUsuarioActual(),
  })
  const [editandoId, setEditandoId] = useState(null)

  useEffect(() => {
    cargarIncidentes()
    cargarCatalogoOrdenes()
  }, [])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const cargarIncidentes = async () => {
    if (!supabaseConfigurado) { setAviso(MENSAJE_SIN_CONFIGURAR); setCargando(false); return }
    setCargando(true)
    const { data, error } = await supabase
      .from('reporte_incidentes')
      .select('*')
      .order('id', { ascending: false })

    if (error) setAviso(mensajeError(error, 'cargar los reportes de incidentes'))
    else setIncidentes(data || [])
    setCargando(false)
  }

  const cargarCatalogoOrdenes = async () => {
    if (!supabaseConfigurado) return
    const { ordenes, error } = await cargarOrdenesCompra()
    if (error) { setAviso(mensajeError(error, 'cargar las ordenes de compra')); return }
    setOrdenesCompra(ordenes)
  }

  const elegirOrdenCompra = async (numero) => {
    setForm(f => ({ ...f, numOrden: numero, codigoProducto: '', cantidad: '' }))
    setProductosOrden([])
    if (!numero) return

    const oc = ordenesCompra.find(o => o.numero_orden === numero)
    if (!oc) return

    const { productos, error } = await productosDeOrden(oc.id)
    if (error) { setAviso(mensajeError(error, 'cargar los productos de la orden')); return }
    setProductosOrden(productos)
    if (productos.length === 0) {
      setAviso(`La orden ${numero} no tiene productos registrados.`)
    }
  }

  const irACrear = () => {
    setForm({
      numOrden: '', fechaIncidente: hoy, codigoProducto: '',
      cantidad: '', faltante: '', descripcion: '',
      creadoPor: nombreUsuarioActual(),
    })
    setProductosOrden([])
    setEditandoId(null)
    setVista('crear')
  }

  /** Validacion comun. Devuelve null si todo esta bien. */
  const validar = () => {
    if (!form.numOrden) return 'Selecciona el numero de la orden de compra afectada.'
    if (!form.codigoProducto) return 'Selecciona el producto afectado por el incidente.'
    const cant = parseInt(form.cantidad)
    if (!Number.isFinite(cant) || cant < 1) {
      return 'La cantidad afectada debe ser un numero entero de 1 o mas.'
    }
    const prod = productosOrden.find(p => p.codigo_sku === form.codigoProducto)
    if (prod && cant > prod.cantidad_pedida) {
      return `La orden ${form.numOrden} solo incluye ${prod.cantidad_pedida} unidad(es) de ${prod.nombre}.`
    }
    if (!form.descripcion.trim()) return 'Describe que paso con la mercancia.'
    return null
  }

  const handleGenerar = async () => {
    if (!supabaseConfigurado) { setAviso(MENSAJE_SIN_CONFIGURAR); return }
    const error = validar()
    if (error) { setAviso(error); return }

    setGuardando(true)
    const { error: errIns } = await supabase.from('reporte_incidentes').insert({
      num_orden: form.numOrden,
      fecha_incidente: form.fechaIncidente,
      codigo_producto: form.codigoProducto,
      cantidad: parseInt(form.cantidad),
      faltante: form.faltante.trim() || null,
      descripcion: form.descripcion.trim(),
      creado_por: form.creadoPor,
      estado: 'activo'
    })
    setGuardando(false)

    if (errIns) setAviso(mensajeError(errIns, 'guardar el reporte de incidente'))
    else setModal('crear-ok')
  }

  const irAEditar = async (incidente) => {
    setEditandoId(incidente.id)
    setForm({
      numOrden: incidente.num_orden || '',
      fechaIncidente: incidente.fecha_incidente || hoy,
      codigoProducto: incidente.codigo_producto || '',
      cantidad: incidente.cantidad ?? '',
      faltante: incidente.faltante || '',
      descripcion: incidente.descripcion || '',
      creadoPor: incidente.creado_por || nombreUsuarioActual()
    })
    const oc = ordenesCompra.find(o => o.numero_orden === incidente.num_orden)
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
    const { error: errUpd } = await supabase.from('reporte_incidentes').update({
      num_orden: form.numOrden,
      fecha_incidente: form.fechaIncidente,
      codigo_producto: form.codigoProducto,
      cantidad: parseInt(form.cantidad),
      faltante: form.faltante.trim() || null,
      descripcion: form.descripcion.trim(),
      creado_por: form.creadoPor
    }).eq('id', editandoId)
    setGuardando(false)

    if (errUpd) setAviso(mensajeError(errUpd, 'actualizar el reporte de incidente'))
    else setModal('editar-ok')
  }

  const handleMoverAPapelera = async (id) => {
    const { error } = await supabase.from('reporte_incidentes').update({ estado: 'eliminado' }).eq('id', id)
    if (error) setAviso(mensajeError(error, 'enviar el reporte a la papelera'))
    else cargarIncidentes()
  }

  const handleRestaurar = async (id) => {
    const { error } = await supabase.from('reporte_incidentes').update({ estado: 'activo' }).eq('id', id)
    if (error) setAviso(mensajeError(error, 'restaurar el reporte'))
    else { setAviso('Reporte restaurado con exito.'); cargarIncidentes() }
  }

  const handleBorrarDefinitivo = async (id) => {
    if (!window.confirm('Eliminar de forma permanente este reporte de incidente?')) return
    const { error } = await supabase.from('reporte_incidentes').delete().eq('id', id)
    if (error) setAviso(mensajeError(error, 'eliminar el reporte'))
    else cargarIncidentes()
  }

  const cerrarYRefrescar = () => {
    setModal(null)
    setVista('lista')
    cargarIncidentes()
  }

  const activos = incidentes.filter(i => i.estado !== 'eliminado')
  const eliminados = incidentes.filter(i => i.estado === 'eliminado')

  const filtrados = (vista === 'lista' ? activos : eliminados).filter(i => {
    const t = busqueda.toLowerCase()
    return (i.num_orden || '').toLowerCase().includes(t) ||
           (i.codigo_producto || '').toLowerCase().includes(t) ||
           (i.descripcion || '').toLowerCase().includes(t) ||
           (i.creado_por || '').toLowerCase().includes(t)
  })

  const productoElegido = productosOrden.find(p => p.codigo_sku === form.codigoProducto)

  return (
    <Layout>
      <div className="main-content">

        {(vista === 'lista' || vista === 'papelera') && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-4" style={{ maxWidth: 1000, margin: '0 auto' }}>
              <h1 className="page-title" style={{ margin: 0 }}>
                {vista === 'lista' ? 'Reportes de Incidentes' : 'Incidentes Eliminados Recientemente'}
              </h1>
              <div className="d-flex gap-2">
                {vista === 'lista' ? (
                  <>
                    <button className="btn btn-outline-secondary" onClick={() => { setBusqueda(''); setVista('papelera') }}>
                      Ver Eliminados
                    </button>
                    <button className="btn btn-gold" onClick={irACrear}>Crear Reporte</button>
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
                type="text" className="form-control" placeholder="Buscar por N&ordm; orden, codigo, descripcion o autor..."
                value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                style={{ background: 'var(--bg-input)', color: 'white', border: '1px solid #444' }}
              />
            </div>

            <div className="card card-gold" style={{ maxWidth: 1000, margin: '0 auto', padding: '20px' }}>
              <div className="section-heading mb-3">
                {vista === 'lista' ? 'Historial General de Incidentes' : 'Papelera de Incidentes Archivados'}
              </div>

              <table className="table table-dark table-striped align-middle" style={{ borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                <thead>
                  <tr>
                    <th className="px-3" style={{ paddingLeft: '15px' }}>N&ordm; Orden</th>
                    <th className="px-3">Cod. Producto</th>
                    <th className="px-3">Cantidad</th>
                    <th className="px-3">Descripcion</th>
                    <th className="text-center" style={{ width: '220px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cargando ? (
                    <tr><td colSpan="5" className="text-center text-muted py-4">Cargando datos...</td></tr>
                  ) : filtrados.length === 0 ? (
                    <tr><td colSpan="5" className="text-center text-muted py-4">
                      {busqueda
                        ? `Ningun reporte coincide con "${busqueda}".`
                        : vista === 'lista'
                          ? 'Todavia no hay reportes de incidentes. Usa "Crear Reporte" para registrar el primero.'
                          : 'La papelera esta vacia.'}
                    </td></tr>
                  ) : (
                    filtrados.map((i) => (
                      <tr key={i.id}>
                        <td className="px-3" style={{ paddingLeft: '15px' }}><span className="text-gold">{i.num_orden || 'S/N'}</span></td>
                        <td className="px-3"><code>{i.codigo_producto}</code></td>
                        <td className="px-3" style={{ fontWeight: 'bold' }}>{i.cantidad} uds.</td>
                        <td className="px-3">
                          {i.descripcion}
                          {i.faltante && <><br/><small className="text-muted">Faltante: {i.faltante}</small></>}
                          <br/><small className="text-muted">Por: {i.creado_por}</small>
                        </td>
                        <td className="text-center">
                          <div className="d-flex gap-2 justify-content-center">
                            {vista === 'lista' ? (
                              <>
                                <button className="btn btn-sm btn-light" onClick={() => irAEditar(i)}>Editar</button>
                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleMoverAPapelera(i.id)}>Borrar</button>
                              </>
                            ) : (
                              <>
                                <button className="btn btn-sm btn-outline-success" onClick={() => handleRestaurar(i.id)}>
                                  Restaurar
                                </button>
                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleBorrarDefinitivo(i.id)}>Eliminar</button>
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
                {vista === 'crear' ? 'Reporte de incidente' : 'Modificar Reporte de Incidente'}
              </div>

              <div className="form-group mb-3">
                <label>Fecha del incidente:</label>
                <input className="form-control" type="text" placeholder="Ej: 26/10/2025"
                  value={form.fechaIncidente} onChange={set('fechaIncidente')} />
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
              </div>

              <div className="form-group mb-3">
                <label>Codigo de producto:</label>
                <select className="form-control" value={form.codigoProducto}
                  onChange={set('codigoProducto')}
                  disabled={!form.numOrden || productosOrden.length === 0}>
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
                <label>Cantidad afectada:</label>
                <input className="form-control" type="number" min="1" step="1"
                  max={productoElegido?.cantidad_pedida || undefined}
                  placeholder="Ej: 5" value={form.cantidad} onChange={set('cantidad')} />
                {productoElegido && (
                  <small className="text-muted">La orden incluye {productoElegido.cantidad_pedida} uds. de este producto.</small>
                )}
              </div>

              <div className="form-group mb-3">
                <label>Detalle del faltante (opcional):</label>
                <input className="form-control" type="text" placeholder="Ej: 2 botellas rotas, 1 caja mojada"
                  value={form.faltante} onChange={set('faltante')} />
              </div>

              <div className="section-heading mt-4">Descripcion del problema</div>
              <div className="form-group mb-3">
                <textarea
                  className="form-control"
                  style={{ minHeight: 80, resize: 'vertical' }}
                  placeholder="Describa el estado de la mercancia o la incidencia. Ej: Cinco botellas de ron anejo danadas durante el transporte..."
                  value={form.descripcion}
                  onChange={set('descripcion')}
                />
              </div>

              <div className="section-heading mt-4">Detalles de autoria</div>
              <div className="form-group mb-4">
                <label>Creado por:</label>
                <input className="form-control" type="text" value={form.creadoPor} readOnly />
              </div>

              <div className="text-center gap-2 d-flex justify-content-center">
                {vista === 'crear' ? (
                  <button className="btn btn-gold" onClick={handleGenerar} disabled={guardando}>
                    {guardando ? 'Guardando...' : 'Generar reporte de incidente'}
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
