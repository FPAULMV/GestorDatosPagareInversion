import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listarComprobantes } from '../services/comprobantes'
import type { ComprobanteResumen } from '../types/comprobante'

const MXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

function BadgeEstado({ estado }: { estado: string | null }) {
  const config =
    estado === 'Operación Exitosa'
      ? { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' }
      : estado === 'Operación Fallida'
        ? { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' }
        : { bg: '#fffbeb', color: '#92400e', border: '#fde68a' }

  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border whitespace-nowrap"
      style={{ backgroundColor: config.bg, color: config.color, borderColor: config.border }}
    >
      {estado ?? '—'}
    </span>
  )
}

function BadgeValido({ valido }: { valido: boolean | null }) {
  if (valido === null) return <span className="text-[#94a3b8]">—</span>
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold"
      style={{ color: valido ? '#10b981' : '#ef4444' }}
    >
      <span className="text-base">{valido ? '✓' : '✗'}</span>
      {valido ? 'Válido' : 'Inválido'}
    </span>
  )
}

function TarjetaResumen({ etiqueta, valor, color = '#1e40af', icon }: {
  etiqueta: string;
  valor: string | number;
  color?: string;
  icon: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
          {etiqueta}
        </p>
        <div className="w-9 h-9 rounded-lg bg-[#ede9fe] flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold leading-tight" style={{ color }}>
        {valor}
      </p>
    </div>
  )
}

export default function Historial() {
  const navigate = useNavigate()
  const [registros, setRegistros] = useState<ComprobanteResumen[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listarComprobantes()
      .then(setRegistros)
      .catch(() => setError('Error al cargar el historial.'))
      .finally(() => setCargando(false))
  }, [])

  const totalImporte = registros.reduce((acc, r) => acc + (Number(r.importe_inversion_mxn) || 0), 0)
  const exitosos = registros.filter(r => r.estado_operacion === 'Operación Exitosa').length

  return (
    <div className="w-full px-6 lg:px-8 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Encabezado */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-[#1e40af]">
              Historial de comprobantes
            </h1>
            <button
              onClick={() => navigate('/')}
              className="px-5 py-2.5 rounded-lg bg-[#3182f6] hover:bg-[#2563eb] text-white text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Cargar comprobante
            </button>
          </div>
          <p className="text-base text-[#64748b]">
            Todos los comprobantes procesados y almacenados se muestran aquí.
          </p>
        </header>

        {/* Estado de carga */}
        {cargando && (
          <div className="bg-white rounded-2xl border border-[#e2e8f0] py-20 flex flex-col items-center shadow-sm">
            <div className="w-10 h-10 border-3 border-[#cbd5e1] border-t-[#3182f6] rounded-full animate-spin mb-4" />
            <p className="text-[#64748b] font-medium">Cargando historial…</p>
          </div>
        )}

        {/* Error */}
        {error && !cargando && (
          <div className="flex items-start gap-3 px-5 py-4 rounded-xl border border-[#fecaca] bg-[#fef2f2]">
            <svg className="w-5 h-5 text-[#ef4444] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="font-semibold text-sm text-[#991b1b]">{error}</p>
          </div>
        )}

        {/* Sin registros */}
        {!cargando && !error && registros.length === 0 && (
          <div className="bg-white rounded-2xl border border-[#e2e8f0] py-20 flex flex-col items-center text-center px-8 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-[#ede9fe] flex items-center justify-center mb-5">
              <svg className="w-8 h-8 text-[#3182f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-[#324153] font-semibold text-base mb-1.5">
              Aún no hay comprobantes registrados
            </p>
            <p className="text-[#64748b] text-sm">
              Carga tu primer comprobante para verlo aquí.
            </p>
          </div>
        )}

        {/* Contenido */}
        {!cargando && !error && registros.length > 0 && (
          <>
            {/* Resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
              <TarjetaResumen
                etiqueta="Total registros"
                valor={registros.length}
                icon={
                  <svg className="w-5 h-5 text-[#3182f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
              />
              <TarjetaResumen
                etiqueta="Operaciones exitosas"
                valor={exitosos}
                color="#10b981"
                icon={
                  <svg className="w-5 h-5 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                }
              />
              <TarjetaResumen
                etiqueta="Importe total"
                valor={MXN.format(totalImporte)}
                icon={
                  <svg className="w-5 h-5 text-[#3182f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                      <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">ID</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">Cliente</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">Contrato</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">Operación</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">Vencimiento</th>
                      <th className="px-6 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">Plazo</th>
                      <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">Importe</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">Estado</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">Validez</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0]">
                    {registros.map((r) => (
                      <tr key={r.id} className="hover:bg-[#f8fafc] transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-[#94a3b8]">#{r.id}</td>
                        <td className="px-6 py-4 font-semibold text-[#324153] max-w-xs">
                          <p className="truncate">{r.nombre_cliente ?? '—'}</p>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-[#64748b]">{r.contrato ?? '—'}</td>
                        <td className="px-6 py-4 text-[#64748b]">{r.fecha_hora_operacion?.split('T')[0] ?? '—'}</td>
                        <td className="px-6 py-4 text-[#64748b]">{r.fecha_vencimiento ?? '—'}</td>
                        <td className="px-6 py-4 text-center text-[#64748b]">
                          {r.plazo_dias ? `${r.plazo_dias}d` : '—'}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-[#1e40af] whitespace-nowrap">
                          {r.importe_inversion_mxn ? MXN.format(r.importe_inversion_mxn) : '—'}
                        </td>
                        <td className="px-6 py-4"><BadgeEstado estado={r.estado_operacion} /></td>
                        <td className="px-6 py-4"><BadgeValido valido={r.schema_valido} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
