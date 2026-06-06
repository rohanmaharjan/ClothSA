import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProductDetail } from '../api/productApi'
import AspectBadge from '../components/AspectBadge'
import SentimentChart from '../components/SentimentChart'
import ReviewList from '../components/ReviewList'
import Loader from '../components/Loader'

export default function ProductDetailPage() {
    const { id }       = useParams()
    const navigate     = useNavigate()
    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError]     = useState(null)

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await getProductDetail(id)
                setProduct(data)
            } catch {
                setError('Product not found')
            } finally {
                setLoading(false)
            }
        }
        fetch()
    }, [id])

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader /></div>
    if (error)   return <div className="min-h-screen flex items-center justify-center text-red-400">{error}</div>

    return (
        <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto">
            <button onClick={() => navigate(-1)}
                    className="text-slate-400 hover:text-white text-sm mb-6 block">
                ← Back
            </button>

            <h2 className="text-white font-bold text-2xl mb-6">{product.name}</h2>

            <div className="space-y-6">
                {/* Aspect badges */}
                {product.extracted_aspects?.length > 0 && (
                    <div className="bg-card border border-border rounded-xl p-5">
                        <h3 className="text-white font-semibold mb-3">🏷 Aspect Analysis</h3>
                        <div className="flex flex-wrap gap-2">
                            {[...new Set(
                                product.extracted_aspects
                                    .join(', ')
                                    .split(', ')
                                    .filter(p => p.includes(':'))
                            )].map((pair, i) => {
                                const [aspect, sentiment] = pair.split(':').map(s => s.trim())
                                return <AspectBadge key={i} aspect={aspect} sentiment={sentiment} />
                            })}
                        </div>
                    </div>
                )}

                {/* Chart */}
                <SentimentChart aspectSentimentCounts={product.aspect_sentiment_counts} />

                {/* Reviews */}
                <ReviewList
                    reviews={product.reviews || []}
                    extractedAspects={product.extracted_aspects}
                />
            </div>
        </div>
    )
}