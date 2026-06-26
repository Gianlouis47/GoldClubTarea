import React from 'react'

const GoldLogo = () => (
  <svg width="20" height="20" viewBox="0 0 44 44">
    <circle cx="22" cy="22" r="20" fill="#2c2c2c" stroke="#D4A017" strokeWidth="2"/>
    <text x="22" y="27" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#D4A017" fontFamily="serif">G</text>
  </svg>
)

export default function Modal({ show, onClose, message, actions }) {
  if (!show) return null
  return (
    <div className="modal-overlay show">
      <div className="modal-box">
        <div className="modal-brand">
          <GoldLogo /> Gold Club
        </div>
        <div className="modal-message">{message}</div>
        <div className="modal-actions">
          {actions}
        </div>
      </div>
    </div>
  )
}
