import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import { supabase } from '../../lib/supabase.js'
import { mensajeError } from '../../lib/errores.js'

export default function Dashboard() {
  // Ojo: estos valores arrancan en 0, no en 78/12. Antes eran datos de ejemplo
  // que se quedaban en pantalla cuando la carga fallaba y parecian reales.
  const [stats, setStats] = useState({ total: 0, stockPct: 0, vencePct: 0 })
  const [alertas, setAlertas] = useState([])
  const [ultima, setUltima] = useState('')
  const [errorCarga, setErrorCarga] = useState(null)

  useEffect(() => {
    const loadStats = async () => {
      // BUG que habia aqui: se usaba
      //     .lt('stock', supabase.raw('stock_minimo'))
      // pero supabase.raw() NO EXISTE en supabase-js v2, asi que la funcion
      // lanzaba "supabase.raw is not a function", el .catch(() => {}) se lo
      // tragaba y el dashboard se quedaba mostrando el 78% y el 12% de
      // ejemplo que estaban puestos a mano en el useState.
      //
      // PostgREST tampoco permite comparar dos columnas entre si, asi que se
      // traen las dos columnas y se comparan en JavaScript.
      const { data: productos, error: errProd } = await supabase
        .from('productos').select('id, stock, stock_minimo').eq('activo', true)
      if (errProd) throw errProd

      const total = productos?.length || 0
      const bajos = (productos || []).filter(p => (p.stock ?? 0) < (p.stock_minimo ?? 0))

      // Lotes que vencen en los proximos 30 dias (no los ya vencidos).
      const hoy = new Date()
      const fecha30 = new Date(); fecha30.setDate(fecha30.getDate() + 30)
      const iso = (d) => d.toISOString().split('T')[0]

      const { data: lotes, error: errLotes } = await supabase
        .from('lotes').select('id, fecha_vencimiento').not('fecha_vencimiento', 'is', null)
      if (errLotes) throw errLotes

      const totalLotes = lotes?.length || 0
      const lotesPV = (lotes || []).filter(l =>
        l.fecha_vencimiento >= iso(hoy) && l.fecha_vencimiento <= iso(fecha30)
      )
      const vencidos = (lotes || []).filter(l => l.fecha_vencimiento < iso(hoy))

      setStats({
        total,
        // Porcentaje de productos con stock sano.
        stockPct: total ? Math.round(((total - bajos.length) / total) * 100) : 0,
        // Antes se dividian lotes entre productos, que son cosas distintas.
        vencePct: totalLotes ? Math.round((lotesPV.length / totalLotes) * 100) : 0,
      })
      setUltima(new Date().toLocaleString('es-DO'))

      const alertasData = []
      if (bajos.length) alertasData.push({ tipo: 'red', msg: `Nivel mínimo: ${bajos.length} producto(s) por debajo del stock mínimo.` })
      if (lotesPV.length) alertasData.push({ tipo: 'red', msg: `Próximos a vencer: ${lotesPV.length} lote(s) en los próximos 30 días.` })
      if (vencidos.length) alertasData.push({ tipo: 'red', msg: `Ya vencidos: ${vencidos.length} lote(s). Revisa Informe de baja.` })
      setAlertas(alertasData)
    }

    // Un fallo silencioso es peor que una caída: se avisa en pantalla.
    loadStats().catch((e) => setErrorCarga(mensajeError(e, 'cargar los datos del panel')))
  }, [])

  return (
    <Layout>
      <div className="main-content">
        <div className="flex-between mb-2">
          <h1 className="page-title">Movimientos de inventario</h1>
          <div className="search-bar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Buscar..." />
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="card card-gold">
            <div className="section-heading" style={{marginTop:0}}>Estado general</div>
            <div className="flex gap-3 mt-2">
              <div>
                <div className="stat-circle stat-gold">{stats.stockPct}%</div>
                <div className="stat-label">Nivel de stock actual</div>
              </div>
              <div>
                <div className="stat-circle stat-blue">{stats.vencePct}%</div>
                <div className="stat-label">Productos próximos a vencer</div>
              </div>
            </div>
            <div className="mt-2 text-muted">Última actualización: <span style={{color:'#aaa'}}>{ultima}</span></div>
            <div className="mt-1 text-muted">Total de productos registrados: <span style={{color:'#aaa'}}>{stats.total}</span></div>
          </div>

          <div className="card">
            <div className="flex-between mb-1">
              <span style={{fontWeight:600,fontSize:14}}>Movimientos últimos 30 días</span>
            </div>
            <div className="chart-legend mb-1">
              <div className="legend-item"><div style={{width:10,height:10,borderRadius:2,background:'#4caf7d'}}></div> Entradas</div>
              <div className="legend-item"><div style={{width:10,height:10,borderRadius:2,background:'#e05252'}}></div> Salidas</div>
            </div>
            <div className="fake-chart"></div>
            <div style={{height:40,marginTop:6,background:'linear-gradient(to right,rgba(224,82,82,0.3),rgba(224,82,82,0.1))',borderRadius:6,position:'relative'}}>
              <div style={{position:'absolute',bottom:0,left:0,right:0,height:3,background:'#e05252'}}></div>
            </div>
          </div>

          <div className="card" style={{gridColumn:'1 / -1'}}>
            <div style={{fontWeight:600,fontSize:14,marginBottom:12}}>Alertas</div>
            {errorCarga && (
              <div className="alert-item" style={{border:'none'}}>
                <div className="alert-dot" style={{background:'var(--danger)'}}></div>
                <span>{errorCarga}</span>
              </div>
            )}
            {!errorCarga && alertas.length === 0 && (
              <div className="alert-item" style={{border:'none'}}>
                <div className="alert-dot dot-green"></div>
                <span>Sin alertas activas.</span>
              </div>
            )}
            {alertas.map((a, i) => (
              <div key={i} className="alert-item" style={i === alertas.length - 1 ? {border:'none'} : {}}>
                <div className="alert-dot" style={{background: a.tipo === 'green' ? 'var(--success)' : 'var(--danger)'}}></div>
                <span>{a.msg}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="section-heading mt-3">Acceso rápido</div>
        <div className="menu-grid">
          <Link className="menu-card" to="/inventario">
            <svg className="menu-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14"/><path d="M5 12h14"/><rect x="3" y="3" width="18" height="18" rx="2"/>
            </svg>
            <span className="menu-card-label">Crear producto</span>
          </Link>
          <Link className="menu-card" to="/inventario/registrar-entrada">
            <svg className="menu-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
            <span className="menu-card-label">Registrar entrada de producto</span>
          </Link>
          <Link className="menu-card" to="/documentos/nota-despacho">
            <svg className="menu-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11H5a2 2 0 00-2 2v5a2 2 0 002 2h14a2 2 0 002-2v-5a2 2 0 00-2-2h-4M9 11V7a3 3 0 116 0v4M9 11h6" />
            </svg>
            <span className="menu-card-label">Preparar despacho</span>
          </Link>
          <Link className="menu-card" to="/inventario/registrar-salida">
            <svg className="menu-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
            </svg>
            <span className="menu-card-label">Registrar salida</span>
          </Link>
          <Link className="menu-card" to="/inventario/asignar-ubicacion">
            <svg className="menu-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            <span className="menu-card-label">Asignar ubicación</span>
          </Link>
          <Link className="menu-card" to="/inventario/consultar-movimientos">
            <svg className="menu-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className="menu-card-label">Consultar movimientos</span>
          </Link>
          <Link className="menu-card" to="/inventario/generar-alerta">
            <svg className="menu-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <span className="menu-card-label">Generar alerta por nivel mínimo</span>
          </Link>
        </div>
        <div className="mt-3 text-center">
          <Link className="btn btn-outline" to="/menu">Ver más opciones</Link>
        </div>
      </div>
    </Layout>
  )
}
