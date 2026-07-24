import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'
import { supabase } from '../../lib/supabase.js'

const ordenesPendientes = ['N.° ORDEN DESP-0012', 'N.° ORDEN RBE-1004', 'N.° ORDEN JAM-5032']

export default function NotaDespacho() {
  const navigate = useNavigate()
  const hoy = new Date().toLocaleDateString('es-DO')
  
  const [vista, setVista] = useState('lista') // 'lista' | 'papelera' | 'crear' | 'editar'
  const [notas, setNotas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  
  // Estado para crear/editar
  const [form, setForm] = useState({
    numNota: '',
    fechaEmision: hoy,
    tipoNota: 'entrega', // 'entrega' | 'facturacion'
    numFactura: '',
    cliente: '',
    direccion: '',
    items: [], // array de { producto_id, nombre, codigo_sku, cantidad, precio_unitario }
    buscadorProducto: '',
    resultadosBusqueda: [],
    mostrarResultados: false,
    observaciones: '',
    encargado: ''
  })
  const [editandoId, setEditandoId] = useState(null)
  const [cantidadesOriginales, setCantidadesOriginales] = useState({})

  useEffect(() => {
    cargarNotas()
  }, [])

  const setFormField = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

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
      numNota: '',
      fechaEmision: hoy,
      tipoNota: 'entrega',
      numFactura: '',
      cliente: '',
      direccion: '',
      items: [],
      buscadorProducto: '',
      resultadosBusqueda: [],
      mostrarResultados: false,
      observaciones: '',
      encargado: ''
    })
    setEditandoId(null)
    setCantidadesOriginales({})
    setVista('crear')
  }

  // Buscar factura por número para autocompletar cliente y dirección
    const buscarFactura = async () => {
      if (!form.numFactura.trim()) return
      const { data } = await supabase
        .from('facturas')
        .select('cliente_nombre, cliente_direccion, total, estado')
        .eq('numero_factura', form.numFactura.trim())
        .single()
      if (data) {
        setForm(f => ({ ...f, cliente: data.cliente_nombre, direccion: data.cliente_direccion }))
      } else {
        setForm(f => ({ ...f, cliente: '', direccion: '' }))
        // Opcional: mostrar aviso
      }
    }

    // Buscar productos para agregar a la nota
    const buscarProducto = async (texto) => {
      setForm(f => ({ ...f, buscadorProducto: texto }))
      if (texto.trim().length < 1) { 
        setForm(f => ({ ...f, resultadosBusqueda: [], mostrarResultados: false }))
        return 
      }
      const t = texto.toLowerCase()
      const { data: filtrados } = await supabase.from('productos').select('id,nombre,codigo_sku,precio_venta,stock').eq('activo', true)
      const res = (filtrados || []).filter(p =>
        (p.codigo_sku || '').toLowerCase().includes(t) ||
        (p.nombre || '').toLowerCase().includes(t)
      ).slice(0, 8)
      setForm(f => ({ ...f, resultadosBusqueda: res, mostrarResultados: true }))
    }

  const agregarItem = (prod) => {
    const existe = form.items.find(i => i.producto_id === prod.id)
    if (existe) {
      setForm(f => ({
        ...f,
        items: f.items.map(i => i.producto_id === prod.id ? { ...i, cantidad: i.cantidad + 1 } : i),
        buscadorProducto: '',
        resultadosBusqueda: [],
        mostrarResultados: false
      }))
    } else {
      setForm(f => ({
        ...f,
        items: [...f.items, {
          producto_id: prod.id,
          nombre: prod.nombre,
          codigo_sku: prod.codigo_sku,
          cantidad: 1,
          precio_unitario: parseFloat(prod.precio_venta) || 0,
          stock: prod.stock
        }],
        buscadorProducto: '',
        resultadosBusqueda: [],
        mostrarResultados: false
      }))
    }
  }

  const actualizarItem = (id, campo, valor) => {
    setForm(f => ({
      ...f,
      items: f.items.map(i => i.producto_id === id ? { ...i, [campo]: valor } : i)
    }))
  }

  const removerItem = (id) => {
    setForm(f => ({ ...f, items: f.items.filter(i => i.producto_id !== id) }))
  }

  // Validar número de nota único
  const validarNumNotaUnico = async (numNota, excluirId = null) => {
    let q = supabase.from('nota_despacho').select('id').eq('num_nota', numNota)
    if (excluirId) q = q.neq('id', excluirId)
    const { data } = await q
    return data && data.length > 0
  }

  // Validar número de factura único
  const validarNumFacturaUnico = async (numFactura, excluirId = null) => {
    if (!numFactura.trim()) return false
    let q = supabase.from('nota_despacho').select('id').eq('num_factura', numFactura)
    if (excluirId) q = q.neq('id', excluirId)
    const { data } = await q
    return data && data.length > 0
  }

  const handleGenerar = async () => {
    if (!form.numNota.trim()) { setModal('error-num-nota'); return }
    if (!form.tipoNota) { setModal('error-tipo'); return }
    if (form.tipoNota === 'facturacion' && !form.numFactura.trim()) { setModal('error-num-factura'); return }
    if (form.items.length === 0) { setModal('error-items'); return }
    if (!form.encargado.trim()) { setModal('error-encargado'); return }

    // Validar unicidad de número de nota
    const notaExiste = await validarNumNotaUnico(form.numNota.trim())
    if (notaExiste) { setModal('error-nota-existe'); return }

    // Validar unicidad de número de factura (solo si es tipo facturación)
    if (form.tipoNota === 'facturacion') {
      const factExiste = await validarNumFacturaUnico(form.numFactura.trim())
      if (factExiste) { setModal('error-factura-existe'); return }
    }

    // Validar stock
    for (const item of form.items) {
      if (item.stock < item.cantidad) { setModal('error-stock'); return }
    }

    // Crear la nota
    const { data: notaData, error } = await supabase.from('nota_despacho').insert({
      num_nota: form.numNota.trim(),
      fecha_emision: form.fechaEmision,
      tipo_nota: form.tipoNota,
      num_factura: form.numFactura.trim() || null,
      cliente: form.cliente.trim(),
      direccion: form.direccion.trim(),
      items: form.items,
      observaciones: form.observaciones.trim(),
      encargado: form.encargado.trim(),
      estado: 'activo'
    }).select()

    if (error || !notaData) { setModal('error'); return }
    const notaId = notaData[0].id

    // Descontar stock y registrar movimientos
    for (const item of form.items) {
      const { data: prod } = await supabase.from('productos').select('id,stock').eq('id', item.producto_id).single()
      if (prod) {
        await supabase.from('productos').update({ stock: prod.stock - item.cantidad }).eq('id', item.producto_id)
        await supabase.from('movimientos_inventario').insert({
          producto_id: item.producto_id,
          usuario_id: 1,
          tipo_movimiento: 'SALIDA',
          cantidad: item.cantidad,
          referencia: `Nota ${form.tipoNota === 'facturacion' ? 'Factura' : 'Entrega'} ${form.numNota.trim()}`
        })
      }
    }

    setModal('crear-ok')
  }

  const irAEditar = async (nota) => {
    setEditandoId(nota.id)
    // Guardar cantidades originales para ajustar stock al editar
    const cantOrig = {}
    for (const item of nota.items || []) {
      cantOrig[item.producto_id] = item.cantidad
    }
    setCantidadesOriginales(cantOrig)
    setForm({
      numNota: nota.num_nota || '',
      fechaEmision: nota.fecha_emision || hoy,
      tipoNota: nota.tipo_nota || 'entrega',
      numFactura: nota.num_factura || '',
      cliente: nota.cliente || '',
      direccion: nota.direccion || '',
      items: (nota.items || []).map(i => ({
        producto_id: i.producto_id,
        nombre: i.nombre,
        codigo_sku: i.codigo_sku,
        cantidad: i.cantidad,
        precio_unitario: i.precio_unitario,
        stock: 0 // se carga después
      })),
      buscadorProducto: '',
      resultadosBusqueda: [],
      mostrarResultados: false,
      observaciones: nota.observaciones || '',
      encargado: nota.encargado || ''
    })
    // Cargar stock actual de cada producto
    for (const item of nota.items || []) {
      const { data: prod } = await supabase.from('productos').select('stock').eq('id', item.producto_id).single()
      if (prod) {
        setForm(f => ({
          ...f,
          items: f.items.map(i => i.producto_id === item.producto_id ? { ...i, stock: prod.stock } : i)
        }))
      }
    }
    setVista('editar')
  }

  const handleActualizar = async () => {
    if (!form.numNota.trim()) { setModal('error-num-nota'); return }
    if (!form.tipoNota) { setModal('error-tipo'); return }
    if (form.tipoNota === 'facturacion' && !form.numFactura.trim()) { setModal('error-num-factura'); return }
    if (form.items.length === 0) { setModal('error-items'); return }
    if (!form.encargado.trim()) { setModal('error-encargado'); return }

    const notaExiste = await validarNumNotaUnico(form.numNota.trim(), editandoId)
    if (notaExiste) { setModal('error-nota-existe'); return }

    if (form.tipoNota === 'facturacion') {
      const factExiste = await validarNumFacturaUnico(form.numFactura.trim(), editandoId)
      if (factExiste) { setModal('error-factura-existe'); return }
    }

    for (const item of form.items) {
      if (item.stock < item.cantidad) { setModal('error-stock'); return }
    }

    // Actualizar stock: recomponer con cantidad original, luego descontar nueva
    for (const item of form.items) {
      const cantOrig = cantidadesOriginales[item.producto_id] || 0
      const { data: prod } = await supabase.from('productos').select('id,stock').eq('id', item.producto_id).single()
      if (prod) {
        const stockRecompuesto = prod.stock + cantOrig
        if (stockRecompuesto < item.cantidad) { setModal('error-stock'); return }
        await supabase.from('productos').update({ stock: stockRecompuesto - item.cantidad }).eq('id', item.producto_id)
        await supabase.from('movimientos_inventario').insert({
          producto_id: item.producto_id,
          usuario_id: 1,
          tipo_movimiento: 'SALIDA',
          cantidad: item.cantidad,
          referencia: `Nota ${form.tipoNota === 'facturacion' ? 'Factura' : 'Entrega'} ${form.numNota.trim()} (editada)`
        })
      }
    }

    await supabase.from('nota_despacho').update({
      num_nota: form.numNota.trim(),
      fecha_emision: form.fechaEmision,
      tipo_nota: form.tipoNota,
      num_factura: form.numFactura.trim() || null,
      cliente: form.cliente.trim(),
      direccion: form.direccion.trim(),
      items: form.items,
      observaciones: form.observaciones.trim(),
      encargado: form.encargado.trim()
    }).eq('id', editandoId)

    setModal('editar-ok')
  }

  const handleMoverAPapelera = async (notaId) => {
    const { error } = await supabase.from('nota_despacho').update({ estado: 'eliminado' }).eq('id', notaId)
    if (!error) cargarNotas()
  }

  const handleReponerStockYRestaurar = async (notaId, items, receptor) => {
    const confirmar = window.confirm(`¿Deseas restaurar la nota y reponer las unidades devueltas por ${receptor}?`)
    if (!confirmar) return

    for (const item of items || []) {
      const { data: prod } = await supabase.from('productos').select('id,stock').eq('id', item.producto_id).single()
      if (prod) {
        await supabase.from('productos').update({ stock: prod.stock + item.cantidad }).eq('id', item.producto_id)
      }
    }
    await supabase.from('nota_despacho').update({ estado: 'activo' }).eq('id', notaId)
    alert('¡Stock devuelto e informe restaurado con éxito!')
    cargarNotas()
  }

  const handleBorrarDefinitivo = async (notaId) => {
    if (window.confirm('¿Eliminar de forma permanente este documento? El stock descontado NO será restablecido.')) {
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
           (n.num_factura || '').toLowerCase().includes(t) ||
           (n.cliente || '').toLowerCase().includes(t) ||
           (n.observaciones || '').toLowerCase().includes(t)
  })

  return (
    <Layout>
      <div className="main-content">
        
        {(vista === 'lista' || vista === 'papelera') && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-4" style={{ maxWidth: 1200, margin: '0 auto' }}>
              <h1 className="page-title" style={{ margin: 0 }}>
                {vista === 'lista' ? 'Notas de Despacho' : 'Notas Eliminadas Recientemente'}
              </h1>
              <div className="d-flex gap-2">
                {vista === 'lista' ? (
                  <>
                    <button className="btn btn-outline-secondary" onClick={() => { setBusqueda(''); setVista('papelera') }}>
                      Ver Eliminados
                    </button>
                    <button className="btn btn-gold" onClick={irACrear}>
                      Crear Nota
                    </button>
                  </>
                ) : (
                  <button className="btn btn-secondary" onClick={() => { setBusqueda(''); setVista('lista') }}>
                    Volver al Historial
                  </button>
                )}
              </div>
            </div>

            <div style={{ maxWidth: 1200, margin: '0 auto 15px auto' }}>
              <input 
                type="text" className="form-control" placeholder=" Buscar por Nº nota, factura, cliente, observaciones..." 
                value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                style={{ background: 'var(--bg-input)', color: 'white', border: '1px solid #444' }}
              />
            </div>

            <div className="card card-gold" style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
              <div className="section-heading mb-3">
                {vista === 'lista' ? 'Historial General de Envíos Realizados' : 'Papelera de Notas Archivadas'}
              </div>
              
              <table className="table table-dark table-striped align-middle" style={{ borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                <thead>
                  <tr>
                    <th className="px-3" style={{ paddingLeft: '15px' }}>Nº Nota</th>
                    <th className="px-3">Tipo</th>
                    <th className="px-3">Nº Factura</th>
                    <th className="px-3">Cliente / Destino</th>
                    <th className="px-3">Productos</th>
                    <th className="px-3">Encargado</th>
                    <th className="text-center" style={{ width: '250px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cargando ? (
                    <tr><td colSpan="7" className="text-center text-muted py-4">Cargando datos...</td></tr>
                  ) : filtradas.length === 0 ? (
                    <tr><td colSpan="7" className="text-center text-muted py-4">No se encontraron notas registradas.</td></tr>
                  ) : (
                    filtradas.map((n) => (
                      <tr key={n.id}>
                        <td className="px-3" style={{ paddingLeft: '15px' }}><span className="text-gold">{n.num_nota || 'S/N'}</span></td>
                        <td className="px-3">
                          <span style={{ background: n.tipo_nota === 'facturacion' ? 'rgba(76,175,125,0.2)' : 'rgba(212,160,23,0.2)', color: n.tipo_nota === 'facturacion' ? '#4caf7d' : 'var(--gold)', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>
                            {n.tipo_nota === 'facturacion' ? '📋 Facturación' : '📦 Entrega'}
                          </span>
                        </td>
                        <td className="px-3"><code>{n.num_factura || '—'}</code></td>
                        <td className="px-3">{n.cliente} <br/> <small className="text-muted">{n.direccion || 'Sin dirección'}</small></td>
                        <td className="px-3">
                          {(n.items || []).map((it, i) => (
                            <div key={i}><code>{it.codigo_sku}</code> x{it.cantidad} {it.nombre}</div>
                          ))}
                        </td>
                        <td className="px-3">{n.encargado}</td>
                        <td className="text-center">
                          <div className="d-flex gap-2 justify-content-center">
                            {vista === 'lista' ? (
                              <>
                                <button className="btn btn-sm btn-light" onClick={() => irAEditar(n)}>Editar</button>
                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleMoverAPapelera(n.id)}>Borrar</button>
                              </>
                            ) : (
                              <>
                                <button className="btn btn-sm btn-outline-success" onClick={() => handleReponerStockYRestaurar(n.id, n.items, n.cliente)}>
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
                {vista === 'crear' ? 'Nueva Nota de Despacho' : 'Modificar Nota de Despacho'}
              </div>
              
              {/* Datos principales */}
              <div className="form-group mb-3">
                <label>Nº de nota de despacho:</label>
                <input className="form-control" type="text" placeholder="Ej: 408542" 
                  value={form.numNota} onChange={setFormField('numNota')} />
              </div>

              <div className="form-group mb-3">
                <label>Fecha de emisión:</label>
                <input className="form-control" type="date" 
                  value={form.fechaEmision} onChange={setFormField('fechaEmision')} />
              </div>

              <div className="form-group mb-3">
                <label>Tipo de nota:</label>
                <select className="form-control" value={form.tipoNota} onChange={setFormField('tipoNota')}
                  style={{ background: 'var(--bg-input)', color: 'var(--gold-light)', border: '1px solid #555' }}>
                  <option value="entrega">📦 Nota de entrega (interna / otra área)</option>
                  <option value="facturacion">📋 Nota de facturación (venta con factura)</option>
                </select>
              </div>

              {/* Número de factura (solo si es facturación) */}
              {form.tipoNota === 'facturacion' && (
                <>
                  <div className="form-group mb-3">
                    <label>Nº de factura (debe ser único):</label>
                    <input className="form-control" type="text" placeholder="Ej: FAC-00001" 
                      value={form.numFactura} onChange={setFormField('numFactura')}
                      onBlur={buscarFactura} />
                    <small className="text-muted">Se autocompleta cliente y dirección al salir del campo</small>
                  </div>
                  <div className="form-group mb-3">
                    <label>Cliente:</label>
                    <input className="form-control" type="text" placeholder="Se autocompleta desde la factura" 
                      value={form.cliente} onChange={setFormField('cliente')} />
                  </div>
                  <div className="form-group mb-3">
                    <label>Dirección del cliente:</label>
                    <input className="form-control" type="text" placeholder="Se autocompleta desde la factura" 
                      value={form.direccion} onChange={setFormField('direccion')} />
                  </div>
                </>
              )}

              {/* Buscador de productos para agregar items */}
              <div className="section-heading mb-2" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                Productos en la nota <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 400 }}>(agregue uno o varios)</span>
              </div>
              <div className="form-group mb-3" style={{ position: 'relative' }}>
                <label>Buscar producto (código o nombre):</label>
                <input className="form-control" type="text" placeholder="Escriba código o nombre..." 
                  value={form.buscadorProducto} onChange={e => buscarProducto(e.target.value)}
                  onFocus={() => form.resultadosBusqueda.length > 0 && setForm(f => ({ ...f, mostrarResultados: true }))} />
                {form.mostrarResultados && form.resultadosBusqueda.length > 0 && (
                  <ul className="sidebar-list" style={{ position: 'absolute', zIndex: 50, left: 0, right: 0, marginTop: 4, background: 'var(--bg-card)', borderRadius: 8, padding: 12, border: '1px solid var(--gold)' }}>
                    {form.resultadosBusqueda.map(p => (
                      <li key={p.id} onClick={() => agregarItem(p)} style={{ cursor: 'pointer' }}>
                        <span><code>{p.codigo_sku}</code> — {p.nombre} (${p.precio_venta}) <small className="text-muted">Stock: {p.stock}</small></span>
                        <span className="sidebar-arrow">+ Agregar</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Tabla de items */}
                            {form.items.length > 0 && (
                              <>
                                <div className="section-heading mb-2">Detalle de la nota ({form.items.length} producto{form.items.length > 1 ? 's' : ''})</div>
                                <div className="card" style={{ marginBottom: 16 }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                    <thead>
                                      <tr style={{ borderBottom: '1px solid #3a3a3a', color: 'var(--text-muted)' }}>
                                        <th style={{ padding: 10, textAlign: 'left' }}>Código</th>
                                        <th style={{ padding: 10, textAlign: 'left' }}>Producto</th>
                                        <th style={{ padding: 10, textAlign: 'center' }}>Cant.</th>
                                        <th style={{ padding: 10, textAlign: 'right' }}>Precio</th>
                                        <th style={{ padding: 10, textAlign: 'center' }}></th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {form.items.map((i, idx) => (
                                        <tr key={i.producto_id} style={{ borderBottom: idx < form.items.length - 1 ? '1px solid #3a3a3a' : 'none' }}>
                                          <td style={{ padding: 10, color: 'var(--gold)' }}>{i.codigo_sku}</td>
                                          <td style={{ padding: 10 }}>{i.nombre}</td>
                                          <td style={{ padding: 10, textAlign: 'center' }}>
                                            <input type="number" min="1" value={i.cantidad}
                                              style={{ width: 60, background: 'var(--bg-input)', border: '1px solid #555', borderRadius: 4, color: 'var(--text)', padding: '4px 8px', textAlign: 'center' }}
                                              onChange={e => actualizarItem(i.producto_id, 'cantidad', e.target.value)} />
                                          </td>
                                          <td style={{ padding: 10, textAlign: 'right' }}>
                                            <input type="number" step="0.01" value={i.precio_unitario}
                                              style={{ width: 80, background: 'var(--bg-input)', border: '1px solid #555', borderRadius: 4, color: 'var(--text)', padding: '4px 8px', textAlign: 'right' }}
                                              onChange={e => actualizarItem(i.producto_id, 'precio_unitario', e.target.value)} />
                                          </td>
                                          <td style={{ padding: 10, textAlign: 'center' }}>
                                            <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }}
                                              onClick={() => removerItem(i.producto_id)}>✕</button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </>
                            )}

              {/* Observaciones */}
              <div className="form-group mb-3">
                <label>Observaciones / Nota adicional:</label>
                <textarea className="form-control" rows="3" placeholder="Detalle opcional..."
                  value={form.observaciones} onChange={setFormField('observaciones')}
                  style={{ background: 'var(--bg-input)', color: 'var(--gold-light)', border: '1px solid #555', borderRadius: 6, padding: 12, fontFamily: '"Inter",sans-serif', fontSize: 13 }} />
              </div>

              {/* Encargado */}
              <div className="section-heading mt-4">Datos de entrega:</div>
              <div className="form-group mb-3">
                <label>Encargado de despacho:</label>
                <input className="form-control" type="text" placeholder="Ej: Camilo Alonso" 
                  value={form.encargado} onChange={setFormField('encargado')} />
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

            {/* Sidebar: órdenes pendientes solo en crear */}
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
      <Modal show={modal === 'error-num-nota'} message="Debe ingresar un número de nota."
        actions={<button className="btn btn-gold" onClick={() => setModal(null)}>✔ Aceptar</button>}/>
      <Modal show={modal === 'error-tipo'} message="Debe seleccionar el tipo de nota."
        actions={<button className="btn btn-gold" onClick={() => setModal(null)}>✔ Aceptar</button>}/>
      <Modal show={modal === 'error-num-factura'} message="En notas de facturación, el número de factura es obligatorio."
        actions={<button className="btn btn-gold" onClick={() => setModal(null)}>✔ Aceptar</button>}/>
      <Modal show={modal === 'error-items'} message="Debe agregar al menos un producto a la nota."
        actions={<button className="btn btn-gold" onClick={() => setModal(null)}>✔ Aceptar</button>}/>
      <Modal show={modal === 'error-encargado'} message="Debe ingresar el nombre del encargado de despacho."
        actions={<button className="btn btn-gold" onClick={() => setModal(null)}>✔ Aceptar</button>}/>
      <Modal show={modal === 'error-nota-existe'} message="Ya existe una nota de despacho con ese número. Use uno diferente."
        actions={<button className="btn btn-gold" onClick={() => setModal(null)}>✔ Aceptar</button>}/>
      <Modal show={modal === 'error-factura-existe'} message="Ya existe una nota con ese número de factura. Cada factura solo puede tener una nota de despacho."
        actions={<button className="btn btn-gold" onClick={() => setModal(null)}>✔ Aceptar</button>}/>
      <Modal show={modal === 'error-stock'} message="No hay suficiente stock para uno o más productos."
        actions={<button className="btn btn-gold" onClick={() => setModal(null)}>✔ Aceptar</button>}/>
      <Modal show={modal === 'error'} message="Ocurrió un error al guardar la nota. Verifique la conexión."
        actions={<button className="btn btn-gold" onClick={() => setModal(null)}>✔ Aceptar</button>}/>
      <Modal show={modal === 'insuficiente'} message="Lo sentimos, no se pudo procesar la nota de despacho por falta de stock suficiente en el inventario."
        actions={<button className="btn btn-gold" onClick={() => setModal(null)}>✔ Aceptar</button>}/>
    </Layout>
  )
}