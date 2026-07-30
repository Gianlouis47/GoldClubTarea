import React, { useState, useEffect } from 'react'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'
import { supabase } from '../../lib/supabase.js'
import { mensajeError } from '../../lib/errores.js'

export default function ConsultarMovimientos() {
  const hoy = new Date().toISOString().split('T')[0]
  const hace30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  const [tipo, setTipo] = useState('Todos')
  const [desde, setDesde] = useState(hace30)
  const [hasta, setHasta] = useState(hoy)
  const [movimientos, setMovimientos] = useState([])
  const [modal, setModal] = useState(null)
  const [cargandoMov, setCargandoMov] = useState(true)
  const [errorMov, setErrorMov] = useState(null)

  // BUG que habia aqui: el tipo se calculaba con
  //     tipo.toUpperCase().replace('S','')
  // y replace() solo cambia la PRIMERA coincidencia, asi que:
  //   'Entradas' -> 'ENTRADA'  (bien, por casualidad)
  //   'Salidas'  -> 'ALIDAS'   (mal: quitaba la S del principio)
  // Resultado: filtrar por "Salidas" no devolvia nunca nada.
  const TIPO_BD = { Entradas: 'ENTRADA', Salidas: 'SALIDA' }

  const cargar = async () => {
    setCargandoMov(true)
    let q = supabase.from('movimientos_inventario')
      .select('id, tipo_movimiento, cantidad, fecha, referencia, productos(nombre,codigo_sku), usuarios(nombre,apellido)')
      .gte('fecha', desde)
      .lte('fecha', hasta + 'T23:59:59')
      .order('fecha', { ascending: false })

    if (tipo !== 'Todos' && TIPO_BD[tipo]) q = q.eq('tipo_movimiento', TIPO_BD[tipo])

    const { data, error } = await q
    setCargandoMov(false)

    if (error) { setMovimientos([]); setErrorMov(mensajeError(error, 'consultar los movimientos')); return }

    setErrorMov(null)
    // Antes se hacia return sin vaciar la lista, asi que quedaban en pantalla
    // los movimientos de la busqueda anterior junto al aviso de "sin datos".
    setMovimientos(data || [])
    if (!data?.length) setModal('sinMovimientos')
  }

  useEffect(() => { cargar() }, [])

  const badge = (tipo) => tipo === 'ENTRADA'
    ? <span style={{background:'rgba(76,175,125,0.2)',color:'#4caf7d',padding:'2px 10px',borderRadius:12}}>Entrada</span>
    : <span style={{background:'rgba(224,82,82,0.2)',color:'#e05252',padding:'2px 10px',borderRadius:12}}>Salida</span>

  return (
    <Layout>
      <div className="main-content">
        <div className="flex-between mb-2">
          <h1 className="page-title">Consultar movimientos</h1>
          <div className="search-bar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Buscar producto..." />
          </div>
        </div>

        <div className="card card-gold mb-2">
          <div className="flex gap-3 mb-2" style={{flexWrap:'wrap'}}>
            <div>
              <label className="text-muted" style={{fontSize:12,display:'block',marginBottom:4}}>Tipo</label>
              <select className="form-control" style={{maxWidth:140}} value={tipo} onChange={e => setTipo(e.target.value)}>
                <option>Todos</option><option>Entradas</option><option>Salidas</option>
              </select>
            </div>
            <div>
              <label className="text-muted" style={{fontSize:12,display:'block',marginBottom:4}}>Desde</label>
              <input className="form-control" type="date" value={desde} onChange={e => setDesde(e.target.value)} style={{maxWidth:160}}/>
            </div>
            <div>
              <label className="text-muted" style={{fontSize:12,display:'block',marginBottom:4}}>Hasta</label>
              <input className="form-control" type="date" value={hasta} onChange={e => setHasta(e.target.value)} style={{maxWidth:160}}/>
            </div>
            <div style={{alignSelf:'flex-end'}}>
              <button className="btn btn-gold" onClick={cargar}>Filtrar</button>
            </div>
          </div>
        </div>

        <div className="card">
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead>
              <tr style={{borderBottom:'1px solid #3a3a3a',color:'var(--text-muted)'}}>
                <th style={{padding:10,textAlign:'left'}}>Fecha</th>
                <th style={{padding:10,textAlign:'left'}}>Producto</th>
                <th style={{padding:10,textAlign:'left'}}>Código</th>
                <th style={{padding:10,textAlign:'left'}}>Tipo</th>
                <th style={{padding:10,textAlign:'left'}}>Cantidad</th>
                <th style={{padding:10,textAlign:'left'}}>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {cargandoMov && (
                <tr><td colSpan="6" style={{padding:20,textAlign:'center'}} className="text-muted">Cargando movimientos...</td></tr>
              )}
              {!cargandoMov && errorMov && (
                <tr><td colSpan="6" style={{padding:20,textAlign:'center',color:'var(--danger)'}}>{errorMov}</td></tr>
              )}
              {!cargandoMov && !errorMov && movimientos.length === 0 && (
                <tr><td colSpan="6" style={{padding:20,textAlign:'center'}} className="text-muted">
                  No hay movimientos entre esas fechas para el tipo seleccionado.
                </td></tr>
              )}
              {movimientos.map((m, i) => (
                <tr key={m.id} style={{borderBottom: i < movimientos.length - 1 ? '1px solid #3a3a3a' : 'none'}}>
                  <td style={{padding:10}}>{new Date(m.fecha).toLocaleDateString('es-DO')}</td>
                  <td style={{padding:10}}>{m.productos?.nombre || '—'}</td>
                  <td style={{padding:10,color:'var(--gold)'}}>{m.productos?.codigo_sku || '—'}</td>
                  <td style={{padding:10}}>{badge(m.tipo_movimiento)}</td>
                  <td style={{padding:10}}>{m.cantidad}</td>
                  <td style={{padding:10}}>{m.usuarios ? `${m.usuarios.nombre} ${m.usuarios.apellido}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal show={modal === 'sinMovimientos'} message="No existen movimientos con los filtros seleccionados."
        actions={<button className="btn btn-gold" onClick={() => setModal(null)}>✔ Aceptar</button>}/>
    </Layout>
  )
}
