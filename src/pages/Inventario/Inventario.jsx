// import React, { useState, useEffect } from 'react'
// import { useNavigate } from 'react-router-dom'
// import Layout from '../../components/Layout.jsx'
// import { supabase } from '../../lib/supabase.js'

// export default function Inventario() {
//   const navigate = useNavigate()
//   const [productos, setProductos] = useState([])
//   const [cargando, setCargando] = useState(true)

//   // Cargar el listado de productos de forma inmediata al entrar
//   useEffect(() => {
//     cargarProductos()
//   }, [])

//   const cargarProductos = async () => {
//     setCargando(true)
//     const { data, error } = await supabase
//       .from('productos')
//       .select('*')
//       .order('id', { ascending: false })
      
//     if (!error && data) {
//       setProductos(data)
//     }
//     setCargando(false)
//   }

//   // Acción para eliminar un producto
//   const handleEliminar = async (id, nombre) => {
//     const confirmar = window.confirm(`¿Estás seguro de que deseas eliminar el producto: "${nombre}"?`)
//     if (!confirmar) return

//     const { error } = await supabase.from('productos').delete().eq('id', id)
    
//     if (error) {
//       alert("No se pudo eliminar el producto. Verifica si está enlazado a un movimiento.")
//     } else {
//       cargarProductos() // Recargamos la tabla automáticamente
//     }
//   }

//   return (
//     <Layout>
//       <div className="main-content">
//         {/* Encabezado con botón de navegación hacia el formulario */}
//         <div className="d-flex justify-content-between align-items-center mb-4" style={{ maxWidth: 900, margin: '0 auto' }}>
//           <h1 className="page-title" style={{ margin: 0 }}>Panel de Inventario</h1>
//           <button className="btn btn-gold" onClick={() => navigate('/inventario/crear-producto')}>
//             Agregar Producto
//           </button>
//         </div>

//         {/* Tabla General de Lectura */}
//         <div className="card card-gold" style={{ maxWidth: 900, margin: '20px auto', padding: '20px', overflowX: 'auto' }}>
//           <div className="section-heading mb-3">Listado General de Productos</div>
          
//           <table className="table table-dark table-striped align-middle">
//             <thead>
//               <tr>
//                 <th>Código</th>
//                 <th>Nombre</th>
//                 <th>Precio Venta</th>
//                 <th>Stock</th>
//                 <th>U. Medida</th>
//                 <th className="text-center">Acciones</th>
//               </tr>
//             </thead>
//             <tbody>
//               {cargando ? (
//                 <tr><td colSpan="6" className="text-center text-muted">Cargando inventario...</td></tr>
//               ) : productos.length === 0 ? (
//                 <tr><td colSpan="6" className="text-center text-muted">No existen productos registrados en la base de datos.</td></tr>
//               ) : (
//                 productos.map((prod) => (
//                   <tr key={prod.id}>
//                     <td><code>{prod.codigo_sku}</code></td>
//                     <td>{prod.nombre}</td>
//                     <td>${prod.precio_venta.toFixed(2)}</td>
//                     <td>{prod.stock}</td>
//                     <td>{prod.unidad_medida}</td>
//                     <td className="text-center">
//                       <button 
//                         className="btn btn-sm btn-outline-danger" 
//                         onClick={() => handleEliminar(prod.id, prod.nombre)}
//                       >
//                         Eliminar
//                       </button>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </Layout>
//   )
// }


import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import { supabase } from '../../lib/supabase.js'

export default function Inventario() {
  const navigate = useNavigate()
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarProductos()
  }, [])

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

  return (
    <Layout>
      <div className="main-content">
        <div className="d-flex justify-content-between align-items-center mb-4" style={{ maxWidth: 900, margin: '0 auto' }}>
          <h1 className="page-title" style={{ margin: 0 }}>Panel de Inventario</h1>
          <button className="btn btn-gold" onClick={() => navigate('/inventario/crear-producto')}>
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
                        onClick={() => navigate(`/inventario/editar-producto/${prod.id}`)}
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
      </div>
    </Layout>
  )
}