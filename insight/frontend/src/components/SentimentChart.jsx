import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts'

const COLORS = {
  positive: '#06b6d4',
  negative: '#f43f5e',
  neutral:  '#475569',
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-surface border border-border rounded-xl p-3 text-xs shadow-glowCard">
        <p className="text-white font-semibold mb-2">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.fill || p.color }} className="capitalize">
            {p.name}: {p.value}{p.unit || ''}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function SentimentChart({ aspectSentimentCounts }) {
  if (!aspectSentimentCounts || Object.keys(aspectSentimentCounts).length === 0) return null

  // ── Per-aspect counts, with totals for sorting/percentages ────────────────
  const raw = Object.entries(aspectSentimentCounts).map(([aspect, sentiments]) => {
    const positive = (sentiments.positive || 0) + (sentiments['extremely positive'] || 0)
    const negative = (sentiments.negative || 0) + (sentiments['extremely negative'] || 0)
    const neutral  = (sentiments.neutral || 0) + (sentiments.conflict || 0)
    const total = positive + negative + neutral
    return { aspect, positive, negative, neutral, total }
  }).filter(row => row.total > 0)

  // Most-discussed aspects first, so the important stuff is on top
  raw.sort((a, b) => b.total - a.total)

  // 100%-stacked percentages, easier to compare aspects with very different review volumes
  const stackedData = raw.map((row) => ({
    aspect: row.aspect,
    Positive: +((row.positive / row.total) * 100).toFixed(1),
    Negative: +((row.negative / row.total) * 100).toFixed(1),
    Neutral:  +((row.neutral  / row.total) * 100).toFixed(1),
  }))

  // ── Overall totals for the summary donut + stat cards ──────────────────────
  const totals = raw.reduce(
    (acc, row) => {
      acc.positive += row.positive
      acc.negative += row.negative
      acc.neutral  += row.neutral
      return acc
    },
    { positive: 0, negative: 0, neutral: 0 }
  )
  const grandTotal = totals.positive + totals.negative + totals.neutral || 1
  const pieData = [
    { name: 'Positive', value: totals.positive, color: COLORS.positive },
    { name: 'Negative', value: totals.negative, color: COLORS.negative },
    { name: 'Neutral',  value: totals.neutral,  color: COLORS.neutral },
  ].filter(d => d.value > 0)

  const pctPositive = Math.round((totals.positive / grandTotal) * 100)
  const pctNegative = Math.round((totals.negative / grandTotal) * 100)
  const topPraised   = raw.length ? [...raw].sort((a, b) => b.positive - a.positive)[0] : null
  const topComplaint = raw.filter(r => r.negative > 0).sort((a, b) => b.negative - a.negative)[0]

  return (
    <div className="space-y-6">

      {/* ── Overview: donut + stat cards ─────────────────────────────────── */}
      <div className="bg-card-gradient border border-border rounded-2xl p-6
                      shadow-glowCard hover:shadow-glow transition-shadow duration-300">
        <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
          <span className="text-cyan-400">🧭</span> Overall Sentiment
        </h3>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-full sm:w-48 shrink-0">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={2}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <StatCard label="Positive Mentions" value={`${pctPositive}%`} accent="text-cyan-400" />
            <StatCard label="Negative Mentions" value={`${pctNegative}%`} accent="text-rose-400" />
            <StatCard
              label="Most Praised"
              value={topPraised ? topPraised.aspect : '—'}
              accent="text-cyan-400"
              small
            />
            <StatCard
              label="Top Complaint"
              value={topComplaint ? topComplaint.aspect : 'None found'}
              accent="text-rose-400"
              small
            />
          </div>
        </div>
      </div>

      {/* ── Per-aspect 100% stacked breakdown, sorted by relevance ─────────── */}
      <div className="bg-card-gradient border border-border rounded-2xl p-6
                      shadow-glowCard hover:shadow-glow transition-shadow duration-300">
        <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
          <span className="text-cyan-400">📊</span> Aspect Sentiment Breakdown
        </h3>
        <p className="text-slate-500 text-xs mb-5">
          Sorted by how often each aspect was mentioned. Bars show % positive / negative / neutral.
        </p>
        <ResponsiveContainer width="100%" height={Math.max(220, stackedData.length * 42)}>
          <BarChart
            data={stackedData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fill: '#94a3b8', fontSize: 11 }}
                   axisLine={{ stroke: '#2e2e2e' }} tickLine={false} />
            <YAxis type="category" dataKey="aspect" width={110}
                   tick={{ fill: '#e2e8f0', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(6,182,212,0.05)' }} />
            <Bar dataKey="Positive" stackId="s" fill={COLORS.positive} unit="%" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Negative" stackId="s" fill={COLORS.negative} unit="%" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Neutral"  stackId="s" fill={COLORS.neutral}  unit="%" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-5 mt-3 justify-center text-xs text-slate-500">
          <Legend color="bg-cyan-500" label="Positive" />
          <Legend color="bg-rose-500" label="Negative" />
          <Legend color="bg-slate-500" label="Neutral" />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, accent, small }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-3">
      <p className="text-slate-500 text-[11px] mb-1">{label}</p>
      <p className={`font-bold ${accent} ${small ? 'text-sm capitalize truncate' : 'text-xl'}`}>
        {value}
      </p>
    </div>
  )
}

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-sm inline-block ${color}`} /> {label}
    </span>
  )
}