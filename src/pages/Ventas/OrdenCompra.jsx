// import React, { useState, useEffect } from 'react'
// import { useNavigate } from 'react-router-dom'
// import Layout from '../../components/Layout.jsx'
// import Modal from '../../components/Modal.jsx'
// import { supabase, supabaseConfigurado, MENSAJE_SIN_CONFIGURAR } from '../../lib/supabase.js'
// import { mensajeError } from '../../lib/errores.js'
// import { usuarioIdValido, MENSAJE_SIN_USUARIO } from '../../lib/sesion.js'
// import { siguienteNumero } from '../../lib/ordenes.js'

// export default function OrdenCompra() {
//   const navigate = useNavigate()
//   const [proveedores, setProveedores] = useState([])
//   const [productos, setProductos] = useState([])
//   const [busqueda, setBusqueda] = useState('')
//   const [resultados, setResultados] = useState([])
//   const [mostrarLista, setMostrarLista] = useState(false)

//   const [items, setItems] = useState([])
//   const [proveedorId, setProveedorId] = useState('')
//   const [numOrden, setNumOrden] = useState('')
//   const [observaciones, setObservaciones] = useState('')
//   const [cargando, setCargando] = useState(false)

//   // Modales: 'ok' | null.  Los errores usan `aviso` para poder decir la causa
//   // real en lugar del antiguo "Ocurrio un error al generar la orden".
//   const [modal, setModal] = useState(null)
//   const [aviso, setAviso] = useState(null)

//   // Alta de proveedor sin salir de la pantalla (antes no habia forma de
//   // agregar un proveedor: solo se podia elegir "Sin proveedor").
//   const [mostrarNuevoProv, setMostrarNuevoProv] = useState(false)
//   const [nuevoProv, setNuevoProv] = useState({
//     nombre_empresa: '', contacto_nombre: '', telefono: '', correo: '', rnc: '',
//   })
//   const [guardandoProv, setGuardandoProv] = useState(false)

//   useEffect(() => {
//     cargarDatos()
//   }, [])

//   const cargarDatos = async () => {
//     if (!supabaseConfigurado) { setAviso(MENSAJE_SIN_CONFIGURAR); return }

//     const { data: provs, error: errProv } = await supabase
//       .from('proveedores').select('id,nombre_empresa').eq('activo', true).order('nombre_empresa')
//     if (errProv) { setAviso(mensajeError(errProv, 'cargar los proveedores')); return }
//     setProveedores(provs || [])

//     const { data: prods, error: errProd } = await supabase
//       .from('productos').select('id,nombre,codigo_sku,precio_compra,unidad_medida').eq('activo', true)
//     if (errProd) { setAviso(mensajeError(errProd, 'cargar los productos')); return }
//     setProductos(prods || [])

//     if (!prods || prods.length === 0) {
//       setAviso('No hay productos activos en el inventario. Crea al menos un producto en Inventario antes de generar una orden de compra.')
//     }

//     // Numero de orden sugerido y consecutivo. La orden de preparacion, la nota
//     // de despacho y el reporte de incidentes lo usan como referencia, asi que
//     // no puede quedar vacio ni escribirse a mano de cualquier manera.
//     const sugerido = await siguienteNumero('ordenes_compra', 'numero_orden', 'OC')
//     setNumOrden((actual) => actual || sugerido)
//   }

//   const buscarProducto = (texto) => {
//     setBusqueda(texto)
//     if (texto.trim().length < 1) { setResultados([]); setMostrarLista(false); return }
//     const t = texto.toLowerCase()
//     const filtrados = productos.filter(p =>
//       (p.codigo_sku || '').toLowerCase().includes(t) ||
//       (p.nombre || '').toLowerCase().includes(t)
//     ).slice(0, 8)
//     setResultados(filtrados)
//     setMostrarLista(true)
//   }

//   const agregarItem = (prod) => {
//     const existe = items.find(i => i.producto_id === prod.id)
//     if (existe) {
//       setItems(items.map(i => i.producto_id === prod.id ? { ...i, cantidad: (parseInt(i.cantidad) || 0) + 1 } : i))
//     } else {
//       setItems([...items, {
//         producto_id: prod.id,
//         nombre: prod.nombre,
//         codigo_sku: prod.codigo_sku,
//         precio_unitario: parseFloat(prod.precio_compra) || 0,
//         cantidad: 1
//       }])
//     }
//     setBusqueda('')
//     setResultados([])
//     setMostrarLista(false)
//   }

//   const actualizarItem = (id, campo, valor) => {
//     setItems(items.map(i => i.producto_id === id ? { ...i, [campo]: valor } : i))
//   }

//   const removerItem = (id) => setItems(items.filter(i => i.producto_id !== id))

//   const total = items.reduce((sum, i) => sum + ((parseFloat(i.precio_unitario) || 0) * (parseInt(i.cantidad) || 0)), 0)

//   const guardarProveedor = async () => {
//     if (!nuevoProv.nombre_empresa.trim()) {
//       setAviso('El nombre de la empresa del proveedor es obligatorio.')
//       return
//     }
//     setGuardandoProv(true)

//     const { data, error } = await supabase.from('proveedores').insert({
//       nombre_empresa: nuevoProv.nombre_empresa.trim(),
//       contacto_nombre: nuevoProv.contacto_nombre.trim() || null,
//       telefono: nuevoProv.telefono.trim() || null,
//       correo: nuevoProv.correo.trim() || null,
//       rnc: nuevoProv.rnc.trim() || null,
//       activo: true,
//     }).select('id,nombre_empresa').single()

//     setGuardandoProv(false)

//     if (error) { setAviso(mensajeError(error, 'guardar el proveedor')); return }

//     setProveedores(prev => [...prev, data].sort((a, b) => a.nombre_empresa.localeCompare(b.nombre_empresa)))
//     setProveedorId(String(data.id))          // queda seleccionado al instante
//     setNuevoProv({ nombre_empresa: '', contacto_nombre: '', telefono: '', correo: '', rnc: '' })
//     setMostrarNuevoProv(false)
//   }

//   const handleConfirmar = async () => {
//     if (!supabaseConfigurado) { setAviso(MENSAJE_SIN_CONFIGURAR); return }
//     if (!numOrden.trim()) { setAviso('Debe ingresar un numero de orden.'); return }
//     if (items.length === 0) { setAviso('Debe agregar al menos un producto a la orden.'); return }

//     // Validacion de las lineas antes de tocar la base de datos.
//     // Antes se podia guardar cantidad 0 o negativa, y la orden quedaba inutil
//     // para la recepcion y para la orden de preparacion.
//     for (const i of items) {
//       const cant = parseInt(i.cantidad)
//       const precio = parseFloat(i.precio_unitario)
//       if (!Number.isFinite(cant) || cant < 1) {
//         setAviso(`La cantidad de "${i.nombre}" debe ser un numero entero de 1 o mas.`)
//         return
//       }
//       if (!Number.isFinite(precio) || precio < 0) {
//         setAviso(`El precio de "${i.nombre}" no es valido.`)
//         return
//       }
//     }

//     setCargando(true)

//     // usuario_id es NOT NULL con FOREIGN KEY a usuarios(id). Antes estaba fijo
//     // en 1: si ese usuario no existia, PostgreSQL devolvia el error 23503 y la
//     // pantalla solo decia "Ocurrio un error al generar la orden".
//     const usuarioId = await usuarioIdValido()
//     if (usuarioId == null) {
//       setAviso(MENSAJE_SIN_USUARIO)
//       setCargando(false)
//       return
//     }

//     const numero = numOrden.trim()

//     const { data: existeOrden, error: errBusca } = await supabase
//       .from('ordenes_compra').select('id').eq('numero_orden', numero)
//     if (errBusca) {
//       setAviso(mensajeError(errBusca, 'verificar el numero de orden'))
//       setCargando(false)
//       return
//     }
//     if (existeOrden && existeOrden.length > 0) {
//       const libre = await siguienteNumero('ordenes_compra', 'numero_orden', 'OC')
//       setAviso(`Ya existe una orden de compra con el numero ${numero}. Puedes usar ${libre}.`)
//       setNumOrden(libre)
//       setCargando(false)
//       return
//     }

//     const { data: ordenData, error: ordenError } = await supabase.from('ordenes_compra').insert({
//       proveedor_id: proveedorId ? parseInt(proveedorId) : null,
//       usuario_id: usuarioId,
//       numero_orden: numero,
//       estado: 'pendiente',
//       observaciones: observaciones.trim() || null
//     }).select('id').single()

//     if (ordenError || !ordenData) {
//       setAviso(mensajeError(ordenError, 'generar la orden de compra'))
//       setCargando(false)
//       return
//     }
//     const ordenId = ordenData.id

//     const detalles = items.map(i => ({
//       orden_compra_id: ordenId,
//       producto_id: i.producto_id,
//       cantidad: parseInt(i.cantidad),
//       precio_unitario: parseFloat(i.precio_unitario) || 0,
//       subtotal: (parseFloat(i.precio_unitario) || 0) * (parseInt(i.cantidad) || 0)
//     }))

//     const { error: errDetalle } = await supabase.from('detalle_orden_compra').insert(detalles)

//     if (errDetalle) {
//       // Sin esto quedaba una orden "pendiente" SIN productos: aparecia en
//       // Recepcion, se podia "recibir" y no sumaba nada al stock.
//       await supabase.from('ordenes_compra').delete().eq('id', ordenId)
//       setAviso(mensajeError(errDetalle, 'guardar los productos de la orden') +
//         ' La orden se cancelo para no dejarla vacia.')
//       setCargando(false)
//       return
//     }

//     // Trazabilidad (Guia Tecnica, seccion 67). Si falla no bloqueamos la orden.
//     const { error: errAudit } = await supabase.from('auditoria').insert({
//       usuario_id: usuarioId,
//       tabla_afectada: 'ordenes_compra',
//       accion: 'INSERT',
//       registro_id: ordenId,
//       descripcion: `Orden de compra ${numero} con ${detalles.length} producto(s), total ${total.toFixed(2)}`,
//     })
//     if (errAudit) console.warn('[Gold Club] No se pudo registrar en auditoria:', errAudit)

//     setCargando(false)
//     setModal('ok')
//   }

//   const setProv = (k) => (e) => setNuevoProv(p => ({ ...p, [k]: e.target.value }))

//   return (
//     <Layout>
//       <div className="main-content">
//         <div className="flex-between mb-2">
//           <h1 className="page-title">Orden de compra / Pedir productos</h1>
//           <button className="btn btn-outline" onClick={() => navigate('/ventas')}>Volver</button>
//         </div>

//         <div className="card card-gold mb-2">
//           <div className="section-heading" style={{ marginTop: 0 }}>Datos de la orden</div>
//           <div className="form-group">
//             <label>N&ordm; de orden:</label>
//             <input className="form-control" type="text" placeholder="Ej: OC-00001"
//               value={numOrden} onChange={e => setNumOrden(e.target.value)} />
//             <small className="text-muted">
//               Numero sugerido automaticamente. Este es el numero que despues se usa en la
//               orden de preparacion, la nota de despacho y el reporte de incidentes.
//             </small>
//           </div>

//           <div className="form-group">
//             <label>Proveedor:</label>
//             <div className="d-flex gap-2">
//               <select className="form-control" value={proveedorId} onChange={e => setProveedorId(e.target.value)}>
//                 <option value="">Sin proveedor</option>
//                 {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre_empresa}</option>)}
//               </select>
//               <button type="button" className="btn btn-outline" style={{ whiteSpace: 'nowrap' }}
//                 onClick={() => setMostrarNuevoProv(v => !v)}>
//                 {mostrarNuevoProv ? 'Cancelar' : '+ Nuevo proveedor'}
//               </button>
//             </div>
//           </div>

//           {mostrarNuevoProv && (
//             <div className="card mb-2" style={{ border: '1px solid var(--gold)' }}>
//               <div className="section-heading" style={{ marginTop: 0 }}>Registrar proveedor</div>
//               <div className="form-group">
//                 <label>Nombre de la empresa: *</label>
//                 <input className="form-control" type="text" placeholder="Ej: Distribuidora del Norte SRL"
//                   value={nuevoProv.nombre_empresa} onChange={setProv('nombre_empresa')} />
//               </div>
//               <div className="form-group">
//                 <label>Persona de contacto:</label>
//                 <input className="form-control" type="text" placeholder="Ej: Carlos De Jesus"
//                   value={nuevoProv.contacto_nombre} onChange={setProv('contacto_nombre')} />
//               </div>
//               <div className="form-group">
//                 <label>Telefono:</label>
//                 <input className="form-control" type="text" placeholder="Ej: 809-000-0000"
//                   value={nuevoProv.telefono} onChange={setProv('telefono')} />
//               </div>
//               <div className="form-group">
//                 <label>Correo:</label>
//                 <input className="form-control" type="email" placeholder="Ej: ventas@proveedor.com"
//                   value={nuevoProv.correo} onChange={setProv('correo')} />
//               </div>
//               <div className="form-group">
//                 <label>RNC:</label>
//                 <input className="form-control" type="text" placeholder="Ej: 130123456"
//                   value={nuevoProv.rnc} onChange={setProv('rnc')} />
//               </div>
//               <div className="text-center">
//                 <button type="button" className="btn btn-gold" onClick={guardarProveedor} disabled={guardandoProv}>
//                   {guardandoProv ? 'Guardando...' : 'Guardar proveedor'}
//                 </button>
//               </div>
//             </div>
//           )}

//           <div className="form-group">
//             <label>Observaciones:</label>
//             <input className="form-control" type="text" placeholder="Ej: Urgente para fin de mes"
//               value={observaciones} onChange={e => setObservaciones(e.target.value)} />
//           </div>
//         </div>

//         {/* Buscador de productos */}
//         <div className="card card-gold mb-2" style={{ position: 'relative' }}>
//           <div className="section-heading" style={{ marginTop: 0 }}>Agregar productos a la orden</div>
//           <div className="search-bar" style={{ maxWidth: '100%' }}>
//             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//               <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
//             </svg>
//             <input type="text" placeholder="Buscar por codigo o nombre de producto..."
//               value={busqueda} onChange={e => buscarProducto(e.target.value)}
//               onFocus={() => resultados.length > 0 && setMostrarLista(true)} />
//           </div>

//           {mostrarLista && resultados.length === 0 && busqueda.trim() && (
//             <div className="text-muted mt-2" style={{ fontSize: 13 }}>
//               Ningun producto coincide con "{busqueda}".
//             </div>
//           )}

//           {mostrarLista && resultados.length > 0 && (
//             <ul className="sidebar-list" style={{ position: 'absolute', zIndex: 50, left: 24, right: 24, marginTop: 4, background: 'var(--bg-card)', borderRadius: 8, padding: 12, border: '1px solid var(--gold)' }}>
//               {resultados.map(p => (
//                 <li key={p.id} onClick={() => agregarItem(p)}>
//                   <span><code>{p.codigo_sku}</code> &mdash; {p.nombre} (${p.precio_compra})</span>
//                   <span className="sidebar-arrow">+ Agregar</span>
//                 </li>
//               ))}
//             </ul>
//           )}
//         </div>

//         {/* Tabla de items */}
//         {items.length > 0 && (
//           <div className="card mb-2">
//             <div className="section-heading">Detalle de la orden de compra</div>
//             <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
//               <thead>
//                 <tr style={{ borderBottom: '1px solid #3a3a3a', color: 'var(--text-muted)' }}>
//                   <th style={{ padding: 10, textAlign: 'left' }}>Codigo</th>
//                   <th style={{ padding: 10, textAlign: 'left' }}>Producto</th>
//                   <th style={{ padding: 10, textAlign: 'center' }}>Cant.</th>
//                   <th style={{ padding: 10, textAlign: 'right' }}>Precio</th>
//                   <th style={{ padding: 10, textAlign: 'right' }}>Subtotal</th>
//                   <th style={{ padding: 10, textAlign: 'center' }}></th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {items.map((i, idx) => (
//                   <tr key={i.producto_id} style={{ borderBottom: idx < items.length - 1 ? '1px solid #3a3a3a' : 'none' }}>
//                     <td style={{ padding: 10, color: 'var(--gold)' }}>{i.codigo_sku}</td>
//                     <td style={{ padding: 10 }}>{i.nombre}</td>
//                     <td style={{ padding: 10, textAlign: 'center' }}>
//                       <input type="number" min="1" step="1" value={i.cantidad}
//                         style={{ width: 60, background: 'var(--bg-input)', border: '1px solid #555', borderRadius: 4, color: 'var(--text)', padding: '4px 8px', textAlign: 'center' }}
//                         onChange={e => actualizarItem(i.producto_id, 'cantidad', e.target.value)} />
//                     </td>
//                     <td style={{ padding: 10, textAlign: 'right' }}>
//                       <input type="number" step="0.01" min="0" value={i.precio_unitario}
//                         style={{ width: 80, background: 'var(--bg-input)', border: '1px solid #555', borderRadius: 4, color: 'var(--text)', padding: '4px 8px', textAlign: 'right' }}
//                         onChange={e => actualizarItem(i.producto_id, 'precio_unitario', e.target.value)} />
//                     </td>
//                     <td style={{ padding: 10, textAlign: 'right', fontWeight: 'bold', color: 'var(--gold)' }}>
//                       ${((parseFloat(i.precio_unitario) || 0) * (parseInt(i.cantidad) || 0)).toFixed(2)}
//                     </td>
//                     <td style={{ padding: 10, textAlign: 'center' }}>
//                       <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }}
//                         onClick={() => removerItem(i.producto_id)}>&#10005;</button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//               <tfoot>
//                 <tr style={{ borderTop: '2px solid var(--gold)' }}>
//                   <td colSpan="4" style={{ padding: 12, textAlign: 'right', fontWeight: 700, fontSize: 15 }}>TOTAL:</td>
//                   <td style={{ padding: 12, textAlign: 'right', fontWeight: 700, fontSize: 18, color: 'var(--gold)' }}>${total.toFixed(2)}</td>
//                   <td></td>
//                 </tr>
//               </tfoot>
//             </table>
//           </div>
//         )}

//         <div className="text-center mt-3">
//           <button className="btn btn-gold" onClick={handleConfirmar} disabled={cargando}>
//             {cargando ? 'Procesando...' : 'Generar orden de compra'}
//           </button>
//         </div>
//       </div>

//       <Modal show={modal === 'ok'}
//         message={`Orden de compra ${numOrden} generada con exito. Ya puedes recibirla en Recepcion de productos y usar su numero en los documentos.`}
//         actions={<button className="btn btn-gold" onClick={() => navigate('/ventas')}>&#10004; Aceptar</button>}/>

//       <Modal show={!!aviso} message={aviso}
//         actions={<button className="btn btn-gold" onClick={() => setAviso(null)}>&#10004; Entendido</button>}/>
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
import { siguienteNumero } from '../../lib/ordenes.js'

// Estados posibles de una orden de compra. El valor es lo que se guarda en
// Supabase (columna "estado"); la etiqueta es lo que ve el usuario.
export const ESTADOS_ORDEN = [
  { valor: 'cotizada', etiqueta: 'Cotizada' },
  { valor: 'pendiente', etiqueta: 'Pendiente' },
  { valor: 'aprobada', etiqueta: 'Aprobada' },
  { valor: 'en_camino', etiqueta: 'En camino' },
  { valor: 'recibida', etiqueta: 'Recibida' },
  { valor: 'cancelada', etiqueta: 'Cancelada' },
]

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
  const [cargando, setCargando] = useState(false)

  // --- Nuevo: fecha estimada de llegada y estado de la orden ---
  const [fechaEstimada, setFechaEstimada] = useState('')
  const [estado, setEstado] = useState('cotizada')

  // Modales: 'ok' | null.  Los errores usan `aviso` para poder decir la causa
  // real en lugar del antiguo "Ocurrio un error al generar la orden".
  const [modal, setModal] = useState(null)
  const [aviso, setAviso] = useState(null)

  // --- Nuevo: confirmacion antes de eliminar un producto de la orden ---
  // Guarda el id del producto que se quiere quitar; si es null, no hay
  // ningun modal de confirmacion abierto.
  const [itemAEliminar, setItemAEliminar] = useState(null)

  // Alta de proveedor sin salir de la pantalla (antes no habia forma de
  // agregar un proveedor: solo se podia elegir "Sin proveedor").
  const [mostrarNuevoProv, setMostrarNuevoProv] = useState(false)
  const [nuevoProv, setNuevoProv] = useState({
    nombre_empresa: '', contacto_nombre: '', telefono: '', correo: '', rnc: '',
  })
  const [guardandoProv, setGuardandoProv] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    if (!supabaseConfigurado) { setAviso(MENSAJE_SIN_CONFIGURAR); return }

    const { data: provs, error: errProv } = await supabase
      .from('proveedores').select('id,nombre_empresa').eq('activo', true).order('nombre_empresa')
    if (errProv) { setAviso(mensajeError(errProv, 'cargar los proveedores')); return }
    setProveedores(provs || [])

    const { data: prods, error: errProd } = await supabase
      .from('productos').select('id,nombre,codigo_sku,precio_compra,unidad_medida').eq('activo', true)
    if (errProd) { setAviso(mensajeError(errProd, 'cargar los productos')); return }
    setProductos(prods || [])

    if (!prods || prods.length === 0) {
      setAviso('No hay productos activos en el inventario. Crea al menos un producto en Inventario antes de generar una orden de compra.')
    }

    // Numero de orden sugerido y consecutivo. La orden de preparacion, la nota
    // de despacho y el reporte de incidentes lo usan como referencia, asi que
    // no puede quedar vacio ni escribirse a mano de cualquier manera.
    const sugerido = await siguienteNumero('ordenes_compra', 'numero_orden', 'OC')
    setNumOrden((actual) => actual || sugerido)
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
      setItems(items.map(i => i.producto_id === prod.id ? { ...i, cantidad: (parseInt(i.cantidad) || 0) + 1 } : i))
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

  // --- Nuevo: flujo de confirmacion para eliminar un producto ---
  // El boton de la fila ya no borra directo: solo abre el modal de aviso.
  const pedirConfirmacionEliminar = (id) => setItemAEliminar(id)
  const cancelarEliminar = () => setItemAEliminar(null)
  const confirmarEliminar = () => {
    if (itemAEliminar != null) removerItem(itemAEliminar)
    setItemAEliminar(null)
  }
  const nombreItemAEliminar = items.find(i => i.producto_id === itemAEliminar)?.nombre

  const total = items.reduce((sum, i) => sum + ((parseFloat(i.precio_unitario) || 0) * (parseInt(i.cantidad) || 0)), 0)

  const guardarProveedor = async () => {
    if (!nuevoProv.nombre_empresa.trim()) {
      setAviso('El nombre de la empresa del proveedor es obligatorio.')
      return
    }
    setGuardandoProv(true)

    const { data, error } = await supabase.from('proveedores').insert({
      nombre_empresa: nuevoProv.nombre_empresa.trim(),
      contacto_nombre: nuevoProv.contacto_nombre.trim() || null,
      telefono: nuevoProv.telefono.trim() || null,
      correo: nuevoProv.correo.trim() || null,
      rnc: nuevoProv.rnc.trim() || null,
      activo: true,
    }).select('id,nombre_empresa').single()

    setGuardandoProv(false)

    if (error) { setAviso(mensajeError(error, 'guardar el proveedor')); return }

    setProveedores(prev => [...prev, data].sort((a, b) => a.nombre_empresa.localeCompare(b.nombre_empresa)))
    setProveedorId(String(data.id))          // queda seleccionado al instante
    setNuevoProv({ nombre_empresa: '', contacto_nombre: '', telefono: '', correo: '', rnc: '' })
    setMostrarNuevoProv(false)
  }

  const handleConfirmar = async () => {
    if (!supabaseConfigurado) { setAviso(MENSAJE_SIN_CONFIGURAR); return }
    if (!numOrden.trim()) { setAviso('Debe ingresar un numero de orden.'); return }
    if (items.length === 0) { setAviso('Debe agregar al menos un producto a la orden.'); return }

    // Validacion de las lineas antes de tocar la base de datos.
    // Antes se podia guardar cantidad 0 o negativa, y la orden quedaba inutil
    // para la recepcion y para la orden de preparacion.
    for (const i of items) {
      const cant = parseInt(i.cantidad)
      const precio = parseFloat(i.precio_unitario)
      if (!Number.isFinite(cant) || cant < 1) {
        setAviso(`La cantidad de "${i.nombre}" debe ser un numero entero de 1 o mas.`)
        return
      }
      if (!Number.isFinite(precio) || precio < 0) {
        setAviso(`El precio de "${i.nombre}" no es valido.`)
        return
      }
    }

    setCargando(true)

    // usuario_id es NOT NULL con FOREIGN KEY a usuarios(id). Antes estaba fijo
    // en 1: si ese usuario no existia, PostgreSQL devolvia el error 23503 y la
    // pantalla solo decia "Ocurrio un error al generar la orden".
    const usuarioId = await usuarioIdValido()
    if (usuarioId == null) {
      setAviso(MENSAJE_SIN_USUARIO)
      setCargando(false)
      return
    }

    const numero = numOrden.trim()

    const { data: existeOrden, error: errBusca } = await supabase
      .from('ordenes_compra').select('id').eq('numero_orden', numero)
    if (errBusca) {
      setAviso(mensajeError(errBusca, 'verificar el numero de orden'))
      setCargando(false)
      return
    }
    if (existeOrden && existeOrden.length > 0) {
      const libre = await siguienteNumero('ordenes_compra', 'numero_orden', 'OC')
      setAviso(`Ya existe una orden de compra con el numero ${numero}. Puedes usar ${libre}.`)
      setNumOrden(libre)
      setCargando(false)
      return
    }

    const { data: ordenData, error: ordenError } = await supabase.from('ordenes_compra').insert({
      proveedor_id: proveedorId ? parseInt(proveedorId) : null,
      usuario_id: usuarioId,
      numero_orden: numero,
      estado: estado,
      fecha_estimada_llegada: fechaEstimada || null,
      observaciones: observaciones.trim() || null
    }).select('id').single()

    if (ordenError || !ordenData) {
      setAviso(mensajeError(ordenError, 'generar la orden de compra'))
      setCargando(false)
      return
    }
    const ordenId = ordenData.id

    const detalles = items.map(i => ({
      orden_compra_id: ordenId,
      producto_id: i.producto_id,
      cantidad: parseInt(i.cantidad),
      precio_unitario: parseFloat(i.precio_unitario) || 0,
      subtotal: (parseFloat(i.precio_unitario) || 0) * (parseInt(i.cantidad) || 0)
    }))

    const { error: errDetalle } = await supabase.from('detalle_orden_compra').insert(detalles)

    if (errDetalle) {
      // Sin esto quedaba una orden "pendiente" SIN productos: aparecia en
      // Recepcion, se podia "recibir" y no sumaba nada al stock.
      await supabase.from('ordenes_compra').delete().eq('id', ordenId)
      setAviso(mensajeError(errDetalle, 'guardar los productos de la orden') +
        ' La orden se cancelo para no dejarla vacia.')
      setCargando(false)
      return
    }

    // Trazabilidad (Guia Tecnica, seccion 67). Si falla no bloqueamos la orden.
    const { error: errAudit } = await supabase.from('auditoria').insert({
      usuario_id: usuarioId,
      tabla_afectada: 'ordenes_compra',
      accion: 'INSERT',
      registro_id: ordenId,
      descripcion: `Orden de compra ${numero} con ${detalles.length} producto(s), total ${total.toFixed(2)}`,
    })
    if (errAudit) console.warn('[Gold Club] No se pudo registrar en auditoria:', errAudit)

    setCargando(false)
    setModal('ok')
  }

  const setProv = (k) => (e) => setNuevoProv(p => ({ ...p, [k]: e.target.value }))

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
            <label>N&ordm; de orden:</label>
            <input className="form-control" type="text" placeholder="Ej: OC-00001"
              value={numOrden} onChange={e => setNumOrden(e.target.value)} />
            <small className="text-muted">
              Numero sugerido automaticamente. Este es el numero que despues se usa en la
              orden de preparacion, la nota de despacho y el reporte de incidentes.
            </small>
          </div>

          <div className="form-group">
            <label>Proveedor:</label>
            <div className="d-flex gap-2">
              <select className="form-control" value={proveedorId} onChange={e => setProveedorId(e.target.value)}>
                <option value="">Sin proveedor</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre_empresa}</option>)}
              </select>
              <button type="button" className="btn btn-outline" style={{ whiteSpace: 'nowrap' }}
                onClick={() => setMostrarNuevoProv(v => !v)}>
                {mostrarNuevoProv ? 'Cancelar' : '+ Nuevo proveedor'}
              </button>
            </div>
          </div>

          {mostrarNuevoProv && (
            <div className="card mb-2" style={{ border: '1px solid var(--gold)' }}>
              <div className="section-heading" style={{ marginTop: 0 }}>Registrar proveedor</div>
              <div className="form-group">
                <label>Nombre de la empresa: *</label>
                <input className="form-control" type="text" placeholder="Ej: Distribuidora del Norte SRL"
                  value={nuevoProv.nombre_empresa} onChange={setProv('nombre_empresa')} />
              </div>
              <div className="form-group">
                <label>Persona de contacto:</label>
                <input className="form-control" type="text" placeholder="Ej: Carlos De Jesus"
                  value={nuevoProv.contacto_nombre} onChange={setProv('contacto_nombre')} />
              </div>
              <div className="form-group">
                <label>Telefono:</label>
                <input className="form-control" type="text" placeholder="Ej: 809-000-0000"
                  value={nuevoProv.telefono} onChange={setProv('telefono')} />
              </div>
              <div className="form-group">
                <label>Correo:</label>
                <input className="form-control" type="email" placeholder="Ej: ventas@proveedor.com"
                  value={nuevoProv.correo} onChange={setProv('correo')} />
              </div>
              <div className="form-group">
                <label>RNC:</label>
                <input className="form-control" type="text" placeholder="Ej: 130123456"
                  value={nuevoProv.rnc} onChange={setProv('rnc')} />
              </div>
              <div className="text-center">
                <button type="button" className="btn btn-gold" onClick={guardarProveedor} disabled={guardandoProv}>
                  {guardandoProv ? 'Guardando...' : 'Guardar proveedor'}
                </button>
              </div>
            </div>
          )}

          {/* Nuevo: estado de la orden y fecha estimada de llegada, uno junto al otro */}
          <div className="d-flex gap-2">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Estado de la orden:</label>
              <select className="form-control" value={estado} onChange={e => setEstado(e.target.value)}>
                {ESTADOS_ORDEN.map(op => (
                  <option key={op.valor} value={op.valor}>{op.etiqueta}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Fecha estimada de llegada:</label>
              <input className="form-control" type="date"
                value={fechaEstimada} onChange={e => setFechaEstimada(e.target.value)} />
              <small className="text-muted">Opcional. Cuando se espera recibir la orden.</small>
            </div>
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
            <input type="text" placeholder="Buscar por codigo o nombre de producto..."
              value={busqueda} onChange={e => buscarProducto(e.target.value)}
              onFocus={() => resultados.length > 0 && setMostrarLista(true)} />
          </div>

          {mostrarLista && resultados.length === 0 && busqueda.trim() && (
            <div className="text-muted mt-2" style={{ fontSize: 13 }}>
              Ningun producto coincide con "{busqueda}".
            </div>
          )}

          {mostrarLista && resultados.length > 0 && (
            <ul className="sidebar-list" style={{ position: 'absolute', zIndex: 50, left: 24, right: 24, marginTop: 4, background: 'var(--bg-card)', borderRadius: 8, padding: 12, border: '1px solid var(--gold)' }}>
              {resultados.map(p => (
                <li key={p.id} onClick={() => agregarItem(p)}>
                  <span><code>{p.codigo_sku}</code> &mdash; {p.nombre} (${p.precio_compra})</span>
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
                  <th style={{ padding: 10, textAlign: 'left' }}>Codigo</th>
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
                      <input type="number" min="1" step="1" value={i.cantidad}
                        style={{ width: 60, background: 'var(--bg-input)', border: '1px solid #555', borderRadius: 4, color: 'var(--text)', padding: '4px 8px', textAlign: 'center' }}
                        onChange={e => actualizarItem(i.producto_id, 'cantidad', e.target.value)} />
                    </td>
                    <td style={{ padding: 10, textAlign: 'right' }}>
                      <input type="number" step="0.01" min="0" value={i.precio_unitario}
                        style={{ width: 80, background: 'var(--bg-input)', border: '1px solid #555', borderRadius: 4, color: 'var(--text)', padding: '4px 8px', textAlign: 'right' }}
                        onChange={e => actualizarItem(i.producto_id, 'precio_unitario', e.target.value)} />
                    </td>
                    <td style={{ padding: 10, textAlign: 'right', fontWeight: 'bold', color: 'var(--gold)' }}>
                      ${((parseFloat(i.precio_unitario) || 0) * (parseInt(i.cantidad) || 0)).toFixed(2)}
                    </td>
                    <td style={{ padding: 10, textAlign: 'center' }}>
                      <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={() => pedirConfirmacionEliminar(i.producto_id)}>&#10005;</button>
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

      <Modal show={modal === 'ok'}
        message={`Orden de compra ${numOrden} generada con exito. Ya puedes recibirla en Recepcion de productos y usar su numero en los documentos.`}
        actions={<button className="btn btn-gold" onClick={() => navigate('/ventas')}>&#10004; Aceptar</button>}/>

      <Modal show={!!aviso} message={aviso}
        actions={<button className="btn btn-gold" onClick={() => setAviso(null)}>&#10004; Entendido</button>}/>

      {/* Nuevo: confirmacion antes de quitar un producto de la orden */}
      <Modal show={itemAEliminar != null}
        message={`¿Deseas quitar "${nombreItemAEliminar}" de la orden de compra?`}
        actions={
          <div className="d-flex gap-2">
            <button className="btn btn-outline" onClick={cancelarEliminar}>Cancelar</button>
            <button className="btn btn-danger" onClick={confirmarEliminar}>&#10005; Eliminar</button>
          </div>
        }/>
    </Layout>
  )
}
