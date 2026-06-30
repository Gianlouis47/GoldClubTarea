import React, { useState, useEffect } from 'react'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'
import { supabase } from '../../lib/supabase.js'

export default function CrearProducto() {
  const [vista, setVista] = useState('lista') 
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(null)

  const [form, setForm] = useState({
    id: null,
    nombre: '',
    codigo: '',
    proveedor: '',
    precio_compra: '0',
    precio_venta: '0',
    unidad_medida: 'unidad',
    stock: '0',
    stock_minimo: '0'
  })

  useEffect(() => {
    cargarProductos()
  }, [])

  const handleInputChange = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const cargarProductos = async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('id', { ascending: false })
      
    if (!error && data) {
      setProductos(data)
    }
    setCargando(false)
  }
  const irACrear = () => {
    setForm({
      id: null,
      nombre: '',
      codigo: '',
      proveedor: '',
      precio_compra: '0',
      precio_venta: '0',
      unidad_medida: 'unidad',
      stock: '0',
      stock_minimo: '0'
    })
    setVista('crear')
  }

  const handleCrearProducto = async () => {
    if (!form.nombre.trim() || !form.codigo.trim()) { 
      setModal('errorCampos')
      return 
    }

    const { error } = await supabase.from('productos').insert({
      nombre: form.nombre,
      codigo_sku: form.codigo,
      categoria_id: 1, 
      precio_compra: parseFloat(form.precio_compra) || 0,
      precio_venta: parseFloat(form.precio_venta) || 0,
      unidad_medida: form.unidad_medida,
      stock: parseInt(form.stock) || 0,
      stock_minimo: parseInt(form.stock_minimo) || 0
    })

    if (error) { 
      console.error("Error al insertar:", error)
      setModal('errorCampos')
      return 
    }
    
    setModal('ok_crear')
  }

  const irAEditar = (prod) => {
    setForm({
      id: prod.id,
      nombre: prod.nombre,
      codigo: prod.codigo_sku,
      proveedor: '', 
      precio_compra: prod.precio_compra || '0',
      precio_venta: prod.precio_venta || '0',
      unidad_medida: prod.unidad_medida || 'unidad',
      stock: prod.stock || '0',
      stock_minimo: prod.stock_minimo || '0'
    })
    setVista('editar')
  }

  const handleGuardarCambios = async (e) => {
    e.preventDefault()

    if (!form.nombre || !form.precio_venta || !form.stock) {
      alert('Por favor, completa todos los campos obligatorios.')
      return
    }

    const { error } = await supabase
      .from('productos')
      .update({
        nombre: form.nombre,
        precio_venta: parseFloat(form.precio_venta),
        stock: parseInt(form.stock),
        unidad_medida: form.unidad_medida
      })
      .eq('id', form.id)

    if (error) {
      alert('Error al actualizar el producto: ' + error.message)
    } else {
      alert('¡Producto actualizado con éxito!')
      cerrarYRefrescar()
    }
  }

  const handleEliminar = async (id, nombre) => {
    const confirmar = window.confirm(`¿Estás seguro de que deseas eliminar el producto: "${nombre}"?`)
    if (!confirmar) return

    const { error } = await supabase.from('productos').delete().eq('id', id)
    
    if (error) {
      alert("No se pudo eliminar el producto. Verifica si está enlazado a un movimiento.")
    } else {
      cargarProductos() 
    }
  }
  const cerrarYRefrescar = () => {
    setModal(null)
    setVista('lista')
    cargarProductos()
  }

  return (
    <Layout>
      <div className="main-content">
        
        {vista === 'crear' && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-4" style={{ maxWidth: 700, margin: '0 auto' }}>
              <h1 className="page-title" style={{ margin: 0 }}>Crear nuevo producto</h1>
              <button className="btn btn-gold" onClick={() => setVista('lista')}>
                Ver Inventario
              </button>
            </div>
            
            <div className="card card-gold" style={{ maxWidth: 700, margin: '0 auto', padding: '25px' }}>
              <div className="section-heading" style={{ marginTop: 0, marginBottom: '20px' }}>
                Formulario de Registro
              </div>
              
              <div className="row">
                <div className="col-md-6 form-group">
                  <label>Nombre del producto:</label>
                  <input className="form-control" type="text" placeholder="Ej: Ron Barceló" value={form.nombre} onChange={handleInputChange('nombre')}/>
                </div>
                <div className="col-md-6 form-group">
                  <label>Código:</label>
                  <input className="form-control" type="text" placeholder="Ej: 5678-RB" value={form.codigo} onChange={handleInputChange('codigo')}/>
                </div>
              </div>

              <div className="row mt-2">
                <div className="col-md-6 form-group">
                  <label>Proveedor:</label>
                  <input className="form-control" type="text" placeholder="Ej: Distribuidora Norte" value={form.proveedor} onChange={handleInputChange('proveedor')}/>
                </div>
                <div className="col-md-6 form-group">
                  <label>Unidad de Medida:</label>
                  <input className="form-control" type="text" value={form.unidad_medida} onChange={handleInputChange('unidad_medida')}/>
                </div>
              </div>

              <div className="row mt-2">
                <div className="col-md-6 form-group">
                  <label>Precio Compra:</label>
                  <input className="form-control" type="number" value={form.precio_compra} onChange={handleInputChange('precio_compra')}/>
                </div>
                <div className="col-md-6 form-group">
                  <label>Precio Venta:</label>
                  <input className="form-control" type="number" value={form.precio_venta} onChange={handleInputChange('precio_venta')}/>
                </div>
              </div>

              <div className="row mt-2">
                <div className="col-md-6 form-group">
                  <label>Stock Inicial:</label>
                  <input className="form-control" type="number" value={form.stock} onChange={handleInputChange('stock')}/>
                </div>
                <div className="col-md-6 form-group">
                  <label>Stock Mínimo:</label>
                  <input className="form-control" type="number" value={form.stock_minimo} onChange={handleInputChange('stock_minimo')}/>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <button className="btn btn-gold me-2" onClick={handleCrearProducto}>Confirmar</button>
                <button className="btn btn-secondary" onClick={() => setVista('lista')}>Cancelar</button>
              </div>
            </div>
          </>
        )}

        {vista === 'lista' && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-4" style={{ maxWidth: 900, margin: '0 auto' }}>
              <h1 className="page-title" style={{ margin: 0 }}>Panel de Inventario</h1>
              <button className="btn btn-gold" onClick={irACrear}>
                Agregar Producto
              </button>
            </div>

            <div className="card card-gold" style={{ maxWidth: 900, margin: '20px auto', padding: '20px', overflowX: 'auto' }}>
              <div className="section-heading mb-3">Listado General de Productos</div>
              
              <table className="table table-dark table-striped align-middle">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Precio Venta</th>
                    <th>Stock</th>
                    <th>U. Medida</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cargando ? (
                    <tr><td colSpan="6" className="text-center text-muted">Cargando inventario...</td></tr>
                  ) : productos.length === 0 ? (
                    <tr><td colSpan="6" className="text-center text-muted">No existen productos registrados en la base de datos.</td></tr>
                  ) : (
                    productos.map((prod) => (
                      <tr key={prod.id}>
                        <td><code>{prod.codigo_sku}</code></td>
                        <td>{prod.nombre}</td>
                        <td>${prod.precio_venta.toFixed(2)}</td>
                        <td>{prod.stock}</td>
                        <td>{prod.unidad_medida}</td>
                        <td className="text-center">
                          <button 
                            className="btn btn-sm btn-outline-warning me-2" 
                            onClick={() => irAEditar(prod)}
                            style={{ marginRight: '8px' }}
                          >
                            Editar
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger" 
                            onClick={() => handleEliminar(prod.id, prod.nombre)}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {vista === 'editar' && (
          <div className="card card-gold" style={{ maxWidth: 500, margin: '40px auto', padding: '20px' }}>
            <h2 className="mb-4 text-white"> Editar Producto</h2>
            
            <form onSubmit={handleGuardarCambios}>
              <div className="mb-3">
                <label className="form-label text-white">Nombre del Producto</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={form.nombre} 
                  onChange={handleInputChange('nombre')} 
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-white">Precio de Venta ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="form-control" 
                  value={form.precio_venta} 
                  onChange={handleInputChange('precio_venta')} 
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-white">Stock Actual</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={form.stock} 
                  onChange={handleInputChange('stock')} 
                />
              </div>

              <div className="mb-4">
                <label className="form-label text-white">Unidad de Medida</label>
                <select 
                  className="form-select" 
                  value={form.unidad_medida} 
                  onChange={handleInputChange('unidad_medida')}
                >
                  <option value="unidad">Unidad</option>
                  <option value="botella">Botella</option>
                  <option value="caja">Caja</option>
                  <option value="litro">Litro</option>
                </select>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-outline-light" onClick={() => setVista('lista')}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-gold">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
      <Modal show={modal === 'ok_crear'} message="Se ha creado con éxito el producto."
        actions={<button className="btn btn-gold" onClick={cerrarYRefrescar}>✔️ Aceptar</button>}/>
      <Modal show={modal === 'errorCampos'} message="Debe completar todos los campos obligatorios o verificar la conexión."
        actions={<button className="btn btn-gold" onClick={() => setModal(null)}>✔️ Aceptar</button>}/>
    </Layout>
  )
}