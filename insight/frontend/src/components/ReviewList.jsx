import { useState } from 'react'

export default function ReviewList({ reviews, extractedAspects }) {
    const [expanded, setExpanded] = useState(null)

    return (
        <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">
                Customer Reviews ({reviews.length})
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {reviews.map((review, i) => (
                    <div key={i} className="bg-surface border border-border 
                                           rounded-lg p-4 cursor-pointer"
                         onClick={() => setExpanded(expanded === i ? null : i)}>
                        <p className={`text-slate-300 text-sm leading-relaxed
                                      ${expanded === i ? '' : 'line-clamp-2'}`}>
                            {review}
                        </p>
                        {extractedAspects?.[i] && (
                            <p className="text-xs text-primary mt-2">
                                🏷 {extractedAspects[i]}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}