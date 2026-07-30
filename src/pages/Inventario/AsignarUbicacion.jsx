import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'
import { supabase } from '../../lib/supabase.js'
import { mensajeError } from '../../lib/errores.js'

export default function AsignarUbicacion() {
  const navigate = useNavigate()

  // BUG que habia aqui: handleConfirmar buscaba la ubicacion y despues hacia
  // setModal('ok') en LAS DOS ramas, sin actualizar nada. La pantalla decia
  // "Ubicacion asignada correctamente" y en la base de datos no pasaba nada.
  // Ademas las ubicaciones estaban escritas a mano en el codigo ('AI-01'...),
  // no existian en la tabla `ubicaciones`, y no habia forma de elegir a que
  // producto se le asignaba.
  const [ubicaciones, setUbicaciones] = useState([])
  const [ubicacionId, setUbicacionId] = useState(null)
  const [productos, setProductos] = useState([])
  const [productoId, setProductoId] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [modal, setModal] = useState(null)
  const [aviso, setAviso] = useState(null)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setCargando(true)

    const { data: ubs, error: errUbs } = await supabase
      .from('ubicaciones').select('id, nombre, descripcion').eq('activo', true).order('nombre')
    if (errUbs) { setAviso(mensajeError(errUbs, 'cargar las ubicaciones')); setCargando(false); return }
    setUbicaciones(ubs || [])

    const { data: prods, error: errProds } = await supabase
      .from('productos')
      .select('id, nombre, codigo_sku, stock, ubicacion_id, ubicaciones(nombre)')
      .eq('activo', true)
      .order('nombre')
    if (errProds) { setAviso(mensajeError(errProds, 'cargar los productos')); setCargando(false); return }
    setProductos(prods || [])

    setCargando(false)
  }

  const handleConfirmar = async () => {
    if (!productoId) { setAviso('Selecciona primero el producto que quieres ubicar.'); return }
    if (!ubicacionId) { setAviso('Selecciona una ubicación del almacén.'); return }

    setGuardando(true)
    const { error } = await supabase
      .from('productos').update({ ubicacion_id: ubicacionId }).eq('id', productoId)
    setGuardando(false)

    if (error) { setAviso(mensajeError(error, 'asignar la ubicación')); return }

    setModal('ok')
    cargarDatos()   // refresca para que se vea la ubicación nueva
  }

  const filtrados = productos.filter(p => {
    const t = busqueda.trim().toLowerCase()
    if (!t) return true
    return (p.codigo_sku || '').toLowerCase().includes(t) ||
           (p.nombre || '').toLowerCase().includes(t)
  })

  const sinUbicar = filtrados.filter(p => p.ubicacion_id == null)
  const yaUbicados = filtrados.filter(p => p.ubicacion_id != null)

  const productoSel = productos.find(p => p.id === productoId)
  const ubicacionSel = ubicaciones.find(u => u.id === ubicacionId)

  const FilaProducto = ({ p }) => (
    <li
      onClick={() => setProductoId(p.id)}
      style={{
        cursor: 'pointer',
        background: productoId === p.id ? 'rgba(212,160,23,0.15)' : 'transparent',
        borderRadius: 6,
      }}
    >
      <span>
        <code>{p.codigo_sku}</code> — {p.nombre} ({p.stock} uds.)
        {p.ubicaciones?.nombre && (
          <><br/><small className="text-muted">Ubicación actual: {p.ubicaciones.nombre}</small></>
        )}
      </span>
      <span className="sidebar-arrow">{productoId === p.id ? '✔' : '▶'}</span>
    </li>
  )

  return (
    <Layout>
      <div className="main-content">
        <h1 className="page-title">Ubicación en almacén</h1>

        <div className="two-col">
          <div className="card card-gold">
            <div className="search-bar mb-2" style={{ maxWidth: '100%' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Buscar por código o nombre del producto"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>

            <div className="section-heading">1. Elige el producto a ubicar</div>
            {cargando ? (
              <div className="text-muted">Cargando productos...</div>
            ) : (
              <>
                <ul className="sidebar-list">
                  {sinUbicar.length === 0
                    ? <li className="text-muted">
                        {busqueda
                          ? 'Ningún producto sin ubicar coincide con la búsqueda.'
                          : 'Todos los productos tienen ubicación asignada.'}
                      </li>
                    : sinUbicar.map(p => <FilaProducto key={p.id} p={p} />)
                  }
                </ul>

                {yaUbicados.length > 0 && (
                  <>
                    <div className="section-heading" style={{ fontSize: 13 }}>
                      Ya ubicados (puedes cambiarlos)
                    </div>
                    <ul className="sidebar-list">
                      {yaUbicados.map(p => <FilaProducto key={p.id} p={p} />)}
                    </ul>
                  </>
                )}
              </>
            )}

            <div className="section-heading">2. Elige la ubicación</div>
            {!cargando && ubicaciones.length === 0 ? (
              <div className="text-muted" style={{ fontSize: 13 }}>
                No hay ubicaciones activas registradas en la tabla <code>ubicaciones</code>.
              </div>
            ) : (
              <div className="ubicacion-grid">
                {ubicaciones.map(u => (
                  <button
                    key={u.id}
                    title={u.descripcion || u.nombre}
                    className={'ubicacion-btn' + (ubicacionId === u.id ? ' selected' : '')}
                    onClick={() => setUbicacionId(u.id)}
                  >
                    {u.nombre}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-3 text-center">
              <div className="text-muted mb-2" style={{ fontSize: 13 }}>
                {productoSel && ubicacionSel
                  ? <>Se asignará <strong>{productoSel.nombre}</strong> a <strong>{ubicacionSel.nombre}</strong>.</>
                  : 'Selecciona un producto y una ubicación para continuar.'}
              </div>
              <button
                className="btn btn-gold"
                onClick={handleConfirmar}
                disabled={guardando || !productoId || !ubicacionId}
              >
                {guardando ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal show={modal === 'ok'}
        message={`Ubicación asignada correctamente${productoSel ? ` a ${productoSel.nombre}` : ''}.`}
        actions={<>
          <button className="btn btn-outline" onClick={() => { setModal(null); setProductoId(null) }}>Ubicar otro</button>
          <button className="btn btn-gold" onClick={() => navigate('/dashboard')}>✔ Aceptar</button>
        </>}/>
      <Modal show={!!aviso} message={aviso}
        actions={<button className="btn btn-gold" onClick={() => setAviso(null)}>✔ Entendido</button>}/>
    </Layout>
  )
}
