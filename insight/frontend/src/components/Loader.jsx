export default function Loader({ message = "Analyzing reviews..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="relative">
        <div className="w-14 h-14 border-4 border-cyan-500/20 rounded-full" />
        <div className="w-14 h-14 border-4 border-cyan-500 border-t-transparent
                        rounded-full animate-spin absolute top-0 left-0
                        shadow-glow" />
      </div>
      <p className="text-slate-400 text-sm">{message}</p>
    </div>
  )
}