import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import HomePage          from './pages/HomePage'
import LoginPage         from './pages/LoginPage'
import SignupPage        from './pages/SignupPage'
import SearchPage        from './pages/SearchPage'
import ResultsPage       from './pages/ResultsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import HistoryPage       from './pages/HistoryPage'

function Navbar() {
  const { isAuthenticated, username, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <nav className="border-b border-border px-6 py-4 flex justify-between items-center
                    bg-card backdrop-blur-sm sticky top-0 z-50"
         style={{ boxShadow: '0 1px 0 rgba(6,182,212,0.15)' }}>
      <Link to="/" className="text-white font-bold text-xl tracking-tight">
        <div>
          Cloth<span className="gradient-text">SA</span>
        </div>
        <span className="text-sm font-small text-gray-300 mt-1 italic tracking-wide">
              Wear your confidence, live your style
        </span>
      </Link>

      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <>
            <Link to="/search"
               className="text-slate-400 hover:text-cyan-400 text-sm transition-colors
                          border border-border hover:border-cyan-500/50 px-4 py-1.5
                          rounded-lg hover:shadow-glow">
              Search
            </Link>
            <Link to="/history"
               className="text-slate-400 hover:text-cyan-400 text-sm transition-colors
                          border border-border hover:border-cyan-500/50 px-4 py-1.5
                          rounded-lg hover:shadow-glow">
              History
            </Link>
            <span className="text-slate-500 text-xs hidden sm:inline">
              {username}
            </span>
            <button onClick={handleLogout}
               className="text-slate-400 hover:text-red-400 text-sm transition-colors
                          border border-border hover:border-red-500/50 px-4 py-1.5
                          rounded-lg">
              Log Out
            </button>
          </>
        ) : (
          <>
            <Link to="/login"
               className="text-slate-400 hover:text-cyan-400 text-sm transition-colors
                          border border-border hover:border-cyan-500/50 px-4 py-1.5
                          rounded-lg hover:shadow-glow">
              Log In
            </Link>
            <Link to="/signup"
               className="bg-accent-gradient hover:shadow-glow text-white text-sm
                          font-semibold px-4 py-1.5 rounded-lg transition-all">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"        element={<HomePage />} />
      <Route path="/login"   element={<LoginPage />} />
      <Route path="/signup"  element={<SignupPage />} />

      <Route path="/search" element={
        <ProtectedRoute><SearchPage /></ProtectedRoute>
      } />
      <Route path="/results" element={
        <ProtectedRoute><ResultsPage /></ProtectedRoute>
      } />
      <Route path="/product/:id" element={
        <ProtectedRoute><ProductDetailPage /></ProtectedRoute>
      } />
      <Route path="/history" element={
        <ProtectedRoute><HistoryPage /></ProtectedRoute>
      } />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App