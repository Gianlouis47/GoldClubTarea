import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import { supabase } from '../../lib/supabase.js'

export default function EditarProducto() {
  const { id } = useParams() 
  const navigate = useNavigate()
  
  const [nombre, setNombre] = useState('')
  const [precioVenta, setPrecioVenta] = useState('')
  const [stock, setStock] = useState('')
  const [unidadMedida, setUnidadMedida] = useState('unidad')
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    obtenerProducto()
  }, [id])

  const obtenerProducto = async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('id', id)
      .single()

    if (!error && data) {
      setNombre(data.nombre)
      setPrecioVenta(data.precio_venta)
      setStock(data.stock)
      setUnidadMedida(data.unidad_medida)
    } else {
      alert('No se pudo encontrar el producto')
      navigate('/inventario')
    }
    setCargando(false)
  }

  const handleGuardarCambios = async (e) => {
    e.preventDefault()

    if (!nombre || !precioVenta || !stock) {
      alert('Por favor, completa todos los campos obligatorios.')
      return
    }

    const { error } = await supabase
      .from('productos')
      .update({
        nombre: nombre,
        precio_venta: parseFloat(precioVenta),
        stock: parseInt(stock),
        unidad_medida: unidadMedida
      })
      .eq('id', id)

    if (error) {
      alert('Error al actualizar el producto: ' + error.message)
    } else {
      alert('¡Producto actualizado con éxito!')
      navigate('/inventario') // Regresa a la tabla
    }
  }

  if (cargando) {
    return (
      <Layout>
        <div className="main-content text-center text-white mt-5">Cargando datos del producto...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="main-content">
        <div className="card card-gold" style={{ maxWidth: 500, margin: '40px auto', padding: '20px' }}>
          <h2 className="mb-4 text-white">✏️ Editar Producto</h2>
          
          <form onSubmit={handleGuardarCambios}>
            <div className="mb-3">
              <label className="form-label text-white">Nombre del Producto</label>
              <input 
                type="text" 
                className="form-control" 
                value={nombre} 
                onChange={(e) => setNombre(e.target.value)} 
              />
            </div>

            <div className="mb-3">
              <label className="form-label text-white">Precio de Venta ($)</label>
              <input 
                type="number" 
                step="0.01" 
                className="form-control" 
                value={precioVenta} 
                onChange={(e) => setPrecioVenta(e.target.value)} 
              />
            </div>

            <div className="mb-3">
              <label className="form-label text-white">Stock Actual</label>
              <input 
                type="number" 
                className="form-control" 
                value={stock} 
                onChange={(e) => setStock(e.target.value)} 
              />
            </div>

            <div className="mb-4">
              <label className="form-label text-white">Unidad de Medida</label>
              <select 
                className="form-select" 
                value={unidadMedida} 
                onChange={(e) => setUnidadMedida(e.target.value)}
              >
                <option value="unidad">Unidad</option>
                <option value="botella">Botella</option>
                <option value="caja">Caja</option>
                <option value="litro">Litro</option>
              </select>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-outline-light" onClick={() => navigate('/inventario')}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-gold">
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}