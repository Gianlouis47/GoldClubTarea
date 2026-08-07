import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'
import { supabase } from '../../lib/supabase.js'

export default function RegistrarSalida() {
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]

  const [productosBD, setProductosBD] = useState([])
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [cargando, setCargando] = useState(false)

  const [modal, setModal] = useState(null)
  const [aviso, setAviso] = useState(null)

  const [form, setForm] = useState({
    nombre: '',
    codigo: '',
    cantidad: '',
    motivo: '',
    fecha: today
  })

  useEffect(() => {
    cargarProductos()
  }, [])

  // Cargar productos activos desde Supabase
  const cargarProductos = async () => {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .neq('estado', 'eliminado')

    if (!error && data) {
      setProductosBD(data)
    }
  }

  // Manejar selección por nombre y autocompletar código SKU
  const handleNombreChange = (e) => {
    const valor = e.target.value

    const encontrado = productosBD.find(
      p => p.nombre?.toLowerCase() === valor.toLowerCase()
    )

    if (encontrado) {
      setProductoSeleccionado(encontrado)
      setForm(f => ({
        ...f,
        nombre: encontrado.nombre,
        codigo: encontrado.codigo_sku || ''
      }))
    } else {
      setProductoSeleccionado(null)
      setForm(f => ({
        ...f,
        nombre: valor,
        codigo: ''
      }))
    }
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  // ÚNICA ACCIÓN: DESCONTAR STOCK
  const handleConfirmarSalida = async () => {
    if (!form.nombre || !form.cantidad) {
      setAviso('Selecciona un producto y especifica la cantidad a retirar.')
      return
    }

    const cant = parseInt(form.cantidad)
    if (!Number.isFinite(cant) || cant < 1) {
      setAviso('La cantidad a retirar debe ser un número entero de 1 o más.')
      return
    }

    // Buscar producto
    let prod = productoSeleccionado
    if (!prod) {
      prod = productosBD.find(p => p.nombre.toLowerCase() === form.nombre.toLowerCase())
    }

    if (!prod) {
      setAviso('El producto seleccionado no existe en el inventario.')
      return
    }

    // Validar stock disponible
    if ((prod.stock || 0) < cant) {
      setAviso(`Stock insuficiente: "${prod.nombre}" solo tiene ${prod.stock || 0} unidades disponibles y quieres retirar ${cant}.`)
      return
    }

    setCargando(true)

    // Restar directamente al stock
    const nuevoStock = (prod.stock || 0) - cant

    const { error: errStock } = await supabase
      .from('productos')
      .update({ stock: nuevoStock })
      .eq('id', prod.id)

    setCargando(false)

    if (errStock) {
      setAviso('Error al descontar el stock: ' + errStock.message)
      return
    }

    setModal('ok')
  }

  return (
    <Layout>
      <div className="main-content">
        <div className="card card-gold" style={{ maxWidth: 680, margin: '40px auto', padding: '25px' }}>
          <div className="section-heading" style={{ marginTop: 0, marginBottom: '20px' }}>
            Registrar Salida de Producto
          </div>

          <div className="form-group mb-3">
            <label>Nombre del producto (Escribe para buscar):</label>
            <input 
              className="form-control" 
              type="text" 
              list="lista-productos-salida"
              placeholder="Ej: Agua Dasani, Teq. Don Julio..." 
              value={form.nombre} 
              onChange={handleNombreChange}
              autoComplete="off"
            />
            <datalist id="lista-productos-salida">
              {productosBD.map((p) => (
                <option key={p.id} value={p.nombre}>
                  {p.codigo_sku ? `[SKU: ${p.codigo_sku}] (Stock: ${p.stock})` : `(Stock: ${p.stock})`}
                </option>
              ))}
            </datalist>
          </div>

          <div className="form-group mb-3">
            <label>Código SKU del producto:</label>
            <input 
              className="form-control" 
              type="text" 
              placeholder="Se llena automáticamente" 
              value={form.codigo} 
              readOnly 
              style={{ background: '#222', color: '#aaa' }} 
            />
          </div>

          <div className="form-group mb-3">
            <label>Cantidad a retirar:</label>
            <input 
              className="form-control" 
              type="number" 
              placeholder="0" 
              value={form.cantidad} 
              onChange={set('cantidad')} 
            />
          </div>

          <div className="form-group mb-3">
            <label>Motivo de salida (Opcional):</label>
            <input 
              className="form-control" 
              type="text" 
              placeholder="Ej: Venta, merma, caducidad..." 
              value={form.motivo} 
              onChange={set('motivo')} 
            />
          </div>

          <div className="form-group mb-4">
            <label>Fecha:</label>
            <input 
              className="form-control" 
              type="date" 
              value={form.fecha} 
              onChange={set('fecha')} 
            />
          </div>

          <div className="mt-3 text-center gap-2 d-flex justify-content-center">
            <button className="btn btn-gold" onClick={handleConfirmarSalida} disabled={cargando}>
              {cargando ? 'Guardando...' : 'Confirmar Salida'}
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/inventario')}>
              Cancelar
            </button>
          </div>
        </div>
      </div>

      <Modal show={modal === 'ok'} message="¡Salida registrada correctamente!"
        actions={<button className="btn btn-gold" onClick={() => navigate('/inventario')}>✔ Aceptar</button>}/>
      <Modal show={!!aviso} message={aviso}
        actions={<button className="btn btn-gold" onClick={() => setAviso(null)}>✔ Entendido</button>}/>
    </Layout>
  )
}