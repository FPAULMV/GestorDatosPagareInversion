import { useEffect, useState } from 'react'
import ZonaCarga from '../components/ZonaCarga'
import TarjetaComprobante from '../components/TarjetaComprobante'
import { cargarComprobante } from '../services/comprobantes'
import type { RespuestaCarga } from '../types/comprobante'

const MXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

function describir_error_br(e: Record<string, unknown>): string {
  const fmtMXN = (v: unknown) => typeof v === 'number' ? MXN.format(v) : String(v)
  const fmtPct = (v: unknown) => typeof v === 'number' ? `${v.toFixed(4)}%` : String(v)

  switch (e.id) {
    case 'BR-01':
      return `Interés calculado no coincide con la fórmula — Esperado: ${fmtMXN(e.esperado)}, Obtenido: ${fmtMXN(e.obtenido)}`
    case 'BR-02':
      return `Importe neto al vencimiento incorrecto — Esperado: ${fmtMXN(e.esperado)}, Obtenido: ${fmtMXN(e.obtenido)}`
    case 'BR-03':
      return `Los días entre fechas no coinciden con el plazo — Esperado: ${e.esperado} días, Obtenido: ${e.obtenido} días`
    case 'BR-04':
      return `El ISR no puede ser mayor al interés generado`
    case 'BR-05':
      return `La tasa después de impuestos (${fmtPct(e.tasa_despues)}) no puede superar la tasa antes de impuestos (${fmtPct(e.tasa_antes)})`
    case 'BR-06':
      return `La fecha de vencimiento debe ser posterior a la fecha de operación`
    case 'BR-10': {
      const campos = (e.campos_negativos as string[]).join(', ')
      return `Campos con valores negativos: ${campos}`
    }
    case 'BR-11':
      return `El importe de inversión debe ser mayor a cero`
    default:
      return JSON.stringify(e).slice(0, 200)
  }
}

export default function Inicio() {
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState<RespuestaCarga | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [arrastrandoGlobal, setArrastrandoGlobal] = useState(false)

  const manejarArchivo = async (archivo: File) => {
    if (!archivo.name.toLowerCase().endsWith('.pdf')) {
      setError('Solo se aceptan archivos PDF.')
      return
    }
    setCargando(true)
    setResultado(null)
    setError(null)
    try {
      const resp = await cargarComprobante(archivo)
      setResultado(resp)
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Error al procesar el archivo.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    let contador = 0

    const onDragEnter = (e: DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer?.types.includes('Files')) {
        contador++
        setArrastrandoGlobal(true)
      }
    }
    const onDragOver = (e: DragEvent) => e.preventDefault()
    const onDragLeave = (e: DragEvent) => {
      e.preventDefault()
      contador--
      if (contador <= 0) {
        contador = 0
        setArrastrandoGlobal(false)
      }
    }
    const onDrop = (e: DragEvent) => {
      e.preventDefault()
      contador = 0
      setArrastrandoGlobal(false)
      if (cargando) return
      const archivo = e.dataTransfer?.files[0]
      if (archivo) manejarArchivo(archivo)
    }

    window.addEventListener('dragenter', onDragEnter)
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragenter', onDragEnter)
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('drop', onDrop)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargando])

  return (
    <div className="w-full px-6 lg:px-8 py-12">
      {/* Overlay de arrastre global */}
      {arrastrandoGlobal && !cargando && (
        <div className="fixed inset-0 z-[100] bg-[#1e40af]/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="m-6 w-full max-w-2xl rounded-3xl border-4 border-dashed border-[#3182f6] bg-white/90 py-20 flex flex-col items-center text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-[#ede9fe] flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[#3182f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-[#1e40af] font-bold text-xl">Suelta tu archivo aquí</p>
            <p className="text-[#64748b] text-sm mt-1">PDF · Pagaré BBVA</p>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        {/* Encabezado centrado */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#ede9fe] mb-5">
            <svg className="w-7 h-7 text-[#3182f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#1e40af] mb-3">
            Carga tu comprobante
          </h1>
        </div>

        {/* Card de carga */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
          <ZonaCarga onArchivo={manejarArchivo} cargando={cargando} />
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 flex items-start gap-3 px-5 py-4 rounded-xl border border-[#fecaca] bg-[#fef2f2]">
            <svg className="w-5 h-5 text-[#ef4444] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold text-sm text-[#991b1b]">No se pudo procesar el documento</p>
              <p className="text-sm text-[#b91c1c] mt-1">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Resultado (más ancho) */}
      {resultado && (() => {
        const v = resultado.validacion
        const esInvalido = !v.schema_valido || !v.orden_correcto || v.errores.length > 0

        return (
          <div className="max-w-4xl mx-auto mt-12 space-y-10">
            <section>
              {esInvalido ? (
                /* ── Documento inválido ── */
                <div className="bg-white rounded-xl border border-[#fecaca] overflow-hidden">
                  {/* Cabecera roja */}
                  <div className="px-6 py-5 bg-[#fef2f2] border-b border-[#fecaca] flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#ef4444] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-base text-[#991b1b]">Documento inválido</p>
                      <p className="text-xs text-[#b91c1c] mt-0.5">
                        El archivo fue recibido pero no pasó la validación.
                      </p>
                    </div>
                  </div>

                  {/* Detalle de errores */}
                  <div className="px-6 py-5 space-y-4">
                    {/* Validaciones básicas fallidas */}
                    {(!v.schema_valido || !v.orden_correcto) && (
                      <div className="flex flex-wrap gap-2">
                        {!v.schema_valido && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-[#fef2f2] border-[#fecaca] text-[#991b1b]">
                            <span className="font-bold">✗</span> JSON Schema inválido
                          </span>
                        )}
                        {!v.orden_correcto && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-[#fef2f2] border-[#fecaca] text-[#991b1b]">
                            <span className="font-bold">✗</span> Orden de campos incorrecto
                          </span>
                        )}
                      </div>
                    )}

                    {/* Lista de errores */}
                    {v.errores.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#991b1b] mb-2">
                          Errores encontrados
                        </p>
                        <ul className="space-y-2">
                          {v.errores.map((e, i) => (
                            <li
                              key={i}
                              className="text-xs px-4 py-3 rounded-lg border bg-[#fef2f2] border-[#fecaca] text-[#991b1b]"
                            >
                              {typeof e === 'string'
                                ? e
                                : describir_error_br(e as Record<string, unknown>)
                              }
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* ── Documento válido ── */
                <>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-[#1e40af]">Datos extraídos</h2>
                    <span className="text-xs text-[#94a3b8] font-medium">
                      ID: <span className="font-mono text-[#64748b]">#{resultado.id}</span>
                    </span>
                  </div>
                  <TarjetaComprobante datos={resultado.datos} id={resultado.id} />
                </>
              )}
            </section>

            <div className="flex justify-center pt-4">
              <button
                onClick={() => { setResultado(null); setError(null) }}
                className="px-6 py-2.5 rounded-lg bg-[#ede9fe] hover:bg-[#ddd6fe] text-[#1e40af] text-sm font-semibold transition-colors"
              >
                ← Cargar otro comprobante
              </button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
