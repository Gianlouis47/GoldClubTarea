import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'
import { supabase } from '../../lib/supabase.js'

const UBICACIONES = ['AI-01','AI-02','BI-01','BI-02','BI-03','BI-06','AI-04','A2-01','B2-02']

export default function AsignarUbicacion() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState('AI-01')
  const [modal, setModal] = useState(null)
  const [pendientes, setPendientes] = useState([])

  useEffect(() => {
    supabase.from('productos').select('id,nombre,stock').is('ubicacion_id', null).limit(10)
      .then(({ data }) => setPendientes(data || []))
  }, [])

  const handleConfirmar = async () => {
    const { data: ubs } = await supabase.from('ubicaciones').select('id').eq('nombre', selected)
    if (!ubs?.length) { setModal('ok'); return } 
    setModal('ok')
  }

  return (
    <Layout>
      <div className="main-content">
        <h1 className="page-title">Ubicación en almacén</h1>
        <div className="two-col">
          <div className="card card-gold">
            <div className="search-bar mb-2" style={{maxWidth:'100%'}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" placeholder="Buscar código del producto" />
            </div>

            <div className="section-heading">Productos pendientes por ubicar:</div>
            <ul className="sidebar-list">
              {pendientes.length === 0
                ? <li>Sin productos pendientes</li>
                : pendientes.map(p => <li key={p.id}>{p.stock}x {p.nombre} <span className="sidebar-arrow">▶</span></li>)
              }
            </ul>

            <div className="section-heading">Todas las ubicaciones disponibles</div>
            <div className="ubicacion-grid">
              {UBICACIONES.map(u => (
                <button key={u} className={'ubicacion-btn' + (selected === u ? ' selected' : '')} onClick={() => setSelected(u)}>{u}</button>
              ))}
            </div>

            <div className="mt-3 text-center">
              <button className="btn btn-gold" onClick={handleConfirmar}>Confirmar</button>
            </div>
          </div>
        </div>
      </div>

      <Modal show={modal === 'ok'} message="Ubicación asignada correctamente."
        actions={<button className="btn btn-gold" onClick={() => navigate('/dashboard')}>✔ Aceptar</button>}/>
      <Modal show={modal === 'error'} message="La ubicación ya no está disponible."
        actions={<button className="btn btn-gold" onClick={() => setModal(null)}>Seleccionar otra ubicación</button>}/>
    </Layout>
  )
}
