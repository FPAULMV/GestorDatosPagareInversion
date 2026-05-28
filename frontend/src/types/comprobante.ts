export interface Encabezado {
  fecha_hora_consulta: string | null
  contrato: string | null
  nombre_cliente: string | null
}

export interface Producto {
  tipo: string | null
  moneda: string | null
}

export interface NotasLegales {
  garantia_ipab: string | null
  nota_gat: string | null
}

export interface DetalleComprobante {
  fecha_hora_operacion: string | null
  fecha_vencimiento: string | null
  cuenta_cargo: string | null
  cuenta_deposito: string | null
  contrato_inversion: string | null
  isr_impuesto_mxn: number | null
  importe_inversion_mxn: number | null
  interes_mxn: number | null
  plazo_dias: number | null
  importe_neto_vencimiento_mxn: number | null
  tasa_fija_anual_antes_impuestos_pct: number | null
  gat_nominal_antes_impuestos: number | string | null
  tasa_fija_anual_despues_impuestos_pct: number | null
  gat_real_antes_impuestos: number | string | null
}

export interface DatosConfirmacion {
  folio_inversion: string | null
  folio_internet: string | null
}

export interface ComprobanteExtraido {
  encabezado: Encabezado
  producto: Producto
  notas_legales: NotasLegales
  estado_operacion: string
  detalle_comprobante: DetalleComprobante
  datos_confirmacion_transferencia: DatosConfirmacion
}

export interface ReglaNegocio {
  id: string
  ok: boolean
  esperado?: number
  obtenido?: number
  informativo?: boolean
  [key: string]: unknown
}

export interface ResultadoValidacion {
  schema_valido: boolean
  orden_correcto: boolean
  reglas_negocio: ReglaNegocio[]
  advertencias: unknown[]
  errores: unknown[]
}

export interface RespuestaCarga {
  id: number
  datos: ComprobanteExtraido
  validacion: ResultadoValidacion
}

export interface ComprobanteResumen {
  id: number
  fecha_carga: string | null
  nombre_archivo: string | null
  nombre_cliente: string | null
  contrato: string | null
  estado_operacion: string | null
  importe_inversion_mxn: number | null
  plazo_dias: number | null
  fecha_hora_operacion: string | null
  fecha_vencimiento: string | null
  folio_inversion: string | null
  schema_valido: boolean | null
}
