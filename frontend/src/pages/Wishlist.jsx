import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiHeart, FiShoppingCart, FiTrash2 } from 'react-icons/fi'
import { getWishlist, toggleWishlist } from '../api/products'
import { setWishlist, removeFromWishlist } from '../store/slices/wishlistSlice'
import { getImageUrl, formatPrice } from '../utils/helpers'
import { useCart } from '../hooks/useCart'
import toast from 'react-hot-toast'

export default function Wishlist() {
  const dispatch = useDispatch()
  const { items } = useSelector((s) => s.wishlist)
  const { token } = useSelector((s) => s.auth)
  const { addItemToCart } = useCart()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      getWishlist()
        .then((r) => {
          const list = r.data?.results || r.data
          if (Array.isArray(list) && list.length > 0) {
            dispatch(setWishlist(list))
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [dispatch, token])

  const handleRemove = async (productId) => {
    dispatch(removeFromWishlist(productId))
    toast.success('Removed from wishlist')
    if (token) {
      try {
        await toggleWishlist(productId)
      } catch (e) {
        console.warn('Backend remove error:', e)
      }
    }
  }

  const handleAddToCart = async (product) => {
    await addItemToCart(product.id, 1)
  }

  if (loading) return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center">
      <div className="animate-spin w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full" />
    </div>
  )

  if (items.length === 0) return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center py-20 text-center px-4">
      <FiHeart className="text-7xl text-gray-300 mb-5" />
      <h2 className="font-heading text-2xl font-bold text-gray-700 mb-2">Your Wishlist is Empty</h2>
      <p className="text-gray-400 mb-7">Save your favourite items to come back later</p>
      <Link to="/products" className="btn-primary">Start Shopping</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading text-3xl font-bold text-brand-charcoal">
            My Wishlist ({items.length})
          </h1>
          <Link to="/products" className="text-sm font-semibold text-brand-deep-red hover:underline">
            + Explore More
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {items.map((item) => {
            const p = item.product || item
            if (!p || !p.id) return null

            const effectivePrice = p.effective_price || p.price
            const originalPrice = p.discount_price ? p.price : null
            const imgPath = p.primary_image?.image_url || p.image || '/placeholder-bridal.svg'

            return (
              <div key={item.id || p.id} className="bg-white rounded-2xl shadow-card overflow-hidden group hover:shadow-card-hover transition-all">
                <div className="relative">
                  <Link to={`/products/${p.slug}`}>
                    <img
                      src={getImageUrl(imgPath)}
                      alt={p.name}
                      className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.src = '/placeholder-bridal.svg' }}
                    />
                  </Link>
                  <button
                    onClick={() => handleRemove(p.id)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors"
                    title="Remove from wishlist"
                  >
                    <FiTrash2 size={15} />
                  </button>
                </div>
                <div className="p-4">
                  <Link to={`/products/${p.slug}`}>
                    <h3 className="font-heading font-semibold text-sm text-brand-charcoal hover:text-brand-deep-red transition-colors line-clamp-2 mb-2 leading-snug">
                      {p.name}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-brand-deep-red font-bold text-sm">
                      {formatPrice(effectivePrice)}
                    </span>
                    {originalPrice && (
                      <span className="text-gray-400 line-through text-xs">
                        {formatPrice(originalPrice)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddToCart(p)}
                    disabled={p.in_stock === false || p.stock === 0}
                    className="w-full btn-primary text-xs flex items-center justify-center gap-1.5 py-2.5"
                  >
                    <FiShoppingCart size={14} />
                    {p.in_stock === false || p.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
