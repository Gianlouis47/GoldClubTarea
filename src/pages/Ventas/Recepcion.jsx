// import React, { useState, useEffect } from 'react'
// import { useNavigate } from 'react-router-dom'
// import Layout from '../../components/Layout.jsx'
// import Modal from '../../components/Modal.jsx'
// import { supabase, supabaseConfigurado, MENSAJE_SIN_CONFIGURAR } from '../../lib/supabase.js'
// import { mensajeError } from '../../lib/errores.js'
// import { usuarioIdValido, MENSAJE_SIN_USUARIO } from '../../lib/sesion.js'

// export default function Recepcion() {
//   const navigate = useNavigate()
//   const [ordenes, setOrdenes] = useState([])
//   const [cargando, setCargando] = useState(true)
//   const [modal, setModal] = useState(null)
//   const [aviso, setAviso] = useState(null)
//   const [recibiendo, setRecibiendo] = useState(false)
//   const [ordenSel, setOrdenSel] = useState(null)
//   const [detalle, setDetalle] = useState([])

//   useEffect(() => {
//     cargarOrdenes()
//   }, [])

//   const cargarOrdenes = async () => {
//     if (!supabaseConfigurado) { setAviso(MENSAJE_SIN_CONFIGURAR); setCargando(false); return }
//     setCargando(true)
//     const { data, error } = await supabase
//       .from('ordenes_compra')
//       .select('id, numero_orden, estado, observaciones, creado_en, proveedores(nombre_empresa)')
//       .order('id', { ascending: false })
//     if (error) setAviso(mensajeError(error, 'cargar las ordenes de compra'))
//     else setOrdenes(data || [])
//     setCargando(false)
//   }

//   const verDetalle = async (orden) => {
//     setOrdenSel(orden)
//     setDetalle([])
//     const { data, error } = await supabase
//       .from('detalle_orden_compra')
//       .select('cantidad, precio_unitario, subtotal, productos(nombre, codigo_sku)')
//       .eq('orden_compra_id', orden.id)
//     if (error) { setAviso(mensajeError(error, 'cargar el detalle de la orden')); return }
//     setDetalle(data || [])
//   }

//   const handleRecibir = async () => {
//     if (!ordenSel) return

//     // Una orden sin productos se podia "recibir" sin sumar nada al stock y
//     // quedaba marcada como recibida.
//     if (detalle.length === 0) {
//       setAviso(`La orden ${ordenSel.numero_orden} no tiene productos registrados, no hay nada que recibir.`)
//       return
//     }
//     // Evitar recibir dos veces la misma orden (duplicaba el stock).
//     if (ordenSel.estado === 'recibida') {
//       setAviso(`La orden ${ordenSel.numero_orden} ya fue recibida.`)
//       return
//     }

//     const usuarioId = await usuarioIdValido()
//     if (usuarioId == null) { setAviso(MENSAJE_SIN_USUARIO); return }

//     setRecibiendo(true)
//     const fallos = []
//     let recibidos = 0

//     for (const d of detalle) {
//       const sku = d.productos?.codigo_sku
//       if (!sku) { fallos.push('una linea sin producto asociado'); continue }

//       // Antes se usaba .single(), que devuelve error si el producto no existe;
//       // ese error se ignoraba y la linea se perdia en silencio.
//       const { data: prod, error: errProd } = await supabase
//         .from('productos').select('id,stock').eq('codigo_sku', sku).maybeSingle()

//       if (errProd) { fallos.push(`${sku} (${errProd.message})`); continue }
//       if (!prod) { fallos.push(`${sku} (ya no existe en inventario)`); continue }

//       const { error: errStock } = await supabase
//         .from('productos').update({ stock: prod.stock + d.cantidad }).eq('id', prod.id)
//       if (errStock) { fallos.push(`${sku} (no se pudo sumar el stock)`); continue }

//       const { error: errMov } = await supabase.from('movimientos_inventario').insert({
//         producto_id: prod.id,
//         usuario_id: usuarioId,
//         tipo_movimiento: 'ENTRADA',
//         cantidad: d.cantidad,
//         referencia: `Recepcion OC ${ordenSel.numero_orden}`
//       })
//       if (errMov) console.warn('[Gold Club] No se registro el movimiento de inventario:', errMov)

//       recibidos++
//     }

//     if (recibidos === 0) {
//       setRecibiendo(false)
//       setAviso(`No se pudo recibir ningun producto de la orden ${ordenSel.numero_orden}. Detalle: ${fallos.join('; ')}.`)
//       return
//     }

//     // La orden solo se marca como recibida si TODO entro; si algo fallo se deja
//     // pendiente para poder corregirlo y reintentar.
//     if (fallos.length === 0) {
//       const { error: errEstado } = await supabase
//         .from('ordenes_compra').update({ estado: 'recibida' }).eq('id', ordenSel.id)
//       if (errEstado) {
//         setRecibiendo(false)
//         setAviso(mensajeError(errEstado, 'marcar la orden como recibida') +
//           ' El stock si se actualizo; cambia el estado manualmente para no recibirla dos veces.')
//         return
//       }
//       setRecibiendo(false)
//       setModal('ok')
//     } else {
//       setRecibiendo(false)
//       setAviso(
//         `Se recibieron ${recibidos} de ${detalle.length} productos. La orden queda PENDIENTE. ` +
//         `No se pudo procesar: ${fallos.join('; ')}.`
//       )
//       setOrdenSel(null)
//       cargarOrdenes()
//     }
//   }

//   const pendientes = ordenes.filter(o => o.estado === 'pendiente')
//   const recibidas = ordenes.filter(o => o.estado === 'recibida')

//   return (
//     <Layout>
//       <div className="main-content">
//         <div className="flex-between mb-2">
//           <h1 className="page-title">Recepción de productos</h1>
//           <button className="btn btn-outline" onClick={() => navigate('/ventas')}>Volver</button>
//         </div>

//         <div className="card card-gold mb-2">
//           <div className="section-heading mb-2">Órdenes pendientes de recepción</div>
//           {cargando ? (
//             <div className="text-muted text-center py-4">Cargando órdenes...</div>
//           ) : pendientes.length === 0 ? (
//             <div className="text-muted text-center py-4">No hay órdenes pendientes de recepción.</div>
//           ) : (
//             <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
//               <thead>
//                 <tr style={{ borderBottom: '1px solid #3a3a3a', color: 'var(--text-muted)' }}>
//                   <th style={{ padding: 10, textAlign: 'left' }}>Nº Orden</th>
//                   <th style={{ padding: 10, textAlign: 'left' }}>Proveedor</th>
//                   <th style={{ padding: 10, textAlign: 'left' }}>Fecha</th>
//                   <th style={{ padding: 10, textAlign: 'center' }}>Estado</th>
//                   <th style={{ padding: 10, textAlign: 'center' }}>Acción</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {pendientes.map((o, idx) => (
//                   <tr key={o.id} style={{ borderBottom: idx < pendientes.length - 1 ? '1px solid #3a3a3a' : 'none' }}>
//                     <td style={{ padding: 10, color: 'var(--gold)' }}>{o.numero_orden}</td>
//                     <td style={{ padding: 10 }}>{o.proveedores?.nombre_empresa || 'Sin proveedor'}</td>
//                     <td style={{ padding: 10 }}>{new Date(o.creado_en).toLocaleDateString('es-DO')}</td>
//                     <td style={{ padding: 10, textAlign: 'center' }}>
//                       <span style={{ background: 'rgba(212,160,23,0.2)', color: 'var(--gold)', padding: '2px 10px', borderRadius: 12 }}>{o.estado}</span>
//                     </td>
//                     <td style={{ padding: 10, textAlign: 'center' }}>
//                       <button className="btn btn-gold" style={{ padding: '4px 14px', fontSize: 12 }}
//                         onClick={() => verDetalle(o)}>Ver</button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>

//         {/* Modal de detalle de orden */}
//         {ordenSel && (
//           <>
//             <div className="modal-overlay show" onClick={() => setOrdenSel(null)}>
//               <div className="modal-box" style={{ width: 500, textAlign: 'left' }} onClick={e => e.stopPropagation()}>
//                 <div className="modal-brand">
//                   Orden: <span style={{ color: 'var(--gold)' }}>{ordenSel.numero_orden}</span>
//                 </div>
//                 <div className="text-muted mb-2" style={{ fontSize: 13 }}>
//                   Proveedor: {ordenSel.proveedores?.nombre_empresa || 'Sin proveedor'}
//                 </div>
//                 {ordenSel.observaciones && (
//                   <div className="text-muted mb-2" style={{ fontSize: 13 }}>Obs: {ordenSel.observaciones}</div>
//                 )}
//                 <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 }}>
//                   <thead>
//                     <tr style={{ borderBottom: '1px solid #3a3a3a', color: 'var(--text-muted)' }}>
//                       <th style={{ padding: 6, textAlign: 'left' }}>Producto</th>
//                       <th style={{ padding: 6, textAlign: 'center' }}>Cant.</th>
//                       <th style={{ padding: 6, textAlign: 'right' }}>Subtotal</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {detalle.map((d, i) => (
//                       <tr key={i} style={{ borderBottom: '1px solid #3a3a3a' }}>
//                         <td style={{ padding: 6 }}>{d.productos?.nombre || '—'}</td>
//                         <td style={{ padding: 6, textAlign: 'center' }}>{d.cantidad}</td>
//                         <td style={{ padding: 6, textAlign: 'right' }}>${(d.subtotal || 0).toFixed(2)}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//                 {detalle.length === 0 && (
//                   <div className="text-muted mb-2" style={{ fontSize: 13 }}>
//                     Esta orden no tiene productos registrados.
//                   </div>
//                 )}
//                 <div className="modal-actions">
//                   <button className="btn btn-gold" onClick={handleRecibir} disabled={recibiendo || detalle.length === 0}>
//                     {recibiendo ? 'Recibiendo...' : 'Recibir y sumar al stock'}
//                   </button>
//                   <button className="btn btn-outline" onClick={() => setOrdenSel(null)}>Cancelar</button>
//                 </div>
//               </div>
//             </div>
//           </>
//         )}

//         <Modal show={modal === 'ok'} message="Productos recibidos correctamente. Stock actualizado."
//           actions={<button className="btn btn-gold" onClick={() => { setModal(null); setOrdenSel(null); cargarOrdenes() }}>&#10004; Aceptar</button>}/>
//         <Modal show={!!aviso} message={aviso}
//           actions={<button className="btn btn-gold" onClick={() => setAviso(null)}>&#10004; Entendido</button>}/>
//       </div>
//     </Layout>
//   )
// }



import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'
import { supabase, supabaseConfigurado, MENSAJE_SIN_CONFIGURAR } from '../../lib/supabase.js'
import { mensajeError } from '../../lib/errores.js'
import { usuarioIdValido, MENSAJE_SIN_USUARIO } from '../../lib/sesion.js'

// Mismo diccionario de estados que en OrdenCompra.jsx. Si cambias uno,
// cambia el otro tambien para que no queden desincronizados.
const ESTADOS_ORDEN = [
  { valor: 'cotizada', etiqueta: 'Cotizada' },
  { valor: 'pendiente', etiqueta: 'Pendiente' },
  { valor: 'aprobada', etiqueta: 'Aprobada' },
  { valor: 'en_camino', etiqueta: 'En camino' },
  { valor: 'recibida', etiqueta: 'Recibida' },
  { valor: 'cancelada', etiqueta: 'Cancelada' },
]
const ETIQUETA_ESTADO = Object.fromEntries(ESTADOS_ORDEN.map(e => [e.valor, e.etiqueta]))
// Una orden ya no aparece como "pendiente de recepcion" si esta recibida o cancelada.
const ESTADOS_FINALES = ['recibida', 'cancelada']

export default function Recepcion() {
  const navigate = useNavigate()
  const [ordenes, setOrdenes] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [recibiendo, setRecibiendo] = useState(false)
  const [ordenSel, setOrdenSel] = useState(null)
  const [detalle, setDetalle] = useState([])

  // 'lista' = pendientes de recepcion, 'papelera' = eliminadas, 'editar' = form
  const [vista, setVista] = useState('lista')
  const [busqueda, setBusqueda] = useState('')

  // Edicion de los datos generales de una orden (no de sus productos).
  const [editandoId, setEditandoId] = useState(null)
  const [formEdit, setFormEdit] = useState({ proveedor_id: '', estado: 'pendiente', fecha_estimada_llegada: '', observaciones: '' })
  const [guardandoEdit, setGuardandoEdit] = useState(false)

  // Confirmacion generica para borrar / reponer / eliminar definitivo.
  // { tipo: 'borrar' | 'reponer' | 'eliminar', orden } o null si no hay nada que confirmar.
  const [confirmando, setConfirmando] = useState(null)

  useEffect(() => {
    cargarOrdenes()
    cargarProveedores()
  }, [])

  const cargarOrdenes = async () => {
    if (!supabaseConfigurado) { setAviso(MENSAJE_SIN_CONFIGURAR); setCargando(false); return }
    setCargando(true)
    const { data, error } = await supabase
      .from('ordenes_compra')
      .select('id, numero_orden, estado, observaciones, creado_en, fecha_estimada_llegada, eliminado, proveedor_id, proveedores(nombre_empresa)')
      .order('id', { ascending: false })
    if (error) setAviso(mensajeError(error, 'cargar las ordenes de compra'))
    else setOrdenes(data || [])
    setCargando(false)
  }

  const cargarProveedores = async () => {
    if (!supabaseConfigurado) return
    const { data, error } = await supabase
      .from('proveedores').select('id,nombre_empresa').eq('activo', true).order('nombre_empresa')
    if (!error) setProveedores(data || [])
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

  // ---------- Editar datos generales de la orden ----------
  const irAEditar = (orden) => {
    setEditandoId(orden.id)
    setFormEdit({
      proveedor_id: orden.proveedor_id ? String(orden.proveedor_id) : '',
      estado: orden.estado || 'pendiente',
      fecha_estimada_llegada: orden.fecha_estimada_llegada ? orden.fecha_estimada_llegada.slice(0, 10) : '',
      observaciones: orden.observaciones || '',
    })
    setVista('editar')
  }

  const setEdit = (k) => (e) => setFormEdit(f => ({ ...f, [k]: e.target.value }))

  const handleGuardarEdicion = async () => {
    setGuardandoEdit(true)
    const { error } = await supabase.from('ordenes_compra').update({
      proveedor_id: formEdit.proveedor_id ? parseInt(formEdit.proveedor_id) : null,
      estado: formEdit.estado,
      fecha_estimada_llegada: formEdit.fecha_estimada_llegada || null,
      observaciones: formEdit.observaciones.trim() || null,
    }).eq('id', editandoId)
    setGuardandoEdit(false)

    if (error) { setAviso(mensajeError(error, 'actualizar la orden de compra')); return }

    setEditandoId(null)
    setVista('lista')
    cargarOrdenes()
  }

  // ---------- Borrar (a papelera), reponer, eliminar definitivo ----------
  const pedirConfirmacion = (tipo, orden) => setConfirmando({ tipo, orden })
  const cancelarConfirmacion = () => setConfirmando(null)

  const ejecutarConfirmacion = async () => {
    if (!confirmando) return
    const { tipo, orden } = confirmando

    if (tipo === 'borrar') {
      const { error } = await supabase.from('ordenes_compra').update({ eliminado: true }).eq('id', orden.id)
      if (error) { setAviso(mensajeError(error, 'mover la orden a la papelera')); setConfirmando(null); return }
    }

    if (tipo === 'reponer') {
      const { error } = await supabase.from('ordenes_compra').update({ eliminado: false }).eq('id', orden.id)
      if (error) { setAviso(mensajeError(error, 'restaurar la orden')); setConfirmando(null); return }
    }

    if (tipo === 'eliminar') {
      // Primero las lineas de detalle (FK), despues la orden. Si la orden ya
      // fue recibida, el stock que sumo NO se revierte: solo se borra el
      // registro de la orden, igual que "Eliminar definitivo" en Bajas no
      // devuelve el stock.
      const { error: errDet } = await supabase.from('detalle_orden_compra').delete().eq('orden_compra_id', orden.id)
      if (errDet) { setAviso(mensajeError(errDet, 'eliminar los productos de la orden')); setConfirmando(null); return }

      const { error: errOrden } = await supabase.from('ordenes_compra').delete().eq('id', orden.id)
      if (errOrden) { setAviso(mensajeError(errOrden, 'eliminar la orden definitivamente')); setConfirmando(null); return }
    }

    setConfirmando(null)
    cargarOrdenes()
  }

  const mensajeConfirmacion = () => {
    if (!confirmando) return ''
    const num = confirmando.orden.numero_orden
    if (confirmando.tipo === 'borrar') return `¿Deseas mover la orden ${num} a la papelera?`
    if (confirmando.tipo === 'reponer') return `¿Deseas restaurar la orden ${num} al historial?`
    if (confirmando.tipo === 'eliminar') return `¿Eliminar definitivamente la orden ${num}? Esta acción no se puede deshacer.`
    return ''
  }

  const activas = ordenes.filter(o => !o.eliminado)
  const eliminadas = ordenes.filter(o => o.eliminado)
  const pendientes = activas.filter(o => !ESTADOS_FINALES.includes(o.estado))

  const filtro = (lista) => lista.filter(o => {
    const t = busqueda.toLowerCase()
    return (o.numero_orden || '').toLowerCase().includes(t) ||
      (o.proveedores?.nombre_empresa || '').toLowerCase().includes(t)
  })

  const listaMostrada = vista === 'papelera' ? filtro(eliminadas) : filtro(pendientes)

  return (
    <Layout>
      <div className="main-content">
        {(vista === 'lista' || vista === 'papelera') && (
          <>
            <div className="flex-between mb-2">
              <h1 className="page-title">
                {vista === 'lista' ? 'Recepción de productos' : 'Órdenes eliminadas'}
              </h1>
              <div className="d-flex gap-2">
                {vista === 'lista' ? (
                  <button className="btn btn-outline" onClick={() => { setBusqueda(''); setVista('papelera') }}>
                    Ver eliminadas
                  </button>
                ) : (
                  <button className="btn btn-outline" onClick={() => { setBusqueda(''); setVista('lista') }}>
                    Volver a recepción
                  </button>
                )}
                <button className="btn btn-outline" onClick={() => navigate('/ventas')}>Volver</button>
              </div>
            </div>

            <div className="mb-2">
              <input className="form-control" type="text" placeholder="Buscar por numero de orden o proveedor..."
                value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            </div>

            <div className="card card-gold mb-2">
              <div className="section-heading mb-2">
                {vista === 'lista' ? 'Órdenes pendientes de recepción' : 'Papelera de órdenes'}
              </div>
              {cargando ? (
                <div className="text-muted text-center py-4">Cargando órdenes...</div>
              ) : listaMostrada.length === 0 ? (
                <div className="text-muted text-center py-4">
                  {vista === 'lista' ? 'No hay órdenes pendientes de recepción.' : 'No hay órdenes en la papelera.'}
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #3a3a3a', color: 'var(--text-muted)' }}>
                      <th style={{ padding: 10, textAlign: 'left' }}>Nº Orden</th>
                      <th style={{ padding: 10, textAlign: 'left' }}>Proveedor</th>
                      <th style={{ padding: 10, textAlign: 'left' }}>Fecha</th>
                      <th style={{ padding: 10, textAlign: 'left' }}>Llegada estimada</th>
                      <th style={{ padding: 10, textAlign: 'center' }}>Estado</th>
                      <th style={{ padding: 10, textAlign: 'center' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaMostrada.map((o, idx) => (
                      <tr key={o.id} style={{ borderBottom: idx < listaMostrada.length - 1 ? '1px solid #3a3a3a' : 'none' }}>
                        <td style={{ padding: 10, color: 'var(--gold)' }}>{o.numero_orden}</td>
                        <td style={{ padding: 10 }}>{o.proveedores?.nombre_empresa || 'Sin proveedor'}</td>
                        <td style={{ padding: 10 }}>{new Date(o.creado_en).toLocaleDateString('es-DO')}</td>
                        <td style={{ padding: 10 }}>
                          {o.fecha_estimada_llegada ? new Date(o.fecha_estimada_llegada).toLocaleDateString('es-DO') : '—'}
                        </td>
                        <td style={{ padding: 10, textAlign: 'center' }}>
                          <span style={{ background: 'rgba(212,160,23,0.2)', color: 'var(--gold)', padding: '2px 10px', borderRadius: 12 }}>
                            {ETIQUETA_ESTADO[o.estado] || o.estado}
                          </span>
                        </td>
                        <td style={{ padding: 10, textAlign: 'center' }}>
                          <div className="d-flex gap-2 justify-content-center">
                            {vista === 'lista' ? (
                              <>
                                <button className="btn btn-gold" style={{ padding: '4px 12px', fontSize: 12 }}
                                  onClick={() => verDetalle(o)}>Ver</button>
                                <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: 12 }}
                                  onClick={() => irAEditar(o)}>Editar</button>
                                <button className="btn btn-danger" style={{ padding: '4px 12px', fontSize: 12 }}
                                  onClick={() => pedirConfirmacion('borrar', o)}>Borrar</button>
                              </>
                            ) : (
                              <>
                                <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: 12 }}
                                  onClick={() => pedirConfirmacion('reponer', o)}>Reponer</button>
                                <button className="btn btn-danger" style={{ padding: '4px 12px', fontSize: 12 }}
                                  onClick={() => pedirConfirmacion('eliminar', o)}>Eliminar</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {vista === 'editar' && (
          <div className="card card-gold" style={{ maxWidth: 680, margin: '0 auto' }}>
            <div className="section-heading" style={{ marginTop: 0 }}>Editar orden de compra</div>

            <div className="form-group">
              <label>Proveedor:</label>
              <select className="form-control" value={formEdit.proveedor_id} onChange={setEdit('proveedor_id')}>
                <option value="">Sin proveedor</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre_empresa}</option>)}
              </select>
            </div>

            <div className="d-flex gap-2">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Estado de la orden:</label>
                <select className="form-control" value={formEdit.estado} onChange={setEdit('estado')}>
                  {ESTADOS_ORDEN.map(op => <option key={op.valor} value={op.valor}>{op.etiqueta}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Fecha estimada de llegada:</label>
                <input className="form-control" type="date" value={formEdit.fecha_estimada_llegada} onChange={setEdit('fecha_estimada_llegada')} />
              </div>
            </div>

            <div className="form-group">
              <label>Observaciones:</label>
              <input className="form-control" type="text" value={formEdit.observaciones} onChange={setEdit('observaciones')} />
            </div>

            <div className="text-center d-flex gap-2 justify-content-center">
              <button className="btn btn-gold" onClick={handleGuardarEdicion} disabled={guardandoEdit}>
                {guardandoEdit ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button className="btn btn-outline" onClick={() => { setEditandoId(null); setVista('lista') }}>Cancelar</button>
            </div>
          </div>
        )}

        {/* Modal de detalle de orden (para "Recibir y sumar al stock") */}
        {ordenSel && (
          <div className="modal-overlay show" onClick={() => setOrdenSel(null)}>
            <div className="modal-box" style={{ width: 500, textAlign: 'left' }} onClick={e => e.stopPropagation()}>
              <div className="modal-brand">
                Orden: <span style={{ color: 'var(--gold)' }}>{ordenSel.numero_orden}</span>
              </div>
              <div className="text-muted mb-2" style={{ fontSize: 13 }}>
                Proveedor: {ordenSel.proveedores?.nombre_empresa || 'Sin proveedor'}
              </div>
              <div className="text-muted mb-2" style={{ fontSize: 13 }}>
                Llegada estimada: {ordenSel.fecha_estimada_llegada ? new Date(ordenSel.fecha_estimada_llegada).toLocaleDateString('es-DO') : 'No especificada'}
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
        )}

        <Modal show={modal === 'ok'} message="Productos recibidos correctamente. Stock actualizado."
          actions={<button className="btn btn-gold" onClick={() => { setModal(null); setOrdenSel(null); cargarOrdenes() }}>&#10004; Aceptar</button>}/>
        <Modal show={!!aviso} message={aviso}
          actions={<button className="btn btn-gold" onClick={() => setAviso(null)}>&#10004; Entendido</button>}/>

        {/* Confirmacion unica para Borrar / Reponer / Eliminar definitivo */}
        <Modal show={!!confirmando} message={mensajeConfirmacion()}
          actions={
            <div className="d-flex gap-2">
              <button className="btn btn-outline" onClick={cancelarConfirmacion}>Cancelar</button>
              <button className="btn btn-danger" onClick={ejecutarConfirmacion}>
                {confirmando?.tipo === 'reponer' ? '✔ Reponer' : '✕ Confirmar'}
              </button>
            </div>
          }/>
      </div>
    </Layout>
  )
}
