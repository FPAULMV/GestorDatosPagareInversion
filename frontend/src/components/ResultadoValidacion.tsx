import type { ResultadoValidacion as TResultado } from '../types/comprobante'

interface Props {
  validacion: TResultado
}

export default function ResultadoValidacion({ validacion }: Props) {
  const todasOk = validacion.schema_valido && validacion.orden_correcto && validacion.errores.length === 0

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
      {/* Header */}
      <div
        className="px-6 py-5 flex items-center gap-4 border-b border-[#e2e8f0]"
        style={{ backgroundColor: todasOk ? '#ecfdf5' : '#fef2f2' }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: todasOk ? '#10b981' : '#ef4444' }}
        >
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            {todasOk
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            }
          </svg>
        </div>
        <div>
          <p className="font-bold text-base" style={{ color: todasOk ? '#065f46' : '#991b1b' }}>
            {todasOk ? 'Validación correcta' : 'Validación con problemas'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: todasOk ? '#047857' : '#b91c1c' }}>
            {todasOk
              ? 'Todos los datos pasaron la validación'
              : `${validacion.errores.length} error${validacion.errores.length === 1 ? '' : 'es'} encontrado${validacion.errores.length === 1 ? '' : 's'}`
            }
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Validaciones básicas */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] mb-3">
            Validaciones básicas
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge ok={validacion.schema_valido} label="JSON Schema" />
            <Badge ok={validacion.orden_correcto} label="Orden de campos" />
          </div>
        </div>

        {/* Reglas de negocio */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] mb-3">
            Reglas de negocio
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
            {validacion.reglas_negocio.map((r) => {
              const bg = r.ok ? '#ecfdf5' : r.informativo ? '#fffbeb' : '#fef2f2'
              const color = r.ok ? '#065f46' : r.informativo ? '#92400e' : '#991b1b'
              return (
                <div
                  key={r.id}
                  className="flex flex-col items-center justify-center py-3 rounded-lg border"
                  style={{
                    backgroundColor: bg,
                    borderColor: r.ok ? '#a7f3d0' : r.informativo ? '#fde68a' : '#fecaca',
                    color
                  }}
                >
                  <span className="font-mono text-[10px] font-bold mb-1">{r.id}</span>
                  <span className="text-base font-bold">
                    {r.ok ? '✓' : r.informativo ? '⚠' : '✗'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Errores */}
        {validacion.errores.length > 0 && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#991b1b] mb-3">
              Errores encontrados
            </p>
            <ul className="space-y-2">
              {validacion.errores.map((e, i) => (
                <li
                  key={i}
                  className="text-sm px-4 py-3 rounded-lg border"
                  style={{
                    backgroundColor: '#fef2f2',
                    borderColor: '#fecaca',
                    color: '#991b1b'
                  }}
                >
                  {typeof e === 'string' ? e : JSON.stringify(e).slice(0, 120)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Advertencias */}
        {validacion.advertencias.length > 0 && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#92400e] mb-3">
              Advertencias
            </p>
            <ul className="space-y-2">
              {validacion.advertencias.map((a, i) => (
                <li
                  key={i}
                  className="text-sm px-4 py-3 rounded-lg border"
                  style={{
                    backgroundColor: '#fffbeb',
                    borderColor: '#fde68a',
                    color: '#92400e'
                  }}
                >
                  {typeof a === 'string' ? a : JSON.stringify(a).slice(0, 120)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border"
      style={{
        backgroundColor: ok ? '#ecfdf5' : '#fef2f2',
        borderColor: ok ? '#a7f3d0' : '#fecaca',
        color: ok ? '#065f46' : '#991b1b'
      }}
    >
      <span className="font-bold">{ok ? '✓' : '✗'}</span>
      {label}
    </span>
  )
}
