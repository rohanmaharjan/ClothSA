import { useLocation, useNavigate } from 'react-router-dom'
import ReviewList from '../components/ReviewList'

export default function ResultsPage() {
    const { state } = useLocation()
    const navigate  = useNavigate()
    const products  = state?.data?.products || []

    if (!products.length) {
        navigate('/search')
        return null
    }

    return (
        <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate('/search')}
                        className="text-slate-400 hover:text-white transition-colors text-sm">
                    ← Back
                </button>
                <h2 className="text-white font-semibold text-lg">Product Overview</h2>
            </div>

            {products.map((product) => (
                <div key={product.id} className="space-y-6 mb-10">

                    {/* Product header with image, price, sizes */}
                    <div className="bg-card border border-border rounded-xl p-5">
                        <div className="flex flex-col sm:flex-row gap-5">
                            {product.image_url && (
                                <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-full sm:w-40 h-40 object-cover rounded-lg
                                               border border-border bg-surface shrink-0"
                                    onError={(e) => { e.target.style.display = 'none' }}
                                />
                            )}

                            <div className="flex-1 min-w-0">
                                <h3 className="text-white font-bold text-xl mb-2">{product.name}</h3>

                                <div className="flex flex-wrap gap-3 mb-3">
                                    {product.price && (
                                        <span className="bg-surface border border-border rounded-lg
                                                         px-3 py-1 text-cyan-400 text-sm font-semibold">
                                            {product.price}
                                        </span>
                                    )}
                                    <span className="bg-surface border border-border rounded-lg
                                                     px-3 py-1 text-slate-400 text-sm">
                                        {product.reviews?.length || 0} reviews found
                                    </span>
                                </div>

                                {product.sizes?.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-slate-500 text-xs mb-1.5">Available sizes</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {product.sizes.map((size) => (
                                                <span key={size}
                                                      className="bg-surface border border-border rounded-md
                                                                 px-2.5 py-1 text-slate-300 text-xs">
                                                    {size}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => navigate(`/product/${product.id}`)}
                                    disabled={!product.reviews?.length}
                                    className="bg-accent-gradient hover:shadow-glow disabled:opacity-40
                                               disabled:cursor-not-allowed text-white font-semibold text-sm
                                               px-6 py-2.5 rounded-xl transition-all duration-300">
                                    ⚡ Analyze Sentiment →
                                </button>
                                {!product.reviews?.length && (
                                    <p className="text-slate-600 text-xs mt-2">
                                        No reviews were found for this product, so there's nothing to analyze yet.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Raw reviews, before any analysis */}
                    {product.reviews?.length > 0 && (
                        <ReviewList reviews={product.reviews} />
                    )}
                </div>
            ))}
        </div>
    )
}