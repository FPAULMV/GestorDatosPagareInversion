interface Props {
  onArchivo: (archivo: File) => void
  cargando: boolean
}

export default function ZonaCarga({ onArchivo, cargando }: Props) {
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    if (archivo) onArchivo(archivo)
  }

  return (
    <label
      className={`
        block w-full rounded-2xl border-2 border-dashed
        px-6 py-10 cursor-pointer transition-all duration-200
        border-[#cbd5e1] bg-[#f8fafc] hover:border-[#3182f6] hover:bg-[#ede9fe]/50
        ${cargando ? 'opacity-60 pointer-events-none' : ''}
      `}
    >
      <input
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={onInputChange}
        disabled={cargando}
      />

      <div className="flex flex-col items-center justify-center text-center">
        {cargando ? (
          <>
            <div className="w-14 h-14 rounded-2xl bg-[#ede9fe] flex items-center justify-center mb-4">
              <div className="w-7 h-7 border-3 border-[#cbd5e1] border-t-[#3182f6] rounded-full animate-spin" />
            </div>
            <p className="text-[#1e40af] font-bold text-base mb-1">Procesando documento</p>
            <p className="text-[#64748b] text-sm">Extrayendo información del PDF…</p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-[#ede9fe] flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-[#3182f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-[#1e40af] font-bold text-lg mb-1">
              Arrastra tu archivo aquí
            </p>
            <p className="text-[#64748b] text-sm mb-5">
              o haz clic para seleccionar
            </p>
            <span className="inline-flex items-center justify-center px-5 py-2 rounded-lg bg-[#3182f6] hover:bg-[#1e40af] text-white text-sm font-semibold transition-colors shadow-sm">
              Seleccionar archivo
            </span>
            <p className="text-[#94a3b8] text-xs mt-4">
              PDF · Máximo 10 MB · Pagaré BBVA
            </p>
          </>
        )}
      </div>
    </label>
  )
}
