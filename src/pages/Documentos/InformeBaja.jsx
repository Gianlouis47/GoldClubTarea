import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'
import { supabase } from '../../lib/supabase.js'
import { mensajeError } from '../../lib/errores.js'
import { usuarioIdValido } from '../../lib/sesion.js'

export default function InformeBaja() {
  const navigate = useNavigate()
  const hoy = new Date().toLocaleDateString('es-DO')
  
  const [vista, setVista] = useState('lista')
  const [bajas, setBajas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  
  const [form, setForm] = useState({ codigo: '', motivo: '', cantidad: '', fecha: hoy })
  const [editandoId, setEditandoId] = useState(null)
  const [cantidadOriginal, setCantidadOriginal] = useState(0)

  useEffect(() => {
    cargarBajas()
  }, [])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

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
    setForm({ codigo: '', motivo: '', cantidad: '', fecha: hoy })
    setEditandoId(null)
    setVista('crear')
  }

  const handleGenerar = async () => {
    if (!form.codigo || !form.cantidad) {
      alert("Por favor, introduce el código del producto y la cantidad.")
      return
    }
    const cant = parseInt(form.cantidad)
    if (!Number.isFinite(cant) || cant < 1) {
      alert("La cantidad debe ser un número entero de 1 o más.")
      return
    }

    const { data: productos, error: errProd } = await supabase
      .from('productos').select('id,stock').eq('codigo_sku', form.codigo)
    if (errProd) { alert(mensajeError(errProd, 'buscar el producto')); return }
    if (!productos?.length) {
      alert("El código de producto no existe.")
      return
    }

    const prod = productos[0]

    if (prod.stock < cant) {
      alert("La cantidad ingresada supera al stock actual.")
      return
    }

    // Antes se descontaba el stock PRIMERO y se insertaba el informe despues
    // sin comprobar el error: el inventario podia quedar rebajado sin informe.
    // Ahora se crea el informe y solo entonces se toca el stock.
    const usuarioId = await usuarioIdValido()
    const { data: informe, error: errIns } = await supabase.from('informe_baja').insert({
      producto_id: prod.id,
      usuario_id: usuarioId ?? undefined,
      cantidad: cant,
      observaciones: form.motivo,
      estado: 'activo'
    }).select('id').single()

    if (errIns || !informe) { alert(mensajeError(errIns, 'guardar el informe de baja')); return }

    const { error: errStock } = await supabase
      .from('productos').update({ stock: prod.stock - cant }).eq('id', prod.id)

    if (errStock) {
      await supabase.from('informe_baja').delete().eq('id', informe.id)
      alert(mensajeError(errStock, 'descontar el stock') +
        ' El informe se canceló para que el inventario no quede descuadrado.')
      return
    }

    setModal('crear-ok')
  }

  const irAEditar = (baja) => {
    setEditandoId(baja.id)
    setCantidadOriginal(baja.cantidad)
    setForm({
      codigo: baja.productos?.codigo_sku || '',
      motivo: baja.observaciones || '',
      cantidad: baja.cantidad,
      fecha: new Date(baja.created_at).toLocaleDateString('es-DO')
    })
    setVista('editar')
  }

  const handleActualizar = async () => {
    const cantNueva = parseInt(form.cantidad)
    if (!form.motivo || isNaN(cantNueva)) return

    // Antes se hacia  baja.producto_id  sin comprobar que `baja` existiera:
    // si la consulta fallaba, `baja` era null y la pagina se caia con
    // "Cannot read properties of null" (pantalla en blanco).
    const { data: baja, error: errBaja } = await supabase
      .from('informe_baja').select('producto_id').eq('id', editandoId).maybeSingle()
    if (errBaja) { alert(mensajeError(errBaja, 'buscar el informe')); return }
    if (!baja?.producto_id) {
      alert("No se encontró el informe de baja o no tiene producto asociado.")
      return
    }

    const { data: prod, error: errProd } = await supabase
      .from('productos').select('stock').eq('id', baja.producto_id).maybeSingle()
    if (errProd) { alert(mensajeError(errProd, 'consultar el stock')); return }
    // Antes, si esto era falsy la funcion terminaba en silencio y el boton
    // "Guardar cambios" no hacia nada sin explicar por que.
    if (!prod) {
      alert("El producto de este informe ya no existe en inventario, no se puede recalcular el stock.")
      return
    }

    const stockRecompuesto = prod.stock + cantidadOriginal
    if (stockRecompuesto < cantNueva) {
      alert("No hay suficiente stock disponible.")
      return
    }

    const { error: errUpd } = await supabase.from('informe_baja')
      .update({ cantidad: cantNueva, observaciones: form.motivo }).eq('id', editandoId)
    if (errUpd) { alert(mensajeError(errUpd, 'actualizar el informe')); return }

    const { error: errStock } = await supabase.from('productos')
      .update({ stock: stockRecompuesto - cantNueva }).eq('id', baja.producto_id)
    if (errStock) {
      await supabase.from('informe_baja').update({ cantidad: cantidadOriginal }).eq('id', editandoId)
      alert(mensajeError(errStock, 'recalcular el stock') + ' Se restauró la cantidad anterior.')
      return
    }

    setModal('editar-ok')
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

    const { data: prod, error: errProd } = await supabase
      .from('productos').select('stock').eq('id', productoId).maybeSingle()
    if (errProd) { alert(mensajeError(errProd, 'consultar el producto')); return }
    if (!prod) {
      alert("No se pudo encontrar el producto original para reponer las unidades.")
      return
    }

    const { error: errStock } = await supabase
      .from('productos').update({ stock: prod.stock + cantidad }).eq('id', productoId)
    if (errStock) { alert(mensajeError(errStock, 'reponer el stock')); return }

    const { error: errBaja } = await supabase
      .from('informe_baja').update({ estado: 'activo' }).eq('id', bajaId)
    if (errBaja) {
      // Deshacemos la reposicion para no inflar el inventario.
      await supabase.from('productos').update({ stock: prod.stock }).eq('id', productoId)
      alert(mensajeError(errBaja, 'restaurar el informe') + ' Se deshizo la reposición de stock.')
      return
    }

    alert("¡Stock repuesto con éxito e informe restaurado en el historial!")
    cargarBajas()
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
              <label>Código del producto:</label>
              <input className="form-control" type="text" placeholder="Ej: 14839987325" value={form.codigo} onChange={set('codigo')} disabled={vista === 'editar'} />
            </div>
            
            <div className="form-group mb-3">
              <label>Motivo de baja:</label>
              <input className="form-control" type="text" placeholder="Ej: Producto vencido" value={form.motivo} onChange={set('motivo')} />
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