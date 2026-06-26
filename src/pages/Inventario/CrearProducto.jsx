// import React, { useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import Layout from '../../components/Layout.jsx'
// import Modal from '../../components/Modal.jsx'
// import { supabase } from '../../lib/supabase.js'

// export default function CrearProducto() {
//   const navigate = useNavigate()
//   const [form, setForm] = useState({ nombre: '', codigo: '', proveedor: '' })
//   const [modal, setModal] = useState(null)

//   const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

//   const handleConfirmar = async () => {
//     if (!form.nombre || !form.codigo) { setModal('errorCampos'); return }

//     const { error } = await supabase.from('productos').insert({
//       nombre: form.nombre,
//       codigo_sku: form.codigo,
//       categoria_id: 1,
//       precio_compra: 0,
//       precio_venta: 0,
//       unidad_medida: 'unidad',
//       stock: 0,
//       stock_minimo: 0,
//     })

//     if (error) { setModal('errorCampos'); return }
//     setModal('ok')
//   }

//   return (
//     <Layout>
//       <div className="main-content">
//         <h1 className="page-title">Crear nuevo producto</h1>
//         <div className="card card-gold" style={{maxWidth:680}}>
//           <div className="section-heading" style={{marginTop:0}}>Crear nuevo Producto</div>
//           <div className="form-group"><label>Nombre del producto:</label><input className="form-control" type="text" placeholder="Ej: Ron Barceló" value={form.nombre} onChange={set('nombre')}/></div>
//           <div className="form-group"><label>Código del producto:</label><input className="form-control" type="text" placeholder="Ej: 5678-RB" value={form.codigo} onChange={set('codigo')}/></div>
//           <div className="form-group"><label>Proveedor:</label><input className="form-control" type="text" placeholder="Ej: Distribuidora Norte" value={form.proveedor} onChange={set('proveedor')}/></div>
//           <div className="mt-3 text-center">
//             <button className="btn btn-gold" onClick={handleConfirmar}>Confirmar</button>
//           </div>
//         </div>
//       </div>
//       <Modal show={modal === 'ok'} message="Se ha creado con éxito el producto."
//         actions={<button className="btn btn-gold" onClick={() => navigate('/inventario/asignar-ubicacion')}>✔️ Aceptar</button>}/>
//       <Modal show={modal === 'errorCampos'} message="Debe completar todos los campos antes de confirmar."
//         actions={<button className="btn btn-gold" onClick={() => setModal(null)}>✔️ Aceptar</button>}/>
//     </Layout>
//   )
// }

//------------------------------------------------------------------------------------------------------------------------------

// import React, { useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import Layout from '../../components/Layout.jsx'
// import Modal from '../../components/Modal.jsx'
// import { supabase } from '../../lib/supabase.js'

// export default function CrearProducto() {
//   const navigate = useNavigate()
//   const [form, setForm] = useState({
//     nombre: '',
//     codigo: '',
//     proveedor: '',
//     precio_compra: '0',
//     precio_venta: '0',
//     unidad_medida: 'unidad',
//     stock: '0',
//     stock_minimo: '0'
//   })
//   const [modal, setModal] = useState(null)

//   const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

//   const handleConfirmar = async () => {
//     if (!form.nombre.trim() || !form.codigo.trim()) { 
//       setModal('errorCampos')
//       return 
//     }

//     const { error } = await supabase.from('productos').insert({
//       nombre: form.nombre,
//       codigo_sku: form.codigo,
//       categoria_id: 1, 
//       precio_compra: parseFloat(form.precio_compra) || 0,
//       precio_venta: parseFloat(form.precio_venta) || 0,
//       unidad_medida: form.unidad_medida,
//       stock: parseInt(form.stock) || 0,
//       stock_minimo: parseInt(form.stock_minimo) || 0
//     })

//     if (error) { 
//       setModal('errorCampos')
//       return 
//     }
//     setModal('ok')
//   }

//   return (
//     <Layout>
//       <div className="main-content">
//         <h1 className="page-title">Crear nuevo producto</h1>
        
//         <div className="card card-gold" style={{ maxWidth: 700, margin: '0 auto', padding: '25px' }}>
//           <div className="section-heading" style={{ marginTop: 0, marginBottom: '20px' }}>
//             Formulario de Registro
//           </div>
          
//           <div className="row">
//             <div className="col-md-6 form-group">
//               <label>Nombre del producto:</label>
//               <input className="form-control" type="text" value={form.nombre} onChange={set('nombre')}/>
//             </div>
//             <div className="col-md-6 form-group">
//               <label>Código del producto:</label>
//               <input className="form-control" type="text" value={form.codigo} onChange={set('codigo')}/>
//             </div>
//           </div>

//           <div className="row mt-2">
//             <div className="col-md-6 form-group">
//               <label>Proveedor:</label>
//               <input className="form-control" type="text" value={form.proveedor} onChange={set('proveedor')}/>
//             </div>
//             <div className="col-md-6 form-group">
//               <label>Unidad de Medida:</label>
//               <input className="form-control" type="text" value={form.unidad_medida} onChange={set('unidad_medida')}/>
//             </div>
//           </div>

//           <div className="row mt-2">
//             <div className="col-md-6 form-group">
//               <label>Precio Compra:</label>
//               <input className="form-control" type="number" value={form.precio_compra} onChange={set('precio_compra')}/>
//             </div>
//             <div className="col-md-6 form-group">
//               <label>Precio Venta:</label>
//               <input className="form-control" type="number" value={form.precio_venta} onChange={set('precio_venta')}/>
//             </div>
//           </div>

//           <div className="row mt-2">
//             <div className="col-md-6 form-group">
//               <label>Stock Inicial:</label>
//               <input className="form-control" type="number" value={form.stock} onChange={set('stock')}/>
//             </div>
//             <div className="col-md-6 form-group">
//               <label>Stock Mínimo:</label>
//               <input className="form-control" type="number" value={form.stock_minimo} onChange={set('stock_minimo')}/>
//             </div>
//           </div>
          
//           <div className="mt-4 text-center">
//             <button className="btn btn-gold" onClick={handleConfirmar}>Confirmar</button>
//           </div>
//         </div>
//       </div>

//       <Modal show={modal === 'ok'} message="Se ha creado con éxito el producto."
//         actions={<button className="btn btn-gold" onClick={() => navigate('/inventario')}>✔️ Aceptar</button>}/>
//       <Modal show={modal === 'errorCampos'} message="Debe completar todos los campos obligatorios."
//         actions={<button className="btn btn-gold" onClick={() => setModal(null)}>✔️ Aceptar</button>}/>
//     </Layout>
//   )
// }
//------------------------------------------------------------------------------------------------------------------------------

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'
import { supabase } from '../../lib/supabase.js'

export default function CrearProducto() {
  const navigate = useNavigate()
  
  // Estado inicial con todos los campos requeridos por la base de datos
  const [form, setForm] = useState({
    nombre: '',
    codigo: '',
    proveedor: '',
    precio_compra: '0',
    precio_venta: '0',
    unidad_medida: 'unidad',
    stock: '0',
    stock_minimo: '0'
  })
  const [modal, setModal] = useState(null)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleConfirmar = async () => {
    // Validamos que los campos esenciales no estén vacíos
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
      stock_minimo: parseInt(form.stock_minimo) || 0,
      // proveedor: form.proveedor // Descomentar si agregamos la tabla'proveedor'
    })

    if (error) { 
      console.error("Error al insertar:", error)
      setModal('errorCampos')
      return 
    }
    
    setModal('ok')
  }

  return (
    <Layout>
      <div className="main-content">
        <h1 className="page-title">Crear nuevo producto</h1>
        
        <div className="card card-gold" style={{ maxWidth: 700, margin: '0 auto', padding: '25px' }}>
          <div className="section-heading" style={{ marginTop: 0, marginBottom: '20px' }}>
            Formulario de Registro
          </div>
          
          <div className="row">
            <div className="col-md-6 form-group">
              <label>Nombre del producto:</label>
              <input className="form-control" type="text" placeholder="Ej: Ron Barceló" value={form.nombre} onChange={set('nombre')}/>
            </div>
            <div className="col-md-6 form-group">
              <label>Código:</label>
              <input className="form-control" type="text" placeholder="Ej: 5678-RB" value={form.codigo} onChange={set('codigo')}/>
            </div>
          </div>

          <div className="row mt-2">
            <div className="col-md-6 form-group">
              <label>Proveedor:</label>
              <input className="form-control" type="text" placeholder="Ej: Distribuidora Norte" value={form.proveedor} onChange={set('proveedor')}/>
            </div>
            <div className="col-md-6 form-group">
              <label>Unidad de Medida:</label>
              <input className="form-control" type="text" value={form.unidad_medida} onChange={set('unidad_medida')}/>
            </div>
          </div>

          <div className="row mt-2">
            <div className="col-md-6 form-group">
              <label>Precio Compra:</label>
              <input className="form-control" type="number" value={form.precio_compra} onChange={set('precio_compra')}/>
            </div>
            <div className="col-md-6 form-group">
              <label>Precio Venta:</label>
              <input className="form-control" type="number" value={form.precio_venta} onChange={set('precio_venta')}/>
            </div>
          </div>

          <div className="row mt-2">
            <div className="col-md-6 form-group">
              <label>Stock Inicial:</label>
              <input className="form-control" type="number" value={form.stock} onChange={set('stock')}/>
            </div>
            <div className="col-md-6 form-group">
              <label>Stock Mínimo:</label>
              <input className="form-control" type="number" value={form.stock_minimo} onChange={set('stock_minimo')}/>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <button className="btn btn-gold me-2" onClick={handleConfirmar}>Confirmar</button>
            <button className="btn btn-secondary" onClick={() => navigate('/inventario')}>Cancelar</button>
          </div>
        </div>
      </div>

      <Modal show={modal === 'ok'} message="Se ha creado con éxito el producto."
        actions={<button className="btn btn-gold" onClick={() => navigate('/inventario')}>✔️ Aceptar</button>}/>
      <Modal show={modal === 'errorCampos'} message="Debe completar todos los campos obligatorios o verificar la conexión."
        actions={<button className="btn btn-gold" onClick={() => setModal(null)}>✔️ Aceptar</button>}/>
    </Layout>
  )
}