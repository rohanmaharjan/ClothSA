import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-surface border border-border rounded-xl p-3 text-xs shadow-glowCard">
        <p className="text-white font-semibold mb-2">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.fill }} className="capitalize">
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function SentimentChart({ aspectSentimentCounts }) {
  if (!aspectSentimentCounts || Object.keys(aspectSentimentCounts).length === 0) return null

  const data = Object.entries(aspectSentimentCounts).map(([aspect, sentiments]) => ({
    aspect,
    positive: (sentiments.positive || 0) + (sentiments['extremely positive'] || 0),
    negative: (sentiments.negative  || 0) + (sentiments['extremely negative']  || 0),
    neutral:   sentiments.neutral || 0,
  }))

  return (
    <div className="bg-card-gradient border border-border rounded-2xl p-6
                    shadow-glowCard hover:shadow-glow transition-shadow duration-300">
      <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
        <span className="text-cyan-400">📊</span> Aspect Sentiment Breakdown
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" vertical={false} />
          <XAxis dataKey="aspect" tick={{ fill: '#94a3b8', fontSize: 11 }}
                 axisLine={{ stroke: '#2e2e2e' }} tickLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }}
                 axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(6,182,212,0.05)' }} />
          <Bar dataKey="positive" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Positive" />
          <Bar dataKey="negative" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Negative" />
          <Bar dataKey="neutral"  fill="#475569" radius={[4, 4, 0, 0]} name="Neutral"  />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-5 mt-3 justify-center text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 inline-block" /> Positive
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" /> Negative
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-slate-500 inline-block" /> Neutral
        </span>
      </div>
    </div>
  )
}