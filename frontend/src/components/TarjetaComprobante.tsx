import type { ComprobanteExtraido } from '../types/comprobante'

interface Props {
  datos: ComprobanteExtraido
  id: number
}

const MXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

function Fila({ etiqueta, valor, mono = false }: { etiqueta: string; valor: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 gap-4">
      <span className="text-xs text-[#94a3b8] shrink-0">{etiqueta}</span>
      <span className={`text-xs font-medium text-[#1e293b] text-right ${mono ? 'font-mono' : ''}`}>
        {valor ?? '—'}
      </span>
    </div>
  )
}

function GrupoFilas({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#1e40af] mb-1">{titulo}</p>
      <div className="divide-y divide-[#f1f5f9]">{children}</div>
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
    <div className="space-y-4">
      {/* Header card */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
        <div className="px-6 py-5 bg-gradient-to-br from-[#1e40af] to-[#3182f6]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70">Comprobante</span>
                <span className="text-[10px] font-mono text-white/70">#{id}</span>
              </div>
              <h2 className="text-white text-lg font-bold leading-tight truncate">
                {enc.nombre_cliente ?? '—'}
              </h2>
              <p className="text-white/80 text-xs mt-1">
                Contrato <span className="font-mono font-semibold text-white">{enc.contrato ?? '—'}</span>
              </p>
            </div>
            <span
              className="flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap"
              style={{ backgroundColor: estadoColor.bg, color: estadoColor.text }}
            >
              {datos.estado_operacion ?? '—'}
            </span>
          </div>
        </div>

        {/* Importes destacados */}
        <div className="grid grid-cols-2 divide-x divide-[#e2e8f0]">
          <div className="px-6 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#94a3b8] mb-1">
              Importe de inversión
            </p>
            <p className="text-xl font-bold text-[#1e40af]">
              {d.importe_inversion_mxn ? MXN.format(d.importe_inversion_mxn) : '—'}
            </p>
          </div>
          <div className="px-6 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#94a3b8] mb-1">
              Neto al vencimiento
            </p>
            <p className="text-xl font-bold text-[#10b981]">
              {d.importe_neto_vencimiento_mxn ? MXN.format(d.importe_neto_vencimiento_mxn) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Detalle compacto: un solo card, tres grupos */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] px-5 py-4 space-y-4">

        <GrupoFilas titulo="Detalle de la operación">
          <Fila etiqueta="Fecha de operación"    valor={d.fecha_hora_operacion?.split('T')[0] ?? '—'} />
          <Fila etiqueta="Fecha de vencimiento"  valor={d.fecha_vencimiento ?? '—'} />
          <Fila etiqueta="Plazo"                 valor={d.plazo_dias ? `${d.plazo_dias} día${d.plazo_dias === 1 ? '' : 's'}` : '—'} />
          <Fila etiqueta="Cuenta cargo"          valor={d.cuenta_cargo ?? '—'}          mono />
          <Fila etiqueta="Cuenta depósito"       valor={d.cuenta_deposito ?? '—'}       mono />
          <Fila etiqueta="Contrato de inversión" valor={d.contrato_inversion ?? '—'}    mono />
        </GrupoFilas>

        <div className="border-t border-[#e2e8f0]" />

        <GrupoFilas titulo="Tasas e impuestos">
          <Fila etiqueta="Tasa antes de impuestos"    valor={formatNum(d.tasa_fija_anual_antes_impuestos_pct)} />
          <Fila etiqueta="Tasa después de impuestos"  valor={formatNum(d.tasa_fija_anual_despues_impuestos_pct)} />
          <Fila etiqueta="Interés"                    valor={d.interes_mxn ? MXN.format(d.interes_mxn) : '—'} />
          <Fila etiqueta="ISR (Impuesto)"             valor={d.isr_impuesto_mxn ? MXN.format(d.isr_impuesto_mxn) : '—'} />
          <Fila etiqueta="GAT Nominal"                valor={formatNum(d.gat_nominal_antes_impuestos)} />
          <Fila etiqueta="GAT Real"                   valor={formatNum(d.gat_real_antes_impuestos)} />
        </GrupoFilas>

        <div className="border-t border-[#e2e8f0]" />

        <GrupoFilas titulo="Confirmación de transferencia">
          <Fila etiqueta="Folio de inversión" valor={conf.folio_inversion ?? '—'} mono />
          <Fila etiqueta="Folio de internet"  valor={conf.folio_internet ?? '—'}  mono />
          <Fila etiqueta="Fecha de consulta"  valor={enc.fecha_hora_consulta?.split('T')[0] ?? '—'} />
        </GrupoFilas>

      </div>
    </div>
  )
}
