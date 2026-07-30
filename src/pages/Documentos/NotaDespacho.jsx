import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'
import { supabase, supabaseConfigurado, MENSAJE_SIN_CONFIGURAR } from '../../lib/supabase.js'
import { mensajeError } from '../../lib/errores.js'
import { nombreUsuarioActual, usuarioIdValido } from '../../lib/sesion.js'
import { cargarOrdenesCompra, productosDeOrden, siguienteNumero } from '../../lib/ordenes.js'

export default function NotaDespacho() {
  const navigate = useNavigate()
  const hoy = new Date().toLocaleDateString('es-DO')

  const [vista, setVista] = useState('lista')
  const [notas, setNotas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Ordenes de compra reales, para que el "Num. de orden" de la nota sea el
  // mismo numero que usan la orden de preparacion y el reporte de incidentes.
  const [ordenesCompra, setOrdenesCompra] = useState([])
  const [productosOrden, setProductosOrden] = useState([])

  const [form, setForm] = useState({
    numNota: '', fechaEmision: hoy, direccion: '', descripcion: '',
    codigo: '', numOrden: '', cantidad: '', receptor: '',
    encargado: nombreUsuarioActual(),
  })
  const [editandoId, setEditandoId] = useState(null)
  const [cantidadOriginal, setCantidadOriginal] = useState(0)

  useEffect(() => {
    cargarNotas()
    cargarCatalogoOrdenes()
  }, [])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const cargarNotas = async () => {
    if (!supabaseConfigurado) { setAviso(MENSAJE_SIN_CONFIGURAR); setCargando(false); return }
    setCargando(true)
    const { data, error } = await supabase
      .from('nota_despacho')
      .select('*')
      .order('id', { ascending: false })

    if (error) setAviso(mensajeError(error, 'cargar las notas de despacho'))
    else setNotas(data || [])
    setCargando(false)
  }

  const cargarCatalogoOrdenes = async () => {
    if (!supabaseConfigurado) return
    const { ordenes, error } = await cargarOrdenesCompra()
    if (error) { setAviso(mensajeError(error, 'cargar las ordenes de compra')); return }
    setOrdenesCompra(ordenes)
  }

  const elegirOrdenCompra = async (numero) => {
    setForm(f => ({ ...f, numOrden: numero, codigo: '', descripcion: '', cantidad: '' }))
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

  // Al elegir el producto rellenamos tambien la descripcion, que antes se
  // escribia a mano y podia no coincidir con el codigo.
  const elegirProducto = (sku) => {
    const p = productosOrden.find(x => x.codigo_sku === sku)
    setForm(f => ({ ...f, codigo: sku, descripcion: p ? p.nombre : f.descripcion }))
  }

  const irACrear = async () => {
    const sugerido = supabaseConfigurado
      ? await siguienteNumero('nota_despacho', 'num_nota', 'ND')
      : ''
    setForm({
      numNota: sugerido, fechaEmision: hoy, direccion: '', descripcion: '',
      codigo: '', numOrden: '', cantidad: '', receptor: '',
      encargado: nombreUsuarioActual(),
    })
    setProductosOrden([])
    setEditandoId(null)
    setVista('crear')
  }

  /** Validacion comun. Devuelve null si todo esta bien. */
  const validar = () => {
    if (!form.numNota.trim()) return 'Falta el numero de la nota de despacho.'
    if (!form.numOrden) return 'Selecciona la orden de compra a la que corresponde el despacho.'
    if (!form.codigo) return 'Selecciona el producto a despachar.'
    const cant = parseInt(form.cantidad)
    if (!Number.isFinite(cant) || cant < 1) {
      return 'La cantidad despachada debe ser un numero entero de 1 o mas.'
    }
    if (!form.receptor.trim()) return 'Indica el nombre de quien recibe.'
    if (!form.direccion.trim()) return 'Indica la direccion de entrega.'
    return null
  }

  const handleGenerar = async () => {
    if (!supabaseConfigurado) { setAviso(MENSAJE_SIN_CONFIGURAR); return }
    const errorValidacion = validar()
    if (errorValidacion) { setAviso(errorValidacion); return }

    const cantDespachada = parseInt(form.cantidad)
    setGuardando(true)

    const { data: productos, error: errProd } = await supabase
      .from('productos').select('id, stock').eq('codigo_sku', form.codigo)

    if (errProd) {
      setAviso(mensajeError(errProd, 'consultar el producto en inventario'))
      setGuardando(false)
      return
    }
    if (!productos || productos.length === 0) {
      setAviso(`El codigo de producto ${form.codigo} no existe en tu inventario.`)
      setGuardando(false)
      return
    }

    const prod = productos[0]
    if (prod.stock < cantDespachada) {
      setModal('insuficiente')
      setGuardando(false)
      return
    }

    // ORDEN IMPORTANTE.
    // Antes se descontaba el stock PRIMERO y despues se insertaba la nota sin
    // comprobar el error: si el INSERT fallaba (RLS, red, columna...), el stock
    // quedaba rebajado sin ningun documento que lo justificara. Ahora primero
    // se crea la nota y solo entonces se toca el inventario; si el descuento
    // falla, se deshace la nota.
    const { data: notaCreada, error: errNota } = await supabase.from('nota_despacho').insert({
      num_nota: form.numNota.trim(),
      fecha_emision: form.fechaEmision,
      direccion: form.direccion.trim(),
      descripcion: form.descripcion.trim(),
      codigo: form.codigo,
      num_orden: form.numOrden,
      cantidad: cantDespachada,
      receptor: form.receptor.trim(),
      encargado: form.encargado.trim(),
      estado: 'activo'
    }).select('id').single()

    if (errNota || !notaCreada) {
      setAviso(mensajeError(errNota, 'guardar la nota de despacho'))
      setGuardando(false)
      return
    }

    const { error: errStock } = await supabase
      .from('productos').update({ stock: prod.stock - cantDespachada }).eq('id', prod.id)

    if (errStock) {
      await supabase.from('nota_despacho').delete().eq('id', notaCreada.id)
      setAviso(mensajeError(errStock, 'descontar el stock') +
        ' La nota se cancelo para que el inventario no quede descuadrado.')
      setGuardando(false)
      return
    }

    // Movimiento de inventario, para que el despacho quede trazado.
    // usuario_id es NOT NULL con FK a usuarios(id), asi que se resuelve un id
    // real; si no hay ninguno, se omite el movimiento en vez de reventar.
    const usuarioId = await usuarioIdValido()
    if (usuarioId != null) {
      const { error: errMov } = await supabase.from('movimientos_inventario').insert({
        producto_id: prod.id,
        usuario_id: usuarioId,
        tipo_movimiento: 'SALIDA',
        cantidad: cantDespachada,
        referencia: `Nota de despacho ${form.numNota.trim()} (orden ${form.numOrden})`,
      })
      if (errMov) console.warn('[Gold Club] No se pudo registrar el movimiento de inventario:', errMov)
    } else {
      console.warn('[Gold Club] Sin usuario valido: no se registro el movimiento de inventario.')
    }

    setGuardando(false)
    setModal('crear-ok')
  }

  const irAEditar = async (nota) => {
    setEditandoId(nota.id)
    setCantidadOriginal(nota.cantidad || 0)
    setForm({
      numNota: nota.num_nota || '', fechaEmision: nota.fecha_emision || hoy,
      direccion: nota.direccion || '', descripcion: nota.descripcion || '',
      codigo: nota.codigo || '', numOrden: nota.num_orden || '',
      cantidad: nota.cantidad ?? '', receptor: nota.receptor || '',
      encargado: nota.encargado || nombreUsuarioActual()
    })
    const oc = ordenesCompra.find(o => o.numero_orden === nota.num_orden)
    if (oc) {
      const { productos } = await productosDeOrden(oc.id)
      setProductosOrden(productos)
    } else {
      setProductosOrden([])
    }
    setVista('editar')
  }

  const handleActualizar = async () => {
    const errorValidacion = validar()
    if (errorValidacion) { setAviso(errorValidacion); return }

    const cantNueva = parseInt(form.cantidad)
    setGuardando(true)

    const { data: productos, error: errProd } = await supabase
      .from('productos').select('id, stock').eq('codigo_sku', form.codigo)

    if (errProd) {
      setAviso(mensajeError(errProd, 'consultar el producto en inventario'))
      setGuardando(false)
      return
    }
    // Antes, si el producto no aparecia la funcion terminaba en silencio: el
    // boton "Guardar Cambios" no hacia nada y no se explicaba por que.
    if (!productos || productos.length === 0) {
      setAviso(`El codigo de producto ${form.codigo} ya no existe en inventario, no se puede recalcular el stock.`)
      setGuardando(false)
      return
    }

    const prod = productos[0]
    const stockTemporal = prod.stock + cantidadOriginal   // devolvemos lo despachado antes

    if (stockTemporal < cantNueva) {
      setModal('insuficiente')
      setGuardando(false)
      return
    }

    const { error: errUpd } = await supabase.from('nota_despacho').update({
      num_nota: form.numNota.trim(),
      direccion: form.direccion.trim(),
      descripcion: form.descripcion.trim(),
      num_orden: form.numOrden,
      cantidad: cantNueva,
      receptor: form.receptor.trim(),
      encargado: form.encargado.trim()
    }).eq('id', editandoId)

    if (errUpd) {
      setAviso(mensajeError(errUpd, 'actualizar la nota de despacho'))
      setGuardando(false)
      return
    }

    const { error: errStock } = await supabase
      .from('productos').update({ stock: stockTemporal - cantNueva }).eq('id', prod.id)

    if (errStock) {
      // Dejamos la nota como estaba para no descuadrar el inventario.
      await supabase.from('nota_despacho').update({ cantidad: cantidadOriginal }).eq('id', editandoId)
      setAviso(mensajeError(errStock, 'recalcular el stock') + ' Se restauro la cantidad anterior.')
      setGuardando(false)
      return
    }

    setGuardando(false)
    setModal('editar-ok')
  }

  const handleMoverAPapelera = async (notaId) => {
    const { error } = await supabase.from('nota_despacho').update({ estado: 'eliminado' }).eq('id', notaId)
    if (error) setAviso(mensajeError(error, 'enviar la nota a la papelera'))
    else cargarNotas()
  }

  const handleReponerStockYRestaurar = async (notaId, sku, cantidad, receptor) => {
    const confirmar = window.confirm(
      `Deseas restaurar la nota de despacho y reponer las ${cantidad} unidades devueltas por ${receptor || 'el receptor'}?`
    )
    if (!confirmar) return

    const { data: productos, error: errProd } = await supabase
      .from('productos').select('id, stock').eq('codigo_sku', sku)

    if (errProd) { setAviso(mensajeError(errProd, 'consultar el producto')); return }
    if (!productos || productos.length === 0) {
      setAviso('No se pudo localizar el producto original en inventario, asi que no se repuso el stock.')
      return
    }

    const prod = productos[0]
    const { error: errStock } = await supabase
      .from('productos').update({ stock: prod.stock + cantidad }).eq('id', prod.id)
    if (errStock) { setAviso(mensajeError(errStock, 'reponer el stock')); return }

    const { error: errNota } = await supabase
      .from('nota_despacho').update({ estado: 'activo' }).eq('id', notaId)
    if (errNota) {
      // Deshacemos la reposicion para no inflar el inventario.
      await supabase.from('productos').update({ stock: prod.stock }).eq('id', prod.id)
      setAviso(mensajeError(errNota, 'restaurar la nota') + ' Se deshizo la reposicion de stock.')
      return
    }

    setAviso('Stock devuelto y nota restaurada con exito.')
    cargarNotas()
  }

  const handleBorrarDefinitivo = async (notaId) => {
    if (!window.confirm('Eliminar de forma permanente este documento? El stock descontado NO sera restablecido.')) return
    const { error } = await supabase.from('nota_despacho').delete().eq('id', notaId)
    if (error) setAviso(mensajeError(error, 'eliminar la nota'))
    else cargarNotas()
  }

  const cerrarYRefrescar = () => {
    setModal(null)
    setVista('lista')
    cargarNotas()
  }

  const activas = notas.filter(n => n.estado !== 'eliminado')
  const eliminadas = notas.filter(n => n.estado === 'eliminado')

  const filtradas = (vista === 'lista' ? activas : eliminadas).filter(n => {
    const t = busqueda.toLowerCase()
    return (n.num_nota || '').toLowerCase().includes(t) ||
           (n.num_orden || '').toLowerCase().includes(t) ||
           (n.codigo || '').toLowerCase().includes(t) ||
           (n.receptor || '').toLowerCase().includes(t) ||
           (n.descripcion || '').toLowerCase().includes(t)
  })

  const productoElegido = productosOrden.find(p => p.codigo_sku === form.codigo)

  return (
    <Layout>
      <div className="main-content">

        {(vista === 'lista' || vista === 'papelera') && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-4" style={{ maxWidth: 1000, margin: '0 auto' }}>
              <h1 className="page-title" style={{ margin: 0 }}>
                {vista === 'lista' ? 'Notas de Despacho' : 'Notas Eliminadas Recientemente'}
              </h1>
              <div className="d-flex gap-2">
                {vista === 'lista' ? (
                  <>
                    <button className="btn btn-outline-secondary" onClick={() => { setBusqueda(''); setVista('papelera') }}>
                      Ver Eliminados
                    </button>
                    <button className="btn btn-gold" onClick={irACrear}>Crear Nota</button>
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
                type="text" className="form-control" placeholder="Buscar por N&ordm; nota, N&ordm; orden, codigo o destinatario..."
                value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                style={{ background: 'var(--bg-input)', color: 'white', border: '1px solid #444' }}
              />
            </div>

            <div className="card card-gold" style={{ maxWidth: 1000, margin: '0 auto', padding: '20px' }}>
              <div className="section-heading mb-3">
                {vista === 'lista' ? 'Historial General de Envios Realizados' : 'Papelera de Notas Archivadas'}
              </div>

              <table className="table table-dark table-striped align-middle" style={{ borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                <thead>
                  <tr>
                    <th className="px-3" style={{ paddingLeft: '15px' }}>N&ordm; Nota</th>
                    <th className="px-3">N&ordm; Orden</th>
                    <th className="px-3">Codigo SKU</th>
                    <th className="px-3">Cant.</th>
                    <th className="px-3">Recibe / Destino</th>
                    <th className="text-center" style={{ width: '220px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cargando ? (
                    <tr><td colSpan="6" className="text-center text-muted py-4">Cargando datos...</td></tr>
                  ) : filtradas.length === 0 ? (
                    <tr><td colSpan="6" className="text-center text-muted py-4">
                      {busqueda
                        ? `Ninguna nota coincide con "${busqueda}".`
                        : vista === 'lista'
                          ? 'Todavia no hay notas de despacho. Usa "Crear Nota" para generar la primera.'
                          : 'La papelera esta vacia.'}
                    </td></tr>
                  ) : (
                    filtradas.map((n) => (
                      <tr key={n.id}>
                        <td className="px-3" style={{ paddingLeft: '15px' }}><span className="text-gold">{n.num_nota || 'S/N'}</span></td>
                        <td className="px-3">{n.num_orden || '—'}</td>
                        <td className="px-3"><code>{n.codigo}</code></td>
                        <td className="px-3" style={{ fontWeight: 'bold' }}>{n.cantidad} uds.</td>
                        <td className="px-3">{n.receptor} <br/> <small className="text-muted">{n.direccion}</small></td>
                        <td className="text-center">
                          <div className="d-flex gap-2 justify-content-center">
                            {vista === 'lista' ? (
                              <>
                                <button className="btn btn-sm btn-light" onClick={() => irAEditar(n)}>Editar</button>
                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleMoverAPapelera(n.id)}>Borrar</button>
                              </>
                            ) : (
                              <>
                                <button className="btn btn-sm btn-outline-success" onClick={() => handleReponerStockYRestaurar(n.id, n.codigo, n.cantidad, n.receptor)}>
                                  Reponer
                                </button>
                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleBorrarDefinitivo(n.id)}>Eliminar</button>
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
                {vista === 'crear' ? 'Nota de Despacho' : 'Modificar Nota de Despacho'}
              </div>

              <div className="form-group mb-3">
                <label>Num. nota de despacho:</label>
                <input className="form-control" type="text" placeholder="Ej: ND-00001"
                  value={form.numNota} onChange={set('numNota')} />
              </div>

              <div className="form-group mb-3">
                <label>Fecha de emision:</label>
                <input className="form-control" type="text" placeholder="Ej: DD/MM/AAAA"
                  value={form.fechaEmision} onChange={set('fechaEmision')} />
              </div>

              <div className="form-group mb-3">
                <label>Num. de orden de compra:</label>
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
                <label>Codigo del producto:</label>
                <select className="form-control" value={form.codigo}
                  onChange={e => elegirProducto(e.target.value)}
                  disabled={vista === 'editar' || !form.numOrden || productosOrden.length === 0}>
                  <option value="">
                    {form.numOrden ? '-- Selecciona un producto --' : '-- Primero elige la orden --'}
                  </option>
                  {productosOrden.map(p => (
                    <option key={p.codigo_sku} value={p.codigo_sku}>
                      {p.codigo_sku} &mdash; {p.nombre} (stock: {p.stock})
                    </option>
                  ))}
                </select>
                {vista === 'editar' && (
                  <small className="text-muted">El producto no se puede cambiar al editar, para no descuadrar el stock.</small>
                )}
              </div>

              <div className="form-group mb-3">
                <label>Descripcion del producto:</label>
                <input className="form-control" type="text" placeholder="Ej: Tequila Don Julio 70 6x75 Cl"
                  value={form.descripcion} onChange={set('descripcion')} />
              </div>

              <div className="form-group mb-3">
                <label>Cantidad despachada:</label>
                <input className="form-control" type="number" min="1" step="1" placeholder="Ej: 54"
                  value={form.cantidad} onChange={set('cantidad')} />
                {productoElegido && (
                  <small className="text-muted">Stock disponible: {productoElegido.stock} uds.</small>
                )}
              </div>

              <div className="form-group mb-3">
                <label>Direccion de entrega:</label>
                <input className="form-control" type="text" placeholder="Ej: C/ 27 de febrero, Tenares"
                  value={form.direccion} onChange={set('direccion')} />
              </div>

              <div className="section-heading mt-4">Datos de entrega:</div>

              <div className="form-group mb-3">
                <label>Nombre de quien recibe:</label>
                <input className="form-control" type="text" placeholder="Ej: Carlos De Jesus"
                  value={form.receptor} onChange={set('receptor')} />
              </div>

              <div className="form-group mb-4">
                <label>Encargado de despacho:</label>
                <input className="form-control" type="text" placeholder="Ej: Camilo Alonso"
                  value={form.encargado} onChange={set('encargado')} />
              </div>

              <div className="text-center gap-2 d-flex justify-content-center">
                {vista === 'crear' ? (
                  <button className="btn btn-gold" onClick={handleGenerar} disabled={guardando}>
                    {guardando ? 'Guardando...' : 'Generar nota de despacho'}
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
      <Modal show={modal === 'insuficiente'} message="No se pudo procesar la nota de despacho por falta de stock suficiente en el inventario."
        actions={<button className="btn btn-gold" onClick={() => setModal(null)}>&#10004; Aceptar</button>}/>
      <Modal show={!!aviso} message={aviso}
        actions={<button className="btn btn-gold" onClick={() => setAviso(null)}>&#10004; Entendido</button>}/>
    </Layout>
  )
}
