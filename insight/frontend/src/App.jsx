import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage          from './pages/HomePage'
import ResultsPage       from './pages/ResultsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import HistoryPage       from './pages/HistoryPage'

function App() {
  return (
    <BrowserRouter>
      {/* Navbar */}
      <nav className="border-b border-border px-6 py-4 flex justify-between items-center
                      bg-card backdrop-blur-sm sticky top-0 z-50"
           style={{ boxShadow: '0 1px 0 rgba(6,182,212,0.15)' }}>
        <a href="/" className="text-white font-bold text-xl tracking-tight">
          <div>
            Cloth<span className="gradient-text">SA</span>
          </div>
          <span className="text-sm font-small text-gray-300 mt-1 italic tracking-wide">
                Wear your confidence, live your style
          </span>
        </a>
        <a href="/history"
           className="text-slate-400 hover:text-cyan-400 text-sm transition-colors
                      border border-border hover:border-cyan-500/50 px-4 py-1.5
                      rounded-lg hover:shadow-glow">
          History
        </a>
      </nav>

      <Routes>
        <Route path="/"            element={<HomePage />} />
        <Route path="/results"     element={<ResultsPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/history"     element={<HistoryPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App