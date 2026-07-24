import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'
import { supabase } from '../../lib/supabase.js'

const ordenesPendientes = ['N.° ORDEN DESP-0012', 'N.° ORDEN RBE-1004', 'N.° ORDEN JAM-5032']

export default function NotaDespacho() {
  const navigate = useNavigate()
  const hoy = new Date().toLocaleDateString('es-DO')
  
  const [vista, setVista] = useState('lista')
  const [notas, setNotas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  
  const [form, setForm] = useState({
    numNota: '', fechaEmision: hoy, direccion: '', descripcion: '',
    codigo: '', numOrden: '', cantidad: '', receptor: '', encargado: ''
  })
  const [editandoId, setEditandoId] = useState(null)
  const [cantidadOriginal, setCantidadOriginal] = useState(0)

  useEffect(() => {
    cargarNotas()
  }, [])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const cargarNotas = async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from('nota_despacho')
      .select('*')
      .order('id', { ascending: false })

    if (!error && data) setNotas(data)
    setCargando(false)
  }

  const irACrear = () => {
    setForm({
      numNota: '', fechaEmision: hoy, direccion: '', descripcion: '',
      codigo: '', numOrden: '', cantidad: '', receptor: '', encargado: ''
    })
    setEditandoId(null)
    setVista('crear')
  }

  const handleGenerar = async () => {
    if (!form.codigo || !form.cantidad) {
      alert("Por favor, introduce el código del producto y la cantidad.")
      return
    }

    const cantDespachada = parseInt(form.cantidad)
    const { data: productos } = await supabase.from('productos').select('id, stock').eq('codigo_sku', form.codigo)
    
    if (productos?.length) {
      const prod = productos[0]
      if (prod.stock < cantDespachada) { 
        setModal('insuficiente')
        return 
      }
      
      await supabase.from('productos').update({ stock: prod.stock - cantDespachada }).eq('id', prod.id)
      
      await supabase.from('nota_despacho').insert({
        num_nota: form.numNota, fecha_emision: form.fechaEmision, direccion: form.direccion,
        descripcion: form.descripcion, codigo: form.codigo, num_orden: form.numOrden,
        cantidad: cantDespachada, receptor: form.receptor, encargado: form.encargado, estado: 'activo'
      })
      
      setModal('crear-ok')
    } else {
      alert("El código de producto ingresado no existe en tu inventario.")
    }
  }
  const irAEditar = (nota) => {
    setEditandoId(nota.id)
    setCantidadOriginal(nota.cantidad)
    setForm({
      numNota: nota.num_nota || '', fechaEmision: nota.fecha_emision || hoy,
      direccion: nota.direccion || '', descripcion: nota.descripcion || '',
      codigo: nota.codigo || '', numOrden: nota.num_orden || '',
      cantidad: nota.cantidad, receptor: nota.receptor || '', encargado: nota.encargado || ''
    })
    setVista('editar')
  }

  const handleActualizar = async () => {
    const cantNueva = parseInt(form.cantidad)
    if (isNaN(cantNueva)) return

    const { data: productos } = await supabase.from('productos').select('id, stock').eq('codigo_sku', form.codigo)
    if (productos?.length) {
      const prod = productos[0]
      const stockTemporal = prod.stock + cantidadOriginal
      
      if (stockTemporal < cantNueva) {
        setModal('insuficiente')
        return
      }

      await supabase.from('productos').update({ stock: stockTemporal - cantNueva }).eq('id', prod.id)
      
      await supabase.from('nota_despacho').update({
        num_nota: form.numNota, direccion: form.direccion, descripcion: form.descripcion,
        num_orden: form.numOrden, cantidad: cantNueva, receptor: form.receptor, encargado: form.encargado
      }).eq('id', editandoId)

      setModal('editar-ok')
    }
  }

  const handleMoverAPapelera = async (notaId) => {
    const { error } = await supabase.from('nota_despacho').update({ estado: 'eliminado' }).eq('id', notaId)
    if (!error) cargarNotas()
  }

  const handleReponerStockYRestaurar = async (notaId, sku, cantidad, receptor) => {
    const confirmar = window.confirm(`¿Deseas restaurar la nota de despacho y reponer las ${cantidad} unidades devueltas por ${receptor}?`)
    if (!confirmar) return

    const { data: productos } = await supabase.from('productos').select('id, stock').eq('codigo_sku', sku)
    if (productos?.length) {
      const prod = productos[0]
      await supabase.from('productos').update({ stock: prod.stock + cantidad }).eq('id', prod.id)
      
      await supabase.from('nota_despacho').update({ estado: 'activo' }).eq('id', notaId)
      
      alert("¡Stock devuelto e informe restaurado con éxito!")
      cargarNotas()
    } else {
      alert("No se pudo localizar el producto original en inventario.")
    }
  }

  const handleBorrarDefinitivo = async (notaId) => {
    if (window.confirm("¿Eliminar de forma permanente este documento? El stock descontado NO será restablecido.")) {
      await supabase.from('nota_despacho').delete().eq('id', notaId)
      cargarNotas()
    }
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
           (n.codigo || '').toLowerCase().includes(t) ||
           (n.receptor || '').toLowerCase().includes(t) ||
           (n.descripcion || '').toLowerCase().includes(t)
  })

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
                type="text" className="form-control" placeholder=" Buscar por Nº nota, código, descripción o destinatario..." 
                value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                style={{ background: 'var(--bg-input)', color: 'white', border: '1px solid #444' }}
              />
            </div>

            <div className="card card-gold" style={{ maxWidth: 1000, margin: '0 auto', padding: '20px' }}>
              <div className="section-heading mb-3">
                {vista === 'lista' ? 'Historial General de Envíos Realizados' : 'Papelera de Notas Archivadas'}
              </div>
              
              <table className="table table-dark table-striped align-middle" style={{ borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                <thead>
                  <tr>
                    <th className="px-3" style={{ paddingLeft: '15px' }}>Nº Nota</th>
                    <th className="px-3">Código SKU</th>
                    <th className="px-3">Cant.</th>
                    <th className="px-3">Recibe / Destino</th>
                    <th className="text-center" style={{ width: '220px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cargando ? (
                    <tr><td colSpan="5" className="text-center text-muted py-4">Cargando datos...</td></tr>
                  ) : filtradas.length === 0 ? (
                    <tr><td colSpan="5" className="text-center text-muted py-4">No se encontraron notas registradas.</td></tr>
                  ) : (
                    filtradas.map((n) => (
                      <tr key={n.id}>
                        <td className="px-3" style={{ paddingLeft: '15px' }}><span className="text-gold">{n.num_nota || 'S/N'}</span></td>
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
              
              {[
                ['Num. nota de despacho:', 'numNota', 'text', 'Ej: 408542'],
                ['Fecha de emisión:', 'fechaEmision', 'text', 'Ej: DD/MM/AAAA'],
                ['Dirección de entrega:', 'direccion', 'text', 'Ej: C/ 27 de febrero, Tenares'],
                ['Descripción del producto:', 'descripcion', 'text', 'Ej: Tequila Don Julio 70 6x75 Cl'],
                ['Código del producto:', 'codigo', 'text', 'Ej: BB076689638'],
                ['Num. de orden:', 'numOrden', 'text', 'Ej: 0893799'],
                ['Cantidad despachada:', 'cantidad', 'number', 'Ej: 54'],
              ].map(([label, key, type, placeholder]) => (
                <div className="form-group mb-3" key={key}>
                  <label>{label}</label>
                  <input 
                    className="form-control" 
                    type={type} 
                    placeholder={placeholder} 
                    value={form[key]} 
                    onChange={set(key)}
                    disabled={vista === 'editar' && key === 'codigo'} 
                  />
                </div>
              ))}
              
              <div className="section-heading mt-4">Datos de entrega:</div>
              
              <div className="form-group mb-3">
                <label>Nombre de quien recibe:</label>
                <input className="form-control" type="text" placeholder="Ej: Carlos De Jesús" value={form.receptor} onChange={set('receptor')} />
              </div>
              
              <div className="form-group mb-4">
                <label>Encargado de despacho:</label>
                <input className="form-control" type="text" placeholder="Ej: Camilo Alonso" value={form.encargado} onChange={set('encargado')} />
              </div>
              
              <div className="text-center gap-2 d-flex justify-content-center">
                {vista === 'crear' ? (
                  <button className="btn btn-gold" onClick={handleGenerar}>Generar nota de despacho</button>
                ) : (
                  <button className="btn btn-gold" onClick={handleActualizar}>Guardar Cambios</button>
                )}
                <button className="btn btn-secondary" onClick={() => setVista('lista')}>Cancelar</button>
              </div>
            </div>

            {vista === 'crear' && (
              <div>
                <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>1. Órdenes pendientes:</div>
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
      <Modal show={modal === 'insuficiente'} message="Lo sentimos, no se pudo procesar la nota de despacho por falta de stock suficiente en el inventario."
        actions={<button className="btn btn-gold" onClick={() => setModal(null)}>✔ Aceptar</button>}/>
    </Layout>
  )
}