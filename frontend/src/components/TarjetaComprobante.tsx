import type { ComprobanteExtraido } from '../types/comprobante'

interface Props {
  datos: ComprobanteExtraido
  id: number
}

const MXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

function Campo({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8]">
        {etiqueta}
      </span>
      <span className="text-sm font-medium text-[#324153]">
        {valor ?? '—'}
      </span>
    </div>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e40af] mb-5 pb-3 border-b border-[#e2e8f0]">
        {titulo}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5">
        {children}
      </div>
    </div>
  )
}

export default function TarjetaComprobante({ datos, id }: Props) {
  const enc = datos.encabezado
  const d = datos.detalle_comprobante
  const conf = datos.datos_confirmacion_transferencia

  const estadoColor =
    datos.estado_operacion === 'Operación Exitosa'
      ? { bg: '#10b981', text: 'white' }
      : datos.estado_operacion === 'Operación Fallida'
        ? { bg: '#ef4444', text: 'white' }
        : { bg: '#f59e0b', text: 'white' }

  const formatNum = (v: number | string | null | undefined) => {
    if (v === null || v === undefined) return '—'
    if (typeof v === 'string') return v
    return `${v.toFixed(2)}%`
  }

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-br from-[#1e40af] to-[#3182f6]">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                  Comprobante
                </span>
                <span className="text-[11px] font-mono text-white/70">#{id}</span>
              </div>
              <h2 className="text-white text-xl font-bold mb-2 leading-tight truncate">
                {enc.nombre_cliente ?? '—'}
              </h2>
              <p className="text-white/80 text-sm">
                Contrato <span className="font-mono font-semibold text-white">{enc.contrato ?? '—'}</span>
              </p>
            </div>
            <span
              className="flex-shrink-0 inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap"
              style={{ backgroundColor: estadoColor.bg, color: estadoColor.text }}
            >
              {datos.estado_operacion ?? '—'}
            </span>
          </div>
        </div>

        {/* Importes destacados */}
        <div className="grid grid-cols-2 divide-x divide-[#e2e8f0]">
          <div className="px-8 py-6">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8] mb-2">
              Importe de inversión
            </p>
            <p className="text-2xl font-bold text-[#1e40af]">
              {d.importe_inversion_mxn ? MXN.format(d.importe_inversion_mxn) : '—'}
            </p>
          </div>
          <div className="px-8 py-6">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8] mb-2">
              Neto al vencimiento
            </p>
            <p className="text-2xl font-bold text-[#10b981]">
              {d.importe_neto_vencimiento_mxn ? MXN.format(d.importe_neto_vencimiento_mxn) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Secciones de detalle */}
      <Seccion titulo="Detalle de la operación">
        <Campo etiqueta="Fecha de operación" valor={d.fecha_hora_operacion?.split('T')[0] ?? '—'} />
        <Campo etiqueta="Fecha de vencimiento" valor={d.fecha_vencimiento ?? '—'} />
        <Campo etiqueta="Plazo" valor={d.plazo_dias ? `${d.plazo_dias} día${d.plazo_dias === 1 ? '' : 's'}` : '—'} />
        <Campo etiqueta="Cuenta cargo" valor={d.cuenta_cargo ? <span className="font-mono">{d.cuenta_cargo}</span> : '—'} />
        <Campo etiqueta="Cuenta depósito" valor={d.cuenta_deposito ? <span className="font-mono">{d.cuenta_deposito}</span> : '—'} />
        <Campo etiqueta="Contrato de inversión" valor={d.contrato_inversion ? <span className="font-mono">{d.contrato_inversion}</span> : '—'} />
      </Seccion>

      <Seccion titulo="Tasas e impuestos">
        <Campo etiqueta="Tasa antes de impuestos" valor={formatNum(d.tasa_fija_anual_antes_impuestos_pct)} />
        <Campo etiqueta="Tasa después de impuestos" valor={formatNum(d.tasa_fija_anual_despues_impuestos_pct)} />
        <Campo etiqueta="Interés" valor={d.interes_mxn ? MXN.format(d.interes_mxn) : '—'} />
        <Campo etiqueta="ISR (Impuesto)" valor={d.isr_impuesto_mxn ? MXN.format(d.isr_impuesto_mxn) : '—'} />
        <Campo etiqueta="GAT Nominal" valor={formatNum(d.gat_nominal_antes_impuestos)} />
        <Campo etiqueta="GAT Real" valor={formatNum(d.gat_real_antes_impuestos)} />
      </Seccion>

      <Seccion titulo="Confirmación de transferencia">
        <Campo etiqueta="Folio de inversión" valor={conf.folio_inversion ? <span className="font-mono">{conf.folio_inversion}</span> : '—'} />
        <Campo etiqueta="Folio de internet" valor={conf.folio_internet ? <span className="font-mono">{conf.folio_internet}</span> : '—'} />
        <Campo etiqueta="Fecha de consulta" valor={enc.fecha_hora_consulta?.split('T')[0] ?? '—'} />
      </Seccion>
    </div>
  )
}
