import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'
import { supabase } from '../../lib/supabase.js'

export default function RegistrarEntrada() {
  const navigate = useNavigate()

  const [productosBD, setProductosBD] = useState([])
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [cargando, setCargando] = useState(false)

  const [modal, setModal] = useState(null)
  const [aviso, setAviso] = useState(null)

  const [form, setForm] = useState({
    nombre: '',
    codigo: '',
    proveedor: '',
    cantidad: '',
    vencimiento: ''
  })

  useEffect(() => {
    cargarProductos()
  }, [])

  // Cargar productos de la base de datos
  const cargarProductos = async () => {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .neq('estado', 'eliminado')

    if (!error && data) {
      setProductosBD(data)
    }
  }

  // Manejar búsqueda y autocompletado
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
        codigo: encontrado.codigo_sku || '',
        proveedor: encontrado.proveedor_id ? `Proveedor ID: ${encontrado.proveedor_id}` : 'General'
      }))
    } else {
      setProductoSeleccionado(null)
      setForm(f => ({
        ...f,
        nombre: valor,
        codigo: '',
        proveedor: ''
      }))
    }
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  // ÚNICA ACCIÓN: ACTUALIZAR EL STOCK
  const handleConfirmarEntrada = async () => {
    if (!form.nombre || !form.cantidad) { 
      setModal('errorCampos') 
      return 
    }

    const cant = parseInt(form.cantidad)
    if (!Number.isFinite(cant) || cant < 1) {
      setAviso('La cantidad debe ser un número entero de 1 o más.')
      return
    }

    // Buscar el producto en la lista cargada si no se seleccionó explícitamente
    let prod = productoSeleccionado
    if (!prod) {
      prod = productosBD.find(p => p.nombre.toLowerCase() === form.nombre.toLowerCase())
    }

    if (!prod) {
      setAviso('El producto seleccionado no existe en el inventario.')
      return
    }

    setCargando(true)

    // Sumar directamente la cantidad al stock actual
    const nuevoStock = (prod.stock || 0) + cant

    const { error: errStock } = await supabase
      .from('productos')
      .update({ stock: nuevoStock })
      .eq('id', prod.id)

    setCargando(false)

    if (errStock) {
      setAviso('Error al actualizar el stock: ' + errStock.message)
      return
    }

    setModal('ok')
  }

  return (
    <Layout>
      <div className="main-content">
        <div className="card card-gold" style={{ maxWidth: 680, margin: '40px auto', padding: '25px' }}>
          <div className="section-heading" style={{ marginTop: 0, marginBottom: '20px' }}>
            Registrar Entrada de Producto
          </div>

          <div className="form-group mb-3">
            <label>Nombre del producto (Escribe para buscar):</label>
            <input 
              className="form-control" 
              type="text" 
              list="lista-productos-inventario"
              placeholder="Ej: Agua Dasani, Teq. Don Julio..." 
              value={form.nombre} 
              onChange={handleNombreChange}
              autoComplete="off"
            />
            <datalist id="lista-productos-inventario">
              {productosBD.map((p) => (
                <option key={p.id} value={p.nombre}>
                  {p.codigo_sku ? `[SKU: ${p.codigo_sku}]` : ''}
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
            <label>Proveedor:</label>
            <input 
              className="form-control" 
              type="text" 
              placeholder="Se llena automáticamente" 
              value={form.proveedor} 
              readOnly 
              style={{ background: '#222', color: '#aaa' }} 
            />
          </div>

          <div className="form-group mb-3">
            <label>Cantidad entrante:</label>
            <input 
              className="form-control" 
              type="number" 
              placeholder="0" 
              value={form.cantidad} 
              onChange={set('cantidad')} 
            />
          </div>

          <div className="form-group mb-4">
            <label>Fecha de vencimiento (Opcional):</label>
            <input 
              className="form-control" 
              type="date" 
              value={form.vencimiento} 
              onChange={set('vencimiento')} 
            />
          </div>

          <div className="mt-3 text-center gap-2 d-flex justify-content-center">
            <button className="btn btn-gold" onClick={handleConfirmarEntrada} disabled={cargando}>
              {cargando ? 'Guardando...' : 'Confirmar Entrada'}
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/inventario')}>
              Cancelar
            </button>
          </div>
        </div>
      </div>

      <Modal show={modal === 'ok'} message="¡Producto registrado correctamente!"
        actions={<button className="btn btn-gold" onClick={() => navigate('/inventario')}>✔ Aceptar</button>}/>
      <Modal show={modal === 'errorCampos'} message="Debe seleccionar un producto existente y colocar una cantidad válida."
        actions={<button className="btn btn-gold" onClick={() => setModal(null)}>✔ Aceptar</button>}/>
      <Modal show={!!aviso} message={aviso}
        actions={<button className="btn btn-gold" onClick={() => setAviso(null)}>✔ Entendido</button>}/>
    </Layout>
  )
}