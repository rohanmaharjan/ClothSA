export default function AspectBadge({ aspect, sentiment }) {
  const styles = {
    positive: {
      classes: 'border-emerald-500/30 text-emerald-300',
      bg:      'linear-gradient(135deg, #064e3b88, #065f4688)',
      icon:    '✅',
    },
    'extremely positive': {
      classes: 'border-emerald-400/40 text-emerald-200',
      bg:      'linear-gradient(135deg, #064e3b, #065f46)',
      icon:    '🌟',
    },
    negative: {
      classes: 'border-red-500/30 text-red-300',
      bg:      'linear-gradient(135deg, #450a0a88, #7f1d1d88)',
      icon:    '❌',
    },
    'extremely negative': {
      classes: 'border-red-400/40 text-red-200',
      bg:      'linear-gradient(135deg, #450a0a, #7f1d1d)',
      icon:    '🚨',
    },
    neutral: {
      classes: 'border-slate-500/30 text-slate-400',
      bg:      'linear-gradient(135deg, #1e293b88, #33415588)',
      icon:    '➖',
    },
    conflict: {
      classes: 'border-yellow-500/30 text-yellow-300',
      bg:      'linear-gradient(135deg, #42200088, #78350f88)',
      icon:    '⚠️',
    },
  }

  const s = styles[sentiment] || styles.neutral

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                  border text-xs font-medium ${s.classes}`}
      style={{ background: s.bg }}
    >
      {s.icon} {aspect}
    </span>
  )
}