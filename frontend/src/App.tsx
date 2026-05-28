import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import Inicio from './pages/Inicio'
import Historial from './pages/Historial'

function AppContent() {
  const navigate = useNavigate()
  return (
      <div className="min-h-screen flex flex-col bg-[#f8fafc]">
        {/* Header */}
        <header className="bg-white border-b border-[#e2e8f0] sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
            <button onClick={() => navigate('/')} className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 rounded-lg bg-[#3182f6] flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-[#1e40af] font-bold text-base leading-tight">Pagaré Inversión BBVA</p>
              </div>
            </button>

            <nav className="flex items-center gap-1">
              <NavLink
                to="/historial"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#ede9fe] text-[#1e40af]'
                      : 'text-[#64748b] hover:text-[#324153] hover:bg-[#f1f5f9]'
                  }`
                }
              >
                Historial
              </NavLink>
            </nav>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 w-full">
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/historial" element={<Historial />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-[#e2e8f0] mt-16">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-3">
            <p className="text-center text-xs text-[#94a3b8]">
              <a href="https://www.linkedin.com/company/secombustibles/posts/?feedView=all" target="_blank" rel="noopener noreferrer" className="text-[#94a3b8] hover:underline">
                Sinergia Estratégica de Combustibles, S. de R.L. de C.V.
              </a>
              {' · '}
              © 2026. Desarrollado por <a href="mailto:paul.morales@secmexico.com" className="text-[#3182f6] hover:underline">paul.morales@secmexico.com</a>
            </p>
          </div>
        </footer>
      </div>
    )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
