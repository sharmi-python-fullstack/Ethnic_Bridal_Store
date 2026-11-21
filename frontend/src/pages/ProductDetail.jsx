import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { FiHeart, FiShoppingCart, FiStar, FiTruck, FiShield, FiRotateCcw, FiMinus, FiPlus } from 'react-icons/fi'
import { FaHeart } from 'react-icons/fa'
import { getProduct, getProductReviews, addReview, toggleWishlist, getProductRecommendations } from '../api/products'
import { formatPrice, getImageUrl, formatDate, getErrorMessage } from '../utils/helpers'
import { useCart } from '../hooks/useCart'
import toast from 'react-hot-toast'

export default function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { token } = useSelector((s) => s.auth)
  const { addItemToCart } = useCart()

  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [boughtTogether, setBoughtTogether] = useState([])
  const [similarProducts, setSimilarProducts] = useState([])
  const [bundleChecked, setBundleChecked] = useState({})
  const [bundleLoading, setBundleLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [inWishlist, setInWishlist] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [cartLoading, setCartLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('description')
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [pRes, rRes, recRes] = await Promise.all([
          getProduct(slug),
          getProductReviews(slug),
          getProductRecommendations(slug).catch(() => ({ data: { bought_together: [], similar_products: [] } })),
        ])
        setProduct(pRes.data)
        setInWishlist(pRes.data.in_wishlist)
        setReviews(rRes.data.results || rRes.data)
        const bt = recRes.data.bought_together || []
        setBoughtTogether(bt)
        setSimilarProducts(recRes.data.similar_products || [])
        // Default check all bought together items
        const checks = {}
        bt.forEach((item) => { checks[item.id] = true })
        setBundleChecked(checks)
      } catch {
        navigate('/products')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug, navigate])

  const handleWishlist = async () => {
    if (!token) { toast.error('Please login first'); return }
    setWishlistLoading(true)
    try {
      const res = await toggleWishlist(product.id)
      setInWishlist(res.data.in_wishlist)
      toast.success(res.data.message)
    } catch { toast.error('Failed to update wishlist') }
    finally { setWishlistLoading(false) }
  }

  const handleAddToCart = async () => {
    if (!token) { toast.error('Please login first'); navigate('/login'); return }
    setCartLoading(true)
    await addItemToCart(product.id, quantity, selectedSize, selectedColor)
    setCartLoading(false)
  }

  const handleBuyNow = async () => {
    if (!token) { toast.error('Please login first'); navigate('/login'); return }
    setCartLoading(true)
    const success = await addItemToCart(product.id, quantity, selectedSize, selectedColor)
    setCartLoading(false)
    if (success) navigate('/checkout')
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!token) { toast.error('Please login to leave a review'); return }
    if (reviewForm.comment.length < 10) { toast.error('Comment must be at least 10 characters'); return }
    setSubmittingReview(true)
    try {
      await addReview(product.slug, reviewForm)
      const rRes = await getProductReviews(product.slug)
      setReviews(rRes.data.results || rRes.data)
      setReviewForm({ rating: 5, title: '', comment: '' })
      toast.success('Review submitted!')
    } catch (err) { toast.error(getErrorMessage(err)) }
    finally { setSubmittingReview(false) }
  }

  if (loading) return (
    <div className="min-h-screen bg-brand-cream">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="skeleton h-96 rounded-2xl" />
          <div className="space-y-4">
            <div className="skeleton h-8 w-3/4" />
            <div className="skeleton h-6 w-1/2" />
            <div className="skeleton h-10 w-1/3" />
            <div className="skeleton h-24" />
            <div className="skeleton h-14" />
          </div>
        </div>
      </div>
    </div>
  )

  if (!product) return null

  const images = product.images || []
  const currentImg = images[selectedImage]?.image_url || getImageUrl(null)
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size']

  const selectedBundleItems = boughtTogether.filter((item) => bundleChecked[item.id])
  const bundleTotalPrice =
    parseFloat(product?.effective_price || 0) +
    selectedBundleItems.reduce((acc, item) => acc + parseFloat(item.effective_price || 0), 0)

  const handleAddBundleToCart = async () => {
    if (!token) {
      toast.error('Please login to add items to cart')
      return
    }
    setBundleLoading(true)
    try {
      await addItemToCart(product.id, quantity, selectedSize, selectedColor)
      for (const item of selectedBundleItems) {
        await addItemToCart(item.id, 1, '', '')
      }
      toast.success(`🎉 Added ${1 + selectedBundleItems.length} bridal items to your cart!`)
    } catch {
      toast.error('Failed to add bundle to cart')
    } finally {
      setBundleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-brand-red">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-brand-red">Products</Link>
          {product.category && (
            <>
              <span>/</span>
              <Link to={`/category/${product.category.slug}`} className="hover:text-brand-red">{product.category.name}</Link>
            </>
          )}
          <span>/</span>
          <span className="text-brand-charcoal font-medium truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Images */}
          <div>
            <div className="relative overflow-hidden rounded-2xl bg-white shadow-card mb-4 aspect-[3/4]">
              <img
                src={currentImg}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = '/placeholder-bridal.svg' }}
              />
              {product.discount_percentage > 0 && (
                <span className="absolute top-4 left-4 bg-brand-red text-white text-sm font-bold px-3 py-1 rounded-full">
                  -{product.discount_percentage}% OFF
                </span>
              )}
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${i === selectedImage ? 'border-brand-gold' : 'border-gray-200'}`}
                  >
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            {product.category && (
              <Link to={`/category/${product.category.slug}`} className="text-brand-gold text-sm font-medium hover:underline">
                {product.category.name}
              </Link>
            )}
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-brand-charcoal mt-1 mb-3">{product.name}</h1>

            {/* Rating */}
            {product.review_count > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <div className="flex">
                  {Array(5).fill(0).map((_, i) => (
                    <FiStar key={i} className={`text-sm ${i < Math.round(product.average_rating) ? 'text-brand-gold fill-brand-gold' : 'text-gray-300'}`} />
                  ))}
                </div>
                <span className="text-sm font-semibold">{product.average_rating}</span>
                <span className="text-sm text-gray-400">({product.review_count} reviews)</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-5">
              <span className="text-3xl font-bold text-brand-deep-red">{formatPrice(product.effective_price)}</span>
              {product.discount_price && (
                <>
                  <span className="text-xl text-gray-400 line-through">{formatPrice(product.price)}</span>
                  <span className="bg-green-100 text-green-700 text-sm font-bold px-2.5 py-0.5 rounded-full">
                    Save {product.discount_percentage}%
                  </span>
                </>
              )}
            </div>

            {/* Stock */}
            <div className={`inline-flex items-center gap-1.5 text-sm font-medium mb-5 px-3 py-1.5 rounded-full ${product.in_stock ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${product.in_stock ? 'bg-green-500' : 'bg-red-500'}`} />
              {product.in_stock
                ? product.stock <= 5
                  ? `⚠️ Only ${product.stock} left in stock!`
                  : `✓ In Stock — ${product.stock} units available`
                : '✗ Out of Stock — Currently unavailable'
              }
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
              {product.fabric && (
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <span className="text-gray-500 block text-xs">Fabric</span>
                  <span className="font-medium text-brand-charcoal">{product.fabric}</span>
                </div>
              )}
              {product.occasion && (
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <span className="text-gray-500 block text-xs">Occasion</span>
                  <span className="font-medium text-brand-charcoal capitalize">{product.occasion}</span>
                </div>
              )}
              {product.color && (
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <span className="text-gray-500 block text-xs">Color</span>
                  <span className="font-medium text-brand-charcoal capitalize">{product.color}</span>
                </div>
              )}
            </div>

            {/* Size Selection */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">Select Size</label>
                {product.size_chart_url && (
                  <a href={product.size_chart_url} target="_blank" rel="noreferrer" className="text-xs text-brand-red hover:underline">Size Chart</a>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`px-3.5 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                      selectedSize === s
                        ? 'bg-brand-deep-red text-white border-brand-deep-red'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-brand-deep-red'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Quantity</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <FiMinus size={16} />
                  </button>
                  <span className="px-5 py-2 font-semibold text-brand-charcoal min-w-[50px] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="px-3 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <FiPlus size={16} />
                  </button>
                </div>
                <span className="text-sm text-gray-400">Max {product.stock} units</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleAddToCart}
                disabled={!product.in_stock || cartLoading}
                className="flex-1 btn-outline flex items-center justify-center gap-2"
              >
                <FiShoppingCart /> {cartLoading ? 'Adding…' : 'Add to Cart'}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={!product.in_stock || cartLoading}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                Buy Now
              </button>
              <button
                onClick={handleWishlist}
                disabled={wishlistLoading}
                className="w-12 h-12 rounded-xl border-2 border-gray-200 flex items-center justify-center hover:border-brand-red transition-colors"
              >
                {inWishlist ? <FaHeart className="text-brand-red text-lg" /> : <FiHeart className="text-gray-500 text-lg" />}
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 border-t border-gray-100 pt-5">
              {[
                { icon: FiTruck, text: 'Free Delivery', sub: 'On orders ₹999+' },
                { icon: FiShield, text: 'Authentic', sub: '100% genuine' },
                { icon: FiRotateCcw, text: 'Easy Returns', sub: '7-day policy' },
              ].map(({ icon: Icon, text, sub }) => (
                <div key={text} className="text-center">
                  <Icon className="text-brand-gold text-xl mx-auto mb-1" />
                  <p className="text-xs font-semibold text-gray-700">{text}</p>
                  <p className="text-xs text-gray-400">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12 bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="flex border-b border-gray-100">
            {['description', 'details', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 text-sm font-semibold capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-brand-deep-red border-b-2 border-brand-deep-red'
                    : 'text-gray-500 hover:text-brand-charcoal'
                }`}
              >
                {tab} {tab === 'reviews' && reviews.length > 0 && `(${reviews.length})`}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'description' && (
              <div className="prose max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap">{product.description}</div>
            )}
            {activeTab === 'details' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  ['Fabric', product.fabric],
                  ['Occasion', product.occasion],
                  ['Color', product.color],
                  ['Category', product.category?.name],
                  ['Stock', product.stock],
                  ['SKU', `SHAAZ-${product.id}`],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="bg-brand-cream rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">{k}</p>
                    <p className="font-semibold text-brand-charcoal capitalize">{String(v)}</p>
                  </div>
                ))}
                {product.care_instructions && (
                  <div className="col-span-2 md:col-span-3 bg-brand-cream rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Care Instructions</p>
                    <p className="text-sm text-gray-600">{product.care_instructions}</p>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'reviews' && (
              <div>
                {/* Add Review */}
                {token && (
                  <form onSubmit={handleReviewSubmit} className="bg-brand-cream rounded-xl p-5 mb-6">
                    <h4 className="font-heading font-bold text-brand-charcoal mb-4">Write a Review</h4>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map((star) => (
                          <button key={star} type="button" onClick={() => setReviewForm(f => ({ ...f, rating: star }))}>
                            <FiStar className={`text-2xl ${star <= reviewForm.rating ? 'text-brand-gold fill-brand-gold' : 'text-gray-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={reviewForm.title}
                      onChange={(e) => setReviewForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="Review title"
                      required
                      className="input-field mb-3 text-sm"
                    />
                    <textarea
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                      placeholder="Share your experience with this product..."
                      rows={3}
                      required
                      className="input-field mb-4 text-sm resize-none"
                    />
                    <button type="submit" disabled={submittingReview} className="btn-primary text-sm">
                      {submittingReview ? 'Submitting…' : 'Submit Review'}
                    </button>
                  </form>
                )}

                {/* Reviews List */}
                {reviews.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">No reviews yet. Be the first to review!</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((r) => (
                      <div key={r.id} className="border border-gray-100 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-brand-deep-red flex items-center justify-center text-white text-sm font-bold">
                              {r.user_name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-brand-charcoal">{r.user_name}</p>
                              <div className="flex gap-0.5">
                                {Array(5).fill(0).map((_, i) => (
                                  <FiStar key={i} className={`text-xs ${i < r.rating ? 'text-brand-gold fill-brand-gold' : 'text-gray-200'}`} />
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">{formatDate(r.created_at)}</span>
                        </div>
                        <p className="font-medium text-sm text-brand-charcoal mb-1">{r.title}</p>
                        <p className="text-sm text-gray-600">{r.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            FREQUENTLY BOUGHT TOGETHER / COMPLETE THE BRIDAL LOOK
        ═══════════════════════════════════════════════════════════ */}
        {boughtTogether.length > 0 && (
          <div className="bg-white rounded-3xl shadow-card p-6 md:p-8 mb-10 border border-brand-gold/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">✨</span>
              <h3 className="font-heading text-2xl font-bold text-brand-charcoal">
                Frequently Bought Together
              </h3>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              Complete your bridal ensemble with these matching authentic pieces handpicked for this outfit.
            </p>

            <div className="flex flex-col lg:flex-row items-center gap-6">
              {/* Product cards row */}
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 flex-1">
                {/* Main Product Card */}
                <div className="w-36 sm:w-44 bg-brand-cream/60 rounded-2xl p-3 border border-brand-gold/40 text-center flex-shrink-0">
                  <div className="w-28 sm:w-36 h-36 sm:h-44 mx-auto rounded-xl overflow-hidden mb-2 shadow-sm">
                    <img
                      src={product.primary_image?.image_url ? getImageUrl(product.primary_image.image_url) : '/placeholder-bridal.svg'}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gold bg-brand-deep-red px-2 py-0.5 rounded-full inline-block mb-1">
                    This Item
                  </span>
                  <p className="text-xs font-semibold text-brand-charcoal line-clamp-1">{product.name}</p>
                  <p className="text-xs font-bold text-brand-deep-red mt-1">{formatPrice(product.effective_price)}</p>
                </div>

                {/* Plus Signs & Recommended Items */}
                {boughtTogether.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 sm:gap-4">
                    <span className="text-xl sm:text-2xl font-bold text-brand-gold select-none">+</span>
                    <div
                      onClick={() => setBundleChecked((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                      className={`w-36 sm:w-44 rounded-2xl p-3 border cursor-pointer transition-all text-center flex-shrink-0 ${
                        bundleChecked[item.id]
                          ? 'border-brand-gold bg-amber-50/70 shadow-sm'
                          : 'border-gray-200 bg-gray-50 opacity-60'
                      }`}
                    >
                      <div className="w-28 sm:w-36 h-36 sm:h-44 mx-auto rounded-xl overflow-hidden mb-2 shadow-sm relative">
                        <img
                          src={item.primary_image?.image_url ? getImageUrl(item.primary_image.image_url) : '/placeholder-bridal.svg'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1.5 left-1.5">
                          <input
                            type="checkbox"
                            checked={!!bundleChecked[item.id]}
                            onChange={() => {}}
                            className="w-4 h-4 accent-brand-deep-red rounded cursor-pointer"
                          />
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                        {item.category_name}
                      </span>
                      <p className="text-xs font-semibold text-brand-charcoal line-clamp-1">{item.name}</p>
                      <p className="text-xs font-bold text-brand-deep-red mt-1">{formatPrice(item.effective_price)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Box */}
              <div className="w-full lg:w-72 bg-gradient-to-br from-brand-cream to-amber-50 p-6 rounded-2xl border border-brand-gold/40 flex flex-col justify-center items-center text-center shadow-sm">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                  Bundle Price ({1 + selectedBundleItems.length} items)
                </span>
                <span className="font-heading text-3xl font-bold text-brand-deep-red my-2">
                  {formatPrice(bundleTotalPrice)}
                </span>
                <p className="text-xs text-green-700 font-semibold mb-4">
                  ✨ Perfect Match for Wedding & Reception
                </p>
                <button
                  type="button"
                  onClick={handleAddBundleToCart}
                  disabled={bundleLoading}
                  className="w-full bg-brand-deep-red hover:bg-red-800 text-white font-bold py-3.5 px-4 rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <FiShoppingCart />
                  {bundleLoading ? 'Adding Bundle…' : `Add ${1 + selectedBundleItems.length} Items to Cart`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            SIMILAR BRIDAL STYLES YOU MAY LIKE
        ═══════════════════════════════════════════════════════════ */}
        {similarProducts.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-heading text-2xl font-bold text-brand-charcoal">
                  Similar Bridal Styles
                </h3>
                <p className="text-gray-400 text-sm mt-0.5">Explore more handpicked pieces from {product.category?.name}</p>
              </div>
              <Link
                to={`/category/${product.category?.slug}`}
                className="text-brand-deep-red hover:text-brand-gold text-sm font-semibold transition-colors"
              >
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {similarProducts.map((p) => (
                <div key={p.id} className="group bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden flex flex-col">
                  <Link to={`/products/${p.slug}`} className="block relative h-56 overflow-hidden bg-brand-cream">
                    <img
                      src={p.primary_image?.image_url ? getImageUrl(p.primary_image.image_url) : '/placeholder-bridal.svg'}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-[11px] text-brand-gold font-semibold uppercase tracking-wider mb-1">{p.category_name}</p>
                      <Link to={`/products/${p.slug}`}>
                        <h4 className="font-heading text-sm font-semibold text-brand-charcoal line-clamp-1 hover:text-brand-deep-red transition-colors">
                          {p.name}
                        </h4>
                      </Link>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-bold text-brand-deep-red text-base">{formatPrice(p.effective_price)}</span>
                      <Link
                        to={`/products/${p.slug}`}
                        className="text-xs font-semibold bg-brand-cream hover:bg-brand-gold text-brand-charcoal px-3 py-1.5 rounded-lg transition-colors"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
