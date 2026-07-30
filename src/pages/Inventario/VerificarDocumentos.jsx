import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import { supabase } from '../../lib/supabase.js'
import { mensajeError } from '../../lib/errores.js'

// Antes esta pantalla mostraba TRES documentos inventados escritos a mano
// (#DESP-0012, #INC-2025-0045, #ORD-PREP-24) con fechas fijas de 2025. Parecian
// reales pero no salian de la base de datos, asi que "verificar documentos" no
// servia para nada. Ahora se leen los documentos que existen de verdad.

const fmtFecha = (valor) => {
  if (!valor) return '—'
  const d = new Date(valor)
  return isNaN(d.getTime()) ? String(valor) : d.toLocaleDateString('es-DO')
}

const ESTILO_ESTADO = {
  activo:    { bg: 'rgba(76,175,125,0.2)', color: '#4caf7d', texto: 'Activo' },
  eliminado: { bg: 'rgba(224,82,82,0.2)',  color: '#e05252', texto: 'En papelera' },
}

export default function VerificarDocumentos() {
  const [docs, setDocs] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    cargarDocumentos()
  }, [])

  const cargarDocumentos = async () => {
    setCargando(true)
    setError(null)

    const [notas, incidentes, preparaciones] = await Promise.all([
      supabase.from('nota_despacho')
        .select('id, num_nota, num_orden, estado, created_at, receptor')
        .order('id', { ascending: false }).limit(25),
      supabase.from('reporte_incidentes')
        .select('id, num_orden, codigo_producto, estado, created_at, creado_por')
        .order('id', { ascending: false }).limit(25),
      supabase.from('orden_preparacion')
        .select('id, num_orden, codigo, estado, created_at, destino')
        .order('id', { ascending: false }).limit(25),
    ])

    const fallo = notas.error || incidentes.error || preparaciones.error
    if (fallo) {
      setError(mensajeError(fallo, 'cargar los documentos'))
      setCargando(false)
      return
    }

    const lista = [
      ...(notas.data || []).map(n => ({
        clave: `nd-${n.id}`,
        id: n.num_nota || `ND-${n.id}`,
        tipo: 'Nota de despacho',
        orden: n.num_orden,
        detalle: n.receptor ? `Recibe: ${n.receptor}` : null,
        fecha: n.created_at,
        estado: n.estado,
        link: '/documentos/nota-despacho',
      })),
      ...(incidentes.data || []).map(i => ({
        clave: `inc-${i.id}`,
        id: `INC-${i.id}`,
        tipo: 'Reporte incidentes',
        orden: i.num_orden,
        detalle: i.codigo_producto ? `Producto: ${i.codigo_producto}` : null,
        fecha: i.created_at,
        estado: i.estado,
        link: '/documentos/reporte-incidentes',
      })),
      ...(preparaciones.data || []).map(o => ({
        clave: `prep-${o.id}`,
        id: `PREP-${o.id}`,
        tipo: 'Orden preparación',
        orden: o.num_orden,
        detalle: o.destino ? `Destino: ${o.destino}` : null,
        fecha: o.created_at,
        estado: o.estado,
        link: '/documentos/orden-preparacion',
      })),
    ].sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0))

    setDocs(lista)
    setCargando(false)
  }

  const filtrados = docs.filter(d => {
    const t = busqueda.trim().toLowerCase()
    if (!t) return true
    return [d.id, d.tipo, d.orden, d.detalle].some(
      v => (v || '').toString().toLowerCase().includes(t)
    )
  })

  return (
    <Layout>
      <div className="main-content">
        <h1 className="page-title">Verificar documentos</h1>
        <div className="card card-gold">
          <div className="flex-between mb-2">
            <span style={{ fontWeight: 600 }}>Documentos registrados en el sistema</span>
            <div className="search-bar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Buscar por Nº doc, tipo u orden..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #3a3a3a', color: 'var(--text-muted)' }}>
                <th style={{ padding: 10, textAlign: 'left' }}>N.&ordm; Documento</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Tipo</th>
                <th style={{ padding: 10, textAlign: 'left' }}>N.&ordm; Orden</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Fecha</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Estado</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan="6" style={{ padding: 20, textAlign: 'center' }} className="text-muted">
                  Cargando documentos...
                </td></tr>
              ) : error ? (
                <tr><td colSpan="6" style={{ padding: 20, textAlign: 'center', color: 'var(--danger)' }}>
                  {error}
                </td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: 20, textAlign: 'center' }} className="text-muted">
                  {busqueda
                    ? `Ningún documento coincide con "${busqueda}".`
                    : 'Todavía no hay documentos registrados. Créalos desde la sección Documentos.'}
                </td></tr>
              ) : (
                filtrados.map((d, i) => {
                  const est = ESTILO_ESTADO[d.estado] ||
                    { bg: 'rgba(212,160,23,0.2)', color: 'var(--gold)', texto: d.estado || 'Pendiente' }
                  return (
                    <tr key={d.clave} style={{ borderBottom: i < filtrados.length - 1 ? '1px solid #3a3a3a' : 'none' }}>
                      <td style={{ padding: 10, color: 'var(--gold)' }}>{d.id}</td>
                      <td style={{ padding: 10 }}>
                        {d.tipo}
                        {d.detalle && <><br/><small className="text-muted">{d.detalle}</small></>}
                      </td>
                      <td style={{ padding: 10 }}>{d.orden || '—'}</td>
                      <td style={{ padding: 10 }}>{fmtFecha(d.fecha)}</td>
                      <td style={{ padding: 10 }}>
                        <span style={{ background: est.bg, color: est.color, padding: '2px 10px', borderRadius: 12 }}>
                          {est.texto}
                        </span>
                      </td>
                      <td style={{ padding: 10 }}>
                        <Link className="btn btn-gold" style={{ padding: '4px 14px', fontSize: 12 }} to={d.link}>Ver</Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
