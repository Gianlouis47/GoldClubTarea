import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

const NavIcon = ({ path }) => {
  const icons = {
    dashboard: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
    ),
    inventario: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
      </svg>
    ),
    ventas: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
      </svg>
    ),
    documentos: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
    tareas: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  }
  return icons[path] || null
}

export default function Navbar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <svg width="44" height="44" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
          <circle cx="40" cy="40" r="38" fill="#2c2c2c" stroke="#D4A017" strokeWidth="3"/>
          <text x="40" y="50" textAnchor="middle" fontSize="32" fontWeight="bold" fill="#D4A017" fontFamily="serif">G</text>
          <text x="40" y="66" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#D4A017" fontFamily="sans-serif" letterSpacing="3">GOLD</text>
        </svg>
      </div>

      <NavLink to="/dashboard" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
        <NavIcon path="dashboard" /> Inicio
      </NavLink>
      <NavLink to="/inventario" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
        <NavIcon path="inventario" /> Inventario
      </NavLink>
      <NavLink to="/ventas" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
        <NavIcon path="ventas" /> Ventas
      </NavLink>
      <NavLink to="/documentos" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
        <NavIcon path="documentos" /> Documentos
      </NavLink>
      <NavLink to="/tareas" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
        <NavIcon path="tareas" /> Tareas
      </NavLink>

      <div className="nav-spacer" />
      <button className="btn-logout" onClick={handleLogout}>Cerrar sesión</button>
    </nav>
  )
}