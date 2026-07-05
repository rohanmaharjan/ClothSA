import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function HomePage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4
                    bg-hero-gradient relative overflow-hidden">

      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2
                      w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3
                      w-64 h-64 bg-cyan-400/5 rounded-full blur-3xl pointer-events-none" />

      <div className="text-center relative z-10 max-w-2xl">
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20
                        text-cyan-400 text-xs px-3 py-1 rounded-full mb-4">
          ✦ AI-Powered Review Analysis
        </div>
        <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">
          Cloth<span className="gradient-text">SA</span>
        </h1>
        <p className="text-slate-400 text-base mb-2">
          Wear your confidence, live your style
        </p>
        <p className="text-slate-500 text-sm mb-10 leading-relaxed">
          Paste an Amazon product link or search by name — ClothSA scrapes real
          customer reviews, runs aspect-level sentiment analysis with a
          fine-tuned T5 model, and turns it into clear, visual insights.
        </p>

        <div className="flex items-center justify-center gap-4">
          {isAuthenticated ? (
            <Link
              to="/search"
              className="bg-accent-gradient hover:shadow-glow text-white font-semibold
                         text-sm px-8 py-3 rounded-xl transition-all duration-300 glow-pulse"
            >
              ⚡ Start Analyzing
            </Link>
          ) : (
            <>
              <Link
                to="/signup"
                className="bg-accent-gradient hover:shadow-glow text-white font-semibold
                           text-sm px-8 py-3 rounded-xl transition-all duration-300 glow-pulse"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="text-slate-300 hover:text-cyan-400 text-sm font-medium
                           border border-border hover:border-cyan-500/50 px-8 py-3
                           rounded-xl transition-colors"
              >
                Log In
              </Link>
            </>
          )}
        </div>

        <p className="text-slate-600 text-xs mt-8">
          {isAuthenticated
            ? 'Welcome back — your search history is saved to your account.'
            : 'Create a free account to search products and keep your own history.'}
        </p>
      </div>

      {/* Feature strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 relative z-10 max-w-3xl w-full px-4">
        {[
          { icon: '🔎', title: 'Search or Paste a URL', desc: 'Any Amazon clothing product link works.' },
          { icon: '🧠', title: 'AI Aspect Sentiment', desc: 'Fine-tuned T5 model finds what people liked or hated.' },
          { icon: '📊', title: 'Visual Breakdown', desc: 'Clear charts instead of walls of raw reviews.' },
        ].map((f) => (
          <div key={f.title} className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl mb-2">{f.icon}</div>
            <p className="text-white text-sm font-semibold mb-1">{f.title}</p>
            <p className="text-slate-500 text-xs">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}