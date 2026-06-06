import { useLocation, useNavigate } from 'react-router-dom'
import AspectBadge from '../components/AspectBadge'
import SentimentChart from '../components/SentimentChart'
import ReviewList from '../components/ReviewList'

export default function ResultsPage() {
    const { state }  = useLocation()
    const navigate   = useNavigate()
    const products   = state?.data?.products || []

    if (!products.length) {
        navigate('/')
        return null
    }

    return (
        <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate('/')}
                        className="text-slate-400 hover:text-white transition-colors text-sm">
                    ← Back
                </button>
                <h2 className="text-white font-semibold text-lg">Analysis Results</h2>
            </div>

            {products.map((product) => (
                <div key={product.id} className="space-y-6 mb-10">

                    {/* Product header */}
                    <div className="bg-card border border-border rounded-xl p-5">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-white font-bold text-xl">{product.name}</h3>
                                <p className="text-slate-500 text-xs mt-1">Product ID: {product.id}</p>
                            </div>
                            <button
                                onClick={() => navigate(`/product/${product.id}`)}
                                className="text-primary hover:text-indigo-400 text-sm 
                                           border border-primary hover:border-indigo-400
                                           px-3 py-1 rounded-lg transition-colors">
                                Full Detail →
                            </button>
                        </div>
                    </div>

                    {/* Summary */}
                    {product.summary_text && (
                        <div className="bg-card border border-border rounded-xl p-5">
                            <h3 className="text-white font-semibold mb-2">📊 Summary</h3>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                {product.summary_text}
                            </p>
                        </div>
                    )}

                    {/* Aspect badges */}
                    {product.extracted_aspects?.length > 0 && (
                        <div className="bg-card border border-border rounded-xl p-5">
                            <h3 className="text-white font-semibold mb-3">🏷 Detected Aspects</h3>
                            <div className="flex flex-wrap gap-2">
                                {[...new Set(
                                    product.extracted_aspects
                                        .join(', ')
                                        .split(', ')
                                        .filter(p => p.includes(':'))
                                )].map((pair, i) => {
                                    const [aspect, sentiment] = pair.split(':').map(s => s.trim())
                                    return (
                                        <AspectBadge
                                            key={i}
                                            aspect={aspect}
                                            sentiment={sentiment}
                                        />
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Chart */}
                    {product.aspect_sentiment_counts && (
                        <SentimentChart
                            aspectSentimentCounts={product.aspect_sentiment_counts}
                        />
                    )}

                    {/* Reviews */}
                    <ReviewList
                        reviews={product.reviews || []}
                        extractedAspects={product.extracted_aspects}
                    />
                </div>
            ))}
        </div>
    )
}