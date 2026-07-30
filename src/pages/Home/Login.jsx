import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../../components/Modal.jsx'
import { supabase, supabaseConfigurado, MENSAJE_SIN_CONFIGURAR } from '../../lib/supabase.js'
import { mensajeError } from '../../lib/errores.js'
import { guardarUsuario, cerrarSesion } from '../../lib/sesion.js'

export default function Login() {
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [mensaje, setMensaje] = useState(null)
  const [cargando, setCargando] = useState(false)

  // Antes este formulario mandaba lo escrito en "Nombre de usuario"
  // directamente como email a supabase.auth.signInWithPassword(), asi que
  // escribir "admin" nunca podia funcionar. Ahora se acepta cualquiera de los
  // dos y se resuelve el correo contra la tabla `usuarios`.
  const resolverCorreo = async (entrada) => {
    if (entrada.includes('@')) return { correo: entrada, error: null }

    const { data, error } = await supabase
      .from('usuarios')
      .select('correo')
      .eq('username', entrada)
      .maybeSingle()

    if (error) return { correo: null, error }
    if (!data) {
      return {
        correo: null,
        error: {
          message:
            `El usuario "${entrada}" no existe en la tabla usuarios. ` +
            'Puedes entrar tambien escribiendo tu correo completo.',
        },
      }
    }
    return { correo: data.correo, error: null }
  }

  const handleLogin = async (e) => {
    e?.preventDefault()

    if (!supabaseConfigurado) {
      setMensaje(MENSAJE_SIN_CONFIGURAR)
      return
    }
    if (!usuario.trim() || !contrasena) {
      setMensaje('Escribe tu usuario (o correo) y tu contrasena.')
      return
    }

    setCargando(true)
    cerrarSesion()

    const { correo, error: errorCorreo } = await resolverCorreo(usuario.trim())
    if (!correo) {
      setMensaje(mensajeError(errorCorreo, 'identificar el usuario'))
      setCargando(false)
      return
    }

    // La contrasena la valida Supabase Auth: nunca se compara en el navegador
    // ni se guarda en texto plano (Guia Tecnica, seccion 40.5).
    const { error: errorAuth } = await supabase.auth.signInWithPassword({
      email: correo,
      password: contrasena,
    })

    if (errorAuth) {
      const esCredencial = /invalid login credentials/i.test(errorAuth.message || '')
      setMensaje(
        esCredencial
          ? 'Usuario o contrasena incorrectos. Si es la primera vez que entras, ' +
            `el usuario ${correo} debe estar creado en Supabase -> Authentication -> Users ` +
            '(ver el apartado "Primer acceso" del README).'
          : mensajeError(errorAuth, 'iniciar sesion')
      )
      setCargando(false)
      return
    }

    // Guardamos la fila de `usuarios` porque las ordenes y los movimientos
    // necesitan un usuario_id entero valido (antes estaba fijo en 1).
    const { data: fila } = await supabase
      .from('usuarios')
      .select('id, nombre, apellido, correo, username, rol_id')
      .eq('correo', correo)
      .maybeSingle()

    if (fila) {
      guardarUsuario(fila)
    } else {
      console.warn(
        `[Gold Club] El correo ${correo} entro por Supabase Auth pero no tiene ` +
          'fila en la tabla usuarios. Los documentos se guardaran sin autor.'
      )
    }

    setCargando(false)
    navigate('/dashboard')
  }

  return (
    <div className="login-page">
      <form className="login-box" onSubmit={handleLogin}>
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
            placeholder="Usuario o correo"
            autoComplete="username"
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
            placeholder="Contrasena"
            autoComplete="current-password"
            value={contrasena}
            onChange={e => setContrasena(e.target.value)}
          />
        </div>

        <button className="login-btn" type="submit" disabled={cargando}>
          {cargando ? 'Verificando...' : 'Iniciar Sesion'}
        </button>
        <span
          className="forgot-link"
          onClick={() => setMensaje(
            'La contrasena se restablece desde Supabase -> Authentication -> Users, ' +
            'con la opcion "Send password recovery".'
          )}
        >
          Olvidaste tu contrasena?
        </span>
      </form>

      <Modal
        show={!!mensaje}
        message={mensaje}
        actions={
          <button className="btn btn-gold" onClick={() => setMensaje(null)}>Entendido</button>
        }
      />
    </div>
  )
}
