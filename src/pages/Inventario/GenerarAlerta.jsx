import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'
import { supabase } from '../../lib/supabase.js'
import { mensajeError } from '../../lib/errores.js'

export default function GenerarAlerta() {
  const navigate = useNavigate()
  const [codigo, setCodigo] = useState('')
  const [mensajes, setMensajes] = useState([])
  const [modal, setModal] = useState(null)

  const handleGenerar = async () => {
    if (!codigo.trim()) {
      setMensajes([{ color: 'var(--danger)', text: '⚠ Escribe el código del producto.' }])
      return
    }
    const { data, error } = await supabase
      .from('productos').select('id,nombre,stock,stock_minimo').eq('codigo_sku', codigo.trim())
    // Antes un error de la base de datos se confundia con "producto no encontrado".
    if (error) {
      setMensajes([{ color: 'var(--danger)', text: '⚠ ' + mensajeError(error, 'consultar el producto') }])
      return
    }
    if (!data?.length) {
      setMensajes([{ color:'var(--danger)', text: `⚠ Producto con código "${codigo}" no encontrado.` }])
      return
    }
    const prod = data[0]
    const msgs = [{ color:'var(--gold)', text: `▶ Verificando stock para: ${prod.nombre}` }]
    if (prod.stock < prod.stock_minimo) {
      msgs.push({ color:'#e05252', text: `⚠ Nivel de stock por debajo del mínimo (${prod.stock_minimo} unidades). Stock actual: ${prod.stock}.` })
      setMensajes(msgs)
      setModal('confirm')
    } else {
      msgs.push({ color:'var(--success)', text: `✔ Stock OK: ${prod.stock} unidades (mínimo: ${prod.stock_minimo}).` })
      setMensajes(msgs)
    }
  }

  return (
    <Layout>
      <div className="main-content">
        <h1 className="page-title"><span style={{color:'var(--gold)',marginRight:8}}>🔔</span>Generar alerta por nivel mínimo</h1>
        <p className="text-muted mb-2">Ingrese el código del producto para verificar su nivel de stock.</p>

        <div className="card card-gold" style={{maxWidth:680}}>
          <div className="flex gap-2 mb-3">
            <input className="form-control" type="text" placeholder="Código del producto..." style={{maxWidth:'none',flex:1}} value={codigo} onChange={e => setCodigo(e.target.value)}/>
            <button className="btn btn-gold" onClick={handleGenerar}>Generar alerta</button>
            <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>Cancelar</button>
          </div>

          <div className="section-heading">Mensajes del sistema</div>
          <div style={{background:'var(--bg-input)',borderRadius:8,minHeight:120,padding:16,fontSize:13,color:'var(--text-muted)'}} id="mensajesSistema">
            {mensajes.map((m, i) => <div key={i} style={{color:m.color,marginBottom:4}}>{m.text}</div>)}
          </div>
        </div>
      </div>

      <Modal show={modal === 'confirm'} message="¿Desea confirmar generar la alerta por stock mínimo?"
        actions={<>
          <button className="btn btn-danger" onClick={() => setModal(null)}>✕ Cancelar</button>
          <button className="btn btn-gold" onClick={() => setModal('ok')}>✔ Confirmar</button>
        </>}/>
      <Modal show={modal === 'ok'} message="Se ha confirmado con éxito la alerta por stock mínimo."
        actions={<button className="btn btn-gold" onClick={() => navigate('/dashboard')}>✔ Aceptar</button>}/>
    </Layout>
  )
}
