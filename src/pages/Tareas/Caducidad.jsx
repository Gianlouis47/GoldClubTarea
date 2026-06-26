import React, { useState } from 'react'
import Layout from '../../components/Layout.jsx'

const MESES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DIAS_SEMANA = ['SUN','MON','TUE','WED','THU','FRI','SAT']

function generarCalendario(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const diasEnMes = new Date(year, month + 1, 0).getDate()
  const celdas = []
  for (let i = 0; i < firstDay; i++) celdas.push(null)
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d)
  return celdas
}

export default function Caducidad() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const today = now.getDate()

  const prev = () => { if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1) }
  const next = () => { if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1) }

  const celdas = generarCalendario(year, month)
  const filas = []
  for (let i = 0; i < celdas.length; i += 7) filas.push(celdas.slice(i, i + 7))

  return (
    <Layout>
      <div className="main-content">
        <h1 className="page-title">Gestión de tareas y caducidades</h1>

        <div className="two-col">
          <div className="card card-gold">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
              <button className="btn btn-outline" style={{padding:'4px 10px',fontSize:13}} onClick={prev}>←</button>
              <span style={{fontWeight:600,fontSize:15}}>{MESES[month]} {year}</span>
              <button className="btn btn-outline" style={{padding:'4px 10px',fontSize:13}} onClick={next}>→</button>
            </div>

            <table className="calendar-table">
              <thead>
                <tr>{DIAS_SEMANA.map(d => <th key={d}>{d}</th>)}</tr>
              </thead>
              <tbody>
                {filas.map((fila, fi) => (
                  <tr key={fi}>
                    {fila.map((d, di) => (
                      <td key={di}>
                        {d && (d === today && month === now.getMonth() && year === now.getFullYear())
                          ? <strong className="calendar-today">{d}</strong>
                          : d || ''}
                      </td>
                    ))}
                    {fila.length < 7 && [...Array(7 - fila.length)].map((_, i) => <td key={'e'+i}></td>)}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-2 flex-between">
              <span className="text-muted" style={{fontSize:12}}>Time</span>
              <span style={{background:'var(--bg-input)',borderRadius:4,padding:'3px 10px',fontSize:12,color:'var(--gold)'}}>
                {now.toLocaleTimeString('es-DO', {hour:'2-digit',minute:'2-digit'})}
              </span>
            </div>
          </div>

          <div>
            <div className="task-card task-alerta-proxima">
              <div className="task-header"><span></span> ALERTA PRÓXIMA</div>
              Revisión general de inventario<br/>
              <small>15/10/2025</small>
            </div>
            <div className="task-card task-pendiente">
              <div className="task-header" style={{color:'var(--text-muted)'}}>🗂 PENDIENTE</div>
              Revisión de vencimiento de cervezas artesanales
            </div>
            <div className="task-card task-alerta-maxima">
              <div className="task-header"><span>⚠️</span> ALERTA MÁXIMO</div>
              Reponer producto: Ron añejo<br/>
              <small>[Cód:1234]</small>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
