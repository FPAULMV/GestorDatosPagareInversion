import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listarComprobantes } from '../services/comprobantes'
import type { ComprobanteResumen } from '../types/comprobante'

const MXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })


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

  const validos = registros.filter(r => r.schema_valido === true)

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
            Solo se muestran los comprobantes que pasaron la validación correctamente.
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
        {!cargando && !error && validos.length === 0 && (
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
        {!cargando && !error && validos.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">Folio internet</th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">Fecha operación</th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">Vencimiento</th>
                    <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">Importe inversión</th>
                    <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">Interés</th>
                    <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">Neto al vencimiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {validos.map((r) => (
                    <tr key={r.id} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-[#64748b]">{r.folio_internet ?? '—'}</td>
                      <td className="px-6 py-4 text-[#64748b]">{r.fecha_hora_operacion?.split('T')[0] ?? '—'}</td>
                      <td className="px-6 py-4 text-[#64748b]">{r.fecha_vencimiento ?? '—'}</td>
                      <td className="px-6 py-4 text-right font-bold text-[#1e40af] whitespace-nowrap">
                        {r.importe_inversion_mxn ? MXN.format(r.importe_inversion_mxn) : '—'}
                      </td>
                      <td className="px-6 py-4 text-right text-[#64748b] whitespace-nowrap">
                        {r.interes_mxn ? MXN.format(r.interes_mxn) : '—'}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-[#10b981] whitespace-nowrap">
                        {r.importe_neto_vencimiento_mxn ? MXN.format(r.importe_neto_vencimiento_mxn) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
