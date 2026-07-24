// import React, { useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import Layout from '../../components/Layout.jsx'
// import Modal from '../../components/Modal.jsx'

// export default function OrdenPreparacion() {
//   const navigate = useNavigate()
  
//   const [form, setForm] = useState({ 
//     numOrden: '', 
//     codigo: '', 
//     cantidad: '', 
//     destino: '', 
//     creadoPor: 'Juan Pérez' 
//   })
//   const [modal, setModal] = useState(null)
  
//   const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

//   return (
//     <Layout>
//       <div className="main-content">
//         <div className="card card-gold" style={{maxWidth:680}}>
//           <div className="section-heading" style={{marginTop:0}}>Orden de preparación</div>
          
//           <div className="form-group">
//             <label>Número de orden:</label>
//             <input 
//               className="form-control" 
//               type="text" 
//               placeholder="Ej: 24" 
//               value={form.numOrden} 
//               onChange={set('numOrden')}
//             />
//           </div>
          
//           <div className="form-group">
//             <label>Código del producto:</label>
//             <input 
//               className="form-control" 
//               type="text" 
//               placeholder="Ej: 283940003" 
//               value={form.codigo} 
//               onChange={set('codigo')}
//             />
//           </div>
          
//           <div className="form-group">
//             <label>Cantidad a despachar:</label>
//             <input 
//               className="form-control" 
//               type="number" 
//               placeholder="Ej: 8" 
//               value={form.cantidad} 
//               onChange={set('cantidad')}
//             />
//           </div>
          
//           <div className="form-group">
//             <label>Destino del pedido:</label>
//             <input 
//               className="form-control" 
//               type="text" 
//               placeholder="Ej: C/ 27 de febrero, Tenares, centro del pueblo" 
//               value={form.destino} 
//               onChange={set('destino')}
//             />
//           </div>
          
//           <div className="section-heading">Detalles de autoría</div>
          
//           <div className="form-group">
//             <label>Creado por:</label>
//             <input 
//               className="form-control" 
//               type="text" 
//               value={form.creadoPor} 
//               readOnly
//             />
//           </div>
          
//           <div className="mt-3 text-center">
//             <button className="btn btn-gold" onClick={() => setModal('ok')}>Generar orden de preparación</button>
//           </div>
//         </div>
//       </div>
      
//       <Modal show={modal === 'ok'} message="Orden de preparación generada con éxito."
//         actions={<button className="btn btn-gold" onClick={() => navigate('/documentos')}>✔ Aceptar</button>}/>
//     </Layout>
//   )
// }

//------------------------------------------------------

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'
import { supabase } from '../../lib/supabase.js'

const ordenesPendientes = ['ORD 2025-0012', 'ORD 2025-0011', 'ORD 2025-0010']

export default function OrdenPreparacion() {
  const navigate = useNavigate()
  
  const [vista, setVista] = useState('lista') // 'lista' | 'papelera' | 'crear' | 'editar'
  const [ordenes, setOrdenes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  
  const [form, setForm] = useState({ 
    numOrden: '', 
    codigo: '', 
    cantidad: '', 
    destino: '', 
    creadoPor: 'Juan Pérez' 
  })
  const [editandoId, setEditandoId] = useState(null)

  useEffect(() => {
    cargarOrdenes()
  }, [])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const cargarOrdenes = async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from('orden_preparacion')
      .select('*')
      .order('id', { ascending: false })

    if (!error && data) setOrdenes(data)
    setCargando(false)
  }

  const irACrear = () => {
    setForm({ 
      numOrden: '', 
      codigo: '', 
      cantidad: '', 
      destino: '', 
      creadoPor: 'Juan Pérez' 
    })
    setEditandoId(null)
    setVista('crear')
  }

  const handleGenerar = async () => {
    if (!form.numOrden || !form.codigo) {
      alert("Por favor, introduce el número de orden y el código del producto.")
      return
    }

    const { error } = await supabase.from('orden_preparacion').insert({
      num_orden: form.numOrden,
      codigo: form.codigo,
      cantidad: form.cantidad ? parseInt(form.cantidad) : 0,
      destino: form.destino,
      creado_por: form.creadoPor,
      estado: 'activo'
    })

    if (!error) {
      setModal('crear-ok')
    } else {
      alert("Ocurrió un error al guardar la orden de preparación.")
    }
  }

  const irAEditar = (orden) => {
    setEditandoId(orden.id)
    setForm({
      numOrden: orden.num_orden || '',
      codigo: orden.codigo || '',
      cantidad: orden.cantidad || '',
      destino: orden.destino || '',
      creadoPor: orden.creado_por || 'Juan Pérez'
    })
    setVista('editar')
  }

  const handleActualizar = async () => {
    const { error } = await supabase.from('orden_preparacion').update({
      num_orden: form.numOrden,
      codigo: form.codigo,
      cantidad: form.cantidad ? parseInt(form.cantidad) : 0,
      destino: form.destino,
      creado_por: form.creadoPor
    }).eq('id', editandoId)

    if (!error) {
      setModal('editar-ok')
    } else {
      alert("Ocurrió un error al actualizar la orden.")
    }
  }

  const handleMoverAPapelera = async (id) => {
    const { error } = await supabase.from('orden_preparacion').update({ estado: 'eliminado' }).eq('id', id)
    if (!error) cargarOrdenes()
  }

  const handleRestaurar = async (id) => {
    const { error } = await supabase.from('orden_preparacion').update({ estado: 'activo' }).eq('id', id)
    if (!error) {
      alert("¡Orden restaurada con éxito!")
      cargarOrdenes()
    }
  }

  const handleBorrarDefinitivo = async (id) => {
    if (window.confirm("¿Eliminar de forma permanente esta orden de preparación?")) {
      await supabase.from('orden_preparacion').delete().eq('id', id)
      cargarOrdenes()
    }
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

  return (
    <Layout>
      <div className="main-content">
        
        {(vista === 'lista' || vista === 'papelera') && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-4" style={{ maxWidth: 1000, margin: '0 auto' }}>
              <h1 className="page-title" style={{ margin: 0 }}>
                {vista === 'lista' ? 'Órdenes de Preparación' : 'Órdenes Eliminadas Recientemente'}
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
                type="text" className="form-control" placeholder=" Buscar por Nº orden, código, destino o autor..." 
                value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                style={{ background: 'var(--bg-input)', color: 'white', border: '1px solid #444' }}
              />
            </div>

            <div className="card card-gold" style={{ maxWidth: 1000, margin: '0 auto', padding: '20px' }}>
              <div className="section-heading mb-3">
                {vista === 'lista' ? 'Historial General de Órdenes' : 'Papelera de Órdenes Archivadas'}
              </div>
              
              <table className="table table-dark table-striped align-middle" style={{ borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                <thead>
                  <tr>
                    <th className="px-3" style={{ paddingLeft: '15px' }}>Nº Orden</th>
                    <th className="px-3">Cód. Producto</th>
                    <th className="px-3">Cantidad</th>
                    <th className="px-3">Destino</th>
                    <th className="text-center" style={{ width: '220px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cargando ? (
                    <tr><td colSpan="5" className="text-center text-muted py-4">Cargando datos...</td></tr>
                  ) : filtrados.length === 0 ? (
                    <tr><td colSpan="5" className="text-center text-muted py-4">No se encontraron órdenes de preparación registradas.</td></tr>
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
                {vista === 'crear' ? 'Orden de preparación' : 'Modificar Orden de Preparación'}
              </div>
              
              <div className="form-group mb-3">
                <label>Número de orden:</label>
                <input 
                  className="form-control" 
                  type="text" 
                  placeholder="Ej: 24" 
                  value={form.numOrden} 
                  onChange={set('numOrden')}
                />
              </div>

              <div className="form-group mb-3">
                <label>Código del producto:</label>
                <input 
                  className="form-control" 
                  type="text" 
                  placeholder="Ej: 283940003" 
                  value={form.codigo} 
                  onChange={set('codigo')}
                />
              </div>

              <div className="form-group mb-3">
                <label>Cantidad a despachar:</label>
                <input 
                  className="form-control" 
                  type="number" 
                  placeholder="Ej: 8" 
                  value={form.cantidad} 
                  onChange={set('cantidad')}
                />
              </div>

              <div className="form-group mb-3">
                <label>Destino del pedido:</label>
                <input 
                  className="form-control" 
                  type="text" 
                  placeholder="Area de ventas" 
                  value={form.destino} 
                  onChange={set('destino')}
                />
              </div>
              
              <div className="section-heading mt-4">Detalles de autoría</div>
              <div className="form-group mb-4">
                <label>Creado por:</label>
                <input className="form-control" type="text" value={form.creadoPor} readOnly />
              </div>
              
              <div className="text-center gap-2 d-flex justify-content-center">
                {vista === 'crear' ? (
                  <button className="btn btn-gold" onClick={handleGenerar}>Generar orden de preparación</button>
                ) : (
                  <button className="btn btn-gold" onClick={handleActualizar}>Guardar Cambios</button>
                )}
                <button className="btn btn-secondary" onClick={() => setVista('lista')}>Cancelar</button>
              </div>
            </div>

            {vista === 'crear' && (
              <div>
                <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>Archivos recientes:</div>
                <ul className="sidebar-list">
                  {ordenesPendientes.map(o => <li key={o}>{o} <span className="sidebar-arrow">▶</span></li>)}
                </ul>
              </div>
            )}
          </div>
        )}

      </div>

      <Modal show={modal === 'crear-ok' || modal === 'editar-ok'} message="Operación realizada con éxito."
        actions={<button className="btn btn-gold" onClick={cerrarYRefrescar}>✔ Aceptar</button>}/>
    </Layout>
  )
}