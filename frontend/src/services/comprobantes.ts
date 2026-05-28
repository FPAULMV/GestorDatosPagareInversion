import axios from 'axios'
import type { RespuestaCarga, ComprobanteResumen } from '../types/comprobante'

const api = axios.create({ baseURL: '/api' })

export async function cargarComprobante(archivo: File): Promise<RespuestaCarga> {
  const form = new FormData()
  form.append('archivo', archivo)
  const { data } = await api.post<RespuestaCarga>('/comprobantes/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function listarComprobantes(limite = 50): Promise<ComprobanteResumen[]> {
  const { data } = await api.get<ComprobanteResumen[]>('/comprobantes/', {
    params: { limite },
  })
  return data
}
