import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../../components/Modal.jsx'
import { supabase } from '../../lib/supabase.js'

export default function Login() {
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [modal, setModal] = useState(null) 

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!usuario || !contrasena) {
      setModal('error')
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: usuario,
      password: contrasena,
    })

    if (error) {
      setModal('error')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <svg width="80" height="80" viewBox="0 0 80 80" className="login-logo" xmlns="http://www.w3.org/2000/svg">
          <circle cx="40" cy="40" r="38" fill="#2c2c2c" stroke="#D4A017" strokeWidth="3"/>
          <text x="40" y="50" textAnchor="middle" fontSize="32" fontWeight="bold" fill="#D4A017" fontFamily="serif">G</text>
          <text x="40" y="66" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#D4A017" fontFamily="sans-serif" letterSpacing="3">GOLD</text>
        </svg>

        <div className="login-title">Acceso al Sistema</div>

        <div className="login-field">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          <input
            type="text"
            placeholder="Nombre de usuario"
            value={usuario}
            onChange={e => setUsuario(e.target.value)}
          />
        </div>

        <div className="login-field">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <input
            type="password"
            placeholder="Contraseña"
            value={contrasena}
            onChange={e => setContrasena(e.target.value)}
          />
        </div>

        <button className="login-btn" onClick={handleLogin}>Iniciar Sesión</button>
        <span className="forgot-link" onClick={() => setModal('error')}>¿Olvidaste tu contraseña?</span>
      </div>

      <Modal
        show={modal === 'error'}
        message="Inicio de sesión incorrecto. Por favor verifique su usuario y contraseña."
        actions={
          <button className="btn btn-gold" onClick={() => setModal(null)}>Reintentar</button>
        }
      />
    </div>
  )
}
