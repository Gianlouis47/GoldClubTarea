import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'
import { supabase } from '../../lib/supabase.js'

export default function InformeBaja() {
  const navigate = useNavigate()
  const hoy = new Date().toLocaleDateString('es-DO')
  
  const [vista, setVista] = useState('lista')
  const [bajas, setBajas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  
  const [form, setForm] = useState({ codigo: '', motivo: '', motivoOtro: '', nota: '', cantidad: '', fecha: hoy })
  const [editandoId, setEditandoId] = useState(null)
  const [cantidadOriginal, setCantidadOriginal] = useState(0)

  // Estado para el buscador de productos con autocomplete
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)

  useEffect(() => {
    cargarBajas()
  }, [])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  // Construye el texto de observaciones a partir del motivo preseleccionado y la nota
  const construirObservaciones = () => {
    const motivoFinal = form.motivo === 'Otro' ? (form.motivoOtro || '').trim() : form.motivo
    const nota = (form.nota || '').trim()
    if (!motivoFinal && !nota) return ''
    if (motivoFinal && nota) return `Motivo: ${motivoFinal}. Nota: ${nota}`
    if (motivoFinal) return `Motivo: ${motivoFinal}`
    return `Nota: ${nota}`
  }

  // Devuelve el valor para el campo motivo_baja de la tabla
  const obtenerMotivoBaja = () => {
    return form.motivo === 'Otro' ? (form.motivoOtro || '').trim() : form.motivo
  }

  // Busca productos en Supabase por codigo_sku o nombre (ilike) mientras el usuario escribe
  const buscarProductos = async (texto) => {
    setForm(f => ({ ...f, codigo: texto }))
    setProductoSeleccionado(null)
    const valor = texto.trim()
    if (valor.length < 2) {
      setResultados([])
      setBuscando(false)
      return
    }
    setBuscando(true)
    const { data, error } = await supabase
      .from('productos')
      .select('id, nombre, codigo_sku, stock')
      .or(`codigo_sku.ilike.%${valor}%,nombre.ilike.%${valor}%`)
      .limit(10)
    if (!error && data) {
      setResultados(data)
    } else {
      setResultados([])
    }
    setBuscando(false)
  }

  const seleccionarProducto = (prod) => {
    setForm(f => ({ ...f, codigo: prod.codigo_sku }))
    setProductoSeleccionado(prod)
    setResultados([])
  }

  const cargarBajas = async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from('informe_baja')
      .select(`
        id, cantidad, observaciones, created_at, producto_id, estado,
        productos ( id, nombre, codigo_sku )
      `)
      .order('id', { ascending: false })

    if (!error && data) {
      setBajas(data)
    } else {
      console.error("Error al cargar bajas:", error)
    }
    setCargando(false)
  }

  const irACrear = () => {
    setForm({ codigo: '', motivo: '', motivoOtro: '', nota: '', cantidad: '', fecha: hoy })
    setEditandoId(null)
    setResultados([])
    setBuscando(false)
    setProductoSeleccionado(null)
    setVista('crear')
  }

  const handleGenerar = async () => {
    if (!productoSeleccionado || !form.cantidad) {
      alert("Por favor, selecciona un producto e introduce la cantidad.")
      return
    }
    const { data: productos } = await supabase.from('productos').select('id,stock').eq('codigo_sku', productoSeleccionado.codigo_sku)
    if (!productos?.length) {
      alert("El código de producto no existe.")
      return
    }

    const prod = productos[0]
    const cant = parseInt(form.cantidad)
    if (prod.stock >= cant) {
      await supabase.from('productos').update({ stock: prod.stock - cant }).eq('id', prod.id)
      await supabase.from('informe_baja').insert({
        producto_id: prod.id, usuario_id: 1, cantidad: cant, observaciones: construirObservaciones(), motivo_baja: obtenerMotivoBaja(), estado: 'activo'
      })
      setModal('crear-ok')
    } else {
      alert("La cantidad ingresada supera al stock actual.")
    }
  }

  // Parsea observaciones existentes para rellenar el formulario de edición.
  // Formato esperado: "Motivo: <motivo>. Nota: <nota>" o variantes.
  const parsearObservaciones = (obs) => {
    let motivo = ''
    let motivoOtro = ''
    let nota = ''
    const motivosPredefinidos = ['Producto expirado', 'Se rompió', 'Se corrompió', 'Consumido (envase vacío)']
    if (!obs) return { motivo, motivoOtro, nota }

    const motivoMatch = obs.match(/Motivo:\s*(.+?)(?:\.\s*Nota:|$)/i)
    const notaMatch = obs.match(/Nota:\s*(.+)$/i)

    if (motivoMatch) {
      const motivoExtraido = motivoMatch[1].trim()
      if (motivosPredefinidos.includes(motivoExtraido)) {
        motivo = motivoExtraido
      } else {
        motivo = 'Otro'
        motivoOtro = motivoExtraido
      }
    }
    if (notaMatch) nota = notaMatch[1].trim()

    return { motivo, motivoOtro, nota }
  }

  const irAEditar = (baja) => {
    setEditandoId(baja.id)
    setCantidadOriginal(baja.cantidad)
    const { motivo, motivoOtro, nota } = parsearObservaciones(baja.observaciones)
    setForm({
      codigo: baja.productos?.codigo_sku || '',
      motivo,
      motivoOtro,
      nota,
      cantidad: baja.cantidad,
      fecha: new Date(baja.created_at).toLocaleDateString('es-DO')
    })
    setProductoSeleccionado(baja.productos ? { id: baja.producto_id, ...baja.productos } : null)
    setResultados([])
    setVista('editar')
  }

  const handleActualizar = async () => {
    const cantNueva = parseInt(form.cantidad)
    if (isNaN(cantNueva) || cantNueva <= 0) {
      alert("Por favor, introduce una cantidad válida.")
      return
    }

    const { data: baja } = await supabase.from('informe_baja').select('producto_id').eq('id', editandoId).single()
    const { data: prod } = await supabase.from('productos').select('stock').eq('id', baja.producto_id).single()

    if (prod) {
      const stockRecompuesto = prod.stock + cantidadOriginal
      if (stockRecompuesto < cantNueva) {
        alert("No hay suficiente stock disponible.")
        return
      }
      await supabase.from('productos').update({ stock: stockRecompuesto - cantNueva }).eq('id', baja.producto_id)
      const observaciones = construirObservaciones()
      await supabase.from('informe_baja').update({ cantidad: cantNueva, observaciones: observaciones, motivo_baja: obtenerMotivoBaja() }).eq('id', editandoId)
      setModal('editar-ok')
    }
  }

  const handleMoverAPapelera = async (bajaId) => {
    const { error } = await supabase.from('informe_baja').update({ estado: 'eliminado' }).eq('id', bajaId)
    if (!error) {
      cargarBajas()
    }
  }

  const handleReponerStock = async (bajaId, productoId, cantidad, nombre) => {
    const confirmar = window.confirm(`¿Deseas reponer las ${cantidad} unidades al producto "${nombre}" y restaurar este informe?`)
    if (!confirmar) return

    const { data: prod } = await supabase.from('productos').select('stock').eq('id', productoId).single()
    if (prod) {
      await supabase.from('productos').update({ stock: prod.stock + cantidad }).eq('id', productoId)
      await supabase.from('informe_baja').update({ estado: 'activo' }).eq('id', bajaId)
      
      alert("¡Stock repuesto con éxito e informe restaurado en el historial!")
      cargarBajas()
    } else {
      alert("No se pudo encontrar el producto original para reponer las unidades.")
    }
  }

  const handleBorrarDefinitivo = async (bajaId) => {
    if (window.confirm("¿Eliminar definitivamente este informe? Esta acción no se puede deshacer y NO devolverá el stock.")) {
      await supabase.from('informe_baja').delete().eq('id', bajaId)
      cargarBajas()
    }
  }

  const cerrarYRefrescar = () => {
    setModal(null)
    setVista('lista')
    cargarBajas()
  }

  const activas = bajas.filter(b => b.estado !== 'eliminado')
  const eliminadas = bajas.filter(b => b.estado === 'eliminado')

  const filtradas = (vista === 'lista' ? activas : eliminadas).filter(b => {
    const t = busqueda.toLowerCase()
    const sku = (b.productos?.codigo_sku || '').toLowerCase()
    const nombre = (b.productos?.nombre || '').toLowerCase()
    const motivo = (b.observaciones || '').toLowerCase()
    return sku.includes(t) || nombre.includes(t) || motivo.includes(t)
  })

  return (
    <Layout>
      <div className="main-content">
      
        {(vista === 'lista' || vista === 'papelera') && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-4" style={{ maxWidth: 1000, margin: '0 auto' }}>
              <h1 className="page-title" style={{ margin: 0 }}>
                {vista === 'lista' ? 'Historial de Bajas' : 'Eliminados Recientemente'}
              </h1>
              <div className="d-flex gap-2">
                {vista === 'lista' ? (
                  <>
                    <button className="btn btn-outline-secondary" onClick={() => { setBusqueda(''); setVista('papelera') }}>
                       Ver Eliminados
                    </button>
                    <button className="btn btn-gold" onClick={irACrear}> Crear Informe</button>
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
                type="text" className="form-control" placeholder=" Buscar registros..." 
                value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                style={{ background: 'var(--bg-input)', color: 'white', border: '1px solid #444' }}
              />
            </div>

            <div className="card card-gold" style={{ maxWidth: 1000, margin: '0 auto', padding: '20px' }}>
              <div className="section-heading mb-3">
                {vista === 'lista' ? 'Registros de Mercancía de Baja' : 'Papelera de Informes'}
              </div>
            
              <table className="table table-dark table-striped align-middle" style={{ borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                <thead>
                  <tr>
                    <th className="px-3" style={{ paddingLeft: '15px' }}>Código</th>
                    <th className="px-3">Producto</th>
                    <th className="px-3">Cant. Retirada</th>
                    <th className="px-3">Motivo / Observaciones</th>
                    <th className="text-center" style={{ width: '220px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cargando ? (
                    <tr><td colSpan="5" className="text-center text-muted py-4">Cargando datos...</td></tr>
                  ) : filtradas.length === 0 ? (
                    <tr><td colSpan="5" className="text-center text-muted py-4">No se encontraron registros.</td></tr>
                  ) : (
                    filtradas.map((b) => (
                      <tr key={b.id}>
                        <td className="px-3" style={{ paddingLeft: '15px' }}><code>{b.productos?.codigo_sku}</code></td>
                        <td className="px-3">{b.productos?.nombre}</td>
                        <td className="px-3 text-danger" style={{ fontWeight: 'bold' }}>-{b.cantidad}</td>
                        <td className="px-3">{b.observaciones || 'Sin especificar'}</td>
                        <td className="text-center">
                          <div className="d-flex gap-2 justify-content-center">
                            {vista === 'lista' ? (
                              <>
                                <button className="btn btn-sm btn-light" onClick={() => irAEditar(b)}>Editar</button>
                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleMoverAPapelera(b.id)}>Borrar</button>
                              </>
                            ) : (
                              <>
                                <button className="btn btn-sm btn-outline-success" onClick={() => handleReponerStock(b.id, b.producto_id, b.cantidad, b.productos?.nombre)}>
                                   Reponer
                                </button>
                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleBorrarDefinitivo(b.id)}>Eliminar</button>
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
          <div className="card card-gold" style={{maxWidth:680, margin: '0 auto'}}>
            <div className="section-heading" style={{marginTop:0}}>
              {vista === 'crear' ? 'Nuevo Informe de Baja' : 'Modificar Informe de Baja'}
            </div>
          
            <div className="form-group mb-3">
              <label>Buscar producto por código o nombre:</label>
              <input 
                className="form-control" 
                type="text" 
                placeholder="Escribe al menos 2 caracteres para buscar..." 
                value={form.codigo} 
                onChange={(e) => buscarProductos(e.target.value)} 
                disabled={vista === 'editar'} 
              />
              {/* Indicador de producto seleccionado o estado de búsqueda */}
              {productoSeleccionado && (
                <small className="text-success" style={{display:'block', marginTop:'4px'}}>
                  ✓ Producto seleccionado: <strong>{productoSeleccionado.nombre}</strong> (Stock: {productoSeleccionado.stock})
                </small>
              )}
              {/* Lista desplegable de resultados de búsqueda */}
              {vista === 'crear' && resultados.length > 0 && (
                <ul style={{
                  listStyle: 'none',
                  margin: '5px 0 0 0',
                  padding: 0,
                  background: 'var(--bg-input, #2a2a2a)',
                  border: '1px solid #444',
                  borderRadius: '6px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  position: 'relative'
                }}>
                  {resultados.map((prod) => (
                    <li 
                      key={prod.id} 
                      onClick={() => seleccionarProducto(prod)}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #333',
                        color: '#fff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#3a3a3a'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span>
                        <strong>{prod.codigo_sku}</strong> — {prod.nombre}
                      </span>
                      <span style={{ color: '#999', fontSize: '0.85em' }}>
                        Stock: {prod.stock}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {vista === 'crear' && buscando && (
                <small className="text-muted" style={{display:'block', marginTop:'4px'}}>
                  Buscando...
                </small>
              )}
            </div>
          
            <div className="form-group mb-3">
              <label>Motivo de baja:</label>
              <select 
                className="form-control" 
                value={form.motivo} 
                onChange={set('motivo')}
              >
                <option value="">-- Selecciona un motivo --</option>
                <option value="Producto expirado">Producto expirado</option>
                <option value="Se rompió">Se rompió</option>
                <option value="Se corrompió">Se corrompió</option>
                <option value="Consumido (envase vacío)">Consumido (envase vacío)</option>
                <option value="Otro">Otro</option>
              </select>
              {/* Input adicional cuando se selecciona "Otro" */}
              {form.motivo === 'Otro' && (
                <input 
                  className="form-control" 
                  type="text" 
                  placeholder="Escribe el motivo personalizado..." 
                  value={form.motivoOtro} 
                  onChange={set('motivoOtro')}
                  style={{ marginTop: '8px' }}
                />
              )}
            </div>
          
            <div className="form-group mb-3">
              <label>Nota / Detalle (opcional):</label>
              <textarea 
                className="form-control" 
                placeholder="Ej: Se cayó la botella y se quebró. Lote vencido en el pasillo 3..." 
                value={form.nota} 
                onChange={set('nota')}
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>
          
            <div className="form-group mb-3">
              <label>Cantidad de producto:</label>
              <input className="form-control" type="number" placeholder="Ej: 10" value={form.cantidad} onChange={set('cantidad')} />
            </div>
          
            <div className="section-heading mt-4">Detalles de autoría</div>
            <div className="form-group mb-4">
              <label>Creado por:</label>
              <input className="form-control" type="text" value="Juan Pérez" readOnly />
            </div>
          
            <div className="text-center gap-2 d-flex justify-content-center">
              {vista === 'crear' ? (
                <button className="btn btn-gold" onClick={handleGenerar}>Generar informe de baja</button>
              ) : (
                <button className="btn btn-gold" onClick={handleActualizar}>Guardar Cambios</button>
              )}
              <button className="btn btn-secondary" onClick={() => setVista('lista')}>Cancelar</button>
            </div>
          </div>
        )}

      </div>
    
      <Modal 
        show={modal !== null} 
        message={modal === 'crear-ok' ? "Informe generado con éxito." : "Informe modificado correctamente."}
        actions={<button className="btn btn-gold" onClick={cerrarYRefrescar}>✔ Aceptar</button>}
      />
    </Layout>
  )
}