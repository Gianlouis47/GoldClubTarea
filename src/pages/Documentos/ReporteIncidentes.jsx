// import React, { useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import Layout from '../../components/Layout.jsx'
// import Modal from '../../components/Modal.jsx'

// const archivos = ['INC 2025-0045','INC 2025-0044','INC 2025-0043','INC 2025-0042','INC 2025-0041','INC 2025-0040']

// export default function ReporteIncidentes() {
//   const navigate = useNavigate()
  
//   const [form, setForm] = useState({
//     fechaGuia: '', 
//     numGuia: '',
//     codigoProducto: '', 
//     cantidad: '',
//     faltante: '',
//     descripcion: '',
//     creadoPor: 'Juan Pérez', 
//   })
//   const [modal, setModal] = useState(null)
  
//   const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

//   return (
//     <Layout>
//       <div className="main-content">
//         <div className="two-col">
//           <div className="card card-gold">
//             <div className="section-heading" style={{marginTop:0}}>Reporte de incidente</div>
            
//             {[
//               ['Fecha de guía:', 'fechaGuia', 'text', 'Ej: 26/10/2025'],
//               ['Número de guía:', 'numGuia', 'text', 'Ej: GIA-2025-0123'],
//               ['Código de producto:', 'codigoProducto', 'text', 'Ej: 5678 - Ron añejo'],
//               ['Cantidad de producto:', 'cantidad', 'number', 'Ej: 5'],
//               ['Cantidad de faltante:', 'faltante', 'text', 'Ej: 2 o Cód: 5678 - Ron añejo'],
//             ].map(([label, key, type, placeholder]) => (
//               <div className="form-group" key={key}>
//                 <label>{label}</label>
//                 <input 
//                   className="form-control" 
//                   type={type} 
//                   placeholder={placeholder}
//                   value={form[key]} 
//                   onChange={set(key)}
//                 />
//               </div>
//             ))}
            
//             <div className="section-heading">Descripción del problema</div>
//             <textarea 
//               style={{width:'100%',background:'var(--bg-input)',border:'1px solid #555',borderRadius:6,padding:12,color:'var(--gold-light)',fontFamily:"'Inter',sans-serif",fontSize:13,resize:'vertical',minHeight:80}}
//               placeholder="Describa el estado de la mercancía o la incidencia. Ej: Cinco botellas de ron añejo dañadas durante el transporte. Cajas húmedas..."
//               value={form.descripcion} 
//               onChange={set('descripcion')}
//             />
            
//             <div className="section-heading">Detalles de autoría</div>
//             <div className="form-group">
//               <label>Creado por:</label>
//               <input className="form-control" type="text" value={form.creadoPor} readOnly/>
//             </div>
            
//             <div className="mt-3 flex gap-2" style={{justifyContent:'center'}}>
//               <button className="btn btn-outline" onClick={() => setModal('ok')}>Generar reporte de incidente</button>
//               <button className="btn btn-gold" onClick={() => navigate('/documentos/reporte-impreso')}>Imprimir reporte</button>
//             </div>
//           </div>

//           <div>
//             <div style={{fontWeight:600,marginBottom:12,fontSize:14}}>Archivos recientes</div>
//             <ul className="sidebar-list">{archivos.map(a => <li key={a}>{a}</li>)}</ul>
//           </div>
//         </div>
//       </div>

//       <Modal show={modal === 'ok'} message="Reporte de incidente generado con éxito."
//         actions={<button className="btn btn-gold" onClick={() => navigate('/documentos')}>✔ Aceptar</button>}/>
//     </Layout>
//   )
// }

//----------------------------------------------------------------------------------------------------------------
// import React, { useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import Layout from '../../components/Layout.jsx'
// import Modal from '../../components/Modal.jsx'

// const archivos = ['INC 2025-0045','INC 2025-0044','INC 2025-0043','INC 2025-0042','INC 2025-0041','INC 2025-0040']

// export default function ReporteIncidentes() {
//   const navigate = useNavigate()
  
//   const [form, setForm] = useState({
//     fechaGuia: '', 
//     numGuia: '',
//     codigoProducto: '', 
//     cantidad: '',
//     faltante: '',
//     descripcion: '',
//     creadoPor: 'Juan Pérez', 
//   })
//   const [modal, setModal] = useState(null)
  
//   const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

//   return (
//     <Layout>
//       <div className="main-content">
//         <div className="two-col">
//           <div className="card card-gold">
//             <div className="section-heading" style={{marginTop:0}}>Fecha de incidente</div>
            
//             {[
//               ['Fecha de guía:', 'fechaGuia', 'text', 'Ej: 26/10/2025'],
//               ['Número de guía:', 'numGuia', 'text', 'Ej: GIA-2025-0123'],
//               ['Código de producto:', 'codigoProducto', 'text', 'Ej: 5678 - Ron añejo'],
//               ['Cantidad de producto:', 'cantidad', 'number', 'Ej: 5'],
//               ['Cantidad de faltante:', 'faltante', 'text', 'Ej: 2 o Cód: 5678 - Ron añejo'],
//             ].map(([label, key, type, placeholder]) => (
//               <div className="form-group" key={key}>
//                 <label>{label}</label>
//                 <input 
//                   className="form-control" 
//                   type={type} 
//                   placeholder={placeholder}
//                   value={form[key]} 
//                   onChange={set(key)}
//                 />
//               </div>
//             ))}
            
//             <div className="section-heading">Descripción del problema</div>
//             <textarea 
//               style={{width:'100%',background:'var(--bg-input)',border:'1px solid #555',borderRadius:6,padding:12,color:'var(--gold-light)',fontFamily:"'Inter',sans-serif",fontSize:13,resize:'vertical',minHeight:80}}
//               placeholder="Describa el estado de la mercancía o la incidencia. Ej: Cinco botellas de ron añejo dañadas durante el transporte. Cajas húmedas..."
//               value={form.descripcion} 
//               onChange={set('descripcion')}
//             />
            
//             <div className="section-heading">Detalles de autoría</div>
//             <div className="form-group">
//               <label>Creado por:</label>
//               <input className="form-control" type="text" value={form.creadoPor} readOnly/>
//             </div>
            
//             <div className="mt-3 flex gap-2" style={{justifyContent:'center'}}>
//               <button className="btn btn-outline" onClick={() => setModal('ok')}>Generar reporte de incidente</button>
//             </div>
//           </div>

//           <div>
//             <div style={{fontWeight:600,marginBottom:12,fontSize:14}}>Archivos recientes</div>
//             <ul className="sidebar-list">{archivos.map(a => <li key={a}>{a}</li>)}</ul>
//           </div>
//         </div>
//       </div>

//       <Modal show={modal === 'ok'} message="Reporte de incidente generado con éxito."
//         actions={<button className="btn btn-gold" onClick={() => navigate('/documentos')}>✔ Aceptar</button>}/>
//     </Layout>
//   )
// }

//-------------------------------------------------------------------------------------------------------------------------

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'
import { supabase } from '../../lib/supabase.js'

const incidentesPendientes = ['INC 2025-0045', 'INC 2025-0044', 'INC 2025-0043']

export default function ReporteIncidentes() {
  const navigate = useNavigate()
  const hoy = new Date().toLocaleDateString('es-DO')
  
  const [vista, setVista] = useState('lista') // 'lista' | 'papelera' | 'crear' | 'editar'
  const [incidentes, setIncidentes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  
  const [form, setForm] = useState({
    numOrden: '', fechaIncidente: hoy, codigoProducto: '',
    cantidad: '', descripcion: '', creadoPor: 'Juan Pérez'
  })
  const [editandoId, setEditandoId] = useState(null)

  useEffect(() => {
    cargarIncidentes()
  }, [])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const cargarIncidentes = async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from('reporte_incidentes')
      .select('*')
      .order('id', { ascending: false })

    if (!error && data) setIncidentes(data)
    setCargando(false)
  }

  const irACrear = () => {
    setForm({
      numOrden: '', fechaIncidente: hoy, codigoProducto: '',
      cantidad: '', descripcion: '', creadoPor: 'Juan Pérez'
    })
    setEditandoId(null)
    setVista('crear')
  }

  const handleGenerar = async () => {
    if (!form.numOrden || !form.codigoProducto) {
      alert("Por favor, introduce el número de orden y el código del producto.")
      return
    }

    const { error } = await supabase.from('reporte_incidentes').insert({
      num_orden: form.numOrden,
      fecha_incidente: form.fechaIncidente,
      codigo_producto: form.codigoProducto,
      cantidad: form.cantidad ? parseInt(form.cantidad) : 0,
      descripcion: form.descripcion,
      creado_por: form.creadoPor,
      estado: 'activo'
    })

    if (!error) {
      setModal('crear-ok')
    } else {
      alert("Ocurrió un error al guardar el reporte.")
    }
  }

  const irAEditar = (incidente) => {
    setEditandoId(incidente.id)
    setForm({
      numOrden: incidente.num_orden || '',
      fechaIncidente: incidente.fecha_incidente || hoy,
      codigoProducto: incidente.codigo_producto || '',
      cantidad: incidente.cantidad || '',
      descripcion: incidente.descripcion || '',
      creadoPor: incidente.creado_por || 'Juan Pérez'
    })
    setVista('editar')
  }

  const handleActualizar = async () => {
    const { error } = await supabase.from('reporte_incidentes').update({
      num_orden: form.numOrden,
      fecha_incidente: form.fechaIncidente,
      codigo_producto: form.codigoProducto,
      cantidad: form.cantidad ? parseInt(form.cantidad) : 0,
      descripcion: form.descripcion,
      creado_por: form.creadoPor
    }).eq('id', editandoId)

    if (!error) {
      setModal('editar-ok')
    } else {
      alert("Ocurrió un error al actualizar el reporte.")
    }
  }

  const handleMoverAPapelera = async (id) => {
    const { error } = await supabase.from('reporte_incidentes').update({ estado: 'eliminado' }).eq('id', id)
    if (!error) cargarIncidentes()
  }

  const handleRestaurar = async (id) => {
    const { error } = await supabase.from('reporte_incidentes').update({ estado: 'activo' }).eq('id', id)
    if (!error) {
      alert("¡Reporte restaurado con éxito!")
      cargarIncidentes()
    }
  }

  const handleBorrarDefinitivo = async (id) => {
    if (window.confirm("¿Eliminar de forma permanente este reporte de incidente?")) {
      await supabase.from('reporte_incidentes').delete().eq('id', id)
      cargarIncidentes()
    }
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
                type="text" className="form-control" placeholder=" Buscar por Nº orden, código, descripción o autor..." 
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
                    <th className="px-3" style={{ paddingLeft: '15px' }}>Nº Orden</th>
                    <th className="px-3">Cód. Producto</th>
                    <th className="px-3">Cantidad</th>
                    <th className="px-3">Descripción</th>
                    <th className="text-center" style={{ width: '220px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cargando ? (
                    <tr><td colSpan="5" className="text-center text-muted py-4">Cargando datos...</td></tr>
                  ) : filtrados.length === 0 ? (
                    <tr><td colSpan="5" className="text-center text-muted py-4">No se encontraron reportes registrados.</td></tr>
                  ) : (
                    filtrados.map((i) => (
                      <tr key={i.id}>
                        <td className="px-3" style={{ paddingLeft: '15px' }}><span className="text-gold">{i.num_orden || 'S/N'}</span></td>
                        <td className="px-3"><code>{i.codigo_producto}</code></td>
                        <td className="px-3" style={{ fontWeight: 'bold' }}>
                          {i.cantidad} uds.
                        </td>
                        <td className="px-3">{i.descripcion} <br/> <small className="text-muted">Por: {i.creado_por}</small></td>
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
              
              {[
                ['Fecha del incidente:', 'fechaIncidente', 'text', 'Ej: 26/10/2025'],
                ['Número de orden:', 'numOrden', 'text', 'Ej: ORD-2025-0123'],
                ['Código de producto:', 'codigoProducto', 'text', 'Ej: 5678 - Ron añejo'],
                ['Cantidad de producto:', 'cantidad', 'number', 'Ej: 5'],
              ].map(([label, key, type, placeholder]) => (
                <div className="form-group mb-3" key={key}>
                  <label>{label}</label>
                  <input 
                    className="form-control" 
                    type={type} 
                    placeholder={placeholder} 
                    value={form[key]} 
                    onChange={set(key)}
                  />
                </div>
              ))}
              
              <div className="section-heading mt-4">Descripción del problema</div>
              <div className="form-group mb-3">
                <input 
                  className="form-control" 
                  type="text" 
                  placeholder="Describa el estado de la mercancía o la incidencia. Ej: Cinco botellas de ron añejo dañadas durante el transporte..."
                  value={form.descripcion} 
                  onChange={set('descripcion')}
                />
              </div>
              
              <div className="section-heading mt-4">Detalles de autoría</div>
              <div className="form-group mb-4">
                <label>Creado por:</label>
                <input className="form-control" type="text" value={form.creadoPor} readOnly />
              </div>
              
              <div className="text-center gap-2 d-flex justify-content-center">
                {vista === 'crear' ? (
                  <button className="btn btn-gold" onClick={handleGenerar}>Generar reporte de incidente</button>
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
                  {incidentesPendientes.map(o => <li key={o}>{o} <span className="sidebar-arrow">▶</span></li>)}
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